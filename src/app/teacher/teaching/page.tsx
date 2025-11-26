import Link from "next/link";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Chart } from "@/components/dashboard/chart";
import { 
  BookOpen, Users, Calendar, Clock, FileText, 
  TrendingUp, CheckCircle, AlertCircle, Play
} from "lucide-react";
import { getTeacherClasses } from "@/lib/actions/teacherClassesActions";
import { getTeacherSubjects } from "@/lib/actions/teacherSubjectsActions";
import { getTeacherTimetable } from "@/lib/actions/teacherTimetableActions";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = 'force-dynamic';

export default async function TeachingOverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teaching Overview</h1>
          <p className="text-muted-foreground">Summary of your teaching activities and responsibilities</p>
        </div>
      </div>

      <Suspense fallback={<StatsSkeletons />}>
        <TeachingStats />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<CardSkeleton />}>
          <SubjectsOverview />
        </Suspense>

        <Suspense fallback={<CardSkeleton />}>
          <ClassesOverview />
        </Suspense>
      </div>

      <Suspense fallback={<CardSkeleton />}>
        <TimetableOverview />
      </Suspense>

      <Suspense fallback={<CardSkeleton />}>
        <SyllabusProgressOverview />
      </Suspense>

      <QuickNavigationSection />
    </div>
  );
}

/**
 * Teaching statistics section
 */
async function TeachingStats() {
  const { subjects } = await getTeacherSubjects();
  const { classes } = await getTeacherClasses();
  const { slots } = await getTeacherTimetable();

  // Calculate statistics
  const totalSubjects = subjects.length;
  const totalClasses = classes.length;
  const totalStudents = classes.reduce((sum, cls) => sum + cls.studentCount, 0);
  const totalLessons = subjects.reduce((sum, subject) => sum + (subject.totalClasses || 0), 0);
  
  // Calculate average syllabus progress
  const avgProgress = subjects.length > 0
    ? Math.round(subjects.reduce((sum, subject) => sum + subject.progress, 0) / subjects.length)
    : 0;

  // Count weekly classes
  const weeklyClasses = slots.length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Subjects"
        value={totalSubjects.toString()}
        icon={<BookOpen className="h-5 w-5" />}
        description="Subjects you teach"
      />
      <StatsCard
        title="Total Classes"
        value={totalClasses.toString()}
        icon={<Users className="h-5 w-5" />}
        description={`${totalStudents} students`}
      />
      <StatsCard
        title="Weekly Schedule"
        value={weeklyClasses.toString()}
        icon={<Calendar className="h-5 w-5" />}
        description="Classes per week"
      />
      <StatsCard
        title="Syllabus Progress"
        value={`${avgProgress}%`}
        icon={<TrendingUp className="h-5 w-5" />}
        description="Average completion"
      />
    </div>
  );
}

/**
 * Subjects overview section
 */
