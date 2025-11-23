"use server";

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export interface TeacherFilters {
  subjectId?: string;
  department?: string;
  joiningDateFrom?: Date;
  joiningDateTo?: Date;
  search?: string;
}

export async function getFilteredTeachers(filters: TeacherFilters) {
  try {
    const where: Prisma.TeacherWhereInput = {};

    // Text search across multiple fields
    if (filters.search) {
      where.OR = [
        {
          user: {
            firstName: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            lastName: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
        },
        {
          employeeId: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Department filter
    if (filters.department && filters.department !== "all") {
      where.departments = {
        some: {
          id: filters.department,
        },
      };
    }

    // Joining date range filter
    if (filters.joiningDateFrom || filters.joiningDateTo) {
      where.joinDate = {};
      if (filters.joiningDateFrom) {
        where.joinDate.gte = filters.joiningDateFrom;
      }
      if (filters.joiningDateTo) {
        where.joinDate.lte = filters.joiningDateTo;
      }
    }

    // Subject filter
    if (filters.subjectId && filters.subjectId !== "all") {
      where.subjects = {
        some: {
          subjectId: filters.subjectId,
        },
      };
    }

    const teachers = await db.teacher.findMany({
      where,
      include: {
        user: true,
        subjects: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, teachers };
  } catch (error) {
    console.error("Error fetching filtered teachers:", error);
    return { success: false, error: "Failed to fetch teachers", teachers: [] };
  }
}

export async function getTeacherFilterOptions() {
  try {
    const [subjects, departments] = await Promise.all([
      db.subject.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
      db.department.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
    ]);

    return {
      success: true,
      subjects,
      departments,
    };
  } catch (error) {
    console.error("Error fetching teacher filter options:", error);
    return {
      success: false,
      subjects: [],
      departments: [],
    };
  }
}
