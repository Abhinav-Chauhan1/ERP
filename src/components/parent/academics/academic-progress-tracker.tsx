"use client";

import { BookOpen, CheckCircle, Target, TrendingUp, Award, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface CurriculumProgress {
  subjectId: string;
  subjectName: string;
  totalUnits: number;
  totalLessons: number;
  completionPercentage: number;
  completedUnits: number;
  completedLessons: number;
}

interface AcademicProgressTrackerProps {
  curriculumCompletion: CurriculumProgress[];
  studentName?: string;
  className?: string;
  academicYear?: string;
}

export function AcademicProgressTracker({ 
  curriculumCompletion, 
  studentName,
  className,
  academicYear 
}: AcademicProgressTrackerProps) {
  // Calculate overall progress
  const overallProgress = curriculumCompletion.length > 0
    ? Math.round(
        curriculumCompletion.reduce((sum, subject) => sum + subject.completionPercentage, 0) / 
        curriculumCompletion.length
      )
    : 0;

  const totalUnits = curriculumCompletion.reduce((sum, subject) => sum + subject.totalUnits, 0);
  const completedUnits = curriculumCompletion.reduce((sum, subject) => sum + subject.completedUnits, 0);
  const totalLessons = curriculumCompletion.reduce((sum, subject) => sum + subject.totalLessons, 0);
  const completedLessons = curriculumCompletion.reduce((sum, subject) => sum + subject.completedLessons, 0);

  // Categorize subjects by progress
  const excellentProgress = curriculumCompletion.filter(s => s.completionPercentage >= 80).length;
  const goodProgress = curriculumCompletion.filter(s => s.completionPercentage >= 60 && s.completionPercentage < 80).length;
  const needsAttention = curriculumCompletion.filter(s => s.completionPercentage < 60).length;

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-blue-500";
    if (percentage >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getProgressBadge = (percentage: number) => {
    if (percentage >= 80) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <TrendingUp className="h-3 w-3 mr-1" />
          Excellent
        </Badge>
      );
    }
    if (percentage >= 60) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Target className="h-3 w-3 mr-1" />
          On Track
        </Badge>
      );
    }
    if (percentage >= 40) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Target className="h-3 w-3 mr-1" />
          Progressing
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        <Target className="h-3 w-3 mr-1" />
        Needs Attention
      </Badge>
    );
  };

  const getMilestoneIcon = (percentage: number) => {
    if (percentage >= 75) {
      return <Award className="h-5 w-5 text-yellow-500" />;
    }
    if (percentage >= 50) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <Target className="h-5 w-5 text-blue-500" />;
  };

  if (curriculumCompletion.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Academic Progress Tracker</CardTitle>
          {studentName && (
            <p className="text-sm text-muted-foreground">{studentName}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No curriculum data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Academic Progress Tracker</CardTitle>
            {studentName && (
              <p className="text-sm text-muted-foreground mt-1">{studentName}</p>
            )}
            {academicYear && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {academicYear}
              </p>
            )}
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {curriculumCompletion.length} Subjects
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Progress Card */}
        <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg p-6 border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Overall Academic Progress</h3>
              <p className="text-sm text-gray-600 mt-1">Academic Year Completion</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-600">{overallProgress}%</div>
              {getProgressBadge(overallProgress)}
            </div>
          </div>
          <Progress 
            value={overallProgress} 
            className="h-3"
          />
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{completedUnits}</p>
              <p className="text-xs text-gray-600">Units Completed</p>
              <p className="text-xs text-gray-400">of {totalUnits}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{completedLessons}</p>
              <p className="text-xs text-gray-600">Lessons Completed</p>
              <p className="text-xs text-gray-400">of {totalLessons}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{curriculumCompletion.length}</p>
              <p className="text-xs text-gray-600">Active Subjects</p>
            </div>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 p-3 rounded-lg border border-green-100">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <p className="text-xs text-green-600 font-medium">Excellent</p>
            </div>
            <p className="text-2xl font-bold text-green-700">{excellentProgress}</p>
            <p className="text-xs text-gray-600">80%+ complete</p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-blue-600 font-medium">On Track</p>
            </div>
            <p className="text-2xl font-bold text-blue-700">{goodProgress}</p>
            <p className="text-xs text-gray-600">60-79% complete</p>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-yellow-600" />
              <p className="text-xs text-yellow-600 font-medium">Attention</p>
            </div>
            <p className="text-2xl font-bold text-yellow-700">{needsAttention}</p>
            <p className="text-xs text-gray-600">&lt;60% complete</p>
          </div>
        </div>

        {/* Subject-wise Progress */}
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Subject-wise Progress
          </h3>
          <div className="space-y-3">
            {curriculumCompletion
              .sort((a, b) => b.completionPercentage - a.completionPercentage)
              .map((subject) => (
                <div
                  key={subject.subjectId}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {getMilestoneIcon(subject.completionPercentage)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{subject.subjectName}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                          <span>{subject.completedUnits} / {subject.totalUnits} units</span>
                          <span>•</span>
                          <span>{subject.completedLessons} / {subject.totalLessons} lessons</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900 mb-1">
                        {subject.completionPercentage}%
                      </div>
                      {getProgressBadge(subject.completionPercentage)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Progress 
                      value={subject.completionPercentage} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Progress</span>
                      <span>
                        {subject.completionPercentage >= 100 
                          ? "Completed" 
                          : `${100 - subject.completionPercentage}% remaining`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Learning Milestones */}
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Award className="h-4 w-4" />
            Learning Milestones
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className={cn(
              "p-4 rounded-lg border-2 transition-all",
              overallProgress >= 25 
                ? "bg-green-50 border-green-200" 
                : "bg-gray-50 border-gray-200"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-full",
                  overallProgress >= 25 ? "bg-green-100" : "bg-gray-200"
                )}>
                  {overallProgress >= 25 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Target className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">First Quarter</p>
                  <p className="text-xs text-gray-600">25% Completion</p>
                </div>
              </div>
            </div>

            <div className={cn(
              "p-4 rounded-lg border-2 transition-all",
              overallProgress >= 50 
                ? "bg-green-50 border-green-200" 
                : "bg-gray-50 border-gray-200"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-full",
                  overallProgress >= 50 ? "bg-green-100" : "bg-gray-200"
                )}>
                  {overallProgress >= 50 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Target className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">Mid-Year</p>
                  <p className="text-xs text-gray-600">50% Completion</p>
                </div>
              </div>
            </div>

            <div className={cn(
              "p-4 rounded-lg border-2 transition-all",
              overallProgress >= 75 
                ? "bg-green-50 border-green-200" 
                : "bg-gray-50 border-gray-200"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-full",
                  overallProgress >= 75 ? "bg-green-100" : "bg-gray-200"
                )}>
                  {overallProgress >= 75 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Target className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">Third Quarter</p>
                  <p className="text-xs text-gray-600">75% Completion</p>
                </div>
              </div>
            </div>

            <div className={cn(
              "p-4 rounded-lg border-2 transition-all",
              overallProgress >= 100 
                ? "bg-green-50 border-green-200" 
                : "bg-gray-50 border-gray-200"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-full",
                  overallProgress >= 100 ? "bg-green-100" : "bg-gray-200"
                )}>
                  {overallProgress >= 100 ? (
                    <Award className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <Target className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">Year Complete</p>
                  <p className="text-xs text-gray-600">100% Completion</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500 mb-2">Progress Indicators:</p>
          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>80%+ (Excellent)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>60-79% (On Track)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>40-59% (Progressing)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>&lt;40% (Needs Attention)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
