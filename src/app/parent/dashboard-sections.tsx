import { redirect } from "next/navigation";
import { auth } from "@/auth";
// Note: Replace currentUser() calls with auth() and access session.user
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { ParentHeader } from "@/components/parent/parent-header";
import { ChildrenCards } from "@/components/parent/children-cards";
import { AttendanceSummary } from "@/components/parent/attendance-summary";
import { UpcomingMeetings } from "@/components/parent/upcoming-meetings";
import { FeePaymentSummary } from "@/components/parent/fee-payment-summary";
import { RecentAnnouncements } from "@/components/parent/recent-announcements";
import { QuickActionsPanel } from "@/components/parent/dashboard/quick-actions-panel";
import { PerformanceSummaryCards } from "@/components/parent/dashboard/performance-summary-cards";
import { CalendarWidget } from "@/components/calendar/calendar-widget";
import { RecentActivityFeed } from "@/components/parent/dashboard/recent-activity-feed";
import { CACHE_TAGS } from "@/lib/utils/cache";
import { getParentCalendarEvents } from "@/lib/actions/calendar-widget-actions";

/**
 * Get parent data and children
 * Cached for 5 minutes (300 seconds) as per requirements 9.5
 */
async function getParentData() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const dbUser = await db.user.findUnique({
    where: {
      id: session.user.id
    }
  });

  if (!dbUser || dbUser.role !== UserRole.PARENT) {
    redirect("/login");
  }

  const parent = await db.parent.findUnique({
    where: {
      userId: dbUser.id
    }
  });

  if (!parent) {
    return null;
  }

  // Cached function to fetch dashboard data
  const getCachedDashboardData = unstable_cache(
    async (parentId: string) => {
      const parentChildren = await db.studentParent.findMany({
        where: {
          parentId
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                }
              },
              enrollments: {
                orderBy: {
                  enrollDate: 'desc'
                },
                take: 1,
                include: {
                  class: true,
                  section: true
                }
              }
            }
          }
        }
      });

      const children = parentChildren.map(pc => ({
        ...pc.student,
        isPrimary: pc.isPrimary
      }));

      return children;
    },
    [`parent-dashboard-${parent.id}`],
    {
      tags: [CACHE_TAGS.DASHBOARD, CACHE_TAGS.PARENTS, CACHE_TAGS.STUDENTS, `parent-${parent.id}`],
      revalidate: 300 // 5 minutes
    }
  );

  const children = await getCachedDashboardData(parent.id);

  return { dbUser, parent, children };
}

/**
 * Header section with parent and children info
 */
export async function HeaderSection() {
  const data = await getParentData();

  if (!data) {
    return (
      <div className="h-full p-6">
        <h1 className="text-2xl font-bold mb-4">Account Setup Incomplete</h1>
        <p className="text-gray-700">
          Your parent account has been created but needs to be properly set up.
          Please contact the school administration to complete your profile.
        </p>
      </div>
    );
  }

  const { dbUser, children } = data;

  return (
    <>
      <ParentHeader parent={{ user: dbUser }} children={children} />
      <ChildrenCards children={children} />
    </>
  );
}

/**
 * Attendance and fees section
 */
export async function AttendanceFeesSection() {
  const data = await getParentData();

  if (!data) {
    return null;
  }

  const { children } = data;
  const studentIds = children.map(child => child.id);

  // Get fee payments for all children
  const feePayments = await db.feePayment.findMany({
    where: {
      studentId: {
        in: studentIds
      }
    },
    orderBy: {
      paymentDate: 'desc'
    },
    include: {
      student: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      }
    }
  });

  // Get attendance for all children in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const attendanceRecords = await db.studentAttendance.findMany({
    where: {
      studentId: {
        in: studentIds
      },
      date: {
        gte: thirtyDaysAgo
      }
    },
    orderBy: {
      date: 'desc'
    }
  });

  // Calculate attendance stats for each child
  const attendanceStats = studentIds.map(studentId => {
    const studentAttendance = attendanceRecords.filter(record => record.studentId === studentId);
    const totalDays = studentAttendance.length;
    const presentDays = studentAttendance.filter(record => record.status === "PRESENT").length;
    const absentDays = studentAttendance.filter(record => record.status === "ABSENT").length;
    const lateDays = studentAttendance.filter(record => record.status === "LATE").length;

    return {
      studentId,
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      attendancePercentage: totalDays > 0 ? (presentDays / totalDays) * 100 : 0
    };
  });

  return (
    <div className="lg:col-span-2 space-y-6">
      <AttendanceSummary attendanceStats={attendanceStats} children={children} />
      <FeePaymentSummary payments={feePayments} children={children} />
    </div>
  );
}

