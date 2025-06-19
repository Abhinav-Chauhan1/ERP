"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserRole, PaymentMethod, PaymentStatus } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";

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
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    return null;
  }
  
  // Get user from database
  const dbUser = await db.user.findUnique({
    where: {
      clerkId: clerkUser.id
    }
  });
  
  if (!dbUser || dbUser.role !== UserRole.STUDENT) {
    return null;
  }
  
  const student = await db.student.findUnique({
    where: {
      userId: dbUser.id
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

  // Get fee structure for this student's class
  const feeStructure = await db.feeStructure.findFirst({
    where: {
      academicYearId,
      applicableClasses: {
        contains: currentEnrollment?.class?.name
      },
      isActive: true
    },
    include: {
      items: {
        include: {
          feeType: true
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

  // Calculate total fees, paid amount, and balance
  const totalFees = feeStructure?.items.reduce((sum, item) => sum + item.amount, 0) || 0;
  const paidAmount = feePayments.reduce((sum, payment) => sum + payment.paidAmount, 0);
  const balance = totalFees - paidAmount;
  const paymentPercentage = totalFees > 0 ? (paidAmount / totalFees) * 100 : 0;
  
  // Get upcoming fees
  const now = new Date();
  const upcomingFees = feeStructure?.items
    .filter(item => item.dueDate && new Date(item.dueDate) > now)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 3) || [];
  
  // Get overdue fees
  const overdueFees = feeStructure?.items
    .filter(item => item.dueDate && new Date(item.dueDate) < now)
    .filter(item => {
      const paymentForItem = feePayments.find(payment => 
        payment.amount === item.amount && payment.status === PaymentStatus.COMPLETED
      );
      return !paymentForItem;
    }) || [];

  return {
    student,
    feeStructure,
    feePayments,
    totalFees,
    paidAmount,
    balance,
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

  // Get fee structure for this student's class
  const feeStructure = await db.feeStructure.findFirst({
    where: {
      academicYearId,
      applicableClasses: {
        contains: currentEnrollment?.class?.name
      },
      isActive: true
    },
    include: {
      items: {
        include: {
          feeType: true
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

  // Find which fees are due
  const now = new Date();
  const dueItems = feeStructure.items.filter(item => {
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

  // Calculate total due amount
  const totalDue = dueItems.reduce((sum, item) => sum + item.amount, 0);

  return {
    student,
    duePayments: dueItems,
    feeStructure,
    totalDue
  };
}

/**
 * Make a fee payment
 */
export async function makePayment(feeItemId: string, paymentData: z.infer<typeof paymentSchema>) {
  const student = await getCurrentStudent();
  
  if (!student) {
    return { success: false, message: "Authentication required" };
  }
  
  try {
    // Validate data
    const validatedData = paymentSchema.parse(paymentData);
    
    // Get the fee item
    const feeItem = await db.feeStructureItem.findUnique({
      where: { id: feeItemId },
      include: { feeStructure: true }
    });
    
    if (!feeItem) {
      return { success: false, message: "Fee item not found" };
    }
    
    // Check if already paid
    const existingPayment = await db.feePayment.findFirst({
      where: {
        studentId: student.id,
        feeStructureId: feeItem.feeStructureId,
        amount: feeItem.amount,
        status: PaymentStatus.COMPLETED
      }
    });
    
    if (existingPayment) {
      return { success: false, message: "This fee has already been paid" };
    }
    
    // Create payment record
    const payment = await db.feePayment.create({
      data: {
        studentId: student.id,
        feeStructureId: feeItem.feeStructureId,
        amount: feeItem.amount,
        paidAmount: validatedData.amount,
        balance: feeItem.amount - validatedData.amount,
        paymentDate: new Date(),
        paymentMethod: validatedData.paymentMethod as PaymentMethod,
        transactionId: validatedData.transactionId,
        status: validatedData.amount >= feeItem.amount 
          ? PaymentStatus.COMPLETED 
          : PaymentStatus.PARTIAL,
        remarks: validatedData.remarks
      }
    });
    
    // Create notification
    await db.notification.create({
      data: {
        userId: student.userId,
        title: "Fee Payment Recorded",
        message: `Your payment of $${validatedData.amount} has been recorded and is pending verification.`,
        type: "INFO"
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
        status: "Pending"
      }
    });
    
    // Create notification
    await db.notification.create({
      data: {
        userId: student.userId,
        title: "Scholarship Application Submitted",
        message: `Your application for ${scholarship.name} has been submitted and is pending approval.`,
        type: "INFO"
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
