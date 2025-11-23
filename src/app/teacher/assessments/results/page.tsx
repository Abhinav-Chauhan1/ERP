"use client";


import { useState, useEffect } from "react";
import Link from "next/link";
import { getTeacherResults } from "@/lib/actions/teacherResultsActions";
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Calendar,
  Filter,
  PenLine,
  Search,
  FileText,
  AlertCircle,
  CheckCircle2, 
  XCircle,
  ArrowUpRight,
  Download,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

export default function TeacherResultsPage() {
  const [activeTab, setActiveTab] = useState("exams");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [results, setResults] = useState<{
    exams: any[];
    assignments: any[];
    subjects: any[];
    classes: any[];
  }>({
    exams: [],
    assignments: [],
    subjects: [],
    classes: [],
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const data = await getTeacherResults(
          selectedClass !== "all" ? selectedClass : undefined,
          selectedSubject !== "all" ? selectedSubject : undefined
        );
        setResults(data);
      } catch (error) {
        console.error("Failed to fetch results:", error);
        toast.error("Failed to load results");
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [selectedSubject, selectedClass]);
  
  const filteredExams = results.exams.filter(exam => 
    exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.classNames.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredAssignments = results.assignments.filter(assignment => 
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.classNames.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const getExamStatusBadge = (exam: any) => {
    const now = new Date();
    const examDate = new Date(exam.examDate);
    
    if (examDate > now) {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Upcoming</Badge>;
    } else if (exam.isGraded) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Graded</Badge>;
    } else {
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Needs Grading</Badge>;
    }
  };
  
  const getAssignmentStatusBadge = (assignment: any) => {
    if (assignment.isFullyGraded) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Fully Graded</Badge>;
    } else if (assignment.gradedCount > 0) {
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Partially Graded</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Not Graded</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Assessment Results</h1>
        <Link href="/teacher/assessments/results/performance">
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" /> Performance Analytics
          </Button>
        </Link>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Exam Results</CardTitle>
            <CardDescription>Overview of student performance in exams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{results.exams.length}</div>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" /> 
              <span>{results.exams.filter(e => e.isGraded).length} graded</span>
              
              {results.exams.some(e => !e.isGraded) && (
                <>
                  <XCircle className="h-4 w-4 text-amber-500 ml-2" /> 
                  <span>{results.exams.filter(e => !e.isGraded).length} need grading</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Assignment Results</CardTitle>
            <CardDescription>Overview of assignment submissions and grades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{results.assignments.length}</div>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" /> 
              <span>
                {results.assignments.filter(a => a.isFullyGraded).length} fully graded
              </span>
              
              {results.assignments.some(a => !a.isFullyGraded) && (
                <>
                  <XCircle className="h-4 w-4 text-amber-500 ml-2" /> 
                  <span>
                    {results.assignments.filter(a => !a.isFullyGraded).length} need grading
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Average Performance</CardTitle>
            <CardDescription>Overall class performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {calculateOverallAverage(results.exams, results.assignments)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div 
                className="bg-primary h-2.5 rounded-full" 
                style={{ width: `${calculateOverallAverage(results.exams, results.assignments)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="exams" onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <TabsList>
            <TabsTrigger value="exams">Exam Results</TabsTrigger>
            <TabsTrigger value="assignments">Assignment Results</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2 flex-wrap">
            <div className="relative min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search results..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select 
              value={selectedSubject} 
              onValueChange={setSelectedSubject}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-3.5 w-3.5" />
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {results.subjects.map(subject => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={selectedClass} 
              onValueChange={setSelectedClass}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-3.5 w-3.5" />
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {results.classes.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <TabsContent value="exams" className="mt-0">
          {filteredExams.length > 0 ? (
            <div className="space-y-4">
              {filteredExams.map((exam) => (
                <Card key={exam.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle>{exam.title}</CardTitle>
                        <CardDescription>
                          {exam.subject} • {exam.examType} • {exam.classNames}
                        </CardDescription>
                      </div>
                      {getExamStatusBadge(exam)}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-gray-500">Exam Date</p>
                          <p className="font-medium">{format(new Date(exam.examDate), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Submissions</p>
                        <p className="font-medium">
                          {exam.submittedCount}/{exam.totalStudents}
                          {exam.absentCount > 0 && (
                            <span className="text-xs text-gray-500 ml-1">
                              ({exam.absentCount} absent)
                            </span>
                          )}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Pass Rate</p>
                        <p className="font-medium">
                          {exam.passPercentage}% 
                          <span className="text-xs text-gray-500 ml-1">
                            ({exam.passedCount}/{exam.submittedCount})
                          </span>
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Average Score</p>
                        <p className="font-medium">{exam.avgMarks}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-3">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" /> Export Report
                    </Button>
                    <Link href={`/teacher/assessments/results/exams/${exam.id}`}>
                      <Button size="sm">
                        View Full Results <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <AlertCircle className="h-10 w-10 text-gray-400 mb-3" />
                <h3 className="text-lg font-medium mb-1">No Exam Results Found</h3>
                <p className="text-gray-500 max-w-md">
                  {results.exams.length === 0 
                    ? "You haven't created any exams yet. Create an exam to start recording results."
                    : "No results match your filter criteria. Try adjusting your search or filters."}
                </p>
                <div className="mt-6">
                  <Link href="/teacher/assessments/exams/create">
                    <Button>Create a New Exam</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="assignments" className="mt-0">
          {filteredAssignments.length > 0 ? (
            <div className="space-y-4">
              {filteredAssignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle>{assignment.title}</CardTitle>
                        <CardDescription>
                          {assignment.subject} • {assignment.classNames}
                        </CardDescription>
                      </div>
                      {getAssignmentStatusBadge(assignment)}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-gray-500">Due Date</p>
                          <p className="font-medium">{format(new Date(assignment.dueDate), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Submissions</p>
                        <p className="font-medium">
                          {assignment.submittedCount}/{assignment.totalStudents}
                          <span className="text-xs text-gray-500 ml-1">
                            ({assignment.pendingCount} pending)
                          </span>
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Graded</p>
                        <p className="font-medium">
                          {assignment.gradedCount}/{assignment.submittedCount}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Average Score</p>
                        <p className="font-medium">
                          {assignment.avgMarks}/{assignment.totalMarks}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-3">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" /> Export Report
                    </Button>
                    <div className="space-x-2">
                      {!assignment.isFullyGraded && (
                        <Link href={`/teacher/assessments/assignments/${assignment.id}#grade`}>
                          <Button variant="outline" size="sm">
                            <PenLine className="h-4 w-4 mr-2" /> Grade Submissions
                          </Button>
                        </Link>
                      )}
                      <Link href={`/teacher/assessments/results/assignments/${assignment.id}`}>
                        <Button size="sm">
                          View Full Results <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <AlertCircle className="h-10 w-10 text-gray-400 mb-3" />
                <h3 className="text-lg font-medium mb-1">No Assignment Results Found</h3>
                <p className="text-gray-500 max-w-md">
                  {results.assignments.length === 0 
                    ? "You haven't created any assignments yet. Create an assignment to start recording results."
                    : "No results match your filter criteria. Try adjusting your search or filters."}
                </p>
                <div className="mt-6">
                  <Link href="/teacher/assessments/assignments/create">
                    <Button>Create a New Assignment</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Student Performance Analysis</CardTitle>
          <CardDescription>Compare student performance across different assessments</CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-gray-500 mb-4">
            Get detailed insights into student performance, including trends, comparisons, and areas for improvement.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border rounded-lg flex flex-col items-center text-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mb-3">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-medium mb-1">Student Reports</h3>
              <p className="text-sm text-gray-500 mb-3">Generate detailed reports for individual students</p>
              <Link href="/teacher/assessments/results/students">
                <Button variant="outline" size="sm">
                  View Student Reports
                </Button>
              </Link>
            </div>
            
            <div className="p-4 border rounded-lg flex flex-col items-center text-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mb-3">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="font-medium mb-1">Class Performance</h3>
              <p className="text-sm text-gray-500 mb-3">Analyze overall class performance and trends</p>
              <Link href="/teacher/assessments/results/classes">
                <Button variant="outline" size="sm">
                  View Class Performance
                </Button>
              </Link>
            </div>
            
            <div className="p-4 border rounded-lg flex flex-col items-center text-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 mb-3">
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <h3 className="font-medium mb-1">Subject Analysis</h3>
              <p className="text-sm text-gray-500 mb-3">Review performance trends by subject</p>
              <Link href="/teacher/assessments/results/subjects">
                <Button variant="outline" size="sm">
                  View Subject Analysis
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center pt-2">
          <Link href="/teacher/assessments/results/performance">
            <Button>
              <BarChart3 className="mr-2 h-4 w-4" /> Full Performance Analytics
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

// Helper function to calculate overall average score
function calculateOverallAverage(exams: any[], assignments: any[]) {
  if (exams.length === 0 && assignments.length === 0) return 0;
  
  // Calculate average for exams
  const examScores = exams.map(exam => parseFloat(exam.avgMarks));
  const examAvg = examScores.length > 0 
    ? examScores.reduce((sum, score) => sum + score, 0) / examScores.length 
    : 0;
  
  // Calculate average for assignments
  const assignmentScores = assignments.map(assignment => 
    (parseFloat(assignment.avgMarks) / assignment.totalMarks) * 100
  );
  const assignmentAvg = assignmentScores.length > 0 
    ? assignmentScores.reduce((sum, score) => sum + score, 0) / assignmentScores.length 
    : 0;
  
  // Calculate weighted average based on the number of each type
  const totalCount = exams.length + assignments.length;
  const weightedAvg = ((examAvg * exams.length) + (assignmentAvg * assignments.length)) / totalCount;
  
  return Math.round(weightedAvg);
}

