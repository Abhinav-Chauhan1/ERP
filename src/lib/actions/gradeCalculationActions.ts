"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { calculatePercentage, calculateGradeFromScale } from "@/lib/utils/grade-calculator";

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, string[]>;
}

/**
 * Fetch the applicable grade scale
 * Returns all grade scales sorted by maxMarks descending
 */
export async function getGradeScale(): Promise<ActionResult> {
  try {
    const gradeScale = await db.gradeScale.findMany({
      orderBy: {
        maxMarks: "desc",
      },
    });

    if (gradeScale.length === 0) {
      return {
        success: false,
        error: "No grade scale configured. Please configure grade scales in the system.",
      };
    }

    return {
      success: true,
      data: gradeScale,
    };
  } catch (error) {
    console.error("Error fetching grade scale:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch grade scale",
    };
  }
}

/**
 * Calculate grade for given marks using the configured grade scale
 * @param obtainedMarks - Marks obtained by student
 * @param totalMarks - Total marks for the exam
 * @returns Grade string or null if calculation fails
 */
export async function calculateGradeForMarks(
  obtainedMarks: number,
  totalMarks: number
): Promise<ActionResult<{ grade: string; percentage: number }>> {
  try {
    // Calculate percentage
    const percentage = calculatePercentage(obtainedMarks, totalMarks);

    // Fetch grade scale
    const gradeScaleResult = await getGradeScale();
    
    if (!gradeScaleResult.success || !gradeScaleResult.data) {
      // Fallback to default grade calculation if no scale configured
      const defaultGrade = calculateDefaultGrade(percentage);
      return {
        success: true,
        data: {
          grade: defaultGrade,
          percentage,
        },
      };
    }

    // Calculate grade using the scale
    const grade = calculateGradeFromScale(percentage, gradeScaleResult.data);

    if (!grade) {
      return {
        success: false,
        error: `No grade found for percentage ${percentage}%. Please check grade scale configuration.`,
      };
    }

    return {
      success: true,
      data: {
        grade,
        percentage,
      },
    };
  } catch (error) {
    console.error("Error calculating grade:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to calculate grade",
    };
  }
}

/**
 * Recalculate grades for all exam results in a term
 * This is useful when grade scale is updated
 */
export async function recalculateGradesForTerm(termId: string): Promise<ActionResult> {
  try {
    // Fetch grade scale
    const gradeScaleResult = await getGradeScale();
    
    if (!gradeScaleResult.success || !gradeScaleResult.data) {
      return {
        success: false,
        error: "No grade scale configured. Cannot recalculate grades.",
      };
    }

    const gradeScale = gradeScaleResult.data;

    // Get all exams in the term
    const exams = await db.exam.findMany({
      where: {
        termId,
      },
      select: {
        id: true,
        totalMarks: true,
      },
    });

    if (exams.length === 0) {
      return {
        success: false,
        error: "No exams found for this term",
      };
    }

    const examIds = exams.map((exam) => exam.id);

    // Get all exam results for these exams
    const examResults = await db.examResult.findMany({
      where: {
        examId: {
          in: examIds,
        },
        isAbsent: false, // Don't recalculate for absent students
      },
    });

    // Recalculate grades for each result
    const updates = examResults.map((result) => {
      const exam = exams.find((e) => e.id === result.examId);
      if (!exam) return null;

      const percentage = calculatePercentage(result.marks, exam.totalMarks);
      const grade = calculateGradeFromScale(percentage, gradeScale);

      return db.examResult.update({
        where: {
          id: result.id,
        },
        data: {
          percentage,
          grade: grade || undefined,
        },
      });
    }).filter(Boolean);

    // Execute all updates in a transaction
    await db.$transaction(updates as any[]);

    // Revalidate relevant paths
    revalidatePath("/admin/assessment/results");
    revalidatePath("/admin/assessment/exams");

    return {
      success: true,
      data: {
        updatedCount: updates.length,
        message: `Successfully recalculated grades for ${updates.length} exam results`,
      },
    };
  } catch (error) {
    console.error("Error recalculating grades:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to recalculate grades",
    };
  }
}

/**
 * Recalculate grades for a specific exam
 */
export async function recalculateGradesForExam(examId: string): Promise<ActionResult> {
  try {
    // Fetch grade scale
    const gradeScaleResult = await getGradeScale();
    
    if (!gradeScaleResult.success || !gradeScaleResult.data) {
      return {
        success: false,
        error: "No grade scale configured. Cannot recalculate grades.",
      };
    }

    const gradeScale = gradeScaleResult.data;

    // Get exam details
    const exam = await db.exam.findUnique({
      where: {
        id: examId,
      },
      select: {
        id: true,
        totalMarks: true,
      },
    });

    if (!exam) {
      return {
        success: false,
        error: "Exam not found",
      };
    }

    // Get all exam results for this exam
    const examResults = await db.examResult.findMany({
      where: {
        examId,
        isAbsent: false, // Don't recalculate for absent students
      },
    });

    if (examResults.length === 0) {
      return {
        success: true,
        data: {
          updatedCount: 0,
          message: "No exam results found to recalculate",
        },
      };
    }

    // Recalculate grades for each result
    const updates = examResults.map((result) => {
      const percentage = calculatePercentage(result.marks, exam.totalMarks);
      const grade = calculateGradeFromScale(percentage, gradeScale);

      return db.examResult.update({
        where: {
          id: result.id,
        },
        data: {
          percentage,
          grade: grade || undefined,
        },
      });
    });

    // Execute all updates in a transaction
    await db.$transaction(updates);

    // Revalidate relevant paths
    revalidatePath("/admin/assessment/results");
    revalidatePath(`/admin/assessment/exams/${examId}`);

    return {
      success: true,
      data: {
        updatedCount: updates.length,
        message: `Successfully recalculated grades for ${updates.length} exam results`,
      },
    };
  } catch (error) {
    console.error("Error recalculating grades:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to recalculate grades",
    };
  }
}

/**
 * Fallback default grade calculation when no grade scale is configured
 */
function calculateDefaultGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C+";
  if (percentage >= 40) return "C";
  if (percentage >= 33) return "D";
  return "F";
}
