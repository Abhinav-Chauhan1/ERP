"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ChevronLeft, Edit, Trash2, PlusCircle, 
  Search, Calendar, Clock, BookOpen, User,
  MoreVertical, Download, CheckCircle, AlertCircle,
  FileUp, Eye, BookmarkCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Mock data for assignments
const assignmentsData = [
  {
    id: "a1",
    title: "Physics Problem Set: Forces and Motion",
    subject: "Physics",
    grade: "Grade 11",
    dueDate: "2023-12-05",
    assignedDate: "2023-11-28",
    totalMarks: 50,
    status: "Open",
    submissions: 15,
    totalStudents: 35,
    description: "Complete the problems related to Newton's laws of motion and force diagrams.",
    createdBy: "John Smith",
    attachments: 2
  },
  {
    id: "a2",
    title: "Mathematics: Quadratic Equations Worksheet",
    subject: "Mathematics",
    grade: "Grade 10",
    dueDate: "2023-12-10",
    assignedDate: "2023-11-30",
    totalMarks: 30,
    status: "Open",
    submissions: 22,
    totalStudents: 38,
    description: "Solve the given quadratic equations using various methods and show your work.",
    createdBy: "Sarah Thompson",
    attachments: 1
  },
  {
    id: "a3",
    title: "English Essay: Character Analysis",
    subject: "English",
    grade: "Grade 9",
    dueDate: "2023-12-12",
    assignedDate: "2023-11-25",
    totalMarks: 40,
    status: "Open",
    submissions: 18,
    totalStudents: 40,
    description: "Write a 500-word essay analyzing the main character from the assigned novel.",
    createdBy: "Emily Johnson",
    attachments: 0
  },
  {
    id: "a4",
    title: "Chemistry Lab Report: Acid-Base Reactions",
    subject: "Chemistry",
    grade: "Grade 12",
    dueDate: "2023-11-20",
    assignedDate: "2023-11-10",
    totalMarks: 60,
    status: "Closed",
    submissions: 28,
    totalStudents: 30,
    description: "Document your findings from the acid-base titration lab and analyze the results.",
    createdBy: "Michael Davis",
    attachments: 3
  },
  {
    id: "a5",
    title: "Biology Research Project: Ecosystems",
    subject: "Biology",
    grade: "Grade 10",
    dueDate: "2023-11-15",
    assignedDate: "2023-10-20",
    totalMarks: 100,
    status: "Graded",
    submissions: 32,
    totalStudents: 35,
    description: "Research a specific ecosystem and prepare a detailed report on its characteristics.",
    createdBy: "Robert Brown",
    attachments: 5
  },
];

// Submission data for a specific assignment
const submissionData = [
  { 
    id: "s1", 
    studentName: "Alex Johnson", 
    studentId: "ST10023", 
    submissionDate: "2023-11-29", 
    status: "Submitted",
    grade: null,
    feedback: "",
    late: false
  },
  { 
    id: "s2", 
    studentName: "Emma Williams", 
    studentId: "ST10045", 
    submissionDate: "2023-11-30", 
    status: "Graded",
    grade: 45,
    feedback: "Excellent work on problem 3!",
    late: false
  },
  { 
    id: "s3", 
    studentName: "Ryan Davis", 
    studentId: "ST10067", 
    submissionDate: "2023-12-01", 
    status: "Submitted",
    grade: null,
    feedback: "",
    late: true
  },
  { 
    id: "s4", 
    studentName: "Sophia Garcia", 
    studentId: "ST10078", 
    submissionDate: null, 
    status: "Not Submitted",
    grade: null,
    feedback: "",
    late: false
  },
  { 
    id: "s5", 
    studentName: "Michael Brown", 
    studentId: "ST10089", 
    submissionDate: "2023-11-28", 
    status: "Graded",
    grade: 42,
    feedback: "Good work, but needs more detail in section 2.",
    late: false
  },
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

// Assignment form schema
const assignmentFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  subjectId: z.string({
    required_error: "Please select a subject",
  }),
  gradeId: z.string({
    required_error: "Please select a grade",
  }),
  dueDate: z.string({
    required_error: "Please select a due date",
  }),
  totalMarks: z.number().min(1, "Total marks must be at least 1"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  allowLateSubmissions: z.boolean().default(false),
  attachFiles: z.boolean().default(false),
});

// Grade form schema
const gradeFormSchema = z.object({
  marks: z.number().min(0, "Marks cannot be negative").max(100, "Marks cannot exceed 100"),
  feedback: z.string().optional(),
});

