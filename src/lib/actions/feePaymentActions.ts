"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { PaymentStatus, PaymentMethod } from "@prisma/client";

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
          },
        },
        feeStructure: true,
      },
    });

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
