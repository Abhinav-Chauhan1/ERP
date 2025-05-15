"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ChevronLeft, Edit, Trash2, PlusCircle, 
  Search, Filter, Calendar, Clock, BookOpen, 
  MoreVertical, Download, Printer, FileText, User,
  CheckCircle2, School
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Mock data for exams
const examData = [
  {
    id: "e1",
    title: "Mid-Term Physics Exam",
    subject: "Physics",
    grade: "Grade 11",
    examDate: "2023-12-10",
    startTime: "09:00 AM",
    duration: "90 min",
    totalMarks: 100,
    passingMarks: 40,
    status: "Upcoming",
    createdBy: "John Smith",
    createdAt: "2023-11-15"
  },
  {
    id: "e2",
    title: "Mathematics Unit Test: Algebra",
    subject: "Mathematics",
    grade: "Grade 10",
    examDate: "2023-12-05",
    startTime: "10:30 AM",
    duration: "60 min",
    totalMarks: 50,
    passingMarks: 20,
    status: "Upcoming",
    createdBy: "Sarah Thompson",
    createdAt: "2023-11-20"
  },
  {
    id: "e3",
    title: "English Literature Analysis",
    subject: "English",
    grade: "Grade 9",
    examDate: "2023-11-28",
    startTime: "01:00 PM",
    duration: "120 min",
    totalMarks: 75,
    passingMarks: 30,
    status: "Upcoming",
    createdBy: "Emily Johnson",
    createdAt: "2023-11-18"
  },
  {
    id: "e4",
    title: "Chemistry Final Exam",
    subject: "Chemistry",
    grade: "Grade 12",
    examDate: "2023-12-15",
    startTime: "09:00 AM",
    duration: "180 min",
    totalMarks: 120,
    passingMarks: 48,
    status: "Upcoming",
    createdBy: "Michael Davis",
    createdAt: "2023-11-10"
  },
  {
    id: "e5",
    title: "Biology Cell Structure Quiz",
    subject: "Biology",
    grade: "Grade 10",
    examDate: "2023-11-15",
    startTime: "11:00 AM",
    duration: "45 min",
    totalMarks: 30,
    passingMarks: 12,
    status: "Completed",
    createdBy: "Robert Brown",
    createdAt: "2023-11-05"
  },
];

// Past exams data
const pastExams = [
  {
    id: "pe1",
    title: "Physics Mid-Term",
    subject: "Physics",
    grade: "Grade 11",
    examDate: "2023-10-15",
    studentsAppeared: 32,
    averageScore: 76,
    passPercentage: 91,
    highestScore: 98
  },
  {
    id: "pe2",
    title: "Mathematics Unit Test",
    subject: "Mathematics",
    grade: "Grade 10",
    examDate: "2023-10-10",
    studentsAppeared: 35,
    averageScore: 68,
    passPercentage: 83,
    highestScore: 95
  },
  {
    id: "pe3",
    title: "English Grammar Test",
    subject: "English",
    grade: "Grade 9",
    examDate: "2023-10-05",
    studentsAppeared: 38,
    averageScore: 72,
    passPercentage: 89,
    highestScore: 92
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

// Exam type data
const examTypes = [
  { id: "et1", name: "Mid-Term" },
  { id: "et2", name: "Final" },
  { id: "et3", name: "Unit Test" },
  { id: "et4", name: "Quiz" },
  { id: "et5", name: "Practical" },
];

// Grade data
const grades = [
  { id: "g9", name: "Grade 9" },
  { id: "g10", name: "Grade 10" },
  { id: "g11", name: "Grade 11" },
  { id: "g12", name: "Grade 12" },
];

// Form schema for exams
const examFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  examTypeId: z.string({
    required_error: "Please select an exam type",
  }),
  subjectId: z.string({
    required_error: "Please select a subject",
  }),
  gradeId: z.string({
    required_error: "Please select a grade",
  }),
  examDate: z.string({
    required_error: "Please select an exam date",
  }),
  startTime: z.string({
    required_error: "Please enter a start time",
  }),
  duration: z.number().min(15, "Duration must be at least 15 minutes"),
  totalMarks: z.number().min(1, "Total marks must be at least 1"),
  passingMarks: z.number().min(1, "Passing marks must be at least 1"),
  instructions: z.string().optional(),
});

