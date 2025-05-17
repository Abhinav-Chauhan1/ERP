import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Chart } from "@/components/dashboard/chart";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import { 
  Users, BookOpen, ClipboardCheck, Calendar, FileText, 
  Edit, CheckCircle, Clock, FileSpreadsheet
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@clerk/nextjs/server";

// Types for teacher dashboard
type CalendarEventType = "exam" | "holiday" | "event" | "meeting";
interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: CalendarEventType;
}

// Add this type for lessons
interface RecentLesson {
  id: string;
  title: string;
  subject: string; 
  date: string;
  duration: number;
  unit: string;
}

// Mock data for today's classes
const todayClasses = [
  {
    id: "1",
    subject: "Mathematics",
    class: "Grade 10-A",
    time: "09:00 AM - 10:00 AM",
    room: "Room 101",
    topic: "Quadratic Equations",
    status: "completed"
  },
  {
    id: "2",
    subject: "Mathematics",
    class: "Grade 11-B",
    time: "10:30 AM - 11:30 AM", 
    room: "Room 203",
    topic: "Calculus Introduction",
    status: "completed"
  },
  {
    id: "3",
    subject: "Mathematics",
    class: "Grade 9-C",
    time: "12:00 PM - 01:00 PM",
    room: "Room 105",
    topic: "Linear Equations",
    status: "next"
  },
  {
    id: "4",
    subject: "Mathematics",
    class: "Grade 10-B",
    time: "02:30 PM - 03:30 PM",
    room: "Room 102",
    topic: "Quadratic Equations",
    status: "upcoming"
  }
];

// Mock data for students attendance
const studentAttendanceData = [
  { class: 'Grade 9-C', present: 92, absent: 8 },
  { class: 'Grade 10-A', present: 95, absent: 5 },
  { class: 'Grade 10-B', present: 90, absent: 10 },
  { class: 'Grade 11-B', present: 88, absent: 12 },
];

// Mock data for assignments
const assignmentData = [
  { status: 'Submitted', count: 86 },
  { status: 'Pending', count: 14 },
  { status: 'Graded', count: 72 },
  { status: 'Late', count: 8 },
];

// Mock data for upcoming events
const upcomingEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Mid-term Mathematics Exam',
    date: new Date('2023-12-10T09:00:00'),
    type: 'exam'
  },
  {
    id: '2',
    title: 'Parent-Teacher Meeting',
    date: new Date('2023-12-15T14:30:00'),
    type: 'meeting'
  },
  {
    id: '3',
    title: 'Staff Meeting',
    date: new Date('2023-12-05T16:00:00'),
    type: 'meeting'
  },
  {
    id: '4',
    title: 'Winter Break',
    date: new Date('2023-12-22'),
    type: 'holiday'
  }
];

// Mock data for pending tasks
const pendingTasks = [
  {
    id: "1",
    title: "Grade Mathematics Assignment",
    class: "Grade 10-A",
    dueDate: "Dec 05, 2023",
    priority: "high"
  },
  {
    id: "2",
    title: "Prepare Test Papers",
    class: "Grade 11-B",
    dueDate: "Dec 07, 2023",
    priority: "medium"
  },
  {
    id: "3",
    title: "Complete Progress Reports",
    class: "All Classes",
    dueDate: "Dec 10, 2023",
    priority: "high"
  },
  {
    id: "4",
    title: "Submit Lesson Plans",
    class: "All Classes",
    dueDate: "Dec 12, 2023",
    priority: "low"
  }
];

// Mock data for recent assignments
const recentAssignments = [
  {
    id: "1",
    title: "Quadratic Equations Practice",
    class: "Grade 10-A",
    dueDate: "Dec 03, 2023",
    submissions: "25/30",
    status: "active"
  },
  {
    id: "2",
    title: "Calculus Basics Worksheet",
    class: "Grade 11-B",
    dueDate: "Dec 05, 2023",
    submissions: "18/28",
    status: "active"
  },
  {
    id: "3",
    title: "Linear Equations Quiz",
    class: "Grade 9-C",
    dueDate: "Nov 30, 2023",
    submissions: "29/32",
    status: "completed"
  }
];

// Mock data for class performance
const classPerformanceData = [
  { subject: 'Grade 9-C', average: 76 },
  { subject: 'Grade 10-A', average: 82 },
  { subject: 'Grade 10-B', average: 74 },
  { subject: 'Grade 11-B', average: 78 },
];

