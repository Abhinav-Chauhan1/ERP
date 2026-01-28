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
    <div className="flex flex-col gap-10">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground mb-2">
            Hi, <span className="text-primary">{student.user.firstName}</span>! 👋
          </h1>
          <p className="text-muted-foreground font-medium text-lg max-w-2xl">
            You're doing great! Here's a quick look at your academic progress and today's agenda.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Session Active</span>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="dashboard-grid">
        <DashboardStats
          attendancePercentage={attendancePercentage}
          upcomingExamsCount={upcomingExams.length}
          pendingAssignmentsCount={pendingAssignments.length}
          className={currentEnrollment?.class?.name || "N/A"}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="premium-card">
            <UpcomingAssessments exams={upcomingExams} assignments={pendingAssignments} />
          </div>
          <div className="premium-card">
            <SubjectPerformance data={subjectPerformance} />
          </div>
        </div>
        <div className="space-y-10">
          <div className="glass-card border-none">
            <AttendanceOverview attendancePercentage={attendancePercentage} />
          </div>
          <div className="premium-card">
            <TimeTablePreview schedule={todaySchedule} />
          </div>
          <div className="glass-card border-none overflow-hidden">
            <StudentCalendarWidgetSection />
          </div>
          <div className="premium-card">
            <RecentAnnouncements announcements={recentAnnouncements} />
          </div>
        </div>
      </div>
    </div>
  );
}

