import { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  FileText, 
  BookOpen, 
  AlertTriangle, 
  Info 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getExamDetails } from "@/lib/actions/student-assessment-actions";

export const metadata: Metadata = {
  title: "Exam Details | Student Portal",
  description: "View detailed information about your exam",
};

export default async function ExamDetailsPage(
  props: { 
    params: Promise<{ id: string }> 
  }
) {
  const params = await props.params;
  // Fix the params issue by awaiting it first
  const resolvedParams = await Promise.resolve(params);
  const examDetails = await getExamDetails(resolvedParams.id);

  // Check if exam date is in the past
  const isPastExam = new Date(examDetails.examDate) < new Date();

  // Calculate time remaining until exam
  const examDate = new Date(examDetails.examDate);
  const currentDate = new Date();
  const diffTime = examDate.getTime() - currentDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  const timeRemaining = diffDays > 0 
    ? `${diffDays} days and ${diffHours} hours` 
    : diffHours > 0 
    ? `${diffHours} hours` 
    : "Less than an hour";

  return (
    <div className="container p-6">
      <div className="mb-6">
        <Link href="/student/assessments/exams">
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Exams
          </Button>
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{examDetails.title}</h1>
            <div className="flex items-center mt-1">
              <BookOpen className="h-4 w-4 text-gray-500 mr-1.5" />
              <span className="text-gray-600 mr-2">{examDetails.subject.name}</span>
              <Badge variant="outline">{examDetails.examType.name}</Badge>
            </div>
          </div>
          
          {!isPastExam && (
            <div className="flex items-center bg-blue-50 text-blue-800 px-4 py-2 rounded-md whitespace-nowrap">
              <Clock className="h-5 w-5 mr-2 text-blue-600" />
              <div className="text-sm">
                <div className="font-medium">Time remaining:</div>
                <div>{timeRemaining}</div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {isPastExam && !examDetails.result ? (
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Exam Completed</AlertTitle>
          <AlertDescription className="text-amber-700">
            This exam has already taken place. Results will be published soon.
          </AlertDescription>
        </Alert>
      ) : isPastExam && examDetails.result ? (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <Info className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Results Available</AlertTitle>
          <AlertDescription className="text-green-700">
            This exam has been completed and results are available.
            <Link href={`/student/assessments/results/${examDetails.id}`} className="ml-2 font-medium underline">
              View Results
            </Link>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Prepare for your exam</AlertTitle>
          <AlertDescription>
            Make sure to be on time and bring all necessary materials.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Exam Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-500">Date</div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-600 mr-1.5" />
                  <span>{format(new Date(examDetails.examDate), "MMMM d, yyyy")}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-500">Time</div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-600 mr-1.5" />
                  <span>
                    {format(new Date(examDetails.startTime), "h:mm a")} - {format(new Date(examDetails.endTime), "h:mm a")}
                  </span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-500">Total Marks</div>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-gray-600 mr-1.5" />
                  <span>{examDetails.totalMarks}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-500">Passing Marks</div>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-gray-600 mr-1.5" />
                  <span>{examDetails.passingMarks}</span>
                </div>
              </div>
            </div>
            
            {examDetails.instructions && (
              <div>
                <h3 className="text-base font-medium mb-2">Instructions</h3>
                <div className="p-4 bg-gray-50 rounded-md text-sm">
                  {examDetails.instructions}
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
              <h3 className="text-sm font-medium text-gray-500 mb-1">Exam Type</h3>
              <Badge className="ml-0" variant="secondary">{examDetails.examType.name}</Badge>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Subject</h3>
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 text-gray-600 mr-1.5" />
                <span>{examDetails.subject.name}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Code: {examDetails.subject.code}
              </div>
            </div>
            
            {examDetails.creator && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Examiner</h3>
                <div>{examDetails.creator.name}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
