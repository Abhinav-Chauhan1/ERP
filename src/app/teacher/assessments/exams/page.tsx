"use client";

import { useState } from "react";
import Link from "next/link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Filter,
  PlusCircle,
  Search,
  FileText,
  AlertCircle,
  CheckCircle,
  ClipboardList,
  Download,
  Edit,
  Copy,
  Trash2,
  Eye
} from "lucide-react";
import { format } from "date-fns";

// Types
interface Exam {
  id: string;
  title: string;
  subject: string;
  grade: string;
  section: string;
  examType: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: string;
  totalMarks: number;
  status: "upcoming" | "completed" | "ongoing" | "cancelled";
  submittedBy?: number;
  totalStudents?: number;
  avgScore?: number;
}

// Mock data
const exams: Exam[] = [
  {
    id: "1",
    title: "Mid-term Examination",
    subject: "Mathematics",
    grade: "Grade 10",
    section: "A",
    examType: "Mid Term",
    date: new Date("2023-12-10"),
    startTime: "09:00 AM",
    endTime: "11:00 AM",
    duration: "2 hours",
    totalMarks: 50,
    status: "upcoming"
  },
  {
    id: "2",
    title: "Algebraic Expressions Quiz",
    subject: "Mathematics",
    grade: "Grade 10",
    section: "A",
    examType: "Quiz",
    date: new Date("2023-11-28"),
    startTime: "10:00 AM",
    endTime: "10:30 AM",
    duration: "30 minutes",
    totalMarks: 15,
    status: "completed",
    submittedBy: 30,
    totalStudents: 30,
    avgScore: 12.5
  },
  {
    id: "3",
    title: "Linear Equations Test",
    subject: "Mathematics",
    grade: "Grade 9",
    section: "C",
    examType: "Unit Test",
    date: new Date("2023-11-20"),
    startTime: "01:00 PM",
    endTime: "02:00 PM",
    duration: "1 hour",
    totalMarks: 30,
    status: "completed",
    submittedBy: 28,
    totalStudents: 32,
    avgScore: 22.8
  },
  {
    id: "4",
    title: "Calculus Principles",
    subject: "Mathematics",
    grade: "Grade 11",
    section: "B",
    examType: "Unit Test",
    date: new Date("2023-12-15"),
    startTime: "10:30 AM",
    endTime: "11:30 AM",
    duration: "1 hour",
    totalMarks: 25,
    status: "upcoming"
  },
  {
    id: "5",
    title: "Geometry Final",
    subject: "Mathematics",
    grade: "Grade 10",
    section: "B",
    examType: "Final",
    date: new Date("2023-12-20"),
    startTime: "09:00 AM",
    endTime: "12:00 PM",
    duration: "3 hours",
    totalMarks: 100,
    status: "upcoming"
  }
];

