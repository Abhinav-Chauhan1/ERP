"use server";

import { db } from "@/lib/db";

export async function getAssessmentOverview() {
  try {
    const [
      examTypesCount,
      examsCount,
      assignmentsCount,
      resultsCount,
      reportCardsCount,
    ] = await Promise.all([
      db.examType.count(),
      db.exam.count(),
      db.assignment.count(),
      db.examResult.count(),
      db.reportCard.count(),
    ]);

    return {
      success: true,
      data: {
        examTypes: examTypesCount,
        exams: examsCount,
        assignments: assignmentsCount,
        results: resultsCount,
        reportCards: reportCardsCount,
        questionBank: 0, // Placeholder - no question bank table in schema
      },
    };
  } catch (error) {
    console.error("Error fetching assessment overview:", error);
    return { success: false, error: "Failed to fetch assessment overview" };
  }
}

export async function getRecentAssessments(limit: number = 10) {
  try {
    const [recentExams, recentAssignments] = await Promise.all([
      db.exam.findMany({
        take: Math.ceil(limit / 2),
        orderBy: { createdAt: "desc" },
        include: {
          subject: true,
          examType: true,
          results: true,
        },
      }),
      db.assignment.findMany({
        take: Math.ceil(limit / 2),
        orderBy: { createdAt: "desc" },
        include: {
          subject: true,
          submissions: true,
        },
      }),
    ]);

    const assessments = [
      ...recentExams.map((exam) => ({
        id: exam.id,
        type: "exam" as const,
        title: exam.title,
        subject: exam.subject,
        examType: exam.examType,
        date: exam.examDate,
        totalMarks: exam.totalMarks,
        resultsCount: exam.results.length,
        averageScore: exam.results.length > 0
          ? Math.round(exam.results.reduce((sum, r) => sum + r.marks, 0) / exam.results.length)
          : 0,
        createdAt: exam.createdAt,
      })),
      ...recentAssignments.map((assignment) => ({
        id: assignment.id,
        type: "assignment" as const,
        title: assignment.title,
        subject: assignment.subject,
        dueDate: assignment.dueDate,
        totalMarks: assignment.totalMarks,
        submissionsCount: assignment.submissions.length,
        averageScore: assignment.submissions.filter(s => s.marks !== null).length > 0
          ? Math.round(
              assignment.submissions
                .filter(s => s.marks !== null)
                .reduce((sum, s) => sum + (s.marks || 0), 0) /
              assignment.submissions.filter(s => s.marks !== null).length
            )
          : 0,
        createdAt: assignment.createdAt,
      })),
    ];

    // Sort by creation date and limit
    assessments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return { success: true, data: assessments.slice(0, limit) };
  } catch (error) {
    console.error("Error fetching recent assessments:", error);
    return { success: false, error: "Failed to fetch recent assessments" };
  }
}

export async function getAssessmentMetrics() {
  try {
    const [examsCount, assignmentsCount, results, reportCards] = await Promise.all([
      db.exam.count(),
      db.assignment.count(),
      db.examResult.findMany({
        where: { isAbsent: false },
        select: { marks: true, exam: { select: { passingMarks: true } } },
      }),
      db.reportCard.count({ where: { isPublished: true } }),
    ]);

    const passCount = results.filter(r => r.marks >= r.exam.passingMarks).length;
    const passRate = results.length > 0 ? Math.round((passCount / results.length) * 100) : 0;

    return {
      success: true,
      data: {
        totalExams: examsCount,
        totalAssignments: assignmentsCount,
        passRate,
        reportCards,
      },
    };
  } catch (error) {
    console.error("Error fetching assessment metrics:", error);
    return { success: false, error: "Failed to fetch assessment metrics" };
  }
}
