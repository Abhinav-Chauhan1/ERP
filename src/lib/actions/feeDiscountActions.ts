"use server";

import { withSchoolAuthAction } from "@/lib/auth/security-wrapper";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { PermissionAction } from "@prisma/client";
import { hasPermission } from "@/lib/utils/permissions";
import { formatFullName } from "@/lib/utils";
import {
  calculateDiscountAmount,
  calculateNetPayable,
  getFeeAmountsForClass,
  calculateAccruedFeeTotal,
} from "@/lib/utils/payment-helpers";
import { syncFeeInvoiceSummary } from "@/lib/services/fee-invoice-service";
import {
  feeDiscountSchema,
  updateFeeDiscountSchema,
  type FeeDiscountFormValues,
  type UpdateFeeDiscountFormValues,
} from "@/lib/schemaValidation/feeDiscountSchemaValidation";

// Helper to check permission and throw if denied
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

// Create a new fee discount for a student
export const createFeeDiscount = withSchoolAuthAction(
  async (schoolId: string, userId: string, userRole: string, data: FeeDiscountFormValues) => {
    try {
      await checkPermission("FEE_DISCOUNT", "CREATE", "You do not have permission to grant fee discounts");

      const validated = feeDiscountSchema.parse(data);

      const [student, feeStructure, grantingUser] = await Promise.all([
        db.student.findFirst({ where: { id: validated.studentId, schoolId } }),
        db.feeStructure.findFirst({ where: { id: validated.feeStructureId, schoolId } }),
        db.user.findUnique({ where: { id: userId } }),
      ]);

      if (!student) {
        return { success: false, error: "Student not found" };
      }
      if (!feeStructure) {
        return { success: false, error: "Fee structure not found" };
      }

      const discount = await db.feeDiscount.create({
        data: {
          studentId: validated.studentId,
          feeStructureId: validated.feeStructureId,
          discountType: validated.discountType,
          value: validated.value,
          reason: validated.reason || null,
          grantedBy: userId,
          grantedByName: grantingUser ? formatFullName(grantingUser.firstName, grantingUser.lastName) : null,
          schoolId,
        },
      });

      await syncFeeInvoiceSummary(validated.studentId);

      revalidatePath(`/admin/users/students/${validated.studentId}`);
      return { success: true, data: discount };
    } catch (error) {
      console.error("Error creating fee discount:", error);
      return { success: false, error: error instanceof Error ? error.message : "Failed to create fee discount" };
    }
  }
);

// Update an existing fee discount
export const updateFeeDiscount = withSchoolAuthAction(
  async (schoolId: string, userId: string, userRole: string, data: UpdateFeeDiscountFormValues) => {
    try {
      await checkPermission("FEE_DISCOUNT", "UPDATE", "You do not have permission to update fee discounts");

      const validated = updateFeeDiscountSchema.parse(data);

      const existing = await db.feeDiscount.findFirst({ where: { id: validated.id, schoolId } });
      if (!existing) {
        return { success: false, error: "Fee discount not found" };
      }

      const grantingUser = await db.user.findUnique({ where: { id: userId } });

      const discount = await db.feeDiscount.update({
        where: { id: validated.id },
        data: {
          discountType: validated.discountType,
          value: validated.value,
          reason: validated.reason || null,
          isActive: true,
          grantedBy: userId,
          grantedByName: grantingUser ? formatFullName(grantingUser.firstName, grantingUser.lastName) : null,
        },
      });

      await syncFeeInvoiceSummary(existing.studentId);

      revalidatePath(`/admin/users/students/${existing.studentId}`);
      return { success: true, data: discount };
    } catch (error) {
      console.error("Error updating fee discount:", error);
      return { success: false, error: error instanceof Error ? error.message : "Failed to update fee discount" };
    }
  }
);

// Deactivate a fee discount (soft-delete, preserves audit trail)
export const deactivateFeeDiscount = withSchoolAuthAction(
  async (schoolId: string, userId: string, userRole: string, id: string) => {
    try {
      await checkPermission("FEE_DISCOUNT", "UPDATE", "You do not have permission to deactivate fee discounts");

      const existing = await db.feeDiscount.findFirst({ where: { id, schoolId } });
      if (!existing) {
        return { success: false, error: "Fee discount not found" };
      }

      await db.feeDiscount.update({ where: { id }, data: { isActive: false } });

      await syncFeeInvoiceSummary(existing.studentId);

      revalidatePath(`/admin/users/students/${existing.studentId}`);
      return { success: true };
    } catch (error) {
      console.error("Error deactivating fee discount:", error);
      return { success: false, error: error instanceof Error ? error.message : "Failed to deactivate fee discount" };
    }
  }
);

