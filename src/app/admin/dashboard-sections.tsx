import Link from "next/link";
import {
  Users, BookOpen, Calendar, CreditCard,
  GraduationCap, School, PenTool, UserCheck
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Chart } from "@/components/dashboard/chart";

import { CalendarWidget } from "@/components/calendar/calendar-widget";
import { ReceiptVerificationWidget } from "@/components/admin/receipt-verification-widget";
import {
  getDashboardStats,
  getStudentAttendanceData,
  getExamResultsData,
  getEnrollmentDistribution,
  getRecentActivities,
  getUpcomingEvents,
  getNotifications,
  getTotalStudents,
  getTotalTeachers,
  getPendingFeePayments,
  getTodaysAttendance,
  getUpcomingEventsCount,
  getRecentAnnouncementsCount,
} from "@/lib/actions/dashboardActions";
import { getAdminCalendarEvents } from "@/lib/actions/calendar-widget-actions";
import { getReceiptWidgetData } from "@/lib/actions/receiptWidgetActions";

/**
 * Primary stats section - fetches and displays key metrics
 */
export async function PrimaryStatsSection() {
  const [
    totalStudentsResult,
    totalTeachersResult,
    pendingFeePaymentsResult,
    todaysAttendanceResult,
  ] = await Promise.all([
    getTotalStudents(),
    getTotalTeachers(),
    getPendingFeePayments(),
    getTodaysAttendance(),
  ]);

  const totalStudents = (totalStudentsResult.success && totalStudentsResult.data) ? totalStudentsResult.data : 0;
  const totalTeachers = (totalTeachersResult.success && totalTeachersResult.data) ? totalTeachersResult.data : 0;
  const pendingFeePayments = (pendingFeePaymentsResult.success && pendingFeePaymentsResult.data)
    ? pendingFeePaymentsResult.data
    : { totalAmount: 0, count: 0 };
  const todaysAttendance = (todaysAttendanceResult.success && todaysAttendanceResult.data)
    ? todaysAttendanceResult.data
    : { studentAttendance: { percentage: 0, present: 0, total: 0 }, teacherAttendance: { percentage: 0, present: 0, total: 0 } };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Students"
        value={totalStudents.toLocaleString()}
        icon={<Users className="h-5 w-5" />}
        description="active students"
      />
      <StatsCard
        title="Total Teachers"
        value={totalTeachers.toLocaleString()}
        icon={<GraduationCap className="h-5 w-5" />}
        description="active teachers"
      />
      <StatsCard
        title="Pending Fee Payments"
        value={`₹${pendingFeePayments.totalAmount.toLocaleString()}`}
        icon={<CreditCard className="h-5 w-5" />}
        description={`${pendingFeePayments.count} pending payments`}
      />
      <StatsCard
        title="Today's Attendance"
        value={`${todaysAttendance.studentAttendance.percentage}%`}
        icon={<UserCheck className="h-5 w-5" />}
        description={`${todaysAttendance.studentAttendance.present}/${todaysAttendance.studentAttendance.total} students present`}
      />
    </div>
  );
}

/**
 * Secondary stats section - displays additional metrics
 */
export async function SecondaryStatsSection() {
  const [
    statsResult,
    upcomingEventsCountResult,
    recentAnnouncementsCountResult,
  ] = await Promise.all([
    getDashboardStats(),
    getUpcomingEventsCount(),
    getRecentAnnouncementsCount(),
  ]);

  const stats = (statsResult.success && statsResult.data) ? statsResult.data : {
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
  };
  const upcomingEventsCount = (upcomingEventsCountResult.success && upcomingEventsCountResult.data)
    ? upcomingEventsCountResult.data
    : 0;
  const recentAnnouncementsCount = (recentAnnouncementsCountResult.success && recentAnnouncementsCountResult.data)
    ? recentAnnouncementsCountResult.data
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Classes"
        value={stats.totalClasses.toLocaleString()}
        icon={<School className="h-5 w-5" />}
        description="total classes"
      />
      <StatsCard
        title="Subjects"
        value={stats.totalSubjects.toLocaleString()}
        icon={<BookOpen className="h-5 w-5" />}
        description="in curriculum"
      />
      <StatsCard
        title="Upcoming Events"
        value={upcomingEventsCount.toLocaleString()}
        icon={<Calendar className="h-5 w-5" />}
        description="in next 30 days"
      />
      <StatsCard
        title="Recent Announcements"
        value={recentAnnouncementsCount.toLocaleString()}
        icon={<PenTool className="h-5 w-5" />}
        description="in last 7 days"
      />
    </div>
  );
}

