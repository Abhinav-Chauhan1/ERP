"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { PaymentStatus, PaymentMethod, PermissionAction } from "@prisma/client";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/utils/permissions";
import { sendFeeReminder } from "@/lib/services/communication-service";
import { getReceiptHTML } from "@/lib/utils/pdf-generator";
import { format } from "date-fns";

// Helper to check permission and throw if denied
async function checkPermission(resource: string, action: PermissionAction, errorMessage?: string) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error('Unauthorized: You must be logged in');
  }

  const allowed = await hasPermission(userId, resource, action);
  if (!allowed) {
    throw new Error(errorMessage || `Permission denied: Cannot ${action} ${resource}`);
  }

  return userId;
}

// Get all fee payments with filters
export async function getFeePayments(filters?: {
  studentId?: string;
  status?: PaymentStatus;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}) {
  try {
    const where: any = {};

    if (filters?.studentId) {
      where.studentId = filters.studentId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.paymentDate = {};
      if (filters.dateFrom) {
        where.paymentDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.paymentDate.lte = filters.dateTo;
      }
    }

    const payments = await db.feePayment.findMany({
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
              take: 1,
              orderBy: {
                enrollDate: "desc",
              },
              include: {
                class: true,
                section: true,
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
      },
      orderBy: {
        paymentDate: "desc",
      },
      take: filters?.limit,
      skip: filters?.offset,
    });

    return { success: true, data: payments };
  } catch (error) {
    console.error("Error fetching fee payments:", error);
    return { success: false, error: "Failed to fetch fee payments" };
  }
}

// Get single payment by ID
export async function getFeePaymentById(id: string) {
  try {
    const payment = await db.feePayment.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: true,
            enrollments: {
              take: 1,
              orderBy: {
                enrollDate: "desc",
              },
              include: {
                class: true,
                section: true,
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
      },
    });

    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    return { success: true, data: payment };
  } catch (error) {
    console.error("Error fetching payment:", error);
    return { success: false, error: "Failed to fetch payment" };
  }
}


// Record new payment
export async function recordPayment(data: any) {
  try {
    // Permission check: require PAYMENT:CREATE
    await checkPermission('PAYMENT', 'CREATE', 'You do not have permission to record payments');

    const payment = await db.feePayment.create({
      data: {
        studentId: data.studentId,
        feeStructureId: data.feeStructureId,
        amount: parseFloat(data.amount),
        paidAmount: parseFloat(data.paidAmount),
        balance: parseFloat(data.amount) - parseFloat(data.paidAmount),
        paymentDate: new Date(data.paymentDate),
        paymentMethod: data.paymentMethod as PaymentMethod,
        transactionId: data.transactionId || null,
        receiptNumber: data.receiptNumber || null,
        status: data.status as PaymentStatus,
        remarks: data.remarks || null,
      },
      include: {
        student: {
          include: {
            user: true,
            parents: {
              include: {
                parent: true,
              },
            },
          },
        },
        feeStructure: true,
      },
    });

    // Send fee payment confirmation notification
    // Requirements: 7.3, 7.4, 7.5
    if (payment.status === PaymentStatus.COMPLETED || payment.status === PaymentStatus.PARTIAL) {
      try {
        // Calculate outstanding balance for this student
        const allPayments = await db.feePayment.findMany({
          where: { studentId: data.studentId },
        });

        const totalOutstanding = allPayments.reduce((sum, p) => sum + p.balance, 0);

        // Send notification to all parents
        for (const parentRelation of payment.student.parents) {
          await sendFeeReminder({
            studentId: payment.studentId,
            studentName: `${payment.student.user.firstName} ${payment.student.user.lastName}`,
            amount: payment.paidAmount,
            dueDate: payment.paymentDate,
            isOverdue: false,
            outstandingBalance: totalOutstanding,
            parentId: parentRelation.parentId,
          }).catch(error => {
            console.error('Failed to send fee confirmation notification:', error);
          });
        }
      } catch (notificationError) {
        console.error('Error sending fee confirmation notification:', notificationError);
      }
    }

    revalidatePath("/admin/finance/payments");
    return { success: true, data: payment };
  } catch (error) {
    console.error("Error recording payment:", error);
    return { success: false, error: "Failed to record payment" };
  }
}

