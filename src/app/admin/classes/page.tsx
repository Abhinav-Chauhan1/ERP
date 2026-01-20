"use client";


import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  PlusCircle, Search,
  Loader2, AlertCircle, BookOpen
} from "lucide-react";
import { ClassesTable } from "@/components/admin/classes-table";
import { Input } from "@/components/ui/input";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

// Import schema validation and server actions
import { classSchema, ClassFormValues } from "@/lib/schemaValidation/classesSchemaValidation";
import { getClasses, createClass, updateClass, getAcademicYearsForDropdown } from "@/lib/actions/classesActions";

export default function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [classesByGrade, setClassesByGrade] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [academicYearFilter, setAcademicYearFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: "",
      academicYearId: "",
      description: "",
    },
  });

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getClasses();

      if (result.success) {
        setClasses(result.data || []);
        setClassesByGrade(result.summary || []);
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

  const fetchAcademicYears = useCallback(async () => {
    try {
      const result = await getAcademicYearsForDropdown();

      if (result.success) {
        setAcademicYears(result.data || []);

        // Set the current academic year as default in the form
        const currentYear = result.data?.find((year: any) => year.isCurrent);
        if (currentYear) {
          form.setValue("academicYearId", currentYear.id);
        }
      } else {
        toast.error(result.error || "Failed to fetch academic years");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      console.error(err);
    }
  }, [form]);

  useEffect(() => {
    fetchClasses();
    fetchAcademicYears();
  }, [fetchClasses, fetchAcademicYears]);

  function handleEditClass(id: string) {
    const classToEdit = classes.find(cls => cls.id === id);

    if (classToEdit) {
      // Reset form with values from the selected class
      form.reset({
        name: classToEdit.name,
        academicYearId: classToEdit.academicYearId,
        description: classToEdit.description || "",
      });

      setSelectedClassId(id);
      setDialogOpen(true);
    }
  }

  async function onSubmit(values: ClassFormValues) {
    try {
      let result;

      if (selectedClassId) {
        // Update existing class
        result = await updateClass({ ...values, id: selectedClassId });
      } else {
        // Create new class
        result = await createClass(values);
      }

      if (result.success) {
        toast.success(`Class ${selectedClassId ? "updated" : "created"} successfully`);
        setDialogOpen(false);
        form.reset();
        setSelectedClassId(null);
        fetchClasses();
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  function handleCreateClass() {
    // Reset form with current academic year
    const currentYear = academicYears.find(year => year.isCurrent);
    form.reset({
      name: "",
      academicYearId: currentYear ? currentYear.id : "",
      description: "",
    });
    setSelectedClassId(null);
    setDialogOpen(true);
  }

  // Filter classes based on search term and academic year filter
  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAcademicYear = academicYearFilter === "all" || cls.academicYearId === academicYearFilter;
    return matchesSearch && matchesAcademicYear;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Class Management</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={handleCreateClass} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Create Class
          </Button>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{selectedClassId ? "Edit Class" : "Create New Class"}</DialogTitle>
              <DialogDescription>
                {selectedClassId
                  ? "Update the details of the existing class."
                  : "Define a new class for student enrollment."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="academicYearId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select academic year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {academicYears.map((year) => (
                            <SelectItem key={year.id} value={year.id}>
                              {year.name} {year.isCurrent && "(Current)"}
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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Grade 10 - Science"
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
                      <FormLabel>Class Description</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Optional description for the class"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">{selectedClassId ? "Update Class" : "Create Class"}</Button>
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

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {classesByGrade.length > 0 ? (
              classesByGrade.map((grade: any) => (
                <Card key={grade.grade} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{grade.grade}</CardTitle>
                    <CardDescription>
                      {grade.classes} {grade.classes === 1 ? 'class' : 'classes'},
                      {grade.students} {grade.students === 1 ? 'student' : 'students'}
                      {grade.isCurrent && <span className="ml-2 text-green-600">(Current Year)</span>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-3">
                      <div className="text-sm text-muted-foreground mb-1">Sections:</div>
                      <div className="flex flex-wrap gap-1">
                        {grade.sections.map((section: string) => (
                          <span
                            key={section}
                            className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                          >
                            {section}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Link href={`/admin/classes?grade=${encodeURIComponent(grade.grade)}`}>
                        <Button variant="outline" size="sm">
                          View Classes
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-medium mb-1">No classes found</h3>
                <p className="text-sm mb-4">Create your first class to get started</p>
                <Button onClick={handleCreateClass}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Class
                </Button>
              </div>
            )}
          </div>

          {classes.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">All Classes</CardTitle>
                    <CardDescription>
                      Manage, search and filter all classes
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search classes..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select
                      value={academicYearFilter}
                      onValueChange={setAcademicYearFilter}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {academicYears.map(year => (
                          <SelectItem key={year.id} value={year.id}>
                            {year.name} {year.isCurrent && "(Current)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ClassesTable
                  classes={filteredClasses}
                  onEdit={handleEditClass}
                  emptyMessage={
                    searchTerm || academicYearFilter !== "all"
                      ? "No classes match your search criteria"
                      : "No classes found"
                  }
                />
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 mt-6 grid-cols-1 md:grid-cols-2">
            <Link href="/admin/classes/sections">
              <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Section Management</CardTitle>
                  <CardDescription>
                    Add or modify class sections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Create and manage sections for each class, assign teachers, and organize students.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/classes/rooms">
              <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Classroom Management</CardTitle>
                  <CardDescription>
                    Manage physical classrooms and labs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Organize classrooms, labs, and other teaching spaces with capacity information.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

