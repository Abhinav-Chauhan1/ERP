"use server";

import { withSchoolAuthAction } from "@/lib/auth/security-wrapper";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { PermissionAction } from "@prisma/client";
import { hasPermissionCached } from "@/lib/utils/permissions";
import { revalidatePath } from "next/cache";
import { feeStructureService } from "@/lib/services/fee-structure-service";
import { formatFullName } from "@/lib/utils";
import { getFeeFrequencyMultiplier } from "@/lib/utils/fee-frequency";

async function checkPermission(resource: string, action: PermissionAction, errorMessage?: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized: You must be logged in");
  const allowed = await hasPermissionCached(userId, resource, action);
  if (!allowed) throw new Error(errorMessage || `Permission denied: Cannot ${action} ${resource}`);
  return userId;
}

export interface StudentFeeAmountColumn {
  feeTypeId: string;
  feeTypeName: string;
}

export interface StudentFeeAmountRow {
  studentId: string;
  studentName: string;
  rollNumber: string | null;
  amounts: Record<string, { amount: number; isCustom: boolean }>; // keyed by feeTypeId
}

// Fee amounts for every active student in a class, one column per fee type
// applicable to that class's current fee structure. Amounts reflect the same
// student-override > class-override > default precedence as getFeeAmountsForClass.
export const getStudentFeeAmountsForClass = withSchoolAuthAction(
  async (schoolId: string, _userId: string, _userRole: string, classId: string) => {
    try {
      const structures = await feeStructureService.getFeeStructuresForClass(classId, schoolId);
      const structure = structures.find((s) => s.isActive) ?? structures[0];
      if (!structure) {
        return { success: true, data: { columns: [] as StudentFeeAmountColumn[], rows: [] as StudentFeeAmountRow[] } };
      }

      const columns: StudentFeeAmountColumn[] = structure.items.map((item) => ({
        feeTypeId: item.feeTypeId,
        feeTypeName: item.feeType.name,
      }));
      const feeTypeIds = columns.map((c) => c.feeTypeId);

      const [enrollments, feeTypes, classAmounts] = await Promise.all([
        db.classEnrollment.findMany({
          where: { schoolId, classId, status: "ACTIVE" },
          include: { student: { include: { user: { select: { firstName: true, lastName: true, name: true } } } } },
          orderBy: { student: { user: { name: "asc" } } },
        }),
        db.feeType.findMany({ where: { id: { in: feeTypeIds }, schoolId } }),
        db.feeTypeClassAmount.findMany({ where: { feeTypeId: { in: feeTypeIds }, classId, schoolId } }),
      ]);

      const studentIds = enrollments.map((e) => e.studentId);
      const studentAmounts = studentIds.length
        ? await db.feeTypeStudentAmount.findMany({
            where: { feeTypeId: { in: feeTypeIds }, studentId: { in: studentIds }, schoolId },
          })
        : [];

      const feeTypeDefaultMap = new Map(feeTypes.map((ft) => [ft.id, ft.amount]));
      const feeTypeMultiplierMap = new Map(feeTypes.map((ft) => [ft.id, getFeeFrequencyMultiplier(ft.frequency)]));
      const classAmountMap = new Map(classAmounts.map((ca) => [ca.feeTypeId, ca.amount]));
      const studentAmountMap = new Map(studentAmounts.map((sa) => [`${sa.studentId}:${sa.feeTypeId}`, sa.amount]));

      // Stored amounts are per-billing-occurrence (e.g. a Monthly tuition rate);
      // this page shows the annual total to match the Payments/Invoice views and
      // the school's own fee register, so multiply by the frequency here and
      // divide back out in setStudentFeeAmounts when a new value is saved.
      const rows: StudentFeeAmountRow[] = enrollments.map((e) => {
        const amounts: StudentFeeAmountRow["amounts"] = {};
        for (const feeTypeId of feeTypeIds) {
          const multiplier = feeTypeMultiplierMap.get(feeTypeId) ?? 1;
          const studentOverride = studentAmountMap.get(`${e.studentId}:${feeTypeId}`);
          const classDefault = classAmountMap.get(feeTypeId) ?? feeTypeDefaultMap.get(feeTypeId) ?? 0;
          amounts[feeTypeId] = studentOverride !== undefined
            ? { amount: Math.round(studentOverride * multiplier), isCustom: true }
            : { amount: Math.round(classDefault * multiplier), isCustom: false };
        }
        return {
          studentId: e.studentId,
          studentName: e.student.user.name || formatFullName(e.student.user.firstName, e.student.user.lastName),
          rollNumber: e.rollNumber,
          amounts,
        };
      });

      return { success: true, data: { columns, rows } };
    } catch (error) {
      console.error("Error fetching student fee amounts:", error);
      return { success: false, error: "Failed to fetch student fee amounts" };
    }
  }
);