// Update existing payment
export async function updatePayment(id: string, data: any) {
  try {
    // Permission check: require PAYMENT:UPDATE
    await checkPermission('PAYMENT', 'UPDATE', 'You do not have permission to update payments');

    const payment = await db.feePayment.update({
      where: { id },
      data: {
        amount: parseFloat(data.amount),
        paidAmount: parseFloat(data.paidAmount),
        balance: parseFloat(data.amount) - parseFloat(data.paidAmount),
        paymentDate: new Date(data.paymentDate),
        paymentMethod: data.paymentMethod as PaymentMethod,
        transactionId: data.transactionId || null,
        receiptNumber: data.receiptNumber || null,
        status: data.status as PaymentStatus,
        remarks: data.remarks || null,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        feeStructure: true,
      },
    });

    revalidatePath("/admin/finance/payments");
    return { success: true, data: payment };
  } catch (error) {
    console.error("Error updating payment:", error);
    return { success: false, error: "Failed to update payment" };
  }
}

// Delete payment
export async function deletePayment(id: string) {
  try {
    // Permission check: require PAYMENT:DELETE
    await checkPermission('PAYMENT', 'DELETE', 'You do not have permission to delete payments');

    await db.feePayment.delete({
      where: { id },
    });

    revalidatePath("/admin/finance/payments");
    return { success: true };
  } catch (error) {
    console.error("Error deleting payment:", error);
    return { success: false, error: "Failed to delete payment" };
  }
}

// Get pending fees for students
export async function getPendingFees(filters?: {
  studentId?: string;
  classId?: string;
  limit?: number;
}) {
  try {
    // Get all students with their enrollments and fee structures
    const where: any = {};

    if (filters?.studentId) {
      where.id = filters.studentId;
    }

    if (filters?.classId) {
      where.enrollments = {
        some: {
          classId: filters.classId,
          status: "ACTIVE",
        },
      };
    }

    const students = await db.student.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        enrollments: {
          where: {
            status: "ACTIVE",
          },
          include: {
            class: {
              include: {
                academicYear: true,
              },
            },
            section: true,
          },
        },
        feePayments: {
          include: {
            feeStructure: true,
          },
        },
      },
      take: filters?.limit,
    });

    // Calculate pending fees for each student
    const pendingFees = [];

    for (const student of students) {
      const enrollment = student.enrollments[0];
      if (!enrollment) continue;

      // Get applicable fee structure
      const feeStructure = await db.feeStructure.findFirst({
        where: {
          academicYearId: enrollment.class.academicYearId,
          isActive: true,
          OR: [
            { applicableClasses: null },
            { applicableClasses: { contains: enrollment.class.name } },
          ],
        },
        include: {
          items: {
            include: {
              feeType: true,
            },
          },
        },
      });

      if (!feeStructure) continue;

      // Calculate total fee amount
      const totalAmount = feeStructure.items.reduce(
        (sum, item) => sum + item.amount,
        0
      );

      // Calculate total paid
      const totalPaid = student.feePayments
        .filter((payment) => payment.feeStructureId === feeStructure.id)
        .reduce((sum, payment) => sum + payment.paidAmount, 0);

      const balance = totalAmount - totalPaid;

      if (balance > 0) {
        pendingFees.push({
          studentId: student.id,
          studentName: `${student.user.firstName} ${student.user.lastName}`,
          admissionId: student.admissionId,
          class: enrollment.class.name,
          section: enrollment.section.name,
          totalAmount,
          totalPaid,
          balance,
          feeStructureId: feeStructure.id,
          feeStructureName: feeStructure.name,
        });
      }
    }

    return { success: true, data: pendingFees };
  } catch (error) {
    console.error("Error fetching pending fees:", error);
    return { success: false, error: "Failed to fetch pending fees" };
  }
}

