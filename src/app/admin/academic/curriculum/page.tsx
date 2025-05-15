"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ChevronLeft, Edit, Trash2, PlusCircle, 
  BookOpen, BookText, FolderPlus, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Mock data - replace with actual API calls
const subjectsData = [
  {
    id: "1",
    name: "Mathematics",
    code: "MATH101",
    description: "Basic principles of algebra, geometry, and calculus",
    department: "Mathematics",
    classes: ["Grade 9", "Grade 10"],
    hasComplexSyllabus: true
  },
  {
    id: "2",
    name: "Physics",
    code: "PHYS101",
    description: "Study of matter, energy, and the interaction between them",
    department: "Science",
    classes: ["Grade 9", "Grade 10"],
    hasComplexSyllabus: true
  },
  {
    id: "3",
    name: "Chemistry",
    code: "CHEM101",
    description: "Study of composition, structure, properties, and change of matter",
    department: "Science",
    classes: ["Grade 9", "Grade 10"],
    hasComplexSyllabus: true
  },
  {
    id: "4",
    name: "Biology",
    code: "BIOL101",
    description: "Study of living organisms and their interactions with each other and their environment",
    department: "Science",
    classes: ["Grade 9", "Grade 10"],
    hasComplexSyllabus: false
  },
  {
    id: "5",
    name: "English",
    code: "ENGL101",
    description: "Study of language, literature, and composition",
    department: "Languages",
    classes: ["Grade 9", "Grade 10", "Grade 11", "Grade 12"],
    hasComplexSyllabus: true
  },
  {
    id: "6",
    name: "History",
    code: "HIST101",
    description: "Study of past events and their impact on society",
    department: "Social Studies",
    classes: ["Grade 9", "Grade 10"],
    hasComplexSyllabus: false
  },
  {
    id: "7",
    name: "Geography",
    code: "GEOG101",
    description: "Study of places and the relationships between people and their environments",
    department: "Social Studies",
    classes: ["Grade 9", "Grade 10"],
    hasComplexSyllabus: false
  },
  {
    id: "8",
    name: "Computer Science",
    code: "COMP101",
    description: "Study of computers and computational systems",
    department: "Technology",
    classes: ["Grade 9", "Grade 10", "Grade 11", "Grade 12"],
    hasComplexSyllabus: true
  }
];

const departmentsData = [
  { id: "1", name: "Mathematics" },
  { id: "2", name: "Science" },
  { id: "3", name: "Languages" },
  { id: "4", name: "Social Studies" },
  { id: "5", name: "Physical Education" },
  { id: "6", name: "Arts" },
  { id: "7", name: "Technology" },
  { id: "8", name: "Vocational Studies" }
];

const classesData = [
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", 
  "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", 
  "Grade 11", "Grade 12"
];

const formSchema = z.object({
  name: z.string().min(3, "Subject name must be at least 3 characters"),
  code: z.string().min(3, "Subject code must be at least 3 characters"),
  description: z.string().optional(),
  departmentId: z.string({
    required_error: "Please select a department",
  }),
  classes: z.array(z.string()).min(1, "Please select at least one class"),
});