// Batched upsert of per-student fee-type amounts. Incoming `amount`s are
// annual totals (matching what the page displays); they're converted back to
// the per-billing-occurrence base rate before storage, consistent with how
// FeeType/FeeTypeClassAmount amounts are stored elsewhere. Setting an amount
// equal to the resolved class default removes the override instead of storing
// a redundant duplicate, so it cleanly falls back to future class-default changes.
export const setStudentFeeAmounts = withSchoolAuthAction(
  async (
    schoolId: string,
    _userId: string,
    _userRole: string,
    entries: { studentId: string; feeTypeId: string; amount: number }[]
  ) => {
    try {
      await checkPermission("FEE", "UPDATE", "You do not have permission to update student fees");

      const feeTypeIds = Array.from(new Set(entries.map((e) => e.feeTypeId)));
      const classIdsByStudent = await db.classEnrollment.findMany({
        where: { schoolId, studentId: { in: entries.map((e) => e.studentId) }, status: "ACTIVE" },
        select: { studentId: true, classId: true },
      });
      const classIdByStudent = new Map(classIdsByStudent.map((c) => [c.studentId, c.classId]));

      const [feeTypes, classAmounts] = await Promise.all([
        db.feeType.findMany({ where: { id: { in: feeTypeIds }, schoolId } }),
        db.feeTypeClassAmount.findMany({ where: { feeTypeId: { in: feeTypeIds }, schoolId } }),
      ]);
      const feeTypeDefaultMap = new Map(feeTypes.map((ft) => [ft.id, ft.amount]));
      const feeTypeMultiplierMap = new Map(feeTypes.map((ft) => [ft.id, getFeeFrequencyMultiplier(ft.frequency)]));
      const classAmountMap = new Map(classAmounts.map((ca) => [`${ca.classId}:${ca.feeTypeId}`, ca.amount]));

      await db.$transaction(
        entries.map((entry) => {
          const multiplier = feeTypeMultiplierMap.get(entry.feeTypeId) ?? 1;
          const classId = classIdByStudent.get(entry.studentId);
          const classAmt = classId ? classAmountMap.get(`${classId}:${entry.feeTypeId}`) : undefined;
          const classDefaultBase = classAmt ?? feeTypeDefaultMap.get(entry.feeTypeId) ?? 0;
          const newBase = entry.amount / multiplier;

          if (Math.abs(newBase - classDefaultBase) < 0.01) {
            return db.feeTypeStudentAmount.deleteMany({
              where: { studentId: entry.studentId, feeTypeId: entry.feeTypeId, schoolId },
            });
          }

          return db.feeTypeStudentAmount.upsert({
            where: { feeTypeId_studentId: { feeTypeId: entry.feeTypeId, studentId: entry.studentId } },
            update: { amount: newBase },
            create: { feeTypeId: entry.feeTypeId, studentId: entry.studentId, amount: newBase, schoolId },
          });
        })
      );

      revalidatePath("/admin/finance/student-fees");
      return { success: true };
    } catch (error) {
      console.error("Error setting student fee amounts:", error);
      return { success: false, error: "Failed to save fee amounts" };
    }
  }
);
