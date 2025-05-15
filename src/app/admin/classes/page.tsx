"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, Filter, Edit, Eye } from "lucide-react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const classesByGrade = [
  { grade: "Grade 1", classes: 4, students: 120, sections: ["A", "B", "C", "D"] },
  { grade: "Grade 2", classes: 3, students: 105, sections: ["A", "B", "C"] },
  { grade: "Grade 3", classes: 4, students: 132, sections: ["A", "B", "C", "D"] },
  { grade: "Grade 4", classes: 3, students: 115, sections: ["A", "B", "C"] },
  { grade: "Grade 5", classes: 3, students: 125, sections: ["A", "B", "C"] },
  { grade: "Grade 6", classes: 4, students: 98, sections: ["A", "B", "C", "D"] },
];

const recentClasses = [
  {
    id: "1",
    name: "Grade 10 - Science",
    year: "2023-2024",
    section: "A",
    strength: 35,
    classTeacher: "Emily Johnson",
    room: "Science Block - 101"
  },
  {
    id: "2",
    name: "Grade 10 - Science",
    year: "2023-2024",
    section: "B",
    strength: 32,
    classTeacher: "Michael Davis",
    room: "Science Block - 102"
  },
  {
    id: "3",
    name: "Grade 10 - Commerce",
    year: "2023-2024",
    section: "A",
    strength: 30,
    classTeacher: "David Wilson",
    room: "Commerce Block - 201"
  },
  {
    id: "4",
    name: "Grade 11 - Science",
    year: "2023-2024",
    section: "A",
    strength: 28,
    classTeacher: "Sarah Thompson",
    room: "Science Block - 201"
  },
  {
    id: "5",
    name: "Grade 11 - Arts",
    year: "2023-2024",
    section: "A",
    strength: 25,
    classTeacher: "Robert Brown",
    room: "Arts Block - 301"
  },
];

// Academic years for the form
const academicYears = [
  { id: "1", name: "2023-2024" },
  { id: "2", name: "2022-2023" },
  { id: "3", name: "2024-2025" },
];

// Sample grades for the form
const grades = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

// Schema for class creation/editing
const classFormSchema = z.object({
  name: z.string().min(3, "Class name must be at least 3 characters"),
  academicYearId: z.string({
    required_error: "Please select an academic year",
  }),
  sections: z.number().min(1, "At least one section is required").max(10, "Maximum 10 sections allowed"),
  grade: z.string({
    required_error: "Please select a grade",
  }),
  streamName: z.string().optional(),
});

export default function ClassesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);

  // Initialize form
  const form = useForm<z.infer<typeof classFormSchema>>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: "",
      sections: 1,
      streamName: "",
    },
  });

  function onSubmit(values: z.infer<typeof classFormSchema>) {
    console.log("Form submitted:", values);
    // Here you would normally create/update the class in your database
    
    // Reset form and close dialog
    form.reset();
    setDialogOpen(false);
    setEditingClass(null);
  }

  function handleCreateClass() {
    form.reset({
      name: "",
      sections: 1,
      streamName: "",
    });
    setEditingClass(null);
    setDialogOpen(true);
  }

  function handleEditClass(classId: string) {
    const classToEdit = recentClasses.find(c => c.id === classId);
    if (classToEdit) {
      // Populate form with class data
      form.reset({
        name: classToEdit.name,
        academicYearId: "1", // Assuming current year is 2023-2024
        sections: classToEdit.section === "A" ? 1 : classToEdit.section === "B" ? 2 : 3,
        grade: classToEdit.name.split(" - ")[0],
        streamName: classToEdit.name.includes(" - ") ? classToEdit.name.split(" - ")[1] : "",
      });
      setEditingClass(classToEdit);
      setDialogOpen(true);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Class Management</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateClass}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingClass ? "Edit Class" : "Create New Class"}</DialogTitle>
              <DialogDescription>
                {editingClass 
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
                              {year.name}
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
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {grades.map((grade) => (
                            <SelectItem key={grade} value={grade}>
                              {grade}
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
                  name="streamName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stream (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Science, Commerce, Arts" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sections"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Sections</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          max={10} 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">{editingClass ? "Save Changes" : "Create Class"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {classesByGrade.map((grade) => (
          <Card key={grade.grade} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{grade.grade}</CardTitle>
              <CardDescription>{grade.classes} classes, {grade.students} students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <div className="text-sm text-gray-500 mb-1">Sections:</div>
                <div className="flex flex-wrap gap-1">
                  {grade.sections.map((section) => (
                    <span 
                      key={section}
                      className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                    >
                      {section}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Link href={`/admin/classes?grade=${grade.grade}`}>
                  <Button variant="outline" size="sm">
                    View Classes
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search classes..."
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Class</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Section</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Class Teacher</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Room</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Students</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentClasses.map((cls) => (
                    <tr key={cls.id} className="border-b">
                      <td className="py-3 px-4 align-middle font-medium">
                        {cls.name}
                        <div className="text-xs text-gray-500">{cls.year}</div>
                      </td>
                      <td className="py-3 px-4 align-middle">{cls.section}</td>
                      <td className="py-3 px-4 align-middle">{cls.classTeacher}</td>
                      <td className="py-3 px-4 align-middle">{cls.room}</td>
                      <td className="py-3 px-4 align-middle">{cls.strength}</td>
                      <td className="py-3 px-4 align-middle text-right">
                        <Link href={`/admin/classes/${cls.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditClass(cls.id)}
                        >
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-center mt-4">
            <Button variant="outline" size="sm">Load More</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 mt-6 grid-cols-1 md:grid-cols-2">
        <Link href="/admin/classes/sections">
          <Card className="h-full hover:bg-gray-50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Section Management</CardTitle>
              <CardDescription>
                Add or modify class sections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Create and manage sections for each class, assign teachers, and organize students.
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/admin/classes/rooms">
          <Card className="h-full hover:bg-gray-50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Classroom Management</CardTitle>
              <CardDescription>
                Manage physical classrooms and labs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Organize classrooms, labs, and other teaching spaces with capacity information.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
