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

// Standard grading scale based on CBSE 9-point grading system
const STANDARD_GRADES = [
  { grade: "A1", minMarks: 91, maxMarks: 100, gpa: 10.0, description: "Outstanding" },
  { grade: "A2", minMarks: 81, maxMarks: 90, gpa: 9.0, description: "Excellent" },
  { grade: "B1", minMarks: 71, maxMarks: 80, gpa: 8.0, description: "Very Good" },
  { grade: "B2", minMarks: 61, maxMarks: 70, gpa: 7.0, description: "Good" },
  { grade: "C1", minMarks: 51, maxMarks: 60, gpa: 6.0, description: "Above Average" },
  { grade: "C2", minMarks: 41, maxMarks: 50, gpa: 5.0, description: "Average" },
  { grade: "D", minMarks: 33, maxMarks: 40, gpa: 4.0, description: "Below Average" },
  { grade: "E1", minMarks: 21, maxMarks: 32, gpa: 3.0, description: "Needs Improvement" },
  { grade: "E2", minMarks: 0, maxMarks: 20, gpa: 2.0, description: "Fail" },
];

// Auto-generate standard grades
export async function autoGenerateGrades() {
  try {
    // Get existing grades
    const existingGrades = await db.gradeScale.findMany({
      select: { grade: true }
    });
    const existingGradeNames = new Set(existingGrades.map(g => g.grade));

    // Filter out grades that already exist
    const gradesToCreate = STANDARD_GRADES.filter(g => !existingGradeNames.has(g.grade));

    if (gradesToCreate.length === 0) {
      return {
        success: false,
        error: "All standard grades already exist"
      };
    }

    // Create the new grades
    const result = await db.gradeScale.createMany({
      data: gradesToCreate,
      skipDuplicates: true,
    });

    revalidatePath("/admin/academic/grades");
    return {
      success: true,
      count: result.count,
      message: `Created ${result.count} grades`
    };
  } catch (error) {
    console.error("Error auto-generating grades:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to auto-generate grades"
    };
  }
}
