export const dynamic = 'force-dynamic';

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle, BarChart, ArrowUpRight,
  CalendarClock, FileText, CheckSquare, ClipboardList,
  FileQuestion, Badge as BadgeIcon, Settings, FileSpreadsheet, History,
  BookOpen, PenLine, LayoutList, Trophy, ChevronRight
} from "lucide-react";
import { getAssessmentOverview, getRecentAssessments, getAssessmentMetrics } from "@/lib/actions/assessmentActions";
import { getUpcomingExams } from "@/lib/actions/examsActions";
import { formatDate } from "@/lib/utils";

export default async function AssessmentPage() {
  const [overviewResult, upcomingExamsResult, recentAssessmentsResult, metricsResult] = await Promise.all([
    getAssessmentOverview(),
    getUpcomingExams(),
    getRecentAssessments(10),
    getAssessmentMetrics(),
  ]);

  const overview = (overviewResult.success ? overviewResult.data : null) ?? {
    examTypes: 0,
    exams: 0,
    assignments: 0,
    results: 0,
    reportCards: 0,
    questionBank: 0,
  };

  const upcomingExams = (upcomingExamsResult.success ? upcomingExamsResult.data : null) ?? [];
  const recentAssessments = (recentAssessmentsResult.success ? recentAssessmentsResult.data : null) ?? [];
  const metrics = (metricsResult.success ? metricsResult.data : null) ?? {
    totalExams: 0,
    totalAssignments: 0,
    passRate: 0,
    reportCards: 0,
  };

  const workflowSteps = [
    {
      step: 1,
      title: "Exam Setup",
      description: "Create exam types & schedule exams",
      icon: <BookOpen className="h-6 w-6 text-primary" />,
      href: "/admin/assessment/exams",
      stat: overview.exams,
      statLabel: overview.exams === 1 ? "exam" : "exams",
      color: "bg-primary/10 border-primary/20",
    },
    {
      step: 2,
      title: "Mark Components",
      description: "Configure theory / practical splits",
      icon: <Settings className="h-6 w-6 text-blue-600" />,
      href: "/admin/assessment/exams",
      stat: overview.examTypes,
      statLabel: "exam types",
      color: "bg-blue-50 border-blue-200",
    },
    {
      step: 3,
      title: "Marks Entry",
      description: "Enter bulk marks per class",
      icon: <PenLine className="h-6 w-6 text-teal-600" />,
      href: "/admin/assessment/marks-entry",
      stat: overview.results,
      statLabel: "results recorded",
      color: "bg-teal-50 border-teal-200",
    },
    {
      step: 4,
      title: "Results & Reports",
      description: "View, publish, and generate report cards",
      icon: <Trophy className="h-6 w-6 text-amber-600" />,
      href: "/admin/assessment/results",
      stat: overview.reportCards,
      statLabel: "published",
      color: "bg-amber-50 border-amber-200",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assessment Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage exams, assignments, and student performance
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Link href="/admin/assessment/exams/create" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> New Exam
            </Button>
          </Link>
          <Link href="/admin/assessment/assignments/create" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> New Assignment
            </Button>
          </Link>
        </div>
      </div>

      {/* 4-step workflow */}
      <div className="grid gap-0 grid-cols-1 md:grid-cols-4">
        {workflowSteps.map((step, index) => (
          <div key={step.step} className="flex items-stretch">
            <Link href={step.href} className="flex-1">
              <Card className={`h-full border-2 hover:shadow-md transition-shadow cursor-pointer ${step.color}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/70 text-sm font-bold text-muted-foreground border">
                        {step.step}
                      </div>
                      <div className="p-1.5 bg-white/70 rounded-md">
                        {step.icon}
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-base mb-0.5">{step.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{step.description}</p>
                  <p className="text-2xl font-bold">{step.stat}</p>
                  <p className="text-xs text-muted-foreground">{step.statLabel}</p>
                </CardContent>
              </Card>
            </Link>
            {index < workflowSteps.length - 1 && (
              <div className="hidden md:flex items-center px-1 text-muted-foreground">
                <ChevronRight className="h-5 w-5" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-4 mt-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Exams</CardDescription>
            <CardTitle className="text-3xl">{metrics.totalExams}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Scheduled assessments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Assignments</CardDescription>
            <CardTitle className="text-3xl">{metrics.totalAssignments}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Active assignments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pass Rate</CardDescription>
            <CardTitle className="text-3xl text-green-600">{metrics.passRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Overall performance
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Report Cards</CardDescription>
            <CardTitle className="text-3xl">{metrics.reportCards}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Published reports
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 mt-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Upcoming Exams</CardTitle>
            <CardDescription>
              Exams scheduled for the next 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingExams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-6 mb-4">
                  <CalendarClock className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No upcoming exams</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Schedule your first exam to get started.
                </p>
                <Link href="/admin/assessment/exams/create">
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Exam
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-accent border-b">
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Exam</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Date</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                          <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingExams.slice(0, 5).map((exam) => (
                          <tr key={exam.id} className="border-b hover:bg-accent/50">
                            <td className="py-3 px-4 align-middle">
                              <div className="font-medium">{exam.subject?.name || exam.title}</div>
                              <div className="text-xs text-muted-foreground">{exam.examType?.name}</div>
                            </td>
                            <td className="py-3 px-4 align-middle">
                              <div className="flex items-center gap-1.5">
                                <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{formatDate(exam.examDate)}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 align-middle">
                              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                                Upcoming
                              </Badge>
                            </td>
                            <td className="py-3 px-4 align-middle text-right">
                              <Link href={`/admin/assessment/exams/${exam.id}`}>
                                <Button variant="ghost" size="sm">View</Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex justify-center mt-4">
                  <Link href="/admin/assessment/exams">
                    <Button variant="outline" size="sm">View All Exams</Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recent Assessments</CardTitle>
            <CardDescription>
              Recently completed assessments and grades
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentAssessments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-6 mb-4">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No recent assessments</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Assessments will appear here once completed.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-accent border-b">
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Assessment</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Type</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Avg Score</th>
                          <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentAssessments.slice(0, 5).map((assessment) => (
                          <tr key={assessment.id} className="border-b hover:bg-accent/50">
                            <td className="py-3 px-4 align-middle">
                              <div className="font-medium">{assessment.title}</div>
                              <div className="text-xs text-muted-foreground">{assessment.subject.name}</div>
                            </td>
                            <td className="py-3 px-4 align-middle">
                              <Badge variant="outline" className="capitalize">
                                {assessment.type}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 align-middle">
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                {assessment.averageScore}%
                              </Badge>
                            </td>
                            <td className="py-3 px-4 align-middle text-right">
                              <Link href={`/admin/assessment/results?assessment=${assessment.id}`}>
                                <Button variant="ghost" size="sm">Results</Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex justify-center mt-4">
                  <Link href="/admin/assessment/results">
                    <Button variant="outline" size="sm">View All Results</Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