export default function CurriculumPage() {
  const [subjects, setSubjects] = useState(subjectsData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      departmentId: "",
      classes: [],
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    
    const departmentName = departmentsData.find(dept => dept.id === values.departmentId)?.name || "";
    
    if (selectedSubjectId) {
      // Update existing subject
      setSubjects(subjects.map(subject => 
        subject.id === selectedSubjectId 
          ? { 
              ...subject, 
              name: values.name,
              code: values.code,
              description: values.description || "",
              department: departmentName,
              classes: values.classes
            } 
          : subject
      ));
    } else {
      // Create new subject
      const newSubject = {
        id: (subjects.length + 1).toString(),
        name: values.name,
        code: values.code,
        description: values.description || "",
        department: departmentName,
        classes: values.classes,
        hasComplexSyllabus: false
      };
      
      setSubjects([...subjects, newSubject]);
    }
    
    setDialogOpen(false);
    form.reset();
    setSelectedSubjectId(null);
  }

  function handleEdit(id: string) {
    const subjectToEdit = subjects.find(subject => subject.id === id);
    if (subjectToEdit) {
      const departmentId = departmentsData.find(dept => dept.name === subjectToEdit.department)?.id || "";
      
      form.reset({
        name: subjectToEdit.name,
        code: subjectToEdit.code,
        description: subjectToEdit.description,
        departmentId: departmentId,
        classes: subjectToEdit.classes,
      });
      setSelectedSubjectId(id);
      setDialogOpen(true);
    }
  }

  function handleDelete(id: string) {
    setSelectedSubjectId(id);
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (selectedSubjectId) {
      setSubjects(subjects.filter(subject => subject.id !== selectedSubjectId));
      setDeleteDialogOpen(false);
      setSelectedSubjectId(null);
    }
  }

  function handleAddNew() {
    form.reset({ 
      name: "", 
      code: "", 
      description: "", 
      departmentId: "", 
      classes: [] 
    });
    setSelectedSubjectId(null);
    setDialogOpen(true);
  }

  // Filter subjects based on search term and department filter
  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         subject.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === "all" || subject.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/academic">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Curriculum Management</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedSubjectId ? "Edit Subject" : "Add New Subject"}</DialogTitle>
              <DialogDescription>
                {selectedSubjectId 
                  ? "Update the details of the subject" 
                  : "Create a new subject for your curriculum"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Mathematics" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. MATH101" {...field} />
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
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the subject content and objectives" 
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
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departmentsData.map(department => (
                            <SelectItem key={department.id} value={department.id}>
                              {department.name}
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
                  name="classes"
                  render={() => (
                    <FormItem>
                      <FormLabel>Classes</FormLabel>
                      <div className="grid grid-cols-3 gap-2 border rounded-md p-3">
                        {classesData.map((className) => (
                          <div key={className} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={className}
                              checked={form.watch("classes").includes(className)}
                              onChange={(e) => {
                                const currentClasses = form.watch("classes");
                                if (e.target.checked) {
                                  form.setValue("classes", [...currentClasses, className]);
                                } else {
                                  form.setValue(
                                    "classes",
                                    currentClasses.filter((c) => c !== className)
                                  );
                                }
                              }}
                              className="rounded text-primary"
                            />
                            <label htmlFor={className} className="text-sm">{className}</label>
                          </div>
                        ))}
                      </div>
                      <FormMessage>{form.formState.errors.classes?.message}</FormMessage>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">
                    {selectedSubjectId ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="search" className="text-sm font-medium block mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input 
                  id="search" 
                  placeholder="Search by subject name or code..." 
                  className="pl-9" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <label htmlFor="department-filter" className="text-sm font-medium block mb-1">Filter by Department</label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger id="department-filter">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departmentsData.map(department => (
                    <SelectItem key={department.id} value={department.name}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubjects.map((subject) => (
          <Card key={subject.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 rounded-md text-blue-700">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{subject.name}</CardTitle>
                    <CardDescription className="text-xs">{subject.code}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(subject.id)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDelete(subject.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{subject.description}</p>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 bg-purple-50 rounded-md text-purple-700">
                    <FolderPlus className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{subject.department}</span>
                </div>
                {subject.hasComplexSyllabus && (
                  <Link href={`/admin/academic/syllabus?subject=${subject.id}`}>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      <BookText className="h-3.5 w-3.5 mr-1.5" />
                      View Syllabus
                    </Button>
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {subject.classes.map((className) => (
                  <span 
                    key={className} 
                    className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                  >
                    {className}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSubjects.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium mb-1">No subjects found</h3>
          <p className="text-sm">Try changing your search or filter criteria</p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subject</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this subject? This action cannot be undone.
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
