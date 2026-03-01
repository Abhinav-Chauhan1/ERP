"use client";

import { useState } from "react";
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

// CSS-based animated bar chart component
function AnimatedBarChart({ data, getBarColor }: { data: Array<{ name: string; percentage: number; grade?: string | null; exams?: number; trend?: "stable" | "improving" | "declining" }>; getBarColor: (pct: number) => string }) {
  const maxValue = Math.max(...data.map(d => d.percentage), 100);

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium truncate max-w-[200px]">{item.name}</span>
            <span className="text-muted-foreground">{item.percentage.toFixed(1)}%</span>
          </div>
          <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
            <div
              className="h-full rounded-lg transition-all duration-700 ease-out flex items-center justify-end pr-2"
              style={{
                width: `${(item.percentage / maxValue) * 100}%`,
                backgroundColor: getBarColor(item.percentage),
                animation: `growWidth 0.6s ease-out ${index * 0.1}s both`,
              }}
            >
              {item.grade && <span className="text-white text-xs font-medium">{item.grade}</span>}
            </div>
          </div>
        </div>
      ))}
      <style jsx>{`
        @keyframes growWidth {
          from { width: 0; }
        }
      `}</style>
    </div>
  );
}

export function GradeTrendChart({ termHistory, studentName }: GradeTrendChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("subjects");
  const [selectedTerm, setSelectedTerm] = useState<string>(
    termHistory.length > 0 ? termHistory[termHistory.length - 1].termId : ""
  );

  const currentTerm = termHistory.find(t => t.termId === selectedTerm);

  const subjectData = currentTerm?.subjects.map(subject => ({
    name: subject.subjectName,
    percentage: parseFloat(subject.averagePercentage.toFixed(1)),
    exams: subject.totalExams,
    trend: subject.trend,
  })) || [];

  const termComparisonData = termHistory.map(term => ({
    name: term.termName,
    percentage: parseFloat(term.averagePercentage.toFixed(1)),
    grade: term.grade,
    exams: term.totalExams,
  }));

  const getBarColor = (percentage: number) => {
    if (percentage >= 90) return "#10b981";
    if (percentage >= 80) return "#3b82f6";
    if (percentage >= 70) return "#14b8a6";
    if (percentage >= 60) return "#f59e0b";
    if (percentage >= 50) return "#f97316";
    return "#ef4444";
  };

  const getTrendIcon = (trend: "improving" | "declining" | "stable") => {
    switch (trend) {
      case "improving": return <TrendingUp className="h-3 w-3 text-green-600" />;
      case "declining": return <TrendingDown className="h-3 w-3 text-red-600" />;
      default: return <Minus className="h-3 w-3 text-gray-600" />;
    }
  };

  if (termHistory.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Grade Distribution</CardTitle></CardHeader>
        <CardContent><div className="text-center py-12 text-gray-500"><p className="text-sm">No grade data available</p></div></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Grade Distribution</CardTitle>
            {studentName && <p className="text-sm text-muted-foreground mt-1">{studentName}</p>}
          </div>
          <div className="flex items-center gap-3">
            <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="subjects">By Subject</SelectItem>
                <SelectItem value="terms">By Term</SelectItem>
              </SelectContent>
            </Select>
            {viewMode === "subjects" && (
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select term" /></SelectTrigger>
                <SelectContent>
                  {termHistory.map((term) => (<SelectItem key={term.termId} value={term.termId}>{term.termName}</SelectItem>))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "subjects" && currentTerm && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-blue-50 p-3 rounded-lg"><p className="text-xs text-blue-600 mb-1">Term Average</p><p className="text-lg font-bold text-blue-700">{currentTerm.averagePercentage.toFixed(1)}%</p></div>
            <div className="bg-teal-50 p-3 rounded-lg"><p className="text-xs text-teal-600 mb-1">Overall Grade</p><p className="text-lg font-bold text-teal-700">{currentTerm.grade || "N/A"}</p></div>
            <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-600 mb-1">Total Subjects</p><p className="text-lg font-bold text-gray-700">{currentTerm.subjects.length}</p></div>
            {currentTerm.rank && <div className="bg-yellow-50 p-3 rounded-lg"><p className="text-xs text-yellow-600 mb-1">Class Rank</p><p className="text-lg font-bold text-yellow-700">#{currentTerm.rank}</p></div>}
          </div>
        )}
        {viewMode === "terms" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <div className="bg-blue-50 p-3 rounded-lg"><p className="text-xs text-blue-600 mb-1">Total Terms</p><p className="text-lg font-bold text-blue-700">{termHistory.length}</p></div>
            <div className="bg-green-50 p-3 rounded-lg"><p className="text-xs text-green-600 mb-1">Best Performance</p><p className="text-lg font-bold text-green-700">{Math.max(...termHistory.map(t => t.averagePercentage)).toFixed(1)}%</p></div>
            <div className="bg-teal-50 p-3 rounded-lg"><p className="text-xs text-teal-600 mb-1">Latest Grade</p><p className="text-lg font-bold text-teal-700">{termHistory[termHistory.length - 1]?.grade || "N/A"}</p></div>
          </div>
        )}
        <AnimatedBarChart data={viewMode === "subjects" ? subjectData : termComparisonData} getBarColor={getBarColor} />
        {viewMode === "subjects" && currentTerm && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Subject Performance Trends</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentTerm.subjects.map((subject) => (
                <div key={subject.subjectId} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2"><p className="text-sm font-medium truncate">{subject.subjectName}</p>{getTrendIcon(subject.trend)}</div>
                  <div className="flex items-center justify-between text-xs text-gray-600"><span>{subject.averagePercentage.toFixed(1)}%</span><Badge variant="outline" className="text-xs capitalize">{subject.trend}</Badge></div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-xs font-medium text-gray-600 mb-3">Performance Scale</h4>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: "#10b981" }}></div><span>90-100% (A+/A)</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: "#3b82f6" }}></div><span>80-89% (B+/B)</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: "#14b8a6" }}></div><span>70-79% (C+/C)</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: "#f59e0b" }}></div><span>60-69% (D)</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: "#ef4444" }}></div><span>Below 60% (F)</span></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
