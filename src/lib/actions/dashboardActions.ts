"use server";

import { withSchoolAuthAction } from "@/lib/auth/security-wrapper";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const getDashboardStats = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  try {
    // Get counts
    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
    ] = await Promise.all([
      db.student.count({
        where: {
          schoolId,
          user: {
            active: true
          }
        }
      }),
      db.teacher.count({
        where: {
          schoolId,
          user: {
            active: true
          }
        }
      }),
      db.class.count({ where: { schoolId } }),
      db.subject.count({ where: { schoolId } }),
    ]);

    return {
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects,
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return { success: false, error: "Failed to fetch dashboard stats" };
  }
});

// New functions for Phase 10

export const getTotalStudents = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  try {
    const totalStudents = await db.student.count({
      where: {
        schoolId,

        user: {
          active: true,

        },
      },
    });

    return {
      success: true,
      data: totalStudents,
    };
  } catch (error) {
    console.error("Error fetching total students:", error);
    return { success: false, error: "Failed to fetch total students" };
  }
});

export const getTotalTeachers = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  try {
    const totalTeachers = await db.teacher.count({
      where: {
        schoolId,

        user: {
          active: true,

        },
      },
    });

    return {
      success: true,
      data: totalTeachers,
    };
  } catch (error) {
    console.error("Error fetching total teachers:", error);
    return { success: false, error: "Failed to fetch total teachers" };
  }
});

export const getPendingFeePayments = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  try {
    const pendingPayments = await db.feePayment.aggregate({
      where: {
        schoolId,

        status: {
          in: ["PENDING", "PARTIAL"],

        },
      },
      _sum: {
        balance: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      success: true,
      data: {
        totalAmount: pendingPayments._sum.balance || 0,
        count: pendingPayments._count.id || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching pending fee payments:", error);
    return { success: false, error: "Failed to fetch pending fee payments" };
  }
});

export const getTodaysAttendance = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get student attendance for today
    const studentAttendance = await db.studentAttendance.groupBy({
      by: ["status"],
      where: {
        student: {
          schoolId
        },
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      _count: {
        id: true,
      },
    });

    // Get teacher attendance for today
    const teacherAttendance = await db.teacherAttendance.groupBy({
      by: ["status"],
      where: {
        teacher: {
          schoolId
        },
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      _count: {
        id: true,
      },
    });

    // Calculate student attendance percentage
    const totalStudentRecords = studentAttendance.reduce(
      (sum, record) => sum + record._count.id,
      0
    );
    const presentStudents =
      studentAttendance.find((record) => record.status === "PRESENT")?._count.id || 0;
    const studentAttendancePercentage =
      totalStudentRecords > 0
        ? Math.round((presentStudents / totalStudentRecords) * 100)
        : 0;

    // Calculate teacher attendance percentage
    const totalTeacherRecords = teacherAttendance.reduce(
      (sum, record) => sum + record._count.id,
      0
    );
    const presentTeachers =
      teacherAttendance.find((record) => record.status === "PRESENT")?._count.id || 0;
    const teacherAttendancePercentage =
      totalTeacherRecords > 0
        ? Math.round((presentTeachers / totalTeacherRecords) * 100)
        : 0;

    return {
      success: true,
      data: {
        studentAttendance: {
          percentage: studentAttendancePercentage,
          present: presentStudents,
          total: totalStudentRecords,
        },
        teacherAttendance: {
          percentage: teacherAttendancePercentage,
          present: presentTeachers,
          total: totalTeacherRecords,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching today's attendance:", error);
    return { success: false, error: "Failed to fetch today's attendance" };
  }
});

export const getUpcomingEventsCount = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const upcomingEventsCount = await db.event.count({
      where: {
        schoolId,

        startDate: {
          gte: now,
          lte: thirtyDaysFromNow,

        },
        status: {
          in: ["UPCOMING", "ONGOING"],
        },
      },
    });

    return {
      success: true,
      data: upcomingEventsCount,
    };
  } catch (error) {
    console.error("Error fetching upcoming events count:", error);
    return { success: false, error: "Failed to fetch upcoming events count" };
  }
});

export const getRecentAnnouncementsCount = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAnnouncementsCount = await db.announcement.count({
      where: {
        schoolId,

        isActive: true,
        createdAt: {
          gte: sevenDaysAgo,

        },
      },
    });

    return {
      success: true,
      data: recentAnnouncementsCount,
    };
  } catch (error) {
    console.error("Error fetching recent announcements count:", error);
    return { success: false, error: "Failed to fetch recent announcements count" };
  }
});

export const getStudentAttendanceData = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  try {
    // Get attendance data for the last 12 months
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const attendanceRecords = await db.studentAttendance.findMany({
      where: {
        schoolId,

        date: {
          gte: twelveMonthsAgo,

        },
      },
      select: {
        date: true,
        status: true,
      },
    });

    // Group by month and calculate percentage
    const monthlyData = new Map<string, { present: number; total: number }>();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    attendanceRecords.forEach((record) => {
      const month = months[record.date.getMonth()];
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { present: 0, total: 0 });
      }
      const data = monthlyData.get(month)!;
      data.total++;
      if (record.status === 'PRESENT') {
        data.present++;
      }
    });

    const chartData = months.map((month) => {
      const data = monthlyData.get(month) || { present: 0, total: 0 };
      const percentage = data.total > 0 ? Math.round((data.present / data.total) * 100) : 0;
      return { month, present: percentage };
    });

    return { success: true, data: chartData };
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    return { success: false, error: "Failed to fetch attendance data" };
  }
});