/**
 * Charts section - displays attendance and exam results charts
 */
export async function ChartsSection() {
  const [attendanceResult, examResultsResult] = await Promise.all([
    getStudentAttendanceData(),
    getExamResultsData(),
  ]);

  const studentAttendanceData = (attendanceResult.success && attendanceResult.data) ? attendanceResult.data : [];
  const examResultsData = (examResultsResult.success && examResultsResult.data) ? examResultsResult.data : [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Chart
        title="Student Attendance Rate"
        description="Monthly attendance percentage"
        data={studentAttendanceData}
        xKey="month"
        yKey="present"
        categories={["present"]}
        colors={["#2563eb"]}
        type="area"
      />
      <Chart
        title="Average Exam Results"
        description="By subject"
        data={examResultsData}
        xKey="subject"
        yKey="average"
        categories={["average"]}
        colors={["#16a34a"]}
        type="bar"
      />
    </div>
  );
}

/**
 * Activity and events section - displays enrollment, activities, calendar, and receipt verification
 */
export async function ActivitySection() {
  const [enrollmentResult, activitiesResult, calendarEventsResult, receiptWidgetResult] = await Promise.all([
    getEnrollmentDistribution(),
    getRecentActivities(),
    getAdminCalendarEvents(5),
    getReceiptWidgetData(),
  ]);

  const enrollmentDistributionData = (enrollmentResult.success && enrollmentResult.data) ? enrollmentResult.data : [];
  const recentActivities = (activitiesResult.success && activitiesResult.data) ? activitiesResult.data : [];
  const calendarEvents = (calendarEventsResult.success && calendarEventsResult.data) ? calendarEventsResult.data : [];
  const receiptWidgetData = (receiptWidgetResult.success && receiptWidgetResult.data)
    ? receiptWidgetResult.data
    : {
      pendingCount: 0,
      verifiedToday: 0,
      rejectedToday: 0,
      oldestPendingDays: 0,
      averageVerificationTime: 0,
      rejectionRate: 0,
      trend: "stable" as const,
    };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base font-medium">Enrollment Distribution</CardTitle>
          <CardDescription>Students per grade</CardDescription>
        </CardHeader>
        <CardContent>
          <Chart
            title=""
            data={enrollmentDistributionData}
            xKey="name"
            yKey="value"
            categories={["value"]}
            type="pie"
            colors={["#2563eb", "#16a34a", "#db2777", "#ea580c", "#8b5cf6", "#0ea5e9"]}
          />
        </CardContent>
      </Card>

      <ActivityFeed activities={recentActivities} className="lg:col-span-1" />

      <CalendarWidget events={calendarEvents} userRole="ADMIN" className="lg:col-span-1" />

      <ReceiptVerificationWidget
        pendingCount={receiptWidgetData.pendingCount}
        verifiedToday={receiptWidgetData.verifiedToday}
        rejectedToday={receiptWidgetData.rejectedToday}
        oldestPendingDays={receiptWidgetData.oldestPendingDays}
        averageVerificationTime={receiptWidgetData.averageVerificationTime}
        rejectionRate={receiptWidgetData.rejectionRate}
        trend={receiptWidgetData.trend}
        className="lg:col-span-1"
      />
    </div>
  );
}

/**
 * Quick actions and notifications section
 */
export async function QuickActionsSection() {
  const notificationsResult = await getNotifications();
  const notifications = (notificationsResult.success && notificationsResult.data) ? notificationsResult.data : [];

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-4">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <Link href="/admin/users/students/new" className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-xs text-center">Add Student</span>
          </Link>
          <Link href="/admin/users/teachers/new" className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-xs text-center">Add Teacher</span>
          </Link>
          <Link href="/admin/attendance" className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-xs text-center">Take Attendance</span>
          </Link>
          <Link href="/admin/finance/receipt-verification" className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <CreditCard className="h-5 w-5" />
            </div>
            <span className="text-xs text-center">Verify Receipts</span>
          </Link>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-medium">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notifications at this time.</p>
          ) : (
            notifications.map((notification, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`p-1.5 rounded-full ${notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-500' :
                  notification.type === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500' :
                    'bg-primary/10 text-primary'
                  }`}>
                  {notification.type === 'warning' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                      <path d="M12 9v4"></path>
                      <path d="M12 17h.01"></path>
                    </svg>
                  ) : notification.type === 'error' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 8v4l3 3"></path>
                    </svg>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-xs text-muted-foreground">{notification.message}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
