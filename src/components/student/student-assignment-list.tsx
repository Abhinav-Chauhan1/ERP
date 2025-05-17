"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { 
  FileText, 
  Calendar, 
  Clock, 
  Search, 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  AlertCircle 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Assignment {
  id: string;
  title: string;
  subject: string;
  subjectId: string;
  dueDate: Date | string;
  assignedDate: Date | string;
  totalMarks: number;
  isSubmitted?: boolean;
  submission?: any;
}

interface StudentAssignmentListProps {
  assignments: Assignment[];
  studentId: string;
  type: "pending" | "submitted" | "graded" | "overdue";
}

export function StudentAssignmentList({ 
  assignments, 
  studentId, 
  type 
}: StudentAssignmentListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  
  // Get unique subjects for filter
  const subjects = ["all", ...Array.from(new Set(assignments.map(a => a.subject)))];
  
  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = 
      assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSubject = subjectFilter === "all" || assignment.subject === subjectFilter;
    
    return matchesSearch && matchesSubject;
  });
  
  // Get days until due or days since submitted
  const getDaysText = (assignment: Assignment) => {
    if (type === "pending") {
      const today = new Date();
      const dueDate = new Date(assignment.dueDate);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return "Due today";
      if (diffDays === 1) return "Due tomorrow";
      return `Due in ${diffDays} days`;
    } 
    else if (type === "submitted" || type === "graded") {
      const submissionDate = new Date(assignment.submission?.submissionDate);
      return `Submitted on ${format(submissionDate, "MMM d, yyyy")}`;
    }
    else if (type === "overdue") {
      const today = new Date();
      const dueDate = new Date(assignment.dueDate);
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return "Overdue by 1 day";
      return `Overdue by ${diffDays} days`;
    }
    
    return "";
  };
  
  // Get the icon based on assignment type
  const getIcon = () => {
    switch (type) {
      case "pending": return Clock;
      case "submitted": return CheckCircle;
      case "graded": return CheckCircle;
      case "overdue": return AlertCircle;
      default: return FileText;
    }
  };
  
  const Icon = getIcon();
  
  // Get the empty message
  const getEmptyMessage = () => {
    switch (type) {
      case "pending": return "You don't have any pending assignments";
      case "submitted": return "You don't have any submitted assignments awaiting grading";
      case "graded": return "You don't have any graded assignments";
      case "overdue": return "You don't have any overdue assignments";
      default: return "No assignments found";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search assignments..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map(subject => (
              <SelectItem key={subject} value={subject}>
                {subject === "all" ? "All Subjects" : subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {filteredAssignments.length > 0 ? (
        <div className="grid gap-4">
          {filteredAssignments.map(assignment => (
            <Card key={assignment.id}>
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className={`p-6 flex items-center justify-center md:w-1/4 ${
                    type === "pending" ? "bg-blue-50" :
                    type === "submitted" ? "bg-green-50" :
                    type === "graded" ? "bg-indigo-50" :
                    "bg-red-50"
                  }`}>
                    <div className="text-center">
                      <div className={`rounded-full p-3 mx-auto ${
                        type === "pending" ? "bg-blue-100 text-blue-700" :
                        type === "submitted" ? "bg-green-100 text-green-700" :
                        type === "graded" ? "bg-indigo-100 text-indigo-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className={`mt-2 text-sm font-medium ${
                        type === "pending" ? "text-blue-700" :
                        type === "submitted" ? "text-green-700" :
                        type === "graded" ? "text-indigo-700" :
                        "text-red-700"
                      }`}>
                        {getDaysText(assignment)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{assignment.title}</h3>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <BookOpen className="mr-2 h-4 w-4" />
                          <span>{assignment.subject}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-sm">
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                            <span>Due: {format(new Date(assignment.dueDate), "MMM d, yyyy")}</span>
                          </div>
                          <div className="flex items-center">
                            <FileText className="mr-2 h-4 w-4 text-gray-500" />
                            <span>
                              {type === "graded" 
                                ? `Marks: ${assignment.submission?.marks}/${assignment.totalMarks}` 
                                : `Total Marks: ${assignment.totalMarks}`}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button asChild>
                          <Link href={`/student/assessments/assignments/${assignment.id}`}>
                            {type === "pending" ? "Submit Assignment" :
                             type === "submitted" ? "View Submission" :
                             type === "graded" ? "View Feedback" :
                             "Submit Late"}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium">No assignments found</h3>
          <p className="mt-1 text-gray-500">
            {getEmptyMessage()}
          </p>
        </div>
      )}
    </div>
  );
}
