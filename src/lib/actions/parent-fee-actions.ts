"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { UserRole, PaymentStatus, PaymentMethod } from "@prisma/client";
import {
  feeOverviewSchema,
  paymentHistoryFilterSchema,
  createPaymentSchema,
  verifyPaymentSchema,
  downloadReceiptSchema,
  type FeeOverviewInput,
  type PaymentHistoryFilter,
  type CreatePaymentInput,
  type VerifyPaymentInput,
  type DownloadReceiptInput,
} from "@/lib/schemaValidation/parent-fee-schemas";
import { sanitizeText, sanitizeAlphanumeric } from "@/lib/utils/input-sanitization";
import { verifyCsrfToken } from "@/lib/utils/csrf";
import { checkRateLimit, RateLimitPresets } from "@/lib/utils/rate-limit";
import { revalidatePath } from "next/cache";
import { getReceiptHTML } from "@/lib/utils/pdf-generator";
import { requireSchoolAccess } from "@/lib/auth/tenant";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParentContext {
  id: string;
  schoolId: string;
  userId: string;
  [key: string]: unknown;
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getCurrentParent(): Promise<ParentContext | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const { schoolId } = await requireSchoolAccess();
  if (!schoolId) return null;

  const dbUser = await db.user.findFirst({
    where: {
      id: clerkUser.id,
      parent: { schoolId }
    },
    include: { parent: true }
  });

  if (!dbUser || dbUser.role !== UserRole.PARENT || !dbUser.parent) {
    return null;
  }

  return { ...dbUser.parent, schoolId };
}

// ─── Relationship check ───────────────────────────────────────────────────────

async function verifyParentChildRelationship(
  parentId: string,
  childId: string,
  schoolId: string
): Promise<boolean> {
  const relationship = await db.studentParent.findFirst({
    where: { parentId, studentId: childId, schoolId }
  });
  return !!relationship;
}

// ─── Ownership check for fee structures ──────────────────────────────────────

async function verifyFeeStructureOwnership(
  feeStructureId: string,
  schoolId: string
): Promise<boolean> {
  const feeStructure = await db.feeStructure.findUnique({
    where: { id: feeStructureId },
    select: { schoolId: true, isActive: true }
  });
  return !!feeStructure && feeStructure.schoolId === schoolId && feeStructure.isActive;
}

// ─── Batched fee amount lookup ────────────────────────────────────────────────

/**
 * Fetch class-specific amounts for multiple feeTypeIds in one query.
 * Falls back to the feeType default amount when no class-specific row exists.
 */
async function getFeeAmountsForClass(
  feeTypeIds: string[],
  classId: string | undefined,
  schoolId: string
): Promise<Map<string, number>> {
  const [classAmounts, feeTypes] = await Promise.all([
    classId
      ? db.feeTypeClassAmount.findMany({
          where: {
            schoolId,
            feeTypeId: { in: feeTypeIds },
            classId
          }
        })
      : Promise.resolve([]),
    db.feeType.findMany({
      where: { id: { in: feeTypeIds } },
      select: { id: true, amount: true }
    })
  ]);

  const classAmountMap = new Map(classAmounts.map(ca => [ca.feeTypeId, ca.amount]));
  const defaultAmountMap = new Map(feeTypes.map(ft => [ft.id, ft.amount]));

  const result = new Map<string, number>();
  for (const id of feeTypeIds) {
    result.set(id, classAmountMap.get(id) ?? defaultAmountMap.get(id) ?? 0);
  }
  return result;
}

// ─── getFeeOverview ───────────────────────────────────────────────────────────

