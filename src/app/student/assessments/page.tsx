import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, GraduationCap, Pencil, ChartPie, FileQuestion, ClipboardList } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
// Note: Replace currentUser() calls with auth() and access session.user
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Assessments | Student Portal",
  description: "View your exams, assignments, and academic evaluations",
};

export default async function AssessmentsPage() {
  // Use currentUser directly instead of getCurrentUserDetails which is causing the error
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get user from database
  const dbUser = await db.user.findUnique({
    where: {
      id: session.user.id
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
        orderBy: {
          enrollDate: 'desc'
        },
        take: 1,
        include: {
          class: true
        }
      }
    }
  });

  if (!student) {
    redirect("/student");
  }

  // Get current class ID
  const currentClassId = student.enrollments[0]?.class.id;

  // Get all subject IDs for the current class
  const subjectClasses = await db.subjectClass.findMany({
    where: {
      classId: currentClassId
    },
    select: {
      subjectId: true
    }
  });

  const subjectIds = subjectClasses.map(sc => sc.subjectId);

  // Get assessment counts
  const upcomingExamsCount = await db.exam.count({
    where: {
      subjectId: {
        in: subjectIds
      },
      examDate: {
        gte: new Date()
      }
    }
  });

  const pendingAssignmentsCount = await db.assignment.count({
    where: {
      subjectId: {
        in: subjectIds
      },
      dueDate: {
        gte: new Date()
      },
      submissions: {
        none: {
          studentId: student.id
        }
      }
    }
  });

  const pastExamsCount = await db.examResult.count({
    where: {
      studentId: student.id
    }
  });

  const reportCardsCount = await db.reportCard.count({
    where: {
      studentId: student.id,
      isPublished: true
    }
  });

  const assessmentStats = [
    {
      title: "Upcoming Exams",
      count: upcomingExamsCount,
      icon: FileQuestion,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      subtitle: upcomingExamsCount > 0 ? "Next exam soon" : "No upcoming exams"
    },
    {
      title: "Pending Assignments",
      count: pendingAssignmentsCount,
      icon: ClipboardList,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      subtitle: pendingAssignmentsCount > 0 ? `${pendingAssignmentsCount} due soon` : "All caught up"
    },
    {
      title: "Exam Results",
      count: pastExamsCount,
      icon: ChartPie,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      subtitle: "Published results"
    },
    {
      title: "Report Cards",
      count: reportCardsCount,
      icon: GraduationCap,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      subtitle: "Available reports"
    }
  ];

  const assessmentLinks = [
    {
      title: "Exams",
      description: "View upcoming exams",
      icon: FileQuestion,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      href: "/student/assessments/exams"
    },
    {
      title: "Assignments",
      description: "Manage assignments",
      icon: Pencil,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      href: "/student/assessments/assignments"
    },
    {
      title: "Results",
      description: "View exam results",
      icon: ChartPie,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      href: "/student/assessments/results"
    },
    {
      title: "Report Cards",
      description: "Access report cards",
      icon: GraduationCap,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      href: "/student/assessments/report-cards"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assessments</h1>
        <p className="text-muted-foreground mt-1">
          Exams, assignments, and results
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {assessmentStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className={`p-2 ${stat.iconBg} rounded-md ${stat.iconColor}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.count}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.subtitle}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {assessmentLinks.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 ${item.iconBg} rounded-lg ${item.iconColor}`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  View All {item.title}
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
