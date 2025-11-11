import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Chart } from "@/components/dashboard/chart";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import { 
  Users, BookOpen, ClipboardCheck, Calendar, FileText, 
  Edit, CheckCircle, Clock, FileSpreadsheet, AlertCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTeacherDashboardData } from "@/lib/actions/teacherDashboardActions";
import { format } from "date-fns";



export default async function TeacherDashboard() {
  const result = await getTeacherDashboardData();

  if (!result.success || !result.data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Failed to load dashboard</h2>
        <p className="text-muted-foreground">{result.error || "An error occurred"}</p>
      </div>
    );
  }

  const { data } = result;
  const todayClasses = data.todayClasses;
  const studentAttendanceData = data.studentAttendanceData;
  const assignmentData = data.assignmentData;
  const recentLessons = data.recentLessons;
  const recentAssignments = data.recentAssignments;
  const pendingTasks = data.pendingTasks;
  const classPerformanceData = data.classPerformanceData;

  // Mock upcoming events (can be replaced with real data later)
  const upcomingEvents = [
    {
      id: '1',
      title: 'Mid-term Exam',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      type: 'exam' as const
    },
    {
      id: '2',
      title: 'Parent-Teacher Meeting',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      type: 'meeting' as const
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Teacher Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {data.teacher.name}! Here's an overview of your teaching activities.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="My Classes"
          value={data.stats.classesCount.toString()}
          icon={<Users className="h-5 w-5" />}
          description="Today's classes"
        />
        <StatsCard
          title="Students"
          value={data.stats.studentsCount.toString()}
          icon={<Users className="h-5 w-5" />}
          description="Across all classes"
        />
        <StatsCard
          title="Assignments"
          value={data.stats.assignmentsNeedingGrading.toString()}
          icon={<FileText className="h-5 w-5" />}
          description="Need grading"
        />
        <StatsCard
          title="Attendance"
          value={`${data.stats.attendancePercentage}%`}
          icon={<ClipboardCheck className="h-5 w-5" />}
          description="This week"
        />
      </div>

      {/* Today's Classes */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">Today's Classes</CardTitle>
              <CardDescription>{format(new Date(), "EEEE, MMMM d, yyyy")}</CardDescription>
            </div>
            <Link href="/teacher/teaching/timetable">
              <Button variant="outline" size="sm">
                Full Schedule
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {todayClasses.length > 0 ? (
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
                          <span>{cls.className}{cls.sectionName ? ` - ${cls.sectionName}` : ''}</span>
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
                        <Link href={`/teacher/teaching/classes/${cls.classId}`}>
                          <Button size="sm">Class Details</Button>
                        </Link>
                        <Link href={`/teacher/attendance/mark?classId=${cls.classId}&sectionId=${cls.sectionId}`}>
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
          ) : (
            <div className="text-center py-10">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Classes Today</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                You don't have any classes scheduled for today. Enjoy your day!
              </p>
            </div>
          )}
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
