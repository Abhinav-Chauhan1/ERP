import Link from "next/link";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Chart } from "@/components/dashboard/chart";
import { 
  FileText, ClipboardCheck, GraduationCap, TrendingUp, 
  Clock, CheckCircle, AlertCircle, XCircle, Calendar
} from "lucide-react";
import { getTeacherAssignments } from "@/lib/actions/teacherAssignmentsActions";
import { getTeacherExams } from "@/lib/actions/teacherExamsActions";
import { getTeacherResults } from "@/lib/actions/teacherResultsActions";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = 'force-dynamic';

export default async function AssessmentsOverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assessments Overview</h1>
          <p className="text-muted-foreground">Summary of your assessment activities and grading responsibilities</p>
        </div>
      </div>

      <Suspense fallback={<StatsSkeletons />}>
        <AssessmentStats />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<CardSkeleton />}>
          <AssignmentsOverview />
        </Suspense>

        <Suspense fallback={<CardSkeleton />}>
          <ExamsOverview />
        </Suspense>
      </div>

      <Suspense fallback={<CardSkeleton />}>
        <GradingWorkloadOverview />
      </Suspense>

      <Suspense fallback={<CardSkeleton />}>
        <PerformanceAnalyticsOverview />
      </Suspense>

      <QuickNavigationSection />
    </div>
  );
}

/**
 * Assessment statistics section
 */
async function AssessmentStats() {
  const { assignments } = await getTeacherAssignments();
  const { exams } = await getTeacherExams();
  const { exams: examResults, assignments: assignmentResults } = await getTeacherResults();

  // Calculate statistics
  const totalAssignments = assignments.length;
  const activeAssignments = assignments.filter(a => a.status === "active").length;
  const totalExams = exams.length;
  const upcomingExams = exams.filter(e => e.status === "upcoming").length;
  
  // Calculate pending grading
  const pendingAssignmentGrading = assignments.reduce((sum, a) => sum + a.pendingCount, 0);
  const pendingExamGrading = exams.filter(e => e.status === "completed" && !e.submittedBy).length;
  const totalPendingGrading = pendingAssignmentGrading + pendingExamGrading;
  
  // Calculate average scores
  const assignmentAvgScores = assignments
    .filter(a => a.gradedCount > 0)
    .map(a => parseFloat(a.avgScore));
  const overallAssignmentAvg = assignmentAvgScores.length > 0
    ? (assignmentAvgScores.reduce((sum, score) => sum + score, 0) / assignmentAvgScores.length).toFixed(1)
    : "0.0";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Assignments"
        value={totalAssignments.toString()}
        icon={<FileText className="h-5 w-5" />}
        description={`${activeAssignments} active`}
      />
      <StatsCard
        title="Total Exams"
        value={totalExams.toString()}
        icon={<GraduationCap className="h-5 w-5" />}
        description={`${upcomingExams} upcoming`}
      />
      <StatsCard
        title="Pending Grading"
        value={totalPendingGrading.toString()}
        icon={<Clock className="h-5 w-5" />}
        description="Submissions to grade"
      />
      <StatsCard
        title="Avg Assignment Score"
        value={`${overallAssignmentAvg}%`}
        icon={<TrendingUp className="h-5 w-5" />}
        description="Across all assignments"
      />
    </div>
  );
}

/**
 * Assignments overview section
 */
