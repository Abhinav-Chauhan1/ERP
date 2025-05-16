"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { TermFormValues, TermUpdateFormValues } from "../schemaValidation/termsSchemaValidation";

// Get all terms
export async function getTerms() {
  try {
    const terms = await db.term.findMany({
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
}

// Get terms by academic year ID
export async function getTermsByAcademicYear(academicYearId: string) {
  try {
    const terms = await db.term.findMany({
      where: {
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
}

// Get a single term by ID
export async function getTermById(id: string) {
  try {
    const term = await db.term.findUnique({
      where: { id },
      include: {
        academicYear: true,
        exams: {
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
}

// Create a new term
export async function createTerm(data: TermFormValues) {
  try {
    // First, check if the academic year exists
    const academicYear = await db.academicYear.findUnique({
      where: { id: data.academicYearId }
    });

    if (!academicYear) {
      return { success: false, error: "Selected academic year does not exist" };
    }

    // Check if the term dates are within the academic year dates
    if (data.startDate < academicYear.startDate || data.endDate > academicYear.endDate) {
      return { 
        success: false, 
        error: "Term dates must be within the academic year dates" 
      };
    }

    // Check for date conflicts with existing terms in the same academic year
    const overlappingTerms = await db.term.findFirst({
      where: {
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
}

// Update an existing term
export async function updateTerm(data: TermUpdateFormValues) {
  try {
    // First, check if the academic year exists
    const academicYear = await db.academicYear.findUnique({
      where: { id: data.academicYearId }
    });

    if (!academicYear) {
      return { success: false, error: "Selected academic year does not exist" };
    }

    // Check if the term dates are within the academic year dates
    if (data.startDate < academicYear.startDate || data.endDate > academicYear.endDate) {
      return { 
        success: false, 
        error: "Term dates must be within the academic year dates" 
      };
    }

    // Check for date conflicts with existing terms in the same academic year
    const overlappingTerms = await db.term.findFirst({
      where: {
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
      where: { id: data.id },
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
}

// Delete a term
export async function deleteTerm(id: string) {
  try {
    // Check if term has any dependent records
    const hasExams = await db.exam.findFirst({ where: { termId: id } });
    const hasReportCards = await db.reportCard.findFirst({ where: { termId: id } });
    
    if (hasExams || hasReportCards) {
      return {
        success: false,
        error: "Cannot delete this term because it has associated exams or report cards. Remove them first."
      };
    }
    
    // Get the academic year ID for revalidation
    const term = await db.term.findUnique({
      where: { id },
      select: { academicYearId: true }
    });
    
    if (!term) {
      return { success: false, error: "Term not found" };
    }
    
    await db.term.delete({
      where: { id }
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
}

// Get all academic years for dropdown
export async function getAcademicYearsForDropdown() {
  try {
    const academicYears = await db.academicYear.findMany({
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
    
    return { success: true, data: academicYears };
  } catch (error) {
    console.error("Error fetching academic years for dropdown:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch academic years" 
    };
  }
}
