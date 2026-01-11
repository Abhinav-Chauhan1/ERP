import { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  BookOpen, 
  Calendar, 
  CheckCircle, 
  Download, 
  FileText, 
  Upload, 
  User,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAssignmentDetails } from "@/lib/actions/student-assessment-actions";
import { AssignmentSubmissionForm } from "@/components/student/assignment-submission-form";

export const metadata: Metadata = {
  title: "Assignment Details | Student Portal",
  description: "View and submit your assignment",
};

export default async function AssignmentDetailsPage(
  props: { 
    params: Promise<{ id: string }> 
  }
) {
  const params = await props.params;
  // Fix the params issue by awaiting it first
  const resolvedParams = await Promise.resolve(params);
  const assignment = await getAssignmentDetails(resolvedParams.id);

  // Determine status and timing
  const currentDate = new Date();
  const dueDate = new Date(assignment.dueDate);
  const isOverdue = !assignment.isSubmitted && currentDate > dueDate;
  const timeRemaining = dueDate > currentDate 
    ? Math.ceil((dueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Parse assignment attachments
  const attachments = assignment.attachments || [];

  return (
    <div className="container p-6">
      <Link href="/student/assessments/assignments">
        <Button variant="outline" size="sm" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assignments
        </Button>
      </Link>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{assignment.title}</h1>
        <div className="flex items-center mt-1">
          <BookOpen className="h-4 w-4 text-gray-500 mr-1.5" />
          <span className="text-gray-600 mr-2">{assignment.subject.name}</span>
          <Badge variant="outline">{assignment.subject.code}</Badge>
        </div>
      </div>
      
      {assignment.isSubmitted ? (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Assignment Submitted!</AlertTitle>
          <AlertDescription className="text-green-700">
            {assignment.isGraded 
              ? `Your assignment has been graded. You scored ${assignment.submission.marks}/${assignment.totalMarks}.` 
              : "Your assignment has been submitted and is awaiting grading."}
          </AlertDescription>
        </Alert>
      ) : isOverdue ? (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <Clock className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Assignment Overdue!</AlertTitle>
          <AlertDescription className="text-red-700">
            This assignment was due on {format(dueDate, "MMMM d, yyyy")}. 
            You can still submit it but it will be marked as late.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="mb-6">
          <Calendar className="h-4 w-4" />
          <AlertTitle>Due Date Approaching</AlertTitle>
          <AlertDescription>
            This assignment is due on {format(dueDate, "MMMM d, yyyy")} 
            ({timeRemaining} {timeRemaining === 1 ? "day" : "days"} remaining).
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Tabs defaultValue={assignment.isSubmitted ? "details" : "submit"}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="details">Assignment Details</TabsTrigger>
              <TabsTrigger value="submit" disabled={assignment.isGraded}>
                {assignment.isSubmitted ? "Your Submission" : "Submit Assignment"}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Assignment Description</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {assignment.description && (
                    <div className="prose max-w-none">
                      <p>{assignment.description}</p>
                    </div>
                  )}
                  
                  {assignment.instructions && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Instructions</h3>
                      <div className="p-4 bg-gray-50 rounded-md">
                        {assignment.instructions}
                      </div>
                    </div>
                  )}
                  
                  {attachments.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Attachments</h3>
                      <div className="space-y-2">
                        {attachments.map((attachment: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                            <div className="flex items-center">
                              <FileText className="h-5 w-5 text-blue-600 mr-2" />
                              <span>{attachment.name}</span>
                            </div>
                            <Button size="sm" variant="outline" asChild>
                              <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="submit" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {assignment.isSubmitted ? "Your Submission" : "Submit Your Assignment"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {assignment.isSubmitted ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Submitted On</h3>
                        <p>{assignment.submission.submissionDate ? format(new Date(assignment.submission.submissionDate), "MMMM d, yyyy 'at' h:mm a") : "Date not available"}</p>
                      </div>
                      
                      {assignment.submission.content && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">Your Answer</h3>
                          <div className="p-4 bg-gray-50 rounded-md">
                            {assignment.submission.content}
                          </div>
                        </div>
                      )}
                      
                      {assignment.submission.attachments && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">Your Attachments</h3>
                          <div className="space-y-2">
                            {JSON.parse(assignment.submission.attachments).map((attachment: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                                <div className="flex items-center">
                                  <FileText className="h-5 w-5 text-blue-600 mr-2" />
                                  <span>{attachment.name}</span>
                                </div>
                                <Button size="sm" variant="outline" asChild>
                                  <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                  </a>
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {assignment.isGraded && (
                        <div>
                          <h3 className="text-lg font-medium mb-2">Feedback</h3>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-md">
                              <div className="text-sm font-medium">Your Score:</div>
                              <div className="text-xl font-bold">{assignment.submission.marks}/{assignment.totalMarks}</div>
                            </div>
                            
                            {assignment.submission.feedback && (
                              <div className="p-4 border rounded-md">
                                <div className="text-sm font-medium mb-2">Teacher's Comments:</div>
                                <p>{assignment.submission.feedback}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <AssignmentSubmissionForm 
                      assignmentId={assignment.id}
                      dueDate={assignment.dueDate}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Assignment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Due Date</div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-600 mr-1.5" />
                  <span>{format(dueDate, "MMMM d, yyyy 'at' h:mm a")}</span>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Subject</div>
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 text-gray-600 mr-1.5" />
                  <span>{assignment.subject.name}</span>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Total Marks</div>
                <div className="font-medium">{assignment.totalMarks}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Status</div>
                {assignment.isGraded ? (
                  <Badge className="bg-green-100 text-green-800">Graded</Badge>
                ) : assignment.isSubmitted ? (
                  <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>
                ) : isOverdue ? (
                  <Badge variant="destructive">Overdue</Badge>
                ) : (
                  <Badge variant="outline">Pending</Badge>
                )}
              </div>
              
              {assignment.teacher && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Assigned By</div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-600 mr-1.5" />
                    <span>{assignment.teacher.name}</span>
                  </div>
                </div>
              )}
              
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Assigned On</div>
                <div>{format(new Date(assignment.assignedDate), "MMMM d, yyyy")}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
