import { Metadata } from "next";
import Link from "next/link";
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  FileText, 
  BarChart, 
  ChevronRight 
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
  getUpcomingExams,
  getExamResults,
  getAssignments,
  getReportCards
} from "@/lib/actions/student-assessment-actions";

export const metadata: Metadata = {
  title: "Assessments | Student Portal",
  description: "View and manage your exams, assignments, and results",
};

export default async function AssessmentsPage() {
  // Fetch data
  const upcomingExams = await getUpcomingExams();
  const examResults = await getExamResults();
  const assignments = await getAssignments();
  const reportCards = await getReportCards();
  
  // Get counts
  const pendingAssignmentsCount = assignments.pending.length;
  const overdueAssignmentsCount = assignments.overdue.length;
  const upcomingExamsCount = upcomingExams.length;
  const recentResultsCount = examResults.slice(0, 5).length;
  
  const assessmentAreas = [
    {
      title: "Upcoming Exams",
      description: "View your upcoming exam schedule",
      icon: Clock,
      href: "/student/assessments/exams",
      count: upcomingExamsCount,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Exam Results",
      description: "Check your past exam results and performance",
      icon: BarChart,
      href: "/student/assessments/results",
      count: recentResultsCount,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Assignments",
      description: "View and submit your pending assignments",
      icon: FileText,
      href: "/student/assessments/assignments",
      count: pendingAssignmentsCount + overdueAssignmentsCount,
      color: "bg-amber-50 text-amber-600",
    },
    {
      title: "Report Cards",
      description: "Access your term and year-end report cards",
      icon: BookOpen,
      href: "/student/assessments/report-cards",
      count: reportCards.length,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="container p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Assessments</h1>
        <p className="text-gray-500">
          View your exams, assignments, results, and report cards
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {assessmentAreas.map((area) => (
          <Card key={area.href}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className={`rounded-lg p-2 ${area.color}`}>
                  <area.icon className="h-6 w-6" />
                </div>
                {area.count > 0 && (
                  <Badge className="bg-blue-500 hover:bg-blue-500">
                    {area.count}
                  </Badge>
                )}
              </div>
              <CardTitle>{area.title}</CardTitle>
              <CardDescription>{area.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild>
                <Link href={area.href}>
                  Access {area.title}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Exams Preview */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Upcoming Exams</CardTitle>
              <Link href="/student/assessments/exams">
                <Button variant="ghost" size="sm" className="text-blue-600">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingExams.slice(0, 3).length > 0 ? (
              <div className="space-y-4">
                {upcomingExams.slice(0, 3).map((exam) => (
                  <div key={exam.id} className="flex justify-between items-center border p-3 rounded-md">
                    <div>
                      <h4 className="font-medium">{exam.title}</h4>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                        {exam.subject}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {format(new Date(exam.examDate), "MMM d, yyyy")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(exam.startTime), "h:mm a")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2">No upcoming exams</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Assignments Preview */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Pending Assignments</CardTitle>
              <Link href="/student/assessments/assignments">
                <Button variant="ghost" size="sm" className="text-blue-600">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {pendingAssignmentsCount > 0 ? (
              <div className="space-y-4">
                {assignments.pending.slice(0, 3).map((assignment: any) => (
                  <div key={assignment.id} className="flex justify-between items-center border p-3 rounded-md">
                    <div>
                      <h4 className="font-medium">{assignment.title}</h4>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                        {assignment.subject}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        Due: {format(new Date(assignment.dueDate), "MMM d, yyyy")}
                      </div>
                      <Badge variant="outline" className="text-xs h-5 mt-1">
                        {assignment.totalMarks} marks
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2">No pending assignments</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
