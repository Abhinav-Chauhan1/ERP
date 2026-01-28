"use server";

import { withSchoolAuthAction } from "@/lib/auth/security-wrapper";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { PermissionAction } from "@prisma/client";
import { hasPermission } from "@/lib/utils/permissions";
import {
  ExamFormValues,
  ExamUpdateFormValues,
  ExamResultFormValues
} from "../schemaValidation/examsSchemaValidation";
import {
  createCalendarEventFromExam,
  updateCalendarEventFromExam,
  deleteCalendarEventFromExam
} from "../services/exam-calendar-integration";

// Helper to check permission and throw if denied
async function checkPermission(resource: string, action: PermissionAction, errorMessage?: string) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error('Unauthorized: You must be logged in');
  }

  const allowed = await hasPermission(userId, resource, action);
  if (!allowed) {
    throw new Error(errorMessage || `Permission denied: Cannot ${action} ${resource}`);
  }

  return userId;
}

// Get upcoming exams
export const getUpcomingExams = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const currentDate = new Date();

    const exams = await db.exam.findMany({
      where: {
        schoolId,
        examDate: {
          gte: currentDate
        }
      },
      include: {
        examType: true,
        subject: true,
        term: {
          include: {
            academicYear: true
          }
        },
        creator: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        _count: {
          select: {
            results: true
          }
        }
      },
      orderBy: {
        examDate: 'asc'
      }
    });

    return { success: true, data: exams };
  } catch (error) {
    console.error("Error fetching upcoming exams:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch upcoming exams"
    };
  }
});

// Get past exams
export const getPastExams = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const currentDate = new Date();

    const exams = await db.exam.findMany({
      where: {
        schoolId,
        examDate: {
          lt: currentDate
        }
      },
      include: {
        examType: true,
        subject: true,
        term: {
          include: {
            academicYear: true
          }
        },
        results: true
      },
      orderBy: {
        examDate: 'desc'
      }
    });

    // Calculate result statistics for each exam
    const examsWithStats = exams.map(exam => {
      const presentStudents = exam.results.filter(r => !r.isAbsent).length;
      const totalMarks = exam.results.reduce((sum, r) => sum + (r.isAbsent ? 0 : r.marks), 0);
      const averageScore = presentStudents > 0 ? totalMarks / presentStudents : 0;
      const passedStudents = exam.results.filter(r => !r.isAbsent && r.marks >= exam.passingMarks).length;
      const passPercentage = presentStudents > 0 ? (passedStudents / presentStudents) * 100 : 0;

      return {
        ...exam,
        studentsAppeared: presentStudents,
        averageScore,
        passPercentage,
        passedStudents
      };
    });

    return { success: true, data: examsWithStats };
  } catch (error) {
    console.error("Error fetching past exams:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch past exams"
    };
  }
});

// Get exam by ID
export const getExamById = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string) => {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const exam = await db.exam.findUnique({
      where: {
        schoolId,
        id
      },
      include: {
        examType: true,
        subject: true,
        term: {
          include: {
            academicYear: true
          }
        },
        creator: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        results: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!exam) {
      return { success: false, error: "Exam not found" };
    }

    return { success: true, data: exam };
  } catch (error) {
    console.error("Error fetching exam:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch exam"
    };
  }
});

// Get exam types for dropdown
export const getExamTypes = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const examTypes = await db.examType.findMany({
      where: { schoolId }, // Ensure we filter by schoolId
      orderBy: {
        name: 'asc'
      }
    });

    return { success: true, data: examTypes };
  } catch (error) {
    console.error("Error fetching exam types:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch exam types"
    };
  }
});

// Get subjects for dropdown
export const getSubjects = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const subjects = await db.subject.findMany({
      where: { schoolId }, // Ensure filtered
      orderBy: {
        name: 'asc'
      }
    });

    return { success: true, data: subjects };
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch subjects"
    };
  }
});

