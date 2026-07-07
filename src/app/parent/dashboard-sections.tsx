import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { cache } from "react";
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
import { prisma } from "@/lib/db";
import { formatFullName } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Cached per-request: fetch all dashboard data in parallel in one shot
// ---------------------------------------------------------------------------
const getCachedDashboardData = unstable_cache(
  async (parentId: string, schoolId: string) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const now = new Date();

    // Fire all independent queries in parallel
    const [
      parentChildren,
      upcomingMeetings,
      recentAnnouncements,
    ] = await Promise.all([
      db.studentParent.findMany({
        where: { parentId },
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                },
              },
              enrollments: {
                orderBy: { enrollDate: "desc" },
                take: 1,
                include: { class: true, section: true },
              },
            },
          },
        },
      }),
      db.parentMeeting.findMany({
        where: { parentId, scheduledDate: { gte: now } },
        orderBy: { scheduledDate: "asc" },
        take: 3,
        include: {
          teacher: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      db.announcement.findMany({
        where: {
          targetAudience: { has: "PARENT" },
          isActive: true,
          startDate: { lte: now },
          OR: [{ endDate: { gte: now } }, { endDate: null }],
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          publisher: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
    ]);

    const children = parentChildren.map((pc) => ({
      ...pc.student,
      isPrimary: pc.isPrimary,
    }));

    const studentIds = children.map((c) => c.id);
    const classIds = children.flatMap((c) =>
      c.enrollments.map((e) => e.classId)
    );
    const sectionIds = children.flatMap((c) =>
      c.enrollments.map((e) => e.sectionId).filter(Boolean)
    ) as string[];

    // Second wave — requires studentIds / classIds resolved from first wave
    const [
      feePayments,
      attendanceRecords,
      pendingAssignments,
      examResults,
      recentAssignments,
      recentExamResults,
      recentAbsences,
      calendarEvents,
    ] = await Promise.all([
      // Fees
      db.feePayment.findMany({
        where: { studentId: { in: studentIds } },
        orderBy: { paymentDate: "desc" },
        include: {
          student: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      // Attendance — last 30 days (shared by both PerformanceSummary & AttendanceFees)
      db.studentAttendance.findMany({
        where: {
          studentId: { in: studentIds },
          date: { gte: thirtyDaysAgo },
        },
        orderBy: { date: "desc" },
      }),
      // Pending assignments
      db.assignmentSubmission.findMany({
        where: { studentId: { in: studentIds }, status: "PENDING" },
      }),
      // Exam results — fetch enough to cover latest + previous per student
      db.examResult.findMany({
        where: { studentId: { in: studentIds } },
        include: { exam: true },
        orderBy: { createdAt: "desc" },
        take: studentIds.length * 4, // 4 results per student gives latest + prev + activity feed
      }),
      // Recent assignments for activity feed
      db.assignment.findMany({
        where: {
          classes: {
            some: { classId: { in: classIds } },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          submissions: { where: { studentId: { in: studentIds } } },
        },
      }),
      // Recent exam results for activity feed (subset of examResults above)
      // Kept separate so take:5 limit applies cleanly for feed ordering
      db.examResult.findMany({
        where: { studentId: { in: studentIds } },
        include: { exam: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Recent absences for activity feed
      db.studentAttendance.findMany({
        where: {
          studentId: { in: studentIds },
          status: "ABSENT",
          date: { gte: sevenDaysAgo },
        },
        orderBy: { date: "desc" },
        take: 5,
      }),
      // Calendar events
      prisma.calendarEvent.findMany({
        where: {
          schoolId,
          startDate: { gte: now },
          OR: [
            { visibleToRoles: { has: UserRole.PARENT } },
            ...(classIds.length > 0
              ? [{ visibleToClasses: { hasSome: classIds } }]
              : []),
            ...(sectionIds.length > 0
              ? [{ visibleToSections: { hasSome: sectionIds } }]
              : []),
          ],
        },
        include: { category: true },
        orderBy: { startDate: "asc" },
        take: 5,
      }),
    ]);

    return {
      children,
      studentIds,
      classIds,
      sectionIds,
      feePayments,
      attendanceRecords,
      pendingAssignments,
      examResults,
      recentAssignments,
      recentExamResults,
      recentAbsences,
      calendarEvents,
      upcomingMeetings,
      recentAnnouncements,
    };
  },
  ["parent-dashboard-data"],
  {
    tags: [
      CACHE_TAGS.DASHBOARD,
      CACHE_TAGS.PARENTS,
      CACHE_TAGS.STUDENTS,
      CACHE_TAGS.ATTENDANCE,
      CACHE_TAGS.ASSIGNMENTS,
      CACHE_TAGS.RESULTS,
      CACHE_TAGS.CALENDAR_EVENTS,
      CACHE_TAGS.ANNOUNCEMENTS,
    ],
    revalidate: 300, // 5 minutes
  }
);

// ---------------------------------------------------------------------------
// Request-level cache: auth + parent lookup (runs once per request, shared)
// ---------------------------------------------------------------------------
const getParentData = cache(async () => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { getRequiredSchoolId } = await import(
    "@/lib/utils/school-context-helper"
  );

  // Auth check + school resolution in parallel
  const [dbUser, schoolId] = await Promise.all([
    db.user.findUnique({ where: { id: session.user.id } }),
    getRequiredSchoolId(),
  ]);

  if (!dbUser || dbUser.role !== UserRole.PARENT) {
    redirect("/login");
  }

  const parent = await db.parent.findUnique({
    where: { userId: dbUser.id },
  });

  if (!parent) return null;

  const dashboardData = await getCachedDashboardData(parent.id, schoolId);

  return { dbUser, parent, schoolId, ...dashboardData };
});

// ---------------------------------------------------------------------------
// Section components — all consume the single cached getParentData() call
// ---------------------------------------------------------------------------

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

export async function AttendanceFeesSection() {
  const data = await getParentData();

  if (!data) return null;

  const { children, studentIds, attendanceRecords, feePayments } = data;

  const attendanceStats = studentIds.map((studentId) => {
    const studentAttendance = attendanceRecords.filter(
      (r) => r.studentId === studentId
    );
    const totalDays = studentAttendance.length;
    const presentDays = studentAttendance.filter(
      (r) => r.status === "PRESENT"
    ).length;
    const absentDays = studentAttendance.filter(
      (r) => r.status === "ABSENT"
    ).length;
    const lateDays = studentAttendance.filter(
      (r) => r.status === "LATE"
    ).length;

    return {
      studentId,
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      attendancePercentage:
        totalDays > 0 ? (presentDays / totalDays) * 100 : 0,
    };
  });

  return (
    <div className="lg:col-span-2 space-y-6">
      <AttendanceSummary attendanceStats={attendanceStats} children={children} />
      <FeePaymentSummary payments={feePayments} children={children} />
    </div>
  );
}

export async function MeetingsAnnouncementsSection() {
  const data = await getParentData();

  if (!data) return null;

  const { upcomingMeetings, recentAnnouncements } = data;

  return (
    <div className="space-y-6">
      <UpcomingMeetings meetings={upcomingMeetings} />
      <RecentAnnouncements announcements={recentAnnouncements} />
    </div>
  );
}

export async function QuickActionsSection() {
  return <QuickActionsPanel />;
}

export async function PerformanceSummarySection() {
  const data = await getParentData();

  if (!data) return null;

  const { children, attendanceRecords, pendingAssignments, examResults } = data;

  const childrenPerformance = children.map((child) => {
    // Latest exam result per child
    const latestExam = examResults.find((r) => r.studentId === child.id);

    // Attendance stats
    const childAttendance = attendanceRecords.filter(
      (r) => r.studentId === child.id
    );
    const presentDays = childAttendance.filter(
      (r) => r.status === "PRESENT"
    ).length;
    const attendancePercentage =
      childAttendance.length > 0
        ? (presentDays / childAttendance.length) * 100
        : 0;

    // Pending assignments count
    const childPendingAssignments = pendingAssignments.filter(
      (s) => s.studentId === child.id
    ).length;

    // Grade trend — use already-fetched examResults (no extra query)
    const childExamResults = examResults
      .filter((r) => r.studentId === child.id)
      .slice(0, 2);

    let gradeTrend: "up" | "down" | "stable" = "stable";
    if (childExamResults.length >= 2) {
      const latest = childExamResults[0];
      const previous = childExamResults[1];
      const latestPct = (latest.marks / latest.exam.totalMarks) * 100;
      const previousPct = (previous.marks / previous.exam.totalMarks) * 100;

      if (latestPct > previousPct + 5) gradeTrend = "up";
      else if (latestPct < previousPct - 5) gradeTrend = "down";
    }

    return {
      id: child.id,
      user: {
        firstName: child.user.firstName || "Unknown",
        lastName: child.user.lastName || "Student",
      },
      latestExamResult: latestExam
        ? { score: latestExam.marks, maxScore: latestExam.exam.totalMarks }
        : null,
      attendancePercentage,
      pendingAssignments: childPendingAssignments,
      gradeTrend,
    };
  });

  return <PerformanceSummaryCards children={childrenPerformance} />;
}

export async function CalendarWidgetSection() {
  const data = await getParentData();
  const events = data?.calendarEvents ?? [];

  return <CalendarWidget events={events} userRole="PARENT" />;
}

export async function RecentActivityFeedSection() {
  const data = await getParentData();

  if (!data) return null;

  const { children, recentAssignments, recentExamResults, recentAnnouncements, recentAbsences } =
    data;

  const activities = [
    ...recentAssignments.map((assignment) => {
      const childSubmission = assignment.submissions[0];
      const child = children.find((c) => c.id === childSubmission?.studentId);
      return {
        id: `assignment-${assignment.id}`,
        type: "assignment",
        description: `New assignment: ${assignment.title}`,
        timestamp: assignment.createdAt,
        childName: child
          ? `${formatFullName(child.user.firstName, child.user.lastName)}`
          : "Unknown",
      };
    }),
    ...recentExamResults.map((result) => {
      const child = children.find((c) => c.id === result.studentId);
      return {
        id: `exam-${result.exam.id}`,
        type: "exam",
        description: `Exam: ${result.exam.title}`,
        timestamp: result.createdAt,
        childName: child
          ? `${formatFullName(child.user.firstName, child.user.lastName)}`
          : "Unknown",
      };
    }),
    ...recentAnnouncements.map((announcement) => ({
      id: `announcement-${announcement.id}`,
      type: "announcement",
      description: announcement.title,
      timestamp: announcement.createdAt,
      childName: "All Children",
    })),
    ...recentAbsences.map((absence) => {
      const child = children.find((c) => c.id === absence.studentId);
      return {
        id: `absence-${absence.id}`,
        type: "alert",
        description: "Absent from school",
        timestamp: absence.date,
        childName: child
          ? `${formatFullName(child.user.firstName, child.user.lastName)}`
          : "Unknown",
      };
    }),
  ];

  return <RecentActivityFeed activities={activities} />;
}
