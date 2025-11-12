"use client";

import { useState } from "react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { GradeTrendData } from "@/types/performance";

interface PerformanceChartProps {
  subjectTrends: GradeTrendData[];
  studentName?: string;
}

export function PerformanceChart({ subjectTrends, studentName }: PerformanceChartProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>(
    subjectTrends.length > 0 ? subjectTrends[0].subjectId : ""
  );

  const currentSubjectData = subjectTrends.find(s => s.subjectId === selectedSubject);

  const chartData = currentSubjectData?.dataPoints.map(point => ({
    name: format(new Date(point.examDate), "MMM d"),
    fullDate: format(new Date(point.examDate), "MMM d, yyyy"),
    examTitle: point.examTitle,
    studentPercentage: parseFloat(point.percentage.toFixed(1)),
    classAverage: parseFloat(point.classAverage.toFixed(1)),
    marks: point.marks,
    totalMarks: point.totalMarks,
    grade: point.grade,
  })) || [];

  const getTrendIcon = (trend: "improving" | "declining" | "stable") => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "declining":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendBadge = (trend: "improving" | "declining" | "stable") => {
    switch (trend) {
      case "improving":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <TrendingUp className="h-3 w-3 mr-1" />
            Improving
          </Badge>
        );
      case "declining":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <TrendingDown className="h-3 w-3 mr-1" />
            Declining
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <Minus className="h-3 w-3 mr-1" />
            Stable
          </Badge>
        );
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-sm mb-2">{data.examTitle}</p>
          <p className="text-xs text-gray-500 mb-2">{data.fullDate}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-blue-600">Student:</span>
              <span className="text-xs font-medium">{data.studentPercentage}%</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-gray-600">Class Avg:</span>
              <span className="text-xs font-medium">{data.classAverage}%</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-gray-600">Marks:</span>
              <span className="text-xs font-medium">{data.marks}/{data.totalMarks}</span>
            </div>
            {data.grade && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-gray-600">Grade:</span>
                <span className="text-xs font-medium">{data.grade}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (subjectTrends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">No performance data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Performance Trends</CardTitle>
            {studentName && (
              <p className="text-sm text-muted-foreground mt-1">{studentName}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {currentSubjectData && getTrendBadge(currentSubjectData.overallTrend)}
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjectTrends.map((subject) => (
                  <SelectItem key={subject.subjectId} value={subject.subjectId}>
                    {subject.subjectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {currentSubjectData && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-600 mb-1">Average</p>
                <p className="text-lg font-bold text-blue-700">
                  {currentSubjectData.averagePercentage.toFixed(1)}%
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Total Exams</p>
                <p className="text-lg font-bold text-gray-700">
                  {currentSubjectData.dataPoints.length}
                </p>
              </div>

              <div className={`p-3 rounded-lg ${
                currentSubjectData.improvementRate >= 0 ? "bg-green-50" : "bg-red-50"
              }`}>
                <p className={`text-xs mb-1 ${
                  currentSubjectData.improvementRate >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  Improvement
                </p>
                <p className={`text-lg font-bold ${
                  currentSubjectData.improvementRate >= 0 ? "text-green-700" : "text-red-700"
                }`}>
                  {currentSubjectData.improvementRate > 0 ? "+" : ""}
                  {currentSubjectData.improvementRate.toFixed(1)}%
                </p>
              </div>

              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-xs text-purple-600 mb-1 flex items-center gap-1">
                  Trend {getTrendIcon(currentSubjectData.overallTrend)}
                </p>
                <p className="text-sm font-medium text-purple-700 capitalize">
                  {currentSubjectData.overallTrend}
                </p>
              </div>
            </div>

            {/* Chart */}
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    stroke="#888"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    stroke="#888"
                    label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    iconType="line"
                  />
                  <Line
                    type="monotone"
                    dataKey="studentPercentage"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Student Performance"
                    dot={{ fill: "#3b82f6", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="classAverage"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Class Average"
                    dot={{ fill: "#94a3b8", r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Insights */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Performance Insights</h4>
              <div className="space-y-2 text-sm text-gray-600">
                {currentSubjectData.overallTrend === "improving" && (
                  <p>
                    Great progress! Performance has improved by{" "}
                    <span className="font-medium text-green-600">
                      {currentSubjectData.improvementRate.toFixed(1)}%
                    </span>{" "}
                    over time.
                  </p>
                )}
                {currentSubjectData.overallTrend === "declining" && (
                  <p>
                    Performance has declined by{" "}
                    <span className="font-medium text-red-600">
                      {Math.abs(currentSubjectData.improvementRate).toFixed(1)}%
                    </span>
                    . Consider additional support in this subject.
                  </p>
                )}
                {currentSubjectData.overallTrend === "stable" && (
                  <p>
                    Performance has remained consistent with an average of{" "}
                    <span className="font-medium">
                      {currentSubjectData.averagePercentage.toFixed(1)}%
                    </span>
                    .
                  </p>
                )}
                <p>
                  Based on {currentSubjectData.dataPoints.length} exam{currentSubjectData.dataPoints.length !== 1 ? "s" : ""} in {currentSubjectData.subjectName}.
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
