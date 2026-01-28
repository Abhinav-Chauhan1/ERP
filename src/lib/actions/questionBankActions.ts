"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { QuestionType, Difficulty } from "@prisma/client";
import { requireSchoolAccess, withSchoolId } from "@/lib/auth/tenant";

/**
 * Create a new question in the question bank
 */
export async function createQuestion(data: {
  question: string;
  questionType: QuestionType;
  options?: string[]; // For MCQ
  correctAnswer?: string;
  marks: number;
  subjectId: string;
  topic?: string;
  difficulty: Difficulty;
}) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get teacher record
    const teacher = await prisma.teacher.findFirst({
      where: { userId, schoolId },
    });

    if (!teacher) {
      return { success: false, error: "Teacher not found" };
    }

    // Validate question type specific fields
    if (data.questionType === "MCQ") {
      if (!data.options || data.options.length < 2) {
        return {
          success: false,
          error: "MCQ questions must have at least 2 options",
        };
      }
      if (!data.correctAnswer) {
        return {
          success: false,
          error: "MCQ questions must have a correct answer",
        };
      }
    }

    if (data.questionType === "TRUE_FALSE") {
      if (!data.correctAnswer || !["TRUE", "FALSE"].includes(data.correctAnswer)) {
        return {
          success: false,
          error: "True/False questions must have TRUE or FALSE as correct answer",
        };
      }
    }

    // Create the question
    const question = await prisma.questionBank.create({
      data: withSchoolId({
        question: data.question,
        questionType: data.questionType,
        options: data.options || undefined,
        correctAnswer: data.correctAnswer || undefined,
        marks: data.marks,
        subjectId: data.subjectId,
        topic: data.topic || undefined,
        difficulty: data.difficulty,
        createdBy: teacher.id,
      }, schoolId),
      include: {
        subject: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    revalidatePath("/teacher/assessments/question-bank");

    return { success: true, question };
  } catch (error) {
    console.error("Error creating question:", error);
    return { success: false, error: "Failed to create question" };
  }
}

/**
 * Get all questions created by the teacher with optional filters
 */
export async function getTeacherQuestions(filters?: {
  subjectId?: string;
  topic?: string;
  difficulty?: Difficulty;
  questionType?: QuestionType;
  search?: string;
}) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const teacher = await prisma.teacher.findFirst({
      where: { userId, schoolId },
    });

    if (!teacher) {
      return { success: false, error: "Teacher not found" };
    }

    const where: any = {
      createdBy: teacher.id,
      schoolId,
    };

    if (filters?.subjectId) {
      where.subjectId = filters.subjectId;
    }

    if (filters?.topic) {
      where.topic = filters.topic;
    }

    if (filters?.difficulty) {
      where.difficulty = filters.difficulty;
    }

    if (filters?.questionType) {
      where.questionType = filters.questionType;
    }

    if (filters?.search) {
      where.question = {
        contains: filters.search,
        mode: "insensitive",
      };
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
    console.error("Error fetching questions:", error);
    return { success: false, error: "Failed to fetch questions" };
  }
}

/**
 * Get a single question by ID
 */
export async function getQuestionById(questionId: string) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const question = await prisma.questionBank.findFirst({
      where: { id: questionId, schoolId },
      include: {
        subject: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!question) {
      return { success: false, error: "Question not found" };
    }

    return { success: true, question };
  } catch (error) {
    console.error("Error fetching question:", error);
    return { success: false, error: "Failed to fetch question" };
  }
}

/**
 * Update an existing question
 */
