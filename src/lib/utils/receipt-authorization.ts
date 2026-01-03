/**
 * Authorization utilities for payment receipt operations
 * Implements requirements 10.3, 10.4, 10.5
 */

import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export interface AuthorizationResult {
  authorized: boolean;
  error?: string;
  statusCode?: number;
}

/**
 * Check if user can upload receipts
 * Only students and parents can upload receipts
 */
export async function canUploadReceipt(
  userId: string,
  role: UserRole
): Promise<AuthorizationResult> {
  if (role !== UserRole.STUDENT && role !== UserRole.PARENT) {
    return {
      authorized: false,
      error: "Only students and parents can upload receipts",
      statusCode: 403,
    };
  }

  return { authorized: true };
}

/**
 * Check if user can access a specific student's receipts
 * Students can only access their own receipts
 * Parents can only access their children's receipts
 * Admins can access all receipts
 */
export async function canAccessStudentReceipts(
  userId: string,
  role: UserRole,
  studentId: string
): Promise<AuthorizationResult> {
  // Admins can access all receipts
  if (role === UserRole.ADMIN) {
    return { authorized: true };
  }

  // Get the student record
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      parents: {
        include: {
          parent: true
        }
      },
    },
  });

  if (!student) {
    return {
      authorized: false,
      error: "Student not found",
      statusCode: 404,
    };
  }

  // Students can only access their own receipts
  if (role === UserRole.STUDENT) {
    if (student.userId !== userId) {
      return {
        authorized: false,
        error: "You can only view your own receipts",
        statusCode: 403,
      };
    }
    return { authorized: true };
  }

  // Parents can only access their children's receipts
  if (role === UserRole.PARENT) {
    const isParent = student.parents.some(sp => sp.parent.userId === userId);
    if (!isParent) {
      return {
        authorized: false,
        error: "You can only view receipts for your children",
        statusCode: 403,
      };
    }
    return { authorized: true };
  }

  // Other roles cannot access receipts
  return {
    authorized: false,
    error: "Unauthorized to view receipts",
    statusCode: 403,
  };
}

/**
 * Check if user can access a specific receipt
 * Students can only access their own receipts
 * Parents can only access their children's receipts
 * Admins can access all receipts
 */
export async function canAccessReceipt(
  userId: string,
  role: UserRole,
  receiptId: string
): Promise<AuthorizationResult> {
  // Admins can access all receipts
  if (role === UserRole.ADMIN) {
    return { authorized: true };
  }

  // Get the receipt with student information
  const receipt = await db.paymentReceipt.findUnique({
    where: { id: receiptId },
    include: {
      student: {
        include: {
          parents: {
            include: {
              parent: true
            }
          },
        },
      },
    },
  });

  if (!receipt) {
    return {
      authorized: false,
      error: "Receipt not found",
      statusCode: 404,
    };
  }

  // Students can only access their own receipts
  if (role === UserRole.STUDENT) {
    if (receipt.student.userId !== userId) {
      return {
        authorized: false,
        error: "You do not have permission to view this receipt",
        statusCode: 403,
      };
    }
    return { authorized: true };
  }

  // Parents can only access their children's receipts
  if (role === UserRole.PARENT) {
    const isParent = receipt.student.parents.some(sp => sp.parent.userId === userId);
    if (!isParent) {
      return {
        authorized: false,
        error: "You do not have permission to view this receipt",
        statusCode: 403,
      };
    }
    return { authorized: true };
  }

  // Other roles cannot access receipts
  return {
    authorized: false,
    error: "Unauthorized to view this receipt",
    statusCode: 403,
  };
}

/**
 * Check if user can verify/reject receipts
 * Only admins can verify or reject receipts
 */
export async function canVerifyReceipts(
  userId: string,
  role: UserRole
): Promise<AuthorizationResult> {
  if (role !== UserRole.ADMIN) {
    return {
      authorized: false,
      error: "Only administrators can verify or reject receipts",
      statusCode: 403,
    };
  }

  return { authorized: true };
}

/**
 * Check if user can update payment configuration
 * Only admins can update payment configuration
 */
export async function canUpdatePaymentConfig(
  userId: string,
  role: UserRole
): Promise<AuthorizationResult> {
  if (role !== UserRole.ADMIN) {
    return {
      authorized: false,
      error: "Only administrators can update payment configuration",
      statusCode: 403,
    };
  }

  // Verify user has administrator record
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { administrator: true },
  });

  if (!user || !user.administrator) {
    return {
      authorized: false,
      error: "Unauthorized - Admin access required",
      statusCode: 403,
    };
  }

  return { authorized: true };
}
