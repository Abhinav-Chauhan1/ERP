"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { AcademicYearFormValues, AcademicYearUpdateFormValues } from "../schemaValidation/academicyearsSchemaValidation";
import { invalidateAcademicYearCache } from "../utils/cache-invalidation";

// Get all academic years
export async function getAcademicYears() {
  try {
    const academicYears = await db.academicYear.findMany({
      orderBy: {
        startDate: 'desc',
      },
      include: {
        _count: {
          select: {
            terms: true,
            classes: true,
          }
        }
      }
    });
    
    // Sort to show current year first
    const sortedYears = academicYears.sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return 0;
    });
    
    // Always return an array, never undefined
    return { success: true, data: sortedYears };
  } catch (error) {
    console.error("Error fetching academic years:", error);
    // Ensure error is always a string
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch academic years" 
    };
  }
}

// Get a single academic year by ID
export async function getAcademicYearById(id: string) {
  try {
    const academicYear = await db.academicYear.findUnique({
      where: { id },
      include: {
        terms: {
          orderBy: {
            startDate: 'asc',
          }
        },
        classes: {
          include: {
            _count: {
              select: {
                sections: true,
                enrollments: true,
              }
            }
          }
        },
      }
    });
    
    if (!academicYear) {
      return { success: false, error: "Academic year not found" };
    }
    
    // academicYear is definitely not null here
    return { success: true, data: academicYear };
  } catch (error) {
    console.error("Error fetching academic year:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch academic year" 
    };
  }
}

// Create a new academic year
export async function createAcademicYear(data: AcademicYearFormValues) {
  try {
    // Validate that end date is after start date
    if (data.endDate <= data.startDate) {
      return { 
        success: false, 
        error: "End date must be after start date" 
      };
    }
    
    // If this year is being set as current, update all other years
    if (data.isCurrent) {
      await db.academicYear.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false }
      });
    }
    
    const academicYear = await db.academicYear.create({
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        isCurrent: data.isCurrent,
      }
    });
    
    // Invalidate all affected caches
    await invalidateAcademicYearCache();
    
    // Invalidate specific paths that display academic years
    revalidatePath("/admin/academic/academic-years");
    revalidatePath("/admin/academic");
    revalidatePath("/admin/classes");
    revalidatePath("/admin/academic/terms");
    revalidatePath("/admin/finance/fee-structure");
    revalidatePath("/admin/finance/scholarships");
    revalidatePath("/admin/finance/budget");
    revalidatePath("/admin/reports/financial");
    revalidatePath("/admin/reports/attendance");
    revalidatePath("/admin/reports/academic");
    revalidatePath("/admin/reports/performance");
    revalidatePath("/student/assessments/report-cards");
    revalidatePath("/parent/performance/report-cards");
    
    return { success: true, data: academicYear };
  } catch (error) {
    console.error("Error creating academic year:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create academic year" 
    };
  }
}

// Update an academic year
export async function updateAcademicYear(data: AcademicYearUpdateFormValues) {
  try {
    // Validate that end date is after start date
    if (data.startDate && data.endDate && data.endDate <= data.startDate) {
      return { 
        success: false, 
        error: "End date must be after start date" 
      };
    }
    
    // If this year is being set as current, update all other years
    if (data.isCurrent) {
      await db.academicYear.updateMany({
        where: { 
          id: { not: data.id },
          isCurrent: true 
        },
        data: { isCurrent: false }
      });
    }
    
    const academicYear = await db.academicYear.update({
      where: { id: data.id },
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        isCurrent: data.isCurrent,
      }
    });
    
    // Invalidate all affected caches
    await invalidateAcademicYearCache();
    
    // Invalidate specific paths that display academic years
    revalidatePath("/admin/academic/academic-years");
    revalidatePath(`/admin/academic/academic-years/${data.id}`);
    revalidatePath("/admin/academic");
    revalidatePath("/admin/classes");
    revalidatePath("/admin/academic/terms");
    revalidatePath("/admin/finance/fee-structure");
    revalidatePath("/admin/finance/scholarships");
    revalidatePath("/admin/finance/budget");
    revalidatePath("/admin/reports/financial");
    revalidatePath("/admin/reports/attendance");
    revalidatePath("/admin/reports/academic");
    revalidatePath("/admin/reports/performance");
    revalidatePath("/student/assessments/report-cards");
    revalidatePath("/parent/performance/report-cards");
    
    return { success: true, data: academicYear };
  } catch (error) {
    console.error("Error updating academic year:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update academic year" 
    };
  }
}

// Delete an academic year
export async function deleteAcademicYear(id: string) {
  try {
    // Check if the academic year has any related records
    const hasTerms = await db.term.findFirst({ where: { academicYearId: id } });
    const hasClasses = await db.class.findFirst({ where: { academicYearId: id } });
    
    if (hasTerms || hasClasses) {
      return {
        success: false,
        error: "Cannot delete this academic year because it has associated terms or classes. Remove them first."
      };
    }
    
    await db.academicYear.delete({
      where: { id }
    });
    
    // Invalidate all affected caches
    await invalidateAcademicYearCache();
    
    // Invalidate specific paths that display academic years
    revalidatePath("/admin/academic/academic-years");
    revalidatePath("/admin/academic");
    revalidatePath("/admin/classes");
    revalidatePath("/admin/academic/terms");
    revalidatePath("/admin/finance/fee-structure");
    revalidatePath("/admin/finance/scholarships");
    revalidatePath("/admin/finance/budget");
    revalidatePath("/admin/reports/financial");
    revalidatePath("/admin/reports/attendance");
    revalidatePath("/admin/reports/academic");
    revalidatePath("/admin/reports/performance");
    revalidatePath("/student/assessments/report-cards");
    revalidatePath("/parent/performance/report-cards");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting academic year:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete academic year" 
    };
  }
}
