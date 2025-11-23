"use server";

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export interface StudentFilters {
  classId?: string;
  sectionId?: string;
  gender?: string;
  enrollmentStatus?: string;
  admissionDateFrom?: Date;
  admissionDateTo?: Date;
  search?: string;
}

export async function getFilteredStudents(filters: StudentFilters) {
  try {
    const where: Prisma.StudentWhereInput = {};

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
          admissionId: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
        {
          rollNumber: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Gender filter
    if (filters.gender && filters.gender !== "all") {
      where.gender = filters.gender;
    }

    // Admission date range filter
    if (filters.admissionDateFrom || filters.admissionDateTo) {
      where.admissionDate = {};
      if (filters.admissionDateFrom) {
        where.admissionDate.gte = filters.admissionDateFrom;
      }
      if (filters.admissionDateTo) {
        where.admissionDate.lte = filters.admissionDateTo;
      }
    }

    // Enrollment filters (class, section, status)
    if (
      filters.classId ||
      filters.sectionId ||
      (filters.enrollmentStatus && filters.enrollmentStatus !== "all")
    ) {
      where.enrollments = {
        some: {
          ...(filters.classId && filters.classId !== "all"
            ? { classId: filters.classId }
            : {}),
          ...(filters.sectionId && filters.sectionId !== "all"
            ? { sectionId: filters.sectionId }
            : {}),
          ...(filters.enrollmentStatus && filters.enrollmentStatus !== "all"
            ? { status: filters.enrollmentStatus as any }
            : {}),
        },
      };
    }

    const students = await db.student.findMany({
      where,
      include: {
        user: true,
        enrollments: {
          include: {
            class: true,
            section: true,
          },
          where: {
            status: "ACTIVE",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, students };
  } catch (error) {
    console.error("Error fetching filtered students:", error);
    return { success: false, error: "Failed to fetch students", students: [] };
  }
}

export async function getFilterOptions() {
  try {
    const [classes, sections] = await Promise.all([
      db.class.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
      db.classSection.findMany({
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
      classes,
      sections,
    };
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return {
      success: false,
      classes: [],
      sections: [],
    };
  }
}
