import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Award, BookOpen, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata = {
  title: "Academic Progress | Parent Portal",
  description: "Track your children's academic progress and performance",
};

interface PageProps {
  searchParams: Promise<{
    childId?: string;
  }>;
}

export default async function ChildrenProgressPage({ searchParams: searchParamsPromise }: PageProps) {
  const searchParams = await searchParamsPromise;
  let childId = searchParams.childId;

  // Get current user
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect("/login");
  }
  
  const dbUser = await db.user.findUnique({
    where: { clerkId: clerkUser.id }
  });
  
  if (!dbUser || dbUser.role !== UserRole.PARENT) {
    redirect("/login");
  }
  
  const parent = await db.parent.findUnique({
    where: { userId: dbUser.id }
  });
  
  if (!parent) {
    redirect("/login");
  }
  
  // Get all children
  const parentChildren = await db.studentParent.findMany({
    where: { parentId: parent.id },
    include: {
      student: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
            }
          },
          enrollments: {
            where: { status: "ACTIVE" },
            orderBy: { enrollDate: 'desc' },
            take: 1,
            include: {
              class: true,
              section: true
            }
          }
        }
      }
    }
  });
  
  const children = parentChildren.map(pc => ({
    id: pc.student.id,
    name: `${pc.student.user.firstName} ${pc.student.user.lastName}`,
    firstName: pc.student.user.firstName,
    lastName: pc.student.user.lastName,
    avatar: pc.student.user.avatar,
    class: pc.student.enrollments[0]?.class.name || "N/A",
    section: pc.student.enrollments[0]?.section.name || "N/A",
    isPrimary: pc.isPrimary
  }));
  
  if (children.length === 0) {
    return (
      <div className="container max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Academic Progress</h1>
        <p className="text-gray-700">No children found in your account.</p>
      </div>
    );
  }
  
  // If no childId, redirect with first child
  if (!childId) {
    redirect(`/parent/children/progress?childId=${children[0].id}`);
  }
  
  const selectedChild = children.find(c => c.id === childId) || children[0];
  
  // Fetch academic data for selected child
  const examResults = await db.examResult.findMany({
    where: {
      studentId: selectedChild.id
    },
    include: {
      exam: {
        include: {
          subject: true,
          examType: true,
          term: true
        }
      }
    },
    orderBy: {
      exam: {
        examDate: 'desc'
      }
    },
    take: 20
  });
  
  // Calculate subject-wise performance
  const subjectPerformance = examResults.reduce((acc: any, result) => {
    const subjectId = result.exam.subject.id;
    if (!acc[subjectId]) {
      acc[subjectId] = {
        subject: result.exam.subject,
        totalMarks: 0,
        obtainedMarks: 0,
        exams: 0
      };
    }
    acc[subjectId].totalMarks += result.exam.totalMarks;
    acc[subjectId].obtainedMarks += result.marks;
    acc[subjectId].exams += 1;
    return acc;
  }, {});
  
  const subjects = Object.values(subjectPerformance).map((perf: any) => ({
    ...perf.subject,
    percentage: (perf.obtainedMarks / perf.totalMarks) * 100,
    examsCount: perf.exams
  }));
  
  // Calculate overall performance
  const totalObtained = examResults.reduce((sum, r) => sum + r.marks, 0);
  const totalMax = examResults.reduce((sum, r) => sum + r.exam.totalMarks, 0);
  const overallPercentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  
  return (
    <div className="container max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/parent/children/overview">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Academic Progress</h1>
            <p className="text-muted-foreground">
              Track performance and achievements
            </p>
          </div>
        </div>
      </div>
      
      {/* Child Selector */}
      {children.length > 1 && (
        <div className="mb-6 flex gap-2">
          {children.map(child => (
            <Button
              key={child.id}
              variant={child.id === childId ? "default" : "outline"}
              asChild
            >
              <Link href={`/parent/children/progress?childId=${child.id}`}>
                {child.firstName}
              </Link>
            </Button>
          ))}
        </div>
      )}
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-3xl font-bold">
                  {overallPercentage.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {examResults.length} exams
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-3xl font-bold">{subjects.length}</div>
                <p className="text-xs text-muted-foreground">Enrolled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Best Subject
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-lg font-bold truncate">
                  {subjects.length > 0 
                    ? subjects.sort((a: any, b: any) => b.percentage - a.percentage)[0].name
                    : "N/A"
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {subjects.length > 0 
                    ? `${subjects.sort((a: any, b: any) => b.percentage - a.percentage)[0].percentage.toFixed(1)}%`
                    : ""
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Needs Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Target className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <div className="text-lg font-bold truncate">
                  {subjects.length > 0 
                    ? subjects.sort((a: any, b: any) => a.percentage - b.percentage)[0].name
                    : "N/A"
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {subjects.length > 0 
                    ? `${subjects.sort((a: any, b: any) => a.percentage - b.percentage)[0].percentage.toFixed(1)}%`
                    : ""
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Subject Performance */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Subject-wise Performance</CardTitle>
          <CardDescription>Performance breakdown by subject</CardDescription>
        </CardHeader>
        <CardContent>
          {subjects.length > 0 ? (
            <div className="space-y-6">
              {subjects.map((subject: any) => (
                <div key={subject.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{subject.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {subject.examsCount} exam{subject.examsCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {subject.percentage.toFixed(1)}%
                      </p>
                      <Badge variant={
                        subject.percentage >= 90 ? "default" :
                        subject.percentage >= 75 ? "secondary" :
                        subject.percentage >= 60 ? "outline" : "destructive"
                      }>
                        {subject.percentage >= 90 ? "Excellent" :
                         subject.percentage >= 75 ? "Good" :
                         subject.percentage >= 60 ? "Average" : "Needs Improvement"}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={subject.percentage} className="h-2" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No exam results available yet
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* Recent Exams */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Exam Results</CardTitle>
          <CardDescription>Latest performance in assessments</CardDescription>
        </CardHeader>
        <CardContent>
          {examResults.length > 0 ? (
            <div className="space-y-3">
              {examResults.slice(0, 10).map((result) => {
                const percentage = (result.marks / result.exam.totalMarks) * 100;
                return (
                  <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{result.exam.subject.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {result.exam.title} • {result.exam.examType.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">
                        {result.marks}/{result.exam.totalMarks}
                      </p>
                      <p className={`text-sm font-medium ${
                        percentage >= 90 ? "text-green-600" :
                        percentage >= 75 ? "text-blue-600" :
                        percentage >= 60 ? "text-amber-600" : "text-red-600"
                      }`}>
                        {percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No exam results available yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
