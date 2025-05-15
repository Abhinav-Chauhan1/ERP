"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ChevronLeft, PlusCircle, Edit, Trash2, 
  MoreVertical, ClipboardList, BarChart, 
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import * as z from "zod";

// Mock data for exam types
const examTypesData = [
  {
    id: "et1",
    name: "Mid-Term",
    description: "Mid-term assessments conducted in the middle of each term",
    weight: 30,
    isActive: true,
    canRetest: true,
    includeInGradeCard: true,
    gradeThresholds: [
      { grade: "A", minScore: 90 },
      { grade: "B", minScore: 80 },
      { grade: "C", minScore: 70 },
      { grade: "D", minScore: 60 },
      { grade: "F", minScore: 0 }
    ],
    examsCount: 48
  },
  {
    id: "et2",
    name: "Final",
    description: "Final examinations conducted at the end of each term",
    weight: 50,
    isActive: true,
    canRetest: false,
    includeInGradeCard: true,
    gradeThresholds: [
      { grade: "A", minScore: 90 },
      { grade: "B", minScore: 80 },
      { grade: "C", minScore: 70 },
      { grade: "D", minScore: 60 },
      { grade: "F", minScore: 0 }
    ],
    examsCount: 32
  },
  {
    id: "et3",
    name: "Unit Test",
    description: "Short assessments after completing each unit",
    weight: 15,
    isActive: true,
    canRetest: true,
    includeInGradeCard: true,
    gradeThresholds: [
      { grade: "A", minScore: 90 },
      { grade: "B", minScore: 80 },
      { grade: "C", minScore: 70 },
      { grade: "D", minScore: 60 },
      { grade: "F", minScore: 0 }
    ],
    examsCount: 96
  },
  {
    id: "et4",
    name: "Quiz",
    description: "Short surprise quizzes to test knowledge and attention",
    weight: 5,
    isActive: true,
    canRetest: false,
    includeInGradeCard: false,
    gradeThresholds: [
      { grade: "A", minScore: 90 },
      { grade: "B", minScore: 80 },
      { grade: "C", minScore: 70 },
      { grade: "D", minScore: 60 },
      { grade: "F", minScore: 0 }
    ],
    examsCount: 120
  },
  {
    id: "et5",
    name: "Practical",
    description: "Practical assessments for science subjects and other skill-based courses",
    weight: 20,
    isActive: true,
    canRetest: true,
    includeInGradeCard: true,
    gradeThresholds: [
      { grade: "A", minScore: 90 },
      { grade: "B", minScore: 80 },
      { grade: "C", minScore: 70 },
      { grade: "D", minScore: 60 },
      { grade: "F", minScore: 0 }
    ],
    examsCount: 65
  },
  {
    id: "et6",
    name: "Project",
    description: "Long-term projects that demonstrate comprehensive understanding and application",
    weight: 25,
    isActive: true,
    canRetest: false,
    includeInGradeCard: true,
    gradeThresholds: [
      { grade: "A", minScore: 90 },
      { grade: "B", minScore: 80 },
      { grade: "C", minScore: 70 },
      { grade: "D", minScore: 60 },
      { grade: "F", minScore: 0 }
    ],
    examsCount: 28
  }
];

// Exam type form schema
const examTypeFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  weight: z.number().min(0, "Weight cannot be negative").max(100, "Weight cannot exceed 100"),
  isActive: z.boolean().default(true),
  canRetest: z.boolean().default(false),
  includeInGradeCard: z.boolean().default(true),
});

// Grade thresholds form schema (not using in main form for simplicity)
const gradeThresholdsSchema = z.array(
  z.object({
    grade: z.string().min(1),
    minScore: z.number().min(0).max(100),
  })
);

export default function ExamTypesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExamType, setEditingExamType] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [examTypeToDelete, setExamTypeToDelete] = useState<string | null>(null);

  // Initialize form
  const form = useForm<z.infer<typeof examTypeFormSchema>>({
    resolver: zodResolver(examTypeFormSchema),
    defaultValues: {
      name: "",
      description: "",
      weight: 0,
      isActive: true,
      canRetest: false,
      includeInGradeCard: true,
    },
  });

  function onSubmit(values: z.infer<typeof examTypeFormSchema>) {
    console.log("Form submitted:", values);
    // Handle API call to create/update exam type
    setDialogOpen(false);
    setEditingExamType(null);
    form.reset();
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

  function confirmDeleteExamType() {
    console.log("Deleting exam type:", examTypeToDelete);
    // Handle API call to delete exam type
    setDeleteDialogOpen(false);
    setExamTypeToDelete(null);
  }

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
                          onChange={e => field.onChange(parseInt(e.target.value))}
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

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {examTypesData.map((examType) => (
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
                    {examType.gradeThresholds.map((threshold) => (
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
        ))}
      </div>

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
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h3 className="font-medium">Default Grade Thresholds</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="border rounded-lg p-3 bg-green-50">
                  <p className="text-center font-medium">A</p>
                  <p className="text-center text-xs text-gray-600">90% - 100%</p>
                  <p className="text-center text-xs font-medium text-green-600 mt-1">Excellent</p>
                </div>
                <div className="border rounded-lg p-3 bg-blue-50">
                  <p className="text-center font-medium">B</p>
                  <p className="text-center text-xs text-gray-600">80% - 89%</p>
                  <p className="text-center text-xs font-medium text-blue-600 mt-1">Very Good</p>
                </div>
                <div className="border rounded-lg p-3 bg-yellow-50">
                  <p className="text-center font-medium">C</p>
                  <p className="text-center text-xs text-gray-600">70% - 79%</p>
                  <p className="text-center text-xs font-medium text-yellow-600 mt-1">Good</p>
                </div>
                <div className="border rounded-lg p-3 bg-orange-50">
                  <p className="text-center font-medium">D</p>
                  <p className="text-center text-xs text-gray-600">60% - 69%</p>
                  <p className="text-center text-xs font-medium text-orange-600 mt-1">Satisfactory</p>
                </div>
                <div className="border rounded-lg p-3 bg-red-50">
                  <p className="text-center font-medium">F</p>
                  <p className="text-center text-xs text-gray-600">0% - 59%</p>
                  <p className="text-center text-xs font-medium text-red-600 mt-1">Fail</p>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="outline" size="sm">Edit Thresholds</Button>
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
