"use client";

import { useState, useMemo } from "react";
import { format, isPast, differenceInDays } from "date-fns";
import { 
  ArrowUpDown, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText,
  Calendar,
  Award,
  XCircle
} from "lucide-react";
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
import { cn } from "@/lib/utils";

interface Assignment {
  id: string;
  title: string;
  subject: {
    id: string;
    name: string;
    code: string;
  };
  dueDate: Date | string;
  totalMarks: number;
  submissions: Array<{
    id: string;
    status: "PENDING" | "SUBMITTED" | "LATE" | "GRADED" | "RETURNED";
    submissionDate: Date | string | null;
    marks: number | null;
    feedback: string | null;
  }>;
}

interface HomeworkListProps {
  assignments: Assignment[];
  studentName?: string;
  onViewDetails?: (assignmentId: string) => void;
}

type SortField = "subject" | "dueDate" | "status" | "marks";
type SortOrder = "asc" | "desc";

export function HomeworkList({ 
  assignments, 
  studentName,
  onViewDetails 
}: HomeworkListProps) {
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Process assignments with submission status
  const processedAssignments = useMemo(() => {
    return assignments.map((assignment) => {
      const submission = assignment.submissions[0];
      const dueDate = typeof assignment.dueDate === "string" 
        ? new Date(assignment.dueDate) 
        : assignment.dueDate;
      
      let status: "PENDING" | "SUBMITTED" | "LATE" | "GRADED" | "RETURNED" | "OVERDUE" = "PENDING";
      let isOverdue = false;

      if (submission) {
        status = submission.status;
      } else {
        // No submission - check if overdue
        if (isPast(dueDate)) {
          status = "OVERDUE";
          isOverdue = true;
        }
      }

      const daysUntilDue = differenceInDays(dueDate, new Date());

      return {
        ...assignment,
        dueDate,
        submission,
        status,
        isOverdue,
        daysUntilDue,
      };
    });
  }, [assignments]);

  // Sort assignments
  const sortedAssignments = useMemo(() => {
    return [...processedAssignments].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "subject":
          comparison = a.subject.name.localeCompare(b.subject.name);
          break;
        case "dueDate":
          comparison = a.dueDate.getTime() - b.dueDate.getTime();
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "marks":
          const marksA = a.submission?.marks ?? -1;
          const marksB = b.submission?.marks ?? -1;
          comparison = marksA - marksB;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [processedAssignments, sortField, sortOrder]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = processedAssignments.length;
    const pending = processedAssignments.filter(a => a.status === "PENDING").length;
    const submitted = processedAssignments.filter(a => 
      ["SUBMITTED", "GRADED", "RETURNED"].includes(a.status)
    ).length;
    const overdue = processedAssignments.filter(a => a.isOverdue).length;
    const graded = processedAssignments.filter(a => a.status === "GRADED" || a.status === "RETURNED").length;

    return { total, pending, submitted, overdue, graded };
  }, [processedAssignments]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "GRADED":
      case "RETURNED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Graded
          </Badge>
        );
      case "SUBMITTED":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Submitted
          </Badge>
        );
      case "LATE":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <Clock className="h-3 w-3 mr-1" />
            Late
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getDueDateIndicator = (daysUntilDue: number, status: string) => {
    if (["SUBMITTED", "GRADED", "RETURNED"].includes(status)) {
      return null;
    }

    if (daysUntilDue < 0) {
      return (
        <span className="text-xs text-red-600 font-medium">
          {Math.abs(daysUntilDue)} days overdue
        </span>
      );
    } else if (daysUntilDue === 0) {
      return (
        <span className="text-xs text-orange-600 font-medium">
          Due today
        </span>
      );
    } else if (daysUntilDue <= 3) {
      return (
        <span className="text-xs text-amber-600 font-medium">
          Due in {daysUntilDue} {daysUntilDue === 1 ? "day" : "days"}
        </span>
      );
    }

    return null;
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

  if (assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Homework & Assignments</CardTitle>
          {studentName && (
            <p className="text-sm text-muted-foreground">{studentName}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No assignments available</p>
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
            <CardTitle>Homework & Assignments</CardTitle>
            {studentName && (
              <p className="text-sm text-muted-foreground mt-1">{studentName}</p>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-xs text-yellow-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-600 mb-1">Submitted</p>
            <p className="text-2xl font-bold text-blue-700">{stats.submitted}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-xs text-green-600 mb-1">Graded</p>
            <p className="text-2xl font-bold text-green-700">{stats.graded}</p>
          </div>
          {stats.overdue > 0 && (
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-xs text-red-600 mb-1">Overdue</p>
              <p className="text-2xl font-bold text-red-700">{stats.overdue}</p>
            </div>
          )}
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
                <TableHead>Assignment</TableHead>
                <TableHead>
                  <SortButton field="dueDate">Due Date</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="status">Status</SortButton>
                </TableHead>
                <TableHead className="text-right">Total Marks</TableHead>
                <TableHead className="text-right">
                  <SortButton field="marks">Marks Obtained</SortButton>
                </TableHead>
                <TableHead>Feedback</TableHead>
                {onViewDetails && <TableHead className="text-center">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAssignments.map((assignment) => {
                const hasGrade = assignment.submission?.marks !== null && assignment.submission?.marks !== undefined;
                const percentage = hasGrade 
                  ? ((assignment.submission!.marks! / assignment.totalMarks) * 100).toFixed(1)
                  : null;

                return (
                  <TableRow
                    key={assignment.id}
                    className={cn(
                      assignment.isOverdue && "bg-red-50/50",
                      assignment.daysUntilDue <= 3 && assignment.daysUntilDue >= 0 && !assignment.submission && "bg-amber-50/30"
                    )}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{assignment.subject.name}</p>
                        <p className="text-xs text-gray-500">{assignment.subject.code}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="font-medium text-sm truncate">{assignment.title}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {format(assignment.dueDate, "MMM d, yyyy")}
                        </div>
                        {getDueDateIndicator(assignment.daysUntilDue, assignment.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(assignment.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">{assignment.totalMarks}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {hasGrade ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-bold text-lg">
                              {assignment.submission!.marks}
                            </span>
                            {Number(percentage) >= 90 && (
                              <Award className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              Number(percentage) >= 75 ? "bg-green-50 text-green-700 border-green-200" :
                              Number(percentage) >= 50 ? "bg-blue-50 text-blue-700 border-blue-200" :
                              "bg-red-50 text-red-700 border-red-200"
                            )}
                          >
                            {percentage}%
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Not graded</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {assignment.submission?.feedback ? (
                        <div className="max-w-[150px]">
                          <p className="text-xs text-gray-600 truncate">
                            {assignment.submission.feedback}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No feedback</span>
                      )}
                    </TableCell>
                    {onViewDetails && (
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetails(assignment.id)}
                          className="h-8"
                        >
                          View
                        </Button>
                      </TableCell>
                    )}
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
            <span>Overdue assignment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-50 border border-amber-100 rounded"></div>
            <span>Due within 3 days</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-500" />
            <span>Excellent performance (90%+)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
