"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole, PaymentMethod, PaymentStatus } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSchoolAccess } from "@/lib/auth/tenant";
import {
  getActiveFeeDiscount,
  calculateDiscountAmount,
  calculateNetPayable,
  getFeeAmountForClass,
  getFeeAmountsForClass,
  calculateAccruedFeeTotal,
} from "@/lib/utils/payment-helpers";

// Schema for payment
const paymentSchema = z.object({
  amount: z.number().min(1, { message: "Amount must be greater than 0" }),
  paymentMethod: z.enum([
    "CASH", "CHEQUE", "CREDIT_CARD", "DEBIT_CARD",
    "BANK_TRANSFER", "ONLINE_PAYMENT", "SCHOLARSHIP"
  ]),
  transactionId: z.string().optional(),
  remarks: z.string().optional(),
});

// Schema for payment verification
const paymentVerificationSchema = z.object({
  transactionId: z.string().min(3, { message: "Transaction ID is required" }),
  receiptImage: z.string().optional(),
});

/**
 * Get the current student
 */
async function getCurrentStudent() {
  const session = await auth();
  const clerkUser = session?.user;

  if (!clerkUser) {
    return null;
  }

  // Get user from database
  const dbUser = await db.user.findUnique({
    where: { id: clerkUser.id }
  });

  if (!dbUser || dbUser.role !== UserRole.STUDENT) {
    return null;
  }

  const { schoolId } = await requireSchoolAccess();
  if (!schoolId) return null;

  const student = await db.student.findFirst({
    where: {
      userId: dbUser.id,
      schoolId,
    },
    include: {
      enrollments: {
        orderBy: {
          enrollDate: 'desc'
        },
        take: 1,
        include: {
          class: {
            include: {
              academicYear: true
            }
          }
        }
      }
    }
  });

  return student;
}

/**
 * Get student fee details
 */
