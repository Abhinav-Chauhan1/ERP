"use client";

/**
 * Alumni Academic History Component
 * 
 * Displays read-only academic records including attendance, exam results,
 * and assignments. Uses expandable sections for better organization.
 * 
 * Requirements: 4.6
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ChevronDown,
  ChevronUp,
  Calendar,
  BookOpen,
  FileText,
  TrendingUp,
  Award
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface AttendanceRecord {
  academicYear: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  percentage: number;
}

export interface ExamResult {
  examName: string;
  examDate: Date;
  subject: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade?: string;
}

export interface AssignmentRecord {
  title: string;
  subject: string;
  submittedDate: Date;
  marksObtained: number;
  totalMarks: number;
  status: "SUBMITTED" | "LATE" | "PENDING";
}

export interface AcademicHistoryData {
  attendance?: AttendanceRecord[];
  examResults?: ExamResult[];
  assignments?: AssignmentRecord[];
  overallGrade?: string;
  overallPercentage?: number;
  rank?: number;
  totalStudents?: number;
}

interface AlumniAcademicHistoryProps {
  data: AcademicHistoryData;
}

export function AlumniAcademicHistory({ data }: AlumniAcademicHistoryProps) {
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [examsOpen, setExamsOpen] = useState(false);
  const [assignmentsOpen, setAssignmentsOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return <Badge variant="secondary">Submitted</Badge>;
      case "LATE":
        return <Badge variant="destructive">Late</Badge>;
      case "PENDING":
        return <Badge variant="outline">Pending</Badge>;
      default:
        return null;
    }
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Overall Performance Summary */}
      {(data.overallGrade || data.overallPercentage || data.rank) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Overall Performance</CardTitle>
            </div>
            <CardDescription>
              Academic performance summary during school years
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {data.overallPercentage !== undefined && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Overall Percentage</p>
                  <p className="text-2xl font-bold">{data.overallPercentage.toFixed(2)}%</p>
                </div>
              )}
              {data.overallGrade && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Overall Grade</p>
                  <p className="text-2xl font-bold">{data.overallGrade}</p>
                </div>
              )}
              {data.rank && data.totalStudents && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Class Rank</p>
                  <p className="text-2xl font-bold">
                    {data.rank} / {data.totalStudents}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <Collapsible open={attendanceOpen} onOpenChange={setAttendanceOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 hover:bg-transparent">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Attendance Records</CardTitle>
                  {data.attendance && data.attendance.length > 0 && (
                    <Badge variant="secondary">{data.attendance.length} years</Badge>
                  )}
                </div>
                {attendanceOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CardDescription className="mt-2">
              Year-wise attendance summary
            </CardDescription>
            <CollapsibleContent className="mt-4">
              {data.attendance && data.attendance.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Academic Year</TableHead>
                      <TableHead className="text-right">Total Days</TableHead>
                      <TableHead className="text-right">Present</TableHead>
                      <TableHead className="text-right">Absent</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.attendance.map((record, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{record.academicYear}</TableCell>
                        <TableCell className="text-right">{record.totalDays}</TableCell>
                        <TableCell className="text-right">{record.presentDays}</TableCell>
                        <TableCell className="text-right">{record.absentDays}</TableCell>
                        <TableCell className="text-right">
                          <span className={`font-semibold ${getAttendanceColor(record.percentage)}`}>
                            {record.percentage.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground italic py-4">
                  No attendance records available
                </p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
      </Card>

      {/* Exam Results */}
      <Card>
        <CardHeader>
          <Collapsible open={examsOpen} onOpenChange={setExamsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 hover:bg-transparent">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Exam Results</CardTitle>
                  {data.examResults && data.examResults.length > 0 && (
                    <Badge variant="secondary">{data.examResults.length} exams</Badge>
                  )}
                </div>
                {examsOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CardDescription className="mt-2">
              Examination performance history
            </CardDescription>
            <CollapsibleContent className="mt-4">
              {data.examResults && data.examResults.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Marks</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                      <TableHead>Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.examResults.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{result.examName}</TableCell>
                        <TableCell>{result.subject}</TableCell>
                        <TableCell>{formatDate(result.examDate)}</TableCell>
                        <TableCell className="text-right">
                          {result.marksObtained} / {result.totalMarks}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold">
                            {result.percentage.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          {result.grade && (
                            <Badge variant="secondary">{result.grade}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground italic py-4">
                  No exam results available
                </p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
      </Card>

      {/* Assignment Records */}
      <Card>
        <CardHeader>
          <Collapsible open={assignmentsOpen} onOpenChange={setAssignmentsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 hover:bg-transparent">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Assignment Records</CardTitle>
                  {data.assignments && data.assignments.length > 0 && (
                    <Badge variant="secondary">{data.assignments.length} assignments</Badge>
                  )}
                </div>
                {assignmentsOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CardDescription className="mt-2">
              Assignment submission and performance history
            </CardDescription>
            <CollapsibleContent className="mt-4">
              {data.assignments && data.assignments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Marks</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.assignments.map((assignment, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{assignment.title}</TableCell>
                        <TableCell>{assignment.subject}</TableCell>
                        <TableCell>{formatDate(assignment.submittedDate)}</TableCell>
                        <TableCell className="text-right">
                          {assignment.marksObtained} / {assignment.totalMarks}
                        </TableCell>
                        <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground italic py-4">
                  No assignment records available
                </p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
      </Card>

      {/* Note about data preservation */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Academic Records Preserved</p>
              <p className="text-sm text-muted-foreground">
                All academic records from the student's time at the institution are preserved
                and remain accessible through this alumni profile.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
