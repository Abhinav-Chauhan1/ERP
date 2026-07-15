"use server";

import { withSchoolAuthAction } from "@/lib/auth/security-wrapper";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { PermissionAction, MiscFeeCategory, PaymentMethod, DiscountType, PaymentStatus } from "@prisma/client";
import { hasPermission } from "@/lib/utils/permissions";
import { formatFullName } from "@/lib/utils";
import { calculateDiscountAmount, calculateNetPayable, getFeeAmountsForClass } from "@/lib/utils/payment-helpers";
import { syncFeeInvoiceSummary } from "@/lib/services/fee-invoice-service";

// Helper to check permission and throw if denied — mirrors feeDiscountActions.ts
async function checkPermission(resource: string, action: PermissionAction, errorMessage?: string) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Unauthorized: You must be logged in");
  }

  const allowed = await hasPermission(userId, resource, action);
  if (!allowed) {
    throw new Error(errorMessage || `Permission denied: Cannot ${action} ${resource}`);
  }

  return userId;
}

function computeMiscFeeStatus(netAmount: number, paidAmount: number): PaymentStatus {
  if (netAmount > 0 && paidAmount >= netAmount) return "COMPLETED";
  if (paidAmount > 0) return "PARTIAL";
  return "PENDING";
}

interface DiscountFields {
  discountType?: DiscountType | null;
  discountValue?: number | null;
}

function computeMiscFeeAmounts(amount: number, discount: DiscountFields, paidAmount: number) {
  const grossAmount = Math.max(amount, 0);
  const discountInput =
    discount.discountType && discount.discountValue
      ? { discountType: discount.discountType, value: discount.discountValue }
      : null;
  const discountAmount = calculateDiscountAmount(grossAmount, discountInput);
  const netAmount = calculateNetPayable(grossAmount, discountInput);
  const balance = Math.max(netAmount - paidAmount, 0);
  const status = computeMiscFeeStatus(netAmount, paidAmount);
  return { amount: grossAmount, discountAmount, netAmount, balance, status };
}

// Resolves the academic year of a student's current active enrollment — mirrors
// the lookup in feeDiscountActions.ts's getStudentFeeDiscountSummary, used so the
// single-student Books/Transport fee cards don't need an academicYearId prop.
export const getCurrentStudentAcademicYear = withSchoolAuthAction(
  async (schoolId: string, userId: string, userRole: string, studentId: string) => {
    try {
      await checkPermission("FEE_DISCOUNT", "READ", "You do not have permission to view fees");

      const student = await db.student.findFirst({
        where: { id: studentId, schoolId },
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            orderBy: { enrollDate: "desc" },
            take: 1,
            include: { class: { include: { academicYear: true } } },
          },
        },
      });

      const academicYear = student?.enrollments[0]?.class?.academicYear ?? null;
      return { success: true, data: academicYear ? { id: academicYear.id, name: academicYear.name } : null };
    } catch (error) {
      console.error("Error fetching student's current academic year:", error);
      return { success: false, error: error instanceof Error ? error.message : "Failed to fetch academic year" };
    }
  }
);

// Get a student's Books/Transport fee row for one academic year (student detail cards)
export const getMiscFee = withSchoolAuthAction(
  async (
    schoolId: string,
    userId: string,
    userRole: string,
    studentId: string,
    academicYearId: string,
    category: MiscFeeCategory
  ) => {
    try {
      await checkPermission("FEE_DISCOUNT", "READ", "You do not have permission to view fees");

      const row = await db.miscFeePayment.findFirst({
        where: { studentId, academicYearId, category, schoolId },
      });
      return { success: true, data: row };
    } catch (error) {
      console.error("Error fetching misc fee:", error);
      return { success: false, error: error instanceof Error ? error.message : "Failed to fetch fee" };
    }
  }
);

export interface UpsertMiscFeeInput {
  studentId: string;
  academicYearId: string;
  category: MiscFeeCategory;
  amount: number;
  discountType?: DiscountType | null;
  discountValue?: number | null;
  dueDate?: Date | null;
  remarks?: string | null;
}

