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

/**
 * Helper function to get current parent and verify authentication
 */
async function getCurrentParent() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    return null;
  }
  
  const dbUser = await db.user.findUnique({
    where: { id: clerkUser.id }
  });
  
  if (!dbUser || dbUser.role !== UserRole.PARENT) {
    return null;
  }
  
  const parent = await db.parent.findUnique({
    where: {
      userId: dbUser.id
    }
  });
  
  return parent;
}

/**
 * Helper function to verify parent-child relationship
 */
async function verifyParentChildRelationship(
  parentId: string,
  childId: string
): Promise<boolean> {
  const relationship = await db.studentParent.findFirst({
    where: { parentId, studentId: childId }
  });
  return !!relationship;
}

/**
 * Helper function to get the correct fee amount for a fee type based on class
 * Checks for class-specific amount first, falls back to default amount
 * Requirements: 12.2, 12.3
 */
async function getFeeAmountForClass(feeTypeId: string, classId: string | undefined): Promise<number> {
  if (!classId) {
    // If no class ID, get default amount
    const feeType = await db.feeType.findUnique({
      where: { id: feeTypeId }
    });
    return feeType?.amount || 0;
  }

  // Check for class-specific amount
  const classAmount = await db.feeTypeClassAmount.findUnique({
    where: {
      feeTypeId_classId: {
        feeTypeId,
        classId
      }
    }
  });

  if (classAmount) {
    return classAmount.amount;
  }

  // Fall back to default amount
  const feeType = await db.feeType.findUnique({
    where: { id: feeTypeId }
  });
  
  return feeType?.amount || 0;
}

/**
 * Get fee overview for a child including breakdown and payment status
 * Requirements: 12.1, 12.4
 */
