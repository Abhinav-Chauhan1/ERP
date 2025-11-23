"use server";

import { db } from "@/lib/db";

export async function getDashboardStats() {
  try {
    // Get counts
    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
    ] = await Promise.all([
      db.student.count({ where: { user: { active: true } } }),
      db.teacher.count({ where: { user: { active: true } } }),
      db.class.count(),
      db.subject.count(),
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
}

// New functions for Phase 10

export async function getTotalStudents() {
  try {
    const totalStudents = await db.student.count({
      where: {
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
}

export async function getTotalTeachers() {
  try {
    const totalTeachers = await db.teacher.count({
      where: {
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
}

export async function getPendingFeePayments() {
  try {
    const pendingPayments = await db.feePayment.aggregate({
      where: {
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
}

export async function getTodaysAttendance() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get student attendance for today
    const studentAttendance = await db.studentAttendance.groupBy({
      by: ["status"],
      where: {
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
}

export async function getUpcomingEventsCount() {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const upcomingEventsCount = await db.event.count({
      where: {
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
}

export async function getRecentAnnouncementsCount() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAnnouncementsCount = await db.announcement.count({
      where: {
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
}

export async function getStudentAttendanceData() {
  try {
    // Get attendance data for the last 12 months
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const attendanceRecords = await db.studentAttendance.findMany({
      where: {
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
}

export async function getExamResultsData() {
  try {
    // Get average exam results by subject
    const subjects = await db.subject.findMany({
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
}

export async function getEnrollmentDistribution() {
  try {
    const classes = await db.class.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            enrollments: {
              where: {
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
      grade: cls.name,
      students: cls._count.enrollments,
    }));

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching enrollment distribution:", error);
    return { success: false, error: "Failed to fetch enrollment distribution" };
  }
}

export async function getRecentActivities() {
  try {
    // Get recent activities from various sources with timeout protection
    const [recentExams, recentAssignments, recentAnnouncements] = await Promise.all([
      db.exam.findMany({
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
      }).catch(() => []),
      db.assignment.findMany({
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
      }).catch(() => []),
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
      }).catch(() => []),
    ]);

    const activities = [
      ...recentExams.map((exam) => ({
        id: exam.id,
        user: {
          name: exam.creator ? `${exam.creator.user.firstName} ${exam.creator.user.lastName}` : 'Unknown',
          role: 'teacher',
        },
        action: 'created an exam for',
        target: exam.subject.name,
        date: exam.createdAt,
      })),
      ...recentAssignments.map((assignment) => ({
        id: assignment.id,
        user: {
          name: assignment.creator ? `${assignment.creator.user.firstName} ${assignment.creator.user.lastName}` : 'Unknown',
          role: 'teacher',
        },
        action: 'created an assignment in',
        target: assignment.subject.name,
        date: assignment.createdAt,
      })),
      ...recentAnnouncements.map((announcement) => ({
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
}

export async function getUpcomingEvents() {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const events = await db.event.findMany({
      where: {
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
}

export async function getNotifications() {
  try {
    // Get high absence rate classes
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const attendanceBySection = await db.studentAttendance.groupBy({
      by: ['sectionId'],
      where: {
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
        status: 'PENDING',
        paymentDate: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due within 7 days
        },
      },
    });

    // Get upcoming events count
    const upcomingEventsCount = await db.event.count({
      where: {
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
}
