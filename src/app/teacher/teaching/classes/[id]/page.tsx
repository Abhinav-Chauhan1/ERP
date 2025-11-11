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
  Calendar,
  MessageSquare,
  PenLine,
  AlertCircle,
  BookMarked,
  ArrowUpRight,
  Settings,
  BarChart,
  ArrowLeft,
} from "lucide-react";
import { getClassDetails } from "@/lib/actions/teacherClassesActions";
import { format } from "date-fns";

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const param = await params;
  const classId = param.id;
  const classInfo = await getClassDetails(classId);

  const performanceData = [
    { assessment: "Quiz 1", classAvg: 82, schoolAvg: 78 },
    { assessment: "Assignment 1", classAvg: 85, schoolAvg: 80 },
    { assessment: "Mid-term", classAvg: 79, schoolAvg: 77 },
    { assessment: "Quiz 2", classAvg: 88, schoolAvg: 81 },
    { assessment: "Assignment 2", classAvg: 90, schoolAvg: 82 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/teacher/teaching/classes">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex justify-between items-center flex-1">
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
                      style={{ width: `${(session.present / session.total) * 100}%` }}
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
                        {student.rollNumber}
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
                    data={performanceData}
                    type="bar"
                    xKey="assessment"
                    yKey="classAvg"
                    categories={["classAvg", "schoolAvg"]}
                    colors={["#3b82f6", "#94a3b8"]}
                  />
                </CardContent>
              </Card>
              
              {/* ... other performance elements ... */}
            </div>
          </TabsContent>
          
          <TabsContent value="assignments" className="p-6">
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-bold">Assignments</h2>
              <Link href={`/teacher/assessments/assignments/create?classId=${classId}`}>
                <Button>
                  <FileText className="h-4 w-4 mr-2" /> Create Assignment
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
          
          {/* ... other tab contents ... */}
        </Tabs>
      </Card>
      
      {/* ... other cards ... */}
    </div>
  );
}
