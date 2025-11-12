import { 
  Users, BookOpen, Calendar, CreditCard, 
  GraduationCap, School, PenTool, ClipboardCheck 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Chart } from "@/components/dashboard/chart";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import {
  getDashboardStats,
  getStudentAttendanceData,
  getExamResultsData,
  getEnrollmentDistribution,
  getRecentActivities,
  getUpcomingEvents,
  getNotifications,
} from "@/lib/actions/dashboardActions";

export default async function AdminDashboard() {
  // Fetch all data in parallel
  const [
    statsResult,
    attendanceResult,
    examResultsResult,
    enrollmentResult,
    activitiesResult,
    eventsResult,
    notificationsResult,
  ] = await Promise.all([
    getDashboardStats(),
    getStudentAttendanceData(),
    getExamResultsData(),
    getEnrollmentDistribution(),
    getRecentActivities(),
    getUpcomingEvents(),
    getNotifications(),
  ]);

  // Extract data with fallbacks
  const stats = (statsResult.success && statsResult.data) ? statsResult.data : {
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
  };

  const studentAttendanceData = (attendanceResult.success && attendanceResult.data) ? attendanceResult.data : [];
  const examResultsData = (examResultsResult.success && examResultsResult.data) ? examResultsResult.data : [];
  const enrollmentDistributionData = (enrollmentResult.success && enrollmentResult.data) ? enrollmentResult.data : [];
  const recentActivities = (activitiesResult.success && activitiesResult.data) ? activitiesResult.data : [];
  const upcomingEvents = (eventsResult.success && eventsResult.data) ? eventsResult.data : [];
  const notifications = (notificationsResult.success && notificationsResult.data) ? notificationsResult.data : [];
  return (
    <>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        
        {/* Stats row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Students"
            value={stats.totalStudents.toLocaleString()}
            icon={<Users className="h-5 w-5" />}
            description="active students"
          />
          <StatsCard
            title="Total Teachers"
            value={stats.totalTeachers.toLocaleString()}
            icon={<GraduationCap className="h-5 w-5" />}
            description="active teachers"
          />
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
        </div>

        {/* Charts row */}
        <div className="grid gap-4 md:grid-cols-2">
          <Chart
            title="Student Attendance Rate"
            description="Monthly attendance percentage"
            data={studentAttendanceData}
            xKey="month"
            yKey="present"
            categories={["present"]}
            colors={["#3b82f6"]}
            type="area"
          />
          <Chart
            title="Average Exam Results"
            description="By subject"
            data={examResultsData}
            xKey="subject"
            yKey="average"
            categories={["average"]}
            colors={["#10b981"]}
            type="bar"
          />
        </div>

        {/* Third row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base font-medium">Enrollment Distribution</CardTitle>
              <CardDescription>Students per grade</CardDescription>
            </CardHeader>
            <CardContent>
              <Chart
                title=""
                data={enrollmentDistributionData}
                xKey="grade"
                yKey="students"
                type="pie"
                colors={["#3b82f6", "#10b981", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6"]}
              />
            </CardContent>
          </Card>

          <ActivityFeed activities={recentActivities} className="lg:col-span-1" />

          <CalendarWidget events={upcomingEvents} className="lg:col-span-1" />
        </div>

        {/* Fourth row */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-xs text-center">Add Student</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                <div className="p-2 rounded-full bg-green-100 text-green-600">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <span className="text-xs text-center">Add Teacher</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <span className="text-xs text-center">Take Attendance</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                  <CreditCard className="h-5 w-5" />
                </div>
                <span className="text-xs text-center">Record Payment</span>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-medium">Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-500">No notifications at this time.</p>
              ) : (
                notifications.map((notification, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-full ${
                      notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                      notification.type === 'error' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
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
                      <p className="text-xs text-gray-600">{notification.message}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
