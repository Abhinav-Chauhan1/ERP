"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, format, addDays } from "date-fns";

/**
 * Get total number of students taught by a teacher
 */
export async function getTotalStudents(teacherId: string) {
  try {
    const studentCount = await db.classEnrollment.count({
      where: {
        class: {
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
    const pendingAssignments = await db.assignment.findMany({
      where: {
        creatorId: teacherId,
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
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    const count = await db.assignment.count({
      where: {
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
    const today = new Date();
    const nextWeek = addDays(today, 7);

    const upcomingExams = await db.exam.findMany({
      where: {
        creatorId: teacherId,
        examDate: {
          gte: today,
          lte: nextWeek,
        },
      },
      include: {
        subject: true,
        examType: true,
        term: true,
      },
      orderBy: {
        examDate: "asc",
      },
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
    const today = new Date();
    const dayName = format(today, "EEEE").toUpperCase() as any;

    const todayClasses = await db.timetableSlot.findMany({
      where: {
        subjectTeacher: {
          teacherId: teacherId,
        },
        day: dayName,
        timetable: {
          isActive: true,
        },
      },
      include: {
        class: true,
        section: true,
        subjectTeacher: {
          include: {
            subject: true,
          },
        },
        room: true,
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
    const today = new Date();

    const announcements = await db.announcement.findMany({
      where: {
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
      include: {
        publisher: {
          include: {
            user: true,
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
    // First get the user associated with this teacher
    const teacher = await db.teacher.findUnique({
      where: {
        id: teacherId,
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
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Get user first, then teacher record
    const user = await db.user.findUnique({
      where: {
        clerkId: userId,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Get teacher record
    const teacher = await db.teacher.findUnique({
      where: {
        userId: user.id,
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

    // Get weekly attendance average
    const attendanceRecords = await db.studentAttendance.findMany({
      where: {
        date: {
          gte: startOfThisWeek,
          lte: endOfThisWeek,
        },
        section: {
          class: {
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

    // Get recent lessons
    const recentLessons = await db.lesson.findMany({
      where: {
        subject: {
          teachers: {
            some: {
              teacherId: teacher.id,
            },
          },
        },
      },
      include: {
        subject: true,
        syllabusUnit: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
    });

    // Get recent assignments
    const recentAssignments = await db.assignment.findMany({
      where: {
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

    // Get pending tasks (assignments needing grading)
    const pendingTasks = await db.assignment.findMany({
      where: {
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

    // Get class performance data
    const classes = await db.class.findMany({
      where: {
        teachers: {
          some: {
            teacherId: teacher.id,
          },
        },
      },
      include: {
        sections: {
          include: {
            enrollments: {
              include: {
                student: {
                  include: {
                    examResults: {
                      include: {
                        exam: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Calculate average performance per class
    const classPerformanceData = classes.map((cls) => {
      const allResults = cls.sections.flatMap((section) =>
        section.enrollments.flatMap((enrollment) =>
          enrollment.student.examResults
        )
      );

      const totalMarks = allResults.reduce((sum, result) => sum + result.marks, 0);
      const average = allResults.length > 0 ? totalMarks / allResults.length : 0;

      return {
        subject: cls.name,
        average: Math.round(average),
      };
    });

    // Get student attendance data for chart
    const studentAttendanceData = await Promise.all(
      classes.slice(0, 4).map(async (cls) => {
        const attendanceForClass = await db.studentAttendance.findMany({
          where: {
            date: {
              gte: startOfThisWeek,
              lte: endOfThisWeek,
            },
            section: {
              classId: cls.id,
            },
          },
        });

        const present = attendanceForClass.filter(
          (record) => record.status === "PRESENT"
        ).length;
        const absent = attendanceForClass.length - present;

        return {
          class: cls.name,
          present: present,
          absent: absent,
        };
      })
    );

    // Get assignment status data
    const allAssignments = await db.assignment.findMany({
      where: {
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
        recentLessons: recentLessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          subject: lesson.subject.name,
          date: format(lesson.createdAt, "yyyy-MM-dd"),
          duration: lesson.duration || 45,
          unit: lesson.syllabusUnit?.title || "General",
        })),
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
