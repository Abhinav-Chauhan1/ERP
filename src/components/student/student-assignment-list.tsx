"use client";

import { useState } from "react";
import Link from "next/link";
import { format, isBefore, isAfter } from "date-fns";
import { Search, Filter, FileText, Calendar, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

type Assignment = {
  id: string;
  title: string;
  subject: {
    id: string;
    name: string;
  };
  dueDate: string;
  assignedDate: string;
  totalMarks: number;
  creator: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  submissions: Array<{
    id: string;
    status: string;
    marks: number | null;
    submissionDate: string | null;
  }>;
};

interface StudentAssignmentListProps {
  assignments: Assignment[];
  studentId: string;
  type: "pending" | "submitted" | "graded" | "overdue";
}

export function StudentAssignmentList({ assignments, studentId, type }: StudentAssignmentListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);

  // Get unique subjects for filtering
  const subjects = Array.from(
    new Set(assignments.map(assignment => assignment.subject.name))
  );

  // Filter assignments based on search query and subject filter
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          assignment.subject.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = !subjectFilter || assignment.subject.name === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  const getStatusIcon = () => {
    switch (type) {
      case "pending":
        return <Clock className="h-6 w-6 text-blue-600" />;
      case "submitted":
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case "graded":
        return <FileText className="h-6 w-6 text-purple-600" />;
      case "overdue":
        return <AlertCircle className="h-6 w-6 text-red-600" />;
    }
  };

  const getStatusBadge = (assignment: Assignment) => {
    const now = new Date();
    
    if (type === "pending") {
      const dueDate = new Date(assignment.dueDate);
      const isUrgent = isBefore(dueDate, new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000));
      
      return (
        <Badge 
          variant={isUrgent ? "destructive" : "secondary"}
          className="whitespace-nowrap"
        >
          {isUrgent ? "Due Soon" : "Pending"}
        </Badge>
      );
    } else if (type === "submitted") {
      const submission = assignment.submissions[0];
      const submissionDate = submission?.submissionDate ? new Date(submission.submissionDate) : null;
      const dueDate = new Date(assignment.dueDate);
      const isLate = submissionDate && isAfter(submissionDate, dueDate);
      
      return (
        <Badge 
          variant={isLate ? "outline" : "secondary"}
          className={isLate ? "border-amber-500 text-amber-700" : ""}
        >
          {isLate ? "Late Submission" : "Submitted"}
        </Badge>
      );
    } else if (type === "graded") {
      const submission = assignment.submissions[0];
      const scorePercentage = submission?.marks !== null 
        ? (submission.marks / assignment.totalMarks) * 100 
        : 0;
      
      return (
        <div className="flex items-center gap-2">
          <Badge 
            variant={scorePercentage >= 70 ? "default" : scorePercentage >= 40 ? "secondary" : "destructive"}
          >
            {submission?.marks !== null ? `${submission.marks}/${assignment.totalMarks}` : "N/A"}
          </Badge>
        </div>
      );
    } else { // overdue
      const daysPast = Math.ceil((now.getTime() - new Date(assignment.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      
      return (
        <Badge variant="destructive">
          {daysPast === 1 ? "1 day overdue" : `${daysPast} days overdue`}
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search assignments..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex gap-2">
              <Filter className="h-4 w-4" />
              {subjectFilter ? subjectFilter : "All Subjects"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSubjectFilter(null)}>
              All Subjects
            </DropdownMenuItem>
            {subjects.map(subject => (
              <DropdownMenuItem key={subject} onClick={() => setSubjectFilter(subject)}>
                {subject}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredAssignments.length === 0 ? (
        <div className="text-center py-12">
          {getStatusIcon()}
          <h3 className="mt-4 text-lg font-medium">
            {type === "pending" && "No pending assignments"}
            {type === "submitted" && "No submitted assignments"}
            {type === "graded" && "No graded assignments"}
            {type === "overdue" && "No overdue assignments"}
          </h3>
          <p className="mt-2 text-gray-500">
            {type === "pending" && "You're all caught up! Check back later for new assignments."}
            {type === "submitted" && "You haven't submitted any assignments yet."}
            {type === "graded" && "No assignments have been graded yet."}
            {type === "overdue" && "Great job keeping up with your deadlines!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <Link href={`/student/assessments/assignments/${assignment.id}`} key={assignment.id}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      {getStatusIcon()}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h3 className="font-semibold truncate">{assignment.title}</h3>
                        {getStatusBadge(assignment)}
                      </div>
                      
                      <p className="text-sm text-gray-500 mb-2">{assignment.subject.name}</p>
                      
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-1 text-xs">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-3.5 w-3.5 mr-1.5" />
                          Due: {format(new Date(assignment.dueDate), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <FileText className="h-3.5 w-3.5 mr-1.5" />
                          {assignment.totalMarks} {assignment.totalMarks === 1 ? 'mark' : 'marks'} total
                        </div>
                      </div>
                      
                      {type === "submitted" && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-1">Submission status</p>
                          <Progress 
                            value={100} 
                            className="h-2 bg-gray-100"
                          />
                          <p className="text-xs mt-1 text-gray-600">
                            Submitted on: {assignment.submissions[0]?.submissionDate 
                              ? format(new Date(assignment.submissions[0].submissionDate), "MMM d, yyyy 'at' h:mm a")
                              : "N/A"
                            }
                          </p>
                        </div>
                      )}
                      
                      {type === "graded" && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-1">Score</p>
                          <Progress 
                            value={assignment.submissions[0]?.marks !== null 
                              ? (assignment.submissions[0].marks / assignment.totalMarks) * 100 
                              : 0
                            } 
                            className="h-2 bg-gray-100"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
