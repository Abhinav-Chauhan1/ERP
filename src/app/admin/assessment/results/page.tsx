"use client";


import { useState, useEffect } from "react";
import Link from "next/link";
import { OptimizedImage } from "@/components/shared/optimized-image";
import { 
  ChevronLeft, Search, Download, FileText, 
  Filter, Calendar, BookOpen, GraduationCap, 
  BarChart, ArrowUpDown, Eye, Printer, CheckCircle, 
  AlertCircle, HelpCircle, Loader2, User
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import toast from "react-hot-toast";

// Import schema validation and server actions
import { 
  getExamResults, 
  getStudentResults, 
  getExamResultById, 
  getResultFilters,
  publishExamResults,
  generateReportCard
} from "@/lib/actions/resultsActions";

export default function ResultsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [examTypeFilter, setExamTypeFilter] = useState("all");
  const [termFilter, setTermFilter] = useState("all");
  
  const [viewResultsDialogOpen, setViewResultsDialogOpen] = useState(false);
  const [viewStudentResultsDialogOpen, setViewStudentResultsDialogOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string>("examDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [viewTab, setViewTab] = useState<string>("exams");
  
  const [loading, setLoading] = useState(true);
  const [examResultsLoading, setExamResultsLoading] = useState(false);
  const [studentResultsLoading, setStudentResultsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [examResults, setExamResults] = useState<any[]>([]);
  const [studentResultsList, setStudentResultsList] = useState<any[]>([]);
  const [selectedExamDetails, setSelectedExamDetails] = useState<any>(null);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<any>(null);
  const [filterOptions, setFilterOptions] = useState<any>({
    subjects: [],
    examTypes: [],
    terms: [],
    classes: []
  });

  useEffect(() => {
    fetchExamResults();
    fetchFilterOptions();
  }, []);

  async function fetchFilterOptions() {
    try {
      const result = await getResultFilters();
      if (result.success) {
        setFilterOptions(result.data);
      } else {
        toast.error(result.error || "Failed to fetch filter options");
      }
    } catch (err) {
      console.error("Error fetching filter options:", err);
      toast.error("An unexpected error occurred");
    }
  }

  async function fetchExamResults() {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getExamResults({
        searchTerm: searchTerm || undefined,
        subjectId: subjectFilter !== "all" ? subjectFilter : undefined,
        examTypeId: examTypeFilter !== "all" ? examTypeFilter : undefined,
        termId: termFilter !== "all" ? termFilter : undefined,
      });
      
      if (result.success) {
        setExamResults(result.data || []);
      } else {
        setError(result.error || "Failed to fetch exam results");
        toast.error(result.error || "Failed to fetch exam results");
      }
    } catch (err) {
      console.error("Error fetching exam results:", err);
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  // Apply filters and sorting
  const filteredExams = examResults.filter(exam => {
    if (viewTab !== "exams") return true;
    
    const matchesSearch = !searchTerm || 
                          exam.examName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          exam.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = subjectFilter === "all" || exam.subjectId === subjectFilter;
    const matchesExamType = examTypeFilter === "all" || exam.examTypeId === examTypeFilter;
    const matchesTerm = termFilter === "all" || exam.termId === termFilter;
    
    return matchesSearch && matchesSubject && matchesExamType && matchesTerm;
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

  async function handleViewResults(examId: string) {
    setExamResultsLoading(true);
    setSelectedExamId(examId);
    
    try {
      const result = await getExamResultById(examId);
      
      if (result.success) {
        setSelectedExamDetails(result.data);
        setViewResultsDialogOpen(true);
      } else {
        toast.error(result.error || "Failed to fetch exam details");
      }
    } catch (err) {
      console.error("Error fetching exam details:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setExamResultsLoading(false);
    }
  }

  async function handleViewStudentResults(studentId: string) {
    setStudentResultsLoading(true);
    setSelectedStudentId(studentId);
    
    try {
      const result = await getStudentResults(studentId, termFilter !== "all" ? termFilter : undefined);
      
      if (result.success) {
        setSelectedStudentDetails(result.data);
        setViewStudentResultsDialogOpen(true);
      } else {
        toast.error(result.error || "Failed to fetch student results");
      }
    } catch (err) {
      console.error("Error fetching student results:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setStudentResultsLoading(false);
    }
  }

  async function handlePublishResults(examId: string) {
    try {
      const result = await publishExamResults({
        examId,
        isPublished: true,
        publishDate: new Date(),
        sendNotifications: false
      });
      
      if (result.success) {
        toast.success(result.message || "Results published successfully");
        fetchExamResults();
        setViewResultsDialogOpen(false);
      } else {
        toast.error(result.error || "Failed to publish results");
      }
    } catch (err) {
      console.error("Error publishing results:", err);
      toast.error("An unexpected error occurred");
    }
  }

  async function handleGenerateReportCard(studentId: string, termId: string) {
    try {
      const result = await generateReportCard({
        studentId,
        termId,
        includeRemarks: false
      });
      
      if (result.success) {
        toast.success(result.message || "Report card generated successfully");
        setViewStudentResultsDialogOpen(false);
        // Redirect to report card view
        // router.push(`/admin/assessment/report-cards/${result.data.id}`);
      } else {
        toast.error(result.error || "Failed to generate report card");
      }
    } catch (err) {
      console.error("Error generating report card:", err);
      toast.error("An unexpected error occurred");
    }
  }

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

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by exam name or subject..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchExamResults()}
                />
              </div>
            </div>
            <div className="md:w-1/2 flex flex-wrap gap-2">
              <Select value={subjectFilter} onValueChange={(value) => {
                setSubjectFilter(value);
                fetchExamResults();
              }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {filterOptions.subjects.map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={examTypeFilter} onValueChange={(value) => {
                setExamTypeFilter(value);
                fetchExamResults();
              }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Exam Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {filterOptions.examTypes.map((type: any) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={termFilter} onValueChange={(value) => {
                setTermFilter(value);
                fetchExamResults();
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  {filterOptions.terms.map((term: any) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.name} ({term.academicYear.name})
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
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : sortedFilteredExams.length > 0 ? (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-accent border-b">
                        <th 
                          className="py-3 px-4 text-left font-medium text-muted-foreground cursor-pointer"
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
                          className="py-3 px-4 text-left font-medium text-muted-foreground cursor-pointer"
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
                          className="py-3 px-4 text-left font-medium text-muted-foreground cursor-pointer"
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
                          className="py-3 px-4 text-left font-medium text-muted-foreground cursor-pointer"
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
                          className="py-3 px-4 text-left font-medium text-muted-foreground cursor-pointer"
                          onClick={() => handleSort("passPercentage")}
                        >
                          <div className="flex items-center">
                            Pass %
                            {sortColumn === "passPercentage" && (
                              <ArrowUpDown className="ml-1 h-3 w-3" />
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="py-3 px-4 text-right font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedFilteredExams.map(exam => (
                        <tr key={exam.id} className="border-b">
                          <td className="py-3 px-4 align-middle font-medium">{exam.examName}</td>
                          <td className="py-3 px-4 align-middle">{exam.subject}</td>
                          <td className="py-3 px-4 align-middle">
                            {format(new Date(exam.examDate), 'MMM d, yyyy')}
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
                              exam.passPercentage >= 75 ? "bg-primary/10 text-primary" :
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
                                onClick={() => handlePublishResults(exam.id)}
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
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchTerm || subjectFilter !== "all" || examTypeFilter !== "all" || termFilter !== "all"
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
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
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
              <div className="text-center py-12">
                <GraduationCap className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-medium mb-1">Student Results View</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This feature allows you to view results by student
                </p>
                <Button variant="outline">
                  Search for a Student
                </Button>
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
                  <p className="text-sm text-muted-foreground mb-4">
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
            <DialogTitle>{selectedExamDetails?.title}</DialogTitle>
            <DialogDescription>
              {selectedExamDetails?.subject} - {selectedExamDetails?.term} ({selectedExamDetails?.academicYear})
            </DialogDescription>
          </DialogHeader>
          
          {examResultsLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : selectedExamDetails ? (
            <div className="max-h-[70vh] overflow-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-primary/10 rounded-lg p-4">
                  <div className="text-primary font-medium text-sm mb-1">Average Score</div>
                  <div className="text-2xl font-bold">{selectedExamDetails.averageScore.toFixed(1)}%</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-green-700 font-medium text-sm mb-1">Pass Percentage</div>
                  <div className="text-2xl font-bold">{selectedExamDetails.passPercentage.toFixed(1)}%</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-purple-700 font-medium text-sm mb-1">Highest Score</div>
                  <div className="text-2xl font-bold">{selectedExamDetails.highestScore}%</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="text-amber-700 font-medium text-sm mb-1">Attendance</div>
                  <div className="text-2xl font-bold">
                    {selectedExamDetails.presentStudents}/{selectedExamDetails.totalStudents}
                  </div>
                </div>
              </div>
              
              {Object.keys(selectedExamDetails.gradeDistribution).length > 0 && (
                <div className="border rounded-lg p-4 mb-6">
                  <h3 className="font-medium mb-3">Grade Distribution</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(selectedExamDetails.gradeDistribution).map(([grade, count]: [string, any]) => (
                      <div key={grade} className="flex items-center gap-3">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center font-medium
                          ${grade === 'A+' || grade === 'A' ? 'bg-green-100 text-green-800' :
                            grade === 'B+' || grade === 'B' ? 'bg-primary/10 text-primary' :
                            grade === 'C+' || grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'}
                        `}>
                          {grade}
                        </div>
                        <div>
                          <div className="font-medium">{count} students</div>
                          <div className="text-xs text-muted-foreground">
                            {((count / selectedExamDetails.totalStudents) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="border rounded-lg mb-4">
                <div className="bg-accent py-3 px-4 border-b">
                  <h3 className="font-medium">Student Results</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Student</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">ID</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Marks</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Grade</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedExamDetails.studentResults.map((result: any) => (
                        <tr key={result.id} className="border-b">
                          <td className="py-3 px-4">{result.student.name}</td>
                          <td className="py-3 px-4">{result.student.admissionId}</td>
                          <td className="py-3 px-4">
                            {result.isAbsent ? '-' : `${result.marks}/${selectedExamDetails.totalMarks}`}
                          </td>
                          <td className="py-3 px-4">
                            {result.isAbsent ? '-' : result.grade || '-'}
                          </td>
                          <td className="py-3 px-4">
                            {result.isAbsent ? (
                              <Badge className="bg-muted text-gray-800">Absent</Badge>
                            ) : (
                              <Badge className={result.isPass ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                {result.isPass ? "Pass" : "Fail"}
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No details available
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
            {selectedExamDetails && !selectedExamDetails.isPublished && (
              <Button onClick={() => handlePublishResults(selectedExamDetails.id)}>
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
            <DialogTitle>Student Results</DialogTitle>
            <DialogDescription>
              Performance details for this student
            </DialogDescription>
          </DialogHeader>
          
          {studentResultsLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : selectedStudentDetails ? (
            <div className="max-h-[70vh] overflow-auto pr-2">
              <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
                <div className="md:w-1/4">
                  <div className="w-24 h-24 rounded-full bg-muted mx-auto overflow-hidden">
                    {selectedStudentDetails.student.photo ? (
                      <OptimizedImage 
                        src={selectedStudentDetails.student.photo} 
                        alt={selectedStudentDetails.student.name} 
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                        qualityPreset="high"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <User className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:w-3/4">
                  <h2 className="text-xl font-bold">{selectedStudentDetails.student.name}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    <div>
                      <p className="text-sm text-muted-foreground">ID</p>
                      <p className="font-medium">{selectedStudentDetails.student.admissionId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Class</p>
                      <p className="font-medium">{selectedStudentDetails.student.grade}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Roll Number</p>
                      <p className="font-medium">{selectedStudentDetails.student.rollNumber || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-primary/10 rounded-lg p-4">
                  <div className="text-primary font-medium text-sm mb-1">Overall Percentage</div>
                  <div className="text-2xl font-bold">{selectedStudentDetails.summary.percentage.toFixed(1)}%</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-green-700 font-medium text-sm mb-1">Overall Grade</div>
                  <div className="text-2xl font-bold">{selectedStudentDetails.summary.grade}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-purple-700 font-medium text-sm mb-1">Exams Taken</div>
                  <div className="text-2xl font-bold">{selectedStudentDetails.summary.totalExams}</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="text-amber-700 font-medium text-sm mb-1">Attendance</div>
                  <div className="text-2xl font-bold">{selectedStudentDetails.summary.attendance}%</div>
                </div>
              </div>
              
              <div className="border rounded-lg mb-4">
                <div className="bg-accent py-3 px-4 border-b">
                  <h3 className="font-medium">Subject-wise Performance</h3>
                </div>
                {selectedStudentDetails.exams.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Subject</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Exam</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Date</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Marks</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Percentage</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStudentDetails.exams.map((exam: any) => (
                          <tr key={exam.id} className="border-b">
                            <td className="py-3 px-4 font-medium">{exam.subject}</td>
                            <td className="py-3 px-4">{exam.examName}</td>
                            <td className="py-3 px-4">{format(new Date(exam.date), 'MMM d, yyyy')}</td>
                            <td className="py-3 px-4">
                              {exam.isAbsent ? 'Absent' : `${exam.marks}/${exam.totalMarks}`}
                            </td>
                            <td className="py-3 px-4">
                              {exam.isAbsent ? '-' : (
                                <div className="flex items-center gap-2">
                                  <Progress
                                    value={exam.percentage}
                                    className="h-2 w-16"
                                  />
                                  <span>{exam.percentage.toFixed(1)}%</span>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {exam.isAbsent ? '-' : (
                                <Badge className={
                                  exam.grade === 'A+' || exam.grade === 'A' ? "bg-green-100 text-green-800" :
                                  exam.grade === 'B+' || exam.grade === 'B' ? "bg-primary/10 text-primary" :
                                  exam.grade === 'C+' || exam.grade === 'C' ? "bg-yellow-100 text-yellow-800" :
                                  "bg-red-100 text-red-800"
                                }>
                                  {exam.grade || '-'}
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    No exam results found for this student
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No student details available
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewStudentResultsDialogOpen(false)}>
              Close
            </Button>
            {selectedStudentDetails && (
              <>
                <Button variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Results
                </Button>
                <Button 
                  onClick={() => handleGenerateReportCard(
                    selectedStudentDetails.student.id, 
                    termFilter !== "all" ? termFilter : filterOptions.terms[0]?.id
                  )}
                >
                  Generate Report Card
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

