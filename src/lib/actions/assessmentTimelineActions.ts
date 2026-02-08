"use server";

import { db } from "@/lib/db";

// Get assessment timeline
export async function getAssessmentTimeline(dateFrom: Date, dateTo: Date) {
  try {
    // Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Get exams
    const exams = await db.exam.findMany({
      where: {
        schoolId, // Add school isolation
        examDate: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      include: {
        subject: true,
        examType: true,
      },
      orderBy: {
        examDate: "asc",
      },
    });

    // Get assignments
    const assignments = await db.assignment.findMany({
      where: {
        schoolId, // Add school isolation
        dueDate: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      include: {
        subject: true,
        classes: true,
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
        examDate: exam.examDate,
        class: "N/A",
        section: undefined,
        status: "scheduled",
        description: exam.instructions || "",
      })),
      ...assignments.map((assignment) => ({
        id: assignment.id,
        type: "assignment" as const,
        title: assignment.title,
        subtitle: assignment.subject?.name || "Assignment",
        examDate: assignment.dueDate,
        class: assignment.classes?.[0] ? "Multiple Classes" : "N/A",
        section: undefined,
        status: "active",
        description: assignment.description,
      })),
    ].sort((a: any, b: any) => {
      const dateA = a.examDate || a.date;
      const dateB = b.examDate || b.date;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

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
    // Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const [examsCount, assignmentsCount, completedExams, completedAssignments] = await Promise.all([
      db.exam.count({
        where: {
          schoolId, // Add school isolation
          examDate: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
      }),
      db.assignment.count({
        where: {
          schoolId, // Add school isolation
          dueDate: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
      }),
      db.exam.count({
        where: {
          schoolId, // Add school isolation
          examDate: {
            gte: dateFrom,
            lte: new Date(), // Only count past exams as completed
          },
        },
      }),
      db.assignment.count({
        where: {
          schoolId, // Add school isolation
          dueDate: {
            gte: dateFrom,
            lte: new Date(), // Only count past assignments as completed
          },
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



