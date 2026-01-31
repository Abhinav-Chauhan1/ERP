import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { getChildDetails } from "@/lib/actions/parent-children-actions";
import { AttendanceCalendarView } from "@/components/parent/children/attendance-calendar-view";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Child Attendance | Parent Portal",
  description: "View detailed attendance records for your child",
};

export default async function ChildAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const param = await params;
  const childId = param.id;
  
  const childDetails = await getChildDetails(childId);
  
  if (!childDetails || !childDetails.student) {
    notFound();
  }

  // Type assertion to help TypeScript understand the student includes user relation
  const studentWithUser = childDetails.student as typeof childDetails.student & {
    user: {
      firstName: string | null;
      lastName: string | null;
      avatar: string | null;
    };
  };

  // Get attendance records for the past 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const attendanceRecords = await db.studentAttendance.findMany({
    where: {
      studentId: childId,
      date: {
        gte: sixMonthsAgo
      }
    },
    orderBy: {
      date: 'desc'
    }
  });

  // Calculate statistics
  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(r => r.status === "PRESENT").length;
  const absentDays = attendanceRecords.filter(r => r.status === "ABSENT").length;
  const lateDays = attendanceRecords.filter(r => r.status === "LATE").length;
  const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  const statistics = {
    totalDays,
    presentDays,
    absentDays,
    lateDays,
    percentage
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/parent/children/${childId}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          Attendance - {studentWithUser.user.firstName || ''} {studentWithUser.user.lastName || ''}
        </h1>
        <p className="text-muted-foreground mt-1">
          Detailed attendance records and calendar visualization
        </p>
      </div>

      <AttendanceCalendarView
        attendanceRecords={attendanceRecords}
        statistics={statistics}
      />
    </div>
  );
}