export async function getFeeOverview(input: FeeOverviewInput) {
  try {
    const validated = feeOverviewSchema.parse(input);

    const parent = await getCurrentParent();
    if (!parent) return { success: false, message: "Unauthorized" };

    const hasAccess = await verifyParentChildRelationship(parent.id, validated.childId, parent.schoolId);
    if (!hasAccess) return { success: false, message: "Access denied" };

    const student = await db.student.findFirst({
      where: { id: validated.childId, schoolId: parent.schoolId },
      include: {
        user: { select: { firstName: true, lastName: true } },
        enrollments: {
          where: { status: "ACTIVE" },
          orderBy: { enrollDate: 'desc' },
          take: 1,
          include: {
            class: { include: { academicYear: true } }
          }
        }
      }
    });

    if (!student || !student.enrollments[0]) {
      return { success: false, message: "Student enrollment not found" };
    }

    const currentEnrollment = student.enrollments[0];
    const academicYearId = currentEnrollment.class.academicYearId;
    const classId = currentEnrollment.class.id;

    const feeStructure = await db.feeStructure.findFirst({
      where: {
        academicYearId,
        schoolId: parent.schoolId,
        isActive: true,
        OR: [
          { classes: { some: { classId } } },
          {
            AND: [
              { classes: { none: {} } },
              { applicableClasses: { contains: currentEnrollment.class.name } }
            ]
          }
        ]
      },
      include: {
        items: { include: { feeType: true } },
        academicYear: true,
        classes: { include: { class: true } }
      }
    });

    if (!feeStructure) {
      return {
        success: true,
        data: {
          student: {
            id: student.id,
            name: `${student.user.firstName} ${student.user.lastName}`,
            class: currentEnrollment.class.name
          },
          totalFees: 0,
          paidAmount: 0,
          pendingAmount: 0,
          overdueAmount: 0,
          feeItems: [],
          nextDueDate: null,
          hasOverdue: false,
          academicYear: currentEnrollment.class.academicYear.name
        }
      };
    }

    const [payments, amountMap] = await Promise.all([
      db.feePayment.findMany({
        where: {
          studentId: validated.childId,
          feeStructureId: feeStructure.id,
          schoolId: parent.schoolId
        }
      }),
      getFeeAmountsForClass(
        feeStructure.items.map(i => i.feeTypeId),
        classId,
        parent.schoolId
      )
    ]);

    let totalFees = 0;
    for (const item of feeStructure.items) {
      totalFees += amountMap.get(item.feeTypeId) ?? 0;
    }

    const paidAmount = payments
      .filter(p => p.status === PaymentStatus.COMPLETED)
      .reduce((sum, p) => sum + p.paidAmount, 0);
    const pendingAmount = totalFees - paidAmount;

    const now = new Date();
    const feeItems = feeStructure.items.map(item => {
      const correctAmount = amountMap.get(item.feeTypeId) ?? 0;
      const itemPaidAmount = payments
        .filter(p => p.status === PaymentStatus.COMPLETED)
        .reduce((sum, p) => sum + p.paidAmount, 0);
      const itemBalance = correctAmount - itemPaidAmount;

      let status: "PAID" | "PENDING" | "OVERDUE" | "PARTIAL";
      if (itemBalance <= 0) status = "PAID";
      else if (itemPaidAmount > 0) status = "PARTIAL";
      else if (item.dueDate && item.dueDate < now) status = "OVERDUE";
      else status = "PENDING";

      return {
        id: item.id,
        name: item.feeType.name,
        amount: correctAmount,
        dueDate: item.dueDate,
        status,
        paidAmount: itemPaidAmount,
        balance: itemBalance > 0 ? itemBalance : 0
      };
    });

    const overdueAmount = feeItems
      .filter(item => item.status === "OVERDUE")
      .reduce((sum, item) => sum + item.balance, 0);

    const nextDueDate = feeStructure.items
      .filter(item => item.dueDate && item.dueDate >= now)
      .map(item => item.dueDate!)
      .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;

    return {
      success: true,
      data: {
        student: {
          id: student.id,
          name: `${student.user.firstName} ${student.user.lastName}`,
          class: currentEnrollment.class.name
        },
        feeStructureId: feeStructure.id,
        totalFees,
        paidAmount,
        pendingAmount,
        overdueAmount,
        feeItems,
        nextDueDate,
        hasOverdue: overdueAmount > 0,
        academicYear: feeStructure.academicYear.name
      }
    };
  } catch (error) {
    console.error("Error fetching fee overview:", error);
    return { success: false, message: "Failed to fetch fee overview" };
  }
}

