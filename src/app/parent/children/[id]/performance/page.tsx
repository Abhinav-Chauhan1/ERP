import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BarChart2 } from "lucide-react";
import { getChildDetails } from "@/lib/actions/parent-children-actions";
import { Button } from "@/components/ui/button";
import { GradeTrendChart } from "@/components/parent/children/grade-trend-chart";
import { AttendanceTrendChart } from "@/components/parent/children/attendance-trend-chart";
import { AssignmentCompletionChart } from "@/components/parent/children/assignment-completion-chart";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Child Performance | Parent Portal",
  description: "View detailed performance analytics for your child",
};

export default async function ChildPerformancePage({
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

  // Get extended data for visualizations
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Get all exam results for the past 6 months
  const examResults = await db.examResult.findMany({
    where: {
      studentId: childId,
      createdAt: {
        gte: sixMonthsAgo
      }
    },
    include: {
      exam: {
        include: {
          subject: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Get attendance records for the past 6 months
  const attendanceRecords = await db.studentAttendance.findMany({
    where: {
      studentId: childId,
      date: {
        gte: sixMonthsAgo
      }
    },
    orderBy: {
      date: 'asc'
    }
  });

  // Get assignments
  const currentEnrollment = childDetails.currentEnrollment;
  const assignmentsData = currentEnrollment ? await db.assignment.findMany({
    where: {
      classes: {
        some: {
          classId: currentEnrollment.classId
        }
      }
    },
    include: {
      subject: true,
      submissions: {
        where: {
          studentId: childId
        }
      }
    },
    orderBy: {
      dueDate: 'desc'
    }
  }) : [];

  // Map assignments to match the expected type
  const assignments = assignmentsData.map(assignment => ({
    id: assignment.id,
    title: assignment.title,
    dueDate: assignment.dueDate,
    subject: {
      name: assignment.subject.name
    },
    submissions: assignment.submissions
      .filter(s => s.submissionDate !== null)
      .map(s => ({
        id: s.id,
        submittedAt: s.submissionDate!
      }))
  }));

  // Get unique subjects from exam results
  const subjects = Array.from(
    new Set(examResults.map(r => r.exam.subject.name))
  );

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
          <BarChart2 className="h-6 w-6 text-primary" />
          Performance Analytics - {childDetails.student.user.firstName} {childDetails.student.user.lastName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Detailed performance trends and visualizations
        </p>
      </div>

      {/* Overall Grade Trend */}
      <GradeTrendChart examResults={examResults} />

      {/* Subject-wise Grade Trends */}
      {subjects.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Subject-wise Performance</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {subjects.slice(0, 4).map((subject) => (
              <GradeTrendChart
                key={subject}
                examResults={examResults}
                subjectName={subject}
              />
            ))}
          </div>
        </div>
      )}

      {/* Attendance Trend */}
      <AttendanceTrendChart attendanceRecords={attendanceRecords} />

      {/* Assignment Completion */}
      <AssignmentCompletionChart assignments={assignments} />
    </div>
  );
}
