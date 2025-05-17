import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { AttendanceOverview } from "@/components/student/attendance-overview";
import { UpcomingAssessments } from "@/components/student/upcoming-assessments";
import { SubjectPerformance } from "@/components/student/subject-performance";
import { TimeTablePreview } from "@/components/student/timetable-preview";
import { RecentAnnouncements } from "@/components/student/recent-announcements";
import { StudentHeader } from "@/components/student/student-header";
import { DashboardStats } from "@/components/student/dashboard-stats";
import { 
  getStudentDashboardData, 
  getStudentSubjectPerformance, 
  getStudentTodaySchedule 
} from "@/lib/actions/student-actions";

export default async function StudentDashboard() {
  // Get current user directly from Clerk
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect("/login");
  }
  
  // Get user from database
  const dbUser = await db.user.findUnique({
    where: {
      clerkId: clerkUser.id
    }
  });
  
  if (!dbUser || dbUser.role !== UserRole.STUDENT) {
    redirect("/login");
  }
  
  // Fetch dashboard data
  const { 
    student,
    attendancePercentage,
    upcomingExams,
    pendingAssignments,
    recentAnnouncements 
  } = await getStudentDashboardData();

  if (!student) {
    redirect("/login");
  }

  // Fetch additional data
  const subjectPerformance = await getStudentSubjectPerformance(student.id);
  const todaySchedule = await getStudentTodaySchedule(student.id);
  
  const currentEnrollment = student.enrollments[0]; // Assuming the most recent enrollment
  
  return (
    <div className="h-full p-6 space-y-6">
      <StudentHeader student={student} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStats 
          attendancePercentage={attendancePercentage}
          upcomingExamsCount={upcomingExams.length}
          pendingAssignmentsCount={pendingAssignments.length}
          className={currentEnrollment?.class?.name || "N/A"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <UpcomingAssessments exams={upcomingExams} assignments={pendingAssignments} />
          <SubjectPerformance data={subjectPerformance} />
        </div>
        <div className="space-y-6">
          <AttendanceOverview attendancePercentage={attendancePercentage} />
          <TimeTablePreview schedule={todaySchedule} />
          <RecentAnnouncements announcements={recentAnnouncements} />
        </div>
      </div>
    </div>
  );
}