export default function ExamsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewTab, setViewTab] = useState<string>("upcoming");

  // Initialize exam form
  const form = useForm<z.infer<typeof examFormSchema>>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      duration: 60,
      totalMarks: 100,
      passingMarks: 40,
    },
  });

  // Filter exams based on search and filters
  const filteredExams = examData.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = subjectFilter === "all" || exam.subject === subjects.find(s => s.id === subjectFilter)?.name;
    const matchesGrade = gradeFilter === "all" || exam.grade === grades.find(g => g.id === gradeFilter)?.name;
    const matchesStatus = statusFilter === "all" || exam.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesSubject && matchesGrade && matchesStatus;
  });

  function handleCreateExam() {
    form.reset({
      duration: 60,
      totalMarks: 100,
      passingMarks: 40,
    });
    setSelectedExamId(null);
    setExamDialogOpen(true);
  }

  function handleEditExam(examId: string) {
    const examToEdit = examData.find(e => e.id === examId);
    if (examToEdit) {
      form.reset({
        title: examToEdit.title,
        examTypeId: examTypes.find(t => t.name === examToEdit.subject)?.id || "",
        subjectId: subjects.find(s => s.name === examToEdit.subject)?.id || "",
        gradeId: grades.find(g => g.name === examToEdit.grade)?.id || "",
        examDate: examToEdit.examDate,
        startTime: examToEdit.startTime,
        duration: parseInt(examToEdit.duration),
        totalMarks: examToEdit.totalMarks,
        passingMarks: examToEdit.passingMarks,
        instructions: "",
      });
      
      setSelectedExamId(examId);
      setExamDialogOpen(true);
    }
  }

  function handleDeleteExam(examId: string) {
    setSelectedExamId(examId);
    setDeleteDialogOpen(true);
  }

  function onSubmit(values: z.infer<typeof examFormSchema>) {
    console.log("Form submitted:", values);
    // Here you would handle the API call to create/edit the exam
    setExamDialogOpen(false);
    form.reset({
      duration: 60,
      totalMarks: 100,
      passingMarks: 40,
    });
    setSelectedExamId(null);
  }

  function confirmDelete() {
    console.log("Deleting exam:", selectedExamId);
    // Here you would handle the API call to delete the exam
    setDeleteDialogOpen(false);
    setSelectedExamId(null);
  }

  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'in progress':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <h1 className="text-2xl font-bold tracking-tight">Exam Management</h1>
        </div>
        <Dialog open={examDialogOpen} onOpenChange={setExamDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateExam}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedExamId ? "Edit Exam" : "Create New Exam"}</DialogTitle>
              <DialogDescription>
                {selectedExamId ? "Update the details of this exam" : "Set up a new exam for your students"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Mid-Term Physics Exam" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="examTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select exam type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {examTypes.map(type => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
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
                </div>
                
                <div className="grid grid-cols-3 gap-4">
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
                  
                  <FormField
                    control={form.control}
                    name="examDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (mins)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="15" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
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
                  
                  <FormField
                    control={form.control}
                    name="passingMarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passing Marks</FormLabel>
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
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructions (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Instructions for students taking the exam"
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
                  <Button variant="outline" type="button" onClick={() => setExamDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {selectedExamId ? "Save Changes" : "Create Exam"}
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
              placeholder="Search exams by title or subject..."
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
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="upcoming" onValueChange={setViewTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Exams</TabsTrigger>
          <TabsTrigger value="past">Past Exams</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle>Upcoming Exams</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Printer className="h-4 w-4 mr-2" />
                    Print Schedule
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredExams.length > 0 ? (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Title</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Subject</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Grade</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Date & Time</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Marks</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                        <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExams.map(exam => (
                        <tr key={exam.id} className="border-b">
                          <td className="py-3 px-4 align-middle font-medium">{exam.title}</td>
                          <td className="py-3 px-4 align-middle">{exam.subject}</td>
                          <td className="py-3 px-4 align-middle">{exam.grade}</td>
                          <td className="py-3 px-4 align-middle">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-gray-500" />
                                <span>{new Date(exam.examDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-gray-500" />
                                <span>{exam.startTime} ({exam.duration})</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <div className="flex flex-col">
                              <span>Total: {exam.totalMarks}</span>
                              <span className="text-xs text-gray-500">Pass: {exam.passingMarks}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <Badge className={getStatusColor(exam.status)}>
                              {exam.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 align-middle text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/assessment/exams/${exam.id}`}>
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditExam(exam.id)}>
                                  Edit Exam
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/assessment/exams/${exam.id}/questions`}>
                                    Manage Questions
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDeleteExam(exam.id)}
                                >
                                  Delete Exam
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
                  <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">No exams found</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {searchTerm || subjectFilter !== "all" || gradeFilter !== "all" || statusFilter !== "all"
                      ? "Try adjusting your filters or search terms"
                      : "No exams have been scheduled yet"}
                  </p>
                  <Button onClick={handleCreateExam}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Exam
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
                <CardTitle>Past Exams & Results</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Results
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Exam</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Subject</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Date</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Students</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Avg. Score</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Pass %</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastExams.map(exam => (
                      <tr key={exam.id} className="border-b">
                        <td className="py-3 px-4 align-middle font-medium">{exam.title}</td>
                        <td className="py-3 px-4 align-middle">{exam.subject}</td>
                        <td className="py-3 px-4 align-middle">{new Date(exam.examDate).toLocaleDateString()}</td>
                        <td className="py-3 px-4 align-middle">{exam.studentsAppeared}</td>
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold" style={{
                              background: `conic-gradient(#3b82f6 ${exam.averageScore}%, #e5e7eb ${exam.averageScore}% 100%)`
                            }}>
                              <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
                                {exam.averageScore}%
                              </div>
                            </div>
                            <span>{exam.averageScore}/100</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <Badge className={exam.passPercentage >= 90 ? "bg-green-100 text-green-800" : 
                                          exam.passPercentage >= 75 ? "bg-blue-100 text-blue-800" : 
                                          exam.passPercentage >= 60 ? "bg-yellow-100 text-yellow-800" : 
                                          "bg-red-100 text-red-800"}>
                            {exam.passPercentage}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <Link href={`/admin/assessment/results?exam=${exam.id}`}>
                            <Button variant="ghost" size="sm">View Results</Button>
                          </Link>
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

      <Card className="mt-2">
        <CardHeader>
          <CardTitle className="text-lg">Exam Statistics</CardTitle>
          <CardDescription>Overview of exam performance and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-blue-50 rounded-md text-blue-600">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="font-medium">Upcoming Exams</h3>
              </div>
              <p className="text-3xl font-bold ml-11">{examData.filter(e => e.status === "Upcoming").length}</p>
              <p className="text-sm text-gray-500 ml-11">Next: {
                examData.filter(e => e.status === "Upcoming")
                  .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())[0]?.subject || "None"
              }</p>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-green-50 rounded-md text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="font-medium">Completed Exams</h3>
              </div>
              <p className="text-3xl font-bold ml-11">{examData.filter(e => e.status === "Completed").length}</p>
              <p className="text-sm text-gray-500 ml-11">This term: {examData.filter(e => e.status === "Completed").length}</p>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-purple-50 rounded-md text-purple-600">
                  <School className="h-5 w-5" />
                </div>
                <h3 className="font-medium">Highest Performers</h3>
              </div>
              <p className="text-3xl font-bold ml-11">Grade 11</p>
              <p className="text-sm text-gray-500 ml-11">Avg score: 82%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Exam</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this exam? This action cannot be undone and will remove all associated questions and results.
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