export async function getStudentFeeDetails() {
  const student = await getCurrentStudent();

  if (!student) {
    redirect("/login");
  }

  // Get current enrollment and academic year
  const currentEnrollment = student.enrollments[0];
  const academicYearId = currentEnrollment?.class?.academicYear?.id;
  const className = currentEnrollment?.class?.name || "N/A";
  const academicYear = currentEnrollment?.class?.academicYear?.name || "Current";

  // Get fee structure for this student's class using FeeStructureClass junction table
  // This supports the new class-based system while maintaining backward compatibility
  const classId = currentEnrollment?.class?.id;

  const feeStructure = await db.feeStructure.findFirst({
    where: {
      academicYearId,
      isActive: true,
      OR: [
        // New system: Query via FeeStructureClass junction table
        {
          classes: {
            some: {
              classId: classId
            }
          }
        },
        // Backward compatibility: Fall back to text-based search if no junction table entries exist
        {
          AND: [
            {
              classes: {
                none: {}
              }
            },
            {
              applicableClasses: {
                contains: currentEnrollment?.class?.name
              }
            }
          ]
        }
      ]
    },
    include: {
      items: {
        include: {
          feeType: true
        }
      },
      classes: {
        include: {
          class: true
        }
      }
    }
  });

  // Get all fee payments for this student
  const feePayments = await db.feePayment.findMany({
    where: {
      studentId: student.id,
      feeStructureId: feeStructure?.id
    }
  });

  // Calculate total fees using class-specific amounts
  // Requirements: 11.2, 11.3
  let totalFees = 0;
  let classAmountMap: Map<string, number> | null = null;
  if (feeStructure && classId) {
    // Optimized batch calculation to avoid sequential N+1 queries
    const feeTypeIds = feeStructure.items.map(item => item.feeTypeId);
    classAmountMap = await getFeeAmountsForClass(feeTypeIds, classId, student.schoolId);

    for (const item of feeStructure.items) {
      const correctAmount = classAmountMap.get(item.feeTypeId) || item.feeType.amount;
      totalFees += correctAmount;
    }
  } else if (feeStructure) {
    // Fallback to stored amounts if no class ID
    totalFees = feeStructure.items.reduce((sum, item) => sum + item.amount, 0);
  }

  const discount = feeStructure
    ? await getActiveFeeDiscount(student.id, feeStructure.id, student.schoolId)
    : null;
  const discountAmount = calculateDiscountAmount(totalFees, discount);
  const grossTotalFees = totalFees;
  totalFees = calculateNetPayable(grossTotalFees, discount);

  const paidAmount = feePayments.reduce((sum, payment) => sum + payment.paidAmount, 0);
  const balance = Math.max(totalFees - paidAmount, 0);
  const paymentPercentage = totalFees > 0 ? (paidAmount / totalFees) * 100 : 0;

  // How much of the fee structure should have accrued by now (mid-session onboarding /
  // ongoing Monthly-Quarterly-Semi-Annual fees), vs the full annual balance above.
  let overdueAmount = 0;
  if (feeStructure && classAmountMap && currentEnrollment) {
    const effectiveStartDate = new Date(
      Math.max(feeStructure.validFrom.getTime(), currentEnrollment.enrollDate.getTime())
    );
    const now = new Date();
    const asOfDate = feeStructure.validTo && feeStructure.validTo < now ? feeStructure.validTo : now;

    const accrualItems = feeStructure.items.map(item => ({
      annualizedAmount: classAmountMap!.get(item.feeTypeId) ?? item.feeType.amount,
      frequency: item.feeType.frequency,
      dueDate: item.dueDate,
    }));

    const accruedGrossTotal = calculateAccruedFeeTotal(accrualItems, effectiveStartDate, asOfDate);
    const netRatio = grossTotalFees > 0 ? totalFees / grossTotalFees : 1;
    const accruedNetTotal = accruedGrossTotal * netRatio;
    overdueAmount = Math.max(accruedNetTotal - paidAmount, 0);
  }

  // Get upcoming fees with class-specific amounts
  const now = new Date();
  const upcomingFeesRaw = feeStructure?.items
    .filter(item => item.dueDate && new Date(item.dueDate) > now)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 3) || [];

  // Enrich with class-specific amounts (optimized to avoid N+1 queries)
  const upcomingFeeTypeIds = upcomingFeesRaw.map(item => item.feeTypeId);
  const upcomingAmountMap = await getFeeAmountsForClass(upcomingFeeTypeIds, classId, student.schoolId);

  const upcomingFees = upcomingFeesRaw.map(item => {
    // Use class-specific amount if available, otherwise use the fee type default amount
    const correctAmount = upcomingAmountMap.get(item.feeTypeId) || item.feeType.amount;
    return {
      ...item,
      amount: correctAmount
    };
  });

  // Get overdue fees with class-specific amounts
  const overdueFeesRaw = feeStructure?.items
    .filter(item => item.dueDate && new Date(item.dueDate) < now)
    .filter(item => {
      const paymentForItem = feePayments.find(payment =>
        payment.amount === item.amount && payment.status === PaymentStatus.COMPLETED
      );
      return !paymentForItem;
    }) || [];

  // Enrich with class-specific amounts (optimized to avoid N+1 queries)
  const overdueFeeTypeIds = overdueFeesRaw.map(item => item.feeTypeId);
  const overdueAmountMap = await getFeeAmountsForClass(overdueFeeTypeIds, classId, student.schoolId);

  const overdueFees = overdueFeesRaw.map(item => {
    const correctAmount = overdueAmountMap.get(item.feeTypeId) || item.feeType.amount;
    return {
      ...item,
      amount: correctAmount
    };
  });

  return {
    student,
    feeStructure,
    feePayments,
    totalFees,
    grossTotalFees,
    discountAmount,
    paidAmount,
    balance,
    overdueAmount,
    paymentPercentage,
    upcomingFees,
    overdueFees,
    className,
    academicYear
  };
}

/**
 * Get fee payment history
 */
export async function getFeePaymentHistory() {
  const student = await getCurrentStudent();

  if (!student) {
    redirect("/login");
  }

  // Get all fee payments for this student
  const payments = await db.feePayment.findMany({
    where: {
      studentId: student.id
    },
    include: {
      feeStructure: {
        include: {
          academicYear: true
        }
      }
    },
    orderBy: {
      paymentDate: 'desc'
    }
  });

  return {
    student,
    payments
  };
}

/**
 * Get due payments
 */