// Get terms for dropdown
export const getTerms = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const terms = await db.term.findMany({
      where: {
        schoolId,
        endDate: {
          gte: new Date()
        }
      },
      include: {
        academicYear: true
      },
      orderBy: [
        {
          academicYear: {
            isCurrent: 'desc'
          }
        },
        {
          startDate: 'asc'
        }
      ]
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

// Create a new exam
export const createExam = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, data: ExamFormValues, creatorId?: string) => {
  try {
    // Permission check: require EXAM:CREATE
    await checkPermission('EXAM', 'CREATE', 'You do not have permission to create exams');

    // Validate exam date based on term dates
    const term = await db.term.findUnique({
      where: {
        schoolId,
        id: data.termId
      },
      include: {
        academicYear: true
      }
    });

    if (!term) {
      return { success: false, error: "Selected term does not exist" };
    }

    if (data.examDate < term.startDate || data.examDate > term.endDate) {
      return {
        success: false,
        error: "Exam date must be within the selected term dates"
      };
    }

    // Create the exam
    const examData: any = {
      title: data.title,
      schoolId, // Explicitly add schoolId
      examTypeId: data.examTypeId,
      subjectId: data.subjectId,
      termId: data.termId,
      examDate: data.examDate,
      startTime: data.startTime,
      endTime: data.endTime,
      totalMarks: data.totalMarks,
      passingMarks: data.passingMarks,
      instructions: data.instructions,
    };

    // Only add creatorId if it's provided
    if (creatorId) {
      examData.creatorId = creatorId;
    }

    const exam = await db.exam.create({
      data: examData,
      include: {
        subject: true,
        examType: true,
        term: {
          include: {
            academicYear: true
          }
        }
      }
    });

    // Create calendar event for the exam
    await createCalendarEventFromExam(exam as any, creatorId || 'system');

    revalidatePath("/admin/assessment/exams");
    return { success: true, data: exam };
  } catch (error) {
    console.error("Error creating exam:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create exam"
    };
  }
});

// Update an existing exam
export const updateExam = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, data: ExamUpdateFormValues) => {
  try {
    // Permission check: require EXAM:UPDATE
    await checkPermission('EXAM', 'UPDATE', 'You do not have permission to update exams');

    // Validate exam date based on term dates
    const term = await db.term.findUnique({
      where: {
        schoolId,
        id: data.termId
      },
      include: {
        academicYear: true
      }
    });

    if (!term) {
      return { success: false, error: "Selected term does not exist" };
    }

    if (data.examDate < term.startDate || data.examDate > term.endDate) {
      return {
        success: false,
        error: "Exam date must be within the selected term dates"
      };
    }

    // Update the exam
    const exam = await db.exam.update({
      where: {
        schoolId,
        id: data.id
      },
      data: {
        title: data.title,
        examTypeId: data.examTypeId,
        subjectId: data.subjectId,
        termId: data.termId,
        examDate: data.examDate,
        startTime: data.startTime,
        endTime: data.endTime,
        totalMarks: data.totalMarks,
        passingMarks: data.passingMarks,
        instructions: data.instructions
      },
      include: {
        subject: true,
        examType: true,
        term: {
          include: {
            academicYear: true
          }
        }
      }
    });

    // Update calendar event for the exam
    await updateCalendarEventFromExam(exam as any);

    revalidatePath("/admin/assessment/exams");
    revalidatePath(`/admin/assessment/exams/${data.id}`);
    return { success: true, data: exam };
  } catch (error) {
    console.error("Error updating exam:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update exam"
    };
  }
});

// Delete an exam
export const deleteExam = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string) => {
  try {
    // Permission check: require EXAM:DELETE
    await checkPermission('EXAM', 'DELETE', 'You do not have permission to delete exams');

    // Check if exam has any results
    const hasResults = await db.examResult.findFirst({
      where: {
        schoolId,
        examId: id
      }
    });

    if (hasResults) {
      return {
        success: false,
        error: "Cannot delete this exam because it has associated results. Remove the results first."
      };
    }

    // Delete calendar event first
    await deleteCalendarEventFromExam(id);

    await db.exam.delete({
      where: {
        schoolId,
        id
      }
    });

    revalidatePath("/admin/assessment/exams");
    return { success: true };
  } catch (error) {
    console.error("Error deleting exam:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete exam"
    };
  }
});

