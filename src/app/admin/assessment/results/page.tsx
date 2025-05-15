"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ChevronLeft, Search, Download, FileText, 
  Filter, Calendar, BookOpen, GraduationCap, 
  BarChart, ArrowUpDown, Eye, Printer, CheckCircle, 
  AlertCircle, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// Mock data for exam results
const examResultsData = [
  {
    id: "e1",
    examName: "Mid-Term Physics Exam",
    subject: "Physics",
    grade: "Grade 11",
    examDate: "2023-10-15",
    totalStudents: 35,
    absentStudents: 3,
    highestScore: 95,
    lowestScore: 42,
    averageScore: 76.5,
    passPercentage: 88.6,
    gradeDistribution: {
      "A+": 4,
      "A": 8,
      "B+": 6,
      "B": 5,
      "C+": 4,
      "C": 3,
      "D": 2,
      "F": 3
    },
    isPublished: true,
    publishedOn: "2023-10-20"
  },
  {
    id: "e2",
    examName: "Mathematics Unit Test: Algebra",
    subject: "Mathematics",
    grade: "Grade 10",
    examDate: "2023-10-12",
    totalStudents: 38,
    absentStudents: 2,
    highestScore: 98,
    lowestScore: 35,
    averageScore: 72.3,
    passPercentage: 84.2,
    gradeDistribution: {
      "A+": 5,
      "A": 7,
      "B+": 8,
      "B": 6,
      "C+": 4,
      "C": 3,
      "D": 2,
      "F": 3
    },
    isPublished: true,
    publishedOn: "2023-10-18"
  },
  {
    id: "e3",
    examName: "English Literature Essay",
    subject: "English",
    grade: "Grade 9",
    examDate: "2023-10-20",
    totalStudents: 40,
    absentStudents: 1,
    highestScore: 92,
    lowestScore: 48,
    averageScore: 74.8,
    passPercentage: 92.5,
    gradeDistribution: {
      "A+": 3,
      "A": 9,
      "B+": 10,
      "B": 8,
      "C+": 5,
      "C": 3,
      "D": 1,
      "F": 1
    },
    isPublished: false,
    publishedOn: null
  },
  {
    id: "e4",
    examName: "Chemistry Final Exam",
    subject: "Chemistry",
    grade: "Grade 12",
    examDate: "2023-10-18",
    totalStudents: 32,
    absentStudents: 0,
    highestScore: 96,
    lowestScore: 39,
    averageScore: 68.4,
    passPercentage: 78.1,
    gradeDistribution: {
      "A+": 2,
      "A": 5,
      "B+": 6,
      "B": 7,
      "C+": 5,
      "C": 3,
      "D": 3,
      "F": 1
    },
    isPublished: true,
    publishedOn: "2023-10-25"
  },
];

// Mock data for student examination results
const studentResultsData = [
  {
    id: "sr1",
    studentName: "Alex Johnson",
    studentId: "ST10023",
    admissionId: "ADM2021/123",
    grade: "Grade 11",
    rollNumber: "11A-01",
    photo: "/avatars/01.png",
    exams: [
      { id: "e1", examName: "Mid-Term Physics Exam", subject: "Physics", marks: 82, totalMarks: 100, grade: "A", percentage: 82 },
      { id: "e2", examName: "Mid-Term Chemistry Exam", subject: "Chemistry", marks: 75, totalMarks: 100, grade: "B+", percentage: 75 },
      { id: "e3", examName: "Mid-Term Mathematics Exam", subject: "Mathematics", marks: 90, totalMarks: 100, grade: "A+", percentage: 90 },
      { id: "e4", examName: "Mid-Term English Exam", subject: "English", marks: 68, totalMarks: 100, grade: "C+", percentage: 68 },
      { id: "e5", examName: "Mid-Term Computer Science Exam", subject: "Computer Science", marks: 85, totalMarks: 100, grade: "A", percentage: 85 },
    ],
    totalMarks: 400,
    obtainedMarks: 315,
    percentage: 78.75,
    rank: 5,
    overallGrade: "B+",
    attendance: 92.5
  },
  {
    id: "sr2",
    studentName: "Emma Williams",
    studentId: "ST10045",
    admissionId: "ADM2021/145",
    grade: "Grade 11",
    rollNumber: "11A-02",
    photo: "/avatars/02.png",
    exams: [
      { id: "e1", examName: "Mid-Term Physics Exam", subject: "Physics", marks: 78, totalMarks: 100, grade: "B+", percentage: 78 },
      { id: "e2", examName: "Mid-Term Chemistry Exam", subject: "Chemistry", marks: 82, totalMarks: 100, grade: "A", percentage: 82 },
      { id: "e3", examName: "Mid-Term Mathematics Exam", subject: "Mathematics", marks: 95, totalMarks: 100, grade: "A+", percentage: 95 },
      { id: "e4", examName: "Mid-Term English Exam", subject: "English", marks: 88, totalMarks: 100, grade: "A", percentage: 88 },
      { id: "e5", examName: "Mid-Term Computer Science Exam", subject: "Computer Science", marks: 80, totalMarks: 100, grade: "B+", percentage: 80 },
    ],
    totalMarks: 400,
    obtainedMarks: 343,
    percentage: 85.75,
    rank: 2,
    overallGrade: "A",
    attendance: 96.0
  }
];