export async function getDuePayments() {
  const student = await getCurrentStudent();

  if (!student) {
    redirect("/login");
  }

  // Get current enrollment
  const currentEnrollment = student.enrollments[0];
  const academicYearId = currentEnrollment?.class?.academicYear?.id;
  const classId = currentEnrollment?.class?.id;

  // Get fee structure for this student's class using FeeStructureClass junction table
  // This supports the new class-based system while maintaining backward compatibility
  const feeStructure = await db.feeStructure.findFirst({
    where: {
      academicYearId,
      isActive: true,
      OR: [
        // New system: Query via FeeStructureClass junction table
        {
          classes: {
            some: {
              classId: classId
            }
          }
        },
        // Backward compatibility: Fall back to text-based search if no junction table entries exist
        {
          AND: [
            {
              classes: {
                none: {}
              }
            },
            {
              applicableClasses: {
                contains: currentEnrollment?.class?.name
              }
            }
          ]
        }
      ]
    },
    include: {
      items: {
        include: {
          feeType: true
        }
      },
      classes: {
        include: {
          class: true
        }
      }
    }
  });

  if (!feeStructure) {
    return {
      student,
      duePayments: [],
      totalDue: 0
    };
  }

  // Get all fee payments for this student
  const feePayments = await db.feePayment.findMany({
    where: {
      studentId: student.id,
      feeStructureId: feeStructure.id
    }
  });

  // Find which fees are due and calculate with class-specific amounts
  // Requirements: 11.2, 11.3
  const now = new Date();
  const dueItemsRaw = feeStructure.items.filter(item => {
    // Check if this fee item has been fully paid
    const paymentForItem = feePayments.find(payment =>
      payment.amount === item.amount &&
      payment.status === PaymentStatus.COMPLETED
    );

    // If no due date, it's considered due
    if (!item.dueDate) return !paymentForItem;

    // If due date has passed and not fully paid, it's due
    return new Date(item.dueDate) <= now && !paymentForItem;
  });

  // Enrich with class-specific amounts (optimized to avoid N+1 queries)
  const feeTypeIds = dueItemsRaw.map(item => item.feeTypeId);
  const amountMap = await getFeeAmountsForClass(feeTypeIds, classId, student.schoolId);

  const dueItems = dueItemsRaw.map(item => {
    const correctAmount = amountMap.get(item.feeTypeId) || item.feeType.amount;
    return {
      ...item,
      amount: correctAmount
    };
  });

  // Calculate total due amount using class-specific amounts
  const grossTotalDue = dueItems.reduce((sum, item) => sum + item.amount, 0);

  // Apply the student's discount (if any) once against the total due
  const discount = await getActiveFeeDiscount(student.id, feeStructure.id, student.schoolId);
  const totalDue = Math.max(calculateNetPayable(grossTotalDue, discount), 0);

  // How much should have accrued by now (mid-session onboarding / ongoing
  // Monthly-Quarterly-Semi-Annual fees), as opposed to the full totalDue above.
  let overdueAmount = 0;
  if (currentEnrollment) {
    const allFeeTypeIds = feeStructure.items.map(item => item.feeTypeId);
    const allAmountMap = await getFeeAmountsForClass(allFeeTypeIds, classId, student.schoolId);

    const effectiveStartDate = new Date(
      Math.max(feeStructure.validFrom.getTime(), currentEnrollment.enrollDate.getTime())
    );
    const asOfDate = feeStructure.validTo && feeStructure.validTo < now ? feeStructure.validTo : now;

    const accrualItems = feeStructure.items.map(item => ({
      annualizedAmount: allAmountMap.get(item.feeTypeId) ?? item.feeType.amount,
      frequency: item.feeType.frequency,
      dueDate: item.dueDate,
    }));

    const accruedGrossTotal = calculateAccruedFeeTotal(accrualItems, effectiveStartDate, asOfDate);
    const totalPaid = feePayments.reduce((sum, payment) => sum + payment.paidAmount, 0);
    const netAccruedTotal = calculateNetPayable(accruedGrossTotal, discount);
    overdueAmount = Math.max(netAccruedTotal - totalPaid, 0);
  }

  return {
    student,
    duePayments: dueItems,
    feeStructure,
    totalDue,
    overdueAmount
  };
}

/**
 * Make a fee payment
 * Requirements: 10.1, 10.2
 */
