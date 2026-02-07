"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AttendanceOverview } from "@/components/student/attendance-overview";
import { UpcomingAssessments } from "@/components/student/upcoming-assessments";
import { SubjectPerformance } from "@/components/student/subject-performance";
import { TimeTablePreview } from "@/components/student/timetable-preview";
import { RecentAnnouncements } from "@/components/student/recent-announcements";
import { DashboardStats } from "@/components/student/dashboard-stats";
import { StudentCalendarWidgetSection } from "@/components/student/calendar-widget-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Trophy, 
  Target, 
  Zap, 
  Play, 
  RotateCcw, 
  Lightbulb,
  ArrowRight,
  Star,
  Flame
} from "lucide-react";
import {
  getStudentDashboardData,
  getStudentSubjectPerformance,
  getStudentTodaySchedule
} from "@/lib/actions/student-actions";
import { useMobileNavigation } from "@/hooks/use-mobile-navigation";

export default function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  
  // Get class level for mobile navigation
  const { isSimplified, isMobile } = useMobileNavigation({ 
    className: data?.student?.enrollments?.[0]?.class?.name || "Class 6" 
  });

  // Mock data for new features - replace with actual data fetching
  const mockLearningProgress = {
    currentLesson: {
      id: '1',
      title: 'Introduction to Photosynthesis',
      subject: 'Science',
      progress: 65,
      totalLessons: 12,
      completedLessons: 8
    },
    recentAchievements: [
      { id: '1', title: 'First Steps', icon: 'Star', points: 50, unlocked: true },
      { id: '2', title: 'Perfect Week', icon: 'Trophy', points: 200, unlocked: true },
      { id: '3', title: 'Study Streak', icon: 'Flame', points: 150, unlocked: false, progress: 4, maxProgress: 7 }
    ],
    studyStats: {
      totalXP: 1250,
      level: 8,
      streak: 12,
      notesCount: 15,
      flashcardsCount: 45,
      mindMapsCount: 3
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardData = await getStudentDashboardData();

        if (!dashboardData.student) {
          router.push("/login");
          return;
        }

        const [subjectPerformance, todaySchedule] = await Promise.all([
          getStudentSubjectPerformance(dashboardData.student.id),
          getStudentTodaySchedule(dashboardData.student.id)
        ]);

        setData({
          ...dashboardData,
          subjectPerformance,
          todaySchedule
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const { student, attendancePercentage, upcomingExams, pendingAssignments, recentAnnouncements, subjectPerformance, todaySchedule } = data;
  const currentEnrollment = student.enrollments[0];

  return (
    <div className="flex flex-col gap-10">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground mb-2">
            Hi, <span className="text-primary">{student.user.firstName}</span>! 👋
          </h1>
          <p className="text-muted-foreground font-medium text-lg max-w-2xl">
            You're doing great! Here's a quick look at your academic progress and today's agenda.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Session Active</span>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="dashboard-grid">
        <DashboardStats
          attendancePercentage={attendancePercentage}
          upcomingExamsCount={upcomingExams.length}
          pendingAssignmentsCount={pendingAssignments.length}
          className={currentEnrollment?.class?.name || "N/A"}
        />
      </div>

      {/* New Features Section - Enhanced Learning */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Your Learning Journey</h2>
          {!isSimplified && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                Level {mockLearningProgress.studyStats.level}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Flame className="h-3 w-3" />
                {mockLearningProgress.studyStats.streak} day streak
              </Badge>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Current Lesson Progress */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Play className="h-5 w-5 text-blue-500" />
                  Continue Learning
                </CardTitle>
                <Badge variant="secondary">{mockLearningProgress.currentLesson.subject}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">{mockLearningProgress.currentLesson.title}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{mockLearningProgress.currentLesson.progress}%</span>
                  </div>
                  <Progress value={mockLearningProgress.currentLesson.progress} />
                  <p className="text-xs text-muted-foreground">
                    {mockLearningProgress.currentLesson.completedLessons} of {mockLearningProgress.currentLesson.totalLessons} lessons completed
                  </p>
                </div>
              </div>
              <Link href={`/student/learn/lessons/${mockLearningProgress.currentLesson.id}`}>
                <Button className={`w-full ${isMobile ? 'touch-target-secondary' : ''}`}>
                  Continue Lesson
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockLearningProgress.recentAchievements.slice(0, 3).map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    achievement.unlocked ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {achievement.icon === 'Star' && <Star className="h-4 w-4" />}
                    {achievement.icon === 'Trophy' && <Trophy className="h-4 w-4" />}
                    {achievement.icon === 'Flame' && <Flame className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{achievement.title}</p>
                    {achievement.unlocked ? (
                      <p className="text-xs text-green-600">+{achievement.points} XP</p>
                    ) : (
                      <div className="space-y-1">
                        <Progress value={(achievement.progress! / achievement.maxProgress!) * 100} className="h-1" />
                        <p className="text-xs text-muted-foreground">
                          {achievement.progress}/{achievement.maxProgress}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <Link href="/student/achievements">
                <Button variant="outline" size="sm" className={`w-full ${isMobile ? 'touch-target-secondary' : ''}`}>
                  View All Achievements
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Study Tools Quick Access */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-500" />
                Study Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="space-y-1">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-xs font-medium">Notes</p>
                  <p className="text-xs text-muted-foreground">{mockLearningProgress.studyStats.notesCount}</p>
                </div>
                <div className="space-y-1">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                    <RotateCcw className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-xs font-medium">Cards</p>
                  <p className="text-xs text-muted-foreground">{mockLearningProgress.studyStats.flashcardsCount}</p>
                </div>
                <div className="space-y-1">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                    <Lightbulb className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="text-xs font-medium">Maps</p>
                  <p className="text-xs text-muted-foreground">{mockLearningProgress.studyStats.mindMapsCount}</p>
                </div>
              </div>
              <Link href="/student/study-tools">
                <Button variant="outline" className={`w-full ${isMobile ? 'touch-target-secondary' : ''}`}>
                  Open Study Tools
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="premium-card">
            <UpcomingAssessments exams={upcomingExams} assignments={pendingAssignments} />
          </div>
          <div className="premium-card">
            <SubjectPerformance data={subjectPerformance} />
          </div>
        </div>
        <div className="space-y-10">
          <div className="glass-card border-none">
            <AttendanceOverview attendancePercentage={attendancePercentage} />
          </div>
          <div className="premium-card">
            <TimeTablePreview schedule={todaySchedule} />
          </div>
          <div className="glass-card border-none overflow-hidden">
            <StudentCalendarWidgetSection />
          </div>
          <div className="premium-card">
            <RecentAnnouncements announcements={recentAnnouncements} />
          </div>
        </div>
      </div>
    </div>
  );
}

