"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAssignmentResultDetails } from "@/lib/actions/teacherResultsActions";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Chart } from "@/components/dashboard/chart";
import { 
  ArrowLeft, 
  Download, 
  Search, 
  Calendar, 
  Clock, 
  FileText,
  CheckCircle2,
  XCircle,
  BarChart4,
  PenLine,
  Eye,
  Loader2,
  File,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

export default function AssignmentResultDetailPage(props: { params: Promise<{ id: string }> }) {
  const paramsPromise = use(props.params);
  const router = useRouter();
  const [assignmentData, setAssignmentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [assignmentId, setAssignmentId] = useState<string>("");

  // Unwrap params
  useEffect(() => {
    paramsPromise.then(p => setAssignmentId(p.id));
  }, [paramsPromise]);

  useEffect(() => {
    if (!assignmentId) return;
    
    const fetchAssignmentDetails = async () => {
      setLoading(true);
      try {
        const data = await getAssignmentResultDetails(assignmentId);
        setAssignmentData(data);
      } catch (error) {
        console.error("Failed to fetch assignment details:", error);
        toast.error("Failed to load assignment results");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssignmentDetails();
  }, [assignmentId]);

  const filteredSubmissions = assignmentData?.submissions.filter((submission: any) => 
    submission.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    submission.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
    submission.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Sort submissions by marks (highest to lowest)
  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    if (a.status !== "GRADED" && b.status === "GRADED") return 1;
    if (a.status === "GRADED" && b.status !== "GRADED") return -1;
    if (a.status === "GRADED" && b.status === "GRADED") return (b.marks || 0) - (a.marks || 0);
    return 0;
  });

  // Prepare data for charts
  const distributionData = assignmentData ? Object.entries(assignmentData.statistics.marksDistribution || {}).map(
    ([range, count]) => ({ range, count })
  ) : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!assignmentData) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Assignment Not Found</h2>
        <p className="text-gray-500 mb-4">The assignment you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button onClick={() => router.push('/teacher/assessments/results')}>
          Return to Results
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/teacher/assessments/results')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{assignmentData.title}</h1>
          <div className="flex items-center gap-2 text-gray-500">
            <span>{assignmentData.subject}</span>
            <span>•</span>
            <span>{assignmentData.classes}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export Results
          </Button>
          <Link href={`/teacher/assessments/assignments/${assignmentId}`}>
            <Button>
              <Eye className="mr-2 h-4 w-4" /> View Assignment
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Assigned Date</h3>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{format(new Date(assignmentData.assignedDate), "MMMM d, yyyy")}</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{format(new Date(assignmentData.dueDate), "MMMM d, yyyy")}</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Marks</h3>
              <div className="flex items-center gap-2 mt-1">
                <FileText className="h-4 w-4 text-gray-400" />
                <span>{assignmentData.totalMarks}</span>
              </div>
            </div>
            
            {assignmentData.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1 text-sm">{assignmentData.description}</p>
              </div>
            )}
            
            {assignmentData.attachments && assignmentData.attachments.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Attachments</h3>
                <div className="space-y-2 mt-2">
                  {assignmentData.attachments.map((attachment: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                      <File className="h-4 w-4 text-gray-400" />
                      <span className="flex-1 truncate">{attachment.name}</span>
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
            
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium mb-2">Submission Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Total Students</p>
                  <p className="text-xl font-bold">{assignmentData.statistics.totalSubmissions}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Submitted</p>
                  <p className="text-xl font-bold text-green-600">{assignmentData.statistics.submittedCount}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Pending</p>
                  <p className="text-xl font-bold text-amber-600">{assignmentData.statistics.pendingCount}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Late</p>
                  <p className="text-xl font-bold text-red-500">{assignmentData.statistics.lateCount}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Grading Progress</h3>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Graded Submissions</span>
                  <span className="text-sm font-medium">
                    {assignmentData.statistics.gradedCount}/{assignmentData.statistics.submittedCount}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ 
                      width: `${assignmentData.statistics.submittedCount > 0 
                        ? (assignmentData.statistics.gradedCount / assignmentData.statistics.submittedCount) * 100 
                        : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Marks Statistics</h3>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="p-2 bg-gray-50 rounded text-center">
                    <p className="text-xs text-gray-500">Average</p>
                    <p className="font-medium">{assignmentData.statistics.averageMarks.toFixed(1)}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-center">
                    <p className="text-xs text-gray-500">Highest</p>
                    <p className="font-medium">{assignmentData.statistics.highestMark}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-center">
                    <p className="text-xs text-gray-500">Lowest</p>
                    <p className="font-medium">{assignmentData.statistics.lowestMark}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Performance Analysis</CardTitle>
            <CardDescription>Marks distribution and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Chart
                title="Marks Distribution"
                data={distributionData}
                type="bar"
                xKey="range"
                yKey="count"
                categories={["count"]}
                colors={["#3b82f6"]}
              />
            </div>
            <div className="flex justify-center mt-2 gap-4 flex-wrap">
              {distributionData.map((item: any) => (
                <div key={item.range} className="flex items-center gap-1 text-sm">
                  <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                  <span>{item.range}: </span>
                  <span className="font-medium">{item.count} students</span>
                </div>
              ))}
            </div>
            
            <div className="mt-8">
              <h3 className="text-sm font-medium mb-4">Submission Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-center">
                  <div className="flex justify-center mb-2">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-sm font-medium text-green-700">Submitted On Time</p>
                  <p className="text-lg font-bold text-green-700">
                    {assignmentData.statistics.submittedCount - assignmentData.statistics.lateCount}
                  </p>
                </div>
                
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-center">
                  <div className="flex justify-center mb-2">
                    <Clock className="h-8 w-8 text-amber-500" />
                  </div>
                  <p className="text-sm font-medium text-amber-700">Late Submissions</p>
                  <p className="text-lg font-bold text-amber-700">{assignmentData.statistics.lateCount}</p>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-center">
                  <div className="flex justify-center mb-2">
                    <CheckCircle2 className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium text-blue-700">Graded</p>
                  <p className="text-lg font-bold text-blue-700">{assignmentData.statistics.gradedCount}</p>
                </div>
                
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-center">
                  <div className="flex justify-center mb-2">
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                  <p className="text-sm font-medium text-red-700">Not Submitted</p>
                  <p className="text-lg font-bold text-red-700">{assignmentData.statistics.pendingCount}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Student Submissions</CardTitle>
            <CardDescription>View and manage submission details</CardDescription>
          </div>
          <div className="flex gap-2">
            <Link href={`/teacher/assessments/assignments/${assignmentId}#grade`}>
              <Button>
                <PenLine className="mr-2 h-4 w-4" /> Grade Submissions
              </Button>
            </Link>
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
              <Badge variant="outline" className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                Total: {assignmentData.statistics.totalSubmissions}
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Graded: {assignmentData.statistics.gradedCount}
              </Badge>
            </div>
          </div>
          
          <div className="rounded-md border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission Date</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedSubmissions.length > 0 ? (
                  sortedSubmissions.map((submission: any) => (
                    <tr key={submission.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="font-medium">{submission.studentName}</div>
                            <div className="text-xs text-gray-500">#{submission.rollNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {submission.className}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {submission.submissionDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            <span>{format(new Date(submission.submissionDate), "MMM d, yyyy")}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not submitted</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className={`font-medium ${
                          submission.status !== "GRADED" ? "text-gray-400" :
                          submission.marks < assignmentData.totalMarks * 0.4 ? "text-red-600" :
                          submission.marks >= assignmentData.totalMarks * 0.8 ? "text-green-600" : ""
                        }`}>
                          {submission.status === "GRADED" ? 
                            `${submission.marks}/${assignmentData.totalMarks}` : 
                            "-"
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Badge className={
                          submission.status === "GRADED" ? "bg-green-100 text-green-800" :
                          submission.status === "SUBMITTED" ? "bg-blue-100 text-blue-800" :
                          submission.status === "LATE" ? "bg-amber-100 text-amber-800" :
                          "bg-gray-100 text-gray-800"
                        }>
                          {submission.status === "GRADED" ? "Graded" :
                           submission.status === "SUBMITTED" ? "Submitted" :
                           submission.status === "LATE" ? "Late" :
                           "Pending"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {submission.status !== "PENDING" && (
                          <Link href={`/teacher/assessments/assignments/${assignmentId}?submission=${submission.id}`}>
                            <Button variant="ghost" size="sm">View Submission</Button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No submissions found matching the search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button variant="outline">
            <BarChart4 className="mr-2 h-4 w-4" /> View Performance Analytics
          </Button>
          <Link href={`/teacher/assessments/assignments/${assignmentId}#grade`}>
            <Button>
              <PenLine className="mr-2 h-4 w-4" /> Grade Submissions
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
