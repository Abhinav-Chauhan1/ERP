import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Chart } from "@/components/dashboard/chart";
import { CalendarWidget } from "@/components/calendar/calendar-widget";
import {
  Users, BookOpen, ClipboardCheck, Calendar, FileText,
  Edit, CheckCircle, Clock, FileSpreadsheet, Bell, Mail, School
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTeacherDashboardData } from "@/lib/actions/teacherDashboardActions";
import { getTeacherCalendarEvents } from "@/lib/actions/calendar-widget-actions";
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
    <div className="dashboard-grid">
      <StatsCard
        title="Students"
        value={(data.stats.studentsCount ?? 0).toString()}
        icon={<Users />}
        description="Active across classes"
        className="bg-blue-50/50 dark:bg-blue-900/10"
      />
      <StatsCard
        title="Pending Grading"
        value={(data.stats.assignmentsNeedingGrading ?? 0).toString()}
        icon={<FileText />}
        description="Needing attention"
        className="bg-rose-50/50 dark:bg-rose-900/10"
      />
      <StatsCard
        title="Upcoming Exams"
        value={(data.stats.upcomingExamsCount ?? 0).toString()}
        icon={<Calendar />}
        description="In next 7 days"
        className="bg-amber-50/50 dark:bg-amber-900/10"
      />
      <StatsCard
        title="Today's Classes"
        value={(data.stats.classesCount ?? 0).toString()}
        icon={<ClipboardCheck />}
        description={`${data.stats.attendancePercentage ?? 0}% attendance avg`}
        className="bg-emerald-50/50 dark:bg-emerald-900/10"
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
    <Card className="premium-card">
      <CardHeader className="px-0 pt-0">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">Today's Schedule</CardTitle>
            <CardDescription className="font-medium text-primary">{format(new Date(), "EEEE, MMMM d, yyyy")}</CardDescription>
          </div>
          <Link href="/teacher/teaching/timetable">
            <Button variant="outline" size="sm" className="hover-lift">
              Full Schedule
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {todayClasses.length > 0 ? (
          <div className="relative pt-4">
            <div className="absolute left-6 top-4 bottom-0 w-px bg-gradient-to-b from-primary via-primary/30 to-transparent"></div>
            <div className="space-y-8 pl-14">
              {todayClasses.map((cls) => (
                <div
                  key={cls.id}
                  className={`relative p-5 rounded-2xl border transition-all duration-300 group ${cls.status === 'completed' ? 'bg-muted/50 border-muted opacity-80' :
                    cls.status === 'next' ? 'border-primary/50 bg-primary/5 shadow-lg shadow-primary/5 ring-1 ring-primary/20 scale-[1.02]' :
                      'bg-card border-border hover:border-primary/30'
                    }`}
                >
                  <div className={`absolute -left-[38px] top-7 w-5 h-5 rounded-full z-10 border-4 border-background ${cls.status === 'completed' ? 'bg-muted-foreground' :
                    cls.status === 'next' ? 'bg-primary animate-pulse' :
                      'bg-border'
                    }`}></div>

                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-lg">{cls.subject}</h4>
                        {cls.status === 'next' && (
                          <Badge className="bg-primary text-primary-foreground animate-pulse">Next Class</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 items-center">
                        <span className="flex items-center gap-1">
                          <School className="h-3.5 w-3.5" />
                          {cls.className}{cls.sectionName ? ` • ${cls.sectionName}` : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                          {cls.room}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-1">
                      <div className="flex items-center gap-2 px-3 py-1 bg-secondary/50 rounded-full border border-secondary">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm font-bold">{cls.time}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 bg-muted/30 px-2 py-0.5 rounded">Topic: {cls.topic}</div>
                    </div>
                  </div>

                  {(cls.status === 'next' || cls.status === 'upcoming') && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link href={`/teacher/teaching/classes/${cls.classId}`}>
                        <Button size="sm" className="hover-lift">Class Details</Button>
                      </Link>
                      <Link href={`/teacher/attendance/mark?classId=${cls.classId}&sectionId=${cls.sectionId}`}>
                        <Button size="sm" variant="outline" className="hover-lift">Mark Attendance</Button>
                      </Link>
                    </div>
                  )}
                  {cls.status === 'completed' && (
                    <div className="mt-2 flex gap-1">
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        <CheckCircle className="h-3 w-3 mr-1" /> Completed
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed">
            <Calendar className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Free Day!</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">
              You don't have any classes scheduled for today. Time to catch up on grading or relax!
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
  const calendarEventsResult = await getTeacherCalendarEvents(5);

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
  const calendarEvents = (calendarEventsResult.success && calendarEventsResult.data) ? calendarEventsResult.data : [];

  return (
    <>
      {/* Announcements and Messages */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="premium-card hover-lift">
          <CardHeader className="px-0 pt-0">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl flex items-center gap-2 font-bold">
                  <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                    <Bell className="h-5 w-5" />
                  </div>
                  Announcements
                </CardTitle>
                <CardDescription>Stay updated with school news</CardDescription>
              </div>
              <Link href="/teacher/communication/announcements">
                <Button variant="outline" size="sm" className="hover-lift">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            {recentAnnouncements.length > 0 ? (
              <div className="space-y-4">
                {recentAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="p-4 border rounded-2xl hover:bg-accent/50 transition-all duration-300 hover:shadow-md">
                    <h4 className="font-bold">{announcement.title}</h4>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {announcement.content}
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {announcement.publisherName}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {announcement.createdAt}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/10 rounded-2xl border border-dashed">
                <Bell className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground/60">No recent announcements</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="premium-card hover-lift bg-gradient-to-br from-primary/5 via-transparent to-transparent">
          <CardHeader className="px-0 pt-0">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl flex items-center gap-2 font-bold">
                  <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                    <Mail className="h-5 w-5" />
                  </div>
                  Inbox
                </CardTitle>
                <CardDescription>Recent messages</CardDescription>
              </div>
              <Link href="/teacher/communication/messages">
                <Button variant="outline" size="sm" className="hover-lift">
                  Open Inbox
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <div className="space-y-4">
              <div className="p-8 border rounded-2xl text-center glass-card border-none shadow-premium">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 text-primary mb-5 shadow-inner">
                  <Mail className="h-10 w-10 animate-bounce" />
                </div>
                <h4 className="font-extrabold text-2xl mb-2 tracking-tight">
                  {unreadMessagesCount > 0 ? unreadMessagesCount : 'Clear'}
                </h4>
                <p className="text-sm font-medium text-muted-foreground mb-6 uppercase tracking-widest">
                  {unreadMessagesCount > 0 ? 'Messages Waiting' : 'Inbox Empty'}
                </p>
                <Link href="/teacher/communication/messages">
                  <Button className="w-full h-11 font-bold tracking-wide hover-lift shadow-lg shadow-primary/20">
                    {unreadMessagesCount > 0 ? 'Go to Inbox' : 'New Message'}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Lessons section */}
      <Card className="premium-card">
        <CardHeader className="px-0 pt-0">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-bold">Recent Lessons</CardTitle>
              <CardDescription>Your latest instructional content</CardDescription>
            </div>
            <Link href="/teacher/teaching/lessons">
              <Button variant="outline" size="sm" className="hover-lift">
                All Lessons
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="px-0 pt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentLessons.map((lesson) => (
              <Link href={`/teacher/teaching/lessons/${lesson.id}`} key={lesson.id} className="group">
                <div className="p-5 border rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 h-full flex flex-col justify-between shadow-sm hover:shadow-md">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-none">{lesson.subject}</Badge>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                        <Clock className="h-3 w-3" />
                        {lesson.duration} min
                      </div>
                    </div>
                    <h4 className="font-bold group-hover:text-primary transition-colors">{lesson.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{lesson.unit}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
        <CardFooter className="px-0 pt-6 border-t mt-4">
          <Link href="/teacher/teaching/lessons/create" className="w-full">
            <Button variant="outline" className="w-full h-12 font-bold hover:bg-primary hover:text-primary-foreground transition-all duration-300">
              <FileText className="mr-2 h-5 w-5" /> Create New Lesson
            </Button>
          </Link>
        </CardFooter>
      </Card>

      {/* Charts and Upcoming Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1 premium-card">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-bold">Attendance Overview</CardTitle>
            <CardDescription>By class performance</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Chart
              title=""
              data={studentAttendanceData}
              type="bar"
              xKey="class"
              yKey="present"
              categories={["present", "absent"]}
              colors={["var(--primary)", "#f59e0b"]}
            />
          </CardContent>
          <CardFooter className="px-0 pt-4">
            <Link href="/teacher/attendance/reports" className="w-full">
              <Button variant="ghost" className="w-full font-bold text-primary hover:bg-primary/5">Detailed Reports</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="lg:col-span-1 premium-card">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-bold">Assignment Status</CardTitle>
            <CardDescription>Submission lifecycle</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="h-[200px] flex items-center justify-center">
              <Chart
                title=""
                data={assignmentData}
                type="pie"
                xKey="status"
                yKey="count"
                categories={["count"]}
                colors={["#3b82f6", "#f59e0b", "#14b8a6", "#ef4444"]}
              />
            </div>
          </CardContent>
          <CardFooter className="px-0 pt-4">
            <Link href="/teacher/assessments/assignments" className="w-full">
              <Button variant="ghost" className="w-full font-bold text-primary hover:bg-primary/5">Manage All</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="lg:col-span-1 glass-card border-none overflow-hidden">
          <CardHeader className="pt-6 pb-2">
            <CardTitle className="text-lg font-bold">Calendar</CardTitle>
            <CardDescription>Upcoming schedule</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <CalendarWidget events={calendarEvents} userRole="TEACHER" className="border-none shadow-none p-0" />
          </CardContent>
          <CardFooter className="pb-6">
            <Link href="/teacher/calendar" className="w-full">
              <Button variant="secondary" className="w-full font-bold hover-lift">Full Calendar</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Tasks, Assignments, and Class Performance */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="premium-card">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-bold">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 border rounded-2xl hover:bg-accent/50 transition-all duration-300">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${task.priority === 'high' ? 'bg-rose-500/10 text-rose-600' :
                      task.priority === 'medium' ? 'bg-amber-500/10 text-amber-600' :
                        'bg-primary/10 text-primary'
                      }`}>
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold">{task.title}</p>
                      <div className="text-xs text-muted-foreground flex gap-3 items-center mt-1">
                        <span className="font-medium text-primary bg-primary/5 px-2 py-0.5 rounded">{task.class}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Due: {task.dueDate}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="hover:bg-emerald-500/10 hover:text-emerald-600 rounded-xl px-2">
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="px-0 pt-6 border-t mt-4 gap-3">
            <Button variant="outline" className="flex-1 font-bold rounded-xl h-11 hover-lift">All Tasks</Button>
            <Button className="flex-1 font-bold rounded-xl h-11 hover-lift">
              <Edit className="h-4 w-4 mr-2" /> New Task
            </Button>
          </CardFooter>
        </Card>

        <Card className="premium-card overflow-hidden">
          <Tabs defaultValue="assignments" className="w-full">
            <CardHeader className="px-0 pt-0">
              <div className="flex justify-between items-center bg-muted/30 p-1 rounded-2xl">
                <TabsList className="grid w-full grid-cols-2 bg-transparent">
                  <TabsTrigger value="assignments" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold">Assignments</TabsTrigger>
                  <TabsTrigger value="performance" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold">Performance</TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent className="px-0 pt-4">
              <TabsContent value="assignments" className="space-y-3 mt-0">
                {recentAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-2xl hover:border-primary/20 transition-all">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{assignment.title}</p>
                        <Badge className={assignment.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' : 'bg-muted text-muted-foreground'} variant="secondary">
                          {assignment.status === 'active' ? 'Active' : 'Ended'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex gap-3 items-center mt-2 font-medium">
                        <span className="bg-muted px-2 py-0.5 rounded">{assignment.class}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {assignment.dueDate}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Graded</div>
                      <div className="text-lg font-black text-primary">{assignment.submissions}</div>
                    </div>
                  </div>
                ))}
                <div className="flex gap-3 pt-6 border-t mt-4">
                  <Link href="/teacher/assessments/assignments" className="flex-1">
                    <Button variant="outline" className="w-full font-bold h-11 hover-lift rounded-xl">Manage</Button>
                  </Link>
                  <Link href="/teacher/assessments/assignments/create" className="flex-1">
                    <Button className="w-full font-bold h-11 hover-lift rounded-xl shadow-lg shadow-primary/20">New</Button>
                  </Link>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="mt-0">
                <div className="px-2">
                  <Chart
                    title="Class Performance Analysis"
                    data={classPerformanceData}
                    type="bar"
                    xKey="subject"
                    yKey="average"
                    categories={["average"]}
                    colors={["var(--primary)"]}
                  />
                </div>
                <div className="flex justify-center pt-6 border-t mt-4">
                  <Link href="/teacher/students/performance" className="w-full">
                    <Button variant="ghost" className="w-full font-bold text-primary h-11 hover:bg-primary/5 rounded-xl">View Comprehensive Analysis</Button>
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
export function QuickActionsSection() {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-6 tracking-tight">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Link href="/teacher/attendance/mark" className="group">
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 text-center hover-lift shadow-sm hover:shadow-md">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <span className="text-sm font-bold">Attendance</span>
          </div>
        </Link>
        <Link href="/teacher/assessments/assignments/create" className="group">
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 text-center hover-lift shadow-sm hover:shadow-md">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 group-hover:scale-110 transition-transform">
              <Edit className="h-6 w-6" />
            </div>
            <span className="text-sm font-bold">Assignment</span>
          </div>
        </Link>
        <Link href="/teacher/teaching/lessons/create" className="group">
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 text-center hover-lift shadow-sm hover:shadow-md">
            <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-600 group-hover:scale-110 transition-transform">
              <BookOpen className="h-6 w-6" />
            </div>
            <span className="text-sm font-bold">Lesson</span>
          </div>
        </Link>
        <Link href="/teacher/communication/messages/compose" className="group">
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 text-center hover-lift shadow-sm hover:shadow-md">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 group-hover:scale-110 transition-transform">
              <Mail className="h-6 w-6" />
            </div>
            <span className="text-sm font-bold">Message</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
