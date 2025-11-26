import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BarChart2, Calendar, CheckCircle2, TrendingDown, TrendingUp, XCircle } from "lucide-react";
import { getMyChildren } from "@/lib/actions/parent-children-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Compare Children | Parent Portal",
  description: "Compare performance metrics across your children",
};

export default async function CompareChildrenPage() {
  const { children } = await getMyChildren();

  if (children.length < 2) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/parent/children/overview">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Children
          </Link>
        </Button>

        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BarChart2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Not Enough Children</h2>
              <p className="text-muted-foreground">
                You need at least 2 children to use the comparison feature.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get detailed performance data for each child
  const childrenWithPerformance = await Promise.all(
    children.map(async (child) => {
      // Get latest exam results
      const examResults = await db.examResult.findMany({
        where: {
          studentId: child.id
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
        },
        take: 10
      });

      // Calculate average score
      const averageScore = examResults.length > 0
        ? examResults.reduce((sum, result) => sum + (result.marks / result.exam.totalMarks * 100), 0) / examResults.length
        : 0;

      // Get assignment completion rate
      const assignments = await db.assignment.findMany({
        where: {
          classes: {
            some: {
              classId: child.enrollments[0]?.classId
            }
          }
        },
        include: {
          submissions: {
            where: {
              studentId: child.id
            }
          }
        }
      });

      const completionRate = assignments.length > 0
        ? (assignments.filter(a => a.submissions.length > 0).length / assignments.length) * 100
        : 0;

      return {
        ...child,
        performance: {
          averageScore,
          examResults,
          completionRate,
          totalAssignments: assignments.length,
          completedAssignments: assignments.filter(a => a.submissions.length > 0).length
        }
      };
    })
  );

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/parent/children/overview">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Children
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart2 className="h-6 w-6 text-primary" />
          Compare Children
        </h1>
        <p className="text-muted-foreground mt-1">
          Side-by-side comparison of performance metrics
        </p>
      </div>

      {/* Children Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {childrenWithPerformance.map((child) => (
          <Card key={child.id}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={child.user.avatar || ""} alt={child.user.firstName} />
                  <AvatarFallback className="text-lg">
                    {child.user.firstName.charAt(0)}{child.user.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">
                    {child.user.firstName} {child.user.lastName}
                  </CardTitle>
                  <CardDescription>
                    {child.enrollments[0] ? (
                      `${child.enrollments[0].class.name} - ${child.enrollments[0].section.name}`
                    ) : (
                      "Not enrolled"
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Attendance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Attendance Comparison
          </CardTitle>
          <CardDescription>Last 30 days attendance rate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {childrenWithPerformance.map((child) => (
              <div key={child.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{child.user.firstName}</span>
                  <span className="text-2xl font-bold text-primary">
                    {child.attendance.percentage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={child.attendance.percentage} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    {child.attendance.presentDays} present
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-red-600" />
                    {child.attendance.totalDays - child.attendance.presentDays} absent
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Academic Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-primary" />
            Academic Performance
          </CardTitle>
          <CardDescription>Average exam scores and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {childrenWithPerformance.map((child) => (
              <div key={child.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{child.user.firstName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">
                      {child.performance.averageScore.toFixed(1)}%
                    </span>
                    {child.performance.averageScore >= 75 ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
                <Progress value={child.performance.averageScore} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{child.performance.examResults.length} exams taken</span>
                  <Badge variant={child.performance.averageScore >= 75 ? "default" : "secondary"}>
                    {child.performance.averageScore >= 90 ? "Excellent" :
                     child.performance.averageScore >= 75 ? "Good" :
                     child.performance.averageScore >= 60 ? "Average" : "Needs Improvement"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assignment Completion Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Assignment Completion
          </CardTitle>
          <CardDescription>Completed vs total assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {childrenWithPerformance.map((child) => (
              <div key={child.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{child.user.firstName}</span>
                  <span className="text-2xl font-bold text-primary">
                    {child.performance.completionRate.toFixed(0)}%
                  </span>
                </div>
                <Progress value={child.performance.completionRate} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {child.performance.completedAssignments} of {child.performance.totalAssignments} completed
                  </span>
                  <Badge variant={child.performance.completionRate >= 80 ? "default" : "secondary"}>
                    {child.performance.completionRate >= 80 ? "On Track" : "Behind"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subject-wise Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Subject-wise Performance</CardTitle>
          <CardDescription>Latest exam scores by subject</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Subject</th>
                  {childrenWithPerformance.map((child) => (
                    <th key={child.id} className="text-center py-3 px-4 font-medium">
                      {child.user.firstName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Get unique subjects across all children */}
                {Array.from(
                  new Set(
                    childrenWithPerformance.flatMap(child =>
                      child.performance.examResults.map(r => r.exam.subject.name)
                    )
                  )
                ).map((subject) => (
                  <tr key={subject} className="border-b">
                    <td className="py-3 px-4 font-medium">{subject}</td>
                    {childrenWithPerformance.map((child) => {
                      const subjectResult = child.performance.examResults.find(
                        r => r.exam.subject.name === subject
                      );
                      return (
                        <td key={child.id} className="text-center py-3 px-4">
                          {subjectResult ? (
                            <Badge variant={
                              (subjectResult.marks / subjectResult.exam.totalMarks * 100) >= 75
                                ? "default"
                                : "secondary"
                            }>
                              {((subjectResult.marks / subjectResult.exam.totalMarks) * 100).toFixed(0)}%
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">N/A</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
