import { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, BarChart2, BookOpen, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getExamDetails } from "@/lib/actions/student-assessment-actions";
import { getPerformanceColor } from "@/lib/utils/grade-calculator";

export const metadata: Metadata = {
  title: "Exam Result Details | Student Portal",
  description: "View detailed information about your exam result",
};

export default async function ExamResultPage(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const params = await props.params;
  // Fix the params issue by awaiting it first
  const resolvedParams = await Promise.resolve(params);
  const examDetails = await getExamDetails(resolvedParams.id);

  // Check if the result exists
  if (!examDetails.result) {
    return (
      <div className="container p-6">
        <Link href="/student/assessments/results">
          <Button variant="outline" size="sm" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Results
          </Button>
        </Link>

        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium">No Result Available</h3>
          <p className="mt-1 text-gray-500">
            The result for this exam has not been published yet
          </p>
        </div>
      </div>
    );
  }

  // Calculate percentage
  const percentage = Math.round((examDetails.result.marks / examDetails.totalMarks) * 100);
  const isPassing = examDetails.result.marks >= examDetails.passingMarks;

  return (
    <div className="container p-6">
      <Link href="/student/assessments/results">
        <Button variant="outline" size="sm" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Results
        </Button>
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{examDetails.title}</h1>
        <div className="flex items-center mt-1">
          <BookOpen className="h-4 w-4 text-gray-500 mr-1.5" />
          <span className="text-gray-600 mr-2">{examDetails.subject.name}</span>
          <Badge variant="outline">{examDetails.examType.name}</Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Result Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center p-4 rounded-lg bg-gray-50">
              <div>
                <div className="text-sm font-medium text-gray-500">Your Score</div>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold">{examDetails.result.marks}</div>
                  <div className="text-gray-500">out of {examDetails.totalMarks}</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500">Percentage</div>
                <div className="flex items-center gap-2">
                  <div
                    className="text-3xl font-bold"
                    style={{ color: getPerformanceColor(percentage) }}
                  >
                    {percentage}%
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500">Result</div>
                <div className="mt-1">
                  {isPassing ? (
                    <Badge className="bg-green-100 text-green-800 text-base">PASS</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-base">FAIL</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-500">Exam Date</div>
                <div>{format(new Date(examDetails.examDate), "MMMM d, yyyy")}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-500">Passing Marks</div>
                <div>{examDetails.passingMarks} ({Math.round((examDetails.passingMarks / examDetails.totalMarks) * 100)}%)</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-500">Grade</div>
                <div className="font-medium">{examDetails.result.grade || "-"}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-500">Status</div>
                <div>{examDetails.result.isAbsent ? "Absent" : isPassing ? "Passed" : "Failed"}</div>
              </div>
            </div>

            {examDetails.result.remarks && (
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Remarks</div>
                <div className="p-3 bg-gray-50 rounded-md">
                  {examDetails.result.remarks}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exam Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">Subject</div>
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 text-gray-600 mr-1.5" />
                <span>{examDetails.subject.name}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Code: {examDetails.subject.code}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">Exam Type</div>
              <Badge variant="secondary">{examDetails.examType.name}</Badge>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">Timing</div>
              <div className="text-sm">
                {format(new Date(examDetails.startTime), "h:mm a")} - {format(new Date(examDetails.endTime), "h:mm a")}
              </div>
            </div>

            {examDetails.creator && (
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Examiner</div>
                <div>{examDetails.creator.name}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
