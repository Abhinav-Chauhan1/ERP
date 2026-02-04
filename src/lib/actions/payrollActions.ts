"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { withSchoolAuthAction } from "@/lib/auth/security-wrapper";
import { hasPermission } from "@/lib/utils/permissions";
import { PermissionAction } from "@prisma/client";
import { auth } from "@/auth";

// Helper to check permission
async function checkPermission(resource: string, action: PermissionAction, errorMessage?: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Unauthorized');
  const allowed = await hasPermission(userId, resource, action);
  if (!allowed) throw new Error(errorMessage || 'Permission denied');
  return userId;
}

// Get all payrolls with filters
// Get all payrolls with filters
export const getPayrolls = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, filters?: {
  month?: number;
  year?: number;
  teacherId?: string;
  status?: string;
  limit?: number;
}) => {
  try {
    const where: any = {
      teacher: {
        schoolId
      }
    };

    // Check permissions
    await checkPermission('PAYROLL', 'READ');

    if (filters?.teacherId) {
      // Allow filtering by specific teacher, but still scoped to school
      where.teacherId = filters.teacherId;
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
});

// Get single payroll by ID
// Get single payroll by ID
export const getPayrollById = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string) => {
  try {
    const payroll = await db.payroll.findFirst({
      where: {
        id,
        teacher: {
          schoolId
        }
      },
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
});

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
// Upsert Salary Structure
export const upsertSalaryStructure = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, teacherId: string, data: SalaryStructureInput) => {
  try {
    await checkPermission('PAYROLL', 'UPDATE');

    // Verify teacher belongs to school
    const teacher = await db.teacher.findFirst({
      where: { id: teacherId, schoolId }
    });
    if (!teacher) return { success: false, error: "Teacher not found" };

    const structure = await db.salaryStructure.upsert({
      where: { teacherId },
      create: {
        schoolId, // Ensure relation is set
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
});

// Get Salary Structure
// Get Salary Structure
export const getSalaryStructure = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, teacherId: string) => {
  try {
    // Verify teacher belongs to school
    const teacher = await db.teacher.findFirst({
      where: { id: teacherId, schoolId }
    });
    if (!teacher) return { success: false, error: "Teacher not found" };

    const structure = await db.salaryStructure.findUnique({
      where: { teacherId },
    });

    return { success: true, data: structure };
  } catch (error) {
    console.error("Error fetching salary structure:", error);
    return { success: false, error: "Failed to fetch salary structure" };
  }
});

// Generate payroll for a teacher
// Generate payroll for a teacher
export const generatePayroll = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, data: any) => {
  try {
    await checkPermission('PAYROLL', 'CREATE');

    // Verify teacher belongs to school
    const teacher = await db.teacher.findFirst({
      where: { id: data.teacherId, schoolId }
    });
    if (!teacher) return { success: false, error: "Teacher not found" };

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
        schoolId,
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
});

// Update payroll
// Update payroll
export const updatePayroll = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string, data: any) => {
  try {
    await checkPermission('PAYROLL', 'UPDATE');

    const existing = await db.payroll.findFirst({
      where: { id, teacher: { schoolId } }
    });
    if (!existing) return { success: false, error: "Payroll not found" };

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
});

// Process payment (mark as paid)
// Process payment (mark as paid)
export const processPayment = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string, paymentDate?: Date) => {
  try {
    await checkPermission('PAYROLL', 'APPROVE');

    const existing = await db.payroll.findFirst({
      where: { id, teacher: { schoolId } }
    });
    if (!existing) return { success: false, error: "Payroll not found" };

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
});

// Delete payroll
// Delete payroll
export const deletePayroll = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string) => {
  try {
    await checkPermission('PAYROLL', 'DELETE');

    // Check if payroll is already paid
    const payroll = await db.payroll.findFirst({
      where: { id, teacher: { schoolId } },
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
});

// Get teachers for payroll dropdown
// Get teachers for payroll dropdown
export const getTeachersForPayroll = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  try {
    const teachers = await db.teacher.findMany({
      where: { schoolId },
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
});

// Get payroll statistics
// Get payroll statistics
export const getPayrollStats = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, month?: number, year?: number) => {
  try {
    const where: any = {
      teacher: {
        schoolId
      }
    };

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
});

// Export payroll report
// Export payroll report
export const exportPayrollReport = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, month: number, year: number) => {
  try {
    await checkPermission('PAYROLL', 'EXPORT');

    const payrolls = await db.payroll.findMany({
      where: {
        teacher: { schoolId },
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
});

// Bulk generate payrolls for all teachers
// Bulk generate payrolls for all teachers
export const bulkGeneratePayrolls = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, month: number, year: number, defaultSalary: number) => {
  try {
    await checkPermission('PAYROLL', 'CREATE');

    const teachers = await db.teacher.findMany({
      where: { schoolId },
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
              schoolId,
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
});



