"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, format, addDays } from "date-fns";

/**
 * Get total number of students taught by a teacher
 */
export async function getTotalStudents(teacherId: string) {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const studentCount = await db.classEnrollment.count({
      where: {
        schoolId, // Add school isolation
        class: {
          schoolId, // Add school isolation
          teachers: {
            some: {
              teacherId: teacherId,
            },
          },
        },
        status: "ACTIVE",
      },
    });

    return {
      success: true,
      data: studentCount,
    };
  } catch (error) {
    console.error("Error fetching total students:", error);
    return {
      success: false,
      error: "Failed to fetch total students",
    };
  }
}

/**
 * Get pending assignments that need grading
 */
export async function getPendingAssignments(teacherId: string) {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const pendingAssignments = await db.assignment.findMany({
      where: {
        schoolId, // Add school isolation
        creatorId: teacherId,
        submissions: {
          some: {
            status: "SUBMITTED",
            marks: null,
          },
        },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        subject: {
          select: {
            name: true,
          },
        },
        classes: {
          select: {
            class: {
              select: {
                name: true,
              },
            },
          },
        },
        submissions: {
          where: {
            status: "SUBMITTED",
            marks: null,
          },
          select: {
            id: true,
            status: true,
            student: {
              select: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
      take: 20, // Add limit for performance
    });

    const count = await db.assignment.count({
      where: {
        schoolId, // Add school isolation
        creatorId: teacherId,
        submissions: {
          some: {
            status: "SUBMITTED",
            marks: null,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        assignments: pendingAssignments,
        count: count,
      },
    };
  } catch (error) {
    console.error("Error fetching pending assignments:", error);
    return {
      success: false,
      error: "Failed to fetch pending assignments",
    };
  }
}

/**
 * Get upcoming exams within the next 7 days
 */
export async function getUpcomingExams(teacherId: string) {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const today = new Date();
    const nextWeek = addDays(today, 7);

    const upcomingExams = await db.exam.findMany({
      where: {
        schoolId, // Add school isolation
        creatorId: teacherId,
        examDate: {
          gte: today,
          lte: nextWeek,
        },
      },
      select: {
        id: true,
        title: true,
        examDate: true,
        totalMarks: true,
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
          },
        },
      },
      orderBy: {
        examDate: "asc",
      },
      take: 10, // Add limit for performance
    });

    const count = upcomingExams.length;

    return {
      success: true,
      data: {
        exams: upcomingExams,
        count: count,
      },
    };
  } catch (error) {
    console.error("Error fetching upcoming exams:", error);
    return {
      success: false,
      error: "Failed to fetch upcoming exams",
    };
  }
}

/**
 * Get today's classes from timetable
 */
export async function getTodaysClasses(teacherId: string) {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const today = new Date();
    const dayName = format(today, "EEEE").toUpperCase() as any;

    const todayClasses = await db.timetableSlot.findMany({
      where: {
        schoolId, // Add school isolation
        subjectTeacher: {
          teacherId: teacherId,
          schoolId, // Add school isolation
        },
        day: dayName,
        timetable: {
          isActive: true,
        },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        classId: true,
        sectionId: true,
        class: {
          select: {
            name: true,
          },
        },
        section: {
          select: {
            name: true,
          },
        },
        subjectTeacher: {
          select: {
            subject: {
              select: {
                name: true,
              },
            },
          },
        },
        room: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Format the classes with status
    const formattedClasses = todayClasses.map((slot) => {
      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);
      const now = new Date();

      const isNow = now >= startTime && now <= endTime;
      const isCompleted = now > endTime;

      return {
        id: slot.id,
        subject: slot.subjectTeacher.subject.name,
        className: slot.class.name,
        sectionName: slot.section?.name || null,
        time: `${format(startTime, "hh:mm a")} - ${format(endTime, "hh:mm a")}`,
        room: slot.room?.name || "TBA",
        topic: "Scheduled Lesson",
        status: isCompleted ? "completed" : isNow ? "next" : "upcoming",
        classId: slot.classId,
        sectionId: slot.sectionId,
        startTime: slot.startTime,
        endTime: slot.endTime,
      };
    });

    return {
      success: true,
      data: formattedClasses,
    };
  } catch (error) {
    console.error("Error fetching today's classes:", error);
    return {
      success: false,
      error: "Failed to fetch today's classes",
    };
  }
}

/**
 * Get recent announcements
 */
export async function getRecentAnnouncements() {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const today = new Date();

    const announcements = await db.announcement.findMany({
      where: {
        schoolId, // Add school isolation
        isActive: true,
        startDate: {
          lte: today,
        },
        OR: [
          {
            endDate: null,
          },
          {
            endDate: {
              gte: today,
            },
          },
        ],
        targetAudience: {
          has: "TEACHER",
        },
      },
      select: {
        id: true,
        title: true,
        content: true,
        startDate: true,
        createdAt: true,
        publisher: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    return {
      success: true,
      data: announcements,
    };
  } catch (error) {
    console.error("Error fetching recent announcements:", error);
    return {
      success: false,
      error: "Failed to fetch recent announcements",
    };
  }
}

/**
 * Get unread messages count for a teacher
 */
export async function getUnreadMessagesCount(teacherId: string) {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // First get the user associated with this teacher
    const teacher = await db.teacher.findUnique({
      where: {
        id: teacherId,
        schoolId, // Add school isolation
      },
      include: {
        user: true,
      },
    });

    if (!teacher) {
      return {
        success: false,
        error: "Teacher not found",
      };
    }

    const unreadCount = await db.message.count({
      where: {
        recipientId: teacher.userId,
        isRead: false,
      },
    });

    return {
      success: true,
      data: unreadCount,
    };
  } catch (error) {
    console.error("Error fetching unread messages count:", error);
    return {
      success: false,
      error: "Failed to fetch unread messages count",
    };
  }
}

/**
 * Get teacher dashboard data
 */
export async function getTeacherDashboardData() {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Get user first, then teacher record
    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Get teacher record with school isolation
    const teacher = await db.teacher.findUnique({
      where: {
        userId: user.id,
        schoolId, // Add school isolation
      },
      include: {
        user: true,
      },
    });

    if (!teacher) {
      return {
        success: false,
        error: "Teacher not found",
      };
    }

    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
    const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });

    // Use the new helper functions
    const [
      todayClassesResult,
      totalStudentsResult,
      pendingAssignmentsResult,
      upcomingExamsResult,
      recentAnnouncementsResult,
      unreadMessagesResult,
    ] = await Promise.all([
      getTodaysClasses(teacher.id),
      getTotalStudents(teacher.id),
      getPendingAssignments(teacher.id),
      getUpcomingExams(teacher.id),
      getRecentAnnouncements(),
      getUnreadMessagesCount(teacher.id),
    ]);

    const todayClasses = (todayClassesResult.success && todayClassesResult.data) ? todayClassesResult.data : [];
    const studentCount = (totalStudentsResult.success && totalStudentsResult.data !== undefined) ? totalStudentsResult.data : 0;
    const assignmentsNeedingGrading = (pendingAssignmentsResult.success && pendingAssignmentsResult.data) ? pendingAssignmentsResult.data.count : 0;
    const upcomingExamsCount = (upcomingExamsResult.success && upcomingExamsResult.data) ? upcomingExamsResult.data.count : 0;
    const recentAnnouncements = (recentAnnouncementsResult.success && recentAnnouncementsResult.data) ? recentAnnouncementsResult.data : [];
    const unreadMessagesCount = (unreadMessagesResult.success && unreadMessagesResult.data !== undefined) ? unreadMessagesResult.data : 0;

    // Get weekly attendance average with school isolation
    const attendanceRecords = await db.studentAttendance.findMany({
      where: {
        schoolId, // Add school isolation
        date: {
          gte: startOfThisWeek,
          lte: endOfThisWeek,
        },
        section: {
          schoolId, // Add school isolation
          class: {
            schoolId, // Add school isolation
            teachers: {
              some: {
                teacherId: teacher.id,
              },
            },
          },
        },
      },
    });

    const presentCount = attendanceRecords.filter(
      (record) => record.status === "PRESENT"
    ).length;
    const attendancePercentage =
      attendanceRecords.length > 0
        ? ((presentCount / attendanceRecords.length) * 100).toFixed(1)
        : "0.0";



    // Get recent assignments with school isolation
    const recentAssignments = await db.assignment.findMany({
      where: {
        schoolId, // Add school isolation
        creatorId: teacher.id,
      },
      include: {
        subject: true,
        classes: {
          include: {
            class: true,
          },
        },
        submissions: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
    });

    // Get pending tasks (assignments needing grading) with school isolation
    const pendingTasks = await db.assignment.findMany({
      where: {
        schoolId, // Add school isolation
        creatorId: teacher.id,
        dueDate: {
          gte: today,
        },
        submissions: {
          some: {
            status: "SUBMITTED",
            marks: null,
          },
        },
      },
      include: {
        subject: true,
        classes: {
          include: {
            class: true,
          },
        },
        submissions: {
          where: {
            status: "SUBMITTED",
            marks: null,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
      take: 4,
    });

    // Get class performance data with school isolation (OPTIMIZED - no N+1)
    const classes = await db.class.findMany({
      where: {
        schoolId, // Add school isolation
        teachers: {
          some: {
            teacherId: teacher.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
      take: 10, // Limit for performance
    });

    // Fetch exam results in a single aggregated query instead of N+1
    const classIds = classes.map(cls => cls.id);
    const examResults = await db.examResult.groupBy({
      by: ['exam'],
      where: {
        schoolId,
        exam: {
          subject: {
            classes: {
              some: {
                classId: { in: classIds }
              }
            }
          }
        },
        isAbsent: false,
      },
      _avg: {
        marks: true,
      },
    });

    // Get exam details to map to subjects
    const examIds = examResults.map(r => r.exam);
    const exams = await db.exam.findMany({
      where: {
        id: { in: examIds },
        schoolId,
      },
      select: {
        id: true,
        totalMarks: true,
        subject: {
          select: {
            name: true,
          },
        },
      },
    });

    // Map exam results to subjects
    const examMap = new Map(exams.map(e => [e.id, e]));
    const subjectScores = new Map<string, { total: number; count: number }>();

    examResults.forEach(result => {
      const exam = examMap.get(result.exam);
      if (!exam || !result._avg.marks) return;

      const subjectName = exam.subject.name;
      const percentage = (result._avg.marks / exam.totalMarks) * 100;

      const existing = subjectScores.get(subjectName) || { total: 0, count: 0 };
      existing.total += percentage;
      existing.count += 1;
      subjectScores.set(subjectName, existing);
    });

    // Calculate average performance per class/subject
    const classPerformanceData = Array.from(subjectScores.entries())
      .map(([subject, scores]) => ({
        subject,
        average: Math.round(scores.total / scores.count),
      }))
      .slice(0, 6); // Limit to 6 for chart readability

    // Get student attendance data for chart (optimized to prevent N+1 query) with school isolation
    const classIds = classes.slice(0, 4).map(cls => cls.id);
    const classAttendanceRecords = await db.studentAttendance.findMany({
      where: {
        schoolId, // Add school isolation
        date: {
          gte: startOfThisWeek,
          lte: endOfThisWeek,
        },
        section: {
          schoolId, // Add school isolation
          classId: {
            in: classIds,
          },
        },
      },
      include: {
        section: {
          select: {
            classId: true,
          },
        },
      },
    });

    // Group attendance by class
    const studentAttendanceData = classes.slice(0, 4).map((cls) => {
      const attendanceForClass = classAttendanceRecords.filter(
        (record) => record.section.classId === cls.id
      );

      const present = attendanceForClass.filter(
        (record) => record.status === "PRESENT"
      ).length;
      const absent = attendanceForClass.length - present;

      return {
        class: cls.name,
        present: present,
        absent: absent,
      };
    });

    // Get assignment status data with school isolation
    const allAssignments = await db.assignment.findMany({
      where: {
        schoolId, // Add school isolation
        creatorId: teacher.id,
      },
      include: {
        submissions: true,
      },
    });

    const submittedCount = allAssignments.reduce(
      (sum, assignment) =>
        sum +
        assignment.submissions.filter(
          (sub) => sub.status === "SUBMITTED" || sub.status === "GRADED"
        ).length,
      0
    );
    const pendingCount = allAssignments.reduce(
      (sum, assignment) =>
        sum + assignment.submissions.filter((sub) => sub.status === "PENDING").length,
      0
    );
    const gradedCount = allAssignments.reduce(
      (sum, assignment) =>
        sum + assignment.submissions.filter((sub) => sub.status === "GRADED").length,
      0
    );
    const lateCount = allAssignments.reduce(
      (sum, assignment) =>
        sum + assignment.submissions.filter((sub) => sub.status === "LATE").length,
      0
    );

    const assignmentData = [
      { status: "Submitted", count: submittedCount },
      { status: "Pending", count: pendingCount },
      { status: "Graded", count: gradedCount },
      { status: "Late", count: lateCount },
    ];

    return {
      success: true,
      data: {
        teacher: {
          name: `${teacher.user.firstName} ${teacher.user.lastName}`,
          email: teacher.user.email,
        },
        stats: {
          classesCount: todayClasses.length,
          studentsCount: studentCount,
          assignmentsNeedingGrading: assignmentsNeedingGrading,
          attendancePercentage: attendancePercentage,
          upcomingExamsCount: upcomingExamsCount,
          unreadMessagesCount: unreadMessagesCount,
        },
        todayClasses: todayClasses,
        recentAnnouncements: recentAnnouncements.map((announcement) => ({
          id: announcement.id,
          title: announcement.title,
          content: announcement.content,
          publisherName: `${announcement.publisher.user.firstName} ${announcement.publisher.user.lastName}`,
          startDate: format(announcement.startDate, "MMM dd, yyyy"),
          createdAt: format(announcement.createdAt, "MMM dd, yyyy"),
        })),
        recentLessons: [],
        recentAssignments: recentAssignments.map((assignment) => {
          const totalSubmissions = assignment.submissions.length;
          const submittedSubmissions = assignment.submissions.filter(
            (sub) => sub.status === "SUBMITTED" || sub.status === "GRADED"
          ).length;

          return {
            id: assignment.id,
            title: assignment.title,
            class: assignment.classes.map((c) => c.class.name).join(", "),
            dueDate: format(assignment.dueDate, "MMM dd, yyyy"),
            submissions: `${submittedSubmissions}/${totalSubmissions}`,
            status: new Date() > assignment.dueDate ? "completed" : "active",
          };
        }),
        pendingTasks: pendingTasks.map((task) => ({
          id: task.id,
          title: `Grade ${task.title}`,
          class: task.classes.map((c) => c.class.name).join(", "),
          dueDate: format(task.dueDate, "MMM dd, yyyy"),
          priority: task.submissions.length > 10 ? "high" : "medium",
          count: task.submissions.length,
        })),
        studentAttendanceData,
        assignmentData,
        classPerformanceData,
      },
    };
  } catch (error) {
    console.error("Error fetching teacher dashboard data:", error);
    return {
      success: false,
      error: "Failed to fetch dashboard data",
    };
  }
}
