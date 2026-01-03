"use client";


import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft, Edit, Trash2, PlusCircle,
  Search, ClipboardList, BookOpen, Clock,
  CalendarDays, FileText, FolderOpen, Filter,
  ChevronDown, MoreVertical, AlertCircle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

// Import schema validation and server actions
import { lessonSchema, LessonFormValues } from "@/lib/schemaValidation/lessonsSchemaValidation";
import {
  getLessons,
  getSubjectsForLessons,
  getSyllabusUnitsBySubject,
  createLesson,
  updateLesson,
  deleteLesson
} from "@/lib/actions/lessonsActions";

export default function LessonsPage() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [availableUnits, setAvailableUnits] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form handling
  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: 60,
      subjectId: "",
      syllabusUnitId: "",
      content: "",
      resources: "",
    },
  });

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getLessons();

      if (result.success) {
        setLessons(result.data || []);
      } else {
        setError(result.error || "An error occurred");
        toast.error(result.error || "An error occurred");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    try {
      const result = await getSubjectsForLessons();

      if (result.success) {
        setSubjects(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch subjects");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchLessons();
    fetchSubjects();
  }, [fetchLessons, fetchSubjects]);

  const updateAvailableUnits = useCallback((subjectId: string) => {
    try {
      const selectedSubject = subjects.find(s => s.id === subjectId);
      if (selectedSubject) {
        setAvailableUnits(selectedSubject.units || []);
      } else {
        setAvailableUnits([]);
      }
    } catch (err) {
      console.error("Error updating available units:", err);
    }
  }, [subjects]);

  // Watch the subject selection to update available units
  const watchSubjectId = form.watch("subjectId");

  useEffect(() => {
    if (watchSubjectId) {
      updateAvailableUnits(watchSubjectId);
    }
  }, [watchSubjectId, updateAvailableUnits]);

  // Update available units when subject changes
  const handleSubjectChange = (value: string) => {
    form.setValue("subjectId", value);
    form.setValue("syllabusUnitId", ""); // Reset unit when subject changes

    if (value) {
      updateAvailableUnits(value);
    } else {
      setAvailableUnits([]);
    }
  };

  async function onSubmit(values: LessonFormValues) {
    try {
      let result;

      if (selectedLessonId) {
        // Update existing lesson
        result = await updateLesson({ ...values, id: selectedLessonId });
      } else {
        // Create new lesson
        result = await createLesson(values);
      }

      if (result.success) {
        toast.success(`Lesson ${selectedLessonId ? "updated" : "created"} successfully`);
        setDialogOpen(false);
        form.reset();
        setSelectedLessonId(null);
        fetchLessons();
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  function handleEdit(id: string) {
    const lessonToEdit = lessons.find(lesson => lesson.id === id);
    if (lessonToEdit) {
      handleSubjectChange(lessonToEdit.subject.id);

      form.reset({
        title: lessonToEdit.title,
        description: lessonToEdit.description,
        subjectId: lessonToEdit.subject.id,
        syllabusUnitId: lessonToEdit.syllabusUnitId,
        duration: lessonToEdit.duration,
        content: lessonToEdit.content,
        resources: lessonToEdit.resources,
      });

      setSelectedLessonId(id);
      setDialogOpen(true);
    }
  }

  function handleAddNew() {
    form.reset({
      title: "",
      description: "",
      duration: 60,
      subjectId: "",
      syllabusUnitId: "",
      content: "",
      resources: "",
    });
    setAvailableUnits([]);
    setSelectedLessonId(null);
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    setSelectedLessonId(id);
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (selectedLessonId) {
      try {
        const result = await deleteLesson(selectedLessonId);

        if (result.success) {
          toast.success("Lesson deleted successfully");
          setDeleteDialogOpen(false);
          setSelectedLessonId(null);
          fetchLessons();
        } else {
          toast.error(result.error || "Failed to delete lesson");
        }
      } catch (err) {
        console.error(err);
        toast.error("An unexpected error occurred");
      }
    }
  }

  // Filter lessons based on search term and subject filter
  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.unit.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSubject = filterSubject === "all" || lesson.subject.id === filterSubject;

    return matchesSearch && matchesSubject;
  });

  // Group lessons by subject for the "By Subject" tab
  const lessonsBySubject: Record<string, any[]> = {};
  filteredLessons.forEach(lesson => {
    if (!lessonsBySubject[lesson.subject.id]) {
      lessonsBySubject[lesson.subject.id] = [];
    }
    lessonsBySubject[lesson.subject.id].push(lesson);
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/teaching">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Lessons</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Lesson
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{selectedLessonId ? "Edit Lesson" : "Create New Lesson"}</DialogTitle>
              <DialogDescription>
                {selectedLessonId
                  ? "Update the details of the existing lesson"
                  : "Create a new lesson for your curriculum"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lesson Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Introduction to Quadratic Equations" {...field} />
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
                        <Select
                          onValueChange={handleSubjectChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjects.map(subject => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name} {subject.code ? `(${subject.code})` : ''}
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
                    name="syllabusUnitId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!watchSubjectId || availableUnits.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None (Uncategorized)</SelectItem>
                            {availableUnits.map(unit => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={15}
                          step={15}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Briefly describe the lesson content and objectives"
                          {...field}
                          rows={4}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lesson Content (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the lesson content or a URL to content"
                          {...field}
                          rows={3}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="resources"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resources (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter URLs to resources, separated by commas"
                          {...field}
                          rows={2}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">Enter resource URLs separated by commas, e.g. http://example.com/resource1, http://example.com/resource2</p>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">
                    {selectedLessonId ? "Save Changes" : "Create Lesson"}
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

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="md:w-2/3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search lessons by title, description, or unit..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="md:w-1/3">
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map(subject => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name} {subject.code ? `(${subject.code})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="all">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">All Lessons</TabsTrigger>
            <TabsTrigger value="by-subject">By Subject</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode("grid")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-grid"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode("list")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list"><line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" /></svg>
            </Button>
          </div>
        </div>

        <TabsContent value="all">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredLessons.map(lesson => (
                <Card key={lesson.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-md text-primary">
                          <ClipboardList className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg">{lesson.title}</CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(lesson.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(lesson.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <Badge variant="outline" className="mr-2">
                        {lesson.subject.name}
                      </Badge>
                      <Badge variant="outline">
                        {lesson.unit}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm line-clamp-2 mb-3">{lesson.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{lesson.duration} minutes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{lesson.resources} resources</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {lesson.grades.slice(0, 3).map((grade: string) => (
                        <Badge key={grade} variant="secondary" className="text-xs">
                          {grade}
                        </Badge>
                      ))}
                      {lesson.grades.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{lesson.grades.length - 3} more
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t mt-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(lesson.id)}>
                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Link href={`/admin/teaching/lessons/${lesson.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-accent border-b">
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Title</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Subject</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Unit</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Grades</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Duration</th>
                        <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLessons.map(lesson => (
                        <tr key={lesson.id} className="border-b">
                          <td className="py-3 px-4 align-middle font-medium">{lesson.title}</td>
                          <td className="py-3 px-4 align-middle">
                            {lesson.subject.name} {lesson.subject.code && <span className="text-xs text-muted-foreground">({lesson.subject.code})</span>}
                          </td>
                          <td className="py-3 px-4 align-middle">{lesson.unit}</td>
                          <td className="py-3 px-4 align-middle">
                            <div className="flex flex-wrap gap-1">
                              {lesson.grades.slice(0, 2).map((grade: string) => (
                                <Badge key={grade} variant="secondary" className="text-xs">
                                  {grade}
                                </Badge>
                              ))}
                              {lesson.grades.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{lesson.grades.length - 2}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle">{lesson.duration} min</td>
                          <td className="py-3 px-4 align-middle text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(lesson.id)}>
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(lesson.id)}>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && filteredLessons.length === 0 && (
            <div className="text-center py-10">
              <ClipboardList className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">No lessons found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || filterSubject !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "No lessons have been added yet"}
              </p>
              <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Lesson
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="by-subject">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(lessonsBySubject).map(subjectId => {
                const subject = subjects.find(s => s.id === subjectId);
                const subjectLessons = lessonsBySubject[subjectId];

                return (
                  <Card key={subjectId}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-primary/10 rounded-md text-primary">
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle>{subject?.name || "Unknown Subject"}</CardTitle>
                            <CardDescription>{subject?.code || ""}</CardDescription>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleSubjectChange(subjectId);
                            handleAddNew();
                          }}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Lesson
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-accent border-b">
                              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Title</th>
                              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Unit</th>
                              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Grades</th>
                              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Duration</th>
                              <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subjectLessons.map(lesson => (
                              <tr key={lesson.id} className="border-b">
                                <td className="py-3 px-4 align-middle font-medium">{lesson.title}</td>
                                <td className="py-3 px-4 align-middle">{lesson.unit}</td>
                                <td className="py-3 px-4 align-middle">
                                  <div className="flex flex-wrap gap-1">
                                    {lesson.grades.slice(0, 2).map((grade: string) => (
                                      <Badge key={grade} variant="secondary" className="text-xs">
                                        {grade}
                                      </Badge>
                                    ))}
                                    {lesson.grades.length > 2 && (
                                      <Badge variant="secondary" className="text-xs">
                                        +{lesson.grades.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 align-middle">{lesson.duration} min</td>
                                <td className="py-3 px-4 align-middle text-right">
                                  <Button variant="ghost" size="sm" onClick={() => handleEdit(lesson.id)}>
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(lesson.id)}>
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {Object.keys(lessonsBySubject).length === 0 && (
                <div className="text-center py-10">
                  <FolderOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">No lessons found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchTerm || filterSubject !== "all"
                      ? "Try adjusting your filters or search terms"
                      : "No lessons have been added yet"}
                  </p>
                  <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Lesson
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lesson</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this lesson? This action cannot be undone and will remove all associated resources and materials.
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

