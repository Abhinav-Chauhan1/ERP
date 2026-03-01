"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { 
  BookOpen, 
  Calendar, 
  CheckCircle, 
  ChevronRight, 
  Clock, 
  FileText, 
  User,
  AlertTriangle
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Define the type for the subject to avoid rendering raw object
interface AssignmentSubject {
  name: string;
  code?: string;
}

interface Assignment {
  id: string;
  title: string;
  description?: string;
  dueDate: string | Date;
  assignedDate: string | Date;
  totalMarks: number;
  subject: AssignmentSubject;
  submissions: any[];
  creator?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
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
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter assignments based on search
  const filteredAssignments = assignments.filter(assignment => 
    assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (assignment.subject.name && assignment.subject.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (assignment.description && assignment.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Helper function to determine time remaining or overdue status
  const getTimeStatus = (dueDate: string | Date) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'}`;
    } else if (diffDays === 0) {
      return "Due today";
    } else {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} remaining`;
    }
  };
  
  // Helper to get assignment status color
  const getStatusColor = (type: string) => {
    switch (type) {
      case "pending":
        return "text-blue-600";
      case "submitted":
        return "text-green-600";
      case "graded":
        return "text-teal-600";
      case "overdue":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };
  
  // Get assignment card style based on type
  const getCardStyle = (type: string) => {
    switch (type) {
      case "pending":
        return "border-blue-200";
      case "submitted":
        return "border-green-200";
      case "graded":
        return "border-teal-200";
      case "overdue":
        return "border-red-200";
      default:
        return "";
    }
  };
  
  return (
    <div className="space-y-6">
      {assignments.length > 0 ? (
        <>
          <div className="relative">
            <Input
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {filteredAssignments.length > 0 ? (
              filteredAssignments.map(assignment => (
                <Card 
                  key={assignment.id} 
                  className={cn("overflow-hidden", getCardStyle(type))}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{assignment.title}</CardTitle>
                        <CardDescription className="mt-1 flex items-center">
                          <BookOpen className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          {/* Render subject name as string, not the object */}
                          {assignment.subject.name}
                          {assignment.subject.code && (
                            <span className="ml-2 text-xs rounded-md bg-muted px-1.5 py-0.5">
                              {assignment.subject.code}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      
                      {type === "pending" && (
                        <Badge className="bg-blue-100 text-blue-800">Pending</Badge>
                      )}
                      {type === "submitted" && (
                        <Badge className="bg-green-100 text-green-800">Submitted</Badge>
                      )}
                      {type === "graded" && (
                        <Badge className="bg-teal-100 text-teal-800">Graded</Badge>
                      )}
                      {type === "overdue" && (
                        <Badge className="bg-red-100 text-red-800">Overdue</Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    <div className="space-y-3">
                      {type === "graded" && assignment.submissions[0]?.marks && (
                        <div className="flex items-center justify-between p-2 bg-teal-50 rounded-md">
                          <span className="text-sm font-medium">Your Score:</span>
                          <span className="font-bold">
                            {assignment.submissions[0].marks}/{assignment.totalMarks}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          Due: {format(new Date(assignment.dueDate), "MMM d, yyyy")}
                        </div>
                        
                        <div className="flex items-center text-muted-foreground">
                          <User className="h-3.5 w-3.5 mr-1" />
                          {assignment.creator ? 
                            `${assignment.creator.user.firstName} ${assignment.creator.user.lastName}` : 
                            "Teacher"}
                        </div>
                        
                        {assignment.totalMarks && (
                          <div className="flex items-center text-muted-foreground">
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            {assignment.totalMarks} marks
                          </div>
                        )}
                      </div>
                      
                      {type === "pending" && (
                        <div className={`flex items-center gap-1 text-sm ${
                          new Date(assignment.dueDate) > new Date() 
                            ? "text-primary" 
                            : "text-destructive"
                        }`}>
                          <Clock className="h-3.5 w-3.5" />
                          <span>{getTimeStatus(assignment.dueDate)}</span>
                        </div>
                      )}
                      
                      {type === "overdue" && (
                        <div className="flex items-center gap-1 text-sm text-destructive">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>{getTimeStatus(assignment.dueDate)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-2">
                    <Button 
                      className="w-full" 
                      variant={type === "overdue" ? "destructive" : "default"}
                      asChild
                    >
                      <Link href={`/student/assessments/assignments/${assignment.id}`}>
                        {type === "pending" && "Start Assignment"}
                        {type === "submitted" && "View Submission"}
                        {type === "graded" && "View Feedback"}
                        {type === "overdue" && "Submit Late"}
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-2 text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">No matching assignments found</h3>
                <p className="text-muted-foreground">Try adjusting your search term</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">
            {type === "pending" && "No pending assignments"}
            {type === "submitted" && "No submitted assignments"}
            {type === "graded" && "No graded assignments"}
            {type === "overdue" && "No overdue assignments"}
          </h3>
          <p className="text-muted-foreground">
            {type === "pending" && "You don't have any pending assignments."}
            {type === "submitted" && "You haven't submitted any assignments yet."}
            {type === "graded" && "None of your assignments have been graded yet."}
            {type === "overdue" && "You don't have any overdue assignments. Great job!"}
          </p>
        </div>
      )}
    </div>
  );
}