// Mock data for recent lessons
const recentLessons: RecentLesson[] = [
  {
    id: "1",
    title: "Quadratic Equations Introduction",
    subject: "Mathematics",
    date: "2023-12-01",
    duration: 45,
    unit: "Algebra II"
  },
  {
    id: "2",
    title: "Solving Linear Equations",
    subject: "Mathematics",
    date: "2023-11-28",
    duration: 45,
    unit: "Algebra I"
  },
  {
    id: "3",
    title: "Calculus Principles",
    subject: "Mathematics",
    date: "2023-11-25",
    duration: 60,
    unit: "Calculus"
  }
];

export default async function TeacherDashboard() {
  const { userId } = await auth();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Teacher Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, Sarah! Here's an overview of your teaching activities.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="My Classes"
          value="4"
          icon={<Users className="h-5 w-5" />}
          description="Today's classes"
        />
        <StatsCard
          title="Students"
          value="124"
          icon={<Users className="h-5 w-5" />}
          description="Across all classes"
        />
        <StatsCard
          title="Assignments"
          value="12"
          icon={<FileText className="h-5 w-5" />}
          trend={{ value: 3, isPositive: false }}
          description="3 need grading"
        />
        <StatsCard
          title="Attendance"
          value="91.4%"
          icon={<ClipboardCheck className="h-5 w-5" />}
          trend={{ value: 2.5, isPositive: true }}
          description="vs. last week"
        />
      </div>

      {/* Today's Classes */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">Today's Classes</CardTitle>
              <CardDescription>Wednesday, December 1, 2023</CardDescription>
            </div>
            <Link href="/teacher/schedule">
              <Button variant="outline" size="sm">
                Full Schedule
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-5 h-full w-px bg-gray-200"></div>
            <div className="space-y-6 pl-12">
              {todayClasses.map((cls) => (
                <div 
                  key={cls.id} 
                  className={`p-4 border rounded-lg ${
                    cls.status === 'completed' ? 'bg-gray-50' :
                    cls.status === 'next' ? 'border-emerald-500 bg-emerald-50' :
                    'bg-white'
                  }`}
                >
                  <div className={`absolute -left-2 w-4 h-4 rounded-full ${
                    cls.status === 'completed' ? 'bg-gray-400' :
                    cls.status === 'next' ? 'bg-emerald-500 ring-4 ring-emerald-100' :
                    'bg-gray-200'
                  }`}></div>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                    <div>
                      <h4 className="font-medium">{cls.subject}</h4>
                      <div className="text-sm text-gray-500 flex flex-col md:flex-row gap-2 md:items-center">
                        <span>{cls.class}</span>
                        <span className="hidden md:inline">•</span>
                        <span>{cls.room}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-start md:items-end">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-500" />
                        <span className="text-sm text-gray-500">{cls.time}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Topic: {cls.topic}</div>
                    </div>
                  </div>
                  {cls.status === 'next' && (
                    <div className="mt-2 flex gap-2">
                      <Link href={`/teacher/teaching/classes/${cls.id}`}>
                        <Button size="sm">Class Details</Button>
                      </Link>
                      <Link href={`/teacher/attendance/mark?classId=${cls.id}`}>
                        <Button size="sm" variant="outline">Take Attendance</Button>
                      </Link>
                    </div>
                  )}
                  {cls.status === 'completed' && (
                    <div className="mt-2 flex gap-1">
                      <Badge variant="outline" className="bg-gray-100">
                        <CheckCircle className="h-3 w-3 mr-1" /> Completed
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Recent Lessons section before the charts section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">Recent Lessons</CardTitle>
              <CardDescription>Latest lesson content you've created</CardDescription>
            </div>
            <Link href="/teacher/teaching/lessons">
              <Button variant="outline" size="sm">
                View All Lessons
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentLessons.map((lesson) => (
              <Link href={`/teacher/teaching/lessons/${lesson.id}`} key={lesson.id}>
                <div className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{lesson.title}</h4>
                      <div className="text-sm text-gray-500 mt-1">
                        {lesson.subject} • {lesson.unit}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{lesson.duration} min</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Link href="/teacher/teaching/lessons/create" className="w-full">
            <Button variant="outline" className="w-full">
              <FileText className="mr-2 h-4 w-4" /> Create New Lesson
            </Button>
          </Link>
        </CardFooter>
      </Card>

      {/* Charts and Upcoming Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-medium">Attendance Overview</CardTitle>
            <CardDescription>Student attendance by class</CardDescription>
          </CardHeader>
          <CardContent>
            <Chart
              title=""
              data={studentAttendanceData}
              type="bar"
              xKey="class"
              yKey="present"
              categories={["present", "absent"]}
              colors={["#10b981", "#f59e0b"]}
            />
          </CardContent>
          <CardFooter>
            <Link href="/teacher/attendance/reports" className="w-full">
              <Button variant="outline" className="w-full">View Detailed Reports</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-medium">Assignment Status</CardTitle>
            <CardDescription>Submission statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <Chart
              title=""
              data={assignmentData}
              type="pie"
              xKey="status"
              yKey="count"
              categories={["count"]}
              colors={["#10b981", "#f59e0b", "#3b82f6", "#ef4444"]}
            />
          </CardContent>
          <CardFooter>
            <Link href="/teacher/assessments/assignments" className="w-full">
              <Button variant="outline" className="w-full">Manage Assignments</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-medium">Calendar</CardTitle>
            <CardDescription>Upcoming events and schedule</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <CalendarWidget events={upcomingEvents} />
          </CardContent>
        </Card>
      </div>

      {/* Tasks, Assignments, and Class Performance */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      task.priority === 'high' ? 'bg-red-100 text-red-700' :
                      task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      <FileSpreadsheet className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <div className="text-xs text-gray-500 flex gap-2 items-center mt-1">
                        <span>{task.class}</span> • <span>Due: {task.dueDate}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <CheckCircle className="h-4 w-4 mr-1" /> Mark Complete
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex justify-between w-full">
              <Button variant="outline">View All Tasks</Button>
              <Button>
                <Edit className="h-4 w-4 mr-2" /> Create Task
              </Button>
            </div>
          </CardFooter>
        </Card>

        <Card>
          <Tabs defaultValue="assignments">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">Class Activities</CardTitle>
                <TabsList>
                  <TabsTrigger value="assignments">Assignments</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent>
              <TabsContent value="assignments" className="space-y-4 mt-0">
                {recentAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{assignment.title}</p>
                        <Badge variant={assignment.status === 'active' ? 'secondary' : 'outline'}>
                          {assignment.status === 'active' ? 'Active' : 'Completed'}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 flex gap-2 items-center mt-1">
                        <span>{assignment.class}</span> • <span>Due: {assignment.dueDate}</span>
                      </div>
                    </div>
                    <div className="text-sm text-right">
                      <div>Submissions</div>
                      <div className="font-medium">{assignment.submissions}</div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-4">
                  <Link href="/teacher/assessments/assignments">
                    <Button variant="outline">View All</Button>
                  </Link>
                  <Link href="/teacher/assessments/assignments/create">
                    <Button>Create Assignment</Button>
                  </Link>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="mt-0">
                <Chart
                  title="Class Performance"
                  data={classPerformanceData}
                  type="bar"
                  xKey="subject"
                  yKey="average"
                  categories={["average"]}
                  colors={["#3b82f6"]}
                />
                <div className="flex justify-center pt-4">
                  <Link href="/teacher/students/performance">
                    <Button variant="outline">View Detailed Analysis</Button>
                  </Link>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/teacher/attendance/mark">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-white hover:border-emerald-200 hover:bg-emerald-50 transition-colors text-center">
              <div className="p-2 rounded-full bg-emerald-100 text-emerald-600">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Take Attendance</span>
            </div>
          </Link>
          <Link href="/teacher/assessments/assignments/create">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-white hover:border-emerald-200 hover:bg-emerald-50 transition-colors text-center">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <Edit className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Create Assignment</span>
            </div>
          </Link>
          <Link href="/teacher/teaching/lessons/create">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-white hover:border-emerald-200 hover:bg-emerald-50 transition-colors text-center">
              <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Create Lesson</span>
            </div>
          </Link>
          <Link href="/teacher/communication/messages/compose">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-white hover:border-emerald-200 hover:bg-emerald-50 transition-colors text-center">
              <div className="p-2 rounded-full bg-amber-100 text-amber-600">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Send Message</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
