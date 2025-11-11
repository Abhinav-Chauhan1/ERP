"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTeacherExam, updateExamResults } from "@/lib/actions/teacherExamsActions";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar,
  Clock, 
  ArrowLeft, 
  Download, 
  Edit, 
  Save, 
  FileText, 
  Search,
  Users, 
  BarChart,
  ChevronDown,
  Check,
  Mail,
  Printer,
  AlertCircle,
  X,
  BookOpen
} from "lucide-react";
import { format } from "date-fns";
import { Chart } from "@/components/dashboard/chart";
import { toast } from "react-hot-toast";

export default async function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const examData = await getTeacherExam(params.id);
        setExam(examData);
        setResults(examData.results);
      } catch (err) {
        console.error("Failed to fetch exam:", err);
        setError("Failed to load exam data");
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [params.id]);

  const handleMarkUpdate = (studentId: string, field: string, value: any) => {
    setResults(prev => 
      prev.map(result => 
        result.studentId === studentId 
          ? { ...result, [field]: value } 
          : result
      )
    );
  };

  const saveResults = async () => {
    setIsSaving(true);
    try {
      const response = await updateExamResults(params.id, results);
      if (response.success) {
        toast.success("Exam results saved successfully");
        setIsGrading(false);
        
        // Refresh exam data to reflect the updated results
        const examData = await getTeacherExam(params.id);
        setExam(examData);
        setResults(examData.results);
      } else {
        toast.error(response.error || "Failed to save results");
      }
    } catch (err) {
      console.error("Failed to save results:", err);
      toast.error("An error occurred while saving results");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredResults = results.filter(result => 
    result.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Exam</h2>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button onClick={() => router.push('/teacher/assessments/exams')}>
          Return to Exams
        </Button>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Exam Not Found</h2>
        <p className="text-gray-500 mb-4">The exam you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button onClick={() => router.push('/teacher/assessments/exams')}>
          Return to Exams
        </Button>
      </div>
    );
  }

  // Format date for display
  const examDate = new Date(exam.date);
  const formattedDate = format(examDate, "MMMM d, yyyy");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/teacher/assessments/exams')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{exam.title}</h1>
          <div className="flex items-center gap-2 text-gray-500">
            <span>{exam.subject}</span>
            <span>•</span>
            <span>{exam.className}</span>
            <span>•</span>
            <span>{exam.examType}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export Results
          </Button>
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Link href={`/teacher/assessments/exams/${params.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" /> Edit Exam
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Exam Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Date</h3>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{formattedDate}</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Time</h3>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>{exam.startTime} - {exam.endTime}</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Subject</h3>
              <div className="flex items-center gap-2 mt-1">
                <BookOpen className="h-4 w-4 text-gray-400" />
                <span>{exam.subject}</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Marks</h3>
              <div className="flex items-center gap-2 mt-1">
                <FileText className="h-4 w-4 text-gray-400" />
                <span>{exam.totalMarks}</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Passing Marks</h3>
              <div className="flex items-center gap-2 mt-1">
                <Check className="h-4 w-4 text-gray-400" />
                <span>{exam.passingMarks}</span>
              </div>
            </div>
            
            {exam.instructions && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Instructions</h3>
                <p className="mt-1 text-sm">{exam.instructions}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Results Summary</CardTitle>
            <CardDescription>Performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Average Mark</p>
                <p className="text-2xl font-bold">{parseFloat(exam.statistics.averageMark).toFixed(1)}</p>
                <p className="text-xs text-gray-500">out of {exam.totalMarks}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Pass Rate</p>
                <p className="text-2xl font-bold">{exam.statistics.passRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">above passing mark</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Highest Mark</p>
                <p className="text-2xl font-bold">{exam.statistics.highestMark}</p>
                <p className="text-xs text-gray-500">out of {exam.totalMarks}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Students</p>
                <p className="text-2xl font-bold">{exam.statistics.present}/{exam.statistics.totalStudents}</p>
                <p className="text-xs text-gray-500">present/total</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Grade Distribution</h3>
              <div className="h-40">
                {Object.keys(exam.statistics.gradeDistribution).length > 0 ? (
                  <Chart
                    title=""
                    data={Object.entries(exam.statistics.gradeDistribution).map(([grade, count]) => ({
                      grade,
                      count,
                    }))}
                    type="bar"
                    xKey="grade"
                    yKey="count"
                    categories={["count"]}
                    colors={["#3b82f6"]}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No grade data available
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Student Results</CardTitle>
            <CardDescription>
              {isGrading ? "Enter marks for each student" : "View and manage student results"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {!isGrading && (
              <Button variant="outline" onClick={() => setIsGrading(true)}>
                <Edit className="mr-2 h-4 w-4" /> Enter Grades
              </Button>
            )}
            {isGrading && (
              <>
                <Button variant="outline" onClick={() => {
                  setIsGrading(false);
                  // Reset to original data
                  setResults(exam.results);
                }}>
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button onClick={saveResults} disabled={isSaving}>
                  {isSaving ? "Saving..." : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save Results
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <div className="relative w-[250px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search students..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-1 h-4 w-4" /> Export CSV
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="mr-1 h-4 w-4" /> Email Results
              </Button>
            </div>
          </div>
          
          <div className="rounded-md border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  {isGrading && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                  )}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                  {isGrading && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                  )}
                  {!isGrading && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResults.length > 0 ? (
                  filteredResults.map((result) => (
                    <tr key={result.studentId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{result.studentName}</div>
                      </td>
                      
                      {isGrading && (
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Checkbox
                            checked={result.isAbsent}
                            onCheckedChange={(checked) => handleMarkUpdate(result.studentId, 'isAbsent', checked)}
                          />
                        </td>
                      )}
                      
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {isGrading ? (
                          <Input
                            type="number"
                            min="0"
                            max={exam.totalMarks}
                            value={result.marks}
                            onChange={(e) => handleMarkUpdate(result.studentId, 'marks', parseFloat(e.target.value))}
                            disabled={result.isAbsent}
                            className="w-20 mx-auto text-center"
                          />
                        ) : (
                          result.isAbsent ? "Absent" : result.marks
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {isGrading ? (
                          <Input
                            type="text"
                            value={result.grade || ""}
                            onChange={(e) => handleMarkUpdate(result.studentId, 'grade', e.target.value)}
                            disabled={result.isAbsent}
                            className="w-20 mx-auto text-center"
                          />
                        ) : (
                          <Badge className={
                            result.isAbsent ? "bg-gray-100 text-gray-800" :
                            result.marks >= exam.passingMarks ? "bg-green-100 text-green-800" : 
                            "bg-red-100 text-red-800"
                          }>
                            {result.isAbsent ? "Absent" : result.grade || (result.marks >= exam.passingMarks ? "Pass" : "Fail")}
                          </Badge>
                        )}
                      </td>
                      
                      {isGrading && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Input
                            type="text"
                            value={result.remarks || ""}
                            onChange={(e) => handleMarkUpdate(result.studentId, 'remarks', e.target.value)}
                            disabled={result.isAbsent}
                            placeholder="Optional remarks"
                          />
                        </td>
                      )}
                      
                      {!isGrading && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {result.remarks || "-"}
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
