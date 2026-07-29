"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { requireSchoolAccess } from "@/lib/auth/tenant";

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

    // Fetch receipt with student info for ownership + school scoping
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
    } else if (user.role === "ADMIN") {
      // Admin must belong to the same school as the receipt
      const { schoolId } = await requireSchoolAccess();
      if (!schoolId || receipt.schoolId !== schoolId) {
        return { success: false, error: "You do not have permission to view this receipt" };
      }
    } else {
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
    } else if (user.role === "ADMIN") {
      // Admin must belong to the same school as the receipt
      const { schoolId } = await requireSchoolAccess();
      if (!schoolId || receipt.schoolId !== schoolId) {
        return { success: false, error: "You do not have permission to view this receipt" };
      }
    } else {
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
