"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/auth-helpers";

// Get all payrolls with filters
export async function getPayrolls(filters?: {
  month?: number;
  year?: number;
  teacherId?: string;
  status?: string;
  limit?: number;
}) {
  try {
    const where: any = {};

    if (filters?.month) {
      where.month = filters.month;
    }

    if (filters?.year) {
      where.year = filters.year;
    }

    if (filters?.teacherId) {
      where.teacherId = filters.teacherId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const payrolls = await db.payroll.findMany({
      where,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: [
        { year: "desc" },
        { month: "desc" },
      ],
      take: filters?.limit,
    });

    return { success: true, data: payrolls };
  } catch (error) {
    console.error("Error fetching payrolls:", error);
    return { success: false, error: "Failed to fetch payrolls" };
  }
}

// Get single payroll by ID
export async function getPayrollById(id: string) {
  try {
    const payroll = await db.payroll.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!payroll) {
      return { success: false, error: "Payroll not found" };
    }

    return { success: true, data: payroll };
  } catch (error) {
    console.error("Error fetching payroll:", error);
    return { success: false, error: "Failed to fetch payroll" };
  }
}

// Generate payroll for a teacher
export async function generatePayroll(data: any) {
  try {
    // Check if payroll already exists for this teacher, month, and year
    const existing = await db.payroll.findFirst({
      where: {
        teacherId: data.teacherId,
        month: parseInt(data.month),
        year: parseInt(data.year),
      },
    });

    if (existing) {
      return { success: false, error: "Payroll already exists for this period" };
    }

    // Get teacher details for salary calculation
    const teacher = await db.teacher.findUnique({
      where: { id: data.teacherId },
      include: {
        user: true,
      },
    });

    if (!teacher) {
      return { success: false, error: "Teacher not found" };
    }

    // Calculate payroll components
    const basicSalary = parseFloat(data.basicSalary);
    const allowances = parseFloat(data.allowances || "0");
    const deductions = parseFloat(data.deductions || "0");
    const bonus = parseFloat(data.bonus || "0");
    const grossSalary = basicSalary + allowances + bonus;
    const netSalary = grossSalary - deductions;

    const payroll = await db.payroll.create({
      data: {
        teacherId: data.teacherId,
        month: parseInt(data.month),
        year: parseInt(data.year),
        basicSalary,
        allowances,
        deductions,
        netSalary,
        status: "PENDING",
      },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    revalidatePath("/admin/finance/payroll");
    return { success: true, data: payroll };
  } catch (error) {
    console.error("Error generating payroll:", error);
    return { success: false, error: "Failed to generate payroll" };
  }
}

// Update payroll
export async function updatePayroll(id: string, data: any) {
  try {
    const basicSalary = parseFloat(data.basicSalary);
    const allowances = parseFloat(data.allowances || "0");
    const deductions = parseFloat(data.deductions || "0");
    const bonus = parseFloat(data.bonus || "0");
    const grossSalary = basicSalary + allowances + bonus;
    const netSalary = grossSalary - deductions;

    const payroll = await db.payroll.update({
      where: { id },
      data: {
        basicSalary,
        allowances,
        deductions,
        netSalary,
        remarks: data.remarks || null,
      },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    revalidatePath("/admin/finance/payroll");
    return { success: true, data: payroll };
  } catch (error) {
    console.error("Error updating payroll:", error);
    return { success: false, error: "Failed to update payroll" };
  }
}

// Process payment (mark as paid)
export async function processPayment(id: string, paymentDate?: Date) {
  try {
    const payroll = await db.payroll.update({
      where: { id },
      data: {
        status: "COMPLETED" as any,
        paymentDate: paymentDate || new Date(),
      },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    revalidatePath("/admin/finance/payroll");
    return { success: true, data: payroll };
  } catch (error) {
    console.error("Error processing payment:", error);
    return { success: false, error: "Failed to process payment" };
  }
}

// Delete payroll
export async function deletePayroll(id: string) {
  try {
    // Check if payroll is already paid
    const payroll = await db.payroll.findUnique({
      where: { id },
    });

    if (payroll?.status === "COMPLETED") {
      return { success: false, error: "Cannot delete completed payroll" };
    }

    await db.payroll.delete({
      where: { id },
    });

    revalidatePath("/admin/finance/payroll");
    return { success: true };
  } catch (error) {
    console.error("Error deleting payroll:", error);
    return { success: false, error: "Failed to delete payroll" };
  }
}

// Get teachers for payroll dropdown
export async function getTeachersForPayroll() {
  try {
    const teachers = await db.teacher.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        user: {
          firstName: "asc",
        },
      },
    });

    return { success: true, data: teachers };
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return { success: false, error: "Failed to fetch teachers" };
  }
}

// Get payroll statistics
export async function getPayrollStats(month?: number, year?: number) {
  try {
    const where: any = {};
    
    if (month) where.month = month;
    if (year) where.year = year;

    const [
      totalPayrolls,
      pendingPayrolls,
      paidPayrolls,
      totalPaid,
      totalPending,
    ] = await Promise.all([
      db.payroll.count({ where }),
      db.payroll.count({
        where: { ...where, status: "PENDING" as any },
      }),
      db.payroll.count({
        where: { ...where, status: "COMPLETED" as any },
      }),
      db.payroll.aggregate({
        where: { ...where, status: "COMPLETED" as any },
        _sum: {
          netSalary: true,
        },
      }),
      db.payroll.aggregate({
        where: { ...where, status: "PENDING" as any },
        _sum: {
          netSalary: true,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        totalPayrolls,
        pendingPayrolls,
        paidPayrolls,
        totalPaid: totalPaid._sum.netSalary || 0,
        totalPending: totalPending._sum.netSalary || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching payroll stats:", error);
    return { success: false, error: "Failed to fetch statistics" };
  }
}

// Export payroll report
export async function exportPayrollReport(month: number, year: number) {
  try {
    const payrolls = await db.payroll.findMany({
      where: {
        month,
        year,
      },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        teacher: {
          user: {
            firstName: "asc",
          },
        },
      },
    });

    // In a real implementation, you would generate a CSV or PDF here
    // For now, we'll just return the data
    return { success: true, data: payrolls };
  } catch (error) {
    console.error("Error exporting payroll report:", error);
    return { success: false, error: "Failed to export report" };
  }
}

// Bulk generate payrolls for all teachers
export async function bulkGeneratePayrolls(month: number, year: number, defaultSalary: number) {
  try {
    const teachers = await db.teacher.findMany({
      include: {
        user: true,
      },
    });

    const results = [];
    const errors = [];

    for (const teacher of teachers) {
      try {
        // Check if payroll already exists
        const existing = await db.payroll.findFirst({
          where: {
            teacherId: teacher.id,
            month,
            year,
          },
        });

        if (!existing) {
          const payroll = await db.payroll.create({
            data: {
              teacherId: teacher.id,
              month,
              year,
              basicSalary: defaultSalary,
              allowances: 0,
              deductions: 0,
              netSalary: defaultSalary,
              status: "PENDING",
              },
          });
          results.push(payroll);
        }
      } catch (error) {
        errors.push({
          teacherId: teacher.id,
          teacherName: `${teacher.user.firstName} ${teacher.user.lastName}`,
          error: "Failed to generate payroll",
        });
      }
    }

    revalidatePath("/admin/finance/payroll");
    return {
      success: true,
      data: {
        generated: results.length,
        errors: errors.length,
        details: { results, errors },
      },
    };
  } catch (error) {
    console.error("Error bulk generating payrolls:", error);
    return { success: false, error: "Failed to bulk generate payrolls" };
  }
}