// ─── getPaymentHistory ────────────────────────────────────────────────────────

export async function getPaymentHistory(filters: PaymentHistoryFilter) {
  try {
    const validated = paymentHistoryFilterSchema.parse(filters);

    const parent = await getCurrentParent();
    if (!parent) return { success: false, message: "Unauthorized" };

    const hasAccess = await verifyParentChildRelationship(parent.id, validated.childId, parent.schoolId);
    if (!hasAccess) return { success: false, message: "Access denied" };

    const where: Record<string, unknown> = {
      studentId: validated.childId,
      schoolId: parent.schoolId
    };

    if (validated.status) where.status = validated.status;
    if (validated.paymentMethod) where.paymentMethod = validated.paymentMethod;

    if (validated.dateFrom || validated.dateTo) {
      const paymentDate: Record<string, Date> = {};
      if (validated.dateFrom) paymentDate.gte = validated.dateFrom;
      if (validated.dateTo) paymentDate.lte = validated.dateTo;
      where.paymentDate = paymentDate;
    }

    const totalCount = await db.feePayment.count({ where });

    const skip = (validated.page - 1) * validated.limit;
    const payments = await db.feePayment.findMany({
      where,
      include: {
        feeStructure: { include: { academicYear: true } }
      },
      orderBy: { paymentDate: 'desc' },
      skip,
      take: validated.limit
    });

    const paymentRecords = payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      paidAmount: payment.paidAmount,
      balance: payment.balance,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      receiptNumber: payment.receiptNumber,
      status: payment.status,
      remarks: payment.remarks,
      feeStructureName: payment.feeStructure.name,
      academicYear: payment.feeStructure.academicYear.name
    }));

    return {
      success: true,
      data: {
        payments: paymentRecords,
        pagination: {
          page: validated.page,
          limit: validated.limit,
          totalCount,
          totalPages: Math.ceil(totalCount / validated.limit)
        }
      }
    };
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return { success: false, message: "Failed to fetch payment history" };
  }
}

// ─── createPayment ────────────────────────────────────────────────────────────

export async function createPayment(input: CreatePaymentInput & { csrfToken?: string }) {
  try {
    if (input.csrfToken) {
      const isCsrfValid = await verifyCsrfToken(input.csrfToken);
      if (!isCsrfValid) return { success: false, message: "Invalid CSRF token" };
    }

    const validated = createPaymentSchema.parse(input);

    const parent = await getCurrentParent();
    if (!parent) return { success: false, message: "Unauthorized" };

    const rateLimitResult = checkRateLimit(`payment:${parent.id}`, RateLimitPresets.PAYMENT);
    if (!rateLimitResult) {
      return { success: false, message: "Too many payment requests. Please try again later." };
    }

    const hasAccess = await verifyParentChildRelationship(parent.id, validated.childId, parent.schoolId);
    if (!hasAccess) return { success: false, message: "Access denied" };

    // H-1: Verify feeStructure belongs to this school and is active
    const feeStructureValid = await verifyFeeStructureOwnership(validated.feeStructureId, parent.schoolId);
    if (!feeStructureValid) return { success: false, message: "Invalid fee structure" };

    const feeStructure = await db.feeStructure.findUnique({
      where: { id: validated.feeStructureId },
      include: { items: { include: { feeType: true } } }
    });

    // feeStructureValid already confirmed it exists and is active
    const validFeeTypeIds = feeStructure!.items.map(item => item.feeTypeId);
    const invalidFeeTypes = validated.feeTypeIds.filter(id => !validFeeTypeIds.includes(id));
    if (invalidFeeTypes.length > 0) {
      return { success: false, message: "Invalid fee types selected" };
    }

    const receiptNumber = `RCP-${Date.now()}-${validated.childId.slice(-6)}`;
    const sanitizedTransactionId = validated.transactionId
      ? sanitizeAlphanumeric(validated.transactionId, "-_")
      : null;
    const sanitizedRemarks = validated.remarks ? sanitizeText(validated.remarks) : null;

    const payment = await db.feePayment.create({
      data: {
        studentId: validated.childId,
        feeStructureId: validated.feeStructureId,
        amount: validated.amount,
        paidAmount: validated.amount,
        balance: 0,
        paymentDate: new Date(),
        paymentMethod: validated.paymentMethod,
        transactionId: sanitizedTransactionId,
        receiptNumber,
        status: validated.paymentMethod === PaymentMethod.ONLINE_PAYMENT
          ? PaymentStatus.PENDING
          : PaymentStatus.COMPLETED,
        remarks: sanitizedRemarks,
        schoolId: parent.schoolId
      }
    });

    revalidatePath("/parent/fees");

    return {
      success: true,
      data: {
        paymentId: payment.id,
        receiptNumber: payment.receiptNumber,
        status: payment.status
      },
      message: "Payment initiated successfully"
    };
  } catch (error) {
    console.error("Error creating payment:", error);
    return { success: false, message: "Failed to create payment" };
  }
}