// Get payment statistics
export async function getPaymentStats(filters?: {
  academicYearId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  try {
    const where: any = {};

    if (filters?.dateFrom || filters?.dateTo) {
      where.paymentDate = {};
      if (filters.dateFrom) {
        where.paymentDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.paymentDate.lte = filters.dateTo;
      }
    }

    const [totalPayments, completedPayments, pendingPayments, partialPayments] =
      await Promise.all([
        db.feePayment.count({ where }),
        db.feePayment.count({
          where: { ...where, status: "COMPLETED" },
        }),
        db.feePayment.count({
          where: { ...where, status: "PENDING" },
        }),
        db.feePayment.count({
          where: { ...where, status: "PARTIAL" },
        }),
      ]);

    const totalAmount = await db.feePayment.aggregate({
      where,
      _sum: {
        amount: true,
      },
    });

    const totalPaid = await db.feePayment.aggregate({
      where,
      _sum: {
        paidAmount: true,
      },
    });

    const totalBalance = await db.feePayment.aggregate({
      where,
      _sum: {
        balance: true,
      },
    });

    return {
      success: true,
      data: {
        totalPayments,
        completedPayments,
        pendingPayments,
        partialPayments,
        totalAmount: totalAmount._sum.amount || 0,
        totalPaid: totalPaid._sum.paidAmount || 0,
        totalBalance: totalBalance._sum.balance || 0,
        collectionRate:
          totalAmount._sum.amount && totalAmount._sum.amount > 0
            ? ((totalPaid._sum.paidAmount || 0) / totalAmount._sum.amount) * 100
            : 0,
      },
    };
  } catch (error) {
    console.error("Error fetching payment stats:", error);
    return { success: false, error: "Failed to fetch payment statistics" };
  }
}

// Get students for dropdown (for payment form)
export async function getStudentsForPayment() {
  try {
    const students = await db.student.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
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
      orderBy: {
        user: {
          firstName: "asc",
        },
      },
    });

    const formattedStudents = students.map((student) => ({
      id: student.id,
      name: `${student.user.firstName} ${student.user.lastName}`,
      admissionId: student.admissionId,
      class: student.enrollments[0]?.class.name || "N/A",
      section: student.enrollments[0]?.section.name || "N/A",
    }));

    return { success: true, data: formattedStudents };
  } catch (error) {
    console.error("Error fetching students:", error);
    return { success: false, error: "Failed to fetch students" };
  }
}

// Get fee structures for a student
export async function getFeeStructuresForStudent(studentId: string) {
  try {
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: {
            status: "ACTIVE",
          },
          include: {
            class: {
              include: {
                academicYear: true,
              },
            },
          },
        },
      },
    });

    if (!student || !student.enrollments[0]) {
      return { success: false, error: "Student not found or not enrolled" };
    }

    const enrollment = student.enrollments[0];

    const feeStructures = await db.feeStructure.findMany({
      where: {
        academicYearId: enrollment.class.academicYearId,
        isActive: true,
        OR: [
          { applicableClasses: null },
          { applicableClasses: { contains: enrollment.class.name } },
        ],
      },
      include: {
        academicYear: true,
        items: {
          include: {
            feeType: true,
          },
        },
      },
    });

    return { success: true, data: feeStructures };
  } catch (error) {
    console.error("Error fetching fee structures:", error);
    return { success: false, error: "Failed to fetch fee structures" };
  }
}

