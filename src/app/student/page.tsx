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
  
  const student = await db.student.findUnique({
    where: {
      userId: dbUser.id
    },
    include: {
      enrollments: {
        include: {
          class: true,
          section: true,
        }
      }
    }
  });

  if (!student) {
    redirect("/login");
  }

  // Fetch attendance data
  const currentDate = new Date();
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  const attendanceData = await db.studentAttendance.findMany({
    where: {
      studentId: student.id,
      date: {
        gte: startOfMonth
      }
    }
  });

  // Calculate attendance percentage
  const totalDays = attendanceData.length;
  const presentDays = attendanceData.filter(a => a.status === "PRESENT").length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  // Get upcoming exams
  const upcomingExams = await db.exam.findMany({
    where: {
      examDate: {
        gte: currentDate
      },
    },
    include: {
      subject: true,
      examType: true
    },
    take: 3,
    orderBy: {
      examDate: 'asc'
    }
  });

  // Get upcoming assignments
  const upcomingAssignments = await db.assignment.findMany({
    where: {
      dueDate: {
        gte: currentDate
      }
    },
    include: {
      subject: true
    },
    take: 3,
    orderBy: {
      dueDate: 'asc'
    }
  });

  // Get recent announcements
  const recentAnnouncements = await db.announcement.findMany({
    where: {
      isActive: true,
      OR: [
        { targetAudience: { has: "STUDENT" } },
        { targetAudience: { has: "ALL" } }
      ],
    },
    take: 3,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      publisher: {
        include: {
          user: true
        }
      }
    }
  });

  const currentEnrollment = student.enrollments[0]; // Assuming the most recent enrollment
  
  return (
    <div className="h-full p-6 space-y-6">
      <StudentHeader student={student} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStats 
          attendancePercentage={attendancePercentage}
          upcomingExamsCount={upcomingExams.length}
          pendingAssignmentsCount={upcomingAssignments.length}
          className={currentEnrollment?.class?.name || "N/A"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <UpcomingAssessments exams={upcomingExams} assignments={upcomingAssignments} />
          <SubjectPerformance studentId={student.id} />
        </div>
        <div className="space-y-6">
          <AttendanceOverview attendancePercentage={attendancePercentage} />
          <TimeTablePreview studentId={student.id} />
          <RecentAnnouncements announcements={recentAnnouncements} />
        </div>
      </div>
    </div>
  );
}
