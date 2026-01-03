"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { ReceiptStatus, PaymentStatus, PaymentSource } from "@prisma/client";
import { sanitizeRejectionReason } from "@/lib/utils/input-sanitization";
import { rateLimitVerification } from "@/lib/utils/receipt-rate-limit";
import {
  logReceiptVerification,
  logReceiptRejection,
  logBulkVerification,
  logBulkRejection,
} from "@/lib/services/receipt-audit-service";

/**
 * Get pending receipts for admin verification with pagination and sorting
 * Requirements: 4.1, 4.2, 4.4
 */
export async function getPendingReceipts(filters?: {
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}) {
  try {
    // Get authenticated user
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Find user in database
    const user = await db.user.findFirst({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if user is admin
    if (user.role !== "ADMIN") {
      return {
        success: false,
        error: "Only administrators can view pending receipts",
      };
    }

    // Build where clause
    const where: any = {
      status: ReceiptStatus.PENDING_VERIFICATION,
    };

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    // Fetch pending receipts with student and fee structure details
    // Sort by createdAt ascending (oldest first) as per requirement 4.4
    const receipts = await db.paymentReceipt.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            enrollments: {
              where: {
                status: "ACTIVE",
              },
              take: 1,
              include: {
                class: true,
                section: true,
              },
            },
          },
        },
        feeStructure: {
          select: {
            id: true,
            name: true,
            academicYear: {
              select: {
                name: true,
              },
            },
            items: {
              select: {
                amount: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc", // Oldest first
      },
      skip: filters?.offset || 0,
      take: filters?.limit || 50,
    });

    return { success: true, data: receipts };
  } catch (error) {
    console.error("Error fetching pending receipts:", error);
    return {
      success: false,
      error: "Failed to fetch pending receipts",
    };
  }
}

/**
 * Get verification statistics for dashboard
 * Requirements: 4.1, 4.2
 */
export async function getVerificationStats() {
  try {
    // Get authenticated user
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Find user in database
    const user = await db.user.findFirst({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if user is admin
    if (user.role !== "ADMIN") {
      return {
        success: false,
        error: "Only administrators can view verification statistics",
      };
    }

    // Get counts for each status
    const [pendingCount, verifiedCount, rejectedCount, pendingReceipts] =
      await Promise.all([
        db.paymentReceipt.count({
          where: { status: ReceiptStatus.PENDING_VERIFICATION },
        }),
        db.paymentReceipt.count({
          where: { status: ReceiptStatus.VERIFIED },
        }),
        db.paymentReceipt.count({
          where: { status: ReceiptStatus.REJECTED },
        }),
        db.paymentReceipt.findMany({
          where: { status: ReceiptStatus.PENDING_VERIFICATION },
          select: {
            amount: true,
          },
        }),
      ]);

    // Calculate total pending amount
    const totalAmount = pendingReceipts.reduce(
      (sum, receipt) => sum + receipt.amount,
      0
    );

    return {
      success: true,
      data: {
        pendingCount,
        verifiedCount,
        rejectedCount,
        totalAmount,
      },
    };
  } catch (error) {
    console.error("Error fetching verification stats:", error);
    return {
      success: false,
      error: "Failed to fetch verification statistics",
    };
  }
}

/**
 * Verify a receipt and create payment record
 * Requirements: 5.2, 5.3, 9.1
 * Security: Rate limiting, admin authorization
 */
export async function verifyReceipt(receiptId: string) {
  try {
    // Get authenticated user
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Find user in database
    const user = await db.user.findFirst({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if user is admin
    if (user.role !== "ADMIN") {
      return {
        success: false,
        error: "Only administrators can verify receipts",
      };
    }

    // Apply rate limiting (100 verifications per hour per admin)
    const rateLimitResult = await rateLimitVerification(user.id);
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: rateLimitResult.error || "Rate limit exceeded",
      };
    }

    // Use transaction for atomicity
    const result = await db.$transaction(async (tx) => {
      // Fetch receipt with related data
      const receipt = await tx.paymentReceipt.findUnique({
        where: { id: receiptId },
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          feeStructure: {
            select: {
              id: true,
              name: true,
              items: {
                select: {
                  amount: true,
                },
              },
            },
          },
        },
      });

      if (!receipt) {
        throw new Error("Receipt not found");
      }

      // Validate receipt is in PENDING_VERIFICATION status
      if (receipt.status !== ReceiptStatus.PENDING_VERIFICATION) {
        throw new Error(
          `Receipt cannot be verified. Current status: ${receipt.status}`
        );
      }

      // Create FeePayment record with COMPLETED status and RECEIPT_UPLOAD source
      const feePayment = await tx.feePayment.create({
        data: {
          studentId: receipt.studentId,
          feeStructureId: receipt.feeStructureId,
          amount: receipt.amount,
          paidAmount: receipt.amount,
          balance: 0,
          paymentDate: receipt.paymentDate,
          paymentMethod: receipt.paymentMethod,
          transactionId: receipt.transactionRef || null,
          receiptNumber: receipt.referenceNumber,
          status: PaymentStatus.COMPLETED,
          paymentSource: PaymentSource.RECEIPT_UPLOAD,
          remarks: receipt.remarks || null,
        },
      });

      // Update receipt status to VERIFIED and link to payment
      const updatedReceipt = await tx.paymentReceipt.update({
        where: { id: receiptId },
        data: {
          status: ReceiptStatus.VERIFIED,
          verifiedBy: user.id,
          verifiedAt: new Date(),
          feePaymentId: feePayment.id,
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          feeStructure: {
            select: {
              name: true,
            },
          },
        },
      });

      // Get updated fee balance for the student
      const feeBalance = await tx.feePayment.aggregate({
        where: {
          studentId: receipt.studentId,
          feeStructureId: receipt.feeStructureId,
        },
        _sum: {
          paidAmount: true,
        },
      });

      const totalPaid = feeBalance._sum.paidAmount || 0;
      const totalFeeAmount = receipt.feeStructure.items.reduce((sum, item) => sum + item.amount, 0);
      const remainingBalance = totalFeeAmount - totalPaid;

      // Note: Notification will be sent after transaction completes
      // to avoid blocking the transaction if notification fails

      return {
        receipt: updatedReceipt,
        payment: feePayment,
        remainingBalance,
      };
    });

    // Revalidate relevant paths
    revalidatePath("/admin/finance/receipt-verification");
    revalidatePath("/student/fees");
    revalidatePath("/parent/fees");

    // Send notifications after successful transaction
    // Requirement 9.1: Notify on verification
    // Requirement 9.3: Use user's preferred notification method
    try {
      const { sendVerificationSuccessNotification, notifyParentIfApplicable } = await import(
        "@/lib/services/receipt-notification-service"
      );

      const notificationData = {
        studentName: `${result.receipt.student.user.firstName} ${result.receipt.student.user.lastName}`,
        receiptReference: result.receipt.referenceNumber,
        feeStructureName: result.receipt.feeStructure.name,
        amount: result.receipt.amount,
        remainingBalance: result.remainingBalance,
        paymentDate: result.receipt.paymentDate.toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      };

      // Send notification to student
      await sendVerificationSuccessNotification(
        result.receipt.student.user.id,
        result.receipt.student.user.email,
        notificationData
      );

      // Send notification to parent if applicable
      await notifyParentIfApplicable(
        result.receipt.studentId,
        (parentUserId, parentEmail) =>
          sendVerificationSuccessNotification(parentUserId, parentEmail, notificationData)
      );
    } catch (notificationError) {
      // Log error but don't fail the operation
      console.error("Failed to send verification notifications:", notificationError);
    }

    // Log audit trail
    try {
      await logReceiptVerification(
        user.id,
        receiptId,
        {
          referenceNumber: result.receipt.referenceNumber,
          studentId: result.receipt.studentId,
          amount: result.receipt.amount,
        }
      );
    } catch (auditError) {
      // Log error but don't fail the operation
      console.error("Failed to log receipt verification:", auditError);
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error verifying receipt:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to verify receipt. Please try again.",
    };
  }
}

/**
 * Reject a receipt with reason
 * Requirements: 5.4, 5.5, 9.2
 * Security: Rate limiting, input sanitization, admin authorization
 */
export async function rejectReceipt(
  receiptId: string,
  rejectionReason: string
) {
  try {
    // Get authenticated user
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Find user in database
    const user = await db.user.findFirst({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if user is admin
    if (user.role !== "ADMIN") {
      return {
        success: false,
        error: "Only administrators can reject receipts",
      };
    }

    // Apply rate limiting (100 rejections per hour per admin)
    const rateLimitResult = await rateLimitVerification(user.id);
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: rateLimitResult.error || "Rate limit exceeded",
      };
    }

    // Validate and sanitize rejection reason
    let sanitizedReason: string;
    try {
      sanitizedReason = sanitizeRejectionReason(rejectionReason);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Invalid rejection reason",
      };
    }

    // Fetch receipt with related data
    const receipt = await db.paymentReceipt.findUnique({
      where: { id: receiptId },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        feeStructure: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!receipt) {
      return { success: false, error: "Receipt not found" };
    }

    // Validate receipt is in PENDING_VERIFICATION status
    if (receipt.status !== ReceiptStatus.PENDING_VERIFICATION) {
      return {
        success: false,
        error: `Receipt cannot be rejected. Current status: ${receipt.status}`,
      };
    }

    // Update receipt status to REJECTED with sanitized reason
    const updatedReceipt = await db.paymentReceipt.update({
      where: { id: receiptId },
      data: {
        status: ReceiptStatus.REJECTED,
        verifiedBy: user.id, // Record who rejected it
        verifiedAt: new Date(),
        rejectionReason: sanitizedReason,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        feeStructure: {
          select: {
            name: true,
          },
        },
      },
    });

    // Create notification for student/parent with reason
    // This will be replaced with the new notification service below
    // Keeping this as fallback in case the new service fails

    // Revalidate relevant paths
    revalidatePath("/admin/finance/receipt-verification");
    revalidatePath("/student/fees");
    revalidatePath("/parent/fees");

    // Send notifications after successful update
    // Requirement 9.2: Notify on rejection with reason
    // Requirement 9.3: Use user's preferred notification method
    try {
      const { sendRejectionNotification, notifyParentIfApplicable } = await import(
        "@/lib/services/receipt-notification-service"
      );

      const notificationData = {
        studentName: `${updatedReceipt.student.user.firstName} ${updatedReceipt.student.user.lastName}`,
        receiptReference: updatedReceipt.referenceNumber,
        feeStructureName: updatedReceipt.feeStructure.name,
        amount: updatedReceipt.amount,
        rejectionReason: sanitizedReason,
        paymentDate: updatedReceipt.paymentDate.toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      };

      // Send notification to student
      await sendRejectionNotification(
        updatedReceipt.student.user.id,
        updatedReceipt.student.user.email,
        notificationData
      );

      // Send notification to parent if applicable
      await notifyParentIfApplicable(
        updatedReceipt.studentId,
        (parentUserId, parentEmail) =>
          sendRejectionNotification(parentUserId, parentEmail, notificationData)
      );
    } catch (notificationError) {
      // Log error but don't fail the operation
      console.error("Failed to send rejection notifications:", notificationError);
    }

    // Log audit trail
    try {
      await logReceiptRejection(
        user.id,
        receiptId,
        {
          referenceNumber: updatedReceipt.referenceNumber,
          studentId: updatedReceipt.studentId,
          amount: updatedReceipt.amount,
        },
        sanitizedReason
      );
    } catch (auditError) {
      // Log error but don't fail the operation
      console.error("Failed to log receipt rejection:", auditError);
    }

    return {
      success: true,
      data: updatedReceipt,
    };
  } catch (error) {
    console.error("Error rejecting receipt:", error);
    return {
      success: false,
      error: "Failed to reject receipt. Please try again.",
    };
  }
}

/**
 * Get verified receipts for admin with pagination
 */
export async function getVerifiedReceipts(filters?: {
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}) {
  try {
    // Get authenticated user
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Find user in database
    const user = await db.user.findFirst({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if user is admin
    if (user.role !== "ADMIN") {
      return {
        success: false,
        error: "Only administrators can view verified receipts",
      };
    }

    // Build where clause
    const where: any = {
      status: ReceiptStatus.VERIFIED,
    };

    if (filters?.dateFrom || filters?.dateTo) {
      where.verifiedAt = {};
      if (filters.dateFrom) {
        where.verifiedAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.verifiedAt.lte = filters.dateTo;
      }
    }

    // Fetch verified receipts
    const receipts = await db.paymentReceipt.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            enrollments: {
              where: {
                status: "ACTIVE",
              },
              take: 1,
              include: {
                class: true,
                section: true,
              },
            },
          },
        },
        feeStructure: {
          select: {
            id: true,
            name: true,
            items: {
              select: {
                amount: true,
              },
            },
          },
        },
        feePayment: {
          select: {
            id: true,
            status: true,
            paidAmount: true,
          },
        },
      },
      orderBy: {
        verifiedAt: "desc", // Most recent first
      },
      skip: filters?.offset || 0,
      take: filters?.limit || 50,
    });

    return { success: true, data: receipts };
  } catch (error) {
    console.error("Error fetching verified receipts:", error);
    return {
      success: false,
      error: "Failed to fetch verified receipts",
    };
  }
}