export default function AssignmentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [viewSubmissionsDialogOpen, setViewSubmissionsDialogOpen] = useState(false);
  const [gradeSubmissionDialogOpen, setGradeSubmissionDialogOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewTab, setViewTab] = useState<string>("active");

  // Initialize assignment form
  const form = useForm<z.infer<typeof assignmentFormSchema>>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      totalMarks: 50,
      allowLateSubmissions: false,
      attachFiles: false,
    },
  });

  // Initialize grade form
  const gradeForm = useForm<z.infer<typeof gradeFormSchema>>({
    resolver: zodResolver(gradeFormSchema),
    defaultValues: {
      marks: 0,
      feedback: "",
    },
  });

  // Filter assignments based on search and filters
  const filteredAssignments = assignmentsData.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = subjectFilter === "all" || assignment.subject === subjects.find(s => s.id === subjectFilter)?.name;
    const matchesGrade = gradeFilter === "all" || assignment.grade === grades.find(g => g.id === gradeFilter)?.name;
    const matchesStatus = statusFilter === "all" || assignment.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesSubject && matchesGrade && matchesStatus;
  });

  // Get active vs. past assignments
  const activeAssignments = filteredAssignments.filter(a => a.status === "Open");
  const pastAssignments = filteredAssignments.filter(a => a.status === "Closed" || a.status === "Graded");

  function handleCreateAssignment() {
    form.reset({
      totalMarks: 50,
      allowLateSubmissions: false,
      attachFiles: false,
    });
    setSelectedAssignmentId(null);
    setAssignmentDialogOpen(true);
  }

  function handleEditAssignment(assignmentId: string) {
    const assignmentToEdit = assignmentsData.find(a => a.id === assignmentId);
    if (assignmentToEdit) {
      form.reset({
        title: assignmentToEdit.title,
        subjectId: subjects.find(s => s.name === assignmentToEdit.subject)?.id || "",
        gradeId: grades.find(g => g.name === assignmentToEdit.grade)?.id || "",
        dueDate: assignmentToEdit.dueDate,
        totalMarks: assignmentToEdit.totalMarks,
        description: assignmentToEdit.description,
        allowLateSubmissions: true,
        attachFiles: assignmentToEdit.attachments > 0,
      });
      
      setSelectedAssignmentId(assignmentId);
      setAssignmentDialogOpen(true);
    }
  }

  function handleViewSubmissions(assignmentId: string) {
    setSelectedAssignmentId(assignmentId);
    setViewSubmissionsDialogOpen(true);
  }

  function handleGradeSubmission(submissionId: string) {
    const submissionToGrade = submissionData.find(s => s.id === submissionId);
    if (submissionToGrade) {
      gradeForm.reset({
        marks: submissionToGrade.grade || 0,
        feedback: submissionToGrade.feedback || "",
      });
      
      setSelectedSubmissionId(submissionId);
      setGradeSubmissionDialogOpen(true);
    }
  }

  function handleDeleteAssignment(assignmentId: string) {
    setSelectedAssignmentId(assignmentId);
    setDeleteDialogOpen(true);
  }

  function onSubmit(values: z.infer<typeof assignmentFormSchema>) {
    console.log("Form submitted:", values);
    // Here you would handle the API call to create/edit the assignment
    setAssignmentDialogOpen(false);
    form.reset({
      totalMarks: 50,
      allowLateSubmissions: false,
      attachFiles: false,
    });
    setSelectedAssignmentId(null);
  }

  function onGradeSubmit(values: z.infer<typeof gradeFormSchema>) {
    console.log("Grade submitted:", values, "for submission:", selectedSubmissionId);
    // Here you would handle the API call to grade the submission
    setGradeSubmissionDialogOpen(false);
    gradeForm.reset();
    setSelectedSubmissionId(null);
  }

  function confirmDelete() {
    console.log("Deleting assignment:", selectedAssignmentId);
    // Here you would handle the API call to delete the assignment
    setDeleteDialogOpen(false);
    setSelectedAssignmentId(null);
  }

  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-amber-100 text-amber-800';
      case 'graded':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubmissionStatusColor = (status: string, late: boolean) => {
    if (late) return 'bg-amber-100 text-amber-800';
    
    switch (status.toLowerCase()) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'not submitted':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedAssignment = assignmentsData.find(a => a.id === selectedAssignmentId);

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
        <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateAssignment}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
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
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subjectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    name="gradeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select grade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {grades.map(grade => (
                              <SelectItem key={grade.id} value={grade.id}>
                                {grade.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the assignment instructions and requirements"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="allowLateSubmissions"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
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
                          <p className="text-sm text-gray-500">
                            Students can submit after the due date
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="attachFiles"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Attach Files
                          </FormLabel>
                          <p className="text-sm text-gray-500">
                            Include files or resources for students
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setAssignmentDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {selectedAssignmentId ? "Save Changes" : "Create Assignment"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search assignments by title or description..."
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
              {activeAssignments.length > 0 ? (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Title</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Subject</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Grade</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Due Date</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Submissions</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                        <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeAssignments.map(assignment => (
                        <tr key={assignment.id} className="border-b">
                          <td className="py-3 px-4 align-middle font-medium">
                            <div className="max-w-[200px] truncate">{assignment.title}</div>
                          </td>
                          <td className="py-3 px-4 align-middle">{assignment.subject}</td>
                          <td className="py-3 px-4 align-middle">{assignment.grade}</td>
                          <td className="py-3 px-4 align-middle">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-gray-500" />
                              <span>{new Date(assignment.dueDate).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            {assignment.submissions}/{assignment.totalStudents}
                            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                              <div 
                                className="h-1.5 bg-blue-500 rounded-full" 
                                style={{ width: `${(assignment.submissions / assignment.totalStudents) * 100}%` }}
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
                  <p className="text-sm text-gray-500 mb-4">
                    {searchTerm || subjectFilter !== "all" || gradeFilter !== "all" || statusFilter !== "all"
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
              {pastAssignments.length > 0 ? (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Title</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Subject</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Grade</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Due Date</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Submissions</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                        <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastAssignments.map(assignment => (
                        <tr key={assignment.id} className="border-b">
                          <td className="py-3 px-4 align-middle font-medium">
                            <div className="max-w-[200px] truncate">{assignment.title}</div>
                          </td>
                          <td className="py-3 px-4 align-middle">{assignment.subject}</td>
                          <td className="py-3 px-4 align-middle">{assignment.grade}</td>
                          <td className="py-3 px-4 align-middle">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-gray-500" />
                              <span>{new Date(assignment.dueDate).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            {assignment.submissions}/{assignment.totalStudents}
                            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                              <div 
                                className="h-1.5 bg-blue-500 rounded-full" 
                                style={{ width: `${(assignment.submissions / assignment.totalStudents) * 100}%` }}
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
                  <p className="text-sm text-gray-500 mb-4">
                    {searchTerm || subjectFilter !== "all" || gradeFilter !== "all" || statusFilter !== "all"
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
          <div className="overflow-y-auto max-h-[60vh]">
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="bg-gray-50 border-b">
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Student</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Submission Date</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Grade</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissionData.map(submission => (
                    <tr key={submission.id} className="border-b">
                      <td className="py-3 px-4 align-middle">
                        <div className="font-medium">{submission.studentName}</div>
                        <div className="text-xs text-gray-500">{submission.studentId}</div>
                      </td>
                      <td className="py-3 px-4 align-middle">
                        {submission.submissionDate ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-gray-500" />
                            <span>{new Date(submission.submissionDate).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not submitted</span>
                        )}
                      </td>
                      <td className="py-3 px-4 align-middle">
                        <Badge className={getSubmissionStatusColor(submission.status, submission.late)}>
                          {submission.status}
                          {submission.late && " (Late)"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 align-middle">
                        {submission.grade !== null ? (
                          <span className="font-medium">{submission.grade}/{selectedAssignment?.totalMarks}</span>
                        ) : (
                          <span className="text-gray-400">Not graded</span>
                        )}
                      </td>
                      <td className="py-3 px-4 align-middle text-right">
                        {submission.status === "Submitted" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleGradeSubmission(submission.id)}
                          >
                            <BookmarkCheck className="h-4 w-4 mr-1" />
                            Grade
                          </Button>
                        )}
                        {submission.status === "Graded" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleGradeSubmission(submission.id)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit Grade
                          </Button>
                        )}
                        {submission.status === "Not Submitted" && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            disabled
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            No Submission
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewSubmissionsDialogOpen(false)}>
              Close
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Results
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
              Assign a grade and provide feedback
            </DialogDescription>
          </DialogHeader>
          <Form {...gradeForm}>
            <form onSubmit={gradeForm.handleSubmit(onGradeSubmit)} className="space-y-4">
              <div className="bg-gray-50 rounded-md p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Student Information</h3>
                  <Button variant="ghost" size="sm">
                    <FileUp className="h-4 w-4 mr-1" />
                    View Submission
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Student</p>
                    <p className="font-medium">
                      {submissionData.find(s => s.id === selectedSubmissionId)?.studentName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {submissionData.find(s => s.id === selectedSubmissionId)?.studentId}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Submission Date</p>
                    <p className="font-medium">
                      {submissionData.find(s => s.id === selectedSubmissionId)?.submissionDate 
                        ? new Date(submissionData.find(s => s.id === selectedSubmissionId)?.submissionDate || "").toLocaleDateString()
                        : "Not submitted"
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {submissionData.find(s => s.id === selectedSubmissionId)?.late ? "Submitted Late" : ""}
                    </p>
                  </div>
                </div>
              </div>
              
              <FormField
                control={gradeForm.control}
                name="marks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marks</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max={selectedAssignment?.totalMarks} 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <span className="text-sm text-gray-500">out of {selectedAssignment?.totalMarks}</span>
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
                        placeholder="Provide feedback on the submission"
                        rows={4}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setGradeSubmissionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Grade
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
              Are you sure you want to delete this assignment? This action cannot be undone and will remove all student submissions.
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
