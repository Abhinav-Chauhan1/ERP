"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ExamResult {
  id: string;
  marks: number;
  exam: {
    id: string;
    title: string;
    totalMarks: number;
    examDate: Date;
    subject: {
      name: string;
    };
  };
}

interface GradeTrendChartProps {
  examResults: ExamResult[];
  subjectName?: string;
}

export function GradeTrendChart({ examResults, subjectName }: GradeTrendChartProps) {
  // Filter by subject if specified
  const filteredResults = subjectName
    ? examResults.filter(r => r.exam.subject.name === subjectName)
    : examResults;

  // Sort by date
  const sortedResults = [...filteredResults].sort(
    (a, b) => new Date(a.exam.examDate).getTime() - new Date(b.exam.examDate).getTime()
  );

  if (sortedResults.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">No exam data available</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate percentages
  const dataPoints = sortedResults.map(result => ({
    ...result,
    percentage: (result.marks / result.exam.totalMarks) * 100
  }));

  // Calculate trend
  const firstScore = dataPoints[0].percentage;
  const lastScore = dataPoints[dataPoints.length - 1].percentage;
  const trend = lastScore - firstScore;
  const trendDirection = trend > 5 ? "up" : trend < -5 ? "down" : "stable";

  // Calculate average
  const average = dataPoints.reduce((sum, dp) => sum + dp.percentage, 0) / dataPoints.length;

  // Find max value for scaling
  const maxPercentage = Math.max(...dataPoints.map(dp => dp.percentage));
  const scale = 100 / Math.max(maxPercentage, 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Grade Trend
              {trendDirection === "up" && <TrendingUp className="h-5 w-5 text-green-600" />}
              {trendDirection === "down" && <TrendingDown className="h-5 w-5 text-red-600" />}
              {trendDirection === "stable" && <Minus className="h-5 w-5 text-amber-600" />}
            </CardTitle>
            <CardDescription>
              {subjectName || "All subjects"} • {sortedResults.length} exams
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{average.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Average</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart */}
        <div className="space-y-4">
          {/* Bar Chart */}
          <div className="space-y-3">
            {dataPoints.map((point, index) => (
              <div key={point.id} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground truncate max-w-[200px]">
                    {point.exam.title}
                  </span>
                  <Badge variant={
                    point.percentage >= 90 ? "default" :
                    point.percentage >= 75 ? "secondary" : "outline"
                  }>
                    {point.percentage.toFixed(0)}%
                  </Badge>
                </div>
                <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-lg transition-all ${
                      point.percentage >= 90 ? "bg-green-500" :
                      point.percentage >= 75 ? "bg-primary" :
                      point.percentage >= 60 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${point.percentage}%` }}
                  >
                    <div className="flex items-center justify-end h-full px-2">
                      <span className="text-xs font-medium text-white">
                        {point.marks}/{point.exam.totalMarks}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trend Summary */}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">First Exam</p>
                <p className="text-lg font-semibold">{firstScore.toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Latest Exam</p>
                <p className="text-lg font-semibold">{lastScore.toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Change</p>
                <p className={`text-lg font-semibold ${
                  trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-amber-600"
                }`}>
                  {trend > 0 ? "+" : ""}{trend.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
