"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAssignmentDetails, updateAssignmentGrades } from "@/lib/actions/teacherAssignmentsActions";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Chart } from "@/components/dashboard/chart";
import { 
  Calendar,
  ArrowLeft, 
  Download, 
  Edit, 
  Save, 
  FileText, 
  Search,
  Users, 
  BarChart,
  Clock,
  Check,
  Mail,
  Printer,
  AlertCircle,
  X,
  CheckCircle,
  XCircle,
  FileCheck,
  File,
  Link as LinkIcon,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

export default function AssignmentDetailPage(props: { params: Promise<{ id: string }> }) {
  const paramsPromise = use(props.params);
  const router = useRouter();
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [assignmentId, setAssignmentId] = useState<string>("");

  // Unwrap params
  useEffect(() => {
    paramsPromise.then(p => setAssignmentId(p.id));
  }, [paramsPromise]);

  useEffect(() => {
    if (!assignmentId) return;
    
    const fetchAssignment = async () => {
      try {
        const assignmentData = await getAssignmentDetails(assignmentId);
        setAssignment(assignmentData);
        setSubmissions(assignmentData.submissions);
      } catch (err: any) {
        console.error("Failed to fetch assignment:", err);
        setError(err.message || "Failed to load assignment data");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentId]);

  const handleGradeUpdate = (submissionId: string, field: string, value: any) => {
    setSubmissions(prev => 
      prev.map(submission => 
        submission.id === submissionId 
          ? { ...submission, [field]: value } 
          : submission
      )
    );
  };

  const saveGrades = async () => {
    setIsSaving(true);
    try {
      // Format the submissions for the API
      const gradesToUpdate = submissions
        .filter(s => s.status !== 'GRADED' || s.status === 'SUBMITTED')
        .map(s => ({
          submissionId: s.id,
          marks: parseFloat(s.marks) || 0,
          feedback: s.feedback || ''
        }));
      
      if (gradesToUpdate.length === 0) {
        toast.error("No changes to save");
        setIsSaving(false);
        return;
      }

      const response = await updateAssignmentGrades(assignmentId, gradesToUpdate);
      
      if (response.success) {
        toast.success("Grades saved successfully");
        setIsGrading(false);
        
        // Refresh assignment data to reflect the updated grades
        const assignmentData = await getAssignmentDetails(assignmentId);
        setAssignment(assignmentData);
        setSubmissions(assignmentData.submissions);
      } else {
        toast.error(response.error || "Failed to save grades");
      }
    } catch (err) {
      console.error("Failed to save grades:", err);
      toast.error("An error occurred while saving grades");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSubmissions = submissions.filter(submission => 
    submission.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Assignment</h2>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button onClick={() => router.push('/teacher/assessments/assignments')}>
          Return to Assignments
        </Button>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Assignment Not Found</h2>
        <p className="text-gray-500 mb-4">The assignment you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button onClick={() => router.push('/teacher/assessments/assignments')}>
          Return to Assignments
        </Button>
      </div>
    );
  }

  // Format date for display
  const dueDate = new Date(assignment.dueDate);
  const formattedDueDate = format(dueDate, "MMMM d, yyyy");
  const isPastDue = dueDate < new Date();

  // Prepare chart data for marks distribution
  const distributionData = Object.entries(assignment.statistics.marksDistribution || {}).map(([grade, count]) => ({
    grade,
    count,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/teacher/assessments/assignments')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{assignment.title}</h1>
          <div className="flex items-center gap-2 text-gray-500">
            <span>{assignment.subject}</span>
            <span>•</span>
            <span>{assignment.classes.map((cls: any) => cls.name).join(", ")}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export Results
          </Button>
          <Link href={`/teacher/assessments/assignments/${assignmentId}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" /> Edit Assignment
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{formattedDueDate}</span>
                {isPastDue ? (
                  <Badge className="ml-2 bg-blue-100 text-blue-800">Past Due</Badge>
                ) : (
                  <Badge className="ml-2 bg-green-100 text-green-800">Active</Badge>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Marks</h3>
              <div className="flex items-center gap-2 mt-1">
                <FileText className="h-4 w-4 text-gray-400" />
                <span>{assignment.totalMarks}</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Classes</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {assignment.classes.map((cls: any) => (
                  <Badge key={cls.id} variant="outline">
                    {cls.name}
                  </Badge>
                ))}
              </div>
            </div>
            
            {assignment.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1 text-sm whitespace-pre-wrap">{assignment.description}</p>
              </div>
            )}
            
            {assignment.instructions && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Instructions</h3>
                <p className="mt-1 text-sm whitespace-pre-wrap">{assignment.instructions}</p>
              </div>
            )}
            
            {assignment.attachments && assignment.attachments.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Attachments</h3>
                <div className="mt-2 space-y-2">
                  {assignment.attachments.map((attachment: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <File className="h-4 w-4 text-gray-400" />
                      <span className="text-sm flex-1 truncate">{attachment.name}</span>
                      <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Submission Summary</CardTitle>
            <CardDescription>Overview of student submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Submissions</p>
                <p className="text-2xl font-bold">{assignment.statistics.submittedCount}</p>
                <p className="text-xs text-gray-500">total submissions</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Graded</p>
                <p className="text-2xl font-bold">{assignment.statistics.gradedCount}</p>
                <p className="text-xs text-gray-500">
                  {assignment.statistics.submittedCount > 0 
                    ? `${Math.round((assignment.statistics.gradedCount / assignment.statistics.submittedCount) * 100)}% complete`
                    : "no submissions"}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Average Score</p>
                <p className="text-2xl font-bold">
                  {assignment.statistics.averageMarks.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">out of {assignment.totalMarks}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Late Submissions</p>
                <p className="text-2xl font-bold">{assignment.statistics.lateCount}</p>
                <p className="text-xs text-gray-500">past due date</p>
              </div>
            </div>
            
            {distributionData.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Marks Distribution</h3>
                <div className="h-48">
                  <Chart
                    title=""
                    data={distributionData}
                    type="bar"
                    xKey="grade"
                    yKey="count"
                    categories={["count"]}
                    colors={["#3b82f6"]}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Student Submissions</CardTitle>
            <CardDescription>
              {isGrading ? "Enter grades for each submission" : "View and manage student submissions"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {!isGrading && (
              <Button variant="outline" onClick={() => setIsGrading(true)} disabled={submissions.length === 0}>
                <Edit className="mr-2 h-4 w-4" /> Grade Submissions
              </Button>
            )}
            {isGrading && (
              <>
                <Button variant="outline" onClick={() => {
                  setIsGrading(false);
                  // Reset to original data
                  setSubmissions(assignment.submissions);
                }}>
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button onClick={saveGrades} disabled={isSaving}>
                  {isSaving ? "Saving..." : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save Grades
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <div className="relative w-[250px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search students..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-1 h-4 w-4" /> Export CSV
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="mr-1 h-4 w-4" /> Email Grades
              </Button>
            </div>
          </div>
          
          <div className="rounded-md border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                  {isGrading && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feedback</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  {!isGrading && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubmissions.length > 0 ? (
                  filteredSubmissions.map((submission) => (
                    <tr key={submission.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{submission.studentName}</div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {submission.submissionDate ? (
                          <div>
                            <div className="text-sm">{format(new Date(submission.submissionDate), "MMM d, yyyy")}</div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(submission.submissionDate), "h:mm a")}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">Not submitted</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {isGrading && submission.submissionDate ? (
                          <Input
                            type="number"
                            min="0"
                            max={assignment.totalMarks}
                            value={submission.marks || ""}
                            onChange={(e) => handleGradeUpdate(submission.id, 'marks', e.target.value)}
                            className="w-20 mx-auto text-center"
                          />
                        ) : (
                          <div className="font-medium">
                            {submission.status === 'GRADED' ? 
                              `${submission.marks || 0}/${assignment.totalMarks}` : 
                              '-'
                            }
                          </div>
                        )}
                      </td>
                      
                      {isGrading && (
                        <td className="px-6 py-4">
                          {submission.submissionDate ? (
                            <Textarea
                              value={submission.feedback || ""}
                              onChange={(e) => handleGradeUpdate(submission.id, 'feedback', e.target.value)}
                              placeholder="Provide feedback"
                              className="min-h-[80px]"
                            />
                          ) : (
                            <span className="text-gray-500">Student has not submitted</span>
                          )}
                        </td>
                      )}
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          className={
                            submission.status === 'GRADED' ? "bg-green-100 text-green-800" :
                            submission.status === 'LATE' ? "bg-amber-100 text-amber-800" :
                            submission.status === 'SUBMITTED' ? "bg-blue-100 text-blue-800" :
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          {submission.status === 'GRADED' ? "Graded" :
                           submission.status === 'LATE' ? "Late" :
                           submission.status === 'SUBMITTED' ? "Submitted" :
                           "Pending"}
                        </Badge>
                      </td>
                      
                      {!isGrading && (
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {submission.submissionDate && (
                            <Button variant="link" className="h-auto p-0">
                              View Submission
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isGrading ? 5 : 5} className="px-6 py-10 text-center text-gray-500">
                      No submissions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
