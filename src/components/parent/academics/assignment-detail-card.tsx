"use client";

import { format, isPast } from "date-fns";
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  FileText, 
  Download,
  AlertCircle,
  Award,
  MessageSquare,
  User,
  BookOpen
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface AssignmentDetailCardProps {
  assignment: {
    id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    subject: {
      id: string;
      name: string;
      code: string;
    };
    assignedDate: Date | string;
    dueDate: Date | string;
    totalMarks: number;
    attachments: string | null;
    creator?: {
      user: {
        firstName: string;
        lastName: string;
      };
    } | null;
  };
  submission?: {
    id: string;
    status: "PENDING" | "SUBMITTED" | "LATE" | "GRADED" | "RETURNED";
    submissionDate: Date | string | null;
    content: string | null;
    attachments: string | null;
    marks: number | null;
    feedback: string | null;
  } | null;
  studentName?: string;
}

export function AssignmentDetailCard({ 
  assignment, 
  submission,
  studentName 
}: AssignmentDetailCardProps) {
  const assignedDate = typeof assignment.assignedDate === "string" 
    ? new Date(assignment.assignedDate) 
    : assignment.assignedDate;
  
  const dueDate = typeof assignment.dueDate === "string" 
    ? new Date(assignment.dueDate) 
    : assignment.dueDate;

  const submissionDate = submission?.submissionDate 
    ? (typeof submission.submissionDate === "string" 
        ? new Date(submission.submissionDate) 
        : submission.submissionDate)
    : null;

  const isOverdue = !submission && isPast(dueDate);
  const isSubmitted = submission && ["SUBMITTED", "LATE", "GRADED", "RETURNED"].includes(submission.status);
  const isGraded = submission && (submission.status === "GRADED" || submission.status === "RETURNED");
  
  const percentage = isGraded && submission.marks !== null
    ? ((submission.marks / assignment.totalMarks) * 100).toFixed(1)
    : null;

  const teacherName = assignment.creator
    ? `${assignment.creator.user.firstName} ${assignment.creator.user.lastName}`
    : "Teacher";

  // Parse attachments (assuming comma-separated URLs)
  const assignmentAttachments = assignment.attachments 
    ? assignment.attachments.split(",").map(url => url.trim()).filter(Boolean)
    : [];
  
  const submissionAttachments = submission?.attachments
    ? submission.attachments.split(",").map(url => url.trim()).filter(Boolean)
    : [];

  const getStatusBadge = () => {
    if (!submission) {
      if (isOverdue) {
        return (
          <Badge variant="destructive" className="text-sm">
            <AlertCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
      }
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-sm">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }

    switch (submission.status) {
      case "GRADED":
      case "RETURNED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-sm">
            <CheckCircle className="h-3 w-3 mr-1" />
            Graded
          </Badge>
        );
      case "SUBMITTED":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-sm">
            <CheckCircle className="h-3 w-3 mr-1" />
            Submitted
          </Badge>
        );
      case "LATE":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-sm">
            <Clock className="h-3 w-3 mr-1" />
            Late Submission
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-sm">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const handleDownload = (url: string, filename: string) => {
    // Create a temporary anchor element to trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-start gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl mb-1">{assignment.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    {assignment.subject.name}
                  </Badge>
                  <span>•</span>
                  <span>{assignment.subject.code}</span>
                  {studentName && (
                    <>
                      <span>•</span>
                      <span>{studentName}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overdue Alert */}
        {isOverdue && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Assignment Overdue</AlertTitle>
            <AlertDescription>
              This assignment was due on {format(dueDate, "MMMM d, yyyy 'at' h:mm a")}. 
              Please submit as soon as possible.
            </AlertDescription>
          </Alert>
        )}

        {/* Assignment Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="h-5 w-5 text-gray-600 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 mb-1">Assigned Date</p>
              <p className="text-sm font-medium">{format(assignedDate, "MMM d, yyyy")}</p>
            </div>
          </div>

          <div className={cn(
            "flex items-start gap-3 p-3 rounded-lg",
            isOverdue ? "bg-red-50" : "bg-blue-50"
          )}>
            <Clock className={cn(
              "h-5 w-5 mt-0.5",
              isOverdue ? "text-red-600" : "text-blue-600"
            )} />
            <div>
              <p className={cn(
                "text-xs mb-1",
                isOverdue ? "text-red-600" : "text-blue-600"
              )}>Due Date</p>
              <p className={cn(
                "text-sm font-medium",
                isOverdue ? "text-red-700" : "text-blue-700"
              )}>
                {format(dueDate, "MMM d, yyyy")}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {format(dueDate, "h:mm a")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
            <Award className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <p className="text-xs text-purple-600 mb-1">Total Marks</p>
              <p className="text-sm font-medium text-purple-700">{assignment.totalMarks}</p>
            </div>
          </div>
        </div>

        {/* Teacher Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="h-4 w-4" />
          <span>Assigned by: <span className="font-medium">{teacherName}</span></span>
        </div>

        <Separator />

        {/* Assignment Description */}
        {assignment.description && (
          <div>
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Description
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {assignment.description}
            </p>
          </div>
        )}

        {/* Assignment Instructions */}
        {assignment.instructions && (
          <div>
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Instructions
            </h3>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {assignment.instructions}
              </p>
            </div>
          </div>
        )}

        {/* Assignment Attachments */}
        {assignmentAttachments.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Assignment Attachments
            </h3>
            <div className="space-y-2">
              {assignmentAttachments.map((url, index) => {
                const filename = url.split("/").pop() || `Attachment ${index + 1}`;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleDownload(url, filename)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {filename}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Submission Section */}
        {isSubmitted && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Submission Details
              </h3>

              {/* Submission Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-green-600 mb-1">Submitted On</p>
                    <p className="text-sm font-medium text-green-700">
                      {submissionDate ? format(submissionDate, "MMM d, yyyy") : "N/A"}
                    </p>
                    {submissionDate && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {format(submissionDate, "h:mm a")}
                      </p>
                    )}
                  </div>
                </div>

                {isGraded && submission.marks !== null && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <Award className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-blue-600 mb-1">Marks Obtained</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-blue-700">
                          {submission.marks}
                        </p>
                        <p className="text-sm text-gray-600">
                          / {assignment.totalMarks}
                        </p>
                      </div>
                      {percentage && (
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "mt-1",
                            Number(percentage) >= 75 ? "bg-green-50 text-green-700 border-green-200" :
                            Number(percentage) >= 50 ? "bg-blue-50 text-blue-700 border-blue-200" :
                            "bg-red-50 text-red-700 border-red-200"
                          )}
                        >
                          {percentage}%
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Submission Content */}
              {submission.content && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Submission Content</h4>
                  <div className="bg-gray-50 border rounded-lg p-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {submission.content}
                    </p>
                  </div>
                </div>
              )}

              {/* Submission Attachments */}
              {submissionAttachments.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Submitted Files
                  </h4>
                  <div className="space-y-2">
                    {submissionAttachments.map((url, index) => {
                      const filename = url.split("/").pop() || `Submission ${index + 1}`;
                      return (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => handleDownload(url, filename)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {filename}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Teacher Feedback */}
              {submission.feedback && (
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Teacher Feedback
                  </h4>
                  <Alert>
                    <MessageSquare className="h-4 w-4" />
                    <AlertTitle>Feedback from {teacherName}</AlertTitle>
                    <AlertDescription className="mt-2">
                      {submission.feedback}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </>
        )}

        {/* No Submission Message */}
        {!isSubmitted && !isOverdue && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Pending Submission</AlertTitle>
            <AlertDescription>
              This assignment has not been submitted yet. 
              Due date: {format(dueDate, "MMMM d, yyyy 'at' h:mm a")}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
