"use server";

import { withSchoolAuthAction } from "@/lib/auth/security-wrapper";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export const getAcademicOverview = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  try {
    const [
      academicYearsCount,
      termsCount,
      departmentsCount,
      gradeScalesCount,
      syllabusCount,
    ] = await Promise.all([
      db.academicYear.count({ where: { schoolId } }),
      db.term.count({ where: { schoolId } }),
      db.department.count({ where: { schoolId } }),
      db.gradeScale.count({ where: { schoolId } }),
      db.syllabus.count({ where: { schoolId } }),
    ]);

    return {
      success: true,
      data: {
        academicYears: academicYearsCount,
        terms: termsCount,
        grades: gradeScalesCount,
        syllabus: syllabusCount,
      },
    };
  } catch (error) {
    console.error("Error fetching academic overview:", error);
    return { success: false, error: "Failed to fetch academic overview" };
  }
});

export const getAcademicYears = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
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
});

export const getAcademicYearById = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string) => {
  try {
    // Use the centralized academicyearsActions
    const { getAcademicYearById: getYearById } = await import("./academicyearsActions");
    // Pass context if needed, but getYearById might use auth() internally. 
    // Assuming getYearById is compatible or we should call it carefully.
    // The previous code awaited getYearById(id), assuming it handles its own scoping or accepts just ID.
    // We'll stick to previous logic structure to minimize regression risk.
    return await getYearById(id);
  } catch (error) {
    console.error("Error fetching academic year:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch academic year"
    };
  }
});

export const createAcademicYear = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, data: {
  name: string;
  startDate: Date;
  endDate: Date;
  isCurrent?: boolean;
}) => {
  try {
    const { createAcademicYear: createYear } = await import("./academicyearsActions");
    return await createYear({ ...data, isCurrent: data.isCurrent ?? false });
  } catch (error) {
    console.error("Error creating academic year:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create academic year"
    };
  }
});

export const updateAcademicYear = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string,
  id: string,
  data: {
    name?: string;
    startDate?: Date;
    endDate?: Date;
    isCurrent?: boolean;
  }
) => {
  try {
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
});

export const deleteAcademicYear = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string) => {
  try {
    const { deleteAcademicYear: deleteYear } = await import("./academicyearsActions");
    return await deleteYear(id);
  } catch (error) {
    console.error("Error deleting academic year:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete academic year"
    };
  }
});

export const getDepartments = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  try {
    const departments = await db.department.findMany({
      where: { schoolId },
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
});

export const getTerms = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  try {
    const terms = await db.term.findMany({
      where: { schoolId },
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
});

export const getGradeScales = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  try {
    const gradeScales = await db.gradeScale.findMany({
      where: { schoolId },
      orderBy: {
        minMarks: "desc",
      },
    });

    return { success: true, data: gradeScales };
  } catch (error) {
    console.error("Error fetching grade scales:", error);
    return { success: false, error: "Failed to fetch grade scales" };
  }
});
