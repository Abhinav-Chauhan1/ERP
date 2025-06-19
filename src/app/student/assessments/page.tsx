import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, GraduationCap, Pencil, ChartPie, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";

export const metadata: Metadata = {
  title: "Assessments | Student Portal",
  description: "View your exams, assignments, and academic evaluations",
};

export default async function AssessmentsPage() {
  // Use currentUser directly instead of getCurrentUserDetails which is causing the error
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

  const assessmentLinks = [
    {
      title: "Upcoming Exams",
      description: "View your scheduled exams and prepare ahead",
      icon: FileText,
      href: "/student/assessments/exams",
      count: upcomingExamsCount
    },
    {
      title: "Assignments",
      description: "Manage and submit your pending assignments",
      icon: Pencil,
      href: "/student/assessments/assignments",
      count: pendingAssignmentsCount
    },
    {
      title: "Exam Results",
      description: "Check your performance in past exams",
      icon: ChartPie,
      href: "/student/assessments/results",
      count: pastExamsCount
    },
    {
      title: "Report Cards",
      description: "Access your term and annual report cards",
      icon: GraduationCap,
      href: "/student/assessments/report-cards",
      count: reportCardsCount
    }
  ];

  return (
    <div className="container p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Assessments</h1>
        <p className="text-gray-500">
          View and manage your exams, assignments, and academic evaluations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assessmentLinks.map((item) => (
          <Card key={item.href}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <div className="bg-blue-50 p-2 rounded-lg mr-3">
                  <item.icon className="h-5 w-5 text-blue-600" />
                </div>
                {item.title}
                {item.count > 0 && (
                  <div className="ml-2 bg-blue-100 text-blue-800 text-xs rounded-full px-2 py-0.5">
                    {item.count}
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">{item.description}</p>
              <Button asChild className="w-full mt-2">
                <Link href={item.href}>
                  Access {item.title}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