/**
 * Meetings and announcements section
 */
export async function MeetingsAnnouncementsSection() {
  const data = await getParentData();

  if (!data) {
    return null;
  }

  const { parent } = data;

  // Get upcoming meetings
  const upcomingMeetings = await db.parentMeeting.findMany({
    where: {
      parentId: parent.id,
      scheduledDate: {
        gte: new Date()
      }
    },
    orderBy: {
      scheduledDate: 'asc'
    },
    take: 3,
    include: {
      teacher: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      }
    }
  });

  // Get recent announcements
  const recentAnnouncements = await db.announcement.findMany({
    where: {
      targetAudience: {
        has: "PARENT"
      },
      isActive: true,
      startDate: {
        lte: new Date()
      },
      OR: [
        {
          endDate: {
            gte: new Date()
          }
        },
        {
          endDate: null
        }
      ]
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5,
    include: {
      publisher: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      }
    }
  });

  return (
    <div className="space-y-6">
      <UpcomingMeetings meetings={upcomingMeetings} />
      <RecentAnnouncements announcements={recentAnnouncements} />
    </div>
  );
}

/**
 * Quick actions panel section
 */
export async function QuickActionsSection() {
  return <QuickActionsPanel />;
}

/**
 * Performance summary section
 */
export async function PerformanceSummarySection() {
  const data = await getParentData();

  if (!data) {
    return null;
  }

  const { children } = data;
  const studentIds = children.map(child => child.id);

  // Get latest exam results for each child
  const examResults = await db.examResult.findMany({
    where: {
      studentId: {
        in: studentIds
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    distinct: ['studentId'],
    include: {
      exam: true
    }
  });

  // Get attendance for each child in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const attendanceRecords = await db.studentAttendance.findMany({
    where: {
      studentId: {
        in: studentIds
      },
      date: {
        gte: thirtyDaysAgo
      }
    }
  });

  // Get pending assignments for each child
  const pendingAssignments = await db.assignmentSubmission.findMany({
    where: {
      studentId: {
        in: studentIds
      },
      status: 'PENDING'
    }
  });

  // Get previous exam results for trend calculation
  const previousExamResults = await db.examResult.findMany({
    where: {
      studentId: {
        in: studentIds
      }
    },
    include: {
      exam: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: studentIds.length * 2 // Get 2 results per student
  });

  // Build performance data for each child
  const childrenPerformance = children.map(child => {
    const latestExam = examResults.find(result => result.studentId === child.id);
    const childAttendance = attendanceRecords.filter(record => record.studentId === child.id);
    const presentDays = childAttendance.filter(record => record.status === "PRESENT").length;
    const attendancePercentage = childAttendance.length > 0
      ? (presentDays / childAttendance.length) * 100
      : 0;

    const childPendingAssignments = pendingAssignments.filter(
      submission => submission.studentId === child.id
    ).length;

    // Calculate grade trend
    const childExamResults = previousExamResults
      .filter(result => result.studentId === child.id)
      .slice(0, 2);

    let gradeTrend: 'up' | 'down' | 'stable' = 'stable';
    if (childExamResults.length >= 2) {
      const latest = childExamResults[0];
      const previous = childExamResults[1];
      const latestPercentage = (latest.marks / latest.exam.totalMarks) * 100;
      const previousPercentage = (previous.marks / previous.exam.totalMarks) * 100;

      if (latestPercentage > previousPercentage + 5) {
        gradeTrend = 'up';
      } else if (latestPercentage < previousPercentage - 5) {
        gradeTrend = 'down';
      }
    }

    return {
      id: child.id,
      user: {
        firstName: child.user.firstName || 'Unknown',
        lastName: child.user.lastName || 'Student'
      },
      latestExamResult: latestExam ? {
        score: latestExam.marks,
        maxScore: latestExam.exam.totalMarks
      } : null,
      attendancePercentage,
      pendingAssignments: childPendingAssignments,
      gradeTrend
    };
  });

  return <PerformanceSummaryCards children={childrenPerformance} />;
}

/**
 * Calendar widget section
 */
export async function CalendarWidgetSection() {
  const result = await getParentCalendarEvents(5);
  const events = (result.success && result.data) ? result.data : [];

  return <CalendarWidget events={events} userRole="PARENT" />;
}

/**
 * Recent activity feed section
 */
export async function RecentActivityFeedSection() {
  const data = await getParentData();

  if (!data) {
    return null;
  }

  const { children } = data;
  const studentIds = children.map(child => child.id);

  // Get recent assignments
  const recentAssignments = await db.assignment.findMany({
    where: {
      classes: {
        some: {
          classId: {
            in: children.flatMap(child =>
              child.enrollments.map(enrollment => enrollment.classId)
            )
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5,
    include: {
      submissions: {
        where: {
          studentId: {
            in: studentIds
          }
        }
      }
    }
  });

  // Get recent exams through exam results
  const recentExamResults = await db.examResult.findMany({
    where: {
      studentId: {
        in: studentIds
      }
    },
    include: {
      exam: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  });

  // Extract unique exams from results
  const recentExams = Array.from(
    new Map(recentExamResults.map(result => [result.exam.id, result.exam])).values()
  );

  // Get recent announcements
  const recentAnnouncements = await db.announcement.findMany({
    where: {
      targetAudience: {
        has: "PARENT"
      },
      isActive: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  });

  // Get recent attendance alerts (absences)
  const recentAbsences = await db.studentAttendance.findMany({
    where: {
      studentId: {
        in: studentIds
      },
      status: 'ABSENT',
      date: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    },
    orderBy: {
      date: 'desc'
    },
    take: 5
  });

  // Build activity feed
  const activities = [
    ...recentAssignments.map(assignment => {
      const childSubmission = assignment.submissions[0];
      const child = children.find(c => c.id === childSubmission?.studentId);
      return {
        id: `assignment-${assignment.id}`,
        type: 'assignment',
        description: `New assignment: ${assignment.title}`,
        timestamp: assignment.createdAt,
        childName: child ? `${child.user.firstName} ${child.user.lastName}` : 'Unknown'
      };
    }),
    ...recentExamResults.map(result => {
      // Find which child this exam result is for
      const child = children.find(c => c.id === result.studentId);
      return {
        id: `exam-${result.exam.id}`,
        type: 'exam',
        description: `Exam: ${result.exam.title}`,
        timestamp: result.createdAt,
        childName: child ? `${child.user.firstName} ${child.user.lastName}` : 'Unknown'
      };
    }),
    ...recentAnnouncements.map(announcement => ({
      id: `announcement-${announcement.id}`,
      type: 'announcement',
      description: announcement.title,
      timestamp: announcement.createdAt,
      childName: 'All Children'
    })),
    ...recentAbsences.map(absence => {
      const child = children.find(c => c.id === absence.studentId);
      return {
        id: `absence-${absence.id}`,
        type: 'alert',
        description: 'Absent from school',
        timestamp: absence.date,
        childName: child ? `${child.user.firstName} ${child.user.lastName}` : 'Unknown'
      };
    })
  ];

  return <RecentActivityFeed activities={activities} />;
}
