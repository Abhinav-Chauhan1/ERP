"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { 
  ArrowLeft,
  BarChart,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  UserCircle,
  XCircle,
  User,
  Building,
  AlertCircle,
  BookOpen,
  FileCheck,
  FileSpreadsheet,
  ClipboardCheck
} from "lucide-react";
import { Chart } from "@/components/dashboard/chart";
import { getStudentDetails } from "@/lib/actions/teacherStudentsActions";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

export default function StudentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const studentId = resolvedParams.id;
  
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch student details
  useEffect(() => {
    const fetchStudentDetails = async () => {
      setLoading(true);
      try {
        const data = await getStudentDetails(studentId);
        setStudent(data);
      } catch (error) {
        console.error("Failed to fetch student details:", error);
        toast.error("Failed to load student details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudentDetails();
  }, [studentId]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <UserCircle className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Student Not Found</h2>
        <p className="text-gray-500 mb-4">The requested student could not be found or you don't have permission to view them.</p>
        <Button onClick={() => router.push('/teacher/students')}>
          Go Back to Student List
        </Button>
      </div>
    );
  }
  
  // Prepare attendance chart data
  const attendanceChartData = [
    { name: "Present", value: student.attendanceStats.present },
    { name: "Absent", value: student.attendanceStats.absent },
    { name: "Late", value: student.attendanceStats.late },
    { name: "Leave", value: student.attendanceStats.leave },
  ];
  
  // Prepare subject performance data
  const subjectPerformanceData = student.subjectPerformance.map((subject: any) => ({
    subject: subject.name,
    exams: subject.percentage,
    assignments: subject.assignments.percentage
  }));
  
  // Determine overall performance level
  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: "Excellent", color: "text-green-600" };
    if (percentage >= 75) return { level: "Good", color: "text-blue-600" };
    if (percentage >= 60) return { level: "Average", color: "text-amber-600" };
    return { level: "Needs Improvement", color: "text-red-600" };
  };
  
  // Get attendance status badge
  const getAttendanceStatusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <Badge className="bg-green-100 text-green-800">Present</Badge>;
      case "ABSENT":
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>;
      case "LATE":
        return <Badge className="bg-amber-100 text-amber-800">Late</Badge>;
      case "LEAVE":
        return <Badge className="bg-blue-100 text-blue-800">Leave</Badge>;
      case "HALF_DAY":
        return <Badge className="bg-purple-100 text-purple-800">Half Day</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => router.push('/teacher/students')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{student.name}</h1>
          <p className="text-gray-500">
            {student.class} - {student.section} • Roll: {student.rollNumber}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/teacher/communication/messages/compose?to=${student.id}&type=student`}>
            <Button variant="outline">
              <MessageSquare className="mr-2 h-4 w-4" /> Send Message
            </Button>
          </Link>
          <Button>
            <FileText className="mr-2 h-4 w-4" /> Generate Report
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">
                {student.avatar ? (
                  <img 
                    src={student.avatar} 
                    alt={student.name} 
                    className="h-24 w-24 rounded-full"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    <UserCircle className="h-12 w-12" />
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold">{student.name}</h2>
              <p className="text-sm text-gray-500">{student.admissionId}</p>
              
              <div className="mt-4 w-full space-y-3">
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-gray-500">Class:</span>
                  <span className="font-medium">{student.class}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-gray-500">Section:</span>
                  <span className="font-medium">{student.section}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-gray-500">Roll Number:</span>
                  <span className="font-medium">{student.rollNumber}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-gray-500">Gender:</span>
                  <span className="font-medium capitalize">{student.gender.toLowerCase()}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-gray-500">Date of Birth:</span>
                  <span className="font-medium">{formatDate(student.dateOfBirth)}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-gray-500">Blood Group:</span>
                  <span className="font-medium">{student.bloodGroup}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{student.contactInfo.studentEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{student.contactInfo.studentPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <UserCircle className="h-4 w-4 text-gray-500" />
                  <span>{student.contactInfo.parentName} ({student.contactInfo.relation})</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{student.contactInfo.parentPhone}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="pb-0">
              <div className="flex justify-between items-center">
                <CardTitle>Student Performance</CardTitle>
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="attendance">Attendance</TabsTrigger>
                  <TabsTrigger value="academics">Academics</TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            
            <TabsContent value="overview" className="mt-0">
              <CardContent className="pt-6">
                <div className="grid gap-6 md:grid-cols-3 mb-6">
                  <div className="p-4 rounded-lg bg-gray-50 border">
                    <h3 className="text-sm text-gray-500 mb-1">Overall Performance</h3>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold">
                        {Math.round((
                          student.attendanceStats.percentage * 0.3 +
                          student.subjectPerformance.reduce((acc: number, subj: any) => acc + subj.percentage, 0) / 
                            Math.max(student.subjectPerformance.length, 1) * 0.7
                        ))}%
                      </div>
                      <div className={getPerformanceLevel(
                        Math.round((
                          student.attendanceStats.percentage * 0.3 +
                          student.subjectPerformance.reduce((acc: number, subj: any) => acc + subj.percentage, 0) / 
                            Math.max(student.subjectPerformance.length, 1) * 0.7
                        ))
                      ).color}>
                        ({getPerformanceLevel(
                          Math.round((
                            student.attendanceStats.percentage * 0.3 +
                            student.subjectPerformance.reduce((acc: number, subj: any) => acc + subj.percentage, 0) / 
                              Math.max(student.subjectPerformance.length, 1) * 0.7
                          ))
                        ).level})
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gray-50 border">
                    <h3 className="text-sm text-gray-500 mb-1">Attendance Rate</h3>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold">{student.attendanceStats.percentage}%</div>
                      <div className={`${
                        student.attendanceStats.percentage >= 90 
                          ? 'text-green-600' 
                          : student.attendanceStats.percentage >= 75 
                          ? 'text-amber-600' 
                          : 'text-red-600'
                      }`}>
                        ({student.attendanceStats.present}/{student.attendanceStats.total} days)
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gray-50 border">
                    <h3 className="text-sm text-gray-500 mb-1">Assignment Completion</h3>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold">
                        {Math.round(
                          student.assignments.filter((a: any) => 
                            a.status === "SUBMITTED" || a.status === "GRADED"
                          ).length / Math.max(student.assignments.length, 1) * 100
                        )}%
                      </div>
                      <div className="text-gray-600">
                        ({student.assignments.filter((a: any) => 
                          a.status === "SUBMITTED" || a.status === "GRADED"
                        ).length}/{student.assignments.length} completed)
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-base font-medium mb-3">Subject Performance</h3>
                  <div className="rounded-md border overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subject
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Exam Score
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Assignments
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Overall
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Grade
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {student.subjectPerformance.map((subject: any) => (
                          <tr key={subject.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <BookOpen className="h-4 w-4 text-gray-400 mr-2" />
                                <span className="font-medium">{subject.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex justify-center">
                                <Badge
                                  className={`${
                                    subject.percentage >= 90 ? 'bg-green-100 text-green-800' :
                                    subject.percentage >= 75 ? 'bg-blue-100 text-blue-800' :
                                    subject.percentage >= 60 ? 'bg-amber-100 text-amber-800' :
                                    'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {subject.percentage}%
                                </Badge>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex justify-center">
                                <Badge
                                  variant="outline"
                                  className={`${
                                    subject.assignments.percentage >= 90 ? 'border-green-500 text-green-800' :
                                    subject.assignments.percentage >= 75 ? 'border-blue-500 text-blue-800' :
                                    subject.assignments.percentage >= 60 ? 'border-amber-500 text-amber-800' :
                                    'border-red-500 text-red-800'
                                  }`}
                                >
                                  {subject.assignments.percentage}%
                                </Badge>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full ${
                                    Math.round(subject.percentage * 0.7 + subject.assignments.percentage * 0.3) >= 90 ? 'bg-green-500' :
                                    Math.round(subject.percentage * 0.7 + subject.assignments.percentage * 0.3) >= 75 ? 'bg-blue-500' :
                                    Math.round(subject.percentage * 0.7 + subject.assignments.percentage * 0.3) >= 60 ? 'bg-amber-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.round(subject.percentage * 0.7 + subject.assignments.percentage * 0.3)}%` }}
                                ></div>
                              </div>
                              <div className="text-xs mt-1">
                                {Math.round(subject.percentage * 0.7 + subject.assignments.percentage * 0.3)}%
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="font-medium">
                                {Math.round(subject.percentage * 0.7 + subject.assignments.percentage * 0.3) >= 90 ? 'A' :
                                 Math.round(subject.percentage * 0.7 + subject.assignments.percentage * 0.3) >= 80 ? 'B' :
                                 Math.round(subject.percentage * 0.7 + subject.assignments.percentage * 0.3) >= 70 ? 'C' :
                                 Math.round(subject.percentage * 0.7 + subject.assignments.percentage * 0.3) >= 60 ? 'D' :
                                 'F'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="text-base font-medium mb-3">Recent Exams</h3>
                    <div className="space-y-3">
                      {student.exams.slice(0, 3).map((exam: any) => (
                        <div key={exam.id} className="p-3 rounded-lg border">
                          <div className="flex justify-between mb-1">
                            <div className="font-medium">{exam.title}</div>
                            <Badge className={`${
                              exam.percentage >= 90 ? 'bg-green-100 text-green-800' :
                              exam.percentage >= 75 ? 'bg-blue-100 text-blue-800' :
                              exam.percentage >= 60 ? 'bg-amber-100 text-amber-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {exam.percentage}%
                            </Badge>
                          </div>
                          <div className="flex justify-between text-sm">
                            <div className="text-gray-500">{exam.subject}</div>
                            <div>{exam.obtainedMarks}/{exam.totalMarks} marks</div>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-end">
                        <Button variant="link" className="h-auto px-0 py-0">View All Exam Results</Button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-base font-medium mb-3">Recent Assignments</h3>
                    <div className="space-y-3">
                      {student.assignments.slice(0, 3).map((assignment: any) => (
                        <div key={assignment.id} className="p-3 rounded-lg border">
                          <div className="flex justify-between mb-1">
                            <div className="font-medium">{assignment.title}</div>
                            <Badge className={`${
                              assignment.status === "GRADED" ? 'bg-green-100 text-green-800' :
                              assignment.status === "SUBMITTED" ? 'bg-blue-100 text-blue-800' :
                              assignment.status === "PENDING" ? 'bg-amber-100 text-amber-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {assignment.status === "GRADED" ? "Graded" : 
                               assignment.status === "SUBMITTED" ? "Submitted" :
                               assignment.status === "PENDING" ? "Pending" : 
                               "Late"}
                            </Badge>
                          </div>
                          <div className="flex justify-between text-sm">
                            <div className="text-gray-500">{assignment.subject}</div>
                            <div>Due: {format(new Date(assignment.dueDate), "MMM d, yyyy")}</div>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-end">
                        <Button variant="link" className="h-auto px-0 py-0">View All Assignments</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </TabsContent>
            
            <TabsContent value="attendance" className="mt-0">
              <CardContent className="pt-6">
                <div className="grid gap-6 md:grid-cols-2 mb-6">
                  <div>
                    <h3 className="text-base font-medium mb-3">Attendance Overview</h3>
                    <div className="grid grid-cols-2 gap-4 text-center mb-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="text-xs text-gray-500">Present</h4>
                        <div className="font-bold text-2xl text-green-600">{student.attendanceStats.present}</div>
                        <div className="text-xs text-gray-500">days</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="text-xs text-gray-500">Absent</h4>
                        <div className="font-bold text-2xl text-red-600">{student.attendanceStats.absent}</div>
                        <div className="text-xs text-gray-500">days</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="text-xs text-gray-500">Late</h4>
                        <div className="font-bold text-2xl text-amber-600">{student.attendanceStats.late}</div>
                        <div className="text-xs text-gray-500">days</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="text-xs text-gray-500">Leave</h4>
                        <div className="font-bold text-2xl text-blue-600">{student.attendanceStats.leave}</div>
                        <div className="text-xs text-gray-500">days</div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Attendance Rate</span>
                        <span className="text-sm font-medium">{student.attendanceStats.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            student.attendanceStats.percentage >= 90 ? 'bg-green-500' :
                            student.attendanceStats.percentage >= 75 ? 'bg-amber-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${student.attendanceStats.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-base font-medium mb-3">Attendance Distribution</h3>
                    <div className="h-[220px]">
                      <Chart
                        title=""
                        data={attendanceChartData}
                        type="pie"
                        xKey="name"
                        yKey="value"
                        categories={["value"]}
                        colors={["#10b981", "#ef4444", "#f59e0b", "#3b82f6"]}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-base font-medium mb-3">Attendance Records</h3>
                  <div className="rounded-md border overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {student.attendanceRecords.slice(0, 10).map((record: any) => (
                          <tr key={record.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                <span>{format(new Date(record.date), "EEEE, MMMM d, yyyy")}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {record.class} {record.section}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {getAttendanceStatusBadge(record.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {record.reason !== "-" ? record.reason : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="flex justify-center mt-4">
                    <Link href={`/teacher/attendance/records?studentId=${student.id}`}>
                      <Button variant="outline">
                        <ClipboardCheck className="mr-2 h-4 w-4" /> View Complete Attendance Records
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </TabsContent>
            
            <TabsContent value="academics" className="mt-0">
              <CardContent className="pt-6">
                <Tabs defaultValue="examResults">
                  <TabsList className="mb-4">
                    <TabsTrigger value="examResults">Exam Results</TabsTrigger>
                    <TabsTrigger value="assignments">Assignments</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="examResults" className="mt-4">
                    <div className="rounded-md border overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {student.exams.map((exam: any) => (
                            <tr key={exam.id}>
                              <td className="px-6 py-4 whitespace-nowrap font-medium">{exam.title}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{exam.subject}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{format(new Date(exam.date), "MMM d, yyyy")}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">{exam.obtainedMarks}/{exam.totalMarks}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <Badge
                                  className={`${
                                    exam.percentage >= 90 ? 'bg-green-100 text-green-800' :
                                    exam.percentage >= 75 ? 'bg-blue-100 text-blue-800' :
                                    exam.percentage >= 60 ? 'bg-amber-100 text-amber-800' :
                                    'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {exam.percentage}%
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center font-medium">
                                {exam.grade}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">{exam.remarks}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="flex justify-center mt-4">
                      <Link href={`/teacher/assessments/results?studentId=${student.id}`}>
                        <Button variant="outline">
                          <FileText className="mr-2 h-4 w-4" /> View Complete Results
                        </Button>
                      </Link>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="assignments" className="mt-4">
                    <div className="rounded-md border overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission Date</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {student.assignments.map((assignment: any) => (
                            <tr key={assignment.id}>
                              <td className="px-6 py-4 whitespace-nowrap font-medium">{assignment.title}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{assignment.subject}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{format(new Date(assignment.dueDate), "MMM d, yyyy")}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {assignment.submissionDate ? 
                                  format(new Date(assignment.submissionDate), "MMM d, yyyy") : "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <Badge className={`${
                                  assignment.status === "GRADED" ? 'bg-green-100 text-green-800' :
                                  assignment.status === "SUBMITTED" ? 'bg-blue-100 text-blue-800' :
                                  assignment.status === "PENDING" ? 'bg-amber-100 text-amber-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {assignment.status === "GRADED" ? "Graded" : 
                                   assignment.status === "SUBMITTED" ? "Submitted" :
                                   assignment.status === "PENDING" ? "Pending" : 
                                   "Late"}
                                </Badge>
                                {assignment.isLate && (
                                  <Badge variant="outline" className="ml-1 border-red-300 text-red-700">Late</Badge>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                {assignment.status === "GRADED" ? 
                                  `${assignment.obtainedMarks}/${assignment.totalMarks}` : "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <Link href={`/teacher/assessments/assignments/${assignment.assignmentId}/submissions/${assignment.id}`}>
                                  <Button variant="link" className="h-auto p-0">
                                    {assignment.status === "GRADED" ? "View Submission" : "Grade"}
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="flex justify-center mt-4">
                      <Link href={`/teacher/assessments/assignments/student/${student.id}`}>
                        <Button variant="outline">
                          <FileCheck className="mr-2 h-4 w-4" /> View All Assignments
                        </Button>
                      </Link>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parent Information</CardTitle>
          <CardDescription>Contact details for student's parents/guardians</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">{student.contactInfo.parentName}</h3>
                <p className="text-sm text-gray-500">{student.contactInfo.relation}</p>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{student.contactInfo.parentEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{student.contactInfo.parentPhone}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Address & Emergency Contact</h3>
                <p className="text-sm text-gray-500 mt-1">{student.address}</p>
                <div className="mt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="font-medium">Emergency: {student.contactInfo.emergencyContact}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <div className="flex justify-between w-full">
            <Link href={`/teacher/communication/message/compose?to=${student.id}&type=student`}>
              <Button variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" /> Message Student
              </Button>
            </Link>
            <Link href={`/teacher/communication/message/compose?to=parent-${student.id}&type=parent`}>
              <Button>
                <MessageSquare className="mr-2 h-4 w-4" /> Contact Parent
              </Button>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
