"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ChevronLeft, Edit, Trash2, PlusCircle, 
  Building2, BookOpen, GraduationCap
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
const departmentsData = [
  {
    id: "1",
    name: "Mathematics",
    description: "Department of Mathematics and Statistics",
    subjects: 8,
    teachers: 5,
    createdAt: new Date("2022-06-15")
  },
  {
    id: "2",
    name: "Science",
    description: "Department of Natural Sciences",
    subjects: 12,
    teachers: 7,
    createdAt: new Date("2022-06-15")
  },
  {
    id: "3",
    name: "Languages",
    description: "Department of Languages and Literature",
    subjects: 9,
    teachers: 6,
    createdAt: new Date("2022-06-15")
  },
  {
    id: "4",
    name: "Social Studies",
    description: "Department of History and Social Sciences",
    subjects: 7,
    teachers: 4,
    createdAt: new Date("2022-06-15")
  },
  {
    id: "5",
    name: "Physical Education",
    description: "Department of Physical Education and Sports",
    subjects: 3,
    teachers: 3,
    createdAt: new Date("2022-06-15")
  },
  {
    id: "6",
    name: "Arts",
    description: "Department of Visual and Performing Arts",
    subjects: 5,
    teachers: 4,
    createdAt: new Date("2022-06-15")
  },
  {
    id: "7",
    name: "Technology",
    description: "Department of Computer Science and Information Technology",
    subjects: 6,
    teachers: 3,
    createdAt: new Date("2022-06-15")
  },
  {
    id: "8",
    name: "Vocational Studies",
    description: "Department of Vocational and Career Education",
    subjects: 4,
    teachers: 2,
    createdAt: new Date("2022-06-15")
  }
];

const formSchema = z.object({
  name: z.string().min(3, "Department name must be at least 3 characters"),
  description: z.string().optional(),
});

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState(departmentsData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Handle form submission - create or update department
    console.log(values);
    
    if (selectedDepartmentId) {
      // Update existing department
      setDepartments(departments.map(dept => 
        dept.id === selectedDepartmentId 
          ? { ...dept, name: values.name, description: values.description || "" } 
          : dept
      ));
    } else {
      // Create new department
      const newDepartment = {
        id: (departments.length + 1).toString(),
        name: values.name,
        description: values.description || "",
        subjects: 0,
        teachers: 0,
        createdAt: new Date()
      };
      
      setDepartments([...departments, newDepartment]);
    }
    
    setDialogOpen(false);
    form.reset();
    setSelectedDepartmentId(null);
  }

  function handleEdit(id: string) {
    const departmentToEdit = departments.find(dept => dept.id === id);
    if (departmentToEdit) {
      form.reset({
        name: departmentToEdit.name,
        description: departmentToEdit.description,
      });
      setSelectedDepartmentId(id);
      setDialogOpen(true);
    }
  }

  function handleDelete(id: string) {
    setSelectedDepartmentId(id);
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (selectedDepartmentId) {
      setDepartments(departments.filter(dept => dept.id !== selectedDepartmentId));
      setDeleteDialogOpen(false);
      setSelectedDepartmentId(null);
    }
  }

  function handleAddNew() {
    form.reset({ name: "", description: "" });
    setSelectedDepartmentId(null);
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
          <h1 className="text-2xl font-bold tracking-tight">Academic Departments</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedDepartmentId ? "Edit Department" : "Add New Department"}</DialogTitle>
              <DialogDescription>
                {selectedDepartmentId 
                  ? "Update the details of the academic department" 
                  : "Create a new academic department for your institution"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Mathematics" {...field} />
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
                          placeholder="Describe the department's focus and responsibilities" 
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
                    {selectedDepartmentId ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((department) => (
          <Card key={department.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 rounded-md text-blue-700">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{department.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(department.id)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDelete(department.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>{department.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-50 rounded-md text-green-700">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Subjects</p>
                    <p className="text-sm font-medium">{department.subjects}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-50 rounded-md text-purple-700">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Teachers</p>
                    <p className="text-sm font-medium">{department.teachers}</p>
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
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this department? This action cannot be undone.
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
