"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PermissionAction } from "@prisma/client";
import { hasPermission } from "@/lib/utils/permissions";
import { calculatePercentage, calculateGradeFromScale } from "@/lib/utils/grade-calculator";
import { getGradeScale } from "./gradeCalculationActions";
import { logUpdate, logCreate } from "@/lib/utils/audit-log";
import {
  validateBulkMarks,
  formatValidationErrors,
  createErrorResponse,
  separateValidInvalidEntries,
  type MarkConfig,
  type MarkEntry,
} from "@/lib/utils/marks-validation";

export interface StudentMarkEntry {
  studentId: string;
  theoryMarks?: number | null;
  practicalMarks?: number | null;
  internalMarks?: number | null;
  isAbsent: boolean;
  remarks?: string;
}

export interface SaveMarksInput {
  examId: string;
  subjectId: string;
  marks: StudentMarkEntry[];
  isDraft?: boolean;
}

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, string[]>;
}

/**
 * Get enrolled students for marks entry
 */
export async function getEnrolledStudentsForMarks(
  examId: string,
  classId: string,
  sectionId: string
): Promise<ActionResult> {
  try {
    // Get exam details to fetch subject mark config
    const exam = await db.exam.findUnique({
      where: { id: examId },
      include: {
        subject: true,
        subjectMarkConfig: {
          where: {
            subjectId: {
              not: undefined,
            },
          },
        },
      },
    });

    if (!exam) {
      return { success: false, error: "Exam not found" };
    }

    // Get enrolled students
    const students = await db.student.findMany({
      where: {
        enrollments: {
          some: {
            classId,
            sectionId,
            status: "ACTIVE",
          },
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        examResults: {
          where: {
            examId,
          },
        },
      },
      orderBy: {
        rollNumber: "asc",
      },
    });

    // Get subject mark configuration for this exam
    const markConfig = await db.subjectMarkConfig.findUnique({
      where: {
        examId_subjectId: {
          examId,
          subjectId: exam.subjectId,
        },
      },
    });

    // Format student data with existing marks if any
    const studentsWithMarks = students.map((student) => {
      const existingResult = student.examResults[0];

      return {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        rollNumber: student.rollNumber || "",
        avatar: student.user.avatar,
        theoryMarks: existingResult?.theoryMarks ?? null,
        practicalMarks: existingResult?.practicalMarks ?? null,
        internalMarks: existingResult?.internalMarks ?? null,
        totalMarks: existingResult?.totalMarks ?? null,
        percentage: existingResult?.percentage ?? null,
        grade: existingResult?.grade ?? null,
        isAbsent: existingResult?.isAbsent ?? false,
        remarks: existingResult?.remarks ?? "",
        resultId: existingResult?.id,
      };
    });

    return {
      success: true,
      data: {
        students: studentsWithMarks,
        exam,
        markConfig,
      },
    };
  } catch (error) {
    console.error("Error fetching enrolled students:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch students",
    };
  }
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
 * Save marks in bulk with comprehensive validation
 */
export async function saveExamMarks(input: SaveMarksInput): Promise<ActionResult> {
  try {
    // Get current user
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return createErrorResponse(
        "Unauthorized access",
        "UNAUTHORIZED"
      );
    }

    // Permission check: require MARKS:CREATE
    const canCreateMarks = await hasPermission(userId, 'MARKS', 'CREATE');
    if (!canCreateMarks) {
      return createErrorResponse(
        "You do not have permission to enter marks",
        "PERMISSION_DENIED"
      );
    }

    // Get the database user record
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return createErrorResponse(
        "User not found",
        "USER_NOT_FOUND"
      );
    }

    // Get exam details
    const exam = await db.exam.findUnique({
      where: { id: input.examId },
      include: {
        subject: true,
      },
    });

    if (!exam) {
      return createErrorResponse(
        "Exam not found",
        "EXAM_NOT_FOUND"
      );
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

    // Convert input marks to MarkEntry type
    const markEntries: MarkEntry[] = input.marks.map((m) => ({
      studentId: m.studentId,
      theoryMarks: m.theoryMarks,
      practicalMarks: m.practicalMarks,
      internalMarks: m.internalMarks,
      isAbsent: m.isAbsent,
      remarks: m.remarks,
    }));

    // Comprehensive validation
    const validation = validateBulkMarks(markEntries, config);

    // Check for duplicates
    if (validation.duplicates.size > 0) {
      const duplicateDetails: Record<string, string[]> = {};
      validation.duplicates.forEach((indices, studentId) => {
        duplicateDetails[`duplicate_${studentId}`] = [
          `Duplicate entries found for student ${studentId} at positions: ${indices.join(", ")}`,
        ];
      });

      return createErrorResponse(
        "Duplicate entries detected",
        "DUPLICATE_ENTRIES",
        duplicateDetails,
        validation.duplicates
      );
    }

    // Check for validation errors
    if (!validation.isValid) {
      const formattedErrors = formatValidationErrors(validation.errors);
      return createErrorResponse(
        "Validation failed for one or more entries",
        "VALIDATION_ERROR",
        formattedErrors
      );
    }

    // Check for existing results to detect potential overwrites
    const existingResults = await db.examResult.findMany({
      where: {
        examId: input.examId,
        studentId: {
          in: input.marks.map((m) => m.studentId),
        },
      },
      select: {
        studentId: true,
        totalMarks: true,
      },
    });

    // Warn about overwrites if not in draft mode
    if (!input.isDraft && existingResults.length > 0) {
      const overwriteWarnings: Record<string, string[]> = {};
      existingResults.forEach((result, index) => {
        overwriteWarnings[`overwrite_${result.studentId}`] = [
          `Existing marks (${result.totalMarks}) will be overwritten for this student`,
        ];
      });

      // Return warning but allow to proceed
      // In a real implementation, you might want to require explicit confirmation
    }

    // Save marks using transaction
    const results = await db.$transaction(async (tx) => {
      const allResults = [];

      for (const entry of input.marks) {
        // Get existing result for audit logging
        const existingResult = await tx.examResult.findUnique({
          where: {
            examId_studentId: {
              examId: input.examId,
              studentId: entry.studentId,
            },
          },
        });

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

        const newData = {
          examId: input.examId,
          studentId: entry.studentId,
          marks: totalMarks,
          theoryMarks: entry.theoryMarks,
          practicalMarks: entry.practicalMarks,
          internalMarks: entry.internalMarks,
          totalMarks,
          percentage,
          grade: entry.isAbsent ? null : grade,
          isAbsent: entry.isAbsent,
          remarks: entry.remarks || null,
        };

        const result = await tx.examResult.upsert({
          where: {
            examId_studentId: {
              examId: input.examId,
              studentId: entry.studentId,
            },
          },
          create: newData,
          update: newData,
        });

        // Create audit log entry
        if (existingResult) {
          // Update - log before and after values
          await logUpdate(
            user.id,
            "ExamResult",
            result.id,
            {
              before: {
                theoryMarks: existingResult.theoryMarks,
                practicalMarks: existingResult.practicalMarks,
                internalMarks: existingResult.internalMarks,
                totalMarks: existingResult.totalMarks,
                percentage: existingResult.percentage,
                grade: existingResult.grade,
                isAbsent: existingResult.isAbsent,
                remarks: existingResult.remarks,
              },
              after: {
                theoryMarks: entry.theoryMarks,
                practicalMarks: entry.practicalMarks,
                internalMarks: entry.internalMarks,
                totalMarks,
                percentage,
                grade: entry.isAbsent ? null : grade,
                isAbsent: entry.isAbsent,
                remarks: entry.remarks || null,
              },
            }
          );
        } else {
          // Create - log new entry
          await logCreate(
            user.id,
            "ExamResult",
            result.id,
            {
              examId: input.examId,
              studentId: entry.studentId,
              theoryMarks: entry.theoryMarks,
              practicalMarks: entry.practicalMarks,
              internalMarks: entry.internalMarks,
              totalMarks,
              percentage,
              grade: entry.isAbsent ? null : grade,
              isAbsent: entry.isAbsent,
              remarks: entry.remarks || null,
            }
          );
        }

        allResults.push(result);
      }

      return allResults;
    });


    revalidatePath("/admin/assessment/marks-entry");
    revalidatePath(`/admin/assessment/exams/${input.examId}`);
    revalidatePath("/admin/assessment/results");

    return {
      success: true,
      data: {
        savedCount: results.length,
        isDraft: input.isDraft,
      },
      error: undefined,
    };
  } catch (error) {
    console.error("Error saving marks:", error);

    // Provide specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return createErrorResponse(
          "Duplicate entry detected in database",
          "DATABASE_DUPLICATE"
        );
      }
      if (error.message.includes("Foreign key constraint")) {
        return createErrorResponse(
          "Invalid reference: Student or exam not found",
          "INVALID_REFERENCE"
        );
      }
      return createErrorResponse(
        error.message,
        "DATABASE_ERROR"
      );
    }

    return createErrorResponse(
      "An unexpected error occurred while saving marks",
      "UNKNOWN_ERROR"
    );
  }
}

