"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Edit,
  Download,
  Plus,
  Search,
  AlertCircle,
  Loader2,
  FileText,
  User,
  Calendar,
  Clock,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import toast from "react-hot-toast";

import { getExamById, saveExamResult, deleteExamResult } from "@/lib/actions/examsActions";
import { examResultSchema, ExamResultFormValues } from "@/lib/schemaValidation/examsSchemaValidation";

export default function ExamDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const resultForm = useForm<ExamResultFormValues>({
    resolver: zodResolver(examResultSchema),
    defaultValues: {
      examId: examId,
      marks: 0,
      isAbsent: false,
    },
  });

  const fetchExamDetails = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getExamById(examId);

      if (result.success) {
        setExam(result.data);
      } else {
        setError(result.error || "Failed to fetch exam details");
        toast.error(result.error || "Failed to fetch exam details");
      }
    } catch (err) {
      console.error("Error fetching exam details:", err);
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchExamDetails();
  }, [examId, fetchExamDetails]);

  const handleEditResult = (studentId: string) => {
    const existingResult = exam.results.find((r: any) => r.student.id === studentId);

    if (existingResult) {
      resultForm.reset({
        examId: examId,
        studentId: studentId,
        marks: existingResult.marks,
        remarks: existingResult.remarks || "",
        isAbsent: existingResult.isAbsent,
      });
    } else {
      resultForm.reset({
        examId: examId,
        studentId: studentId,
        marks: 0,
        remarks: "",
        isAbsent: false,
      });
    }

    setSelectedStudentId(studentId);
    setResultDialogOpen(true);
  };

  const handleAddResult = (studentId: string) => {
    resultForm.reset({
      examId: examId,
      studentId: studentId,
      marks: 0,
      remarks: "",
      isAbsent: false,
    });

    setSelectedStudentId(studentId);
    setResultDialogOpen(true);
  };

  const onResultSubmit = async (values: ExamResultFormValues) => {
    try {
      const result = await saveExamResult(values);

      if (result.success) {
        toast.success("Exam result saved successfully");
        setResultDialogOpen(false);
        fetchExamDetails();
      } else {
        toast.error(result.error || "Failed to save exam result");
      }
    } catch (err) {
      console.error("Error saving exam result:", err);
      toast.error("An unexpected error occurred");
    }
  };

  const handleDeleteResult = (resultId: string) => {
    setSelectedStudentId(resultId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteResult = async () => {
    if (!selectedStudentId) return;

    try {
      const result = await deleteExamResult(selectedStudentId);

      if (result.success) {
        toast.success("Result deleted successfully");
        setDeleteDialogOpen(false);
        fetchExamDetails();
      } else {
        toast.error(result.error || "Failed to delete result");
      }
    } catch (err) {
      console.error("Error deleting result:", err);
      toast.error("An unexpected error occurred");
    }
  };

  const filteredStudents = exam?.results.filter((result: any) => {
    if (!searchTerm) return true;

    const studentName = `${result.student.user.firstName} ${result.student.user.lastName}`.toLowerCase();
    const admissionId = result.student.admissionId?.toLowerCase() || "";
    const rollNumber = (result.student.rollNumber || "").toLowerCase();

    return (
      studentName.includes(searchTerm.toLowerCase()) ||
      admissionId.includes(searchTerm.toLowerCase()) ||
      rollNumber.includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/admin/assessment/exams">Back to Exams</Link>
        </Button>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>The requested exam could not be found</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/admin/assessment/exams">Back to Exams</Link>
        </Button>
      </div>
    );
  }

  // Calculate stats
  const totalStudents = exam.results.length;
  const presentStudents = exam.results.filter((r: any) => !r.isAbsent).length;
  const absentPercentage = totalStudents ? (totalStudents - presentStudents) / totalStudents * 100 : 0;
  const totalMarks = presentStudents ? exam.results.filter((r: any) => !r.isAbsent).reduce((sum: number, r: any) => sum + r.marks, 0) : 0;
  const averageMarks = presentStudents ? totalMarks / presentStudents : 0;
  const passedStudents = exam.results.filter((r: any) => !r.isAbsent && r.marks >= exam.passingMarks).length;
  const passPercentage = presentStudents ? (passedStudents / presentStudents) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/assessment/exams">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{exam.title}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/assessment/exams/${exam.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Exam
            </Button>
          </Link>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Exam Details</CardTitle>
              <CardDescription>
                {exam.examType.name} • {exam.subject.name}
              </CardDescription>
            </div>
            <Badge className={
              new Date(exam.examDate) > new Date()
                ? "bg-blue-100 text-blue-800"
                : "bg-green-100 text-green-800"
            }>
              {new Date(exam.examDate) > new Date() ? "Upcoming" : "Completed"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Date:</span>
                <span>{format(new Date(exam.examDate), 'MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Time:</span>
                <span>{format(new Date(exam.startTime), 'h:mm a')} - {format(new Date(exam.endTime), 'h:mm a')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Created By:</span>
                <span>
                  {exam.creator ?
                    `${exam.creator.user.firstName} ${exam.creator.user.lastName}` :
                    "System"
                  }
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Total Marks:</span>
                <span>{exam.totalMarks}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Passing Marks:</span>
                <span>{exam.passingMarks}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Term:</span>
                <span>{exam.term.name} ({exam.term.academicYear.name})</span>
              </div>
            </div>
            <div className="border-l pl-6">
              <h3 className="font-medium text-sm mb-1">Instructions:</h3>
              <p className="text-sm text-gray-600">
                {exam.instructions || "No specific instructions provided."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Exam Summary</CardTitle>
              <CardDescription>
                Overall performance and statistics for this exam
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Total Students</div>
                  <div className="text-2xl font-bold">{totalStudents}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Average Score</div>
                  <div className="text-2xl font-bold">{averageMarks.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">
                    {(averageMarks / exam.totalMarks * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Pass Rate</div>
                  <div className="text-2xl font-bold">{passPercentage.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">
                    {passedStudents} out of {presentStudents}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Absent</div>
                  <div className="text-2xl font-bold">
                    {absentPercentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {totalStudents - presentStudents} out of {totalStudents}
                  </div>
                </div>
              </div>

              {presentStudents > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h3 className="font-medium mb-3">Score Distribution</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-green-600 h-2.5 rounded-full"
                            style={{ width: `${Math.min(100, (presentStudents ? exam.results.filter((r: any) => !r.isAbsent && r.marks >= exam.totalMarks * 0.75).length / presentStudents * 100 : 0))}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium whitespace-nowrap">75% - 100%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${Math.min(100, (presentStudents ? exam.results.filter((r: any) => !r.isAbsent && r.marks >= exam.totalMarks * 0.5 && r.marks < exam.totalMarks * 0.75).length / presentStudents * 100 : 0))}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium whitespace-nowrap">50% - 74%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-yellow-500 h-2.5 rounded-full"
                            style={{ width: `${Math.min(100, (presentStudents ? exam.results.filter((r: any) => !r.isAbsent && r.marks >= exam.totalMarks * 0.35 && r.marks < exam.totalMarks * 0.5).length / presentStudents * 100 : 0))}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium whitespace-nowrap">35% - 49%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-red-600 h-2.5 rounded-full"
                            style={{ width: `${Math.min(100, (presentStudents ? exam.results.filter((r: any) => !r.isAbsent && r.marks < exam.totalMarks * 0.35).length / presentStudents * 100 : 0))}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium whitespace-nowrap">Below 35%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Top Performers</h3>
                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="py-2 px-4 text-left font-medium text-gray-500">Student</th>
                            <th className="py-2 px-4 text-left font-medium text-gray-500">Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exam.results
                            .filter((r: any) => !r.isAbsent)
                            .sort((a: any, b: any) => b.marks - a.marks)
                            .slice(0, 5)
                            .map((result: any) => (
                              <tr key={result.id} className="border-b">
                                <td className="py-2 px-4">
                                  {result.student.user.firstName} {result.student.user.lastName}
                                </td>
                                <td className="py-2 px-4">
                                  {result.marks}/{exam.totalMarks} ({(result.marks / exam.totalMarks * 100).toFixed(1)}%)
                                </td>
                              </tr>
                            ))
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle>Student Results</CardTitle>
                  <CardDescription>
                    Manage and view individual student performance
                  </CardDescription>
                </div>
                <div className="relative md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search by student name..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Student</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Marks</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Grade</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Remarks</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((result: any) => (
                      <tr key={result.id} className="border-b">
                        <td className="py-3 px-4 align-middle">
                          <div className="font-medium">{result.student.user.firstName} {result.student.user.lastName}</div>
                          <div className="text-xs text-gray-500">ID: {result.student.admissionId}</div>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <Badge className={result.isAbsent ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                            {result.isAbsent ? "Absent" : "Present"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          {result.isAbsent ? "-" : (
                            <div className="font-medium">
                              {result.marks}/{exam.totalMarks}
                              <div className="text-xs text-gray-500">
                                {((result.marks / exam.totalMarks) * 100).toFixed(1)}%
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          {result.grade || "-"}
                        </td>
                        <td className="py-3 px-4 align-middle max-w-xs truncate">
                          {result.remarks || "-"}
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditResult(result.student.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => handleDeleteResult(result.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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
      </Tabs>

      {/* Result Form Dialog */}
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Exam Result</DialogTitle>
            <DialogDescription>
              Enter the exam result for this student
            </DialogDescription>
          </DialogHeader>
          <Form {...resultForm}>
            <form onSubmit={resultForm.handleSubmit(onResultSubmit)} className="space-y-4">
              <FormField
                control={resultForm.control}
                name="isAbsent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Student was absent</FormLabel>
                      <p className="text-sm text-gray-500">
                        Check this if the student did not attend the exam
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={resultForm.control}
                name="marks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marks Obtained</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max={exam.totalMarks}
                        step="0.5"
                        disabled={resultForm.watch("isAbsent")}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-gray-500">
                      Out of {exam.totalMarks} total marks
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={resultForm.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. A, B+, C"
                        disabled={resultForm.watch("isAbsent")}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={resultForm.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add comments or feedback for the student"
                        rows={3}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit">Save Result</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Result</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this result? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteResult}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
