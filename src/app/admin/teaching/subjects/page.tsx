"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ChevronLeft, Edit, Trash2, PlusCircle, 
  Search, Filter, BookOpen, FolderOpen, Users
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Mock data - replace with actual API calls
const subjectsData = [
  {
    id: "1",
    code: "PHY101",
    name: "Physics",
    department: "Science",
    description: "Study of matter, energy, and the interaction between them",
    hasLabs: true,
    grades: ["Grade 9", "Grade 10", "Grade 11", "Grade 12"],
    teachers: 6,
    classes: 10
  },
  {
    id: "2",
    code: "CHEM101",
    name: "Chemistry",
    department: "Science",
    description: "Study of composition, structure, properties, and change of matter",
    hasLabs: true,
    grades: ["Grade 9", "Grade 10", "Grade 11", "Grade 12"],
    teachers: 5,
    classes: 10
  },
  {
    id: "3",
    code: "BIO101",
    name: "Biology",
    department: "Science",
    description: "Study of living organisms and their interactions",
    hasLabs: true,
    grades: ["Grade 9", "Grade 10", "Grade 11", "Grade 12"],
    teachers: 4,
    classes: 8
  },
  {
    id: "4",
    code: "MTH101",
    name: "Algebra",
    department: "Mathematics",
    description: "Study of mathematical symbols and the rules for manipulating these symbols",
    hasLabs: false,
    grades: ["Grade 9", "Grade 10", "Grade 11", "Grade 12"],
    teachers: 8,
    classes: 15
  },
  {
    id: "5",
    code: "MTH102",
    name: "Geometry",
    department: "Mathematics",
    description: "Study of shape, size, relative position of figures, and properties of space",
    hasLabs: false,
    grades: ["Grade 9", "Grade 10", "Grade 11", "Grade 12"],
    teachers: 5,
    classes: 12
  },
  {
    id: "6",
    code: "MTH103",
    name: "Statistics",
    department: "Mathematics",
    description: "Study of the collection, analysis, interpretation, and presentation of data",
    hasLabs: false,
    grades: ["Grade 11", "Grade 12"],
    teachers: 3,
    classes: 6
  },
  {
    id: "7",
    code: "ENG101",
    name: "English",
    department: "Languages",
    description: "Study of language, literature, and composition",
    hasLabs: false,
    grades: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"],
    teachers: 10,
    classes: 32
  },
  {
    id: "8",
    code: "SPA101",
    name: "Spanish",
    department: "Languages",
    description: "Study of Spanish language and cultures of Spanish-speaking countries",
    hasLabs: false,
    grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"],
    teachers: 4,
    classes: 16
  },
  {
    id: "9",
    code: "FRE101",
    name: "French",
    department: "Languages",
    description: "Study of French language and francophone cultures",
    hasLabs: false,
    grades: ["Grade 9", "Grade 10", "Grade 11", "Grade 12"],
    teachers: 3,
    classes: 8
  },
  {
    id: "10",
    code: "HIS101",
    name: "History",
    department: "Social Studies",
    description: "Study of past events and their impact on society",
    hasLabs: false,
    grades: ["Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"],
    teachers: 6,
    classes: 18
  },
  {
    id: "11",
    code: "GEO101",
    name: "Geography",
    department: "Social Studies",
    description: "Study of places and the relationships between people and their environments",
    hasLabs: false,
    grades: ["Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"],
    teachers: 4,
    classes: 16
  },
  {
    id: "12",
    code: "CIV101",
    name: "Civics",
    department: "Social Studies",
    description: "Study of the rights and duties of citizenship",
    hasLabs: false,
    grades: ["Grade 9", "Grade 10", "Grade 11", "Grade 12"],
    teachers: 3,
    classes: 10
  },
];

// Department data
const departments = [
  "Science", 
  "Mathematics", 
  "Languages", 
  "Social Studies", 
  "Arts", 
  "Physical Education", 
  "Technology"
];

// Grade levels
const grades = [
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
  "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"
];

