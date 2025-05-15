"use client";

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Chart } from "@/components/dashboard/chart";
import Link from "next/link";
import { 
  ClipboardCheck, 
  FileText, 
  Search, 
  Download, 
  CalendarClock, 
  BookOpen, 
  User, 
  CheckCircle, 
  XCircle,
  Clock,
  Upload,
  Plus,
  Calendar,
  MessageSquare,
  PenLine,
  AlertCircle,
  BookMarked,
  ArrowUpRight,
  Settings,
  BarChart
} from "lucide-react";

// This would come from a database in a real application
const classData = {
  id: "1",
  name: "Grade 10-A",
  subject: "Mathematics",
  room: "Room 101",
  schedule: "Monday, Wednesday, Friday (9:00 AM - 10:00 AM)",
  teacher: {
    id: "t1",
    name: "Sarah Johnson",
    avatar: "/assets/avatars/teacher1.jpg",
  },
  totalStudents: 30,
  presentToday: 28,
  absentToday: 2,
  currentTopic: "Quadratic Equations",
  nextTopic: "Algebraic Fractions",
  upcomingAssessments: [
    {
      id: "a1",
      title: "Mid-term Examination",
      type: "Exam",
      date: "Dec 10, 2023",
    },
    {
      id: "a2",
      title: "Quadratic Equations Assignment",
      type: "Assignment",
      date: "Dec 5, 2023",
    }
  ],
  students: [
    { id: "s1", name: "John Smith", rollNo: "10A01", attendance: 95, performance: 87, lastAssignment: "Completed" },
    { id: "s2", name: "Emily Johnson", rollNo: "10A02", attendance: 98, performance: 92, lastAssignment: "Completed" },
    { id: "s3", name: "Michael Brown", rollNo: "10A03", attendance: 85, performance: 78, lastAssignment: "Late" },
    { id: "s4", name: "Amanda Davis", rollNo: "10A04", attendance: 92, performance: 85, lastAssignment: "Completed" },
    { id: "s5", name: "James Wilson", rollNo: "10A05", attendance: 90, performance: 83, lastAssignment: "Completed" },
    { id: "s6", name: "Jennifer Garcia", rollNo: "10A06", attendance: 96, performance: 88, lastAssignment: "Completed" },
    { id: "s7", name: "Robert Martinez", rollNo: "10A07", attendance: 88, performance: 75, lastAssignment: "Missing" },
    { id: "s8", name: "Elizabeth Robinson", rollNo: "10A08", attendance: 93, performance: 91, lastAssignment: "Completed" },
  ],
  recentAttendance: [
    { date: "Nov 27", present: 28, absent: 2 },
    { date: "Nov 29", present: 29, absent: 1 },
    { date: "Dec 01", present: 28, absent: 2 },
  ],
  performanceData: [
    { assessment: "Quiz 1", classAvg: 82, schoolAvg: 78 },
    { assessment: "Assignment 1", classAvg: 85, schoolAvg: 80 },
    { assessment: "Mid-term", classAvg: 79, schoolAvg: 77 },
    { assessment: "Quiz 2", classAvg: 88, schoolAvg: 81 },
    { assessment: "Assignment 2", classAvg: 90, schoolAvg: 82 },
  ],
  resources: [
    {
      id: "r1",
      title: "Quadratic Equations Slides",
      type: "Presentation",
      format: "PDF",
      size: "2.4 MB",
      uploadedOn: "Nov 15, 2023",
      downloadUrl: "#"
    },
    {
      id: "r2",
      title: "Equation Worksheets",
      type: "Worksheet",
      format: "DOCX",
      size: "1.8 MB",
      uploadedOn: "Nov 20, 2023",
      downloadUrl: "#"
    },
    {
      id: "r3",
      title: "Practice Problems",
      type: "Exercise",
      format: "PDF",
      size: "1.2 MB",
      uploadedOn: "Nov 25, 2023",
      downloadUrl: "#"
    },
    {
      id: "r4",
      title: "Algebra Formula Sheet",
      type: "Reference",
      format: "PDF",
      size: "0.5 MB",
      uploadedOn: "Oct 05, 2023",
      downloadUrl: "#"
    },
    {
      id: "r5",
      title: "Interactive Equations Demo",
      type: "Interactive",
      format: "URL",
      size: "N/A",
      uploadedOn: "Nov 10, 2023",
      downloadUrl: "https://www.geogebra.org/m/qpbswzuh"
    }
  ],
  assignments: [
    {
      id: "as1",
      title: "Quadratic Equations Assignment",
      dueDate: "Dec 5, 2023",
      totalMarks: 20,
      submitted: 25,
      graded: 22,
      averageScore: "16.5/20"
    },
    {
      id: "as2",
      title: "Linear Equations Homework",
      dueDate: "Nov 20, 2023",
      totalMarks: 15,
      submitted: 28,
      graded: 28,
      averageScore: "12.8/15"
    }
  ],
  exams: [
    {
      id: "ex1",
      title: "Mid-term Examination",
      date: "Dec 10, 2023",
      type: "Written",
      duration: "2 hours",
      totalMarks: 50,
      status: "Upcoming"
    },
    {
      id: "ex2",
      title: "Quiz on Algebraic Expressions",
      date: "Nov 15, 2023",
      type: "Quiz",
      duration: "30 minutes",
      totalMarks: 20,
      status: "Completed"
    }
  ],
  lessons: [
    {
      id: "l1",
      title: "Introduction to Quadratic Equations",
      date: "Nov 20, 2023",
      status: "Completed"
    },
    {
      id: "l2",
      title: "Solving Quadratic Equations",
      date: "Nov 22, 2023",
      status: "Completed"
    },
    {
      id: "l3",
      title: "Applications of Quadratic Equations",
      date: "Nov 24, 2023",
      status: "In Progress"
    },
    {
      id: "l4",
      title: "Graphing Quadratic Functions",
      date: "Nov 29, 2023",
      status: "Planned"
    }
  ]
};