// ─── verifyPayment ────────────────────────────────────────────────────────────

export async function verifyPayment(input: VerifyPaymentInput & { csrfToken?: string }) {
  try {
    if (input.csrfToken) {
      const isCsrfValid = await verifyCsrfToken(input.csrfToken);
      if (!isCsrfValid) return { success: false, message: "Invalid CSRF token" };
    }

    const validated = verifyPaymentSchema.parse(input);

    const parent = await getCurrentParent();
    if (!parent) return { success: false, message: "Unauthorized" };

    const rateLimitResult = checkRateLimit(`payment-verify:${parent.id}`, RateLimitPresets.PAYMENT);
    if (!rateLimitResult) {
      return { success: false, message: "Too many verification requests. Please try again later." };
    }

    const hasAccess = await verifyParentChildRelationship(parent.id, validated.childId, parent.schoolId);
    if (!hasAccess) return { success: false, message: "Access denied" };

    // H-1: Verify feeStructure belongs to this school
    const feeStructureValid = await verifyFeeStructureOwnership(validated.feeStructureId, parent.schoolId);
    if (!feeStructureValid) return { success: false, message: "Invalid fee structure" };

    const existingPayment = await db.feePayment.findFirst({
      where: {
        transactionId: validated.paymentId,
        schoolId: parent.schoolId
      }
    });

    if (existingPayment) {
      if (existingPayment.status === PaymentStatus.COMPLETED) {
        return {
          success: true,
          data: {
            paymentId: existingPayment.id,
            receiptNumber: existingPayment.receiptNumber,
            status: existingPayment.status
          },
          message: "Payment already verified"
        };
      }

      const sanitizedPaymentId = sanitizeAlphanumeric(validated.paymentId, "-_");
      const updatedPayment = await db.feePayment.update({
        where: { id: existingPayment.id },
        data: { status: PaymentStatus.COMPLETED, transactionId: sanitizedPaymentId }
      });

      revalidatePath("/parent/fees");

      return {
        success: true,
        data: {
          paymentId: updatedPayment.id,
          receiptNumber: updatedPayment.receiptNumber,
          status: updatedPayment.status
        },
        message: "Payment verified successfully"
      };
    }

    const receiptNumber = `RCP-${Date.now()}-${validated.childId.slice(-6)}`;
    const sanitizedPaymentId = sanitizeAlphanumeric(validated.paymentId, "-_");
    const sanitizedOrderId = sanitizeAlphanumeric(validated.orderId, "-_");

    const payment = await db.feePayment.create({
      data: {
        studentId: validated.childId,
        feeStructureId: validated.feeStructureId,
        amount: validated.amount,
        paidAmount: validated.amount,
        balance: 0,
        paymentDate: new Date(),
        paymentMethod: PaymentMethod.ONLINE_PAYMENT,
        transactionId: sanitizedPaymentId,
        receiptNumber,
        status: PaymentStatus.COMPLETED,
        remarks: `Online payment verified. Order ID: ${sanitizedOrderId}`,
        schoolId: parent.schoolId
      }
    });

    revalidatePath("/parent/fees");

    return {
      success: true,
      data: {
        paymentId: payment.id,
        receiptNumber: payment.receiptNumber,
        status: payment.status
      },
      message: "Payment verified successfully"
    };
  } catch (error) {
    console.error("Error verifying payment:", error);
    return { success: false, message: "Failed to verify payment" };
  }
}

