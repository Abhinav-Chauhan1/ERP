"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AuditAction } from "@prisma/client";
import { calculatePercentage, calculateGradeFromScale } from "@/lib/utils/grade-calculator";
import { getGradeScale } from "./gradeCalculationActions";
import {
  validateMarkEntry,
  createErrorResponse,
  type MarkConfig,
  type MarkEntry,
} from "@/lib/utils/marks-validation";

export interface ImportMarkEntry {
  studentId?: string;
  rollNumber?: string;
  name?: string;
  theoryMarks?: number | null;
  practicalMarks?: number | null;
  internalMarks?: number | null;
  isAbsent?: boolean;
  remarks?: string;
}

export interface ImportMarksInput {
  examId: string;
  subjectId: string;
  data: ImportMarkEntry[];
}

export interface ImportError {
  row: number;
  studentIdentifier: string;
  message: string;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  failedCount: number;
  errors: ImportError[];
  error?: string;
}

/**
 * Calculate grade based on percentage using the configured grade scale
 */
async function calculateGradeForPercentage(percentage: number): Promise<string> {
  // Fetch grade scale
  const gradeScaleResult = await getGradeScale();

  if (!gradeScaleResult.success || !gradeScaleResult.data) {
    // Fallback to default grade calculation
    return calculateDefaultGrade(percentage);
  }

  const grade = calculateGradeFromScale(percentage, gradeScaleResult.data);

  // If no grade found in scale, use default
  return grade || calculateDefaultGrade(percentage);
}

/**
 * Fallback default grade calculation
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

/**
 * Import marks from file data with comprehensive validation
 */
export async function importMarksFromFile(
  input: ImportMarksInput
): Promise<ImportResult> {
  try {
    // Get current user
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        success: false,
        totalRows: 0,
        successCount: 0,
        failedCount: 0,
        errors: [],
        error: "Unauthorized",
      };
    }

    // Get the database user record
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return {
        success: false,
        totalRows: 0,
        successCount: 0,
        failedCount: 0,
        errors: [],
        error: "User not found",
      };
    }

    // Get exam details
    const exam = await db.exam.findUnique({
      where: { id: input.examId },
      include: {
        subject: true,
      },
    });

    if (!exam) {
      return {
        success: false,
        totalRows: 0,
        successCount: 0,
        failedCount: 0,
        errors: [],
        error: "Exam not found",
      };
    }

    // Get subject mark configuration
    const markConfig = await db.subjectMarkConfig.findUnique({
      where: {
        examId_subjectId: {
          examId: input.examId,
          subjectId: exam.subjectId,
        },
      },
    });

    // Convert to MarkConfig type
    const config: MarkConfig | null = markConfig
      ? {
        theoryMaxMarks: markConfig.theoryMaxMarks,
        practicalMaxMarks: markConfig.practicalMaxMarks,
        internalMaxMarks: markConfig.internalMaxMarks,
        totalMarks: markConfig.totalMarks,
      }
      : null;

    // Process each row
    const errors: ImportError[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < input.data.length; i++) {
      const entry = input.data[i];
      const rowNumber = i + 2; // +2 because index starts at 0 and row 1 is header
      const studentIdentifier = entry.rollNumber || entry.studentId || entry.name || `Row ${rowNumber}`;

      try {
        // Find student by ID or roll number
        let student = null;

        if (entry.studentId) {
          student = await db.student.findUnique({
            where: { id: entry.studentId },
          });
        }

        if (!student && entry.rollNumber) {
          student = await db.student.findFirst({
            where: { rollNumber: entry.rollNumber },
          });
        }

        if (!student) {
          errors.push({
            row: rowNumber,
            studentIdentifier,
            message: "Student not found with provided ID or roll number",
          });
          failedCount++;
          continue;
        }

        // Convert to MarkEntry for validation
        const markEntry: MarkEntry = {
          studentId: student.id,
          theoryMarks: entry.theoryMarks,
          practicalMarks: entry.practicalMarks,
          internalMarks: entry.internalMarks,
          isAbsent: entry.isAbsent || false,
          remarks: entry.remarks,
        };

        // Validate marks using comprehensive validation
        const validation = validateMarkEntry(markEntry, config);
        if (!validation.isValid) {
          const errorMessages = validation.errors.map((e) => e.message).join("; ");
          errors.push({
            row: rowNumber,
            studentIdentifier,
            message: errorMessages,
          });
          failedCount++;
          continue;
        }

        // Calculate total marks and percentage
        let totalMarks = 0;
        let percentage = 0;
        let grade = "";

        if (!entry.isAbsent) {
          totalMarks =
            (entry.theoryMarks || 0) +
            (entry.practicalMarks || 0) +
            (entry.internalMarks || 0);

          percentage = calculatePercentage(totalMarks, exam.totalMarks);
          grade = await calculateGradeForPercentage(percentage);
        }

        // Save to database
        await db.examResult.upsert({
          where: {
            examId_studentId: {
              examId: input.examId,
              studentId: student.id,
            },
          },
          create: {
            examId: input.examId,
            studentId: student.id,
            marks: totalMarks,
            theoryMarks: entry.theoryMarks,
            practicalMarks: entry.practicalMarks,
            internalMarks: entry.internalMarks,
            totalMarks,
            percentage,
            grade: entry.isAbsent ? null : grade,
            isAbsent: entry.isAbsent || false,
            remarks: entry.remarks || null,
          },
          update: {
            marks: totalMarks,
            theoryMarks: entry.theoryMarks,
            practicalMarks: entry.practicalMarks,
            internalMarks: entry.internalMarks,
            totalMarks,
            percentage,
            grade: entry.isAbsent ? null : grade,
            isAbsent: entry.isAbsent || false,
            remarks: entry.remarks || null,
          },
        });

        // Create audit log entry
        await db.auditLog.create({
          data: {
            userId: user.id,
            action: AuditAction.UPDATE,
            resource: "EXAM_RESULT",
            changes: {
              examId: input.examId,
              studentId: student.id,
              rollNumber: entry.rollNumber,
              theoryMarks: entry.theoryMarks,
              practicalMarks: entry.practicalMarks,
              internalMarks: entry.internalMarks,
              isAbsent: entry.isAbsent,
              source: "file_import",
            },
          },
        });

        successCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        errors.push({
          row: rowNumber,
          studentIdentifier,
          message: errorMessage,
        });
        failedCount++;
      }
    }

    // Revalidate paths
    revalidatePath("/admin/assessment/marks-entry");
    revalidatePath(`/admin/assessment/exams/${input.examId}`);
    revalidatePath("/admin/assessment/results");

    return {
      success: successCount > 0,
      totalRows: input.data.length,
      successCount,
      failedCount,
      errors,
    };
  } catch (error) {
    console.error("Error importing marks:", error);
    return {
      success: false,
      totalRows: input.data.length,
      successCount: 0,
      failedCount: input.data.length,
      errors: [],
      error: error instanceof Error ? error.message : "Failed to import marks",
    };
  }
}
