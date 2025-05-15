"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ChevronLeft, Edit, Trash2, PlusCircle, 
  Search, ClipboardList, BookOpen, Clock, 
  CalendarDays, FileText, FolderOpen, Filter,
  ChevronDown, MoreVertical
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Mock data - replace with actual API calls
const lessonsData = [
  {
    id: "1",
    title: "Kinematics",
    subject: { id: "1", name: "Physics", code: "PHY101" },
    grades: ["Grade 11", "Grade 12"],
    unit: "Mechanics",
    duration: 90, // in minutes
    status: "active",
    resources: 3,
    description: "Introduction to motion in one and two dimensions, velocity, and acceleration"
  },
  {
    id: "2",
    title: "Laws of Motion",
    subject: { id: "1", name: "Physics", code: "PHY101" },
    grades: ["Grade 11", "Grade 12"],
    unit: "Mechanics",
    duration: 90,
    status: "active",
    resources: 5,
    description: "Study of Newton's laws of motion and their applications"
  },
  {
    id: "3",
    title: "Work, Energy and Power",
    subject: { id: "1", name: "Physics", code: "PHY101" },
    grades: ["Grade 11", "Grade 12"],
    unit: "Mechanics",
    duration: 90,
    status: "active",
    resources: 4,
    description: "Understanding work, energy, and power in mechanical systems"
  },
  {
    id: "4",
    title: "Heat and Temperature",
    subject: { id: "1", name: "Physics", code: "PHY101" },
    grades: ["Grade 11", "Grade 12"],
    unit: "Thermodynamics",
    duration: 90,
    status: "active",
    resources: 3,
    description: "Concepts of heat, temperature, and thermal equilibrium"
  },
  {
    id: "5",
    title: "Linear Equations",
    subject: { id: "4", name: "Algebra", code: "MTH101" },
    grades: ["Grade 9", "Grade 10"],
    unit: "Equations and Inequalities",
    duration: 60,
    status: "active",
    resources: 6,
    description: "Solving linear equations and their applications"
  },
  {
    id: "6",
    title: "Quadratic Equations",
    subject: { id: "4", name: "Algebra", code: "MTH101" },
    grades: ["Grade 9", "Grade 10"],
    unit: "Equations and Inequalities",
    duration: 90,
    status: "active",
    resources: 4,
    description: "Methods for solving quadratic equations and their applications"
  },
  {
    id: "7",
    title: "Coordinate Geometry",
    subject: { id: "5", name: "Geometry", code: "MTH102" },
    grades: ["Grade 9", "Grade 10"],
    unit: "Analytical Geometry",
    duration: 90,
    status: "active",
    resources: 3,
    description: "Introduction to coordinate geometry and the Cartesian plane"
  },
  {
    id: "8",
    title: "Cell Structure",
    subject: { id: "3", name: "Biology", code: "BIO101" },
    grades: ["Grade 9", "Grade 10"],
    unit: "Cell Biology",
    duration: 90,
    status: "active",
    resources: 7,
    description: "Study of cell structure, organelles, and their functions"
  },
  {
    id: "9",
    title: "Chemical Bonding",
    subject: { id: "2", name: "Chemistry", code: "CHEM101" },
    grades: ["Grade 9", "Grade 10"],
    unit: "Chemical Bonds",
    duration: 90,
    status: "active",
    resources: 5,
    description: "Understanding ionic, covalent, and metallic bonds"
  },
  {
    id: "10",
    title: "Parts of Speech",
    subject: { id: "7", name: "English", code: "ENG101" },
    grades: ["Grade 6", "Grade 7", "Grade 8"],
    unit: "Grammar",
    duration: 60,
    status: "active",
    resources: 8,
    description: "Identifying and using different parts of speech in English"
  },
];