// Subject data
const subjects = [
  { id: "s1", name: "Physics" },
  { id: "s2", name: "Chemistry" },
  { id: "s3", name: "Biology" },
  { id: "s4", name: "Mathematics" },
  { id: "s5", name: "English" },
  { id: "s6", name: "History" },
  { id: "s7", name: "Geography" },
  { id: "s8", name: "Computer Science" },
];

// Grade data
const grades = [
  { id: "g9", name: "Grade 9" },
  { id: "g10", name: "Grade 10" },
  { id: "g11", name: "Grade 11" },
  { id: "g12", name: "Grade 12" },
];

// Exam types
const examTypes = [
  { id: "et1", name: "Mid-Term" },
  { id: "et2", name: "Final" },
  { id: "et3", name: "Unit Test" },
  { id: "et4", name: "Quiz" },
];

export default function ResultsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [examTypeFilter, setExamTypeFilter] = useState("all");
  const [viewResultsDialogOpen, setViewResultsDialogOpen] = useState(false);
  const [viewStudentResultsDialogOpen, setViewStudentResultsDialogOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string>("examDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [viewTab, setViewTab] = useState<string>("exams");

  // Filter exam results based on search and filters
  const filteredExams = examResultsData.filter(exam => {
    const matchesSearch = exam.examName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          exam.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = subjectFilter === "all" || exam.subject === subjects.find(s => s.id === subjectFilter)?.name;
    const matchesGrade = gradeFilter === "all" || exam.grade === grades.find(g => g.id === gradeFilter)?.name;
    
    // For examType, we'd extract type from exam name, but in a real app this would be a separate field
    const examType = exam.examName.includes("Mid-Term") ? "Mid-Term" : 
                     exam.examName.includes("Final") ? "Final" : 
                     exam.examName.includes("Unit Test") ? "Unit Test" : "Quiz";
    const matchesExamType = examTypeFilter === "all" || examType === examTypes.find(t => t.id === examTypeFilter)?.name;
    
    return matchesSearch && matchesSubject && matchesGrade && matchesExamType;
  });

  // Sort filtered exams
  const sortedFilteredExams = [...filteredExams].sort((a, b) => {
    let comparison = 0;
    
    switch (sortColumn) {
      case "examName":
        comparison = a.examName.localeCompare(b.examName);
        break;
      case "subject":
        comparison = a.subject.localeCompare(b.subject);
        break;
      case "grade":
        comparison = a.grade.localeCompare(b.grade);
        break;
      case "examDate":
        comparison = new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
        break;
      case "averageScore":
        comparison = a.averageScore - b.averageScore;
        break;
      case "passPercentage":
        comparison = a.passPercentage - b.passPercentage;
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === "asc" ? comparison : -comparison;
  });

  function handleSort(column: string) {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  function handleViewResults(examId: string) {
    setSelectedExamId(examId);
    setViewResultsDialogOpen(true);
  }

  function handleViewStudentResults(studentId: string) {
    setSelectedStudentId(studentId);
    setViewStudentResultsDialogOpen(true);
  }

  function publishResults(examId: string) {
    // Handle publishing results
    console.log(`Publishing results for exam ID: ${examId}`);
  }

  const selectedExam = examResultsData.find(e => e.id === selectedExamId);
  const selectedStudent = studentResultsData.find(s => s.id === selectedStudentId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/assessment">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Examination Results</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="exams" onValueChange={setViewTab}>
        <TabsList>
          <TabsTrigger value="exams">Exam Results</TabsTrigger>
          <TabsTrigger value="students">Student Results</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="exams">
          {/* Search and filters */}
          <div className="flex flex-col md:flex-row gap-4 mt-4 mb-6">
            <div className="md:w-1/2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search by exam name or subject..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="md:w-1/2 flex flex-wrap gap-2">
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {grades.map(grade => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={examTypeFilter} onValueChange={setExamTypeFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Exam Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {examTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle>Exam Results</CardTitle>
                  <CardDescription>
                    View and manage results for all examinations
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {sortedFilteredExams.length > 0 ? (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th 
                          className="py-3 px-4 text-left font-medium text-gray-500 cursor-pointer"
                          onClick={() => handleSort("examName")}
                        >
                          <div className="flex items-center">
                            Exam Name
                            {sortColumn === "examName" && (
                              <ArrowUpDown className="ml-1 h-3 w-3" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="py-3 px-4 text-left font-medium text-gray-500 cursor-pointer"
                          onClick={() => handleSort("subject")}
                        >
                          <div className="flex items-center">
                            Subject
                            {sortColumn === "subject" && (
                              <ArrowUpDown className="ml-1 h-3 w-3" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="py-3 px-4 text-left font-medium text-gray-500 cursor-pointer"
                          onClick={() => handleSort("grade")}
                        >
                          <div className="flex items-center">
                            Grade
                            {sortColumn === "grade" && (
                              <ArrowUpDown className="ml-1 h-3 w-3" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="py-3 px-4 text-left font-medium text-gray-500 cursor-pointer"
                          onClick={() => handleSort("examDate")}
                        >
                          <div className="flex items-center">
                            Date
                            {sortColumn === "examDate" && (
                              <ArrowUpDown className="ml-1 h-3 w-3" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="py-3 px-4 text-left font-medium text-gray-500 cursor-pointer"
                          onClick={() => handleSort("averageScore")}
                        >
                          <div className="flex items-center">
                            Avg. Score
                            {sortColumn === "averageScore" && (
                              <ArrowUpDown className="ml-1 h-3 w-3" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="py-3 px-4 text-left font-medium text-gray-500 cursor-pointer"
                          onClick={() => handleSort("passPercentage")}
                        >
                          <div className="flex items-center">
                            Pass %
                            {sortColumn === "passPercentage" && (
                              <ArrowUpDown className="ml-1 h-3 w-3" />
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">
                          Status
                        </th>
                        <th className="py-3 px-4 text-right font-medium text-gray-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedFilteredExams.map(exam => (
                        <tr key={exam.id} className="border-b">
                          <td className="py-3 px-4 align-middle font-medium">{exam.examName}</td>
                          <td className="py-3 px-4 align-middle">{exam.subject}</td>
                          <td className="py-3 px-4 align-middle">{exam.grade}</td>
                          <td className="py-3 px-4 align-middle">
                            {new Date(exam.examDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <div className="flex items-center gap-2">
                              <Progress
                                value={exam.averageScore}
                                className="h-2 w-16"
                              />
                              <span>{exam.averageScore.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <Badge className={
                              exam.passPercentage >= 90 ? "bg-green-100 text-green-800" :
                              exam.passPercentage >= 75 ? "bg-blue-100 text-blue-800" :
                              exam.passPercentage >= 60 ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }>
                              {exam.passPercentage.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            {exam.isPublished ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Published
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-800">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Draft
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 align-middle text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewResults(exam.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {!exam.isPublished && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => publishResults(exam.id)}
                              >
                                Publish
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">No results found</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {searchTerm || subjectFilter !== "all" || gradeFilter !== "all" || examTypeFilter !== "all"
                      ? "Try adjusting your filters to find what you're looking for"
                      : "No exam results have been added yet"
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="students">
          <div className="mt-4 mb-6">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search by student name or ID..."
                className="pl-9"
              />
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Student Results</CardTitle>
              <CardDescription>View and manage individual student performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Student</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">ID</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Grade</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Average</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Rank</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentResultsData.map(student => (
                      <tr key={student.id} className="border-b">
                        <td className="py-3 px-4 align-middle font-medium">{student.studentName}</td>
                        <td className="py-3 px-4 align-middle">{student.studentId}</td>
                        <td className="py-3 px-4 align-middle">{student.grade}</td>
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={student.percentage}
                              className="h-2 w-16"
                            />
                            <span>{student.percentage.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <Badge variant="outline">{student.rank}</Badge>
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewStudentResults(student.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Results
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="grid gap-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>Analyze exam results and student performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-10">
                  <BarChart className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">Analytics Dashboard</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    This feature will display comprehensive analytics on exam results
                  </p>
                  <Button>
                    Generate Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* View Exam Results Dialog */}
      <Dialog open={viewResultsDialogOpen} onOpenChange={setViewResultsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedExam?.examName}</DialogTitle>
            <DialogDescription>
              Detailed results for {selectedExam?.subject} - {selectedExam?.grade}
            </DialogDescription>
          </DialogHeader>
          
          {selectedExam && (
            <div className="max-h-[70vh] overflow-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-blue-700 font-medium text-sm mb-1">Average Score</div>
                  <div className="text-2xl font-bold">{selectedExam.averageScore.toFixed(1)}%</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-green-700 font-medium text-sm mb-1">Pass Percentage</div>
                  <div className="text-2xl font-bold">{selectedExam.passPercentage.toFixed(1)}%</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-purple-700 font-medium text-sm mb-1">Highest Score</div>
                  <div className="text-2xl font-bold">{selectedExam.highestScore}%</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="text-amber-700 font-medium text-sm mb-1">Attendance</div>
                  <div className="text-2xl font-bold">
                    {selectedExam.totalStudents - selectedExam.absentStudents}/{selectedExam.totalStudents}
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 mb-6">
                <h3 className="font-medium mb-3">Grade Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(selectedExam.gradeDistribution).map(([grade, count]) => (
                    <div key={grade} className="flex items-center gap-3">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-medium
                        ${grade === 'A+' || grade === 'A' ? 'bg-green-100 text-green-800' :
                          grade === 'B+' || grade === 'B' ? 'bg-blue-100 text-blue-800' :
                          grade === 'C+' || grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'}
                      `}>
                        {grade}
                      </div>
                      <div>
                        <div className="font-medium">{count} students</div>
                        <div className="text-xs text-gray-500">
                          {((count / selectedExam.totalStudents) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border rounded-lg mb-4">
                <div className="bg-gray-50 py-3 px-4 border-b">
                  <h3 className="font-medium">Student Results</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Student</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">ID</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Marks</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Grade</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Mock student results - in a real app this would be fetched */}
                      {[...Array(5)].map((_, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-3 px-4">Student Name {index + 1}</td>
                          <td className="py-3 px-4">ST100{index + 1}</td>
                          <td className="py-3 px-4">
                            {Math.floor(Math.random() * (95 - 35 + 1)) + 35}/100
                          </td>
                          <td className="py-3 px-4">
                            {['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'][Math.floor(Math.random() * 8)]}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={
                              Math.random() > 0.2 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }>
                              {Math.random() > 0.2 ? "Pass" : "Fail"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewResultsDialogOpen(false)}>
              Close
            </Button>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print Results
            </Button>
            {!selectedExam?.isPublished && (
              <Button>
                Publish Results
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Student Results Dialog */}
      <Dialog open={viewStudentResultsDialogOpen} onOpenChange={setViewStudentResultsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Student Results: {selectedStudent?.studentName}</DialogTitle>
            <DialogDescription>
              {selectedStudent?.grade} | Roll No: {selectedStudent?.rollNumber} | ID: {selectedStudent?.studentId}
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="max-h-[70vh] overflow-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-blue-700 font-medium text-sm mb-1">Overall Percentage</div>
                  <div className="text-2xl font-bold">{selectedStudent.percentage.toFixed(1)}%</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-green-700 font-medium text-sm mb-1">Overall Grade</div>
                  <div className="text-2xl font-bold">{selectedStudent.overallGrade}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-purple-700 font-medium text-sm mb-1">Class Rank</div>
                  <div className="text-2xl font-bold">{selectedStudent.rank}</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="text-amber-700 font-medium text-sm mb-1">Attendance</div>
                  <div className="text-2xl font-bold">{selectedStudent.attendance}%</div>
                </div>
              </div>
              
              <div className="border rounded-lg mb-4">
                <div className="bg-gray-50 py-3 px-4 border-b">
                  <h3 className="font-medium">Subject-wise Performance</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Subject</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Exam</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Marks</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Percentage</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudent.exams.map(exam => (
                        <tr key={exam.id} className="border-b">
                          <td className="py-3 px-4 font-medium">{exam.subject}</td>
                          <td className="py-3 px-4">{exam.examName}</td>
                          <td className="py-3 px-4">{exam.marks}/{exam.totalMarks}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Progress
                                value={exam.percentage}
                                className="h-2 w-16"
                              />
                              <span>{exam.percentage}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={
                              exam.grade === 'A+' || exam.grade === 'A' ? "bg-green-100 text-green-800" :
                              exam.grade === 'B+' || exam.grade === 'B' ? "bg-blue-100 text-blue-800" :
                              exam.grade === 'C+' || exam.grade === 'C' ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }>
                              {exam.grade}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">Performance Chart</h3>
                <div className="h-64 bg-gray-50 rounded-md flex items-center justify-center">
                  <p className="text-gray-400">Subject-wise performance chart would appear here</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewStudentResultsDialogOpen(false)}>
              Close
            </Button>
            <Link href={`/admin/assessment/report-cards/${selectedStudent?.id}`}>
              <Button variant="outline">
                Generate Report Card
              </Button>
            </Link>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print Results
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