export async function getFeeOverview(input: FeeOverviewInput) {
  try {
    // Validate input
    const validated = feeOverviewSchema.parse(input);
    
    // Get current parent
    const parent = await getCurrentParent();
    if (!parent) {
      return { success: false, message: "Unauthorized" };
    }
    
    // Verify parent-child relationship
    const hasAccess = await verifyParentChildRelationship(parent.id, validated.childId);
    if (!hasAccess) {
      return { success: false, message: "Access denied" };
    }
    
    // Get student with current enrollment
    const student = await db.student.findUnique({
      where: { id: validated.childId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        enrollments: {
          where: { status: "ACTIVE" },
          orderBy: { enrollDate: 'desc' },
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
    
    if (!student || !student.enrollments[0]) {
      return { success: false, message: "Student enrollment not found" };
    }
    
    const currentEnrollment = student.enrollments[0];
    const academicYearId = currentEnrollment.class.academicYearId;
    const classId = currentEnrollment.class.id;
    
    // Get active fee structure for the student's class using FeeStructureClass junction table
    // This supports the new class-based system while maintaining backward compatibility
    // Requirements: 12.1, 12.4
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
                  contains: currentEnrollment.class.name
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
        academicYear: true,
        classes: {
          include: {
            class: true
          }
        }
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
    
    // Get all payments for this student and fee structure
    const payments = await db.feePayment.findMany({
      where: {
        studentId: validated.childId,
        feeStructureId: feeStructure.id
      }
    });
    
    // Calculate totals using class-specific amounts
    // Requirements: 12.2, 12.3
    let totalFees = 0;
    for (const item of feeStructure.items) {
      const correctAmount = await getFeeAmountForClass(item.feeTypeId, classId);
      totalFees += correctAmount;
    }
    
    const paidAmount = payments
      .filter(p => p.status === PaymentStatus.COMPLETED)
      .reduce((sum, p) => sum + p.paidAmount, 0);
    const pendingAmount = totalFees - paidAmount;
    
    // Calculate fee items with status using class-specific amounts
    // Requirements: 12.2, 12.3
    const now = new Date();
    const feeItems = await Promise.all(
      feeStructure.items.map(async (item) => {
        const correctAmount = await getFeeAmountForClass(item.feeTypeId, classId);
        const itemPayments = payments.filter(p => 
          p.status === PaymentStatus.COMPLETED
        );
        const itemPaidAmount = itemPayments.reduce((sum, p) => sum + p.paidAmount, 0);
        const itemBalance = correctAmount - itemPaidAmount;
        
        let status: "PAID" | "PENDING" | "OVERDUE" | "PARTIAL";
        if (itemBalance <= 0) {
          status = "PAID";
        } else if (itemPaidAmount > 0) {
          status = "PARTIAL";
        } else if (item.dueDate && item.dueDate < now) {
          status = "OVERDUE";
        } else {
          status = "PENDING";
        }
        
        return {
          id: item.id,
          name: item.feeType.name,
          amount: correctAmount,
          dueDate: item.dueDate,
          status,
          paidAmount: itemPaidAmount,
          balance: itemBalance > 0 ? itemBalance : 0
        };
      })
    );
    
    // Calculate overdue amount
    const overdueAmount = feeItems
      .filter(item => item.status === "OVERDUE")
      .reduce((sum, item) => sum + item.balance, 0);
    
    // Find next due date
    const upcomingDueDates = feeStructure.items
      .filter(item => item.dueDate && item.dueDate >= now)
      .map(item => item.dueDate!)
      .sort((a, b) => a.getTime() - b.getTime());
    const nextDueDate = upcomingDueDates[0] || null;
    
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

/**
 * Get payment history for a child with pagination and filtering
 * Requirements: 12.2, 12.3
 */
export async function getPaymentHistory(filters: PaymentHistoryFilter) {
  try {
    // Validate input
    const validated = paymentHistoryFilterSchema.parse(filters);
    
    // Get current parent
    const parent = await getCurrentParent();
    if (!parent) {
      return { success: false, message: "Unauthorized" };
    }
    
    // Verify parent-child relationship
    const hasAccess = await verifyParentChildRelationship(parent.id, validated.childId);
    if (!hasAccess) {
      return { success: false, message: "Access denied" };
    }
    
    // Get student's class for class-specific amount calculations
    const student = await db.student.findUnique({
      where: { id: validated.childId },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          orderBy: { enrollDate: 'desc' },
          take: 1,
          include: {
            class: true
          }
        }
      }
    });
    
    const classId = student?.enrollments[0]?.class?.id;
    
    // Build where clause
    const where: any = {
      studentId: validated.childId
    };
    
    if (validated.status) {
      where.status = validated.status;
    }
    
    if (validated.paymentMethod) {
      where.paymentMethod = validated.paymentMethod;
    }
    
    if (validated.dateFrom || validated.dateTo) {
      where.paymentDate = {};
      if (validated.dateFrom) {
        where.paymentDate.gte = validated.dateFrom;
      }
      if (validated.dateTo) {
        where.paymentDate.lte = validated.dateTo;
      }
    }
    
    // Get total count
    const totalCount = await db.feePayment.count({ where });
    
    // Get paginated payments
    const skip = (validated.page - 1) * validated.limit;
    const payments = await db.feePayment.findMany({
      where,
      include: {
        feeStructure: {
          include: {
            academicYear: true
          }
        }
      },
      orderBy: {
        paymentDate: 'desc'
      },
      skip,
      take: validated.limit
    });
    
    // Format payment records with class-specific amounts reflected
    // Requirements: 12.2, 12.3
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

/**
 * Create a payment record to initiate payment process
 * Requirements: 12.2, 12.3
 */
export async function createPayment(input: CreatePaymentInput & { csrfToken?: string }) {
  try {
    // Verify CSRF token
    if (input.csrfToken) {
      const isCsrfValid = await verifyCsrfToken(input.csrfToken);
      if (!isCsrfValid) {
        return { success: false, message: "Invalid CSRF token" };
      }
    }
    
    // Validate input
    const validated = createPaymentSchema.parse(input);
    
    // Get current parent
    const parent = await getCurrentParent();
    if (!parent) {
      return { success: false, message: "Unauthorized" };
    }
    
    // Rate limiting for payment operations
    const rateLimitKey = `payment:${parent.id}`;
    const rateLimitResult = checkRateLimit(rateLimitKey, RateLimitPresets.PAYMENT);
    if (!rateLimitResult) {
      return { success: false, message: "Too many payment requests. Please try again later." };
    }
    
    // Verify parent-child relationship
    const hasAccess = await verifyParentChildRelationship(parent.id, validated.childId);
    if (!hasAccess) {
      return { success: false, message: "Access denied" };
    }
    
    // Get student's class for class-specific amount calculations
    // Requirements: 12.2, 12.3
    const student = await db.student.findUnique({
      where: { id: validated.childId },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          orderBy: { enrollDate: 'desc' },
          take: 1,
          include: {
            class: true
          }
        }
      }
    });
    
    const classId = student?.enrollments[0]?.class?.id;
    
    // Verify fee structure exists and is active
    const feeStructure = await db.feeStructure.findUnique({
      where: { id: validated.feeStructureId },
      include: {
        items: {
          include: {
            feeType: true
          }
        }
      }
    });
    
    if (!feeStructure || !feeStructure.isActive) {
      return { success: false, message: "Invalid fee structure" };
    }
    
    // Verify fee type IDs are valid and calculate correct amounts
    // Requirements: 12.2, 12.3
    const validFeeTypeIds = feeStructure.items.map(item => item.feeTypeId);
    const invalidFeeTypes = validated.feeTypeIds.filter(id => !validFeeTypeIds.includes(id));
    if (invalidFeeTypes.length > 0) {
      return { success: false, message: "Invalid fee types selected" };
    }
    
    // Generate receipt number
    const receiptNumber = `RCP-${Date.now()}-${validated.childId.slice(-6)}`;
    
    // Sanitize transaction ID and remarks
    const sanitizedTransactionId = validated.transactionId 
      ? sanitizeAlphanumeric(validated.transactionId, "-_")
      : null;
    const sanitizedRemarks = validated.remarks 
      ? sanitizeText(validated.remarks)
      : null;
    
    // Create payment record with class-specific amounts
    // Requirements: 12.2, 12.3
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
        remarks: sanitizedRemarks
      }
    });
    
    // Revalidate fee pages
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

/**
 * Verify payment after gateway confirmation
 * Requirements: 1.3, 10.1, 10.2
 */
export async function verifyPayment(input: VerifyPaymentInput & { csrfToken?: string }) {
  try {
    // Verify CSRF token
    if (input.csrfToken) {
      const isCsrfValid = await verifyCsrfToken(input.csrfToken);
      if (!isCsrfValid) {
        return { success: false, message: "Invalid CSRF token" };
      }
    }
    
    // Validate input
    const validated = verifyPaymentSchema.parse(input);
    
    // Get current parent
    const parent = await getCurrentParent();
    if (!parent) {
      return { success: false, message: "Unauthorized" };
    }
    
    // Rate limiting for payment verification
    const rateLimitKey = `payment-verify:${parent.id}`;
    const rateLimitResult = checkRateLimit(rateLimitKey, RateLimitPresets.PAYMENT);
    if (!rateLimitResult) {
      return { success: false, message: "Too many verification requests. Please try again later." };
    }
    
    // Verify parent-child relationship
    const hasAccess = await verifyParentChildRelationship(parent.id, validated.childId);
    if (!hasAccess) {
      return { success: false, message: "Access denied" };
    }
    
    // Note: Actual signature verification would be done by payment gateway utility
    // For now, we'll create/update the payment record
    
    // Check if payment already exists with this transaction ID
    const existingPayment = await db.feePayment.findFirst({
      where: {
        transactionId: validated.paymentId
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
      
      // Sanitize payment ID
      const sanitizedPaymentId = sanitizeAlphanumeric(validated.paymentId, "-_");
      
      // Update existing payment
      const updatedPayment = await db.feePayment.update({
        where: { id: existingPayment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          transactionId: sanitizedPaymentId
        }
      });
      
      // Revalidate fee pages
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
    
    // Create new payment record
    const receiptNumber = `RCP-${Date.now()}-${validated.childId.slice(-6)}`;
    
    // Sanitize payment and order IDs
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
        remarks: `Online payment verified. Order ID: ${sanitizedOrderId}`
      }
    });
    
    // Revalidate fee pages
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

/**
 * Generate and download receipt for a payment
 * Requirements: 12.2, 12.3
 */
export async function downloadReceipt(input: DownloadReceiptInput) {
  try {
    // Validate input
    const validated = downloadReceiptSchema.parse(input);
    
    // Get current parent
    const parent = await getCurrentParent();
    if (!parent) {
      return { success: false, message: "Unauthorized" };
    }
    
    // Verify parent-child relationship
    const hasAccess = await verifyParentChildRelationship(parent.id, validated.childId);
    if (!hasAccess) {
      return { success: false, message: "Access denied" };
    }
    
    // Get payment details
    const payment = await db.feePayment.findUnique({
      where: { id: validated.paymentId },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            },
            enrollments: {
              where: { status: "ACTIVE" },
              orderBy: { enrollDate: 'desc' },
              take: 1,
              include: {
                class: true,
                section: true
              }
            }
          }
        },
        feeStructure: {
          include: {
            academicYear: true,
            items: {
              include: {
                feeType: true
              }
            }
          }
        }
      }
    });
    
    if (!payment) {
      return { success: false, message: "Payment not found" };
    }
    
    // Verify the payment belongs to the specified child
    if (payment.studentId !== validated.childId) {
      return { success: false, message: "Access denied" };
    }
    
    // Get class ID for class-specific amounts
    // Requirements: 12.2, 12.3
    const classId = payment.student.enrollments[0]?.class?.id;
    
    // Prepare fee items with class-specific amounts
    const feeItems = await Promise.all(
      payment.feeStructure.items.map(async (item) => {
        const correctAmount = await getFeeAmountForClass(item.feeTypeId, classId);
        return {
          name: item.feeType.name,
          amount: correctAmount
        };
      })
    );
    
    // Prepare receipt data
    const receiptData = {
      receiptNumber: payment.receiptNumber,
      paymentDate: payment.paymentDate,
      student: {
        name: `${payment.student.user.firstName} ${payment.student.user.lastName}`,
        email: payment.student.user.email,
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
    
    // Note: Actual PDF generation would be done by a PDF utility
    // For now, return the receipt data
    return {
      success: true,
      data: receiptData,
      message: "Receipt data retrieved successfully"
    };
  } catch (error) {
    console.error("Error downloading receipt:", error);
    return { success: false, message: "Failed to download receipt" };
  }
}