// Save exam result
export const saveExamResult = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, data: ExamResultFormValues) => {
  try {
    // Check if exam exists
    const exam = await db.exam.findUnique({
      where: {
        schoolId,
        id: data.examId
      },
      select: { totalMarks: true }
    });

    if (!exam) {
      return { success: false, error: "Exam not found" };
    }

    // Validate marks against total marks
    if (data.marks > exam.totalMarks) {
      return {
        success: false,
        error: `Marks cannot exceed total marks (${exam.totalMarks})`
      };
    }

    // Check if result already exists
    const existingResult = await db.examResult.findFirst({
      where: {
        schoolId,
        examId: data.examId,
        studentId: data.studentId
      }
    });

    let result;

    if (existingResult) {
      // Update existing result
      result = await db.examResult.update({
        where: {
          schoolId,
          id: existingResult.id
        },
        data: {
          marks: data.isAbsent ? 0 : data.marks,
          grade: data.grade,
          remarks: data.remarks,
          isAbsent: data.isAbsent
        }
      });
    } else {
      // Create new result
      result = await db.examResult.create({
        data: {
          schoolId,
          examId: data.examId,
          studentId: data.studentId,
          marks: data.isAbsent ? 0 : data.marks,
          grade: data.grade,
          remarks: data.remarks,
          isAbsent: data.isAbsent
        }
      });
    }

    revalidatePath(`/admin/assessment/exams/${data.examId}`);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error saving exam result:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save exam result"
    };
  }
});

// Delete exam result
export const deleteExamResult = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string) => {
  try {
    const result = await db.examResult.delete({
      where: {
        schoolId,
        id
      }
    });

    revalidatePath(`/admin/assessment/exams/${result.examId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting exam result:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete exam result"
    };
  }
});

// Get exam statistics
export const getExamStatistics = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const currentDate = new Date();

    // Count upcoming exams
    const upcomingExamsCount = await db.exam.count({
      where: {
        schoolId,
        examDate: {
          gte: currentDate
        }
      }
    });

    // Count completed exams
    const completedExamsCount = await db.exam.count({
      where: {
        schoolId,
        examDate: {
          lt: currentDate
        }
      }
    });

    // Get next exam
    const nextExam = await db.exam.findFirst({
      where: {
        schoolId,
        examDate: {
          gte: currentDate
        }
      },
      include: {
        subject: true
      },
      orderBy: {
        examDate: 'asc'
      }
    });

    // Get class with highest performance
    const examResults = await db.examResult.findMany({
      where: {
        schoolId,
        exam: {
          examDate: {
            lt: currentDate
          }
        },
        isAbsent: false
      },
      include: {
        student: {
          include: {
            enrollments: {
              include: {
                class: true
              }
            }
          }
        },
        exam: true
      }
    });

    // Group results by class and calculate average
    const classPerfMap = new Map();

    examResults.forEach(result => {
      const currentClass = result.student.enrollments[0]?.class.name;
      if (!currentClass) return;

      if (!classPerfMap.has(currentClass)) {
        classPerfMap.set(currentClass, { total: 0, count: 0 });
      }

      const classStats = classPerfMap.get(currentClass);
      classStats.total += (result.marks / result.exam.totalMarks) * 100;
      classStats.count += 1;
    });

    let highestPerformingClass = null;
    let highestPerformingAverage = 0;

    classPerfMap.forEach((stats, className) => {
      const average = stats.count > 0 ? stats.total / stats.count : 0;
      if (average > highestPerformingAverage) {
        highestPerformingClass = className;
        highestPerformingAverage = average;
      }
    });

    return {
      success: true,
      data: {
        upcomingExamsCount,
        completedExamsCount,
        nextExam: nextExam ? nextExam.subject.name : null,
        highestPerformingClass,
        highestPerformingAverage: highestPerformingAverage.toFixed(1)
      }
    };
  } catch (error) {
    console.error("Error fetching exam statistics:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch exam statistics"
    };
  }
});
