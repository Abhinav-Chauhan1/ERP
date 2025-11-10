"use server";

import { db } from "@/lib/db";

// Get assessment timeline
export async function getAssessmentTimeline(dateFrom: Date, dateTo: Date) {
  try {
    // Get exams
    const exams = await db.exam.findMany({
      where: {
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      include: {
        subject: true,
        class: true,
        section: true,
        examType: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    // Get assignments
    const assignments = await db.assignment.findMany({
      where: {
        dueDate: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      include: {
        subject: true,
        class: true,
        section: true,
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    // Combine and format timeline items
    const timelineItems = [
      ...exams.map((exam) => ({
        id: exam.id,
        type: "exam" as const,
        title: exam.subject?.name || "Exam",
        subtitle: exam.examType?.name || "Assessment",
        date: exam.date,
        class: exam.class?.name || "N/A",
        section: exam.section?.name,
        status: exam.status,
        description: exam.description,
      })),
      ...assignments.map((assignment) => ({
        id: assignment.id,
        type: "assignment" as const,
        title: assignment.title,
        subtitle: assignment.subject?.name || "Assignment",
        date: assignment.dueDate,
        class: assignment.class?.name || "N/A",
        section: assignment.section?.name,
        status: assignment.status,
        description: assignment.description,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      success: true,
      data: timelineItems,
    };
  } catch (error) {
    console.error("Error fetching assessment timeline:", error);
    return { success: false, error: "Failed to fetch assessment timeline" };
  }
}

// Get timeline by month
export async function getTimelineByMonth(year: number, month: number) {
  try {
    const dateFrom = new Date(year, month - 1, 1);
    const dateTo = new Date(year, month, 0, 23, 59, 59);

    return await getAssessmentTimeline(dateFrom, dateTo);
  } catch (error) {
    console.error("Error fetching timeline by month:", error);
    return { success: false, error: "Failed to fetch timeline" };
  }
}

// Get upcoming assessments (next 30 days)
export async function getUpcomingAssessments() {
  try {
    const dateFrom = new Date();
    const dateTo = new Date();
    dateTo.setDate(dateTo.getDate() + 30);

    return await getAssessmentTimeline(dateFrom, dateTo);
  } catch (error) {
    console.error("Error fetching upcoming assessments:", error);
    return { success: false, error: "Failed to fetch upcoming assessments" };
  }
}

// Get timeline statistics
export async function getTimelineStats(dateFrom: Date, dateTo: Date) {
  try {
    const [examsCount, assignmentsCount, completedExams, completedAssignments] = await Promise.all([
      db.exam.count({
        where: {
          date: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
      }),
      db.assignment.count({
        where: {
          dueDate: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
      }),
      db.exam.count({
        where: {
          date: {
            gte: dateFrom,
            lte: dateTo,
          },
          status: "COMPLETED",
        },
      }),
      db.assignment.count({
        where: {
          dueDate: {
            gte: dateFrom,
            lte: dateTo,
          },
          status: "COMPLETED",
        },
      }),
    ]);

    return {
      success: true,
      data: {
        totalExams: examsCount,
        totalAssignments: assignmentsCount,
        completedExams,
        completedAssignments,
        totalAssessments: examsCount + assignmentsCount,
        completedAssessments: completedExams + completedAssignments,
      },
    };
  } catch (error) {
    console.error("Error fetching timeline stats:", error);
    return { success: false, error: "Failed to fetch timeline statistics" };
  }
}