export async function updateQuestion(
  questionId: string,
  data: {
    question?: string;
    questionType?: QuestionType;
    options?: string[];
    correctAnswer?: string;
    marks?: number;
    subjectId?: string;
    topic?: string;
    difficulty?: Difficulty;
  }
) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get teacher record
    const teacher = await prisma.teacher.findFirst({
      where: { userId, schoolId },
    });

    if (!teacher) {
      return { success: false, error: "Teacher not found" };
    }

    // Check if question exists and belongs to teacher AND school
    const existingQuestion = await prisma.questionBank.findFirst({
      where: { id: questionId, schoolId },
    });

    if (!existingQuestion) {
      return { success: false, error: "Question not found" };
    }

    if (existingQuestion.createdBy !== teacher.id) {
      return {
        success: false,
        error: "You can only update your own questions",
      };
    }

    // Validate question type specific fields if questionType is being updated
    const questionType = data.questionType || existingQuestion.questionType;

    if (questionType === "MCQ") {
      const options = data.options || (existingQuestion.options as string[]);
      if (!options || options.length < 2) {
        return {
          success: false,
          error: "MCQ questions must have at least 2 options",
        };
      }
      const correctAnswer = data.correctAnswer !== undefined ? data.correctAnswer : existingQuestion.correctAnswer;
      if (!correctAnswer) {
        return {
          success: false,
          error: "MCQ questions must have a correct answer",
        };
      }
    }

    if (questionType === "TRUE_FALSE") {
      const correctAnswer = data.correctAnswer !== undefined ? data.correctAnswer : existingQuestion.correctAnswer;
      if (!correctAnswer || !["TRUE", "FALSE"].includes(correctAnswer)) {
        return {
          success: false,
          error: "True/False questions must have TRUE or FALSE as correct answer",
        };
      }
    }

    // Update the question
    const question = await prisma.questionBank.update({
      where: { id: questionId },
      data: {
        ...(data.question && { question: data.question }),
        ...(data.questionType && { questionType: data.questionType }),
        ...(data.options !== undefined && { options: data.options }),
        ...(data.correctAnswer !== undefined && { correctAnswer: data.correctAnswer }),
        ...(data.marks !== undefined && { marks: data.marks }),
        ...(data.subjectId && { subjectId: data.subjectId }),
        ...(data.topic !== undefined && { topic: data.topic }),
        ...(data.difficulty && { difficulty: data.difficulty }),
      },
      include: {
        subject: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    revalidatePath("/teacher/assessments/question-bank");

    return { success: true, question };
  } catch (error) {
    console.error("Error updating question:", error);
    return { success: false, error: "Failed to update question" };
  }
}

/**
 * Delete a question
 */
export async function deleteQuestion(questionId: string) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get teacher record
    const teacher = await prisma.teacher.findFirst({
      where: { userId, schoolId },
    });

    if (!teacher) {
      return { success: false, error: "Teacher not found" };
    }

    // Check if question exists and belongs to teacher and school
    const existingQuestion = await prisma.questionBank.findFirst({
      where: { id: questionId, schoolId },
    });

    if (!existingQuestion) {
      return { success: false, error: "Question not found" };
    }

    if (existingQuestion.createdBy !== teacher.id) {
      return {
        success: false,
        error: "You can only delete your own questions",
      };
    }

    // Delete the question
    await prisma.questionBank.delete({
      where: { id: questionId },
    });

    revalidatePath("/teacher/assessments/question-bank");

    return { success: true, message: "Question deleted successfully" };
  } catch (error) {
    console.error("Error deleting question:", error);
    return { success: false, error: "Failed to delete question" };
  }
}

/**
 * Get unique topics for a subject (for the current teacher)
 */
