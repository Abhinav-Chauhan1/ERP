"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Get teacher's subjects for online exam creation
 */
export async function getTeacherSubjectsForExam() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get teacher record
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      include: {
        subjects: {
          include: {
            subject: true,
          },
        },
      },
    });

    if (!teacher) {
      return { success: false, error: "Teacher not found" };
    }

    const subjects = teacher.subjects.map((st) => st.subject);

    return { success: true, subjects };
  } catch (error) {
    console.error("Error fetching teacher subjects:", error);
    return { success: false, error: "Failed to fetch subjects" };
  }
}

/**
 * Get classes for online exam creation
 */
export async function getClassesForExam() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const classes = await prisma.class.findMany({
      include: {
        academicYear: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return { success: true, classes };
  } catch (error) {
    console.error("Error fetching classes:", error);
    return { success: false, error: "Failed to fetch classes" };
  }
}

/**
 * Get question banks for a subject with filtering
 */
export async function getQuestionBanks(filters: {
  subjectId: string;
  topic?: string;
  difficulty?: string;
  questionType?: string;
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const where: any = {
      subjectId: filters.subjectId,
    };

    if (filters.topic) {
      where.topic = filters.topic;
    }

    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }

    if (filters.questionType) {
      where.questionType = filters.questionType;
    }

    const questions = await prisma.questionBank.findMany({
      where,
      include: {
        subject: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, questions };
  } catch (error) {
    console.error("Error fetching question banks:", error);
    return { success: false, error: "Failed to fetch questions" };
  }
}

/**
 * Get unique topics for a subject
 */
export async function getSubjectTopics(subjectId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const questions = await prisma.questionBank.findMany({
      where: {
        subjectId,
        topic: {
          not: null,
        },
      },
      select: {
        topic: true,
      },
      distinct: ["topic"],
    });

    const topics = questions
      .map((q) => q.topic)
      .filter((t): t is string => t !== null);

    return { success: true, topics };
  } catch (error) {
    console.error("Error fetching topics:", error);
    return { success: false, error: "Failed to fetch topics" };
  }
}

/**
 * Create a new online exam
 */
export async function createOnlineExam(data: {
  title: string;
  subjectId: string;
  classId: string;
  duration: number;
  totalMarks: number;
  questionIds: string[];
  startTime: Date;
  endTime: Date;
  instructions?: string;
  randomizeQuestions?: boolean;
  allowReview?: boolean;
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get teacher record
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
    });

    if (!teacher) {
      return { success: false, error: "Teacher not found" };
    }

    // Validate that questions exist and belong to the subject
    const questions = await prisma.questionBank.findMany({
      where: {
        id: {
          in: data.questionIds,
        },
        subjectId: data.subjectId,
      },
    });

    if (questions.length !== data.questionIds.length) {
      return {
        success: false,
        error: "Some questions are invalid or do not belong to the selected subject",
      };
    }

    // Calculate total marks from questions
    const calculatedTotalMarks = questions.reduce(
      (sum, q) => sum + q.marks,
      0
    );

    // Create the online exam
    const exam = await prisma.onlineExam.create({
      data: {
        title: data.title,
        subjectId: data.subjectId,
        classId: data.classId,
        duration: data.duration,
        totalMarks: calculatedTotalMarks, // Use calculated marks
        questions: data.questionIds, // Store as JSON array
        startTime: data.startTime,
        endTime: data.endTime,
        instructions: data.instructions,
        randomizeQuestions: data.randomizeQuestions ?? true,
        allowReview: data.allowReview ?? true,
        createdBy: teacher.id,
      },
      include: {
        subject: true,
        class: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    // Update usage count for selected questions
    await prisma.questionBank.updateMany({
      where: {
        id: {
          in: data.questionIds,
        },
      },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    revalidatePath("/teacher/assessments/online-exams");

    return { success: true, exam };
  } catch (error) {
    console.error("Error creating online exam:", error);
    return { success: false, error: "Failed to create online exam" };
  }
}

/**
 * Get online exams created by teacher
 */
export async function getTeacherOnlineExams() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId },
    });

    if (!teacher) {
      return { success: false, error: "Teacher not found" };
    }

    const exams = await prisma.onlineExam.findMany({
      where: {
        createdBy: teacher.id,
      },
      include: {
        subject: true,
        class: true,
        attempts: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, exams };
  } catch (error) {
    console.error("Error fetching online exams:", error);
    return { success: false, error: "Failed to fetch online exams" };
  }
}

/**
 * Get online exam by ID
 */
export async function getOnlineExamById(examId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const exam = await prisma.onlineExam.findUnique({
      where: { id: examId },
      include: {
        subject: true,
        class: true,
        teacher: {
          include: {
            user: true,
          },
        },
        attempts: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!exam) {
      return { success: false, error: "Exam not found" };
    }

    // Get full question details
    const questionIds = exam.questions as string[];
    const questions = await prisma.questionBank.findMany({
      where: {
        id: {
          in: questionIds,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return { success: true, exam, questions };
  } catch (error) {
    console.error("Error fetching online exam:", error);
    return { success: false, error: "Failed to fetch online exam" };
  }
}

/**
 * Select random questions from question bank based on criteria
 */
export async function selectRandomQuestions(criteria: {
  subjectId: string;
  count: number;
  topic?: string;
  difficulty?: string;
  questionType?: string;
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const where: any = {
      subjectId: criteria.subjectId,
    };

    if (criteria.topic) {
      where.topic = criteria.topic;
    }

    if (criteria.difficulty) {
      where.difficulty = criteria.difficulty;
    }

    if (criteria.questionType) {
      where.questionType = criteria.questionType;
    }

    // Get all matching questions
    const allQuestions = await prisma.questionBank.findMany({
      where,
    });

    if (allQuestions.length < criteria.count) {
      return {
        success: false,
        error: `Not enough questions available. Found ${allQuestions.length}, need ${criteria.count}`,
      };
    }

    // Randomly select questions
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, criteria.count);

    return { success: true, questions: selected };
  } catch (error) {
    console.error("Error selecting random questions:", error);
    return { success: false, error: "Failed to select questions" };
  }
}

/**
 * Manually grade essay questions for an exam attempt
 */
export async function gradeEssayQuestions(
  attemptId: string,
  questionScores: Record<string, number>
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get teacher record
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
    });

    if (!teacher) {
      return { success: false, error: "Teacher not found" };
    }

    // Get exam attempt
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: true,
      },
    });

    if (!attempt) {
      return { success: false, error: "Exam attempt not found" };
    }

    // Verify teacher owns this exam
    if (attempt.exam.createdBy !== teacher.id) {
      return { success: false, error: "Unauthorized to grade this exam" };
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

    // Calculate total score including essay questions
    let totalScore = 0;
    const answers = attempt.answers as Record<string, any>;

    for (const question of questions) {
      if (question.questionType === "MCQ" || question.questionType === "TRUE_FALSE") {
        // Auto-graded questions
        if (answers[question.id] === question.correctAnswer) {
          totalScore += question.marks;
        }
      } else if (question.questionType === "ESSAY") {
        // Manually graded questions
        const score = questionScores[question.id] || 0;
        
        // Validate score doesn't exceed max marks
        if (score > question.marks) {
          return {
            success: false,
            error: `Score for question ${question.id} exceeds maximum marks`,
          };
        }
        
        totalScore += score;
      }
    }

    // Update attempt with final score
    await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        score: totalScore,
      },
    });

    revalidatePath("/teacher/assessments/online-exams");

    return { success: true, totalScore };
  } catch (error) {
    console.error("Error grading essay questions:", error);
    return { success: false, error: "Failed to grade essay questions" };
  }
}
