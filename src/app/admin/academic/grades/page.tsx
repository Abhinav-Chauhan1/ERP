"use client";


import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Edit, Trash2, PlusCircle,
  GraduationCap, Award, AlertCircle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GradesTable } from "@/components/admin/grades-table";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

// Import schema validation and server actions
import { gradeSchema, GradeFormValues, gradeUpdateSchema, GradeUpdateFormValues } from "@/lib/schemaValidation/gradesSchemaValidation";
import { getGrades, createGrade, updateGrade, deleteGrade, autoGenerateGrades } from "@/lib/actions/gradesActions";

export default function GradesPage() {
  const [grades, setGrades] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<GradeFormValues>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      grade: "",
      minMarks: 0,
      maxMarks: 0,
      gpa: 0,
      description: "",
    },
  });

  useEffect(() => {
    fetchGrades();
  }, []);

  async function fetchGrades() {
    setLoading(true);
    setError(null);

    try {
      const result = await getGrades();

      if (result.success) {
        setGrades(result.data || []);
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

  async function onSubmit(values: GradeFormValues) {
    try {
      let result;

      if (selectedGradeId) {
        // Update existing grade
        const updateData: GradeUpdateFormValues = { ...values, id: selectedGradeId };
        result = await updateGrade(updateData);
      } else {
        // Create new grade
        result = await createGrade(values);
      }

      if (result.success) {
        toast.success(`Grade ${selectedGradeId ? "updated" : "created"} successfully`);
        setDialogOpen(false);
        form.reset();
        setSelectedGradeId(null);
        fetchGrades();
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  function handleEdit(id: string) {
    const gradeToEdit = grades.find(grade => grade.id === id);
    if (gradeToEdit) {
      form.reset({
        grade: gradeToEdit.grade,
        minMarks: gradeToEdit.minMarks,
        maxMarks: gradeToEdit.maxMarks,
        gpa: gradeToEdit.gpa,
        description: gradeToEdit.description,
      });
      setSelectedGradeId(id);
      setDialogOpen(true);
    }
  }

  function handleDelete(id: string) {
    setSelectedGradeId(id);
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (selectedGradeId) {
      try {
        const result = await deleteGrade(selectedGradeId);

        if (result.success) {
          toast.success("Grade deleted successfully");
          setDeleteDialogOpen(false);
          setSelectedGradeId(null);
          fetchGrades();
        } else {
          toast.error(result.error || "Failed to delete grade");
        }
      } catch (err) {
        console.error(err);
        toast.error("An unexpected error occurred");
      }
    }
  }

  function handleAddNew() {
    form.reset({
      grade: "",
      minMarks: 0,
      maxMarks: 0,
      gpa: 0,
      description: ""
    });
    setSelectedGradeId(null);
    setDialogOpen(true);
  }

  async function handleAutoGenerate() {
    if (grades.length > 0) {
      const confirm = window.confirm(
        "This will add a standard grading scale. Existing grades will not be affected. Continue?"
      );
      if (!confirm) return;
    }

    setAutoGenerating(true);
    try {
      const result = await autoGenerateGrades();
      if (result.success) {
        toast.success(`Auto-generated ${result.count} grades successfully`);
        fetchGrades();
      } else {
        toast.error(result.error || "Failed to auto-generate grades");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setAutoGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/admin/academic">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Grading System</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleAutoGenerate}
            disabled={autoGenerating}
            className="w-full sm:w-auto"
          >
            {autoGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Award className="mr-2 h-4 w-4" />
            )}
            Auto Generate
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Grade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedGradeId ? "Edit Grade" : "Add New Grade"}</DialogTitle>
                <DialogDescription>
                  {selectedGradeId
                    ? "Update the details of the grade scale"
                    : "Create a new grade scale for your institution"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. A+" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="minMarks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Marks (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maxMarks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Marks (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="gpa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GPA Value</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
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
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe what this grade represents"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">
                      {selectedGradeId ? "Update" : "Create"}
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
      )
      }

      <Card>
        <CardHeader>
          <CardTitle>Grade Scale Configuration</CardTitle>
          <CardDescription>Define the grading system for student assessment</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : grades.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium mb-1">No grades found</h3>
              <p className="text-sm mb-4">Create your first grade to get started</p>
              <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Grade
              </Button>
            </div>
          ) : (
            <GradesTable
              grades={grades}
              onEdit={handleEdit}
              onDelete={handleDelete}
              emptyMessage="No grades found"
            />
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Grade</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this grade? This action cannot be undone.
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

