import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Chart } from "@/components/dashboard/chart";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import { 
  Users, BookOpen, ClipboardCheck, Calendar, FileText, 
  Edit, CheckCircle, Clock, FileSpreadsheet, Bell, Mail
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTeacherDashboardData } from "@/lib/actions/teacherDashboardActions";
import { format } from "date-fns";

/**
 * Stats section - displays key metrics for the teacher
 */
export async function StatsSection() {
  const result = await getTeacherDashboardData();

  if (!result.success || !result.data) {
    return null;
  }

  const { data } = result;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Students"
        value={(data.stats.studentsCount ?? 0).toString()}
        icon={<Users className="h-5 w-5" />}
        description="Across all classes"
      />
      <StatsCard
        title="Pending Assignments"
        value={(data.stats.assignmentsNeedingGrading ?? 0).toString()}
        icon={<FileText className="h-5 w-5" />}
        description="Need grading"
      />
      <StatsCard
        title="Upcoming Exams"
        value={(data.stats.upcomingExamsCount ?? 0).toString()}
        icon={<Calendar className="h-5 w-5" />}
        description="Next 7 days"
      />
      <StatsCard
        title="Today's Classes"
        value={(data.stats.classesCount ?? 0).toString()}
        icon={<ClipboardCheck className="h-5 w-5" />}
        description={`${data.stats.attendancePercentage ?? 0}% attendance`}
      />
    </div>
  );
}

/**
 * Upcoming classes section - displays today's schedule
 */
export async function UpcomingClassesSection() {
  const result = await getTeacherDashboardData();

  if (!result.success || !result.data) {
    return null;
  }

  const { data } = result;
  const todayClasses = data.todayClasses ?? [];

  return (
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
            <div className="absolute left-5 h-full w-px bg-border"></div>
            <div className="space-y-6 pl-12">
              {todayClasses.map((cls) => (
                <div 
                  key={cls.id} 
                  className={`p-4 border rounded-lg ${
                    cls.status === 'completed' ? 'bg-muted' :
                    cls.status === 'next' ? 'border-primary bg-primary/10' :
                    'bg-background'
                  }`}
                >
                  <div className={`absolute -left-2 w-4 h-4 rounded-full ${
                    cls.status === 'completed' ? 'bg-muted-foreground' :
                    cls.status === 'next' ? 'bg-primary ring-4 ring-primary/20' :
                    'bg-muted'
                  }`}></div>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                    <div>
                      <h4 className="font-medium">{cls.subject}</h4>
                      <div className="text-sm text-muted-foreground flex flex-col md:flex-row gap-2 md:items-center">
                        <span>{cls.className}{cls.sectionName ? ` - ${cls.sectionName}` : ''}</span>
                        <span className="hidden md:inline">•</span>
                        <span>{cls.room}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-start md:items-end">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{cls.time}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">Topic: {cls.topic}</div>
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
                      <Badge variant="outline" className="bg-muted">
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
            <Calendar className="h-12 w-12 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Classes Today</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              You don't have any classes scheduled for today. Enjoy your day!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Recent activity section - displays announcements, messages, lessons, and charts
 */
export async function RecentActivitySection() {
  const result = await getTeacherDashboardData();

  if (!result.success || !result.data) {
    return null;
  }

  const { data } = result;
  const recentAnnouncements = data.recentAnnouncements ?? [];
  const unreadMessagesCount = data.stats?.unreadMessagesCount ?? 0;
  const recentLessons = data.recentLessons ?? [];
  const studentAttendanceData = data.studentAttendanceData ?? [];
  const assignmentData = data.assignmentData ?? [];
  const pendingTasks = data.pendingTasks ?? [];
  const recentAssignments = data.recentAssignments ?? [];
  const classPerformanceData = data.classPerformanceData ?? [];

  return (
    <>
      {/* Announcements and Messages */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Recent Announcements
                </CardTitle>
                <CardDescription>Latest school announcements</CardDescription>
              </div>
              <Link href="/teacher/communication/announcements">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentAnnouncements.length > 0 ? (
              <div className="space-y-4">
                {recentAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <h4 className="font-medium">{announcement.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {announcement.content}
                    </p>
                    <div className="text-xs text-muted-foreground mt-2">
                      By {announcement.publisherName} • {announcement.createdAt}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent announcements</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Messages
                </CardTitle>
                <CardDescription>Your communication inbox</CardDescription>
              </div>
              <Link href="/teacher/communication/messages">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-6 border rounded-lg text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-semibold text-lg mb-2">
                  {unreadMessagesCount > 0 ? `${unreadMessagesCount} Unread Messages` : 'No Unread Messages'}
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {unreadMessagesCount > 0 
                    ? 'You have new messages waiting for your attention'
                    : 'You\'re all caught up with your messages'}
                </p>
                <Link href="/teacher/communication/messages">
                  <Button>
                    {unreadMessagesCount > 0 ? 'Read Messages' : 'View Messages'}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Lessons section */}
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
                <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{lesson.title}</h4>
                      <div className="text-sm text-muted-foreground mt-1">
                        {lesson.subject} • {lesson.unit}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
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
              colors={["hsl(var(--primary))", "hsl(var(--warning))"]}
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
              colors={["hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--chart-3))", "hsl(var(--destructive))"]}
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
            <CalendarWidget events={[]} />
          </CardContent>
          <CardFooter>
            <Link href="/teacher/teaching/timetable" className="w-full">
              <Button variant="outline" className="w-full">View Full Schedule</Button>
            </Link>
          </CardFooter>
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
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      task.priority === 'high' ? 'bg-destructive/10 text-destructive' :
                      task.priority === 'medium' ? 'bg-warning/10 text-warning' :
                      'bg-primary/10 text-primary'
                    }`}>
                      <FileSpreadsheet className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <div className="text-xs text-muted-foreground flex gap-2 items-center mt-1">
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
                      <div className="text-xs text-muted-foreground flex gap-2 items-center mt-1">
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
                  colors={["hsl(var(--chart-3))"]}
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
    </>
  );
}

/**
 * Quick actions section - displays frequently used actions
 */
export async function QuickActionsSection() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/teacher/attendance/mark">
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-background hover:border-primary hover:bg-primary/5 transition-colors text-center">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium">Take Attendance</span>
          </div>
        </Link>
        <Link href="/teacher/assessments/assignments/create">
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-background hover:border-primary hover:bg-primary/5 transition-colors text-center">
            <div className="p-2 rounded-full bg-accent/50 text-accent-foreground">
              <Edit className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium">Create Assignment</span>
          </div>
        </Link>
        <Link href="/teacher/teaching/lessons/create">
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-background hover:border-primary hover:bg-primary/5 transition-colors text-center">
            <div className="p-2 rounded-full bg-secondary text-secondary-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium">Create Lesson</span>
          </div>
        </Link>
        <Link href="/teacher/communication/messages/compose">
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-background hover:border-primary hover:bg-primary/5 transition-colors text-center">
            <div className="p-2 rounded-full bg-warning/10 text-warning">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium">Send Message</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
