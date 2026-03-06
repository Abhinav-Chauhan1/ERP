"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { QuestionType, Difficulty } from "@prisma/client";
import { requireSchoolAccess, withSchoolId } from "@/lib/auth/tenant";

/**
 * Create a new question in the question bank (Admin)
 */
export async function createSchoolQuestion(data: {
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

        // Since QuestionBank schema requires a 'createdBy' (Teacher ID), we find a teacher
        let teacher = null;
        if (data.subjectId) {
            // Try to find a teacher who teaches this subject
            const subjectTeacher = await prisma.subjectTeacher.findFirst({
                where: { subjectId: data.subjectId },
                include: { teacher: true }
            });
            if (subjectTeacher) teacher = subjectTeacher.teacher;
        }

        // Fallback: any teacher in the school
        if (!teacher) {
            teacher = await prisma.teacher.findFirst({
                where: { schoolId }
            });
        }

        if (!teacher) {
            return { success: false, error: "No teachers found in the school. At least one teacher must exist to associate with questions." };
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

        revalidatePath("/admin/assessment/question-bank");

        return { success: true, question };
    } catch (error) {
        console.error("Error creating question:", error);
        return { success: false, error: "Failed to create question" };
    }
}

/**
 * Get all questions for the school with optional filters (Admin)
 */
export async function getSchoolQuestions(filters?: {
    subjectId?: string;
    topic?: string;
    difficulty?: Difficulty | "all";
    questionType?: QuestionType | "all";
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

        const where: any = {
            schoolId,
        };

        if (filters?.subjectId && filters.subjectId !== "all") {
            where.subjectId = filters.subjectId;
        }

        if (filters?.topic) {
            where.topic = filters.topic;
        }

        if (filters?.difficulty && filters.difficulty !== "all") {
            where.difficulty = filters.difficulty;
        }

        if (filters?.questionType && filters.questionType !== "all") {
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
 * Get a single question by ID (Admin)
 */
export async function getSchoolQuestionById(questionId: string) {
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
 * Update an existing question (Admin)
 */
export async function updateSchoolQuestion(
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

        const existingQuestion = await prisma.questionBank.findFirst({
            where: { id: questionId, schoolId },
        });

        if (!existingQuestion) {
            return { success: false, error: "Question not found" };
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

        revalidatePath("/admin/assessment/question-bank");

        return { success: true, question };
    } catch (error) {
        console.error("Error updating question:", error);
        return { success: false, error: "Failed to update question" };
    }
}

/**
 * Delete a question (Admin)
 */
export async function deleteSchoolQuestion(questionId: string) {
    try {
        const { schoolId } = await requireSchoolAccess();
        if (!schoolId) throw new Error("School context required");
        const session = await auth();
        const userId = session?.user?.id;
        if (!userId) {
            return { success: false, error: "Unauthorized" };
        }

        const existingQuestion = await prisma.questionBank.findFirst({
            where: { id: questionId, schoolId },
        });

        if (!existingQuestion) {
            return { success: false, error: "Question not found" };
        }

        // Delete the question
        await prisma.questionBank.delete({
            where: { id: questionId },
        });

        revalidatePath("/admin/assessment/question-bank");

        return { success: true, message: "Question deleted successfully" };
    } catch (error) {
        console.error("Error deleting question:", error);
        return { success: false, error: "Failed to delete question" };
    }
}

/**
 * Get question bank statistics for the entire school
 */
export async function getSchoolQuestionBankStats() {
    try {
        const { schoolId } = await requireSchoolAccess();
        if (!schoolId) throw new Error("School context required");
        const session = await auth();
        const userId = session?.user?.id;
        if (!userId) {
            return { success: false, error: "Unauthorized" };
        }

        // Get total questions
        const totalQuestions = await prisma.questionBank.count({
            where: { schoolId },
        });

        // Get questions by type
        const questionsByType = await prisma.questionBank.groupBy({
            by: ["questionType"],
            where: { schoolId },
            _count: true,
        });

        // Get questions by difficulty
        const questionsByDifficulty = await prisma.questionBank.groupBy({
            by: ["difficulty"],
            where: { schoolId },
            _count: true,
        });

        // Get questions by subject
        const questionsBySubject = await prisma.questionBank.groupBy({
            by: ["subjectId"],
            where: { schoolId },
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