/**
 * Get classes for dropdown
 */
export async function getClassesForMarksEntry(): Promise<ActionResult> {
  try {
    const classes = await db.class.findMany({
      include: {
        sections: {
          orderBy: {
            name: "asc",
          },
        },
        academicYear: {
          select: {
            name: true,
            isCurrent: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return { success: true, data: classes };
  } catch (error) {
    console.error("Error fetching classes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch classes",
    };
  }
}

/**
 * Get exams for dropdown
 */
export async function getExamsForMarksEntry(): Promise<ActionResult> {
  try {
    const exams = await db.exam.findMany({
      include: {
        subject: {
          select: {
            name: true,
          },
        },
        examType: {
          select: {
            name: true,
          },
        },
        term: {
          select: {
            name: true,
            academicYear: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        examDate: "desc",
      },
    });

    return { success: true, data: exams };
  } catch (error) {
    console.error("Error fetching exams:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch exams",
    };
  }
}

/**
 * Get audit logs for marks entry
 */
export async function getMarksAuditLogs(filters: {
  examId?: string;
  studentId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<ActionResult> {
  try {
    const where: any = {
      resource: "ExamResult",
    };

    // Build where clause based on filters
    if (filters.examId || filters.studentId) {
      where.OR = [];

      if (filters.examId) {
        where.OR.push({
          changes: {
            path: ["created", "examId"],
            equals: filters.examId,
          },
        });
        where.OR.push({
          changes: {
            path: ["before", "examId"],
            equals: filters.examId,
          },
        });
      }

      if (filters.studentId) {
        where.OR.push({
          changes: {
            path: ["created", "studentId"],
            equals: filters.studentId,
          },
        });
        where.OR.push({
          changes: {
            path: ["before", "studentId"],
            equals: filters.studentId,
          },
        });
      }
    }

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      db.auditLog.count({ where }),
    ]);

    return {
      success: true,
      data: {
        logs,
        total,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch audit logs",
    };
  }
}

/**
 * Get last modified info for an exam result
 */
export async function getExamResultLastModified(
  examId: string,
  studentId: string
): Promise<ActionResult> {
  try {
    const lastLog = await db.auditLog.findFirst({
      where: {
        resource: "ExamResult",
        OR: [
          {
            changes: {
              path: ["created", "examId"],
              equals: examId,
            },
          },
          {
            changes: {
              path: ["before", "examId"],
              equals: examId,
            },
          },
        ],
        AND: [
          {
            OR: [
              {
                changes: {
                  path: ["created", "studentId"],
                  equals: studentId,
                },
              },
              {
                changes: {
                  path: ["before", "studentId"],
                  equals: studentId,
                },
              },
            ],
          },
        ],
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    if (!lastLog) {
      return {
        success: true,
        data: null,
      };
    }

    return {
      success: true,
      data: {
        timestamp: lastLog.timestamp,
        user: lastLog.user,
        action: lastLog.action,
      },
    };
  } catch (error) {
    console.error("Error fetching last modified info:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch last modified info",
    };
  }
}
