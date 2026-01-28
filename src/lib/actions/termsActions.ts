"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { TermFormValues, TermUpdateFormValues } from "../schemaValidation/termsSchemaValidation";
import { withSchoolAuthAction } from "../auth/security-wrapper";

// Get all terms
export const getTerms = withSchoolAuthAction(async (schoolId) => {
  try {
    const terms = await db.term.findMany({
      where: { schoolId },
      orderBy: {
        startDate: 'desc',
      },
      include: {
        academicYear: true,
        _count: {
          select: {
            exams: true,
            reportCards: true,
          }
        }
      }
    });

    return { success: true, data: terms };
  } catch (error) {
    console.error("Error fetching terms:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch terms"
    };
  }
});

// Get terms by academic year ID
export const getTermsByAcademicYear = withSchoolAuthAction(async (schoolId, userId, userRole, academicYearId: string) => {
  try {
    const terms = await db.term.findMany({
      where: {
        schoolId,
        academicYearId: academicYearId
      },
      orderBy: {
        startDate: 'asc',
      },
      include: {
        _count: {
          select: {
            exams: true,
            reportCards: true,
          }
        }
      }
    });

    return { success: true, data: terms };
  } catch (error) {
    console.error("Error fetching terms by academic year:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch terms"
    };
  }
});

// Get a single term by ID
export const getTermById = withSchoolAuthAction(async (schoolId, userId, userRole, id: string) => {
  try {
    const term = await db.term.findFirst({
      where: { id, schoolId },
      include: {
        academicYear: true,
        exams: {
          where: { schoolId },
          include: {
            subject: true,
            examType: true,
            _count: {
              select: {
                results: true
              }
            }
          }
        },
      }
    });

    if (!term) {
      return { success: false, error: "Term not found" };
    }

    return { success: true, data: term };
  } catch (error) {
    console.error("Error fetching term:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch term"
    };
  }
});

// Create a new term
export const createTerm = withSchoolAuthAction(async (schoolId, userId, userRole, data: TermFormValues) => {
  try {
    // First, check if the academic year exists and belongs to the school
    const academicYear = await db.academicYear.findFirst({
      where: { id: data.academicYearId, schoolId }
    });

    if (!academicYear) {
      return { success: false, error: "Selected academic year does not exist" };
    }

    // Normalize dates to compare only the date part (ignore time)
    const normalizeDate = (date: Date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    };

    const termStart = normalizeDate(data.startDate);
    const termEnd = normalizeDate(data.endDate);
    const yearStart = normalizeDate(academicYear.startDate);
    const yearEnd = normalizeDate(academicYear.endDate);

    // Check if the term dates are within the academic year dates
    if (termStart < yearStart || termEnd > yearEnd) {
      return {
        success: false,
        error: `Term dates must be within the academic year dates (${academicYear.startDate.toLocaleDateString()} to ${academicYear.endDate.toLocaleDateString()})`
      };
    }

    // Check for date conflicts with existing terms in the same academic year
    const overlappingTerms = await db.term.findFirst({
      where: {
        schoolId,
        academicYearId: data.academicYearId,
        OR: [
          {
            startDate: { lte: data.endDate },
            endDate: { gte: data.startDate }
          }
        ]
      }
    });

    if (overlappingTerms) {
      return {
        success: false,
        error: "The term dates overlap with an existing term in this academic year"
      };
    }

    const term = await db.term.create({
      data: {
        schoolId,
        name: data.name,
        academicYearId: data.academicYearId,
        startDate: data.startDate,
        endDate: data.endDate,
      }
    });

    revalidatePath("/admin/academic/terms");
    revalidatePath(`/admin/academic/academic-years/${data.academicYearId}`);
    return { success: true, data: term };
  } catch (error) {
    console.error("Error creating term:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create term"
    };
  }
});

// Update an existing term
export const updateTerm = withSchoolAuthAction(async (schoolId, userId, userRole, data: TermUpdateFormValues) => {
  try {
    // First, check if the academic year exists and belongs to the school
    const academicYear = await db.academicYear.findFirst({
      where: { id: data.academicYearId, schoolId }
    });

    if (!academicYear) {
      return { success: false, error: "Selected academic year does not exist" };
    }

    // Normalize dates to compare only the date part (ignore time)
    const normalizeDate = (date: Date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    };

    const termStart = normalizeDate(data.startDate);
    const termEnd = normalizeDate(data.endDate);
    const yearStart = normalizeDate(academicYear.startDate);
    const yearEnd = normalizeDate(academicYear.endDate);

    // Check if the term dates are within the academic year dates
    if (termStart < yearStart || termEnd > yearEnd) {
      return {
        success: false,
        error: `Term dates must be within the academic year dates (${academicYear.startDate.toLocaleDateString()} to ${academicYear.endDate.toLocaleDateString()})`
      };
    }

    // Check for date conflicts with existing terms in the same academic year
    const overlappingTerms = await db.term.findFirst({
      where: {
        schoolId,
        academicYearId: data.academicYearId,
        id: { not: data.id },
        OR: [
          {
            startDate: { lte: data.endDate },
            endDate: { gte: data.startDate }
          }
        ]
      }
    });

    if (overlappingTerms) {
      return {
        success: false,
        error: "The term dates overlap with an existing term in this academic year"
      };
    }

    const term = await db.term.update({
      where: { id: data.id, schoolId },
      data: {
        name: data.name,
        academicYearId: data.academicYearId,
        startDate: data.startDate,
        endDate: data.endDate,
      }
    });

    revalidatePath("/admin/academic/terms");
    revalidatePath(`/admin/academic/terms/${data.id}`);
    revalidatePath(`/admin/academic/academic-years/${data.academicYearId}`);
    return { success: true, data: term };
  } catch (error) {
    console.error("Error updating term:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update term"
    };
  }
});

// Delete a term
export const deleteTerm = withSchoolAuthAction(async (schoolId, userId, userRole, id: string) => {
  try {
    // Check if term has any dependent records
    const hasExams = await db.exam.findFirst({ where: { termId: id, schoolId } });
    const hasReportCards = await db.reportCard.findFirst({ where: { termId: id, schoolId } });

    if (hasExams || hasReportCards) {
      return {
        success: false,
        error: "Cannot delete this term because it has associated exams or report cards. Remove them first."
      };
    }

    // Get the academic year ID for revalidation
    const term = await db.term.findFirst({
      where: { id, schoolId },
      select: { academicYearId: true }
    });

    if (!term) {
      return { success: false, error: "Term not found" };
    }

    await db.term.delete({
      where: { id, schoolId }
    });

    revalidatePath("/admin/academic/terms");
    if (term.academicYearId) {
      revalidatePath(`/admin/academic/academic-years/${term.academicYearId}`);
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting term:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete term"
    };
  }
});

// Get all academic years for dropdown
export const getAcademicYearsForDropdown = withSchoolAuthAction(async (schoolId) => {
  try {
    const academicYears = await db.academicYear.findMany({
      where: { schoolId },
      orderBy: {
        startDate: 'desc',
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        isCurrent: true
      }
    });

    // Sort to show current year first
    const sortedYears = academicYears.sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return 0;
    });

    return { success: true, data: sortedYears };
  } catch (error) {
    console.error("Error fetching academic years for dropdown:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch academic years"
    };
  }
});
