"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ArrowUpDown, TrendingDown, TrendingUp, Award, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { ExamResultData } from "@/types/performance";
import { getPerformanceColor } from "@/lib/utils/grade-calculator";

interface ExamResultsTableProps {
  results: ExamResultData[];
  studentName?: string;
}

type SortField = "subject" | "marks" | "date" | "percentage";
type SortOrder = "asc" | "desc";

export function ExamResultsTable({ results, studentName }: ExamResultsTableProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "subject":
          comparison = a.subject.name.localeCompare(b.subject.name);
          break;
        case "marks":
          comparison = a.marks - b.marks;
          break;
        case "date":
          comparison = new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
          break;
        case "percentage":
          comparison = a.percentage - b.percentage;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [results, sortField, sortOrder]);

  const getGradeStyle = (percentage: number) => {
    const color = getPerformanceColor(percentage);
    return {
      backgroundColor: `${color}20`,
      color: color,
      borderColor: `${color}40`,
      fontWeight: "bold" as const
    };
  };

  const getPerformanceIndicator = (studentPercentage: number, classAverage?: number) => {
    if (!classAverage) return null;

    const difference = studentPercentage - classAverage;

    if (difference >= 10) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs">+{difference.toFixed(1)}%</span>
        </div>
      );
    } else if (difference <= -10) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <TrendingDown className="h-4 w-4" />
          <span className="text-xs">{difference.toFixed(1)}%</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 text-gray-500">
        <span className="text-xs">{difference > 0 ? "+" : ""}{difference.toFixed(1)}%</span>
      </div>
    );
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2 hover:bg-gray-100"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-3 w-3" />
    </Button>
  );

  if (results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Exam Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No exam results available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Exam Results</CardTitle>
            {studentName && (
              <p className="text-sm text-muted-foreground mt-1">{studentName}</p>
            )}
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {results.length} {results.length === 1 ? "Exam" : "Exams"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton field="subject">Subject</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="date">Exam Date</SortButton>
                </TableHead>
                <TableHead>Exam Type</TableHead>
                <TableHead className="text-right">
                  <SortButton field="marks">Marks</SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton field="percentage">Percentage</SortButton>
                </TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="text-right">Class Avg</TableHead>
                <TableHead className="text-center">Rank</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedResults.map((result) => {
                const isBelowAverage = result.classAverage && result.percentage < result.classAverage;
                const isTopPerformer = result.rank && result.rank <= 3;

                const performanceColor = getPerformanceColor(result.percentage);

                return (
                  <TableRow
                    key={result.id}
                    style={isBelowAverage ? { backgroundColor: `${performanceColor}05` } : {}}
                  >
                    <TableCell className="font-medium">
                      <div>
                        <p className="text-sm">{result.subject.name}</p>
                        <p className="text-xs text-gray-500">{result.subject.code}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(result.examDate), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {result.examType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">
                        {result.marks}/{result.totalMarks}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-bold" style={{ color: performanceColor }}>
                          {result.percentage.toFixed(1)}%
                        </span>
                        {getPerformanceIndicator(result.percentage, result.classAverage)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        style={getGradeStyle(result.percentage)}
                      >
                        {result.grade || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {result.classAverage ? (
                        <div className="text-sm text-gray-600">
                          {result.classAverage.toFixed(1)}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {result.rank ? (
                        <div className="flex items-center justify-center gap-1">
                          {isTopPerformer && <Award className="h-3 w-3 text-yellow-500" />}
                          <span className={isTopPerformer ? "font-bold text-yellow-600" : ""}>
                            #{result.rank}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.isPassed ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Passed
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-50 border border-red-100 rounded"></div>
            <span>Below class average</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-500" />
            <span>Top 3 rank</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span>Above class average</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <span>Below class average</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
