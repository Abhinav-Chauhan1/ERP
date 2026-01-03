"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { autoGradeExam, calculateFinalScore } from "@/lib/utils/auto-grading";

/**
 * Get available online exams for a student
 */
export async function getAvailableExamsForStudent() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get student record
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        enrollments: {
          where: {
            status: "ACTIVE",
          },
          include: {
            section: {
              include: {
                class: true,
              },
            },
          },
        },
      },
    });

    if (!student || student.enrollments.length === 0) {
      return { success: false, error: "Student not found or not enrolled" };
    }

    const enrollment = student.enrollments[0];
    const classId = enrollment.section.classId;

    const now = new Date();

    // Get exams for student's class that are currently active
    const exams = await prisma.onlineExam.findMany({
      where: {
        classId,
        startTime: {
          lte: now,
        },
        endTime: {
          gte: now,
        },
      },
      include: {
        subject: true,
        attempts: {
          where: {
            studentId: student.id,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return { success: true, exams, studentId: student.id };
  } catch (error) {
    console.error("Error fetching available exams:", error);
    return { success: false, error: "Failed to fetch exams" };
  }
}

/**
 * Start an exam attempt
 */
export async function startExamAttempt(examId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get student record
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    // Check if exam exists and is active
    const exam = await prisma.onlineExam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      return { success: false, error: "Exam not found" };
    }

    const now = new Date();
    if (now < exam.startTime) {
      return { success: false, error: "Exam has not started yet" };
    }

    if (now > exam.endTime) {
      return { success: false, error: "Exam has ended" };
    }

    // Check if student already has an attempt
    const existingAttempt = await prisma.examAttempt.findUnique({
      where: {
        examId_studentId: {
          examId,
          studentId: student.id,
        },
      },
    });

    if (existingAttempt) {
      return { success: false, error: "You have already attempted this exam" };
    }

    // Create exam attempt
    const attempt = await prisma.examAttempt.create({
      data: {
        examId,
        studentId: student.id,
        answers: {},
        status: "IN_PROGRESS",
      },
    });

    revalidatePath("/student/assessments/exams");

    return { success: true, attempt };
  } catch (error) {
    console.error("Error starting exam attempt:", error);
    return { success: false, error: "Failed to start exam" };
  }
}

/**
 * Get exam attempt with questions
 */
export async function getExamAttempt(examId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get student record
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    // Get exam attempt
    const attempt = await prisma.examAttempt.findUnique({
      where: {
        examId_studentId: {
          examId,
          studentId: student.id,
        },
      },
      include: {
        exam: {
          include: {
            subject: true,
          },
        },
      },
    });

    if (!attempt) {
      return { success: false, error: "Exam attempt not found" };
    }

    // Check if exam time has expired
    const now = new Date();
    if (now > attempt.exam.endTime && attempt.status === "IN_PROGRESS") {
      // Auto-submit the exam
      await submitExamAttempt(examId, attempt.answers as Record<string, any>);
      return { success: false, error: "Exam time has expired. Your answers have been auto-submitted." };
    }

    // Get questions
    const questionIds = attempt.exam.questions as string[];
    let questions = await prisma.questionBank.findMany({
      where: {
        id: {
          in: questionIds,
        },
      },
    });

    // Randomize questions if enabled
    if (attempt.exam.randomizeQuestions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    // Calculate time remaining
    const startedAt = attempt.startedAt;
    const durationMs = attempt.exam.duration * 60 * 1000;
    const endTime = new Date(startedAt.getTime() + durationMs);
    const timeRemaining = Math.max(0, endTime.getTime() - now.getTime());

    return {
      success: true,
      attempt,
      questions,
      timeRemaining,
    };
  } catch (error) {
    console.error("Error fetching exam attempt:", error);
    return { success: false, error: "Failed to fetch exam" };
  }
}

/**
 * Save answer for a question
 */
export async function saveAnswer(
  examId: string,
  questionId: string,
  answer: any
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get student record
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    // Get exam attempt
    const attempt = await prisma.examAttempt.findUnique({
      where: {
        examId_studentId: {
          examId,
          studentId: student.id,
        },
      },
    });

    if (!attempt) {
      return { success: false, error: "Exam attempt not found" };
    }

    if (attempt.status !== "IN_PROGRESS") {
      return { success: false, error: "Exam has already been submitted" };
    }

    // Update answers
    const currentAnswers = (attempt.answers as Record<string, any>) || {};
    currentAnswers[questionId] = answer;

    await prisma.examAttempt.update({
      where: {
        id: attempt.id,
      },
      data: {
        answers: currentAnswers,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error saving answer:", error);
    return { success: false, error: "Failed to save answer" };
  }
}

/**
 * Submit exam attempt
 */
export async function submitExamAttempt(
  examId: string,
  answers: Record<string, any>
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get student record
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    // Get exam attempt
    const attempt = await prisma.examAttempt.findUnique({
      where: {
        examId_studentId: {
          examId,
          studentId: student.id,
        },
      },
      include: {
        exam: true,
      },
    });

    if (!attempt) {
      return { success: false, error: "Exam attempt not found" };
    }

    if (attempt.status !== "IN_PROGRESS") {
      return { success: false, error: "Exam has already been submitted" };
    }

    // Get questions for grading
    const questionIds = attempt.exam.questions as string[];
    const questions = await prisma.questionBank.findMany({
      where: {
        id: {
          in: questionIds,
        },
      },
    });

    // Auto-grade the exam
    const gradingResult = autoGradeExam(questions, answers);
    const finalScore = calculateFinalScore(gradingResult);

    // Update attempt
    await prisma.examAttempt.update({
      where: {
        id: attempt.id,
      },
      data: {
        answers,
        score: finalScore,
        submittedAt: new Date(),
        status: "SUBMITTED",
      },
    });

    revalidatePath("/student/assessments/exams");

    return {
      success: true,
      score: finalScore,
      hasEssayQuestions: gradingResult.hasEssayQuestions,
      gradingResult,
    };
  } catch (error) {
    console.error("Error submitting exam:", error);
    return { success: false, error: "Failed to submit exam" };
  }
}

/**
 * Get student's exam results
 */
export async function getStudentExamResults() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get student record
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    // Get all exam attempts
    const attempts = await prisma.examAttempt.findMany({
      where: {
        studentId: student.id,
      },
      include: {
        exam: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    return { success: true, attempts };
  } catch (error) {
    console.error("Error fetching exam results:", error);
    return { success: false, error: "Failed to fetch results" };
  }
}

/**
 * Get detailed exam result with question-wise breakdown
 */
export async function getDetailedExamResult(examId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get student record
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    // Get exam attempt
    const attempt = await prisma.examAttempt.findUnique({
      where: {
        examId_studentId: {
          examId,
          studentId: student.id,
        },
      },
      include: {
        exam: {
          include: {
            subject: true,
            teacher: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return { success: false, error: "Exam attempt not found" };
    }

    if (attempt.status !== "SUBMITTED") {
      return { success: false, error: "Exam not yet submitted" };
    }

    // Get questions
    const questionIds = attempt.exam.questions as string[];
    const questions = await prisma.questionBank.findMany({
      where: {
        id: {
          in: questionIds,
        },
      },
    });

    // Re-grade to get detailed breakdown
    const answers = attempt.answers as Record<string, any>;
    const gradingResult = autoGradeExam(questions, answers);

    // Calculate percentage
    const percentage = gradingResult.maxScore > 0 
      ? (gradingResult.totalScore / gradingResult.maxScore) * 100 
      : 0;

    return {
      success: true,
      attempt,
      questions,
      gradingResult,
      percentage: Math.round(percentage * 100) / 100,
    };
  } catch (error) {
    console.error("Error fetching detailed exam result:", error);
    return { success: false, error: "Failed to fetch exam result" };
  }
}