/**
 * Get rejected receipts for admin with pagination
 */
export async function getRejectedReceipts(filters?: {
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}) {
  try {
    // Get authenticated user
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Find user in database
    const user = await db.user.findFirst({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if user is admin
    if (user.role !== "ADMIN") {
      return {
        success: false,
        error: "Only administrators can view rejected receipts",
      };
    }

    // Build where clause
    const where: any = {
      status: ReceiptStatus.REJECTED,
    };

    if (filters?.dateFrom || filters?.dateTo) {
      where.verifiedAt = {};
      if (filters.dateFrom) {
        where.verifiedAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.verifiedAt.lte = filters.dateTo;
      }
    }

    // Fetch rejected receipts
    const receipts = await db.paymentReceipt.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            enrollments: {
              where: {
                status: "ACTIVE",
              },
              take: 1,
              include: {
                class: true,
                section: true,
              },
            },
          },
        },
        feeStructure: {
          select: {
            id: true,
            name: true,
            items: {
              select: {
                amount: true,
              },
            },
          },
        },
      },
      orderBy: {
        verifiedAt: "desc", // Most recent first
      },
      skip: filters?.offset || 0,
      take: filters?.limit || 50,
    });

    return { success: true, data: receipts };
  } catch (error) {
    console.error("Error fetching rejected receipts:", error);
    return {
      success: false,
      error: "Failed to fetch rejected receipts",
    };
  }
}


