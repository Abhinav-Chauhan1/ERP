import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle, BarChart, ArrowUpRight, 
  CalendarClock, FileText, CheckSquare, ClipboardList,
  FileQuestion, Badge as BadgeIcon
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

  const assessmentCategories = [
    {
      title: "Exam Types",
      icon: <ClipboardList className="h-5 w-5 text-indigo-600" />,
      description: "Standardized exam formats",
      href: "/admin/assessment/exam-types",
      count: overview.examTypes
    },
    {
      title: "Exams",
      icon: <FileText className="h-5 w-5 text-primary" />,
      description: "Scheduled assessments",
      href: "/admin/assessment/exams",
      count: overview.exams
    },
    {
      title: "Assignments",
      icon: <CheckSquare className="h-5 w-5 text-green-600" />,
      description: "Homework and projects",
      href: "/admin/assessment/assignments",
      count: overview.assignments
    },
    {
      title: "Results",
      icon: <BarChart className="h-5 w-5 text-amber-600" />,
      description: "Grade management",
      href: "/admin/assessment/results",
      count: overview.results
    },
    {
      title: "Report Cards",
      icon: <BadgeIcon className="h-5 w-5 text-purple-600" />,
      description: "Student performance reports",
      href: "/admin/assessment/report-cards",
      count: overview.reportCards
    },
    {
      title: "Question Bank",
      icon: <FileQuestion className="h-5 w-5 text-red-600" />,
      description: "Question repository",
      href: "/admin/assessment/question-bank",
      count: overview.questionBank
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assessment Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage exams, assignments, and student performance
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/assessment/exams/create">
            <Button variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" /> New Exam
            </Button>
          </Link>
          <Link href="/admin/assessment/assignments/create">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> New Assignment
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {assessmentCategories.map((category) => (
          <Card key={category.title} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-accent rounded-md">
                  {category.icon}
                </div>
                <Badge variant="outline">{category.count}</Badge>
              </div>
              <CardTitle className="text-base mt-2">{category.title}</CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={category.href}>
                <Button variant="outline" size="sm" className="w-full">
                  Manage
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
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
