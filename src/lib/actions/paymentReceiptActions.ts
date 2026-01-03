"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { ReceiptStatus } from "@prisma/client";
import { uploadToCloudinary } from "@/lib/cloudinary";
import {
  receiptUploadSchema,
  validateReceiptFile,
  type ReceiptUploadFormValues,
} from "@/lib/schemaValidation/paymentReceiptSchemaValidation";
import { sanitizeReceiptUploadData } from "@/lib/utils/input-sanitization";
import { rateLimitReceiptUpload } from "@/lib/utils/receipt-rate-limit";
import { getClientIp } from "@/lib/utils/rate-limit";
import { logReceiptUpload } from "@/lib/services/receipt-audit-service";

/**
 * Generate unique reference number for receipt
 * Format: RCP-YYYYMMDD-XXXX
 */
async function generateReferenceNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;

  // Get count of receipts created today
  const startOfDay = new Date(year, now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(year, now.getMonth(), now.getDate(), 23, 59, 59);

  const count = await db.paymentReceipt.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  const sequence = String(count + 1).padStart(4, "0");
  return `RCP-${dateStr}-${sequence}`;
}

/**
 * Upload a payment receipt
 * Implements requirements: 1.3, 1.4, 1.5, 2.1-2.5, 10.1
 * Security: Rate limiting, input sanitization, file validation
 */
export async function uploadPaymentReceipt(
  data: ReceiptUploadFormValues & { receiptImage: File }
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

    // Validate user is student or parent
    if (user.role !== "STUDENT" && user.role !== "PARENT") {
      return {
        success: false,
        error: "Only students and parents can upload receipts",
      };
    }

    // Apply rate limiting (10 uploads per hour per user)
    const rateLimitResult = await rateLimitReceiptUpload("server", user.id);
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: rateLimitResult.error || "Rate limit exceeded",
      };
    }

    // Validate receipt image file with comprehensive checks
    const fileValidation = await validateReceiptFile(data.receiptImage);
    if (!fileValidation.valid) {
      return { success: false, error: fileValidation.error };
    }

    // Sanitize user input to prevent XSS
    const sanitizedData = sanitizeReceiptUploadData({
      transactionRef: data.transactionRef,
      remarks: data.remarks,
      receiptImage: data.receiptImage,
    });

    // Validate form data
    const validation = receiptUploadSchema.safeParse({
      studentId: data.studentId,
      feeStructureId: data.feeStructureId,
      amount: data.amount,
      paymentDate: data.paymentDate,
      paymentMethod: data.paymentMethod,
      transactionRef: sanitizedData.transactionRef,
      remarks: sanitizedData.remarks,
    });

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || "Validation failed",
      };
    }

    // Verify student exists and user has access
    const student = await db.student.findUnique({
      where: { id: data.studentId },
      include: {
        parents: {
          include: {
            parent: true,
          },
        },
      },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    // Check authorization
    if (user.role === "STUDENT") {
      if (student.userId !== user.id) {
        return {
          success: false,
          error: "You can only upload receipts for yourself",
        };
      }
    } else if (user.role === "PARENT") {
      const isParent = student.parents.some(sp => sp.parent.userId === user.id);
      if (!isParent) {
        return {
          success: false,
          error: "You can only upload receipts for your children",
        };
      }
    }

    // Verify fee structure exists
    const feeStructure = await db.feeStructure.findUnique({
      where: { id: data.feeStructureId },
    });

    if (!feeStructure) {
      return { success: false, error: "Fee structure not found" };
    }

    // Upload receipt image to Cloudinary with enhanced security
    // Requirement 10.1: Secure storage with HTTPS and folder structure
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const folder = `receipts/${year}/${month}`;

    let uploadResult;
    try {
      uploadResult = await uploadToCloudinary(data.receiptImage, {
        folder,
        resource_type: "auto",
        secure: true, // Force HTTPS only
      });
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      return {
        success: false,
        error: "Failed to upload receipt image. Please try again.",
      };
    }

    // Generate unique reference number
    const referenceNumber = await generateReferenceNumber();

    // Create payment receipt record with sanitized data
    const receipt = await db.paymentReceipt.create({
      data: {
        studentId: data.studentId,
        feeStructureId: data.feeStructureId,
        amount: data.amount,
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod,
        transactionRef: sanitizedData.transactionRef,
        remarks: sanitizedData.remarks,
        receiptImageUrl: uploadResult.secure_url,
        receiptPublicId: uploadResult.public_id,
        status: ReceiptStatus.PENDING_VERIFICATION,
        referenceNumber,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
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

    // Revalidate relevant paths
    revalidatePath("/student/fees");
    revalidatePath("/parent/fees");
    revalidatePath("/admin/finance/receipt-verification");

    // Log audit trail
    try {
      await logReceiptUpload(
        user.id,
        receipt.id,
        {
          referenceNumber: receipt.referenceNumber,
          amount: receipt.amount,
          paymentMethod: receipt.paymentMethod,
          studentId: receipt.studentId,
        }
      );
    } catch (auditError) {
      // Log error but don't fail the operation
      console.error("Failed to log receipt upload:", auditError);
    }

    return {
      success: true,
      data: receipt,
      referenceNumber,
    };
  } catch (error) {
    console.error("Error uploading payment receipt:", error);
    return {
      success: false,
      error: "Failed to upload payment receipt. Please try again.",
    };
  }
}

/**
 * Get receipts for a student with optional filters
 */
export async function getStudentReceipts(
  studentId: string,
  filters?: {
    status?: ReceiptStatus;
    dateFrom?: Date;
    dateTo?: Date;
  }
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

    // Verify student exists
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        parents: {
          include: {
            parent: true,
          },
        },
      },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    // Check authorization
    if (user.role === "STUDENT") {
      if (student.userId !== user.id) {
        return {
          success: false,
          error: "You can only view your own receipts",
        };
      }
    } else if (user.role === "PARENT") {
      const isParent = student.parents.some(sp => sp.parent.userId === user.id);
      if (!isParent) {
        return {
          success: false,
          error: "You can only view receipts for your children",
        };
      }
    } else if (user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized to view receipts",
      };
    }

    // Build where clause
    const where: any = {
      studentId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    // Fetch receipts
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
        createdAt: "desc",
      },
    });

    return { success: true, data: receipts };
  } catch (error) {
    console.error("Error fetching student receipts:", error);
    return {
      success: false,
      error: "Failed to fetch receipts",
    };
  }
}

