"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { TermPerformance } from "@/types/performance";

interface GradeTrendChartProps {
  termHistory: TermPerformance[];
  studentName?: string;
}

type ViewMode = "subjects" | "terms";

export function GradeTrendChart({ termHistory, studentName }: GradeTrendChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("subjects");
  const [selectedTerm, setSelectedTerm] = useState<string>(
    termHistory.length > 0 ? termHistory[termHistory.length - 1].termId : ""
  );

  // Get current term data
  const currentTerm = termHistory.find(t => t.termId === selectedTerm);

  // Prepare subject-wise data for current term
  const subjectData = currentTerm?.subjects.map(subject => ({
    name: subject.subjectName,
    percentage: parseFloat(subject.averagePercentage.toFixed(1)),
    exams: subject.totalExams,
    trend: subject.trend,
  })) || [];

  // Prepare term comparison data
  const termComparisonData = termHistory.map(term => ({
    name: term.termName,
    percentage: parseFloat(term.averagePercentage.toFixed(1)),
    grade: term.grade,
    exams: term.totalExams,
  }));

  // Color coding based on performance
  const getBarColor = (percentage: number) => {
    if (percentage >= 90) return "#10b981"; // green
    if (percentage >= 80) return "#3b82f6"; // blue
    if (percentage >= 70) return "#8b5cf6"; // purple
    if (percentage >= 60) return "#f59e0b"; // yellow
    if (percentage >= 50) return "#f97316"; // orange
    return "#ef4444"; // red
  };

  const getTrendIcon = (trend: "improving" | "declining" | "stable") => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case "declining":
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <Minus className="h-3 w-3 text-gray-600" />;
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-sm mb-2">{data.name}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-gray-600">Percentage:</span>
              <span className="text-xs font-medium">{data.percentage}%</span>
            </div>
            {data.grade && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-gray-600">Grade:</span>
                <span className="text-xs font-medium">{data.grade}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-gray-600">Exams:</span>
              <span className="text-xs font-medium">{data.exams}</span>
            </div>
            {data.trend && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-gray-600">Trend:</span>
                <span className="text-xs font-medium capitalize flex items-center gap-1">
                  {getTrendIcon(data.trend)}
                  {data.trend}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (termHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Grade Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">No grade data available</p>
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
            <CardTitle>Grade Distribution</CardTitle>
            {studentName && (
              <p className="text-sm text-muted-foreground mt-1">{studentName}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="subjects">By Subject</SelectItem>
                <SelectItem value="terms">By Term</SelectItem>
              </SelectContent>
            </Select>

            {viewMode === "subjects" && (
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {termHistory.map((term) => (
                    <SelectItem key={term.termId} value={term.termId}>
                      {term.termName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Summary Stats */}
        {viewMode === "subjects" && currentTerm && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-600 mb-1">Term Average</p>
              <p className="text-lg font-bold text-blue-700">
                {currentTerm.averagePercentage.toFixed(1)}%
              </p>
            </div>

            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-xs text-purple-600 mb-1">Overall Grade</p>
              <p className="text-lg font-bold text-purple-700">
                {currentTerm.grade || "N/A"}
              </p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Total Subjects</p>
              <p className="text-lg font-bold text-gray-700">
                {currentTerm.subjects.length}
              </p>
            </div>

            {currentTerm.rank && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-xs text-yellow-600 mb-1">Class Rank</p>
                <p className="text-lg font-bold text-yellow-700">
                  #{currentTerm.rank}
                </p>
              </div>
            )}
          </div>
        )}

        {viewMode === "terms" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-600 mb-1">Total Terms</p>
              <p className="text-lg font-bold text-blue-700">
                {termHistory.length}
              </p>
            </div>

            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs text-green-600 mb-1">Best Performance</p>
              <p className="text-lg font-bold text-green-700">
                {Math.max(...termHistory.map(t => t.averagePercentage)).toFixed(1)}%
              </p>
            </div>

            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-xs text-purple-600 mb-1">Latest Grade</p>
              <p className="text-lg font-bold text-purple-700">
                {termHistory[termHistory.length - 1]?.grade || "N/A"}
              </p>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={viewMode === "subjects" ? subjectData : termComparisonData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                stroke="#888"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                stroke="#888"
                label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 20 }}
                iconType="rect"
              />
              <Bar
                dataKey="percentage"
                name="Performance"
                radius={[8, 8, 0, 0]}
              >
                {(viewMode === "subjects" ? subjectData : termComparisonData).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Trends (only in subject view) */}
        {viewMode === "subjects" && currentTerm && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Subject Performance Trends</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentTerm.subjects.map((subject) => (
                <div
                  key={subject.subjectId}
                  className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium truncate">{subject.subjectName}</p>
                    {getTrendIcon(subject.trend)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{subject.averagePercentage.toFixed(1)}%</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {subject.trend}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Term Comparison Insights */}
        {viewMode === "terms" && termHistory.length >= 2 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Performance Insights</h4>
            <div className="space-y-2 text-sm text-gray-600">
              {(() => {
                const latest = termHistory[termHistory.length - 1];
                const previous = termHistory[termHistory.length - 2];
                const improvement = latest.averagePercentage - previous.averagePercentage;

                if (improvement > 5) {
                  return (
                    <p className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>
                        Great improvement! Performance increased by{" "}
                        <span className="font-medium text-green-600">
                          {improvement.toFixed(1)}%
                        </span>{" "}
                        from {previous.termName} to {latest.termName}.
                      </span>
                    </p>
                  );
                } else if (improvement < -5) {
                  return (
                    <p className="flex items-start gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600 mt-0.5" />
                      <span>
                        Performance declined by{" "}
                        <span className="font-medium text-red-600">
                          {Math.abs(improvement).toFixed(1)}%
                        </span>{" "}
                        from {previous.termName} to {latest.termName}. Consider additional support.
                      </span>
                    </p>
                  );
                } else {
                  return (
                    <p className="flex items-start gap-2">
                      <Minus className="h-4 w-4 text-gray-600 mt-0.5" />
                      <span>
                        Performance has remained consistent between {previous.termName} and {latest.termName}.
                      </span>
                    </p>
                  );
                }
              })()}
              <p>
                Overall average across all terms:{" "}
                <span className="font-medium">
                  {(termHistory.reduce((sum, t) => sum + t.averagePercentage, 0) / termHistory.length).toFixed(1)}%
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Grade Legend */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-xs font-medium text-gray-600 mb-3">Performance Scale</h4>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#10b981" }}></div>
              <span>90-100% (A+/A)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#3b82f6" }}></div>
              <span>80-89% (B+/B)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#8b5cf6" }}></div>
              <span>70-79% (C+/C)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#f59e0b" }}></div>
              <span>60-69% (D)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#ef4444" }}></div>
              <span>Below 60% (F)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