export const getExamResultsData = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  try {
    // Get average exam results by subject
    const subjects = await db.subject.findMany({
      where: { schoolId },
      take: 6,
      select: {
        id: true,
        name: true,
      },
    });

    const resultsData = await Promise.all(
      subjects.map(async (subject) => {
        const results = await db.examResult.findMany({
          where: {
            schoolId,

            exam: {
              subjectId: subject.id,

            },
            isAbsent: false,
          },
          select: {
            marks: true,
          },
        });

        const average = results.length > 0
          ? Math.round(results.reduce((sum, r) => sum + r.marks, 0) / results.length)
          : 0;

        return {
          subject: subject.name,
          average,
        };
      })
    );

    return { success: true, data: resultsData };
  } catch (error) {
    console.error("Error fetching exam results:", error);
    return { success: false, error: "Failed to fetch exam results" };
  }
});

export const getEnrollmentDistribution = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  try {
    const classes = await db.class.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            enrollments: {
              where: {
                schoolId,

                status: 'ACTIVE',

              },
            },
          },
        },
      },
      take: 6,
      orderBy: {
        name: 'asc',
      },
    });

    const data = classes.map((cls) => ({
      name: cls.name,
      value: cls._count.enrollments,
    }));

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching enrollment distribution:", error);
    return { success: false, error: "Failed to fetch enrollment distribution" };
  }
});

export const getRecentActivities = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  try {
    // Get recent activities from various sources with timeout protection
    const [recentExams, recentAssignments, recentAnnouncements] = await Promise.all([
      db.exam.findMany({
        where: { schoolId },
        take: 2,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          subject: {
            select: {
              name: true,
            },
          },
        },
      }).catch(() => [] as any),
      db.assignment.findMany({
        where: { schoolId },
        take: 2,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          subject: {
            select: {
              name: true,
            },
          },
        },
      }).catch(() => [] as any),
      db.announcement.findMany({
        take: 1,
        orderBy: { createdAt: 'desc' },
        include: {
          publisher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }).catch(() => [] as any),
    ]);

    const activities = [
      ...recentExams.map((exam: any) => ({
        id: exam.id,
        user: {
          name: exam.creator ? `${exam.creator.user.firstName} ${exam.creator.user.lastName}` : 'Unknown',
          role: 'teacher',
        },
        action: 'created an exam for',
        target: exam.subject.name,
        date: exam.createdAt,
      })),
      ...recentAssignments.map((assignment: any) => ({
        id: assignment.id,
        user: {
          name: assignment.creator ? `${assignment.creator.user.firstName} ${assignment.creator.user.lastName}` : 'Unknown',
          role: 'teacher',
        },
        action: 'created an assignment in',
        target: assignment.subject.name,
        date: assignment.createdAt,
      })),
      ...recentAnnouncements.map((announcement: any) => ({
        id: announcement.id,
        user: {
          name: `${announcement.publisher.user.firstName} ${announcement.publisher.user.lastName}`,
          role: 'admin',
        },
        action: 'created an announcement for',
        target: announcement.targetAudience.join(', '),
        date: announcement.createdAt,
      })),
    ];

    // Sort by date and take top 5
    activities.sort((a, b) => b.date.getTime() - a.date.getTime());
    const topActivities = activities.slice(0, 5);

    return { success: true, data: topActivities };
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return { success: false, error: "Failed to fetch recent activities" };
  }
});

export const getUpcomingEvents = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const events = await db.event.findMany({
      where: {
        schoolId,

        startDate: {
          gte: now,
          lte: thirtyDaysFromNow,

        },
        status: {
          in: ['UPCOMING', 'ONGOING'],
        },
      },
      orderBy: {
        startDate: 'asc',
      },
      take: 5,
    });

    const calendarEvents = events.map((event) => ({
      id: event.id,
      title: event.title,
      date: event.startDate,
      type: (event.type?.toLowerCase() || 'event') as 'exam' | 'holiday' | 'event' | 'meeting',
    }));

    return { success: true, data: calendarEvents };
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    return { success: false, error: "Failed to fetch upcoming events" };
  }
});

export const getNotifications = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  try {
    // Get high absence rate classes
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const attendanceBySection = await db.studentAttendance.groupBy({
      by: ['sectionId'],
      where: {
        student: {
          schoolId
        },

        date: {
          gte: sevenDaysAgo,

        },
      },
      _count: {
        status: true,
      },
    });

    // Get pending fee payments
    const pendingPayments = await db.feePayment.count({
      where: {
        student: {
          schoolId
        },

        status: 'PENDING',
        paymentDate: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due within 7 days

        },
      },
    });

    // Get upcoming events count
    const upcomingEventsCount = await db.event.count({
      where: {
        schoolId,

        startDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),

        },
        status: 'UPCOMING',
      },
    });

    const notifications = [];

    // Check for high absence rates (simplified)
    const highAbsenceCount = attendanceBySection.filter((section) => {
      const absentCount = section._count.status;
      return absentCount > 10; // Threshold
    }).length;

    if (highAbsenceCount > 0) {
      notifications.push({
        type: 'warning',
        title: 'Absence Rate Alert',
        message: `${highAbsenceCount} class(es) have high absence rates this week.`,
      });
    }

    if (pendingPayments > 0) {
      notifications.push({
        type: 'warning',
        title: 'Fee Payment Reminder',
        message: `${pendingPayments} students have pending fee payments due this week.`,
      });
    }

    if (upcomingEventsCount > 0) {
      notifications.push({
        type: 'info',
        title: 'Upcoming Events',
        message: `${upcomingEventsCount} event(s) scheduled for this week.`,
      });
    }

    return { success: true, data: notifications };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { success: false, error: "Failed to fetch notifications" };
  }
});
