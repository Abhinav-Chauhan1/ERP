"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseProgressTrackerProps {
  progress: number; // 0-100
  completedLessons: number;
  totalLessons: number;
  showDetails?: boolean;
  className?: string;
}

export function CourseProgressTracker({
  progress,
  completedLessons,
  totalLessons,
  showDetails = false,
  className,
}: CourseProgressTrackerProps) {
  const progressPercentage = Math.min(Math.max(progress, 0), 100);
  const isComplete = progressPercentage === 100;
  const remainingLessons = totalLessons - completedLessons;

  const getProgressColor = () => {
    if (progressPercentage === 0) return "text-muted-foreground";
    if (progressPercentage < 30) return "text-red-600 dark:text-red-400";
    if (progressPercentage < 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  const getProgressBadgeVariant = () => {
    if (isComplete) return "default";
    if (progressPercentage < 30) return "destructive";
    if (progressPercentage < 70) return "secondary";
    return "default";
  };

  if (!showDetails) {
    // Compact view - just progress bar and percentage
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Progress</span>
          </div>
          <span className={cn("text-sm font-semibold", getProgressColor())}>
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {completedLessons} of {totalLessons} lessons completed
        </p>
      </div>
    );
  }

  // Detailed view - card with more information
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Course Progress</CardTitle>
          <Badge variant={getProgressBadgeVariant()}>
            {isComplete ? (
              <>
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Complete
              </>
            ) : (
              `${Math.round(progressPercentage)}%`
            )}
          </Badge>
        </div>
        <CardDescription>
          Track your learning journey through this course
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-3" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completedLessons} completed
            </span>
            <span className={cn("font-semibold", getProgressColor())}>
              {Math.round(progressPercentage)}%
            </span>
          </div>
        </div>

        {/* Lesson Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Lessons</p>
            <p className="text-2xl font-bold">{totalLessons}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Completed</p>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {completedLessons}
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Remaining</p>
            <div className="flex items-center gap-1">
              <Circle className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{remainingLessons}</p>
            </div>
          </div>
        </div>

        {/* Completion Message */}
        {isComplete ? (
          <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  Congratulations!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  You&apos;ve completed all lessons in this course. Great job!
                </p>
              </div>
            </div>
          </div>
        ) : remainingLessons > 0 && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Keep Going!
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {remainingLessons} lesson{remainingLessons !== 1 ? "s" : ""} remaining to complete this course.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
