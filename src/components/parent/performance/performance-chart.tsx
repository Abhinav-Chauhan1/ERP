"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { GradeTrendData } from "@/types/performance";
import { getPerformanceColor } from "@/lib/utils/grade-calculator";

interface PerformanceChartProps {
  subjectTrends: GradeTrendData[];
  studentName?: string;
}

function AnimatedLineChart({ data }: { data: Array<{ name: string; studentPercentage: number; classAverage: number }> }) {
  if (!data || data.length === 0) return <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>;
  const maxValue = Math.max(...data.flatMap(d => [d.studentPercentage, d.classAverage]), 100);
  const chartHeight = 250;
  const getY = (v: number) => chartHeight - (v / maxValue) * chartHeight;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${data.length * 80} ${chartHeight + 40}`} className="w-full h-[300px]" preserveAspectRatio="xMidYMid meet">
        {[0, 25, 50, 75, 100].map((v, i) => (<line key={i} x1="0" y1={getY(v)} x2={data.length * 80} y2={getY(v)} stroke="#e5e7eb" strokeWidth="1" />))}
        <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={data.map((d, i) => `${i * 80 + 40},${getY(d.studentPercentage)}`).join(' ')} style={{ animation: 'drawLine 1s ease-out forwards' }} />
        <polyline fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5 5" points={data.map((d, i) => `${i * 80 + 40},${getY(d.classAverage)}`).join(' ')} style={{ animation: 'drawLine 1s ease-out forwards' }} />
        {data.map((d, i) => (<g key={i}><circle cx={i * 80 + 40} cy={getY(d.studentPercentage)} r="5" fill="#3b82f6" /><circle cx={i * 80 + 40} cy={getY(d.classAverage)} r="4" fill="#94a3b8" /><text x={i * 80 + 40} y={chartHeight + 20} textAnchor="middle" className="text-xs fill-gray-600">{d.name}</text></g>))}
      </svg>
      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-2"><div className="w-4 h-1 bg-blue-500"></div><span className="text-xs">Student</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-1 bg-gray-400" style={{ borderStyle: 'dashed' }}></div><span className="text-xs">Class Average</span></div>
      </div>
      <style jsx>{`@keyframes drawLine { from { stroke-dashoffset: 1000; stroke-dasharray: 1000; } to { stroke-dashoffset: 0; } }`}</style>
    </div>
  );
}

export function PerformanceChart({ subjectTrends, studentName }: PerformanceChartProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>(subjectTrends.length > 0 ? subjectTrends[0].subjectId : "");
  const currentSubjectData = subjectTrends.find(s => s.subjectId === selectedSubject);
  const chartData = currentSubjectData?.dataPoints.map(point => ({
    name: format(new Date(point.examDate), "MMM d"),
    studentPercentage: parseFloat(point.percentage.toFixed(1)),
    classAverage: parseFloat(point.classAverage.toFixed(1)),
  })) || [];

  const getTrendBadge = (trend: "improving" | "declining" | "stable") => {
    switch (trend) {
      case "improving": return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><TrendingUp className="h-3 w-3 mr-1" />Improving</Badge>;
      case "declining": return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><TrendingDown className="h-3 w-3 mr-1" />Declining</Badge>;
      default: return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200"><Minus className="h-3 w-3 mr-1" />Stable</Badge>;
    }
  };

  if (subjectTrends.length === 0) {
    return <Card><CardHeader><CardTitle>Performance Trends</CardTitle></CardHeader><CardContent><div className="text-center py-12 text-gray-500"><p className="text-sm">No performance data available</p></div></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><CardTitle>Performance Trends</CardTitle>{studentName && <p className="text-sm text-muted-foreground mt-1">{studentName}</p>}</div>
          <div className="flex items-center gap-3">
            {currentSubjectData && getTrendBadge(currentSubjectData.overallTrend)}
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>{subjectTrends.map((s) => (<SelectItem key={s.subjectId} value={s.subjectId}>{s.subjectName}</SelectItem>))}</SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {currentSubjectData && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${getPerformanceColor(currentSubjectData.averagePercentage)}15` }}
              >
                <p
                  className="text-xs mb-1"
                  style={{ color: getPerformanceColor(currentSubjectData.averagePercentage) }}
                >
                  Average
                </p>
                <p
                  className="text-lg font-bold"
                  style={{ color: getPerformanceColor(currentSubjectData.averagePercentage) }}
                >
                  {currentSubjectData.averagePercentage.toFixed(1)}%
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-600 mb-1">Total Exams</p><p className="text-lg font-bold text-gray-700">{currentSubjectData.dataPoints.length}</p></div>
              <div className={`p-3 rounded-lg ${currentSubjectData.improvementRate >= 0 ? "bg-green-50" : "bg-red-50"}`}><p className={`text-xs mb-1 ${currentSubjectData.improvementRate >= 0 ? "text-green-600" : "text-red-600"}`}>Improvement</p><p className={`text-lg font-bold ${currentSubjectData.improvementRate >= 0 ? "text-green-700" : "text-red-700"}`}>{currentSubjectData.improvementRate > 0 ? "+" : ""}{currentSubjectData.improvementRate.toFixed(1)}%</p></div>
              <div className="bg-purple-50 p-3 rounded-lg"><p className="text-xs text-purple-600 mb-1">Trend</p><p className="text-sm font-medium text-purple-700 capitalize">{currentSubjectData.overallTrend}</p></div>
            </div>
            <AnimatedLineChart data={chartData} />
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Performance Insights</h4>
              <div className="space-y-2 text-sm text-gray-600">
                {currentSubjectData.overallTrend === "improving" && <p>Great progress! Performance has improved by <span className="font-medium text-green-600">{currentSubjectData.improvementRate.toFixed(1)}%</span> over time.</p>}
                {currentSubjectData.overallTrend === "declining" && <p>Performance has declined by <span className="font-medium text-red-600">{Math.abs(currentSubjectData.improvementRate).toFixed(1)}%</span>. Consider additional support.</p>}
                {currentSubjectData.overallTrend === "stable" && <p>Performance has remained consistent with an average of <span className="font-medium">{currentSubjectData.averagePercentage.toFixed(1)}%</span>.</p>}
                <p>Based on {currentSubjectData.dataPoints.length} exam{currentSubjectData.dataPoints.length !== 1 ? "s" : ""} in {currentSubjectData.subjectName}.</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