// ─── downloadReceipt ──────────────────────────────────────────────────────────

export async function downloadReceipt(input: DownloadReceiptInput) {
  try {
    const validated = downloadReceiptSchema.parse(input);

    const parent = await getCurrentParent();
    if (!parent) return { success: false, message: "Unauthorized" };

    const hasAccess = await verifyParentChildRelationship(parent.id, validated.childId, parent.schoolId);
    if (!hasAccess) return { success: false, message: "Access denied" };

    const payment = await db.feePayment.findFirst({
      where: {
        id: validated.paymentId,
        schoolId: parent.schoolId
      },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            enrollments: {
              where: { status: "ACTIVE" },
              orderBy: { enrollDate: 'desc' },
              take: 1,
              include: { class: true, section: true }
            }
          }
        },
        feeStructure: {
          include: {
            academicYear: true,
            items: { include: { feeType: true } }
          }
        }
      }
    });

    if (!payment) return { success: false, message: "Payment not found" };

    if (payment.studentId !== validated.childId) {
      return { success: false, message: "Access denied" };
    }

    const classId = payment.student.enrollments[0]?.class?.id;

    // Batch fee amount lookups for receipt
    const feeTypeIds = payment.feeStructure.items.map(i => i.feeTypeId);
    const amountMap = await getFeeAmountsForClass(feeTypeIds, classId, parent.schoolId);

    const feeItems = payment.feeStructure.items.map(item => ({
      name: item.feeType.name,
      amount: amountMap.get(item.feeTypeId) ?? 0
    }));

    const receiptData = {
      receiptNumber: payment.receiptNumber,
      paymentDate: payment.paymentDate,
      student: {
        name: `${payment.student.user.firstName} ${payment.student.user.lastName}`,
        email: payment.student.user.email ?? '',
        class: payment.student.enrollments[0]?.class.name || "N/A",
        section: payment.student.enrollments[0]?.section.name || "N/A",
        admissionId: payment.student.admissionId
      },
      payment: {
        amount: payment.amount,
        paidAmount: payment.paidAmount,
        balance: payment.balance,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        status: payment.status
      },
      feeStructure: {
        name: payment.feeStructure.name,
        academicYear: payment.feeStructure.academicYear.name
      },
      feeItems
    };

    // C-5 fix: use schoolId field, not id
    const systemSettings = await db.schoolSettings.findFirst({
      where: { schoolId: parent.schoolId }
    });

    if (systemSettings) {
      (receiptData as Record<string, unknown>).school = {
        name: systemSettings.schoolName,
        address: systemSettings.schoolAddress,
        phone: systemSettings.schoolPhone,
        email: systemSettings.schoolEmail,
        website: systemSettings.schoolWebsite,
        logo: systemSettings.schoolLogo
      };
    }

    const receiptHTML = getReceiptHTML(receiptData);

    return {
      success: true,
      data: { ...receiptData, html: receiptHTML },
      message: "Receipt generated successfully"
    };
  } catch (error) {
    console.error("Error downloading receipt:", error);
    return { success: false, message: "Failed to download receipt" };
  }
}
