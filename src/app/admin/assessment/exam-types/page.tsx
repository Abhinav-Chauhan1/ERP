"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ChevronLeft, PlusCircle, Edit, Trash2, 
  MoreVertical, ClipboardList, BarChart, 
  AlertCircle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

// Import schema validation and server actions
import { examTypeSchema, ExamTypeFormValues, examTypeUpdateSchema, ExamTypeUpdateFormValues } from "@/lib/schemaValidation/examTypesSchemaValidation";
import { 
  getExamTypes, 
  createExamType, 
  updateExamType, 
  deleteExamType,
  getExamStatsByType
} from "@/lib/actions/examTypesActions";
import { getGrades } from "@/lib/actions/gradesActions";

export default function ExamTypesPage() {
  const [examTypes, setExamTypes] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExamType, setEditingExamType] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [examTypeToDelete, setExamTypeToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gradesLoading, setGradesLoading] = useState(true);

  // Initialize form
  const form = useForm<ExamTypeFormValues>({
    resolver: zodResolver(examTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      weight: 0,
      isActive: true,
      canRetest: false,
      includeInGradeCard: true,
    },
  });

  useEffect(() => {
    fetchExamTypes();
    fetchGrades();
  }, []);

  async function fetchExamTypes() {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getExamTypes();
      
      if (result.success) {
        setExamTypes(result.data || []);
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

  async function fetchGrades() {
    setGradesLoading(true);
    
    try {
      const result = await getGrades();
      
      if (result.success) {
        // Sort grades by minMarks in descending order (highest first)
        const sortedGrades = [...(result.data || [])].sort((a, b) => b.minMarks - a.minMarks);
        setGrades(sortedGrades);
      } else {
        toast.error(result.error || "Failed to fetch grades");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred while fetching grades");
    } finally {
      setGradesLoading(false);
    }
  }

  async function onSubmit(values: ExamTypeFormValues) {
    try {
      let result;
      
      if (editingExamType) {
        // Update existing exam type
        const updateData: ExamTypeUpdateFormValues = { ...values, id: editingExamType.id };
        result = await updateExamType(updateData);
      } else {
        // Create new exam type
        result = await createExamType(values);
      }
      
      if (result.success) {
        toast.success(`Exam type ${editingExamType ? "updated" : "created"} successfully`);
        setDialogOpen(false);
        setEditingExamType(null);
        form.reset();
        fetchExamTypes();
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  function handleCreateExamType() {
    form.reset({
      name: "",
      description: "",
      weight: 0,
      isActive: true,
      canRetest: false,
      includeInGradeCard: true,
    });
    setEditingExamType(null);
    setDialogOpen(true);
  }

  function handleEditExamType(examType: any) {
    form.reset({
      name: examType.name,
      description: examType.description || "",
      weight: examType.weight,
      isActive: examType.isActive,
      canRetest: examType.canRetest,
      includeInGradeCard: examType.includeInGradeCard,
    });
    setEditingExamType(examType);
    setDialogOpen(true);
  }

  function handleDeleteExamType(examTypeId: string) {
    setExamTypeToDelete(examTypeId);
    setDeleteDialogOpen(true);
  }

  async function confirmDeleteExamType() {
    if (!examTypeToDelete) return;
    
    try {
      const result = await deleteExamType(examTypeToDelete);
      
      if (result.success) {
        toast.success("Exam type deleted successfully");
        setDeleteDialogOpen(false);
        setExamTypeToDelete(null);
        fetchExamTypes();
      } else {
        toast.error(result.error || "Failed to delete exam type");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  // Function to get grade color class
  const getGradeColorClass = (grade: string) => {
    const firstChar = grade.charAt(0).toUpperCase();
    
    switch(firstChar) {
      case 'A': return { bg: 'bg-green-50', text: 'text-green-600' };
      case 'B': return { bg: 'bg-blue-50', text: 'text-blue-600' };
      case 'C': return { bg: 'bg-yellow-50', text: 'text-yellow-600' };
      case 'D': return { bg: 'bg-orange-50', text: 'text-orange-600' };
      default: return { bg: 'bg-red-50', text: 'text-red-600' };
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
          <h1 className="text-2xl font-bold tracking-tight">Exam Types</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateExamType}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Exam Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingExamType ? "Edit Exam Type" : "Create Exam Type"}</DialogTitle>
              <DialogDescription>
                {editingExamType 
                  ? "Update the details of an existing exam type" 
                  : "Add a new type of examination to the system"
                }
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Mid-Term, Final, Quiz" {...field} />
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
                          placeholder="Brief description of this exam type" 
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
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (% of total grade)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          {...field} 
                          value={field.value ?? ""}
                          onChange={e => {
                            const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Whether this exam type is currently in use
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="canRetest"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Allow Retests</FormLabel>
                        <FormDescription>
                          Students can retake this exam type if they fail
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="includeInGradeCard"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Include in Report Card</FormLabel>
                        <FormDescription>
                          Results will appear on student report cards
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit">
                    {editingExamType ? "Save Changes" : "Create Exam Type"}
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

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {examTypes.length === 0 ? (
            <div className="col-span-3 text-center py-12 text-gray-500">
              <ClipboardList className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium mb-1">No exam types found</h3>
              <p className="text-sm mb-4">Create your first exam type to get started</p>
              <Button onClick={handleCreateExamType}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Exam Type
              </Button>
            </div>
          ) : (
            examTypes.map((examType) => (
              <Card key={examType.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{examType.name}</CardTitle>
                        {examType.isActive ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700">Inactive</Badge>
                        )}
                      </div>
                      <CardDescription className="mt-1">{examType.description}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditExamType(examType)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <BarChart className="h-4 w-4 mr-2" />
                          View Stats
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDeleteExamType(examType.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Weight</p>
                        <p className="text-lg font-semibold">{examType.weight}%</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Exams</p>
                        <p className="text-lg font-semibold">{examType.examsCount}</p>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-2">Features</p>
                      <div className="flex flex-wrap gap-2">
                        {examType.canRetest && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            Retests Allowed
                          </Badge>
                        )}
                        {examType.includeInGradeCard && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700">
                            In Report Card
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-2">Grade Thresholds</p>
                      <div className="grid grid-cols-5 gap-1 text-center">
                        {examType.gradeThresholds?.map((threshold: any) => (
                          <div 
                            key={threshold.grade} 
                            className="border rounded p-1 text-xs"
                            style={{
                              backgroundColor: 
                                threshold.grade === 'A' ? '#ecfdf5' : 
                                threshold.grade === 'B' ? '#e0f2fe' : 
                                threshold.grade === 'C' ? '#fef9c3' : 
                                threshold.grade === 'D' ? '#ffedd5' : 
                                '#fee2e2'
                            }}
                          >
                            <div className="font-medium mb-1">{threshold.grade}</div>
                            <div className="text-gray-600">{threshold.minScore}%+</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Exam Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this exam type? This action cannot be undone. Exams of this type will not be deleted but will need to be reclassified.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-700 mt-2">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">This may affect existing exams, results, and report cards.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteExamType}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">Grading System</CardTitle>
          <CardDescription>Configure grade scales and passing criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg mb-4">
            <div className="flex items-start gap-3">
              <ClipboardList className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-sm">Universal Grading Scale</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Configure the system-wide grading scale that applies to all exam types by default.
                  Individual exam types can override these settings as needed.
                </p>
              </div>
            </div>
            <Link href="/admin/academic/grades">
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </Link>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h3 className="font-medium">Default Grade Thresholds</h3>
            </div>
            <div className="p-4">
              {gradesLoading ? (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : grades.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No grade thresholds defined yet.</p>
                  <Link href="/admin/academic/grades">
                    <Button variant="outline" size="sm" className="mt-2">
                      <PlusCircle className="mr-2 h-3 w-3" /> Add Grades
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {grades.map((grade) => {
                    const colors = getGradeColorClass(grade.grade);
                    return (
                      <div key={grade.id} className={`border rounded-lg p-3 ${colors.bg}`}>
                        <p className="text-center font-medium">{grade.grade}</p>
                        <p className="text-center text-xs text-gray-600">
                          {grade.minMarks.toFixed(1)}% - {grade.maxMarks.toFixed(1)}%
                        </p>
                        <p className={`text-center text-xs font-medium ${colors.text} mt-1`}>
                          {grade.description || (grade.grade === "F" ? "Fail" : 
                            grade.grade === "D" ? "Satisfactory" :
                            grade.grade === "C" ? "Good" :
                            grade.grade === "B" ? "Very Good" : "Excellent")}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex justify-end mt-4">
                <Link href="/admin/academic/grades">
                  <Button variant="outline" size="sm">Edit Thresholds</Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component for FormDescription
function FormDescription({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.8rem] text-muted-foreground">
      {children}
    </p>
  );
}