// Generate receipt number
export async function generateReceiptNumber() {
  try {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");

    // Get count of payments this month
    const startOfMonth = new Date(year, new Date().getMonth(), 1);
    const endOfMonth = new Date(year, new Date().getMonth() + 1, 0);

    const count = await db.feePayment.count({
      where: {
        paymentDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const receiptNumber = `RCP${year}${month}${String(count + 1).padStart(4, "0")}`;

    return { success: true, data: receiptNumber };
  } catch (error) {
    console.error("Error generating receipt number:", error);
    return { success: false, error: "Failed to generate receipt number" };
  }
}

// Get payment receipt HTML for printing
export async function getPaymentReceiptHTML(paymentId: string) {
  try {
    const payment = await db.feePayment.findUnique({
      where: { id: paymentId },
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
              where: { status: "ACTIVE" },
              orderBy: { enrollDate: "desc" },
              take: 1,
              include: {
                class: true,
                section: true,
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
      },
    });

    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    // Prepare fee items
    const feeItems = payment.feeStructure.items.map((item) => ({
      name: item.feeType.name,
      amount: item.amount,
    }));

    // Prepare receipt data
    const receiptData = {
      receiptNumber: payment.receiptNumber,
      paymentDate: payment.paymentDate,
      student: {
        name: `${payment.student.user.firstName} ${payment.student.user.lastName}`,
        email: payment.student.user.email,
        class: payment.student.enrollments[0]?.class.name || "N/A",
        section: payment.student.enrollments[0]?.section.name || "N/A",
        admissionId: payment.student.admissionId,
      },
      payment: {
        amount: payment.amount,
        paidAmount: payment.paidAmount,
        balance: payment.balance,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        status: payment.status,
      },
      feeStructure: {
        name: payment.feeStructure.name,
        academicYear: payment.feeStructure.academicYear.name,
      },
      feeItems,
    };

    // Fetch school info from SystemSettings
    const systemSettings = await db.systemSettings.findFirst();
    if (systemSettings) {
      (receiptData as any).school = {
        name: systemSettings.schoolName,
        address: systemSettings.schoolAddress,
        phone: systemSettings.schoolPhone,
        email: systemSettings.schoolEmail,
        website: systemSettings.schoolWebsite,
        logo: systemSettings.schoolLogo
      };
    }

    // Generate the HTML receipt
    const html = getReceiptHTML(receiptData);

    return { success: true, data: { html, receiptData } };
  } catch (error) {
    console.error("Error generating receipt HTML:", error);
    return { success: false, error: "Failed to generate receipt" };
  }
}

/**
 * Generate consolidated receipt HTML for all payments made by a student on the same date
 * Groups multiple fee payments into a single receipt
 */
export async function getConsolidatedReceiptHTML(
  studentId: string,
  paymentDate: Date
) {
  try {
    // Get start and end of the day for date comparison
    const startOfDay = new Date(paymentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(paymentDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch all completed payments for this student on this date
    const payments = await db.feePayment.findMany({
      where: {
        studentId,
        status: "COMPLETED",
        paymentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        student: {
          include: {
            user: true,
            enrollments: {
              where: { status: "ACTIVE" },
              include: {
                class: true,
                section: true,
              },
              take: 1,
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
      },
      orderBy: { createdAt: "asc" },
    });

    if (payments.length === 0) {
      return { success: false, error: "No payments found for this date" };
    }

    // Use first payment for student info
    const firstPayment = payments[0];
    const student = firstPayment.student;
    const enrollment = student.enrollments[0];

    // Combine all fee items from all payments
    const feeItems: Array<{ name: string; amount: number }> = [];
    let totalPaid = 0;
    const feeStructureNames: string[] = [];
    const processedFeeStructures = new Set<string>();

    for (const payment of payments) {
      // Add fee structure items ONLY if this structure hasn't been added yet
      if (!processedFeeStructures.has(payment.feeStructureId)) {
        for (const item of payment.feeStructure.items) {
          feeItems.push({
            name: `${payment.feeStructure.name} - ${item.feeType?.name || "Fee"}`,
            amount: item.amount,
          });
        }
        processedFeeStructures.add(payment.feeStructureId);

        if (!feeStructureNames.includes(payment.feeStructure.name)) {
          feeStructureNames.push(payment.feeStructure.name);
        }
      }

      // Always sum the actual paid amounts
      totalPaid += payment.paidAmount;
    }

    // Calculate total amount from the unique items (Gross Fee)
    const totalAmount = feeItems.reduce((sum, item) => sum + item.amount, 0);

    // Create consolidated receipt data
    const receiptData = {
      receiptNumber: `CONS-${format(new Date(paymentDate), "yyyyMMdd")}-${student.admissionId}`,
      paymentDate: firstPayment.paymentDate,
      student: {
        name: student.user.name || `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email || "",
        class: enrollment?.class?.name || "N/A",
        section: enrollment?.section?.name || "N/A",
        admissionId: student.admissionId,
      },
      payment: {
        amount: totalAmount,
        paidAmount: totalPaid,
        balance: totalAmount - totalPaid,
        paymentMethod: firstPayment.paymentMethod,
        transactionId: firstPayment.transactionId || payments.map(p => p.transactionId).filter(Boolean).join(", "),
        status: firstPayment.status,
      },
      feeStructure: {
        name: feeStructureNames.join(" + "),
        academicYear: firstPayment.feeStructure.academicYear.name,
      },
      feeItems,
    };

    // Fetch school info from SystemSettings
    const systemSettings = await db.systemSettings.findFirst();
    if (systemSettings) {
      (receiptData as any).school = {
        name: systemSettings.schoolName,
        address: systemSettings.schoolAddress,
        phone: systemSettings.schoolPhone,
        email: systemSettings.schoolEmail,
        website: systemSettings.schoolWebsite,
        logo: systemSettings.schoolLogo
      };
    }

    // Generate the HTML receipt
    const html = getReceiptHTML(receiptData);

    return {
      success: true,
      data: {
        html,
        receiptData,
        paymentCount: payments.length,
      }
    };
  } catch (error) {
    console.error("Error generating consolidated receipt:", error);
    return { success: false, error: "Failed to generate consolidated receipt" };
  }
}


// Send fee reminders for due and overdue payments
// Requirements: 7.1, 7.2, 7.4, 7.5
export async function sendFeeReminders() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all pending and partial payments
    const pendingPayments = await db.feePayment.findMany({
      where: {
        status: {
          in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL],
        },
        balance: {
          gt: 0,
        },
      },
      include: {
        student: {
          include: {
            user: true,
            parents: {
              include: {
                parent: true,
              },
            },
          },
        },
        feeStructure: true,
      },
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const payment of pendingPayments) {
      try {
        // Determine if payment is overdue
        const dueDate = payment.feeStructure.validTo || payment.paymentDate;
        const isOverdue = dueDate < today;

        // Calculate total outstanding balance for this student
        const allPayments = await db.feePayment.findMany({
          where: { studentId: payment.studentId },
        });

        const totalOutstanding = allPayments.reduce((sum, p) => sum + p.balance, 0);

        // Send notification to all parents
        for (const parentRelation of payment.student.parents) {
          await sendFeeReminder({
            studentId: payment.studentId,
            studentName: `${payment.student.user.firstName} ${payment.student.user.lastName}`,
            amount: payment.balance,
            dueDate: dueDate,
            isOverdue,
            outstandingBalance: totalOutstanding,
            parentId: parentRelation.parentId,
          });
          sentCount++;
        }
      } catch (error) {
        console.error(`Failed to send fee reminder for payment ${payment.id}:`, error);
        failedCount++;
      }
    }

    return {
      success: true,
      data: {
        totalPayments: pendingPayments.length,
        sentCount,
        failedCount,
      },
    };
  } catch (error) {
    console.error("Error sending fee reminders:", error);
    return { success: false, error: "Failed to send fee reminders" };
  }
}

// Send overdue fee alerts
// Requirements: 7.2, 7.4, 7.5
export async function sendOverdueFeeAlerts() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all overdue payments
    const overduePayments = await db.feePayment.findMany({
      where: {
        status: {
          in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL],
        },
        balance: {
          gt: 0,
        },
        feeStructure: {
          validTo: {
            lt: today,
          },
        },
      },
      include: {
        student: {
          include: {
            user: true,
            parents: {
              include: {
                parent: true,
              },
            },
          },
        },
        feeStructure: true,
      },
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const payment of overduePayments) {
      try {
        // Calculate total outstanding balance for this student
        const allPayments = await db.feePayment.findMany({
          where: { studentId: payment.studentId },
        });

        const totalOutstanding = allPayments.reduce((sum, p) => sum + p.balance, 0);

        // Send notification to all parents
        for (const parentRelation of payment.student.parents) {
          await sendFeeReminder({
            studentId: payment.studentId,
            studentName: `${payment.student.user.firstName} ${payment.student.user.lastName}`,
            amount: payment.balance,
            dueDate: payment.feeStructure.validTo || payment.paymentDate,
            isOverdue: true,
            outstandingBalance: totalOutstanding,
            parentId: parentRelation.parentId,
          });
          sentCount++;
        }
      } catch (error) {
        console.error(`Failed to send overdue alert for payment ${payment.id}:`, error);
        failedCount++;
      }
    }

    return {
      success: true,
      data: {
        totalOverdue: overduePayments.length,
        sentCount,
        failedCount,
      },
    };
  } catch (error) {
    console.error("Error sending overdue fee alerts:", error);
    return { success: false, error: "Failed to send overdue fee alerts" };
  }
}