/**
 * Get a single receipt by ID with authorization check
 */
export async function getReceiptById(receiptId: string) {
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

    // Fetch receipt
    const receipt = await db.paymentReceipt.findUnique({
      where: { id: receiptId },
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
            parents: {
              include: {
                parent: true,
              },
            },
          },
        },
        feeStructure: {
          include: {
            academicYear: true,
            items: {
              include: {
                feeType: true,
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
    });

    if (!receipt) {
      return { success: false, error: "Receipt not found" };
    }

    // Check authorization
    if (user.role === "STUDENT") {
      if (receipt.student.userId !== user.id) {
        return {
          success: false,
          error: "You do not have permission to view this receipt",
        };
      }
    } else if (user.role === "PARENT") {
      const isParent = receipt.student.parents.some(sp => sp.parent.userId === user.id);
      if (!isParent) {
        return {
          success: false,
          error: "You do not have permission to view this receipt",
        };
      }
    } else if (user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized to view this receipt",
      };
    }

    return { success: true, data: receipt };
  } catch (error) {
    console.error("Error fetching receipt:", error);
    return {
      success: false,
      error: "Failed to fetch receipt",
    };
  }
}

/**
 * Get a receipt by reference number
 */
export async function getReceiptByReference(referenceNumber: string) {
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

    // Fetch receipt
    const receipt = await db.paymentReceipt.findUnique({
      where: { referenceNumber },
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
            parents: {
              include: {
                parent: true,
              },
            },
          },
        },
        feeStructure: {
          select: {
            name: true,
          },
        },
        feePayment: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!receipt) {
      return { success: false, error: "Receipt not found" };
    }

    // Check authorization
    if (user.role === "STUDENT") {
      if (receipt.student.userId !== user.id) {
        return {
          success: false,
          error: "You do not have permission to view this receipt",
        };
      }
    } else if (user.role === "PARENT") {
      const isParent = receipt.student.parents.some((sp: { parent: { userId: string } }) => sp.parent.userId === user.id);
      if (!isParent) {
        return {
          success: false,
          error: "You do not have permission to view this receipt",
        };
      }
    } else if (user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized to view this receipt",
      };
    }

    return { success: true, data: receipt };
  } catch (error) {
    console.error("Error fetching receipt by reference:", error);
    return {
      success: false,
      error: "Failed to fetch receipt",
    };
  }
}
