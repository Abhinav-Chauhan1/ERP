"use client";


import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ChevronLeft, Edit, Trash2, PlusCircle, 
  Search, Filter, BookOpen, FolderOpen, Users,
  AlertCircle, Loader2
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

// Import schema validation and server actions
import { subjectSchema, SubjectFormValues } from "@/lib/schemaValidation/subjectsSchemaValidation";
import { 
  getSubjects, 
  getDepartments, 
  getClasses,
  createSubject,
  updateSubject,
  deleteSubject
} from "@/lib/actions/subjectsActions";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form handling
  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      code: "",
      name: "",
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
        result = await updateSubject({ ...values, id: selectedSubjectId });
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
        code: subjectToEdit.code,
        name: subjectToEdit.name,
        departmentId: subjectToEdit.departmentId,
        description: subjectToEdit.description,
        classIds: subjectToEdit.classIds,
      });
      
      setSelectedSubjectId(id);
      setDialogOpen(true);
    }
  }

  async function handleDelete(id: string) {
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
      code: "", 
      name: "", 
      description: "", 
      departmentId: "", 
      classIds: [] 
    });
    setSelectedSubjectId(null);
    setDialogOpen(true);
  }

  // Filter subjects based on search term and department filter
  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = 
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (subject.description && subject.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDepartment = departmentFilter === "all" || subject.department === departmentFilter;
    
    return matchesSearch && matchesDepartment;
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
          <h1 className="text-2xl font-bold tracking-tight">Subjects</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
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
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
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
                  name="classIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>Applicable Classes</FormLabel>
                      <div className="grid grid-cols-3 gap-2 border rounded-md p-3 max-h-60 overflow-y-auto">
                        {classes.map((classItem) => (
                          <div key={classItem.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={classItem.id}
                              checked={form.watch("classIds").includes(classItem.id)}
                              onCheckedChange={(checked) => {
                                const currentClasses = form.watch("classIds");
                                if (checked) {
                                  form.setValue("classIds", [...currentClasses, classItem.id]);
                                } else {
                                  form.setValue(
                                    "classIds",
                                    currentClasses.filter(c => c !== classItem.id)
                                  );
                                }
                              }}
                              className="rounded text-primary"
                            />
                            <label htmlFor={classItem.id} className="text-sm cursor-pointer">
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
                    {selectedSubjectId ? "Save Changes" : "Add Subject"}
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
                <SelectItem key={department.id} value={department.name}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredSubjects.map(subject => (
            <Card key={subject.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-md text-primary">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{subject.code}</p>
                    </div>
                  </div>
                  <Badge className="bg-accent text-gray-800 hover:bg-accent">
                    {subject.department}
                  </Badge>
                </div>
                <CardDescription className="mt-2 line-clamp-2">{subject.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {subject.grades.slice(0, 5).map((grade: string) => (
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
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{subject.teachers} Teachers</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
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
      )}

      {!loading && filteredSubjects.length === 0 && (
        <div className="text-center py-10">
          <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-lg font-medium mb-1">No subjects found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchTerm || departmentFilter !== "all"
              ? "Try adjusting your filters or search terms"
              : "No subjects have been added yet"}
          </p>
          <Button onClick={handleAddNew}>
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