// Form schema
const subjectFormSchema = z.object({
  code: z.string().min(3, "Subject code must be at least 3 characters"),
  name: z.string().min(2, "Subject name must be at least 2 characters"),
  department: z.string({
    required_error: "Please select a department",
  }),
  description: z.string().optional(),
  hasLabs: z.boolean().default(false),
  grades: z.array(z.string()).min(1, "Please select at least one grade"),
});

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState(subjectsData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Form handling
  const form = useForm<z.infer<typeof subjectFormSchema>>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      hasLabs: false,
      grades: [],
    },
  });

  // Filter subjects based on search term and department filter
  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = 
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === "all" || subject.department === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  });

  function onSubmit(values: z.infer<typeof subjectFormSchema>) {
    if (selectedSubjectId) {
      // Update existing subject
      setSubjects(subjects.map(subject => 
        subject.id === selectedSubjectId 
          ? { 
              ...subject, 
              code: values.code,
              name: values.name,
              department: values.department,
              description: values.description || "",
              hasLabs: values.hasLabs,
              grades: values.grades,
            } 
          : subject
      ));
    } else {
      // Create new subject
      const newSubject = {
        id: String(subjects.length + 1),
        code: values.code,
        name: values.name,
        department: values.department,
        description: values.description || "",
        hasLabs: values.hasLabs,
        grades: values.grades,
        teachers: 0,
        classes: 0
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
      form.reset({
        code: subjectToEdit.code,
        name: subjectToEdit.name,
        department: subjectToEdit.department,
        description: subjectToEdit.description,
        hasLabs: subjectToEdit.hasLabs,
        grades: subjectToEdit.grades,
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
          <h1 className="text-2xl font-bold tracking-tight">Subjects</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{selectedSubjectId ? "Edit Subject" : "Add New Subject"}</DialogTitle>
              <DialogDescription>
                {selectedSubjectId 
                  ? "Update the details of the existing subject" 
                  : "Add a new subject to your curriculum"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. MTH101" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                </div>
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map(department => (
                            <SelectItem key={department} value={department}>
                              {department}
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of the subject" 
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
                  name="hasLabs"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Has Laboratory Component
                        </FormLabel>
                        <p className="text-sm text-gray-500">
                          This subject requires laboratory sessions
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="grades"
                  render={() => (
                    <FormItem>
                      <FormLabel>Applicable Grades</FormLabel>
                      <div className="grid grid-cols-4 gap-2 border rounded-md p-3">
                        {grades.map((grade) => (
                          <div key={grade} className="flex items-center space-x-2">
                            <Checkbox
                              id={grade}
                              checked={form.watch("grades").includes(grade)}
                              onCheckedChange={(checked) => {
                                const currentGrades = form.watch("grades");
                                if (checked) {
                                  form.setValue("grades", [...currentGrades, grade]);
                                } else {
                                  form.setValue(
                                    "grades",
                                    currentGrades.filter((g) => g !== grade)
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={grade}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {grade}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage>{form.formState.errors.grades?.message}</FormMessage>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">
                    {selectedSubjectId ? "Save Changes" : "Add Subject"}
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
              placeholder="Search subjects..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="md:w-1/3">
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(department => (
                <SelectItem key={department} value={department}>
                  {department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredSubjects.map(subject => (
          <Card key={subject.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 rounded-md text-blue-700">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                    <p className="text-xs text-gray-500">{subject.code}</p>
                  </div>
                </div>
                <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                  {subject.department}
                </Badge>
              </div>
              <CardDescription className="mt-2 line-clamp-2">{subject.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1 mb-2">
                  {subject.grades.slice(0, 5).map(grade => (
                    <Badge key={grade} variant="outline" className="text-xs">
                      {grade}
                    </Badge>
                  ))}
                  {subject.grades.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{subject.grades.length - 5} more
                    </Badge>
                  )}
                </div>
                
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>{subject.teachers} Teachers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FolderOpen className="h-4 w-4 text-gray-500" />
                    <span>{subject.classes} Classes</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t mt-3">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(subject.id)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-500"
                      onClick={() => handleDelete(subject.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete
                    </Button>
                  </div>
                  <Link href={`/admin/teaching/subjects/${subject.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSubjects.length === 0 && (
        <div className="text-center py-10">
          <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium mb-1">No subjects found</h3>
          <p className="text-sm text-gray-500 mb-4">
            {searchTerm || departmentFilter !== "all"
              ? "Try adjusting your filters or search terms"
              : "No subjects have been added yet"}
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Subject
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subject</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this subject? This action cannot be undone and will remove all associated lessons and materials.
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