// Subject data for the form
const subjectsData = [
  { id: "1", name: "Physics", code: "PHY101", units: ["Mechanics", "Thermodynamics", "Waves"] },
  { id: "2", name: "Chemistry", code: "CHEM101", units: ["Chemical Bonds", "Periodicity", "Reactions"] },
  { id: "3", name: "Biology", code: "BIO101", units: ["Cell Biology", "Genetics", "Ecology"] },
  { id: "4", name: "Algebra", code: "MTH101", units: ["Equations and Inequalities", "Functions", "Matrices"] },
  { id: "5", name: "Geometry", code: "MTH102", units: ["Analytical Geometry", "Trigonometry", "Vectors"] },
  { id: "7", name: "English", code: "ENG101", units: ["Grammar", "Literature", "Composition"] },
];

// Grade levels
const grades = [
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
  "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"
];

// Form schema
const lessonFormSchema = z.object({
  title: z.string().min(3, "Lesson title must be at least 3 characters"),
  subjectId: z.string({
    required_error: "Please select a subject",
  }),
  unit: z.string({
    required_error: "Please select a unit",
  }),
  grades: z.array(z.string()).min(1, "Please select at least one grade"),
  duration: z.coerce.number().min(15, "Duration must be at least 15 minutes"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  resources: z.array(z.string()).optional(),
});

export default function LessonsPage() {
  const [lessons, setLessons] = useState(lessonsData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [availableUnits, setAvailableUnits] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Form handling
  const form = useForm<z.infer<typeof lessonFormSchema>>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: {
      title: "",
      duration: 60,
      description: "",
      grades: [],
      resources: [],
    },
  });

  // Watch the subject selection to update available units
  const watchSubjectId = form.watch("subjectId");

  // Update available units when subject changes
  const handleSubjectChange = (value: string) => {
    form.setValue("subjectId", value);
    form.setValue("unit", ""); // Reset unit when subject changes
    
    const selectedSubject = subjectsData.find(s => s.id === value);
    if (selectedSubject) {
      setAvailableUnits(selectedSubject.units);
    } else {
      setAvailableUnits([]);
    }
  };

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

  function onSubmit(values: z.infer<typeof lessonFormSchema>) {
    console.log("Form submitted:", values);
    
    const selectedSubject = subjectsData.find(s => s.id === values.subjectId);
    
    if (selectedSubject) {
      if (selectedLessonId) {
        // Update existing lesson
        setLessons(lessons.map(lesson => 
          lesson.id === selectedLessonId 
            ? { 
                ...lesson, 
                title: values.title,
                subject: {
                  id: selectedSubject.id,
                  name: selectedSubject.name,
                  code: selectedSubject.code
                },
                grades: values.grades,
                unit: values.unit,
                duration: values.duration,
                description: values.description,
                resources: values.resources?.length || 0,
              } 
            : lesson
        ));
      } else {
        // Create new lesson
        const newLesson = {
          id: String(lessons.length + 1),
          title: values.title,
          subject: {
            id: selectedSubject.id,
            name: selectedSubject.name,
            code: selectedSubject.code
          },
          grades: values.grades,
          unit: values.unit,
          duration: values.duration,
          status: "active",
          resources: values.resources?.length || 0,
          description: values.description,
        };
        
        setLessons([...lessons, newLesson]);
      }
    }
    
    setDialogOpen(false);
    form.reset();
    setSelectedLessonId(null);
  }

  function handleEdit(id: string) {
    const lessonToEdit = lessons.find(lesson => lesson.id === id);
    if (lessonToEdit) {
      // Set available units for the selected subject
      const selectedSubject = subjectsData.find(s => s.id === lessonToEdit.subject.id);
      if (selectedSubject) {
        setAvailableUnits(selectedSubject.units);
      }
      
      form.reset({
        title: lessonToEdit.title,
        subjectId: lessonToEdit.subject.id,
        unit: lessonToEdit.unit,
        grades: lessonToEdit.grades,
        duration: lessonToEdit.duration,
        description: lessonToEdit.description,
        resources: Array.from({ length: lessonToEdit.resources }, (_, i) => `resource-${i}`),
      });
      
      setSelectedLessonId(id);
      setDialogOpen(true);
    }
  }

  function handleDelete(id: string) {
    setSelectedLessonId(id);
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (selectedLessonId) {
      setLessons(lessons.filter(lesson => lesson.id !== selectedLessonId));
      setDeleteDialogOpen(false);
      setSelectedLessonId(null);
    }
  }

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
            <Button>
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
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjectsData.map(subject => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name} ({subject.code})
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
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={!watchSubjectId || availableUnits.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableUnits.map(unit => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
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
                    name="grades"
                    render={() => (
                      <FormItem>
                        <FormLabel>Applicable Grades</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between"
                              >
                                {form.watch("grades").length > 0
                                  ? `${form.watch("grades").length} grades selected`
                                  : "Select grades"}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-0" align="start">
                            <div className="p-2 grid grid-cols-2 gap-2">
                              {grades.map(grade => (
                                <div key={grade} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`grade-${grade}`}
                                    checked={form.watch("grades").includes(grade)}
                                    onChange={(e) => {
                                      const currentGrades = form.watch("grades");
                                      if (e.target.checked) {
                                        form.setValue("grades", [...currentGrades, grade]);
                                      } else {
                                        form.setValue(
                                          "grades",
                                          currentGrades.filter((g) => g !== grade)
                                        );
                                      }
                                    }}
                                    className="rounded text-primary"
                                  />
                                  <label
                                    htmlFor={`grade-${grade}`}
                                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                  >
                                    {grade}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage>{form.formState.errors.grades?.message}</FormMessage>
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
                          placeholder="Briefly describe the lesson content and objectives" 
                          {...field} 
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
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

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="md:w-2/3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
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
              {subjectsData.map(subject => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
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
          {viewMode === "grid" ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredLessons.map(lesson => (
                <Card key={lesson.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 rounded-md text-blue-700">
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
                    <CardDescription>
                      <Badge variant="outline" className="mr-2">
                        {lesson.subject.name}
                      </Badge>
                      <Badge variant="outline">
                        {lesson.unit}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm line-clamp-2 mb-3">{lesson.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{lesson.duration} minutes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span>{lesson.resources} resources</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {lesson.grades.slice(0, 3).map(grade => (
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
                      <tr className="bg-gray-50 border-b">
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Title</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Subject</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Unit</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Grades</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Duration</th>
                        <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLessons.map(lesson => (
                        <tr key={lesson.id} className="border-b">
                          <td className="py-3 px-4 align-middle font-medium">{lesson.title}</td>
                          <td className="py-3 px-4 align-middle">
                            {lesson.subject.name} <span className="text-xs text-gray-500">({lesson.subject.code})</span>
                          </td>
                          <td className="py-3 px-4 align-middle">{lesson.unit}</td>
                          <td className="py-3 px-4 align-middle">
                            <div className="flex flex-wrap gap-1">
                              {lesson.grades.slice(0, 2).map(grade => (
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

          {filteredLessons.length === 0 && (
            <div className="text-center py-10">
              <ClipboardList className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">No lessons found</h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchTerm || filterSubject !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "No lessons have been added yet"}
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Lesson
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="by-subject">
          <div className="space-y-6">
            {Object.keys(lessonsBySubject).map(subjectId => {
              const subject = subjectsData.find(s => s.id === subjectId);
              const subjectLessons = lessonsBySubject[subjectId];
              
              return (
                <Card key={subjectId}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 rounded-md text-blue-700">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle>{subject?.name}</CardTitle>
                          <CardDescription>{subject?.code}</CardDescription>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Lesson
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Title</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Unit</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Grades</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Duration</th>
                            <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
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
                <FolderOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium mb-1">No lessons found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchTerm || filterSubject !== "all"
                    ? "Try adjusting your filters or search terms"
                    : "No lessons have been added yet"}
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Lesson
                </Button>
              </div>
            )}
          </div>
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