async function AssignmentsOverview() {
  const { assignments } = await getTeacherAssignments();

  // Sort by due date (most recent first)
  const sortedAssignments = [...assignments].sort((a, b) => 
    new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Recent Assignments</CardTitle>
            <CardDescription>{assignments.length} assignments created</CardDescription>
          </div>
          <Link href="/teacher/assessments/assignments">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedAssignments.slice(0, 5).map((assignment) => {
            const isOverdue = new Date(assignment.dueDate) < new Date();
            const gradingProgress = assignment.submittedCount > 0 
              ? Math.round((assignment.gradedCount / assignment.submittedCount) * 100)
              : 0;

            return (
              <Link href={`/teacher/assessments/assignments/${assignment.id}`} key={assignment.id}>
                <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{assignment.title}</h4>
                      <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                    </div>
                    <Badge variant={isOverdue ? "destructive" : "default"}>
                      {assignment.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      <span>{assignment.submittedCount} submitted</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Grading Progress</span>
                      <span>{assignment.gradedCount}/{assignment.submittedCount}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all" 
                        style={{ width: `${gradingProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        {assignments.length === 0 && (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No assignments created yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Exams overview section
 */
async function ExamsOverview() {
  const { exams } = await getTeacherExams();

  // Sort by date (most recent first)
  const sortedExams = [...exams].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Recent Exams</CardTitle>
            <CardDescription>{exams.length} exams scheduled</CardDescription>
          </div>
          <Link href="/teacher/assessments/exams">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedExams.slice(0, 5).map((exam) => {
            const statusIcon = 
              exam.status === "upcoming" ? <Clock className="h-4 w-4 text-warning" /> :
              exam.status === "completed" ? <CheckCircle className="h-4 w-4 text-primary" /> :
              <AlertCircle className="h-4 w-4 text-muted-foreground" />;

            return (
              <Link href={`/teacher/assessments/exams/${exam.id}`} key={exam.id}>
                <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{exam.title}</h4>
                      <p className="text-sm text-muted-foreground">{exam.subject} • {exam.examType}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {statusIcon}
                      <Badge variant={
                        exam.status === "upcoming" ? "secondary" :
                        exam.status === "completed" ? "default" : "outline"
                      }>
                        {exam.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(exam.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{exam.startTime} - {exam.endTime}</span>
                    </div>
                  </div>
                  {exam.status === "completed" && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Average Score:</span>
                        <span className="font-medium">{exam.avgScore}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
        {exams.length === 0 && (
          <div className="text-center py-8">
            <GraduationCap className="h-12 w-12 text-muted mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No exams scheduled yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Grading workload overview section
 */
async function GradingWorkloadOverview() {
  const { assignments } = await getTeacherAssignments();
  const { exams } = await getTeacherExams();

  // Calculate grading workload by subject
  const subjectWorkload = new Map<string, {
    subject: string;
    pendingAssignments: number;
    pendingExams: number;
    totalPending: number;
  }>();

  assignments.forEach(assignment => {
    const existing = subjectWorkload.get(assignment.subjectId) || {
      subject: assignment.subject,
      pendingAssignments: 0,
      pendingExams: 0,
      totalPending: 0,
    };
    existing.pendingAssignments += assignment.pendingCount;
    existing.totalPending += assignment.pendingCount;
    subjectWorkload.set(assignment.subjectId, existing);
  });

  exams.forEach(exam => {
    if (exam.status === "completed" && exam.submittedBy < exam.totalStudents) {
      const existing = subjectWorkload.get(exam.subjectId) || {
        subject: exam.subject,
        pendingAssignments: 0,
        pendingExams: 0,
        totalPending: 0,
      };
      const pending = exam.totalStudents - exam.submittedBy;
      existing.pendingExams += pending;
      existing.totalPending += pending;
      subjectWorkload.set(exam.subjectId, existing);
    }
  });

  const workloadData = Array.from(subjectWorkload.values())
    .sort((a, b) => b.totalPending - a.totalPending);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Grading Workload</CardTitle>
            <CardDescription>Pending grading tasks by subject</CardDescription>
          </div>
          <Link href="/teacher/assessments/results">
            <Button variant="outline" size="sm">
              View Results
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {workloadData.length > 0 ? (
          <div className="space-y-4">
            {workloadData.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium">{item.subject}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.totalPending} items pending
                    </p>
                  </div>
                  <Badge variant={item.totalPending > 20 ? "destructive" : item.totalPending > 10 ? "secondary" : "outline"}>
                    {item.totalPending > 20 ? "High" : item.totalPending > 10 ? "Medium" : "Low"} Priority
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Assignments:</span>
                    <span className="font-medium">{item.pendingAssignments}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Exams:</span>
                    <span className="font-medium">{item.pendingExams}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">All grading is up to date!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Performance analytics overview section
 */
async function PerformanceAnalyticsOverview() {
  const { exams: examResults, assignments: assignmentResults } = await getTeacherResults();

  // Calculate overall statistics
  const totalExamsGraded = examResults.filter(e => e.isGraded).length;
  const totalAssignmentsGraded = assignmentResults.filter(a => a.isFullyGraded).length;
  
  // Calculate average pass rates for exams
  const examPassRates = examResults
    .filter(e => e.isGraded && e.submittedCount > 0)
    .map(e => e.passPercentage);
  const avgExamPassRate = examPassRates.length > 0
    ? Math.round(examPassRates.reduce((sum, rate) => sum + rate, 0) / examPassRates.length)
    : 0;

  // Calculate average scores
  const examAvgScores = examResults
    .filter(e => e.isGraded)
    .map(e => parseFloat(e.avgMarks));
  const overallExamAvg = examAvgScores.length > 0
    ? (examAvgScores.reduce((sum, score) => sum + score, 0) / examAvgScores.length).toFixed(1)
    : "0.0";

  const assignmentAvgScores = assignmentResults
    .filter(a => a.isFullyGraded)
    .map(a => parseFloat(a.avgMarks));
  const overallAssignmentAvg = assignmentAvgScores.length > 0
    ? (assignmentAvgScores.reduce((sum, score) => sum + score, 0) / assignmentAvgScores.length).toFixed(1)
    : "0.0";

  // Prepare chart data for recent performance trends
  const recentExams = examResults
    .filter(e => e.isGraded)
    .sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime())
    .slice(0, 10)
    .reverse();

  const chartData = recentExams.map(exam => ({
    name: exam.title.substring(0, 15) + (exam.title.length > 15 ? '...' : ''),
    avgScore: parseFloat(exam.avgMarks),
    passRate: exam.passPercentage,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Performance Analytics</CardTitle>
            <CardDescription>Student performance trends across assessments</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">{totalExamsGraded}</p>
              <p className="text-xs text-muted-foreground">Exams Graded</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">{totalAssignmentsGraded}</p>
              <p className="text-xs text-muted-foreground">Assignments Graded</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">{avgExamPassRate}%</p>
              <p className="text-xs text-muted-foreground">Avg Pass Rate</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">{overallExamAvg}</p>
              <p className="text-xs text-muted-foreground">Avg Exam Score</p>
            </div>
          </div>

          {/* Performance Trend Chart */}
          {chartData.length > 0 ? (
            <div>
              <h3 className="font-medium mb-3">Recent Exam Performance Trends</h3>
              <Chart
                title=""
                data={chartData}
                type="area"
                xKey="name"
                yKey="avgScore"
                categories={["avgScore", "passRate"]}
                colors={["hsl(var(--primary))", "hsl(var(--chart-2))"]}
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No performance data available yet</p>
            </div>
          )}

          {/* Performance Indicators */}
          <div className="grid gap-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Exam Average</p>
                  <p className="text-sm text-muted-foreground">Across all graded exams</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{overallExamAvg}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Assignment Average</p>
                  <p className="text-sm text-muted-foreground">Across all graded assignments</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{overallAssignmentAvg}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Quick navigation section
 */
function QuickNavigationSection() {
  const navigationItems = [
    {
      title: "Assignments",
      description: "Create and manage assignments",
      href: "/teacher/assessments/assignments",
      icon: FileText,
      color: "bg-primary/10 text-primary"
    },
    {
      title: "Exams",
      description: "Schedule and manage exams",
      href: "/teacher/assessments/exams",
      icon: GraduationCap,
      color: "bg-accent/50 text-accent-foreground"
    },
    {
      title: "Results",
      description: "View and manage results",
      href: "/teacher/assessments/results",
      icon: ClipboardCheck,
      color: "bg-secondary text-secondary-foreground"
    },
    {
      title: "Question Bank",
      description: "Manage question repository",
      href: "/teacher/assessments/question-bank",
      icon: FileText,
      color: "bg-warning/10 text-warning"
    },
    {
      title: "Online Exams",
      description: "Create online assessments",
      href: "/teacher/assessments/online-exams",
      icon: GraduationCap,
      color: "bg-chart-3/10 text-chart-3"
    }
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Quick Navigation</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {navigationItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="flex flex-col items-center gap-3 p-4 rounded-lg border bg-background hover:border-primary hover:bg-primary/5 transition-colors text-center h-full">
              <div className={`p-3 rounded-full ${item.color}`}>
                <item.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium mb-1">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton loaders
 */
function StatsSkeletons() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-5 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
