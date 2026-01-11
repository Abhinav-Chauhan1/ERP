"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getExamResultDetails, updateExamResults } from "@/lib/actions/teacherResultsActions";
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
import { Textarea } from "@/components/ui/textarea";
import { Chart } from "@/components/dashboard/chart";
import { 
  ArrowLeft,
  Download,
  Search,
  Calendar,
  Save,
  X,
  PenLine,
  CheckCircle2,
  XCircle,
  UserX,
  Users,
  BarChart4,
  Printer,
  FileText,
  AlertCircle,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

export default function ExamResultDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const [examData, setExamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const examId = params.id;

  useEffect(() => {
    if (!examId) return;
    
    const fetchExamDetails = async () => {
      setLoading(true);
      try {
        const data = await getExamResultDetails(examId);
        setExamData(data);
        setStudents(data.students);
      } catch (error) {
        console.error("Failed to fetch exam details:", error);
        toast.error("Failed to load exam results");
      } finally {
        setLoading(false);
      }
    };
    
    fetchExamDetails();
  }, [examId]);

  const handleResultChange = (studentId: string, field: string, value: any) => {
    setStudents(prevStudents => 
      prevStudents.map(student => 
        student.id === studentId 
          ? { ...student, [field]: value } 
          : student
      )
    );
  };

  const saveResults = async () => {
    setIsSaving(true);
    try {
      const results = students.map(student => ({
        resultId: student.resultId,
        marks: parseFloat(student.marks),
        grade: student.grade,
        remarks: student.remarks,
        isAbsent: student.isAbsent
      }));
      
      const response = await updateExamResults(examId, results);
      
      if (response.success) {
        toast.success("Results updated successfully");
        setIsEditing(false);
        
        // Refresh exam data
        const data = await getExamResultDetails(examId);
        setExamData(data);
        setStudents(data.students);
      } else {
        toast.error(response.error || "Failed to update results");
      }
    } catch (error) {
      console.error("Failed to save results:", error);
      toast.error("An error occurred while saving results");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAbsentToggle = (studentId: string, isAbsent: boolean) => {
    setStudents(prevStudents => 
      prevStudents.map(student => 
        student.id === studentId 
          ? { 
              ...student, 
              isAbsent,
              marks: isAbsent ? 0 : student.marks,
            } 
          : student
      )
    );
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort students by marks (highest to lowest)
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (a.isAbsent && !b.isAbsent) return 1;
    if (!a.isAbsent && b.isAbsent) return -1;
    return b.marks - a.marks;
  });

  // Prepare data for charts
  const gradeData = examData ? Object.entries(examData.statistics.gradeDistribution).map(
    ([grade, count]) => ({ grade, count })
  ) : [];

  const scoreRanges = [
    { range: '91-100', count: 0 },
    { range: '81-90', count: 0 },
    { range: '71-80', count: 0 },
    { range: '61-70', count: 0 },
    { range: '51-60', count: 0 },
    { range: '41-50', count: 0 },
    { range: '31-40', count: 0 },
    { range: '21-30', count: 0 },
    { range: '11-20', count: 0 },
    { range: '0-10', count: 0 },
  ];

  // Calculate score distribution
  if (examData) {
    examData.students.forEach((student: any) => {
      if (student.isAbsent) return;
      
      const percent = (student.marks / examData.totalMarks) * 100;
      if (percent >= 91) scoreRanges[0].count++;
      else if (percent >= 81) scoreRanges[1].count++;
      else if (percent >= 71) scoreRanges[2].count++;
      else if (percent >= 61) scoreRanges[3].count++;
      else if (percent >= 51) scoreRanges[4].count++;
      else if (percent >= 41) scoreRanges[5].count++;
      else if (percent >= 31) scoreRanges[6].count++;
      else if (percent >= 21) scoreRanges[7].count++;
      else if (percent >= 11) scoreRanges[8].count++;
      else scoreRanges[9].count++;
    });
  }

  // Filter only ranges with counts for better visualization
  const filteredScoreRanges = scoreRanges.filter(range => range.count > 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Exam Not Found</h2>
        <p className="text-gray-500 mb-4">The exam you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button onClick={() => router.push('/teacher/assessments/results')}>
          Return to Results
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/teacher/assessments/results')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{examData.title}</h1>
          <div className="flex items-center gap-2 text-gray-500">
            <span>{examData.subject}</span>
            <span>•</span>
            <span>{examData.examType}</span>
            <span>•</span>
            <span>{examData.term}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export Results
          </Button>
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" /> Print Results
          </Button>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <PenLine className="mr-2 h-4 w-4" /> Edit Results
            </Button>
          ) : (
            <Button onClick={() => setIsEditing(false)} variant="destructive">
              <X className="mr-2 h-4 w-4" /> Cancel Editing
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Exam Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Date</h3>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{format(new Date(examData.examDate), "MMMM d, yyyy")}</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Marks</h3>
              <div className="flex items-center gap-2 mt-1">
                <FileText className="h-4 w-4 text-gray-400" />
                <span>{examData.totalMarks}</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Passing Marks</h3>
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle2 className="h-4 w-4 text-gray-400" />
                <span>{examData.passingMarks}</span>
              </div>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium mb-2">Results Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Students</p>
                  <p className="text-xl font-bold">{examData.statistics.totalStudents}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Present</p>
                  <p className="text-xl font-bold text-green-600">{examData.statistics.present}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Passed</p>
                  <p className="text-xl font-bold text-green-600">{examData.statistics.passCount}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Failed</p>
                  <p className="text-xl font-bold text-red-500">{examData.statistics.failCount}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Marks Statistics</h3>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="p-2 bg-gray-50 rounded text-center">
                    <p className="text-xs text-gray-500">Average</p>
                    <p className="font-medium">{examData.statistics.averageMark.toFixed(1)}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-center">
                    <p className="text-xs text-gray-500">Highest</p>
                    <p className="font-medium">{examData.statistics.highestMark}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-center">
                    <p className="text-xs text-gray-500">Lowest</p>
                    <p className="font-medium">{examData.statistics.lowestMark}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Pass Rate</span>
                  <span className="text-sm font-medium">{examData.statistics.passPercentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${examData.statistics.passPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Performance Analysis</CardTitle>
            <CardDescription>Marks distribution and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="distribution">
              <TabsList className="mb-4">
                <TabsTrigger value="distribution">Score Distribution</TabsTrigger>
                <TabsTrigger value="grades">Grade Distribution</TabsTrigger>
              </TabsList>
              
              <TabsContent value="distribution">
                <div className="h-64">
                  <Chart
                    title="Score Distribution"
                    data={filteredScoreRanges}
                    type="bar"
                    xKey="range"
                    yKey="count"
                    categories={["count"]}
                    colors={["#3b82f6"]}
                  />
                </div>
                <div className="flex justify-center mt-2 gap-4 flex-wrap">
                  {filteredScoreRanges.map((range) => (
                    <div key={range.range} className="flex items-center gap-1 text-sm">
                      <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                      <span>{range.range}: </span>
                      <span className="font-medium">{range.count} students</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="grades">
                <div className="h-64">
                  <Chart
                    title="Grade Distribution"
                    data={gradeData}
                    type="pie"
                    xKey="grade"
                    yKey="count"
                    categories={["count"]}
                    colors={["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#64748b"]}
                  />
                </div>
                <div className="flex justify-center mt-2 gap-4 flex-wrap">
                  {gradeData.map((item) => (
                    <div key={item.grade} className="flex items-center gap-1 text-sm">
                      <div className={`w-3 h-3 rounded-sm ${
                        item.grade === 'A+' || item.grade === 'A' ? 'bg-green-500' :
                        item.grade === 'B' ? 'bg-blue-500' :
                        item.grade === 'C' ? 'bg-yellow-500' :
                        item.grade === 'D' ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}></div>
                      <span>{String(item.grade)}: </span>
                      <span className="font-medium">{String(item.count)} students</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Student Results</CardTitle>
            <CardDescription>
              {isEditing ? "Edit student grades and remarks" : "View and analyze student performance"}
            </CardDescription>
          </div>
          {isEditing && (
            <Button onClick={saveResults} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Results
                </>
              )}
            </Button>
          )}
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
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                Total: {examData.statistics.totalStudents}
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Pass: {examData.statistics.passCount}
              </Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700 flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5" />
                Fail: {examData.statistics.failCount}
              </Badge>
              <Badge variant="outline" className="bg-gray-50 text-gray-700 flex items-center gap-1">
                <UserX className="h-3.5 w-3.5" />
                Absent: {examData.statistics.absent}
              </Badge>
            </div>
          </div>
          
          <div className="rounded-md border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                  {isEditing && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                  {!isEditing && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedStudents.length > 0 ? (
                  sortedStudents.map((student) => (
                    <tr key={student.id} className={student.isAbsent ? "bg-gray-50" : ""}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{student.rollNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{student.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{student.className}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            max={examData.totalMarks}
                            value={student.marks || ""}
                            onChange={(e) => handleResultChange(student.id, 'marks', e.target.value)}
                            className="w-20 mx-auto text-center"
                            disabled={student.isAbsent}
                          />
                        ) : (
                          <div className={`font-medium ${
                            student.isAbsent ? "text-gray-400" :
                            student.marks < examData.passingMarks ? "text-red-600" :
                            student.marks >= examData.totalMarks * 0.8 ? "text-green-600" : ""
                          }`}>
                            {student.isAbsent ? "Absent" : `${student.marks}/${examData.totalMarks}`}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {isEditing ? (
                          <Input
                            type="text"
                            value={student.grade || ""}
                            onChange={(e) => handleResultChange(student.id, 'grade', e.target.value)}
                            className="w-16 mx-auto text-center"
                            disabled={student.isAbsent}
                          />
                        ) : (
                          <Badge className={
                            student.isAbsent ? "bg-gray-100 text-gray-800" :
                            student.marks < examData.passingMarks ? "bg-red-100 text-red-800" :
                            student.marks >= examData.totalMarks * 0.8 ? "bg-green-100 text-green-800" : 
                            "bg-blue-100 text-blue-800"
                          }>
                            {student.isAbsent ? "N/A" : student.grade || "N/A"}
                          </Badge>
                        )}
                      </td>
                      {isEditing && (
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex justify-center items-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAbsentToggle(student.id, !student.isAbsent)}
                              className={student.isAbsent ? "text-red-500" : "text-gray-500"}
                            >
                              {student.isAbsent ? (
                                <>
                                  <UserX className="h-4 w-4 mr-1" /> Absent
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-1" /> Present
                                </>
                              )}
                            </Button>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <Input
                            type="text"
                            value={student.remarks || ""}
                            onChange={(e) => handleResultChange(student.id, 'remarks', e.target.value)}
                            className="w-full"
                          />
                        ) : (
                          <div className="text-sm">{student.remarks || "-"}</div>
                        )}
                      </td>
                      {!isEditing && (
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Link href={`/teacher/students/${student.id}`}>
                            <Button variant="ghost" size="sm">View Profile</Button>
                          </Link>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isEditing ? 7 : 7} className="px-6 py-4 text-center text-gray-500">
                      No students found matching the search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export Results
          </Button>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              <PenLine className="mr-2 h-4 w-4" /> Edit Results
            </Button>
          )}
          {isEditing && (
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button onClick={saveResults} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Save Results
                  </>
                )}
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
