"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/utils/permissions";
import { PermissionAction } from "@prisma/client";

// Get all payrolls with filters
export async function getPayrolls(filters?: {
  month?: number;
  year?: number;
  teacherId?: string;
  status?: string;
  limit?: number;
}) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const where: any = {};

    // Check permissions
    const hasPerm = await hasPermission(user.id, "PAYROLL", PermissionAction.READ);

    if (!hasPerm) {
      // If no global read permission, check if user is a teacher viewing their own records
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        include: { teacher: true },
      });

      if (dbUser?.teacher) {
        // Force filter to current teacher
        where.teacherId = dbUser.teacher.id;
      } else {
        return { success: false, error: "Insufficient permissions" };
      }
    } else {
      // Admin/Authorized user can filter by teacher ID
      if (filters?.teacherId) {
        where.teacherId = filters.teacherId;
      }
    }

    if (filters?.month) {
      where.month = filters.month;
    }

    if (filters?.year) {
      where.year = filters.year;
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
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

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

    // Check permissions
    const hasPerm = await hasPermission(user.id, "PAYROLL", PermissionAction.READ);

    if (!hasPerm) {
      // Check if the payroll belongs to the current user (if teacher)
      if (payroll.teacher.userId !== user.id) {
        return { success: false, error: "Unauthorized" };
      }
    }

    return { success: true, data: payroll };
  } catch (error) {
    console.error("Error fetching payroll:", error);
    return { success: false, error: "Failed to fetch payroll" };
  }
}

// Salary Structure Input Interface
export interface SalaryStructureInput {
  basic: number;
  hra: number;
  da: number;
  travelAllowance: number;
  otherAllowances: { name: string; amount: number }[];
  providentFund: number;
  professionalTax: number;
  tds: number;
  otherDeductions: { name: string; amount: number }[];
}

// Upsert Salary Structure
export async function upsertSalaryStructure(teacherId: string, data: SalaryStructureInput) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const hasPerm = await hasPermission(user.id, "PAYROLL", PermissionAction.UPDATE);
    if (!hasPerm) {
      return { success: false, error: "Insufficient permissions" };
    }

    const structure = await db.salaryStructure.upsert({
      where: { teacherId },
      create: {
        teacherId,
        basic: data.basic,
        hra: data.hra,
        da: data.da,
        travelAllowance: data.travelAllowance,
        otherAllowances: data.otherAllowances as any,
        providentFund: data.providentFund,
        professionalTax: data.professionalTax,
        tds: data.tds,
        otherDeductions: data.otherDeductions as any,
      },
      update: {
        basic: data.basic,
        hra: data.hra,
        da: data.da,
        travelAllowance: data.travelAllowance,
        otherAllowances: data.otherAllowances as any,
        providentFund: data.providentFund,
        professionalTax: data.professionalTax,
        tds: data.tds,
        otherDeductions: data.otherDeductions as any,
      },
    });

    revalidatePath("/admin/finance/payroll");
    return { success: true, data: structure };
  } catch (error) {
    console.error("Error upserting salary structure:", error);
    return { success: false, error: "Failed to save salary structure" };
  }
}

// Get Salary Structure
export async function getSalaryStructure(teacherId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const hasPerm = await hasPermission(user.id, "PAYROLL", PermissionAction.READ);
    if (!hasPerm) {
      // Allow teachers to view their own structure
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        include: { teacher: true },
      });
      if (dbUser?.teacher?.id !== teacherId) {
        return { success: false, error: "Insufficient permissions" };
      }
    }

    const structure = await db.salaryStructure.findUnique({
      where: { teacherId },
    });

    return { success: true, data: structure };
  } catch (error) {
    console.error("Error fetching salary structure:", error);
    return { success: false, error: "Failed to fetch salary structure" };
  }
}

