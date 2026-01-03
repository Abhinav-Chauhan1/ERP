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
    // Use the centralized academicyearsActions
    const { getAcademicYears: getYears } = await import("./academicyearsActions");
    const result = await getYears();

    if (!result.success || !result.data) {
      return result;
    }

    const now = new Date();

    const yearsWithStatus = result.data.map((year) => {
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
        termsCount: year._count?.terms || 0,
        classesCount: year._count?.classes || 0,
      };
    });

    return { success: true, data: yearsWithStatus };
  } catch (error) {
    console.error("Error fetching academic years:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch academic years"
    };
  }
}

export async function getAcademicYearById(id: string) {
  try {
    // Use the centralized academicyearsActions
    const { getAcademicYearById: getYearById } = await import("./academicyearsActions");
    return await getYearById(id);
  } catch (error) {
    console.error("Error fetching academic year:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch academic year"
    };
  }
}

export async function createAcademicYear(data: {
  name: string;
  startDate: Date;
  endDate: Date;
  isCurrent?: boolean;
}) {
  try {
    // Use the centralized academicyearsActions
    const { createAcademicYear: createYear } = await import("./academicyearsActions");
    return await createYear({ ...data, isCurrent: data.isCurrent ?? false });
  } catch (error) {
    console.error("Error creating academic year:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create academic year"
    };
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
    // Use the centralized academicyearsActions
    const { updateAcademicYear: updateYear, getAcademicYearById: getYearById } = await import("./academicyearsActions");

    // Fetch existing year to support partial updates
    const existingResult = await getYearById(id);
    if (!existingResult.success || !existingResult.data) {
      return { success: false, error: existingResult.error || "Academic year not found" };
    }
    const existing = existingResult.data;

    // Merge existing data with updates
    const mergedData = {
      id,
      name: data.name ?? existing.name,
      startDate: data.startDate ?? existing.startDate,
      endDate: data.endDate ?? existing.endDate,
      isCurrent: data.isCurrent ?? existing.isCurrent,
    };

    return await updateYear(mergedData);
  } catch (error) {
    console.error("Error updating academic year:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update academic year"
    };
  }
}

export async function deleteAcademicYear(id: string) {
  try {
    // Use the centralized academicyearsActions
    const { deleteAcademicYear: deleteYear } = await import("./academicyearsActions");
    return await deleteYear(id);
  } catch (error) {
    console.error("Error deleting academic year:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete academic year"
    };
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