export default function TeacherExamsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredExams = exams
    .filter(exam => {
      if (activeTab === "all") return true;
      return exam.status === activeTab;
    })
    .filter(exam => 
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.section.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
  const upcomingExams = exams.filter(exam => exam.status === "upcoming");
  const completedExams = exams.filter(exam => exam.status === "completed");
  
  const onTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "upcoming":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Upcoming</Badge>;
      case "ongoing":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Ongoing</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Exams Management</h1>
        <Link href="/teacher/assessments/exams/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Exam
          </Button>
        </Link>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Upcoming Exams</CardTitle>
            <CardDescription>Scheduled examinations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{upcomingExams.length}</div>
            <div className="text-sm text-gray-500">
              Next exam: {upcomingExams.length > 0 ? format(upcomingExams[0].date, "MMM d, yyyy") : "None"}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pending Grades</CardTitle>
            <CardDescription>Exams needing evaluation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <div className="text-sm text-gray-500">All exams graded</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Completed Exams</CardTitle>
            <CardDescription>Past examinations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedExams.length}</div>
            <div className="text-sm text-gray-500">
              Average score: {completedExams.length > 0 
                ? `${(completedExams.reduce((sum, exam) => sum + (exam.avgScore || 0), 0) / completedExams.length).toFixed(1)}%`
                : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="all" onValueChange={onTabChange}>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <TabsList>
            <TabsTrigger value="all">All Exams</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search exams..."
                className="pl-9 w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-3.5 w-3.5" />
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="grade10a">Grade 10-A</SelectItem>
                <SelectItem value="grade10b">Grade 10-B</SelectItem>
                <SelectItem value="grade9c">Grade 9-C</SelectItem>
                <SelectItem value="grade11b">Grade 11-B</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="mt-6">
          <TabsContent value="all" className="m-0">
            <Card>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Title</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Class</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Type</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Date</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Time</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Marks</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                          <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExams.length > 0 ? (
                          filteredExams.map((exam) => (
                            <tr key={exam.id} className="border-b">
                              <td className="py-3 px-4">
                                <div className="font-medium">{exam.title}</div>
                                <div className="text-xs text-gray-500">{exam.subject}</div>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {exam.grade}-{exam.section}
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant="outline">{exam.examType}</Badge>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {format(exam.date, "MMM d, yyyy")}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {exam.startTime} - {exam.endTime}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {exam.totalMarks}
                              </td>
                              <td className="py-3 px-4">
                                {getStatusBadge(exam.status)}
                              </td>
                              <td className="py-3 px-4 text-right space-x-1">
                                <Link href={`/teacher/assessments/exams/${exam.id}`}>
                                  <Button size="sm" variant="ghost">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button size="sm" variant="ghost">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {exam.status === "upcoming" && (
                                  <Button size="sm" variant="ghost">
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                )}
                                {exam.status === "completed" && (
                                  <Button size="sm" variant="ghost">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="py-10 text-center text-gray-500">
                              <div className="flex flex-col items-center gap-1">
                                <AlertCircle className="h-8 w-8 text-gray-400" />
                                <p>No exams found</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="upcoming" className="m-0">
            <div className="space-y-6">
              {upcomingExams.length > 0 ? (
                upcomingExams.map((exam) => (
                  <Card key={exam.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{exam.title}</CardTitle>
                          <CardDescription>{exam.subject} • {exam.grade}-{exam.section}</CardDescription>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Upcoming</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs text-gray-500">Date</div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-gray-500" />
                            <span>{format(exam.date, "MMM d, yyyy")}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Time</div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-gray-500" />
                            <span>{exam.startTime} - {exam.endTime}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Duration</div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-gray-500" />
                            <span>{exam.duration}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Total Marks</div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5 text-gray-500" />
                            <span>{exam.totalMarks}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm">
                        <FileText className="mr-1 h-4 w-4" /> Question Paper
                      </Button>
                      <div className="space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="mr-1 h-4 w-4" /> Edit
                        </Button>
                        <Link href={`/teacher/assessments/exams/${exam.id}`}>
                          <Button size="sm">
                            <Eye className="mr-1 h-4 w-4" /> View Details
                          </Button>
                        </Link>
                      </div>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8">
                    <div className="flex flex-col items-center justify-center text-center">
                      <AlertCircle className="h-10 w-10 text-gray-400 mb-2" />
                      <h3 className="font-medium text-lg">No Upcoming Exams</h3>
                      <p className="text-gray-500 max-w-md mt-1">
                        There are no upcoming exams scheduled. Create a new exam to get started.
                      </p>
                      <div className="mt-4">
                        <Link href="/teacher/assessments/exams/create">
                          <Button>
                            <PlusCircle className="mr-2 h-4 w-4" /> Create Exam
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="completed" className="m-0">
            <div className="space-y-6">
              {completedExams.length > 0 ? (
                completedExams.map((exam) => (
                  <Card key={exam.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{exam.title}</CardTitle>
                          <CardDescription>{exam.subject} • {exam.grade}-{exam.section}</CardDescription>
                        </div>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-500">Date</div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-gray-500" />
                            <span>{format(exam.date, "MMM d, yyyy")}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Time</div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-gray-500" />
                            <span>{exam.startTime} - {exam.endTime}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Submissions</div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            <span>{exam.submittedBy}/{exam.totalStudents}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Average Score</div>
                          <div className="flex items-center gap-1 font-medium">
                            <span>{exam.avgScore}/{exam.totalMarks}</span>
                            <span className="text-xs text-gray-500">
                              ({((exam.avgScore || 0) / exam.totalMarks * 100).toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <h4 className="text-xs text-gray-500 mb-1">Performance Distribution</h4>
                        <div className="w-full flex h-2 rounded-full overflow-hidden">
                          <div className="bg-green-500 h-full" style={{ width: '40%' }}></div>
                          <div className="bg-blue-500 h-full" style={{ width: '30%' }}></div>
                          <div className="bg-amber-400 h-full" style={{ width: '20%' }}></div>
                          <div className="bg-red-500 h-full" style={{ width: '10%' }}></div>
                        </div>
                        <div className="flex justify-between text-xs mt-1 text-gray-500">
                          <span>A: 40%</span>
                          <span>B: 30%</span>
                          <span>C: 20%</span>
                          <span>F: 10%</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm">
                        <FileText className="mr-1 h-4 w-4" /> Answer Key
                      </Button>
                      <div className="space-x-2">
                        <Button size="sm" variant="outline">
                          <Download className="mr-1 h-4 w-4" /> Export Results
                        </Button>
                        <Link href={`/teacher/assessments/results?examId=${exam.id}`}>
                          <Button size="sm">
                            <ClipboardList className="mr-1 h-4 w-4" /> View Results
                          </Button>
                        </Link>
                      </div>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8">
                    <div className="flex flex-col items-center justify-center text-center">
                      <AlertCircle className="h-10 w-10 text-gray-400 mb-2" />
                      <h3 className="font-medium text-lg">No Completed Exams</h3>
                      <p className="text-gray-500 max-w-md mt-1">
                        There are no completed exams yet. Once exams are conducted, they will appear here.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