async function SubjectsOverview() {
  const { subjects } = await getTeacherSubjects();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">My Subjects</CardTitle>
            <CardDescription>{subjects.length} subjects assigned</CardDescription>
          </div>
          <Link href="/teacher/teaching/subjects">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {subjects.slice(0, 5).map((subject) => (
            <div key={subject.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">{subject.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {subject.grade} • {subject.sections.join(", ")}
                  </p>
                </div>
                <Badge variant={subject.progress >= 75 ? "default" : subject.progress >= 50 ? "secondary" : "outline"}>
                  {subject.progress}% Complete
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <span>{subject.totalStudents} students</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  <span>{subject.completedTopics}/{subject.totalTopics} topics</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all" 
                    style={{ width: `${subject.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {subjects.length === 0 && (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-muted mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No subjects assigned yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Classes overview section
 */
async function ClassesOverview() {
  const { classes } = await getTeacherClasses();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">My Classes</CardTitle>
            <CardDescription>{classes.length} classes assigned</CardDescription>
          </div>
          <Link href="/teacher/teaching/classes">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {classes.slice(0, 5).map((cls) => (
            <Link href={`/teacher/teaching/classes/${cls.id}`} key={cls.id}>
              <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{cls.name}-{cls.section}</h4>
                    <p className="text-sm text-muted-foreground">{cls.subject}</p>
                  </div>
                  {cls.isClassHead && (
                    <Badge variant="secondary">Class Head</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>{cls.studentCount} students</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{cls.scheduleDay}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{cls.scheduleTime}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {classes.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No classes assigned yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Timetable overview section
 */
async function TimetableOverview() {
  const { slots, weekdays } = await getTeacherTimetable();

  // Group slots by day
  const slotsByDay = slots.reduce((acc, slot) => {
    if (!acc[slot.day]) {
      acc[slot.day] = [];
    }
    acc[slot.day].push(slot);
    return acc;
  }, {} as Record<string, (typeof slots)[number][]>);

  // Get today's day
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const todaySlots = slotsByDay[today] || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Weekly Timetable</CardTitle>
            <CardDescription>{slots.length} classes scheduled per week</CardDescription>
          </div>
          <Link href="/teacher/teaching/timetable">
            <Button variant="outline" size="sm">
              Full Schedule
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Today's classes */}
          {todaySlots.length > 0 && (
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Today's Classes ({todaySlots.length})
              </h3>
              <div className="space-y-2">
                {todaySlots.map((slot) => (
                  <div key={slot.id} className="p-3 border rounded-lg bg-primary/5 border-primary/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{slot.subject}</p>
                        <p className="text-sm text-muted-foreground">{slot.class}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium">{slot.timeStart} - {slot.timeEnd}</p>
                        <p className="text-muted-foreground">{slot.room}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly distribution */}
          <div>
            <h3 className="font-medium mb-3">Weekly Distribution</h3>
            <div className="grid grid-cols-5 gap-2">
              {weekdays.slice(0, 5).map((day) => {
                const daySlots = slotsByDay[day] || [];
                const isToday = day === today;
                return (
                  <div 
                    key={day} 
                    className={`p-3 border rounded-lg text-center ${
                      isToday ? 'bg-primary/10 border-primary' : 'bg-background'
                    }`}
                  >
                    <p className="text-xs font-medium mb-1">{day.slice(0, 3)}</p>
                    <p className="text-2xl font-bold">{daySlots.length}</p>
                    <p className="text-xs text-muted-foreground">classes</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Syllabus progress overview section
 */
async function SyllabusProgressOverview() {
  const { subjects } = await getTeacherSubjects();

  // Prepare data for chart
  const chartData = subjects.map(subject => ({
    subject: subject.name,
    completed: subject.completedTopics,
    remaining: subject.totalTopics - subject.completedTopics,
    progress: subject.progress
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Syllabus Progress</CardTitle>
            <CardDescription>Topic completion across all subjects</CardDescription>
          </div>
          <Link href="/teacher/teaching/syllabus">
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {subjects.length > 0 ? (
          <div className="space-y-6">
            <Chart
              title=""
              data={chartData}
              type="bar"
              xKey="subject"
              yKey="completed"
              categories={["completed", "remaining"]}
              colors={["hsl(var(--primary))", "hsl(var(--muted))"]}
            />
            <div className="grid gap-3">
              {subjects.map((subject) => (
                <div key={subject.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {subject.progress >= 75 ? (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    ) : subject.progress >= 50 ? (
                      <Clock className="h-5 w-5 text-warning" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">{subject.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {subject.completedTopics} of {subject.totalTopics} topics completed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{subject.progress}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No syllabus data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Quick navigation section
 */
function QuickNavigationSection() {
  const navigationItems = [
    {
      title: "Subjects",
      description: "View and manage your subjects",
      href: "/teacher/teaching/subjects",
      icon: BookOpen,
      color: "bg-primary/10 text-primary"
    },
    {
      title: "Classes",
      description: "Access your class details",
      href: "/teacher/teaching/classes",
      icon: Users,
      color: "bg-accent/50 text-accent-foreground"
    },
    {
      title: "Timetable",
      description: "View your weekly schedule",
      href: "/teacher/teaching/timetable",
      icon: Calendar,
      color: "bg-secondary text-secondary-foreground"
    },
    {
      title: "Lessons",
      description: "Create and manage lessons",
      href: "/teacher/teaching/lessons",
      icon: Play,
      color: "bg-warning/10 text-warning"
    },
    {
      title: "Syllabus",
      description: "Track syllabus progress",
      href: "/teacher/teaching/syllabus",
      icon: FileText,
      color: "bg-chart-3/10 text-chart-3"
    }
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Quick Navigation</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {navigationItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="flex flex-col items-center gap-3 p-4 rounded-lg border bg-background hover:border-primary hover:bg-primary/5 transition-colors text-center h-full">
              <div className={`p-3 rounded-full ${item.color}`}>
                <item.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium mb-1">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton loaders
 */
function StatsSkeletons() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-5 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
