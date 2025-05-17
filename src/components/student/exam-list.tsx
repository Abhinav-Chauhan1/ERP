"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { 
  FileText, 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  ChevronRight 
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
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

interface Exam {
  id: string;
  title: string;
  examDate: Date | string;
  subject: string;
  subjectId: string;
  examType: string;
  startTime: Date | string;
  endTime: Date | string;
  totalMarks: number;
  hasResult?: boolean;
}

interface ExamListProps {
  exams: Exam[];
  emptyMessage?: string;
  showResults?: boolean;
}

export function ExamList({ exams, emptyMessage, showResults = false }: ExamListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  
  // Get unique subjects and exam types for filters
  const subjects = ["all", ...Array.from(new Set(exams.map(exam => exam.subject)))];
  const examTypes = ["all", ...Array.from(new Set(exams.map(exam => exam.examType)))];
  
  // Filter exams based on search and filters
  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           exam.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSubject = subjectFilter === "all" || exam.subject === subjectFilter;
    const matchesType = typeFilter === "all" || exam.examType === typeFilter;
    
    return matchesSearch && matchesSubject && matchesType;
  });
  
  // Format times for display
  const formatTime = (time: Date | string) => {
    return format(new Date(time), "h:mm a");
  };
  
  // Get days until exam
  const getDaysUntil = (examDate: Date | string) => {
    const today = new Date();
    const examDay = new Date(examDate);
    const diffTime = examDay.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 0) return "Past";
    return `In ${diffDays} days`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search exams..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
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
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Exam Type" />
            </SelectTrigger>
            <SelectContent>
              {examTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type === "all" ? "All Types" : type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredExams.length > 0 ? (
        <div className="grid gap-4">
          {filteredExams.map(exam => (
            <Card key={exam.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="bg-blue-50 p-6 flex items-center justify-center md:w-1/4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-700">
                        {format(new Date(exam.examDate), "dd")}
                      </div>
                      <div className="text-blue-600">
                        {format(new Date(exam.examDate), "MMM yyyy")}
                      </div>
                      <Badge 
                        className={`mt-2 ${
                          getDaysUntil(exam.examDate) === "Today" 
                            ? "bg-red-100 text-red-800"
                            : getDaysUntil(exam.examDate) === "Tomorrow"
                            ? "bg-amber-100 text-amber-800"
                            : getDaysUntil(exam.examDate) === "Past"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {getDaysUntil(exam.examDate)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{exam.title}</h3>
                        <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500">
                          <Badge variant="outline">{exam.subject}</Badge>
                          <Badge variant="secondary">{exam.examType}</Badge>
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600"
                        asChild
                      >
                        <Link href={`/student/assessments/${showResults ? 'results' : 'exams'}/${exam.id}`}>
                          {showResults ? "View Results" : "View Details"}
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-sm">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-gray-500" />
                        <span>
                          {formatTime(exam.startTime)} - {formatTime(exam.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-gray-500" />
                        <span>Total Marks: {exam.totalMarks}</span>
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
          <h3 className="mt-4 text-lg font-medium">No exams found</h3>
          <p className="mt-1 text-gray-500">
            {emptyMessage || "You don't have any upcoming exams"}
          </p>
        </div>
      )}
    </div>
  );
}