// Create or update a student's Books/Transport fee (amount + discount) for a year
export const upsertMiscFee = withSchoolAuthAction(
  async (schoolId: string, userId: string, userRole: string, input: UpsertMiscFeeInput) => {
    try {
      await checkPermission("FEE_DISCOUNT", "UPDATE", "You do not have permission to manage fees");

      const student = await db.student.findFirst({ where: { id: input.studentId, schoolId } });
      if (!student) {
        return { success: false, error: "Student not found" };
      }

      const academicYear = await db.academicYear.findFirst({ where: { id: input.academicYearId, schoolId } });
      if (!academicYear) {
        return { success: false, error: "Academic year not found" };
      }

      const existing = await db.miscFeePayment.findUnique({
        where: {
          studentId_academicYearId_category: {
            studentId: input.studentId,
            academicYearId: input.academicYearId,
            category: input.category,
          },
        },
      });

      const computed = computeMiscFeeAmounts(input.amount, input, existing?.paidAmount ?? 0);
      const data = {
        amount: computed.amount,
        discountType: input.discountType ?? null,
        discountValue: input.discountValue ?? null,
        discountAmount: computed.discountAmount,
        netAmount: computed.netAmount,
        balance: computed.balance,
        status: computed.status,
        dueDate: input.dueDate ?? null,
        remarks: input.remarks ?? null,
      };

      const row = await db.miscFeePayment.upsert({
        where: {
          studentId_academicYearId_category: {
            studentId: input.studentId,
            academicYearId: input.academicYearId,
            category: input.category,
          },
        },
        create: {
          studentId: input.studentId,
          academicYearId: input.academicYearId,
          category: input.category,
          schoolId,
          ...data,
        },
        update: data,
      });

      revalidatePath(`/admin/users/students/${input.studentId}`);
      return { success: true, data: row };
    } catch (error) {
      console.error("Error saving misc fee:", error);
      return { success: false, error: error instanceof Error ? error.message : "Failed to save fee" };
    }
  }
);

export interface RecordMiscFeePaymentInput {
  paidAmount: number;
  paymentDate?: Date;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  receiptNumber?: string;
}

// Record a payment against a Books/Transport fee (increments paidAmount)
export const recordMiscFeePayment = withSchoolAuthAction(
  async (schoolId: string, userId: string, userRole: string, id: string, input: RecordMiscFeePaymentInput) => {
    try {
      await checkPermission("FEE_DISCOUNT", "UPDATE", "You do not have permission to record fee payments");

      const existing = await db.miscFeePayment.findFirst({ where: { id, schoolId } });
      if (!existing) {
        return { success: false, error: "Fee record not found" };
      }

      const paidAmount = Math.max(existing.paidAmount + input.paidAmount, 0);
      const balance = Math.max(existing.netAmount - paidAmount, 0);
      const status = computeMiscFeeStatus(existing.netAmount, paidAmount);

      const row = await db.miscFeePayment.update({
        where: { id },
        data: {
          paidAmount,
          balance,
          status,
          paymentDate: input.paymentDate ?? new Date(),
          paymentMethod: input.paymentMethod ?? existing.paymentMethod ?? undefined,
          transactionId: input.transactionId ?? existing.transactionId ?? undefined,
          receiptNumber: input.receiptNumber ?? existing.receiptNumber ?? undefined,
        },
      });

      revalidatePath(`/admin/users/students/${existing.studentId}`);
      return { success: true, data: row };
    } catch (error) {
      console.error("Error recording misc fee payment:", error);
      return { success: false, error: error instanceof Error ? error.message : "Failed to record payment" };
    }
  }
);

export interface BulkDiscountFeeRow {
  studentId: string;
  rollNumber: string | null;
  name: string;
  sectionName: string | null;
  normalFee: {
    feeStructureId: string | null;
    feeStructureName: string | null;
    grossTotal: number;
    value: number | null;
  };
  booksFee: {
    amount: number;
    discountValue: number | null;
  };
  transportFee: {
    amount: number;
    discountValue: number | null;
  };
}

