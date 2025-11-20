"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ChevronLeft, Edit, Trash2, PlusCircle, 
  BookOpen, BookText, FolderPlus, Search, 
  AlertCircle, Loader2
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import * as z from "zod";

// Import schema validation and server actions
import { subjectSchema, SubjectFormValues, subjectUpdateSchema, SubjectUpdateFormValues } from "@/lib/schemaValidation/curriculumSchemaValidation";
import { 
  getSubjects, 
  getDepartments, 
  getClasses, 
  createSubject, 
  updateSubject, 
  deleteSubject 
} from "@/lib/actions/curriculumActions";

export default function CurriculumPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      departmentId: "",
      classIds: [],
    },
  });

  useEffect(() => {
    fetchSubjects();
    fetchDepartments();
    fetchClasses();
  }, []);

  async function fetchSubjects() {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getSubjects();
      
      if (result.success) {
        setSubjects(result.data || []);
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
  }

  async function fetchDepartments() {
    try {
      const result = await getDepartments();
      
      if (result.success) {
        setDepartments(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch departments");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      console.error(err);
    }
  }

  async function fetchClasses() {
    try {
      const result = await getClasses();
      
      if (result.success) {
        setClasses(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch classes");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      console.error(err);
    }
  }

  async function onSubmit(values: SubjectFormValues) {
    try {
      let result;
      
      if (selectedSubjectId) {
        // Update existing subject
        const updateData: SubjectUpdateFormValues = { ...values, id: selectedSubjectId };
        result = await updateSubject(updateData);
      } else {
        // Create new subject
        result = await createSubject(values);
      }
      
      if (result.success) {
        toast.success(`Subject ${selectedSubjectId ? "updated" : "created"} successfully`);
        setDialogOpen(false);
        form.reset();
        setSelectedSubjectId(null);
        fetchSubjects();
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  function handleEdit(id: string) {
    const subjectToEdit = subjects.find(subject => subject.id === id);
    if (subjectToEdit) {
      form.reset({
        name: subjectToEdit.name,
        code: subjectToEdit.code,
        description: subjectToEdit.description,
        departmentId: subjectToEdit.departmentId,
        classIds: subjectToEdit.classIds,
      });
      setSelectedSubjectId(id);
      setDialogOpen(true);
    }
  }

  function handleDelete(id: string) {
    setSelectedSubjectId(id);
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (selectedSubjectId) {
      try {
        const result = await deleteSubject(selectedSubjectId);
        
        if (result.success) {
          toast.success("Subject deleted successfully");
          setDeleteDialogOpen(false);
          setSelectedSubjectId(null);
          fetchSubjects();
        } else {
          toast.error(result.error || "Failed to delete subject");
        }
      } catch (err) {
        console.error(err);
        toast.error("An unexpected error occurred");
      }
    }
  }

  function handleAddNew() {
    form.reset({ 
      name: "", 
      code: "", 
      description: "", 
      departmentId: "", 
      classIds: [] 
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
                          {departments.map(department => (
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
                  name="classIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>Classes</FormLabel>
                      <div className="grid grid-cols-3 gap-2 border rounded-md p-3 max-h-60 overflow-y-auto">
                        {classes.map((classItem) => (
                          <div key={classItem.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={classItem.id}
                              checked={form.watch("classIds").includes(classItem.id)}
                              onChange={(e) => {
                                const currentClasses = form.watch("classIds");
                                if (e.target.checked) {
                                  form.setValue("classIds", [...currentClasses, classItem.id]);
                                } else {
                                  form.setValue(
                                    "classIds",
                                    currentClasses.filter((c) => c !== classItem.id)
                                  );
                                }
                              }}
                              className="rounded text-primary"
                            />
                            <label htmlFor={classItem.id} className="text-sm">
                              {classItem.name}
                              {classItem.academicYear.isCurrent && 
                                <span className="ml-1 text-xs text-green-600">(Current)</span>
                              }
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage>{form.formState.errors.classIds?.message}</FormMessage>
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

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="search" className="text-sm font-medium block mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
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
                  {departments.map(department => (
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

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubjects.map((subject) => (
              <Card key={subject.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-md text-primary">
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
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{subject.description}</p>
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
                    {subject.classes.map((className: string) => (
                      <span 
                        key={className} 
                        className="px-2 py-0.5 bg-muted text-gray-700 rounded text-xs"
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
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium mb-1">No subjects found</h3>
              <p className="text-sm">Try changing your search or filter criteria</p>
            </div>
          )}
        </>
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
