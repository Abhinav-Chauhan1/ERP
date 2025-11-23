"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Clock,
} from "lucide-react";
import { getExamAnalytics } from "@/lib/actions/examAnalyticsActions";
import { toast } from "react-hot-toast";

interface ExamAnalyticsProps {
  examId: string;
}

export function ExamAnalytics({ examId }: ExamAnalyticsProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const result = await getExamAnalytics(examId);
        if (result.success && result.analytics) {
          setAnalytics(result.analytics);
        } else {
          toast.error(result.error || "Failed to fetch analytics");
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
        toast.error("An error occurred while fetching analytics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [examId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No analytics data available
      </div>
    );
  }

  const { overallStats, questionAnalytics, difficultQuestions, easyQuestions, topicPerformance, scoreDistribution, timeAnalytics } = analytics;

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats.averageScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overallStats.averagePercentage.toFixed(1)}% average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Highest Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">
                {overallStats.highestScore.toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((overallStats.highestScore / analytics.exam.totalMarks) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lowest Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold">
                {overallStats.lowestScore.toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((overallStats.lowestScore / analytics.exam.totalMarks) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats.completedAttempts} / {overallStats.totalAttempts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((overallStats.completedAttempts / overallStats.totalAttempts) * 100).toFixed(0)}% completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Score Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Score Distribution</CardTitle>
          <CardDescription>
            Distribution of student scores across different ranges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scoreDistribution.map((range: any) => (
              <div key={range.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{range.label}</span>
                  <span className="text-muted-foreground">
                    {range.count} student{range.count !== 1 ? "s" : ""}
                  </span>
                </div>
                <Progress
                  value={
                    overallStats.completedAttempts > 0
                      ? (range.count / overallStats.completedAttempts) * 100
                      : 0
                  }
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Difficult Questions */}
      {difficultQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Difficult Questions
            </CardTitle>
            <CardDescription>
              Questions with success rate below 40% - consider reviewing these topics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {difficultQuestions.map((q: any, index: number) => (
                <div key={q.questionId} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium line-clamp-2">{q.question}</p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge variant="outline">{q.questionType}</Badge>
                        {q.topic && <Badge variant="outline">{q.topic}</Badge>}
                        <Badge variant="outline">{q.marks} marks</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className="font-medium text-red-600">
                        {q.successRate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={q.successRate} className="h-2" />
                    <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                      <span>✓ {q.correctCount} correct</span>
                      <span>✗ {q.incorrectCount} incorrect</span>
                      <span>- {q.unansweredCount} unanswered</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Easy Questions */}
      {easyQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Well-Understood Questions
            </CardTitle>
            <CardDescription>
              Questions with success rate above 80%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {easyQuestions.slice(0, 5).map((q: any) => (
                <div key={q.questionId} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium line-clamp-2">{q.question}</p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge variant="outline">{q.questionType}</Badge>
                        {q.topic && <Badge variant="outline">{q.topic}</Badge>}
                        <Badge variant="outline">{q.marks} marks</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className="font-medium text-green-600">
                        {q.successRate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={q.successRate} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Topic-wise Performance */}
      {topicPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Topic-wise Performance
            </CardTitle>
            <CardDescription>
              Performance breakdown by topic
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topicPerformance.map((topic: any) => (
                <div key={topic.topic} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{topic.topic}</div>
                      <div className="text-sm text-muted-foreground">
                        {topic.totalQuestions} question{topic.totalQuestions !== 1 ? "s" : ""} • {topic.totalMarks} marks
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {topic.averageSuccessRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {topic.averageScore.toFixed(1)} avg
                      </div>
                    </div>
                  </div>
                  <Progress value={topic.averageSuccessRate} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Analytics */}
      {timeAnalytics.averageTimeTaken > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Analytics
            </CardTitle>
            <CardDescription>
              Time taken by students to complete the exam
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="font-medium">Average Time Taken</span>
                <span className="text-2xl font-bold">
                  {timeAnalytics.averageTimeTaken.toFixed(0)} min
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Exam Duration: {analytics.exam.duration} minutes
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question-wise Analytics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Question-wise Analysis</CardTitle>
          <CardDescription>
            Detailed performance metrics for each question
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {questionAnalytics.map((q: any, index: number) => (
              <div
                key={q.questionId}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-muted-foreground">
                        Q{index + 1}
                      </span>
                      <p className="font-medium line-clamp-1">{q.question}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {q.questionType}
                      </Badge>
                      {q.topic && (
                        <Badge variant="outline" className="text-xs">
                          {q.topic}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {q.marks} marks
                      </Badge>
                      <Badge
                        variant={
                          q.perceivedDifficulty === "EASY"
                            ? "default"
                            : q.perceivedDifficulty === "MEDIUM"
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {q.perceivedDifficulty}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold">
                      {q.successRate.toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {q.correctCount}/{q.totalResponses}
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <Progress value={q.successRate} className="h-1.5" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