// Get the discount row (if any) for a student's fee structure
export const getFeeDiscountByStudent = withSchoolAuthAction(
  async (schoolId: string, userId: string, userRole: string, studentId: string, feeStructureId: string) => {
    try {
      await checkPermission("FEE_DISCOUNT", "READ", "You do not have permission to view fee discounts");

      const discount = await db.feeDiscount.findFirst({
        where: { studentId, feeStructureId, schoolId },
      });
      return { success: true, data: discount };
    } catch (error) {
      console.error("Error fetching fee discount:", error);
      return { success: false, error: error instanceof Error ? error.message : "Failed to fetch fee discount" };
    }
  }
);

// Get a student's fee summary (gross/discount/net/paid/balance) for their active fee structure
export const getStudentFeeDiscountSummary = withSchoolAuthAction(
  async (schoolId: string, userId: string, userRole: string, studentId: string) => {
    try {
      await checkPermission("FEE_DISCOUNT", "READ", "You do not have permission to view fee discounts");

      const student = await db.student.findFirst({
        where: { id: studentId, schoolId },
        include: {
          enrollments: {
            orderBy: { enrollDate: "desc" },
            take: 1,
            include: { class: { include: { academicYear: true } } },
          },
        },
      });

      if (!student) {
        return { success: false, error: "Student not found" };
      }

      const currentEnrollment = student.enrollments[0];
      const classId = currentEnrollment?.class?.id;
      const academicYearId = currentEnrollment?.class?.academicYear?.id;

      const feeStructure = await db.feeStructure.findFirst({
        where: {
          academicYearId,
          isActive: true,
          OR: [
            { classes: { some: { classId } } },
            {
              AND: [
                { classes: { none: {} } },
                { applicableClasses: { contains: currentEnrollment?.class?.name } },
              ],
            },
          ],
        },
        include: { items: { include: { feeType: true } } },
      });

      if (!feeStructure) {
        return { success: true, data: null };
      }

      const feeTypeIds = feeStructure.items.map((item) => item.feeTypeId);
      const amountMap = await getFeeAmountsForClass(feeTypeIds, classId, schoolId);

      let grossTotal = 0;
      for (const item of feeStructure.items) {
        grossTotal += amountMap.get(item.feeTypeId) ?? item.feeType.amount;
      }

      const [discountRow, feePayments] = await Promise.all([
        db.feeDiscount.findUnique({
          where: { studentId_feeStructureId: { studentId, feeStructureId: feeStructure.id } },
        }),
        db.feePayment.findMany({ where: { studentId, feeStructureId: feeStructure.id } }),
      ]);

      const activeDiscount =
        discountRow && discountRow.isActive
          ? { discountType: discountRow.discountType, value: discountRow.value }
          : null;

      const paidAmount = feePayments.reduce((sum, payment) => sum + payment.paidAmount, 0);
      const discountAmount = calculateDiscountAmount(grossTotal, activeDiscount);
      const netTotal = calculateNetPayable(grossTotal, activeDiscount);
      const netBalance = Math.max(netTotal - paidAmount, 0);

      // How much should have accrued by now (mid-session onboarding / ongoing
      // Monthly-Quarterly-Semi-Annual fees), vs the full netTotal/netBalance above.
      let overdueAmount = 0;
      if (currentEnrollment) {
        const now = new Date();
        const effectiveStartDate = new Date(
          Math.max(feeStructure.validFrom.getTime(), currentEnrollment.enrollDate.getTime())
        );
        const asOfDate = feeStructure.validTo && feeStructure.validTo < now ? feeStructure.validTo : now;
        const accrualItems = feeStructure.items.map((item) => ({
          annualizedAmount: amountMap.get(item.feeTypeId) ?? item.feeType.amount,
          frequency: item.feeType.frequency,
          dueDate: item.dueDate,
        }));
        const accruedGrossTotal = calculateAccruedFeeTotal(accrualItems, effectiveStartDate, asOfDate);
        const netAccruedTotal = calculateNetPayable(accruedGrossTotal, activeDiscount);
        overdueAmount = Math.max(netAccruedTotal - paidAmount, 0);
      }

      return {
        success: true,
        data: {
          feeStructureId: feeStructure.id,
          grossTotal,
          discountAmount,
          netTotal,
          paidAmount,
          netBalance,
          overdueAmount,
          discount:
            discountRow && discountRow.isActive
              ? {
                  id: discountRow.id,
                  discountType: discountRow.discountType,
                  value: discountRow.value,
                  reason: discountRow.reason,
                }
              : null,
        },
      };
    } catch (error) {
      console.error("Error fetching student fee discount summary:", error);
      return { success: false, error: error instanceof Error ? error.message : "Failed to fetch fee summary" };
    }
  }
);
