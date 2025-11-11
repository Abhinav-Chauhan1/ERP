"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, format } from "date-fns";

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

    // Get today's classes from timetable
    const todayClasses = await db.timetableSlot.findMany({
      where: {
        subjectTeacher: {
          teacherId: teacher.id,
        },
        day: format(today, "EEEE").toUpperCase() as any,
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

    // Get total number of students across all classes
    const studentCount = await db.classEnrollment.count({
      where: {
        class: {
          teachers: {
            some: {
              teacherId: teacher.id,
            },
          },
        },
        status: "ACTIVE",
      },
    });

    // Get assignments needing grading
    const assignmentsNeedingGrading = await db.assignment.count({
      where: {
        creatorId: teacher.id,
        submissions: {
          some: {
            status: "SUBMITTED",
            marks: null,
          },
        },
      },
    });

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

    // Format today's classes
    const formattedTodayClasses = todayClasses.map((slot) => {
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
      };
    });

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
        },
        todayClasses: formattedTodayClasses,
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
