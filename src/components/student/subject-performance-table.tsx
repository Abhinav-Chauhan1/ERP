"use client";

import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, TrendingDown, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Subject {
  id: string;
  name: string;
  code: string;
  percentage: number;
  examsTaken: number;
  lastScore: number | null;
  lastScoreTotal: number | null;
  grade: string;
}

interface SubjectPerformanceTableProps {
  subjects: Subject[];
}

export function SubjectPerformanceTable({ subjects }: SubjectPerformanceTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter subjects by search term
  const filteredSubjects = subjects.filter(subject => 
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get badge style based on percentage
  const getBadgeStyle = (percentage: number) => {
    if (percentage >= 90) return "bg-green-100 text-green-800 border-green-200";
    if (percentage >= 75) return "bg-blue-100 text-blue-800 border-blue-200";
    if (percentage >= 60) return "bg-amber-100 text-amber-800 border-amber-200";
    if (percentage >= 50) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-red-100 text-red-800 border-red-200";
  };
  
  // Get progress color based on percentage
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 75) return "bg-blue-500";
    if (percentage >= 60) return "bg-amber-500";
    if (percentage >= 50) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search subjects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead className="w-[100px] text-center">Grade</TableHead>
              <TableHead className="w-[140px] text-center">Percentage</TableHead>
              <TableHead className="w-[140px] text-center">Progress</TableHead>
              <TableHead className="w-[120px] text-center">Last Score</TableHead>
              <TableHead className="w-[100px] text-center">Exams</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubjects.length > 0 ? (
              filteredSubjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{subject.name}</div>
                        <div className="text-xs text-muted-foreground">{subject.code}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline" 
                      className={getBadgeStyle(subject.percentage)}
                    >
                      {subject.grade}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {subject.percentage}%
                  </TableCell>
                  <TableCell>
                    <Progress 
                      value={subject.percentage} 
                      className="h-2"
                      style={{ 
                        "--progress-color": getProgressColor(subject.percentage)
                      } as React.CSSProperties}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    {subject.lastScore !== null && subject.lastScoreTotal !== null ? (
                      <div className="flex items-center justify-center gap-1">
                        <span>
                          {subject.lastScore}/{subject.lastScoreTotal}
                        </span>
                        {subject.lastScore / subject.lastScoreTotal >= 0.7 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {subject.examsTaken}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No subjects found with search term &quot;{searchTerm}&quot;
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