// Roster for a whole class (every section), merged with each student's current
// Normal Fee discount and Books/Transport fee rows — feeds the bulk discount grid.
export const getStudentsForBulkDiscount = withSchoolAuthAction(
  async (schoolId: string, userId: string, userRole: string, academicYearId: string, classId: string) => {
    try {
      await checkPermission("FEE_DISCOUNT", "READ", "You do not have permission to view fee discounts");

      const [academicClass, enrollments] = await Promise.all([
        db.class.findFirst({ where: { id: classId, schoolId, academicYearId } }),
        db.classEnrollment.findMany({
          where: { schoolId, classId, status: "ACTIVE" },
          include: {
            student: { include: { user: { select: { firstName: true, lastName: true } } } },
            section: { select: { name: true } },
          },
          orderBy: [{ section: { name: "asc" } }, { rollNumber: "asc" }],
        }),
      ]);

      if (!academicClass) {
        return { success: false, error: "Class not found for the selected academic year" };
      }

      if (enrollments.length === 0) {
        return { success: true, data: { feeStructure: null as { id: string; name: string } | null, rows: [] as BulkDiscountFeeRow[] } };
      }

      const studentIds = enrollments.map((e) => e.studentId);

      const feeStructure = await db.feeStructure.findFirst({
        where: {
          academicYearId,
          isActive: true,
          OR: [
            { classes: { some: { classId } } },
            { AND: [{ classes: { none: {} } }, { applicableClasses: { contains: academicClass.name } }] },
          ],
        },
        include: { items: { include: { feeType: true } } },
      });

      let grossTotal = 0;
      if (feeStructure) {
        const feeTypeIds = feeStructure.items.map((item) => item.feeTypeId);
        const amountMap = await getFeeAmountsForClass(feeTypeIds, classId, schoolId);
        for (const item of feeStructure.items) {
          grossTotal += amountMap.get(item.feeTypeId) ?? item.feeType.amount;
        }
      }

      const [discounts, miscFees] = await Promise.all([
        feeStructure
          ? db.feeDiscount.findMany({
              where: { studentId: { in: studentIds }, feeStructureId: feeStructure.id, isActive: true },
            })
          : Promise.resolve([]),
        db.miscFeePayment.findMany({ where: { studentId: { in: studentIds }, academicYearId } }),
      ]);

      const discountMap = new Map(discounts.map((d) => [d.studentId, d]));
      const miscMap = new Map<string, Partial<Record<MiscFeeCategory, (typeof miscFees)[number]>>>();
      for (const m of miscFees) {
        const forStudent = miscMap.get(m.studentId) ?? {};
        forStudent[m.category] = m;
        miscMap.set(m.studentId, forStudent);
      }

      const rows: BulkDiscountFeeRow[] = enrollments.map((e) => {
        const discount = discountMap.get(e.studentId);
        const misc = miscMap.get(e.studentId) ?? {};
        return {
          studentId: e.studentId,
          rollNumber: e.rollNumber,
          name: formatFullName(e.student.user.firstName, e.student.user.lastName),
          sectionName: e.section?.name ?? null,
          normalFee: {
            feeStructureId: feeStructure?.id ?? null,
            feeStructureName: feeStructure?.name ?? null,
            grossTotal,
            value: discount?.value ?? null,
          },
          booksFee: {
            amount: misc.BOOKS?.amount ?? 0,
            discountValue: misc.BOOKS?.discountValue ?? null,
          },
          transportFee: {
            amount: misc.TRANSPORT?.amount ?? 0,
            discountValue: misc.TRANSPORT?.discountValue ?? null,
          },
        };
      });

      return {
        success: true,
        data: {
          feeStructure: feeStructure ? { id: feeStructure.id, name: feeStructure.name } : null,
          rows,
        },
      };
    } catch (error) {
      console.error("Error fetching students for bulk discount:", error);
      return { success: false, error: error instanceof Error ? error.message : "Failed to fetch students" };
    }
  }
);

export interface BulkDiscountSaveRow {
  studentId: string;
  normalFee: { value: number | null };
  booksFee: { amount: number; discountValue: number | null };
  transportFee: { amount: number; discountValue: number | null };
}