export async function getTeacherSubjectTopics(subjectId: string) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const teacher = await prisma.teacher.findFirst({
      where: { userId, schoolId },
    });

    if (!teacher) {
      return { success: false, error: "Teacher not found" };
    }

    const questions = await prisma.questionBank.findMany({
      where: {
        subjectId,
        createdBy: teacher.id,
        schoolId,
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
 * Get question bank statistics for the teacher
 */
export async function getQuestionBankStats() {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const teacher = await prisma.teacher.findFirst({
      where: { userId, schoolId },
    });

    if (!teacher) {
      return { success: false, error: "Teacher not found" };
    }

    // Get total questions
    const totalQuestions = await prisma.questionBank.count({
      where: { createdBy: teacher.id, schoolId },
    });

    // Get questions by type
    const questionsByType = await prisma.questionBank.groupBy({
      by: ["questionType"],
      where: { createdBy: teacher.id, schoolId },
      _count: true,
    });

    // Get questions by difficulty
    const questionsByDifficulty = await prisma.questionBank.groupBy({
      by: ["difficulty"],
      where: { createdBy: teacher.id, schoolId },
      _count: true,
    });

    // Get questions by subject
    const questionsBySubject = await prisma.questionBank.groupBy({
      by: ["subjectId"],
      where: { createdBy: teacher.id, schoolId },
      _count: true,
    });

    // Get subject details
    const subjectIds = questionsBySubject.map((q) => q.subjectId);
    const subjects = await prisma.subject.findMany({
      where: { id: { in: subjectIds } },
    });

    const questionsBySubjectWithNames = questionsBySubject.map((q) => ({
      ...q,
      subject: subjects.find((s) => s.id === q.subjectId),
    }));

    // Get most used questions
    const mostUsedQuestions = await prisma.questionBank.findMany({
      where: {
        createdBy: teacher.id,
        schoolId,
        usageCount: { gt: 0 },
      },
      orderBy: { usageCount: "desc" },
      take: 5,
      include: {
        subject: true,
      },
    });

    return {
      success: true,
      stats: {
        totalQuestions,
        questionsByType,
        questionsByDifficulty,
        questionsBySubject: questionsBySubjectWithNames,
        mostUsedQuestions,
      },
    };
  } catch (error) {
    console.error("Error fetching question bank stats:", error);
    return { success: false, error: "Failed to fetch statistics" };
  }
}

/**
 * Bulk import questions from CSV or JSON
 */
export async function bulkImportQuestions(data: {
  subjectId: string;
  questions: Array<{
    question: string;
    questionType: QuestionType;
    options?: string[];
    correctAnswer?: string;
    marks: number;
    topic?: string;
    difficulty: Difficulty;
  }>;
}) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const teacher = await prisma.teacher.findFirst({
      where: { userId, schoolId },
    });

    if (!teacher) {
      return { success: false, error: "Teacher not found" };
    }

    // Validate all questions before importing
    const errors: string[] = [];
    data.questions.forEach((q, index) => {
      if (q.questionType === "MCQ") {
        if (!q.options || q.options.length < 2) {
          errors.push(`Question ${index + 1}: MCQ must have at least 2 options`);
        }
        if (!q.correctAnswer) {
          errors.push(`Question ${index + 1}: MCQ must have a correct answer`);
        }
      }
      if (q.questionType === "TRUE_FALSE") {
        if (!q.correctAnswer || !["TRUE", "FALSE"].includes(q.correctAnswer)) {
          errors.push(`Question ${index + 1}: True/False must have TRUE or FALSE as answer`);
        }
      }
    });

    if (errors.length > 0) {
      return { success: false, error: errors.join("; ") };
    }

    // Import all questions
    const createdQuestions = await prisma.questionBank.createMany({
      data: data.questions.map((q) => ({
        question: q.question,
        questionType: q.questionType,
        options: q.options || undefined,
        correctAnswer: q.correctAnswer || undefined,
        marks: q.marks,
        subjectId: data.subjectId,
        topic: q.topic || undefined,
        difficulty: q.difficulty,
        createdBy: teacher.id,
        schoolId, // Injected
      })),
    });

    revalidatePath("/teacher/assessments/question-bank");

    return {
      success: true,
      message: `Successfully imported ${createdQuestions.count} questions`,
      count: createdQuestions.count,
    };
  } catch (error) {
    console.error("Error importing questions:", error);
    return { success: false, error: "Failed to import questions" };
  }
}
