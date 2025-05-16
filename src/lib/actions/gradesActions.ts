"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { GradeFormValues, GradeUpdateFormValues } from "../schemaValidation/gradesSchemaValidation";

// Get all grades
export async function getGrades() {
  try {
    const grades = await db.gradeScale.findMany({
      orderBy: [
        { maxMarks: 'desc' }
      ],
    });
    
    return { success: true, data: grades };
  } catch (error) {
    console.error("Error fetching grades:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch grades" 
    };
  }
}

// Get a single grade by ID
export async function getGradeById(id: string) {
  try {
    const grade = await db.gradeScale.findUnique({
      where: { id },
    });
    
    if (!grade) {
      return { success: false, error: "Grade not found" };
    }
    
    return { success: true, data: grade };
  } catch (error) {
    console.error("Error fetching grade:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch grade" 
    };
  }
}

// Create a new grade
export async function createGrade(data: GradeFormValues) {
  try {
    // Check if grade overlaps with existing grades
    const overlappingGrades = await checkGradeOverlap(data);
    if (overlappingGrades) {
      return { success: false, error: overlappingGrades };
    }

    // Check if grade letter already exists
    const existingGrade = await db.gradeScale.findFirst({
      where: { 
        grade: data.grade
      }
    });

    if (existingGrade) {
      return { success: false, error: "A grade with this letter already exists" };
    }

    const grade = await db.gradeScale.create({
      data: {
        grade: data.grade,
        minMarks: data.minMarks,
        maxMarks: data.maxMarks,
        gpa: data.gpa,
        description: data.description,
      }
    });
    
    revalidatePath("/admin/academic/grades");
    return { success: true, data: grade };
  } catch (error) {
    console.error("Error creating grade:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create grade" 
    };
  }
}

// Update an existing grade
export async function updateGrade(data: GradeUpdateFormValues) {
  try {
    // Check if grade overlaps with existing grades
    const overlappingGrades = await checkGradeOverlap(data, data.id);
    if (overlappingGrades) {
      return { success: false, error: overlappingGrades };
    }

    // Check if grade letter already exists for another grade
    const existingGrade = await db.gradeScale.findFirst({
      where: { 
        grade: data.grade,
        id: { not: data.id }
      }
    });

    if (existingGrade) {
      return { success: false, error: "A grade with this letter already exists" };
    }

    const grade = await db.gradeScale.update({
      where: { id: data.id },
      data: {
        grade: data.grade,
        minMarks: data.minMarks,
        maxMarks: data.maxMarks,
        gpa: data.gpa,
        description: data.description,
      }
    });
    
    revalidatePath("/admin/academic/grades");
    return { success: true, data: grade };
  } catch (error) {
    console.error("Error updating grade:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update grade" 
    };
  }
}

// Delete a grade
export async function deleteGrade(id: string) {
  try {
    // In a full application, we'd check if this grade is being used in exam results
    // before allowing deletion. For simplicity, we're skipping that check for now.
    
    await db.gradeScale.delete({
      where: { id }
    });
    
    revalidatePath("/admin/academic/grades");
    return { success: true };
  } catch (error) {
    console.error("Error deleting grade:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete grade" 
    };
  }
}

// Helper function to check for overlapping grade ranges
async function checkGradeOverlap(data: { minMarks: number, maxMarks: number }, excludeId?: string) {
  const overlappingGrade = await db.gradeScale.findFirst({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      OR: [
        // Check if new min marks falls within existing range
        {
          minMarks: { lte: data.minMarks },
          maxMarks: { gt: data.minMarks }
        },
        // Check if new max marks falls within existing range
        {
          minMarks: { lt: data.maxMarks },
          maxMarks: { gte: data.maxMarks }
        },
        // Check if new range completely contains existing range
        {
          minMarks: { gte: data.minMarks },
          maxMarks: { lte: data.maxMarks }
        }
      ]
    },
  });

  if (overlappingGrade) {
    return `This grade range (${data.minMarks}% - ${data.maxMarks}%) overlaps with existing grade ${overlappingGrade.grade} (${overlappingGrade.minMarks}% - ${overlappingGrade.maxMarks}%)`;
  }

  return null;
}