export default function ClassDetailPage({ params }: { params: { id: string } }) {
  const classId = params.id;
  const classInfo = classData; // In a real app, fetch data using the ID
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{classInfo.name} - {classInfo.subject}</h1>
          <p className="text-gray-500">{classInfo.room} • {classInfo.schedule}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/teacher/attendance/mark?classId=${classId}`}>
            <Button variant="outline">
              <ClipboardCheck className="mr-2 h-4 w-4" /> Take Attendance
            </Button>
          </Link>
          <Link href={`/teacher/assessments/assignments/create?classId=${classId}`}>
            <Button>
              <FileText className="mr-2 h-4 w-4" /> Create Assignment
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Class Overview</CardTitle>
            <CardDescription>Current status and progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-xs">Total Students</p>
                <p className="text-2xl font-bold">{classInfo.totalStudents}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-xs">Today's Attendance</p>
                <div className="flex justify-center items-center gap-2">
                  <p className="text-2xl font-bold text-green-600">{classInfo.presentToday}</p>
                  <p className="text-sm text-gray-500">/</p>
                  <p className="text-2xl font-bold text-red-500">{classInfo.absentToday}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Current Topic</p>
                <div className="flex justify-between items-center">
                  <p className="font-medium">{classInfo.currentTopic}</p>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">In Progress</Badge>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-gray-500">Next Topic</p>
                <p>{classInfo.nextTopic}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500">Upcoming Assessments</p>
                <ul className="mt-1 space-y-2">
                  {classInfo.upcomingAssessments.map((assessment) => (
                    <li key={assessment.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{assessment.title}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <CalendarClock className="h-3 w-3" />
                          <span>{assessment.date}</span>
                        </div>
                      </div>
                      <Badge variant={assessment.type === "Exam" ? "default" : "outline"}>
                        {assessment.type}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Attendance</CardTitle>
            <CardDescription>Last three class sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {classInfo.recentAttendance.map((session, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <p className="font-medium text-center mb-2">{session.date}</p>
                  <div className="flex justify-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-green-600">Present</p>
                      <p className="text-2xl font-bold text-green-600">{session.present}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-red-500">Absent</p>
                      <p className="text-2xl font-bold text-red-500">{session.absent}</p>
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(session.present / classInfo.totalStudents) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <Link href={`/teacher/attendance/records?classId=${classId}`}>
                <Button variant="link" className="h-auto p-0">View Full Attendance Records</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <Tabs defaultValue="students">
          <CardHeader className="pb-0">
            <div className="flex justify-between items-center">
              <CardTitle>Class Management</CardTitle>
              <TabsList>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="lessons">Lessons</TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          
          <TabsContent value="students" className="px-6 py-4">
            <div className="flex justify-between mb-4">
              <div className="relative w-[250px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search students..."
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="mr-1 h-4 w-4" /> Export List
                </Button>
                <Link href={`/teacher/students/performance?classId=${classId}`}>
                  <Button size="sm">View Detailed Performance</Button>
                </Link>
              </div>
            </div>
            
            <div className="rounded-md border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roll No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Assignment
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {classInfo.students.map((student) => (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {student.rollNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                            {student.name.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium">{student.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className={`h-2 w-2 rounded-full mr-2 ${
                              student.attendance >= 90 ? 'bg-green-500' :
                              student.attendance >= 80 ? 'bg-amber-500' :
                              'bg-red-500'
                            }`}
                          ></div>
                          <span className="text-sm">{student.attendance}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className={`h-2 w-2 rounded-full mr-2 ${
                              student.performance >= 90 ? 'bg-green-500' :
                              student.performance >= 80 ? 'bg-blue-500' :
                              student.performance >= 70 ? 'bg-amber-500' :
                              'bg-red-500'
                            }`}
                          ></div>
                          <span className="text-sm">{student.performance}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          className={`${
                            student.lastAssignment === 'Completed' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                            student.lastAssignment === 'Late' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' :
                            'bg-red-100 text-red-800 hover:bg-red-100'
                          }`}
                        >
                          {student.lastAssignment}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Link href={`/teacher/students/${student.id}`}>
                          <Button variant="link" className="h-auto p-0">View Details</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
          
          <TabsContent value="performance" className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Performance Comparison</CardTitle>
                  <CardDescription>Class average vs school average</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Chart 
                    title=""
                    data={classInfo.performanceData}
                    type="bar"
                    xKey="assessment"
                    yKey="classAvg"
                    categories={["classAvg", "schoolAvg"]}
                    colors={["#3b82f6", "#94a3b8"]}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Performance Distribution</CardTitle>
                  <CardDescription>Students by grade range</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">A Grade (90-100%)</span>
                        <span className="text-sm font-medium">5 students</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: "17%" }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">B Grade (80-89%)</span>
                        <span className="text-sm font-medium">12 students</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "40%" }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">C Grade (70-79%)</span>
                        <span className="text-sm font-medium">8 students</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: "27%" }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">D Grade (60-69%)</span>
                        <span className="text-sm font-medium">4 students</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: "13%" }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">F Grade (Below 60%)</span>
                        <span className="text-sm font-medium">1 student</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: "3%" }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center mt-6">
                    <Link href={`/teacher/assessments/results?classId=${classId}`}>
                      <Button>View Detailed Results</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="resources" className="p-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-base">Learning Materials</CardTitle>
                    </div>
                    <Button size="sm">
                      <Upload className="h-4 w-4 mr-2" /> Upload Resource
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded On</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {classInfo.resources.map((resource) => (
                          <tr key={resource.id}>
                            <td className="px-6 py-4">
                              <div className="font-medium">{resource.title}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="outline">{resource.type}</Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{resource.format}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{resource.size}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{resource.uploadedOn}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {resource.format === "URL" ? (
                                <a href={resource.downloadUrl} target="_blank" rel="noopener noreferrer">
                                  <Button variant="outline" size="sm">
                                    <ArrowUpRight className="h-4 w-4 mr-1" /> Open
                                  </Button>
                                </a>
                              ) : (
                                <a href={resource.downloadUrl} download>
                                  <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-1" /> Download
                                  </Button>
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-base">Resource Management</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <h3 className="font-medium mb-2 text-blue-800">Resource Statistics</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Resources:</span>
                          <span className="font-medium">{classInfo.resources.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Presentations:</span>
                          <span className="font-medium">1</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Worksheets:</span>
                          <span className="font-medium">1</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Exercises:</span>
                          <span className="font-medium">1</span>
                        </div>
                        <div className="flex justify-between">
                          <span>References:</span>
                          <span className="font-medium">1</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Interactive Resources:</span>
                          <span className="font-medium">1</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium">Quick Actions</h3>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" className="justify-start">
                          <Plus className="h-4 w-4 mr-2" /> Create New Worksheet
                        </Button>
                        <Button variant="outline" size="sm" className="justify-start">
                          <BookMarked className="h-4 w-4 mr-2" /> Browse Resource Library
                        </Button>
                        <Button variant="outline" size="sm" className="justify-start">
                          <MessageSquare className="h-4 w-4 mr-2" /> Share with Students
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="assignments" className="p-6">
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-bold">Assignments</h2>
              <Link href={`/teacher/assessments/assignments/create?classId=${classId}`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Create Assignment
                </Button>
              </Link>
            </div>
            
            <div className="grid gap-6">
              {classInfo.assignments.map((assignment) => (
                <Card key={assignment.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle>{assignment.title}</CardTitle>
                        <CardDescription>Due: {assignment.dueDate} • {assignment.totalMarks} marks</CardDescription>
                      </div>
                      <Link href={`/teacher/assessments/assignments/${assignment.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <p className="text-gray-500">Submissions</p>
                        <p className="text-lg font-bold">{assignment.submitted}/{classInfo.totalStudents}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <p className="text-gray-500">Graded</p>
                        <p className="text-lg font-bold">{assignment.graded}/{assignment.submitted}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <p className="text-gray-500">Average Score</p>
                        <p className="text-lg font-bold">{assignment.averageScore}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Grading Progress</span>
                        <span className="text-sm font-medium">{Math.round((assignment.graded / assignment.submitted) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${(assignment.graded / assignment.submitted) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 border-t pt-4">
                    <Button variant="outline" size="sm">
                      <BarChart className="h-4 w-4 mr-1" /> View Analytics
                    </Button>
                    <Button size="sm">
                      <PenLine className="h-4 w-4 mr-1" /> Grade Submissions
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              
              <div className="flex justify-center mt-2">
                <Link href={`/teacher/assessments/assignments?classId=${classId}`}>
                  <Button variant="outline">View All Assignments</Button>
                </Link>
              </div>
            </div>
            
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Upcoming Exams</h2>
              <div className="rounded-md border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Marks</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {classInfo.exams.map((exam) => (
                      <tr key={exam.id}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{exam.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{exam.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{exam.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{exam.duration}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{exam.totalMarks}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={exam.status === 'Upcoming' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}>
                            {exam.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <Link href={`/teacher/assessments/exams/${exam.id}`}>
                            <Button variant="link" className="h-auto p-0">View Details</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-center mt-4">
                <Link href={`/teacher/assessments/exams/create?classId=${classId}`}>
                  <Button>Create New Exam</Button>
                </Link>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="lessons" className="p-6">
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-bold">Lesson Plans</h2>
              <Link href={`/teacher/schedule/create-lesson?classId=${classId}`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Create Lesson
                </Button>
              </Link>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {classInfo.lessons.map((lesson) => (
                <Card key={lesson.id} className="overflow-hidden">
                  <div className={`px-4 py-1 text-xs font-medium text-white ${
                    lesson.status === 'Completed' ? 'bg-green-500' :
                    lesson.status === 'In Progress' ? 'bg-amber-500' :
                    'bg-blue-500'
                  }`}>
                    {lesson.status}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{lesson.title}</CardTitle>
                    <CardDescription className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1" /> {lesson.date}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="border-t pt-3 flex justify-between">
                    <Button variant="ghost" size="sm">
                      <FileText className="h-4 w-4 mr-1" /> Lesson Plan
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4 mr-1" /> Manage
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            <div className="mt-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Syllabus Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Overall Progress</span>
                        <span className="text-sm font-medium">65%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Current Unit: {classInfo.currentTopic}</span>
                        <span className="text-sm font-medium">70%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center mt-4">
                    <Link href={`/teacher/teaching/syllabus?classId=${classId}`}>
                      <Button variant="outline">
                        <BookMarked className="h-4 w-4 mr-1" /> View Full Syllabus
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Communication Hub</CardTitle>
            <CardDescription>
              Engage with students and parents related to this class
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button>
                <MessageSquare className="mr-1 h-4 w-4" /> Message Students
              </Button>
              <Button variant="outline">
                <AlertCircle className="mr-1 h-4 w-4" /> Create Announcement
              </Button>
              <Button variant="outline">
                <Calendar className="mr-1 h-4 w-4" /> Schedule Parent Meeting
              </Button>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Recent Messages</h3>
              <div className="space-y-3">
                <div className="p-3 border rounded-md">
                  <div className="flex justify-between">
                    <p className="font-medium">Question about assignment</p>
                    <span className="text-xs text-gray-500">Yesterday</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    From: John Smith (Student) - "Can we submit the assignment one day late?"
                  </p>
                </div>
                <div className="p-3 border rounded-md">
                  <div className="flex justify-between">
                    <p className="font-medium">Extra practice resources</p>
                    <span className="text-xs text-gray-500">2 days ago</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    From: Emily Johnson's Parent - "Could you share some extra practice problems for the upcoming test?"
                  </p>
                </div>
              </div>
              
              <div className="flex justify-center mt-4">
                <Link href="/teacher/communication/messages">
                  <Button variant="link">View All Messages</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Link href={`/teacher/attendance/mark?classId=${classId}`}>
                <Button variant="outline" className="w-full justify-start">
                  <ClipboardCheck className="mr-2 h-4 w-4" /> Take Attendance
                </Button>
              </Link>
              <Link href={`/teacher/assessments/assignments/create?classId=${classId}`}>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" /> Create Assignment
                </Button>
              </Link>
              <Link href={`/teacher/schedule/create-lesson?classId=${classId}`}>
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="mr-2 h-4 w-4" /> Create Lesson
                </Button>
              </Link>
              <Link href={`/teacher/communication/messages/compose?classId=${classId}`}>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="mr-2 h-4 w-4" /> Message Class
                </Button>
              </Link>
              <Link href={`/teacher/teaching/syllabus?classId=${classId}`}>
                <Button variant="outline" className="w-full justify-start">
                  <PenLine className="mr-2 h-4 w-4" /> Update Syllabus
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