export async function makePayment(feeItemId: string, paymentData: z.infer<typeof paymentSchema> & { csrfToken?: string }) {
  const student = await getCurrentStudent();

  if (!student) {
    return { success: false, message: "Authentication required" };
  }

  try {
    // Verify CSRF token
    if (paymentData.csrfToken) {
      const { verifyCsrfToken } = await import("@/lib/utils/csrf");
      const isCsrfValid = await verifyCsrfToken(paymentData.csrfToken);
      if (!isCsrfValid) {
        return { success: false, message: "Invalid CSRF token" };
      }
    }

    // Rate limiting for payment operations
    const { checkRateLimit, RateLimitPresets } = await import("@/lib/utils/rate-limit");
    const rateLimitKey = `payment:${student.id}`;
    const rateLimitResult = checkRateLimit(rateLimitKey, RateLimitPresets.PAYMENT);
    if (!rateLimitResult) {
      return { success: false, message: "Too many payment requests. Please try again later." };
    }

    // Validate data
    const validatedData = paymentSchema.parse(paymentData);

    // Get the fee item
    const feeItem = await db.feeStructureItem.findUnique({
      where: { id: feeItemId },
      include: {
        feeStructure: true,
        feeType: true
      }
    });

    if (!feeItem) {
      return { success: false, message: "Fee item not found" };
    }

    // Get the correct amount for this student's class
    // Requirements: 11.2, 11.3
    const currentEnrollment = student.enrollments[0];
    const classId = currentEnrollment?.class?.id;
    const correctAmount = await getFeeAmountForClass(feeItem.feeTypeId, classId, student.schoolId);

    // Verify fee item belongs to the student's school
    if (feeItem.schoolId !== student.schoolId) {
      return { success: false, message: "Unauthorized fee item" };
    }

    // Check if already paid
    const existingPayment = await db.feePayment.findFirst({
      where: {
        studentId: student.id,
        feeStructureId: feeItem.feeStructureId,
        amount: correctAmount,
        status: PaymentStatus.COMPLETED
      }
    });

    if (existingPayment) {
      return { success: false, message: "This fee has already been paid" };
    }

    // Create payment record with class-specific amount
    const payment = await db.feePayment.create({
      data: {
        studentId: student.id,
        feeStructureId: feeItem.feeStructureId,
        amount: correctAmount,
        paidAmount: validatedData.amount,
        balance: correctAmount - validatedData.amount,
        paymentDate: new Date(),
        paymentMethod: validatedData.paymentMethod as PaymentMethod,
        transactionId: validatedData.transactionId,
        status: validatedData.amount >= correctAmount
          ? PaymentStatus.COMPLETED
          : PaymentStatus.PARTIAL,
        remarks: validatedData.remarks,
        schoolId: student.schoolId, // Add required schoolId
      }
    });

    // Create notification
    await db.notification.create({
      data: {
        userId: student.userId,
        title: "Fee Payment Recorded",
        message: `Your payment of $${validatedData.amount} has been recorded and is pending verification.`,
        type: "INFO",
        schoolId: student.schoolId, // Add required schoolId
      }
    });

    revalidatePath("/student/fees");
    return {
      success: true,
      message: "Payment recorded successfully. It will be verified by the finance office."
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0].message || "Invalid payment data"
      };
    }

    return {
      success: false,
      message: "Failed to record payment"
    };
  }
}

/**
 * Get student scholarship info
 */
export async function getStudentScholarships() {
  const student = await getCurrentStudent();

  if (!student) {
    redirect("/login");
  }

  // Get scholarships for this student
  const scholarships = await db.scholarshipRecipient.findMany({
    where: {
      studentId: student.id,
      status: "Active"
    },
    include: {
      scholarship: true
    }
  });

  // Get all scholarships available
  const availableScholarships = await db.scholarship.findMany({
    where: {
      // Add any filters for available scholarships
    }
  });

  const totalScholarshipAmount = scholarships.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  return {
    student,
    scholarships,
    availableScholarships,
    totalScholarshipAmount
  };
}

/**
 * Apply for scholarship
 */
export async function applyForScholarship(scholarshipId: string) {
  const student = await getCurrentStudent();

  if (!student) {
    return { success: false, message: "Authentication required" };
  }

  try {
    // Check if scholarship exists
    const scholarship = await db.scholarship.findUnique({
      where: { id: scholarshipId }
    });

    if (!scholarship) {
      return { success: false, message: "Scholarship not found" };
    }

    // Check if already applied
    const existingApplication = await db.scholarshipRecipient.findFirst({
      where: {
        scholarshipId,
        studentId: student.id
      }
    });

    if (existingApplication) {
      return {
        success: false,
        message: "You have already applied for this scholarship"
      };
    }

    // Create application
    await db.scholarshipRecipient.create({
      data: {
        scholarshipId,
        studentId: student.id,
        awardDate: new Date(),
        amount: 0, // Will be updated when approved
        status: "Pending",
        schoolId: student.schoolId, // Add required schoolId
      }
    });

    // Create notification
    await db.notification.create({
      data: {
        userId: student.userId,
        title: "Scholarship Application Submitted",
        message: `Your application for ${scholarship.name} has been submitted and is pending approval.`,
        type: "INFO",
        schoolId: student.schoolId, // Add required schoolId
      }
    });

    revalidatePath("/student/fees/scholarships");
    return {
      success: true,
      message: "Scholarship application submitted successfully"
    };

  } catch (error) {
    return {
      success: false,
      message: "Failed to submit scholarship application"
    };
  }
}