// Bulk-saves Normal Fee discounts + Books/Transport fees for every row in one go,
// applying a single discount type (flat/percentage) across the whole class rather
// than per student/fee-type. Each student's writes are grouped in their own
// transaction so one bad row doesn't roll back the rest of the class — mirrors
// bulkImportActions.ts's per-row-isolated, whole-batch-reported result shape.
export const bulkSaveClassDiscounts = withSchoolAuthAction(
  async (
    schoolId: string,
    userId: string,
    userRole: string,
    academicYearId: string,
    classId: string,
    discountType: DiscountType,
    rows: BulkDiscountSaveRow[]
  ) => {
    try {
      await checkPermission("FEE_DISCOUNT", "UPDATE", "You do not have permission to manage fee discounts");

      const academicClass = await db.class.findFirst({ where: { id: classId, schoolId, academicYearId } });
      if (!academicClass) {
        return { success: false, error: "Class not found for the selected academic year" };
      }

      const feeStructure = await db.feeStructure.findFirst({
        where: {
          academicYearId,
          isActive: true,
          OR: [
            { classes: { some: { classId } } },
            { AND: [{ classes: { none: {} } }, { applicableClasses: { contains: academicClass.name } }] },
          ],
        },
      });

      const grantingUser = await db.user.findUnique({ where: { id: userId } });
      const grantedByName = grantingUser ? formatFullName(grantingUser.firstName, grantingUser.lastName) : null;

      const validStudentIds = new Set(
        (
          await db.classEnrollment.findMany({
            where: { schoolId, classId, status: "ACTIVE", studentId: { in: rows.map((r) => r.studentId) } },
            select: { studentId: true },
          })
        ).map((e) => e.studentId)
      );

      const results: { studentId: string; success: boolean; error?: string }[] = [];

      for (const row of rows) {
        try {
          if (!validStudentIds.has(row.studentId)) {
            throw new Error("Student is not enrolled in the selected class");
          }

          await db.$transaction(async (tx) => {
            if (feeStructure) {
              if (row.normalFee.value) {
                await tx.feeDiscount.upsert({
                  where: {
                    studentId_feeStructureId: { studentId: row.studentId, feeStructureId: feeStructure.id },
                  },
                  create: {
                    studentId: row.studentId,
                    feeStructureId: feeStructure.id,
                    discountType,
                    value: row.normalFee.value,
                    isActive: true,
                    grantedBy: userId,
                    grantedByName,
                    schoolId,
                  },
                  update: {
                    discountType,
                    value: row.normalFee.value,
                    isActive: true,
                    grantedBy: userId,
                    grantedByName,
                  },
                });
              } else {
                await tx.feeDiscount.updateMany({
                  where: { studentId: row.studentId, feeStructureId: feeStructure.id },
                  data: { isActive: false },
                });
              }
            }

            const miscFeeInputs: [MiscFeeCategory, BulkDiscountSaveRow["booksFee"]][] = [
              ["BOOKS", row.booksFee],
              ["TRANSPORT", row.transportFee],
            ];

            for (const [category, feeInput] of miscFeeInputs) {
              const existing = await tx.miscFeePayment.findUnique({
                where: {
                  studentId_academicYearId_category: { studentId: row.studentId, academicYearId, category },
                },
              });
              const computed = computeMiscFeeAmounts(
                feeInput.amount,
                { discountType, discountValue: feeInput.discountValue },
                existing?.paidAmount ?? 0
              );
              const data = {
                amount: computed.amount,
                discountType: feeInput.discountValue ? discountType : null,
                discountValue: feeInput.discountValue ?? null,
                discountAmount: computed.discountAmount,
                netAmount: computed.netAmount,
                balance: computed.balance,
                status: computed.status,
              };

              await tx.miscFeePayment.upsert({
                where: {
                  studentId_academicYearId_category: { studentId: row.studentId, academicYearId, category },
                },
                create: { studentId: row.studentId, academicYearId, category, schoolId, ...data },
                update: data,
              });
            }
          });

          if (feeStructure) {
            await syncFeeInvoiceSummary(row.studentId);
          }

          revalidatePath(`/admin/users/students/${row.studentId}`);
          results.push({ studentId: row.studentId, success: true });
        } catch (rowError) {
          results.push({
            studentId: row.studentId,
            success: false,
            error: rowError instanceof Error ? rowError.message : "Failed to save",
          });
        }
      }

      revalidatePath(`/admin/finance/discounts`);

      return {
        success: true,
        data: {
          summary: {
            total: results.length,
            succeeded: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
          },
          results,
        },
      };
    } catch (error) {
      console.error("Error bulk-saving class discounts:", error);
      return { success: false, error: error instanceof Error ? error.message : "Failed to save discounts" };
    }
  }
);
