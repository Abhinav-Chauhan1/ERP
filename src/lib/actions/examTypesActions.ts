"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSchoolAccess } from "@/lib/auth/tenant";
import { ExamTypeFormValues, ExamTypeUpdateFormValues } from "../schemaValidation/examTypesSchemaValidation";

// Fetch all exam types
export async function getExamTypes() {
  try {
    const examTypes = await db.examType.findMany({
      include: {
        _count: {
          select: {
            exams: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return { 
      success: true, 
      data: examTypes.map(type => ({
        ...type,
        examsCount: type._count.exams,
        // Default grade thresholds
        gradeThresholds: [
          { grade: "A", minScore: 90, description: "Excellent" },
          { grade: "B", minScore: 80, description: "Very Good" },
          { grade: "C", minScore: 70, description: "Good" },
          { grade: "D", minScore: 60, description: "Satisfactory" },
          { grade: "F", minScore: 0, description: "Fail" }
        ]
      }))
    };
  } catch (error) {
    console.error("Error fetching exam types:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch exam types" 
    };
  }
}

// Get an exam type by ID
export async function getExamTypeById(id: string) {
  try {
    const examType = await db.examType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            exams: true
          }
        }
      }
    });

    if (!examType) {
      return { success: false, error: "Exam type not found" };
    }

    return { 
      success: true, 
      data: {
        ...examType,
        examsCount: examType._count.exams,
        // Default grade thresholds
        gradeThresholds: [
          { grade: "A", minScore: 90, description: "Excellent" },
          { grade: "B", minScore: 80, description: "Very Good" },
          { grade: "C", minScore: 70, description: "Good" },
          { grade: "D", minScore: 60, description: "Satisfactory" },
          { grade: "F", minScore: 0, description: "Fail" }
        ]
      }
    };
  } catch (error) {
    console.error("Error fetching exam type:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch exam type" 
    };
  }
}

// Create a new exam type
export async function createExamType(data: ExamTypeFormValues) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };
    
    // Check if an exam type with this name already exists
    const existingType = await db.examType.findFirst({
      where: {
        schoolId,
        name: {
          equals: data.name,
          mode: 'insensitive'
        }
      }
    });

    if (existingType) {
      return { success: false, error: "An exam type with this name already exists" };
    }

    const examType = await db.examType.create({
      data: {
        name: data.name,
        description: data.description,
        weight: data.weight,
        isActive: data.isActive,
        canRetest: data.canRetest,
        includeInGradeCard: data.includeInGradeCard,
        school: {
          connect: { id: schoolId }
        }
      }
    });

    revalidatePath("/admin/assessment/exam-types");
    return { success: true, data: examType };
  } catch (error) {
    console.error("Error creating exam type:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create exam type" 
    };
  }
}

// Update an existing exam type
export async function updateExamType(data: ExamTypeUpdateFormValues) {
  try {
    // Check if an exam type with this name already exists (excluding the current one)
    const existingType = await db.examType.findFirst({
      where: {
        name: {
          equals: data.name,
          mode: 'insensitive'
        },
        id: {
          not: data.id
        }
      }
    });

    if (existingType) {
      return { success: false, error: "An exam type with this name already exists" };
    }

    const examType = await db.examType.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
        weight: data.weight,
        isActive: data.isActive,
        canRetest: data.canRetest,
        includeInGradeCard: data.includeInGradeCard,
      }
    });

    revalidatePath("/admin/assessment/exam-types");
    return { success: true, data: examType };
  } catch (error) {
    console.error("Error updating exam type:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update exam type" 
    };
  }
}

// Delete an exam type
export async function deleteExamType(id: string) {
  try {
    // Check if any exams are using this exam type
    const examCount = await db.exam.count({
      where: { examTypeId: id }
    });

    if (examCount > 0) {
      return { 
        success: false, 
        error: `Cannot delete this exam type because it's used by ${examCount} exams. Please reassign those exams first.`
      };
    }

    await db.examType.delete({
      where: { id }
    });

    revalidatePath("/admin/assessment/exam-types");
    return { success: true };
  } catch (error) {
    console.error("Error deleting exam type:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete exam type" 
    };
  }
}

// Get exam statistics by type
export async function getExamStatsByType(id: string) {
  try {
    const exams = await db.exam.findMany({
      where: { examTypeId: id },
      include: {
        results: true
      }
    });

    // Calculate statistics
    const totalExams = exams.length;
    const totalStudents = exams.reduce((sum, exam) => sum + exam.results.length, 0);
    const averageScore = exams.reduce((sum, exam) => {
      const examAverage = exam.results.length > 0 
        ? exam.results.reduce((s, r) => s + r.marks, 0) / exam.results.length
        : 0;
      return sum + examAverage;
    }, 0) / (totalExams || 1);
    
    const passRate = exams.reduce((sum, exam) => {
      const passCount = exam.results.filter(r => r.marks >= exam.passingMarks).length;
      const passPercentage = exam.results.length > 0 
        ? (passCount / exam.results.length) * 100
        : 0;
      return sum + passPercentage;
    }, 0) / (totalExams || 1);

    return { 
      success: true, 
      data: {
        totalExams,
        totalStudents,
        averageScore,
        passRate
      }
    };
  } catch (error) {
    console.error("Error fetching exam statistics:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch exam statistics" 
    };
  }
}
