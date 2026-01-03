"use client";


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AttendanceOverview } from "@/components/student/attendance-overview";
import { UpcomingAssessments } from "@/components/student/upcoming-assessments";
import { SubjectPerformance } from "@/components/student/subject-performance";
import { TimeTablePreview } from "@/components/student/timetable-preview";
import { RecentAnnouncements } from "@/components/student/recent-announcements";
import { DashboardStats } from "@/components/student/dashboard-stats";
import { StudentCalendarWidgetSection } from "@/components/student/calendar-widget-section";
import { 
  getStudentDashboardData, 
  getStudentSubjectPerformance, 
  getStudentTodaySchedule 
} from "@/lib/actions/student-actions";

export default function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardData = await getStudentDashboardData();
        
        if (!dashboardData.student) {
          router.push("/login");
          return;
        }

        const [subjectPerformance, todaySchedule] = await Promise.all([
          getStudentSubjectPerformance(dashboardData.student.id),
          getStudentTodaySchedule(dashboardData.student.id)
        ]);

        setData({
          ...dashboardData,
          subjectPerformance,
          todaySchedule
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const { student, attendancePercentage, upcomingExams, pendingAssignments, recentAnnouncements, subjectPerformance, todaySchedule } = data;
  const currentEnrollment = student.enrollments[0];
  
  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {student.user.firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your studies today
        </p>
      </div>
      
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStats 
          attendancePercentage={attendancePercentage}
          upcomingExamsCount={upcomingExams.length}
          pendingAssignmentsCount={pendingAssignments.length}
          className={currentEnrollment?.class?.name || "N/A"}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <UpcomingAssessments exams={upcomingExams} assignments={pendingAssignments} />
          <SubjectPerformance data={subjectPerformance} />
        </div>
        <div className="space-y-6">
          <AttendanceOverview attendancePercentage={attendancePercentage} />
          <TimeTablePreview schedule={todaySchedule} />
          <StudentCalendarWidgetSection />
          <RecentAnnouncements announcements={recentAnnouncements} />
        </div>
      </div>
    </div>
  );
}

