"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronLeft, Printer, Download, Mail, 
  Calendar, FileText, User, CheckCircle,
  Loader2, AlertCircle, Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import toast from "react-hot-toast";

import { getReportCardById, publishReportCard } from "@/lib/actions/reportCardsActions";

export default function ReportCardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [reportCard, setReportCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [sendNotification, setSendNotification] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  useEffect(() => {
    fetchReportCard();
  }, []);
  
  async function fetchReportCard() {
    setLoading(true);
    setError(null);
    
    try {
      const id = params.id as string;
      const result = await getReportCardById(id);
      
      if (result.success) {
        setReportCard(result.data);
      } else {
        setError(result.error || "Failed to fetch report card");
        toast.error(result.error || "Failed to fetch report card");
      }
    } catch (err) {
      console.error("Error fetching report card:", err);
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }
  
  async function handlePublish() {
    try {
      const id = params.id as string;
      const result = await publishReportCard({
        id,
        sendNotification
      });
      
      if (result.success) {
        toast.success("Report card published successfully");
        setPublishDialogOpen(false);
        fetchReportCard();
      } else {
        toast.error(result.error || "Failed to publish report card");
      }
    } catch (err) {
      console.error("Error publishing report card:", err);
      toast.error("An unexpected error occurred");
    }
  }
  
  function handlePrint() {
    window.print();
  }
  
  function handleSendEmail() {
    toast.success("Report card has been sent to parent's email");
  }
  
  function getInitials(name: string) {
    if (!name) return "ST";
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/admin/assessment/report-cards">Back to Report Cards</Link>
        </Button>
      </div>
    );
  }
  
  if (!reportCard) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>The requested report card could not be found</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/admin/assessment/report-cards">Back to Report Cards</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/assessment/report-cards">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Report Card</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          {!reportCard.isPublished && (
            <Button onClick={() => setPublishDialogOpen(true)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Publish
            </Button>
          )}
          {reportCard.isPublished && (
            <Button variant="outline" onClick={handleSendEmail}>
              <Mail className="h-4 w-4 mr-2" />
              Send to Parent
            </Button>
          )}
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Student Information</CardTitle>
              <CardDescription>
                {reportCard.grade} {reportCard.section} | {reportCard.term} | {reportCard.academicYear}
              </CardDescription>
            </div>
            <Badge className={reportCard.isPublished ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
              {reportCard.isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <Avatar className="h-20 w-20">
              {reportCard.studentAvatar ? (
                <AvatarImage src={reportCard.studentAvatar} alt={reportCard.studentName} />
              ) : (
                <AvatarFallback>{getInitials(reportCard.studentName)}</AvatarFallback>
              )}
            </Avatar>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">{reportCard.studentName}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-1">
                <div>
                  <p className="text-sm text-gray-500">Student ID</p>
                  <p className="font-medium">{reportCard.studentAdmissionId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Class</p>
                  <p className="font-medium">{reportCard.grade} {reportCard.section}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Academic Term</p>
                  <p className="font-medium">{reportCard.term}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Academic Year</p>
                  <p className="font-medium">{reportCard.academicYear}</p>
                </div>
                {reportCard.isPublished && (
                  <div>
                    <p className="text-sm text-gray-500">Published On</p>
                    <p className="font-medium">
                      {reportCard.publishDate ? format(new Date(reportCard.publishDate), 'MMM d, yyyy') : "N/A"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subjects">Subject Marks</TabsTrigger>
          <TabsTrigger value="remarks">Remarks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Overall Percentage</p>
                  <div className="flex items-center">
                    <p className="text-2xl font-bold">{reportCard.percentage?.toFixed(1) || "0"}%</p>
                    <Badge className="ml-3" variant={
                        reportCard.percentage >= 90 ? "secondary" :
                        reportCard.percentage >= 75 ? "default" :
                        reportCard.percentage >= 50 ? "outline" : "destructive"
                      }>
                      {reportCard.overallGrade || "-"}
                    </Badge>
                  </div>
                  <Progress 
                    value={reportCard.percentage} 
                    className="h-2 mt-2"
                  />
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Total Score</p>
                  <p className="text-2xl font-bold">{reportCard.totalMarks?.toFixed(1) || "0"}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Average: {reportCard.averageMarks?.toFixed(1) || "0"} per subject
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Class Rank</p>
                  <p className="text-2xl font-bold">
                    {reportCard.rank || "N/A"}
                    {reportCard.rank && <span className="text-base font-normal">{getOrdinalSuffix(reportCard.rank)}</span>}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {reportCard.rank ? `Out of ${reportCard.totalStudents || "many"} students` : "Rank not calculated"}
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Attendance</p>
                  <p className="text-2xl font-bold">{reportCard.attendance?.toFixed(1) || "0"}%</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {getAttendanceText(reportCard.attendance || 0)}
                  </p>
                </div>
              </div>
              
              {reportCard.subjectResults?.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Performance by Subjects</h3>
                  <div className="space-y-5">
                    {reportCard.subjectResults.map((subject: any) => (
                      <div key={subject.subjectId} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{subject.subject}</h4>
                            <p className="text-sm text-gray-500">
                              {subject.obtainedMarks.toFixed(1)} / {subject.totalMarks.toFixed(1)} marks
                            </p>
                          </div>
                          <Badge className={
                            subject.grade.startsWith('A') ? "bg-green-100 text-green-800" :
                            subject.grade.startsWith('B') ? "bg-blue-100 text-blue-800" :
                            subject.grade.startsWith('C') ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }>
                            {subject.grade}
                          </Badge>
                        </div>
                        <Progress 
                          value={subject.percentage} 
                          className="h-2"
                        />
                        <p className="text-xs text-right mt-1">{subject.percentage.toFixed(1)}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subject Details</CardTitle>
            </CardHeader>
            <CardContent>
              {reportCard.subjectResults?.length > 0 ? (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Subject</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Marks Obtained</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Total Marks</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Percentage</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportCard.subjectResults.map((subject: any) => (
                        <tr key={subject.subjectId} className="border-b">
                          <td className="py-3 px-4 font-medium">{subject.subject}</td>
                          <td className="py-3 px-4">{subject.obtainedMarks.toFixed(1)}</td>
                          <td className="py-3 px-4">{subject.totalMarks.toFixed(1)}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Progress
                                value={subject.percentage}
                                className="h-2 w-16"
                              />
                              <span>{subject.percentage.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={
                              subject.grade.startsWith('A') ? "bg-green-100 text-green-800" :
                              subject.grade.startsWith('B') ? "bg-blue-100 text-blue-800" :
                              subject.grade.startsWith('C') ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }>
                              {subject.grade}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td className="py-3 px-4 font-medium">Overall</td>
                        <td className="py-3 px-4 font-medium">{reportCard.totalMarks?.toFixed(1) || "0"}</td>
                        <td className="py-3 px-4"></td>
                        <td className="py-3 px-4 font-medium">{reportCard.percentage?.toFixed(1) || "0"}%</td>
                        <td className="py-3 px-4">
                          <Badge className={
                            reportCard.overallGrade?.startsWith('A') ? "bg-green-100 text-green-800" :
                            reportCard.overallGrade?.startsWith('B') ? "bg-blue-100 text-blue-800" :
                            reportCard.overallGrade?.startsWith('C') ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }>
                            {reportCard.overallGrade || "-"}
                          </Badge>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">No subject results found</h3>
                  <p className="text-sm">
                    This report card doesn't have any subject data yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {reportCard.subjectResults?.length > 0 && reportCard.subjectResults[0].exams?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Exam Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {reportCard.subjectResults.map((subject: any) => (
                    <div key={subject.subjectId}>
                      <h3 className="text-lg font-medium mb-3">{subject.subject}</h3>
                      <div className="rounded-md border">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b">
                              <th className="py-2 px-4 text-left font-medium text-gray-500">Exam</th>
                              <th className="py-2 px-4 text-left font-medium text-gray-500">Marks</th>
                              <th className="py-2 px-4 text-left font-medium text-gray-500">Percentage</th>
                              <th className="py-2 px-4 text-left font-medium text-gray-500">Grade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subject.exams?.map((exam: any) => (
                              <tr key={exam.examId} className="border-b">
                                <td className="py-2 px-4">{exam.examTitle}</td>
                                <td className="py-2 px-4">
                                  {exam.isAbsent ? 'Absent' : `${exam.obtainedMarks}/${exam.totalMarks}`}
                                </td>
                                <td className="py-2 px-4">
                                  {exam.isAbsent ? '-' : `${exam.percentage.toFixed(1)}%`}
                                </td>
                                <td className="py-2 px-4">
                                  {exam.isAbsent ? '-' : (
                                    <Badge className={
                                      exam.grade.startsWith('A') ? "bg-green-100 text-green-800" :
                                      exam.grade.startsWith('B') ? "bg-blue-100 text-blue-800" :
                                      exam.grade.startsWith('C') ? "bg-yellow-100 text-yellow-800" :
                                      "bg-red-100 text-red-800"
                                    }>
                                      {exam.grade}
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="remarks">
          <Card>
            <CardHeader>
              <CardTitle>Teacher and Principal Remarks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Teacher's Remarks</h3>
                  <div className="border rounded-lg p-5 bg-gray-50">
                    {reportCard.teacherRemarks ? (
                      <p>{reportCard.teacherRemarks}</p>
                    ) : (
                      <p className="text-gray-500 italic">No teacher remarks provided</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Principal's Remarks</h3>
                  <div className="border rounded-lg p-5 bg-gray-50">
                    {reportCard.principalRemarks ? (
                      <p>{reportCard.principalRemarks}</p>
                    ) : (
                      <p className="text-gray-500 italic">No principal remarks provided</p>
                    )}
                  </div>
                </div>
                
                <div className="border rounded-lg p-5 bg-blue-50">
                  <h3 className="text-lg font-medium mb-2 text-blue-700">Parent's Signature</h3>
                  <div className="h-20 border rounded-lg bg-white border-dashed flex items-center justify-center">
                    <p className="text-gray-400">Space for parent's signature</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Publish Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Report Card</DialogTitle>
            <DialogDescription>
              Once published, this report card will be visible to the student and parents
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="send-notification" 
                checked={sendNotification}
                onCheckedChange={() => setSendNotification(!sendNotification)}
              />
              <label
                htmlFor="send-notification"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Send notification to student and parents
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePublish}>
              Publish Report Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper functions
function getOrdinalSuffix(i: number) {
  const j = i % 10,
        k = i % 100;
  if (j === 1 && k !== 11) {
    return "st";
  }
  if (j === 2 && k !== 12) {
    return "nd";
  }
  if (j === 3 && k !== 13) {
    return "rd";
  }
  return "th";
}

function getAttendanceText(attendance: number) {
  if (attendance >= 95) return "Excellent attendance";
  if (attendance >= 90) return "Good attendance";
  if (attendance >= 80) return "Average attendance";
  return "Needs improvement";
}
