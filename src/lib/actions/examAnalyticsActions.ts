"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

/**
 * Get comprehensive analytics for an online exam
 */
export async function getExamAnalytics(examId: string) {
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

    // Get exam with attempts
    const exam = await prisma.onlineExam.findUnique({
      where: { id: examId },
      include: {
        subject: true,
        class: true,
        attempts: {
          where: {
            status: {
              in: ["SUBMITTED", "AUTO_SUBMITTED", "GRADED"],
            },
          },
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

    // Verify teacher owns this exam
    if (exam.createdBy !== teacher.id) {
      return { success: false, error: "Unauthorized to view this exam's analytics" };
    }

    // Get question details
    const questionIds = exam.questions as string[];
    const questions = await prisma.questionBank.findMany({
      where: {
        id: {
          in: questionIds,
        },
      },
    });

    // Calculate overall statistics
    const completedAttempts = exam.attempts.filter(
      (attempt) => attempt.score !== null
    );

    const scores = completedAttempts.map((attempt) => attempt.score!);
    
    const overallStats = {
      totalAttempts: exam.attempts.length,
      completedAttempts: completedAttempts.length,
      inProgressAttempts: exam.attempts.filter(
        (a) => a.status === "IN_PROGRESS"
      ).length,
      averageScore: scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
      averagePercentage: scores.length > 0
        ? (scores.reduce((sum, score) => sum + score, 0) / scores.length / exam.totalMarks) * 100
        : 0,
      passRate: 0, // Will be calculated if passing marks are defined
    };

    // Calculate question-wise analytics
    const questionAnalytics = questions.map((question) => {
      const questionId = question.id;
      let correctCount = 0;
      let incorrectCount = 0;
      let unansweredCount = 0;
      let totalResponses = 0;

      completedAttempts.forEach((attempt) => {
        const answers = attempt.answers as Record<string, any>;
        const studentAnswer = answers[questionId];

        if (studentAnswer === undefined || studentAnswer === null || studentAnswer === "") {
          unansweredCount++;
        } else {
          totalResponses++;
          
          // For objective questions, check if answer is correct
          if (question.questionType === "MCQ" || question.questionType === "TRUE_FALSE") {
            if (studentAnswer === question.correctAnswer) {
              correctCount++;
            } else {
              incorrectCount++;
            }
          }
        }
      });

      const successRate = totalResponses > 0
        ? (correctCount / totalResponses) * 100
        : 0;

      // Determine difficulty based on success rate
      let perceivedDifficulty: "EASY" | "MEDIUM" | "HARD";
      if (successRate >= 70) {
        perceivedDifficulty = "EASY";
      } else if (successRate >= 40) {
        perceivedDifficulty = "MEDIUM";
      } else {
        perceivedDifficulty = "HARD";
      }

      return {
        questionId: question.id,
        question: question.question,
        questionType: question.questionType,
        marks: question.marks,
        topic: question.topic,
        difficulty: question.difficulty,
        perceivedDifficulty,
        correctCount,
        incorrectCount,
        unansweredCount,
        totalResponses,
        successRate,
        averageScore: totalResponses > 0
          ? (correctCount * question.marks) / totalResponses
          : 0,
      };
    });

    // Identify difficult questions (success rate < 40%)
    const difficultQuestions = questionAnalytics
      .filter((q) => q.successRate < 40 && q.totalResponses > 0)
      .sort((a, b) => a.successRate - b.successRate);

    // Identify easy questions (success rate > 80%)
    const easyQuestions = questionAnalytics
      .filter((q) => q.successRate > 80 && q.totalResponses > 0)
      .sort((a, b) => b.successRate - a.successRate);

    // Topic-wise performance
    const topicPerformance = new Map<string, {
      topic: string;
      totalQuestions: number;
      averageSuccessRate: number;
      totalMarks: number;
      averageScore: number;
    }>();

    questionAnalytics.forEach((qa) => {
      const topic = qa.topic || "Uncategorized";
      
      if (!topicPerformance.has(topic)) {
        topicPerformance.set(topic, {
          topic,
          totalQuestions: 0,
          averageSuccessRate: 0,
          totalMarks: 0,
          averageScore: 0,
        });
      }

      const topicData = topicPerformance.get(topic)!;
      topicData.totalQuestions++;
      topicData.averageSuccessRate += qa.successRate;
      topicData.totalMarks += qa.marks;
      topicData.averageScore += qa.averageScore;
    });

    // Calculate averages for topics
    const topicPerformanceArray = Array.from(topicPerformance.values()).map(
      (topic) => ({
        ...topic,
        averageSuccessRate: topic.averageSuccessRate / topic.totalQuestions,
        averageScore: topic.averageScore / topic.totalQuestions,
      })
    );

    // Student performance distribution
    const scoreRanges = [
      { label: "0-20%", min: 0, max: 0.2, count: 0 },
      { label: "21-40%", min: 0.2, max: 0.4, count: 0 },
      { label: "41-60%", min: 0.4, max: 0.6, count: 0 },
      { label: "61-80%", min: 0.6, max: 0.8, count: 0 },
      { label: "81-100%", min: 0.8, max: 1.0, count: 0 },
    ];

    completedAttempts.forEach((attempt) => {
      const percentage = attempt.score! / exam.totalMarks;
      const range = scoreRanges.find(
        (r) => percentage >= r.min && percentage <= r.max
      );
      if (range) {
        range.count++;
      }
    });

    // Time-based analytics
    const timeAnalytics = completedAttempts.map((attempt) => {
      const timeTaken = attempt.submittedAt && attempt.startedAt
        ? Math.floor(
            (attempt.submittedAt.getTime() - attempt.startedAt.getTime()) / 1000 / 60
          )
        : null;

      return {
        studentId: attempt.studentId,
        studentName: `${attempt.student.user.firstName} ${attempt.student.user.lastName}`,
        score: attempt.score,
        percentage: ((attempt.score! / exam.totalMarks) * 100).toFixed(2),
        timeTaken,
        status: attempt.status,
      };
    }).filter((a) => a.timeTaken !== null);

    const averageTimeTaken = timeAnalytics.length > 0
      ? timeAnalytics.reduce((sum, a) => sum + (a.timeTaken || 0), 0) / timeAnalytics.length
      : 0;

    return {
      success: true,
      analytics: {
        exam: {
          id: exam.id,
          title: exam.title,
          subject: exam.subject.name,
          class: exam.class.name,
          duration: exam.duration,
          totalMarks: exam.totalMarks,
          totalQuestions: questions.length,
        },
        overallStats,
        questionAnalytics,
        difficultQuestions,
        easyQuestions,
        topicPerformance: topicPerformanceArray,
        scoreDistribution: scoreRanges,
        timeAnalytics: {
          averageTimeTaken,
          studentTimes: timeAnalytics,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching exam analytics:", error);
    return { success: false, error: "Failed to fetch exam analytics" };
  }
}

/**
 * Get question-wise detailed analysis for an exam
 */
export async function getQuestionWiseAnalysis(examId: string, questionId: string) {
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

    // Get exam
    const exam = await prisma.onlineExam.findUnique({
      where: { id: examId },
      include: {
        attempts: {
          where: {
            status: {
              in: ["SUBMITTED", "AUTO_SUBMITTED", "GRADED"],
            },
          },
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

    // Verify teacher owns this exam
    if (exam.createdBy !== teacher.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Get question details
    const question = await prisma.questionBank.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return { success: false, error: "Question not found" };
    }

    // Analyze responses
    const responseAnalysis: {
      studentId: string;
      studentName: string;
      answer: any;
      isCorrect: boolean | null;
      score: number;
    }[] = [];

    const answerDistribution = new Map<string, number>();

    exam.attempts.forEach((attempt) => {
      const answers = attempt.answers as Record<string, any>;
      const studentAnswer = answers[questionId];

      // Track answer distribution for MCQ
      if (question.questionType === "MCQ" && studentAnswer) {
        const count = answerDistribution.get(studentAnswer) || 0;
        answerDistribution.set(studentAnswer, count + 1);
      }

      let isCorrect: boolean | null = null;
      let score = 0;

      if (question.questionType === "MCQ" || question.questionType === "TRUE_FALSE") {
        isCorrect = studentAnswer === question.correctAnswer;
        score = isCorrect ? question.marks : 0;
      }

      responseAnalysis.push({
        studentId: attempt.studentId,
        studentName: `${attempt.student.user.firstName} ${attempt.student.user.lastName}`,
        answer: studentAnswer,
        isCorrect,
        score,
      });
    });

    // For MCQ, analyze option-wise distribution
    let optionAnalysis: { option: string; count: number; percentage: number }[] = [];
    
    if (question.questionType === "MCQ" && question.options) {
      const options = question.options as string[];
      const totalResponses = exam.attempts.length;

      optionAnalysis = options.map((option) => ({
        option,
        count: answerDistribution.get(option) || 0,
        percentage: totalResponses > 0
          ? ((answerDistribution.get(option) || 0) / totalResponses) * 100
          : 0,
      }));
    }

    return {
      success: true,
      analysis: {
        question: {
          id: question.id,
          question: question.question,
          questionType: question.questionType,
          options: question.options,
          correctAnswer: question.correctAnswer,
          marks: question.marks,
          topic: question.topic,
          difficulty: question.difficulty,
        },
        responseAnalysis,
        optionAnalysis,
        totalResponses: exam.attempts.length,
        correctResponses: responseAnalysis.filter((r) => r.isCorrect === true).length,
        incorrectResponses: responseAnalysis.filter((r) => r.isCorrect === false).length,
        unansweredResponses: responseAnalysis.filter(
          (r) => r.answer === undefined || r.answer === null || r.answer === ""
        ).length,
      },
    };
  } catch (error) {
    console.error("Error fetching question-wise analysis:", error);
    return { success: false, error: "Failed to fetch question analysis" };
  }
}

/**
 * Get comparative analytics across multiple exams
 */
export async function getComparativeExamAnalytics(examIds: string[]) {
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

    // Get all exams
    const exams = await prisma.onlineExam.findMany({
      where: {
        id: {
          in: examIds,
        },
        createdBy: teacher.id,
      },
      include: {
        subject: true,
        class: true,
        attempts: {
          where: {
            status: {
              in: ["SUBMITTED", "AUTO_SUBMITTED", "GRADED"],
            },
          },
        },
      },
    });

    if (exams.length === 0) {
      return { success: false, error: "No exams found" };
    }

    // Calculate statistics for each exam
    const comparativeData = exams.map((exam) => {
      const completedAttempts = exam.attempts.filter(
        (attempt) => attempt.score !== null
      );
      const scores = completedAttempts.map((attempt) => attempt.score!);

      return {
        examId: exam.id,
        examTitle: exam.title,
        subject: exam.subject.name,
        class: exam.class.name,
        totalAttempts: exam.attempts.length,
        completedAttempts: completedAttempts.length,
        averageScore: scores.length > 0
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length
          : 0,
        averagePercentage: scores.length > 0
          ? (scores.reduce((sum, score) => sum + score, 0) / scores.length / exam.totalMarks) * 100
          : 0,
        highestScore: scores.length > 0 ? Math.max(...scores) : 0,
        lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
        totalMarks: exam.totalMarks,
      };
    });

    return {
      success: true,
      comparativeData,
    };
  } catch (error) {
    console.error("Error fetching comparative analytics:", error);
    return { success: false, error: "Failed to fetch comparative analytics" };
  }
}
