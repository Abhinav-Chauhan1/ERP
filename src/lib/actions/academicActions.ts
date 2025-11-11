"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getAcademicOverview() {
  try {
    const [
      academicYearsCount,
      termsCount,
      departmentsCount,
      gradeScalesCount,
      syllabusCount,
    ] = await Promise.all([
      db.academicYear.count(),
      db.term.count(),
      db.department.count(),
      db.gradeScale.count(),
      db.syllabus.count(),
    ]);

    return {
      success: true,
      data: {
        academicYears: academicYearsCount,
        terms: termsCount,
        departments: departmentsCount,
        grades: gradeScalesCount,
        curriculum: 0, // Placeholder - no curriculum table in schema
        syllabus: syllabusCount,
      },
    };
  } catch (error) {
    console.error("Error fetching academic overview:", error);
    return { success: false, error: "Failed to fetch academic overview" };
  }
}

export async function getAcademicYears() {
  try {
    const academicYears = await db.academicYear.findMany({
      include: {
        terms: true,
        classes: true,
      },
      orderBy: {
        startDate: "desc",
      },
    });

    const now = new Date();
    
    const yearsWithStatus = academicYears.map((year) => {
      let status: "Current" | "Past" | "Planned";
      
      if (year.isCurrent) {
        status = "Current";
      } else if (year.endDate < now) {
        status = "Past";
      } else {
        status = "Planned";
      }

      return {
        id: year.id,
        name: year.name,
        startDate: year.startDate,
        endDate: year.endDate,
        status,
        isCurrent: year.isCurrent,
        termsCount: year.terms.length,
        classesCount: year.classes.length,
      };
    });

    return { success: true, data: yearsWithStatus };
  } catch (error) {
    console.error("Error fetching academic years:", error);
    return { success: false, error: "Failed to fetch academic years" };
  }
}

export async function getAcademicYearById(id: string) {
  try {
    const academicYear = await db.academicYear.findUnique({
      where: { id },
      include: {
        terms: {
          orderBy: { startDate: "asc" },
        },
        classes: {
          include: {
            sections: true,
            enrollments: {
              where: { status: "ACTIVE" },
            },
          },
        },
      },
    });

    if (!academicYear) {
      return { success: false, error: "Academic year not found" };
    }

    return { success: true, data: academicYear };
  } catch (error) {
    console.error("Error fetching academic year:", error);
    return { success: false, error: "Failed to fetch academic year" };
  }
}

export async function createAcademicYear(data: {
  name: string;
  startDate: Date;
  endDate: Date;
  isCurrent?: boolean;
}) {
  try {
    // If this is set as current, unset all other current years
    if (data.isCurrent) {
      await db.academicYear.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      });
    }

    const academicYear = await db.academicYear.create({
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        isCurrent: data.isCurrent || false,
      },
    });

    revalidatePath("/admin/academic");
    return { success: true, data: academicYear };
  } catch (error) {
    console.error("Error creating academic year:", error);
    return { success: false, error: "Failed to create academic year" };
  }
}

export async function updateAcademicYear(
  id: string,
  data: {
    name?: string;
    startDate?: Date;
    endDate?: Date;
    isCurrent?: boolean;
  }
) {
  try {
    // If this is set as current, unset all other current years
    if (data.isCurrent) {
      await db.academicYear.updateMany({
        where: { 
          isCurrent: true,
          NOT: { id }
        },
        data: { isCurrent: false },
      });
    }

    const academicYear = await db.academicYear.update({
      where: { id },
      data,
    });

    revalidatePath("/admin/academic");
    return { success: true, data: academicYear };
  } catch (error) {
    console.error("Error updating academic year:", error);
    return { success: false, error: "Failed to update academic year" };
  }
}

export async function deleteAcademicYear(id: string) {
  try {
    await db.academicYear.delete({
      where: { id },
    });

    revalidatePath("/admin/academic");
    return { success: true, message: "Academic year deleted successfully" };
  } catch (error) {
    console.error("Error deleting academic year:", error);
    return { success: false, error: "Failed to delete academic year" };
  }
}

export async function getDepartments() {
  try {
    const departments = await db.department.findMany({
      include: {
        subjects: true,
        teachers: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return { success: true, data: departments };
  } catch (error) {
    console.error("Error fetching departments:", error);
    return { success: false, error: "Failed to fetch departments" };
  }
}

export async function getTerms() {
  try {
    const terms = await db.term.findMany({
      include: {
        academicYear: true,
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return { success: true, data: terms };
  } catch (error) {
    console.error("Error fetching terms:", error);
    return { success: false, error: "Failed to fetch terms" };
  }
}

export async function getGradeScales() {
  try {
    const gradeScales = await db.gradeScale.findMany({
      orderBy: {
        minMarks: "desc",
      },
    });

    return { success: true, data: gradeScales };
  } catch (error) {
    console.error("Error fetching grade scales:", error);
    return { success: false, error: "Failed to fetch grade scales" };
  }
}
