"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ChevronLeft, Edit, Trash2, PlusCircle, 
  GraduationCap, Award
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Mock data - replace with actual API calls
const gradesData = [
  {
    id: "1",
    grade: "A+",
    minMarks: 95,
    maxMarks: 100,
    gpa: 4.0,
    description: "Outstanding performance"
  },
  {
    id: "2",
    grade: "A",
    minMarks: 90,
    maxMarks: 94.99,
    gpa: 4.0,
    description: "Excellent performance"
  },
  {
    id: "3",
    grade: "A-",
    minMarks: 85,
    maxMarks: 89.99,
    gpa: 3.7,
    description: "Very good performance"
  },
  {
    id: "4",
    grade: "B+",
    minMarks: 80,
    maxMarks: 84.99,
    gpa: 3.3,
    description: "Good performance"
  },
  {
    id: "5",
    grade: "B",
    minMarks: 75,
    maxMarks: 79.99,
    gpa: 3.0,
    description: "Above average performance"
  },
  {
    id: "6",
    grade: "B-",
    minMarks: 70,
    maxMarks: 74.99,
    gpa: 2.7,
    description: "Average performance"
  },
  {
    id: "7",
    grade: "C+",
    minMarks: 65,
    maxMarks: 69.99,
    gpa: 2.3,
    description: "Below average performance"
  },
  {
    id: "8",
    grade: "C",
    minMarks: 60,
    maxMarks: 64.99,
    gpa: 2.0,
    description: "Satisfactory performance"
  },
  {
    id: "9",
    grade: "C-",
    minMarks: 55,
    maxMarks: 59.99,
    gpa: 1.7,
    description: "Pass"
  },
  {
    id: "10",
    grade: "D",
    minMarks: 50,
    maxMarks: 54.99,
    gpa: 1.0,
    description: "Minimal pass"
  },
  {
    id: "11",
    grade: "F",
    minMarks: 0,
    maxMarks: 49.99,
    gpa: 0.0,
    description: "Fail"
  }
];

const formSchema = z.object({
  grade: z.string().min(1, "Grade must not be empty"),
  minMarks: z.coerce.number().min(0, "Minimum marks must be at least 0").max(100, "Minimum marks must be at most 100"),
  maxMarks: z.coerce.number().min(0, "Maximum marks must be at least 0").max(100, "Maximum marks must be at most 100"),
  gpa: z.coerce.number().min(0, "GPA must be at least 0").max(4, "GPA must be at most 4"),
  description: z.string().optional(),
}).refine((data) => data.minMarks < data.maxMarks, {
  message: "Minimum marks must be less than maximum marks",
  path: ["minMarks"],
});

export default function GradesPage() {
  const [grades, setGrades] = useState(gradesData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      grade: "",
      minMarks: 0,
      maxMarks: 0,
      gpa: 0,
      description: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    
    if (selectedGradeId) {
      // Update existing grade
      setGrades(grades.map(grade => 
        grade.id === selectedGradeId 
          ? { 
              ...grade, 
              grade: values.grade,
              minMarks: values.minMarks, 
              maxMarks: values.maxMarks,
              gpa: values.gpa,
              description: values.description || "" 
            } 
          : grade
      ));
    } else {
      // Create new grade
      const newGrade = {
        id: (grades.length + 1).toString(),
        grade: values.grade,
        minMarks: values.minMarks,
        maxMarks: values.maxMarks,
        gpa: values.gpa,
        description: values.description || ""
      };
      
      setGrades([...grades, newGrade]);
    }
    
    setDialogOpen(false);
    form.reset();
    setSelectedGradeId(null);
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

  function confirmDelete() {
    if (selectedGradeId) {
      setGrades(grades.filter(grade => grade.id !== selectedGradeId));
      setDeleteDialogOpen(false);
      setSelectedGradeId(null);
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
          <h1 className="text-2xl font-bold tracking-tight">Grading System</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
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

      <Card>
        <CardHeader>
          <CardTitle>Grade Scale Configuration</CardTitle>
          <CardDescription>Define the grading system for student assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Grade</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Minimum Marks (%)</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Maximum Marks (%)</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">GPA</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Description</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((grade) => (
                    <tr key={grade.id} className="border-b">
                      <td className="py-3 px-4 align-middle font-medium">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-full 
                            ${grade.grade.startsWith('A') ? 'bg-green-100 text-green-700' : 
                            grade.grade.startsWith('B') ? 'bg-blue-100 text-blue-700' : 
                            grade.grade.startsWith('C') ? 'bg-yellow-100 text-yellow-700' : 
                            grade.grade.startsWith('D') ? 'bg-orange-100 text-orange-700' : 
                            'bg-red-100 text-red-700'}`}>
                            <Award className="h-4 w-4" />
                          </div>
                          {grade.grade}
                        </div>
                      </td>
                      <td className="py-3 px-4 align-middle">{grade.minMarks.toFixed(2)}%</td>
                      <td className="py-3 px-4 align-middle">{grade.maxMarks.toFixed(2)}%</td>
                      <td className="py-3 px-4 align-middle">{grade.gpa.toFixed(1)}</td>
                      <td className="py-3 px-4 align-middle max-w-xs truncate">{grade.description}</td>
                      <td className="py-3 px-4 align-middle text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(grade.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDelete(grade.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
