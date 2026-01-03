"use client";


import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Edit, Trash2, PlusCircle,
  Search, Calendar, Clock, BookOpen, User,
  MoreVertical, Download, CheckCircle, AlertCircle,
  FileUp, Eye, BookmarkCheck, Loader2, Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import toast from "react-hot-toast";

// Import schema validation and actions
import {
  assignmentSchema,
  submissionGradeSchema,
  AssignmentFormValues,
  SubmissionGradeValues
} from "@/lib/schemaValidation/assignmentsSchemaValidation";
import {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  gradeSubmission,
  getSubjectsForAssignments,
  getClassesForAssignments
} from "@/lib/actions/assignmentsActions";

export default function AssignmentsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [viewSubmissionsDialogOpen, setViewSubmissionsDialogOpen] = useState(false);
  const [gradeSubmissionDialogOpen, setGradeSubmissionDialogOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewTab, setViewTab] = useState<string>("active");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // State for data
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Get user info (or use placeholder in development)
  const currentTeacherId = "teacher-id-123"; // In production, get this from auth

  // Initialize assignment form
  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: "",
      description: "",
      subjectId: "",
      classIds: [],
      assignedDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      totalMarks: 50,
      instructions: "",
      allowLateSubmissions: false,
    },
  });

  // Initialize grade form
  const gradeForm = useForm<SubmissionGradeValues>({
    resolver: zodResolver(submissionGradeSchema),
    defaultValues: {
      submissionId: "",
      marks: 0,
      feedback: "",
      status: "GRADED",
    },
  });

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getAssignments({
        searchTerm: searchTerm.length > 0 ? searchTerm : undefined,
        subjectId: subjectFilter !== "all" ? subjectFilter : undefined,
        classId: classFilter !== "all" ? classFilter : undefined,
        status: statusFilter !== "all" ? statusFilter as any : undefined,
      });

      if (result.success) {
        setAssignments(result.data || []);
      } else {
        setError(result.error || "Failed to fetch assignments");
        toast.error(result.error || "Failed to fetch assignments");
      }
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, subjectFilter, classFilter, statusFilter]);

  const fetchSubjects = useCallback(async () => {
    try {
      const result = await getSubjectsForAssignments();

      if (result.success) {
        setSubjects(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch subjects");
      }
    } catch (err) {
      console.error("Error fetching subjects:", err);
      toast.error("An unexpected error occurred");
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const result = await getClassesForAssignments();

      if (result.success) {
        setClasses(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch classes");
      }
    } catch (err) {
      console.error("Error fetching classes:", err);
      toast.error("An unexpected error occurred");
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
    fetchSubjects();
    fetchClasses();
  }, [viewTab, fetchAssignments, fetchSubjects, fetchClasses]);

  async function handleViewSubmissions(assignmentId: string) {
    setDetailsLoading(true);
    setSelectedAssignmentId(assignmentId);

    try {
      const result = await getAssignmentById(assignmentId);

      if (result.success) {
        setSelectedAssignment(result.data);
        setViewSubmissionsDialogOpen(true);
      } else {
        toast.error(result.error || "Failed to fetch assignment details");
      }
    } catch (err) {
      console.error("Error fetching assignment details:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setDetailsLoading(false);
    }
  }

  function handleCreateAssignment() {
    form.reset({
      title: "",
      description: "",
      subjectId: "",
      classIds: [],
      assignedDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      totalMarks: 50,
      instructions: "",
      allowLateSubmissions: false,
    });
    setSelectedAssignmentId(null);
    setSelectedFiles([]);
    setAssignmentDialogOpen(true);
  }

  async function handleEditAssignment(assignmentId: string) {
    setDetailsLoading(true);

    try {
      const result = await getAssignmentById(assignmentId);

      if (result.success && result.data) {
        const assignment = result.data;
        form.reset({
          title: assignment.title,
          description: assignment.description,
          subjectId: assignment.subjectId,
          classIds: assignment.classIds,
          assignedDate: new Date(assignment.assignedDate),
          dueDate: new Date(assignment.dueDate),
          totalMarks: assignment.totalMarks,
          instructions: assignment.instructions,
          allowLateSubmissions: false, // This would be a field in the DB schema if implemented
        });

        setSelectedAssignmentId(assignmentId);
        setSelectedFiles([]);
        setAssignmentDialogOpen(true);
      } else {
        toast.error(result.error || "Failed to fetch assignment details");
      }
    } catch (err) {
      console.error("Error fetching assignment details:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setDetailsLoading(false);
    }
  }

  function handleGradeSubmission(submissionId: string) {
    if (!selectedAssignment) return;

    const submissionToGrade = selectedAssignment.submissions.find((s: any) => s.id === submissionId);
    if (submissionToGrade) {
      gradeForm.reset({
        submissionId: submissionId,
        marks: submissionToGrade.marks || 0,
        feedback: submissionToGrade.feedback || "",
        status: "GRADED",
      });

      setSelectedSubmissionId(submissionId);
      setGradeSubmissionDialogOpen(true);
    }
  }

  function handleDeleteAssignment(assignmentId: string) {
    setSelectedAssignmentId(assignmentId);
    setDeleteDialogOpen(true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);

      // Show upload progress simulation
      let progress = 0;
      setUploadProgress(progress);
      const interval = setInterval(() => {
        progress += 5;
        setUploadProgress(progress > 100 ? 100 : progress);
        if (progress >= 100) clearInterval(interval);
      }, 200);
    }
  }

  async function onSubmit(values: AssignmentFormValues) {
    setUploading(true);

    try {
      let result;

      if (selectedAssignmentId) {
        // Update existing assignment
        result = await updateAssignment({
          ...values,
          id: selectedAssignmentId
        }, selectedFiles);
      } else {
        // Create new assignment
        // Pass null for creatorId when creating from admin dashboard
        result = await createAssignment(values, null, selectedFiles);
      }

      if (result.success) {
        toast.success(`Assignment ${selectedAssignmentId ? "updated" : "created"} successfully`);
        setAssignmentDialogOpen(false);
        setSelectedFiles([]);
        fetchAssignments();
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch (err) {
      console.error("Error submitting assignment:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setUploading(false);
    }
  }

  async function onGradeSubmit(values: SubmissionGradeValues) {
    try {
      const result = await gradeSubmission(values);

      if (result.success) {
        toast.success("Submission graded successfully");
        setGradeSubmissionDialogOpen(false);

        // Refresh the assignment details
        if (selectedAssignmentId) {
          handleViewSubmissions(selectedAssignmentId);
        }
      } else {
        toast.error(result.error || "Failed to grade submission");
      }
    } catch (err) {
      console.error("Error grading submission:", err);
      toast.error("An unexpected error occurred");
    }
  }

  async function confirmDelete() {
    if (!selectedAssignmentId) return;

    try {
      const result = await deleteAssignment(selectedAssignmentId);

      if (result.success) {
        toast.success("Assignment deleted successfully");
        setDeleteDialogOpen(false);
        fetchAssignments();
      } else {
        toast.error(result.error || "Failed to delete assignment");
      }
    } catch (err) {
      console.error("Error deleting assignment:", err);
      toast.error("An unexpected error occurred");
    }
  }

  // Filter assignments based on the active tab
  const activeAssignments = assignments.filter(a => a.status === "Open");
  const pastAssignments = assignments.filter(a => a.status === "Closed" || a.status === "Graded");

  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-primary/10 text-primary';
      case 'closed':
        return 'bg-amber-100 text-amber-800';
      case 'graded':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-muted text-gray-800';
    }
  };

  const getSubmissionStatusColor = (status: string, late: boolean) => {
    if (late) return 'bg-amber-100 text-amber-800';

    switch (status) {
      case 'SUBMITTED':
        return 'bg-primary/10 text-primary';
      case 'GRADED':
      case 'RETURNED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-muted text-gray-800';
    }
  };

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
          <h1 className="text-2xl font-bold tracking-tight">Assignment Management</h1>
        </div>
        <Button onClick={handleCreateAssignment}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Assignment
        </Button>
        <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedAssignmentId ? "Edit Assignment" : "Create New Assignment"}</DialogTitle>
              <DialogDescription>
                {selectedAssignmentId ? "Update the details of this assignment" : "Create a new assignment for your students"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignment Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Physics Problem Set: Forces and Motion" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subjectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjects.map(subject => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalMarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Marks</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="classIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>Classes/Grades</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border rounded-md p-3 max-h-40 overflow-y-auto">
                        {classes.map((cls) => (
                          <div key={cls.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={cls.id}
                              checked={form.watch("classIds").includes(cls.id)}
                              onCheckedChange={(checked) => {
                                const currentClasses = form.watch("classIds");
                                if (checked) {
                                  form.setValue("classIds", [...currentClasses, cls.id]);
                                } else {
                                  form.setValue(
                                    "classIds",
                                    currentClasses.filter((id) => id !== cls.id)
                                  );
                                }
                              }}
                            />
                            <label htmlFor={cls.id} className="text-sm">
                              {cls.name}
                              {cls.academicYear.isCurrent && (
                                <span className="ml-1 text-xs text-green-600">(Current)</span>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="assignedDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            onSelect={field.onChange}
                            placeholder="Select assigned date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            onSelect={field.onChange}
                            placeholder="Select due date"
                            disabled={(date) => {
                              const assignedDate = form.watch("assignedDate");
                              return assignedDate ? date < assignedDate : false;
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description of the assignment"
                            rows={2}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="instructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instructions</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Detailed instructions for students"
                            rows={3}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="allowLateSubmissions"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 h-full">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Allow Late Submissions
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Students can submit after the due date
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="border p-4 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium">Attachments</h3>
                      </div>
                      {selectedFiles.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {selectedFiles.length} file(s) selected
                        </span>
                      )}
                    </div>

                    {selectedFiles.length > 0 ? (
                      <div className="space-y-2 mb-2">
                        <Progress value={uploadProgress} className="h-2" />
                        <div className="max-h-20 overflow-y-auto">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="text-xs flex items-center justify-between">
                              <span className="truncate max-w-[200px]">{file.name}</span>
                              <span>{(file.size / 1024).toFixed(1)} KB</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Input
                        type="file"
                        multiple
                        className="mt-2"
                        onChange={handleFileChange}
                      />
                    )}

                    <p className="text-xs text-muted-foreground mt-1">
                      Upload resources for students
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setAssignmentDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploading}>
                    {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {selectedAssignmentId ? "Save Changes" : "Create Assignment"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="md:w-1/2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search assignments by title or description..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchAssignments()}
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
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {classes.map(cls => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="graded">Graded</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="secondary" onClick={fetchAssignments}>
            Apply Filters
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active" onValueChange={setViewTab}>
        <TabsList>
          <TabsTrigger value="active">Active Assignments</TabsTrigger>
          <TabsTrigger value="past">Past Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle>Active Assignments</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : activeAssignments.length > 0 ? (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-accent border-b">
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Title</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Subject</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Grade</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Due Date</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Submissions</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                        <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeAssignments.map(assignment => (
                        <tr key={assignment.id} className="border-b">
                          <td className="py-3 px-4 align-middle font-medium">
                            <div className="max-w-[200px] truncate">{assignment.title}</div>
                          </td>
                          <td className="py-3 px-4 align-middle">{assignment.subject}</td>
                          <td className="py-3 px-4 align-middle">{assignment.grades}</td>
                          <td className="py-3 px-4 align-middle">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{format(new Date(assignment.dueDate), 'MMM d, yyyy')}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            {assignment.submissions}/{assignment.totalStudents}
                            <div className="w-full h-1.5 bg-muted rounded-full mt-1">
                              <div
                                className="h-1.5 bg-primary rounded-full"
                                style={{ width: `${assignment.totalStudents > 0 ? (assignment.submissions / assignment.totalStudents) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <Badge className={getStatusColor(assignment.status)}>
                              {assignment.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 align-middle text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewSubmissions(assignment.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Submissions
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditAssignment(assignment.id)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteAssignment(assignment.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">No active assignments</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchTerm || subjectFilter !== "all" || classFilter !== "all" || statusFilter !== "all"
                      ? "Try adjusting your filters or search terms"
                      : "Create a new assignment to get started"}
                  </p>
                  <Button onClick={handleCreateAssignment}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Assignment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle>Past Assignments</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : pastAssignments.length > 0 ? (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-accent border-b">
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Title</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Subject</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Grade</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Due Date</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Submissions</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                        <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastAssignments.map(assignment => (
                        <tr key={assignment.id} className="border-b">
                          <td className="py-3 px-4 align-middle font-medium">
                            <div className="max-w-[200px] truncate">{assignment.title}</div>
                          </td>
                          <td className="py-3 px-4 align-middle">{assignment.subject}</td>
                          <td className="py-3 px-4 align-middle">{assignment.grades}</td>
                          <td className="py-3 px-4 align-middle">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{format(new Date(assignment.dueDate), 'MMM d, yyyy')}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            {assignment.submissions}/{assignment.totalStudents}
                            <div className="w-full h-1.5 bg-muted rounded-full mt-1">
                              <div
                                className="h-1.5 bg-primary rounded-full"
                                style={{ width: `${assignment.totalStudents > 0 ? (assignment.submissions / assignment.totalStudents) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <Badge className={getStatusColor(assignment.status)}>
                              {assignment.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 align-middle text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewSubmissions(assignment.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Results
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">No past assignments</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchTerm || subjectFilter !== "all" || classFilter !== "all" || statusFilter !== "all"
                      ? "Try adjusting your filters or search terms"
                      : "Completed assignments will appear here"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Submissions Dialog */}
      <Dialog open={viewSubmissionsDialogOpen} onOpenChange={setViewSubmissionsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Submissions: {selectedAssignment?.title}</DialogTitle>
            <DialogDescription>
              View and grade student submissions
            </DialogDescription>
          </DialogHeader>
          {detailsLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedAssignment ? (
            <div className="overflow-y-auto max-h-[60vh]">
              <div className="mb-4 border rounded-lg p-4 bg-accent">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Subject</p>
                    <p className="font-medium">{selectedAssignment.subject}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Marks</p>
                    <p className="font-medium">{selectedAssignment.totalMarks}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Due Date</p>
                    <p className="font-medium">{format(new Date(selectedAssignment.dueDate), 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(selectedAssignment.status)}>
                      {selectedAssignment.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedAssignment.submissions.length > 0 ? (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="bg-accent border-b">
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Student</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Submission Date</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Grade</th>
                        <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAssignment.submissions.map((submission: any) => (
                        <tr key={submission.id} className="border-b">
                          <td className="py-3 px-4 align-middle">
                            <div className="font-medium">{submission.studentName}</div>
                            <div className="text-xs text-muted-foreground">{submission.studentAdmissionId}</div>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            {submission.submissionDate
                              ? format(new Date(submission.submissionDate), 'MMM d, yyyy h:mm a')
                              : "Not submitted"}
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <Badge className={getSubmissionStatusColor(submission.status, submission.isLate)}>
                              {submission.isLate && submission.status !== "PENDING" ? "LATE" : submission.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            {submission.status === "GRADED" || submission.status === "RETURNED" ?
                              <span className="font-medium">{submission.marks} / {selectedAssignment.totalMarks}</span> :
                              <span className="text-muted-foreground">-</span>
                            }
                          </td>
                          <td className="py-3 px-4 align-middle text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={submission.status === "PENDING"}
                              onClick={() => submission.status !== "PENDING" && submission.submissionDate && router.push(`/admin/assessment/assignments/${selectedAssignment.id}/submissions/${submission.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={submission.status === "PENDING"}
                              onClick={() => submission.status !== "PENDING" && submission.submissionDate && handleGradeSubmission(submission.id)}
                            >
                              <BookmarkCheck className="h-4 w-4 mr-1" />
                              Grade
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">No submissions yet</h3>
                  <p className="text-sm">
                    Students haven't submitted their work for this assignment
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Assignment not found</div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewSubmissionsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grade Submission Dialog */}
      <Dialog open={gradeSubmissionDialogOpen} onOpenChange={setGradeSubmissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogDescription>
              Provide feedback and marks for this submission
            </DialogDescription>
          </DialogHeader>
          <Form {...gradeForm}>
            <form onSubmit={gradeForm.handleSubmit(onGradeSubmit)} className="space-y-4">
              <FormField
                control={gradeForm.control}
                name="marks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marks</FormLabel>
                    <div className="flex items-center">
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max={selectedAssignment?.totalMarks || 100}
                          step="0.5"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <span className="ml-2">/ {selectedAssignment?.totalMarks || 0}</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={gradeForm.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feedback</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={5}
                        placeholder="Provide constructive feedback for the student"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={gradeForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="GRADED">Graded</SelectItem>
                        <SelectItem value="RETURNED">Returned to Student</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setGradeSubmissionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Submit Grades
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this assignment? This action cannot be undone and all submissions will be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