/**
 * Bulk verify multiple receipts
 * Requirements: Bulk operations for admin efficiency
 * Security: Rate limiting, admin authorization, transaction safety
 */
export async function bulkVerifyReceipts(receiptIds: string[]) {
  try {
    // Get authenticated user
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Find user in database
    const user = await db.user.findFirst({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if user is admin
    if (user.role !== "ADMIN") {
      return {
        success: false,
        error: "Only administrators can verify receipts",
      };
    }

    // Validate input
    if (!receiptIds || receiptIds.length === 0) {
      return { success: false, error: "No receipts selected" };
    }

    if (receiptIds.length > 50) {
      return { success: false, error: "Cannot verify more than 50 receipts at once" };
    }

    // Apply rate limiting
    const rateLimitResult = await rateLimitVerification(user.id);
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: rateLimitResult.error || "Rate limit exceeded",
      };
    }

    const results = {
      successful: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    // Process each receipt
    for (const receiptId of receiptIds) {
      try {
        const result = await db.$transaction(async (tx) => {
          // Fetch receipt
          const receipt = await tx.paymentReceipt.findUnique({
            where: { id: receiptId },
            include: {
              student: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },
                },
              },
              feeStructure: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });

          if (!receipt) {
            throw new Error("Receipt not found");
          }

          if (receipt.status !== ReceiptStatus.PENDING_VERIFICATION) {
            throw new Error("Receipt is not pending verification");
          }

          // Create payment record
          const payment = await tx.feePayment.create({
            data: {
              studentId: receipt.studentId,
              feeStructureId: receipt.feeStructureId,
              amount: receipt.amount,
              paidAmount: receipt.amount,
              paymentDate: receipt.paymentDate,
              paymentMethod: receipt.paymentMethod,
              transactionId: receipt.transactionRef || undefined,
              status: PaymentStatus.COMPLETED,
              paymentSource: PaymentSource.RECEIPT_UPLOAD,
              remarks: receipt.remarks || undefined,
            },
          });

          // Update receipt status
          await tx.paymentReceipt.update({
            where: { id: receiptId },
            data: {
              status: ReceiptStatus.VERIFIED,
              verifiedAt: new Date(),
              verifiedBy: user.id,
              feePaymentId: payment.id,
            },
          });

          return { receiptId, paymentId: payment.id };
        });

        results.successful.push(result.receiptId);
      } catch (error) {
        results.failed.push({
          id: receiptId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Revalidate paths
    revalidatePath("/admin/finance/receipt-verification");
    revalidatePath("/student/fees");
    revalidatePath("/parent/fees");

    // Log audit trail for bulk operation
    try {
      await logBulkVerification(
        user.id,
        receiptIds,
        results.successful.length,
        results.failed.length
      );
    } catch (auditError) {
      console.error("Failed to log bulk verification:", auditError);
    }

    return {
      success: true,
      data: results,
      message: `Verified ${results.successful.length} receipts. ${results.failed.length} failed.`,
    };
  } catch (error) {
    console.error("Error in bulk verify receipts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to verify receipts",
    };
  }
}

/**
 * Bulk reject multiple receipts
 * Requirements: Bulk operations for admin efficiency
 * Security: Rate limiting, input sanitization, admin authorization
 */
export async function bulkRejectReceipts(
  receiptIds: string[],
  rejectionReason: string
) {
  try {
    // Get authenticated user
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Find user in database
    const user = await db.user.findFirst({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if user is admin
    if (user.role !== "ADMIN") {
      return {
        success: false,
        error: "Only administrators can reject receipts",
      };
    }

    // Validate input
    if (!receiptIds || receiptIds.length === 0) {
      return { success: false, error: "No receipts selected" };
    }

    if (receiptIds.length > 50) {
      return { success: false, error: "Cannot reject more than 50 receipts at once" };
    }

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return { success: false, error: "Rejection reason is required" };
    }

    // Sanitize rejection reason
    const sanitizedReason = sanitizeRejectionReason(rejectionReason);

    // Apply rate limiting
    const rateLimitResult = await rateLimitVerification(user.id);
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: rateLimitResult.error || "Rate limit exceeded",
      };
    }

    const results = {
      successful: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    // Process each receipt
    for (const receiptId of receiptIds) {
      try {
        const receipt = await db.paymentReceipt.findUnique({
          where: { id: receiptId },
        });

        if (!receipt) {
          throw new Error("Receipt not found");
        }

        if (receipt.status !== ReceiptStatus.PENDING_VERIFICATION) {
          throw new Error("Receipt is not pending verification");
        }

        // Update receipt status
        await db.paymentReceipt.update({
          where: { id: receiptId },
          data: {
            status: ReceiptStatus.REJECTED,
            verifiedAt: new Date(),
            verifiedBy: user.id,
            rejectionReason: sanitizedReason,
          },
        });

        results.successful.push(receiptId);
      } catch (error) {
        results.failed.push({
          id: receiptId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Revalidate paths
    revalidatePath("/admin/finance/receipt-verification");
    revalidatePath("/student/fees");
    revalidatePath("/parent/fees");

    // Log audit trail for bulk operation
    try {
      await logBulkRejection(
        user.id,
        receiptIds,
        sanitizedReason,
        results.successful.length,
        results.failed.length
      );
    } catch (auditError) {
      console.error("Failed to log bulk rejection:", auditError);
    }

    return {
      success: true,
      data: results,
      message: `Rejected ${results.successful.length} receipts. ${results.failed.length} failed.`,
    };
  } catch (error) {
    console.error("Error in bulk reject receipts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject receipts",
    };
  }
}