// Generate payroll for a teacher
export async function generatePayroll(data: any) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const hasPerm = await hasPermission(user.id, "PAYROLL", PermissionAction.CREATE);
    if (!hasPerm) {
      return { success: false, error: "Insufficient permissions" };
    }

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

    // Fetch Salary Structure
    const structure = await db.salaryStructure.findUnique({
      where: { teacherId: data.teacherId },
    });

    // Default values if no structure exists (Fallback to manual input or older 'salary' field)
    const basicSalary = structure?.basic || parseFloat(data.basicSalary) || 0;
    const hra = structure?.hra || parseFloat(data.hra) || 0;
    const da = structure?.da || parseFloat(data.da) || 0;
    const travelAllowance = structure?.travelAllowance || parseFloat(data.travelAllowance) || 0;
    const otherAllowances = structure?.otherAllowances ? (structure.otherAllowances as any[]) : [];

    // Calculate total other allowances
    const totalOtherAllowances = otherAllowances.reduce((sum, item) => sum + (item.amount || 0), 0);

    const providentFund = structure?.providentFund || parseFloat(data.providentFund) || 0;
    const professionalTax = structure?.professionalTax || parseFloat(data.professionalTax) || 0;
    const tds = structure?.tds || parseFloat(data.tds) || 0;
    const otherDeductions = structure?.otherDeductions ? (structure.otherDeductions as any[]) : [];

    // Calculate total other deductions
    const totalOtherDeductions = otherDeductions.reduce((sum, item) => sum + (item.amount || 0), 0);

    const bonus = parseFloat(data.bonus || "0");

    const totalEarnings = basicSalary + hra + da + travelAllowance + totalOtherAllowances + bonus;
    const totalDeductions = providentFund + professionalTax + tds + totalOtherDeductions;
    const netSalary = totalEarnings - totalDeductions;

    const payroll = await db.payroll.create({
      data: {
        teacherId: data.teacherId,
        month: parseInt(data.month),
        year: parseInt(data.year),
        basicSalary,
        hra,
        da,
        travelAllowance,
        otherAllowances: otherAllowances as any,
        providentFund,
        professionalTax,
        tds,
        otherDeductions: otherDeductions as any,
        allowances: totalEarnings - basicSalary, // Store total allowances sum
        deductions: totalDeductions, // Store total deductions sum
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
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const hasPerm = await hasPermission(user.id, "PAYROLL", PermissionAction.UPDATE);
    if (!hasPerm) {
      return { success: false, error: "Insufficient permissions" };
    }

    // We only update the net totals or remarks usually, but let's allow updating components if passed
    // For simplicity in this edit, assuming we just recalculate if components are passed

    // This part would be more complex in a real app (re-calculating everything), 
    // but for now keeping it compatible with existing simple update if just status/remarks changed.

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.remarks) updateData.remarks = data.remarks;
    if (data.netSalary) updateData.netSalary = parseFloat(data.netSalary);

    const payroll = await db.payroll.update({
      where: { id },
      data: updateData,
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
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const hasPerm = await hasPermission(user.id, "PAYROLL", PermissionAction.APPROVE);
    if (!hasPerm) {
      return { success: false, error: "Insufficient permissions" };
    }

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
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const hasPerm = await hasPermission(user.id, "PAYROLL", PermissionAction.DELETE);
    if (!hasPerm) {
      return { success: false, error: "Insufficient permissions" };
    }

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
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const hasPerm = await hasPermission(user.id, "PAYROLL", PermissionAction.READ);
    if (!hasPerm) {
      return { success: false, error: "Insufficient permissions" };
    }

    const teachers = await db.teacher.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        departments: {
          select: {
            name: true,
          },
          take: 1,
        },
      },
      orderBy: {
        user: {
          firstName: "asc",
        },
      },
    });

    // Format the data for the dropdown
    const formattedTeachers = teachers.map((teacher) => ({
      id: teacher.id,
      name: `${teacher.user.firstName} ${teacher.user.lastName}`,
      employeeId: teacher.employeeId,
      email: teacher.user.email,
      position: teacher.qualification || "Teacher",
      department: teacher.departments[0]?.name || "General",
      salary: teacher.salary || 0,
    }));

    return { success: true, data: formattedTeachers };
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return { success: false, error: "Failed to fetch teachers" };
  }
}

// Get payroll statistics
export async function getPayrollStats(month?: number, year?: number) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const hasPerm = await hasPermission(user.id, "PAYROLL", PermissionAction.READ);
    if (!hasPerm) {
      return { success: false, error: "Insufficient permissions" };
    }

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
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const hasPerm = await hasPermission(user.id, "PAYROLL", PermissionAction.EXPORT);
    if (!hasPerm) {
      return { success: false, error: "Insufficient permissions" };
    }

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
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const hasPerm = await hasPermission(user.id, "PAYROLL", PermissionAction.CREATE);
    if (!hasPerm) {
      return { success: false, error: "Insufficient permissions" };
    }

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



