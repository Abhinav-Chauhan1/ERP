"use client";


import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Edit, Trash2, PlusCircle,
  Search, Calendar, Clock, BookOpen,
  MoreVertical, Download, Printer, FileText,
  CheckCircle2, School, Loader2, AlertCircle, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExamsTable } from "@/components/admin/exams-table";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";

// Import schema validation and server actions
import { examSchema, ExamFormValues } from "@/lib/schemaValidation/examsSchemaValidation";
import {
  getUpcomingExams,
  getPastExams,
  getExamTypes,
  getSubjects,
  getClasses,
  getTerms,
  getAllTerms,
  createExam,
  updateExam,
  deleteExam,
  getExamStatistics,
  autoGenerateCBSEExams,
} from "@/lib/actions/examsActions";
import type { AutoGenerateExamsInput } from "@/lib/constants/cbse-exam-schedules";

export default function ExamsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [termFilter, setTermFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<string>("upcoming");

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [pastExams, setPastExams] = useState<any[]>([]);
  const [examTypes, setExamTypes] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [allTerms, setAllTerms] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate CBSE exams state
  const [autoGenOpen, setAutoGenOpen] = useState(false);
  const [autoGenLoading, setAutoGenLoading] = useState(false);
  const [autoGenTermId, setAutoGenTermId] = useState("");
  const [autoGenClassIds, setAutoGenClassIds] = useState<string[]>([]);
  const [autoGenLevel, setAutoGenLevel] = useState<"CBSE_PRIMARY" | "CBSE_SECONDARY" | "CBSE_SENIOR">("CBSE_PRIMARY");
  const [autoGenTermNumber, setAutoGenTermNumber] = useState<1 | 2>(1);

  // Initialize exam form
  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: "",
      totalMarks: 100,
      passingMarks: 40,
      instructions: "",
    },
  });

  useEffect(() => {
    fetchExams();
    fetchMetadata();
    fetchStatistics();
  }, []);

  // Fetch upcoming and past exams
  async function fetchExams() {
    setLoading(true);
    setError(null);

    try {
      // Fetch upcoming exams
      const upcomingResult = await getUpcomingExams();
      if (upcomingResult.success) {
        setUpcomingExams(upcomingResult.data || []);
      } else {
        toast.error("Failed to fetch upcoming exams");
      }

      // Fetch past exams
      const pastResult = await getPastExams();
      if (pastResult.success) {
        setPastExams(pastResult.data || []);
      } else {
        toast.error("Failed to fetch past exams");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  // Fetch metadata (exam types, subjects, terms)
  async function fetchMetadata() {
    try {
      // Fetch exam types
      const typesResult = await getExamTypes();
      if (typesResult.success) {
        setExamTypes(typesResult.data || []);
      }

      // Fetch subjects
      const subjectsResult = await getSubjects();
      if (subjectsResult.success) {
        setSubjects(subjectsResult.data || []);
      }

      // Fetch classes
      const classesResult = await getClasses();
      if (classesResult.success) {
        setClasses(classesResult.data || []);
      }

      // Fetch terms
      const termsResult = await getTerms();
      if (termsResult.success) {
        setTerms(termsResult.data || []);
      }

      // Fetch all terms (for auto-generate dialog)
      const allTermsResult = await getAllTerms();
      if (allTermsResult.success) {
        setAllTerms(allTermsResult.data || []);
      }
    } catch (err) {
      console.error("Error fetching metadata:", err);
    }
  }

  // Fetch exam statistics
  async function fetchStatistics() {
    setStatsLoading(true);
    try {
      const result = await getExamStatistics();
      if (result.success) {
        setStatistics(result.data);
      }
    } catch (err) {
      console.error("Error fetching statistics:", err);
    } finally {
      setStatsLoading(false);
    }
  }

  function handleCreateExam() {
    form.reset({
      title: "",
      totalMarks: 100,
      passingMarks: 40,
      instructions: "",
      examDate: undefined,
      startTime: undefined,
      endTime: undefined,
      examTypeId: "",
      subjectId: "",
      classId: "",
      termId: "",
    });
    setSelectedExamId(null);
    setExamDialogOpen(true);
  }

  function handleEditExam(examId: string) {
    const examToEdit = upcomingExams.find(e => e.id === examId) || pastExams.find(e => e.id === examId);

    if (examToEdit) {
      form.reset({
        title: examToEdit.title,
        examTypeId: examToEdit.examTypeId,
        subjectId: examToEdit.subjectId,
        classId: examToEdit.classId,
        termId: examToEdit.termId,
        examDate: new Date(examToEdit.examDate),
        startTime: new Date(examToEdit.startTime),
        endTime: new Date(examToEdit.endTime),
        totalMarks: examToEdit.totalMarks,
        passingMarks: examToEdit.passingMarks,
        instructions: examToEdit.instructions || "",
      });

      setSelectedExamId(examId);
      setExamDialogOpen(true);
    }
  }

  function handleDeleteExam(examId: string) {
    setSelectedExamId(examId);
    setDeleteDialogOpen(true);
  }

  async function onSubmit(values: ExamFormValues) {
    try {
      setLoading(true);

      if (selectedExamId) {
        // Update existing exam
        const result = await updateExam({ ...values, id: selectedExamId });

        if (result.success) {
          toast.success("Exam updated successfully");
          fetchExams();
          fetchStatistics();
          setExamDialogOpen(false);
        } else {
          toast.error(result.error || "Failed to update exam");
        }
      } else {
        // Create new exam - no teacherId needed for admin
        const result = await createExam(values);

        if (result.success) {
          toast.success("Exam created successfully");
          fetchExams();
          fetchStatistics();
          setExamDialogOpen(false);
        } else {
          toast.error(result.error || "Failed to create exam");
        }
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleAutoGenerateExams() {
    if (!autoGenTermId) { toast.error("Select a term"); return; }
    if (autoGenClassIds.length === 0) { toast.error("Select at least one class"); return; }
    setAutoGenLoading(true);
    try {
      const result = await autoGenerateCBSEExams({
        termId: autoGenTermId,
        classIds: autoGenClassIds,
        cbseLevel: autoGenLevel,
        termNumber: autoGenTermNumber,
      });
      if (result.success) {
        toast.success(result.message ?? "Exams generated");
        setAutoGenOpen(false);
        fetchExams();
        fetchStatistics();
      } else {
        toast.error(result.error || "Failed to generate exams");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setAutoGenLoading(false);
    }
  }

  async function confirmDelete() {
    if (selectedExamId) {
      try {
        const result = await deleteExam(selectedExamId);

        if (result.success) {
          toast.success("Exam deleted successfully");
          fetchExams();
          fetchStatistics();
          setDeleteDialogOpen(false);
        } else {
          toast.error(result.error || "Failed to delete exam");
        }
      } catch (err) {
        toast.error("An unexpected error occurred");
      }
    }
  }

  // Filter exams based on search and filters
  const filteredUpcomingExams = upcomingExams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.subject.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSubject = subjectFilter === "all" || exam.subjectId === subjectFilter;
    const matchesTerm = termFilter === "all" || exam.termId === termFilter;

    return matchesSearch && matchesSubject && matchesTerm;
  });

  // Utility function to format date-time
  const formatDateTime = (date: string | Date) => {
    if (!date) return "";
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return format(parsedDate, "MMM d, yyyy h:mm a");
  };

  // Get status color for badges
  const getStatusColor = (examDate: string) => {
    const now = new Date();
    const date = new Date(examDate);
    const oneDayInMs = 24 * 60 * 60 * 1000;

    if (date < now) {
      return 'bg-green-100 text-green-800'; // Past
    } else if (date.getTime() - now.getTime() < oneDayInMs) {
      return 'bg-amber-100 text-amber-800'; // Today/tomorrow
    } else {
      return 'bg-primary/10 text-primary'; // Upcoming
    }
  };

  // Get status text
  const getStatusText = (examDate: string) => {
    const now = new Date();
    const date = new Date(examDate);
    const oneDayInMs = 24 * 60 * 60 * 1000;

    if (date < now) {
      return 'Completed';
    } else if (date.getTime() - now.getTime() < oneDayInMs) {
      return 'Today/Tomorrow';
    } else {
      return 'Upcoming';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/admin/assessment">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Exam Management</h1>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setAutoGenOpen(true)} className="w-full sm:w-auto">
            <Sparkles className="mr-2 h-4 w-4" /> Auto Generate CBSE
          </Button>
          <Dialog open={examDialogOpen} onOpenChange={setExamDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateExam} className="w-full sm:w-auto">
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="classId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {classes.map(cls => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
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
                    name="termId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Term</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select term" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {terms.map(term => (
                              <SelectItem key={term.id} value={term.id}>
                                {term.name} ({term.academicYear.name})
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
                    name="examDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            onSelect={field.onChange}
                            placeholder="Select date"
                          />
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
                          <TimePicker
                            date={field.value}
                            setDate={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <TimePicker
                            date={field.value}
                            setDate={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search exams by title or subject..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full md:w-1/2 flex flex-col sm:flex-row gap-2">
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
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
          <Select value={termFilter} onValueChange={setTermFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Term" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terms</SelectItem>
              {terms.map(term => (
                <SelectItem key={term.id} value={term.id}>
                  {term.name} ({term.academicYear.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Exams List Card */}
      <Card>
        <CardHeader>
          <CardTitle>All Exams</CardTitle>
          <CardDescription>Manage all scheduled examinations</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredUpcomingExams.length > 0 ? (
            <ExamsTable
              exams={filteredUpcomingExams}
              onEdit={handleEditExam}
              onDelete={handleDeleteExam}
              emptyMessage="No exams found"
            />
          ) : (
            <div className="text-center py-10">
              <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">No exams found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || subjectFilter !== "all" || termFilter !== "all"
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

      {/* Render tab content based on view */}
      <Tabs defaultValue="upcoming" onValueChange={setViewTab}>
        {/* ...existing tabs code... */}
      </Tabs>

      <Card className="mt-2">
        <CardHeader>
          <CardTitle className="text-lg">Exam Statistics</CardTitle>
          <CardDescription>Overview of exam performance and trends</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 bg-primary/10 rounded-md text-primary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <h3 className="font-medium">Upcoming Exams</h3>
                </div>
                <p className="text-3xl font-bold ml-11">{statistics?.upcomingExamsCount || 0}</p>
                <p className="text-sm text-muted-foreground ml-11">
                  Next: {statistics?.nextExam || "None scheduled"}
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 bg-green-50 rounded-md text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h3 className="font-medium">Completed Exams</h3>
                </div>
                <p className="text-3xl font-bold ml-11">{statistics?.completedExamsCount || 0}</p>
                <p className="text-sm text-muted-foreground ml-11">This term: {pastExams.length}</p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 bg-teal-50 rounded-md text-teal-600">
                    <School className="h-5 w-5" />
                  </div>
                  <h3 className="font-medium">Highest Performers</h3>
                </div>
                <p className="text-3xl font-bold ml-11">{statistics?.highestPerformingClass || "N/A"}</p>
                <p className="text-sm text-muted-foreground ml-11">
                  Avg score: {statistics?.highestPerformingAverage ? `${statistics.highestPerformingAverage}%` : "N/A"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-Generate CBSE Exams Dialog */}
      <Dialog open={autoGenOpen} onOpenChange={setAutoGenOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Auto-Generate CBSE Exams</DialogTitle>
            <DialogDescription>
              Creates one exam per subject per class for each CBSE exam type in the selected term.
              Existing exams are skipped automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>CBSE Level</Label>
                <Select value={autoGenLevel} onValueChange={(v) => setAutoGenLevel(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CBSE_PRIMARY">Primary (Class 1–8)</SelectItem>
                    <SelectItem value="CBSE_SECONDARY">Secondary (Class 9–10)</SelectItem>
                    <SelectItem value="CBSE_SENIOR">Senior Secondary (Class 11–12)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Exam Schedule</Label>
                <Select value={String(autoGenTermNumber)} onValueChange={(v) => setAutoGenTermNumber(Number(v) as 1 | 2)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Half Yearly Pattern</SelectItem>
                    <SelectItem value="2">Annual Pattern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Academic Term</Label>
              <Select value={autoGenTermId} onValueChange={setAutoGenTermId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select academic term..." />
                </SelectTrigger>
                <SelectContent>
                  {allTerms.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.name} ({term.academicYear.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label>Classes ({autoGenClassIds.length} selected)</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setAutoGenClassIds(classes.map((c: any) => c.id))}>
                    All
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setAutoGenClassIds([])}>
                    Clear
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-[180px] border rounded-md p-2">
                <div className="space-y-1">
                  {classes.map((cls: any) => (
                    <div
                      key={cls.id}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer"
                      onClick={() => setAutoGenClassIds((prev) =>
                        prev.includes(cls.id) ? prev.filter((id) => id !== cls.id) : [...prev, cls.id]
                      )}
                    >
                      <Checkbox
                        checked={autoGenClassIds.includes(cls.id)}
                        onCheckedChange={() => setAutoGenClassIds((prev) =>
                          prev.includes(cls.id) ? prev.filter((id) => id !== cls.id) : [...prev, cls.id]
                        )}
                      />
                      <span className="text-sm">{cls.name}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAutoGenOpen(false)} disabled={autoGenLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleAutoGenerateExams}
              disabled={autoGenLoading || !autoGenTermId || autoGenClassIds.length === 0}
            >
              {autoGenLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate Exams
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

