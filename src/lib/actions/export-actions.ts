"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";
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
    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: "Unauthorized", error: "User not authenticated" };
    }

    // Build query filters
    const where: any = {};
    
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
    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: "Unauthorized", error: "User not authenticated" };
    }

    const where: any = {};
    
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
    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: "Unauthorized", error: "User not authenticated" };
    }

    const where: any = {
      date: {
        gte: startDate,
        lte: endDate,
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
    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: "Unauthorized", error: "User not authenticated" };
    }

    const where: any = {
      paymentDate: {
        gte: startDate,
        lte: endDate,
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
    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: "Unauthorized", error: "User not authenticated" };
    }

    const results = await prisma.examResult.findMany({
      where: {
        examId,
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
