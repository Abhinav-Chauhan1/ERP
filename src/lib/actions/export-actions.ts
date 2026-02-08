"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import Papa from "papaparse";

export interface ExportJobResult {
  success: boolean;
  message: string;
  recordCount?: number;
  error?: string;
}

/**
 * Export students data (server-side for large datasets)
 */
export async function exportStudentsData(
  filters?: {
    classId?: string;
    sectionId?: string;
    status?: string;
    searchQuery?: string;
  }
): Promise<ExportJobResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, message: "Unauthorized", error: "User not authenticated" };
    }

    // Get required school context
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Build query filters
    const where: any = {
      schoolId, // CRITICAL: Filter by current school
    };
    
    if (filters?.status === "active") {
      where.user = { active: true };
    } else if (filters?.status === "inactive") {
      where.user = { active: false };
    }

    if (filters?.searchQuery) {
      where.OR = [
        { admissionId: { contains: filters.searchQuery, mode: "insensitive" } },
        { user: { firstName: { contains: filters.searchQuery, mode: "insensitive" } } },
        { user: { lastName: { contains: filters.searchQuery, mode: "insensitive" } } },
      ];
    }

    // Fetch students
    const students = await prisma.student.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            active: true,
          },
        },
        enrollments: {
          where: {
            schoolId, // CRITICAL: Filter enrollments by school
          },
          include: {
            class: { select: { name: true } },
            section: { select: { name: true } },
          },
          take: 1,
        },
      },
      orderBy: {
        admissionDate: "desc",
      },
    });

    return {
      success: true,
      message: "Data prepared for export",
      recordCount: students.length,
    };
  } catch (error) {
    console.error("Export error:", error);
    return {
      success: false,
      message: "Export failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Export teachers data
 */
export async function exportTeachersData(
  filters?: {
    departmentId?: string;
    status?: string;
    searchQuery?: string;
  }
): Promise<ExportJobResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, message: "Unauthorized", error: "User not authenticated" };
    }

    // Get required school context
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const where: any = {
      schoolId, // CRITICAL: Filter by current school
    };
    
    if (filters?.status === "active") {
      where.user = { active: true };
    } else if (filters?.status === "inactive") {
      where.user = { active: false };
    }

    if (filters?.searchQuery) {
      where.OR = [
        { employeeId: { contains: filters.searchQuery, mode: "insensitive" } },
        { user: { firstName: { contains: filters.searchQuery, mode: "insensitive" } } },
        { user: { lastName: { contains: filters.searchQuery, mode: "insensitive" } } },
      ];
    }

    const teachers = await prisma.teacher.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            active: true,
          },
        },
      },
      orderBy: {
        joinDate: "desc",
      },
    });

    return {
      success: true,
      message: "Data prepared for export",
      recordCount: teachers.length,
    };
  } catch (error) {
    console.error("Export error:", error);
    return {
      success: false,
      message: "Export failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Export attendance data
 */
export async function exportAttendanceData(
  startDate: Date,
  endDate: Date,
  filters?: {
    classId?: string;
    sectionId?: string;
  }
): Promise<ExportJobResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, message: "Unauthorized", error: "User not authenticated" };
    }

    // Get required school context
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const where: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
      student: {
        schoolId, // CRITICAL: Filter through student relation
      },
    };

    if (filters?.sectionId) {
      where.sectionId = filters.sectionId;
    }

    const attendance = await prisma.studentAttendance.findMany({
      where,
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
        section: {
          include: {
            class: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return {
      success: true,
      message: "Data prepared for export",
      recordCount: attendance.length,
    };
  } catch (error) {
    console.error("Export error:", error);
    return {
      success: false,
      message: "Export failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Export fee payments data
 */
export async function exportFeePaymentsData(
  startDate: Date,
  endDate: Date,
  filters?: {
    status?: string;
    classId?: string;
  }
): Promise<ExportJobResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, message: "Unauthorized", error: "User not authenticated" };
    }

    // Get required school context
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const where: any = {
      paymentDate: {
        gte: startDate,
        lte: endDate,
      },
      student: {
        schoolId, // CRITICAL: Filter through student relation
      },
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    const payments = await prisma.feePayment.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            enrollments: {
              where: {
                schoolId, // CRITICAL: Filter enrollments by school
              },
              include: {
                class: {
                  select: {
                    name: true,
                  },
                },
              },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        paymentDate: "desc",
      },
    });

    return {
      success: true,
      message: "Data prepared for export",
      recordCount: payments.length,
    };
  } catch (error) {
    console.error("Export error:", error);
    return {
      success: false,
      message: "Export failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Export exam results data
 */
export async function exportExamResultsData(
  examId: string
): Promise<ExportJobResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, message: "Unauthorized", error: "User not authenticated" };
    }

    // Get required school context
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const results = await prisma.examResult.findMany({
      where: {
        examId,
        exam: {
          schoolId, // CRITICAL: Filter through exam relation
        },
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
            enrollments: {
              where: {
                schoolId, // CRITICAL: Filter enrollments by school
              },
              include: {
                class: {
                  select: {
                    name: true,
                  },
                },
                section: {
                  select: {
                    name: true,
                  },
                },
              },
              take: 1,
            },
          },
        },
        exam: {
          select: {
            title: true,
            totalMarks: true,
            subject: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        marks: "desc",
      },
    });

    return {
      success: true,
      message: "Data prepared for export",
      recordCount: results.length,
    };
  } catch (error) {
    console.error("Export error:", error);
    return {
      success: false,
      message: "Export failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
