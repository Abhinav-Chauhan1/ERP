"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Calendar, Edit, Trash2, PlusCircle, 
  ChevronLeft, Eye, Calendar as CalendarIcon 
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
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Mock data - replace with actual API calls
const academicYearsData = [
  {
    id: "1",
    name: "2023-2024",
    startDate: new Date("2023-08-15"),
    endDate: new Date("2024-05-31"),
    isCurrent: true,
    terms: 3,
    classes: 32
  },
  {
    id: "2",
    name: "2022-2023",
    startDate: new Date("2022-08-16"),
    endDate: new Date("2023-06-01"),
    isCurrent: false,
    terms: 3,
    classes: 30
  },
  {
    id: "3",
    name: "2024-2025",
    startDate: new Date("2024-08-14"),
    endDate: new Date("2025-05-30"),
    isCurrent: false,
    terms: 0,
    classes: 0
  },
];

const formSchema = z.object({
  name: z.string().min(5, "Academic year name must be at least 5 characters"),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }).refine(date => date > new Date(), {
    message: "End date must be in the future",
  }),
  isCurrent: z.boolean().default(false),
});

export default function AcademicYearsPage() {
  const router = useRouter();
  const [academicYears, setAcademicYears] = useState(academicYearsData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      isCurrent: false,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Handle form submission - create or update academic year
    console.log(values);
    
    // For demonstration purposes, let's just add a new item to the state
    const newAcademicYear = {
      id: (academicYears.length + 1).toString(),
      name: values.name,
      startDate: values.startDate,
      endDate: values.endDate,
      isCurrent: values.isCurrent,
      terms: 0,
      classes: 0
    };
    
    setAcademicYears([...academicYears, newAcademicYear]);
    setDialogOpen(false);
    form.reset();
  }

  function handleEdit(id: string) {
    const yearToEdit = academicYears.find(year => year.id === id);
    if (yearToEdit) {
      form.reset({
        name: yearToEdit.name,
        startDate: yearToEdit.startDate,
        endDate: yearToEdit.endDate,
        isCurrent: yearToEdit.isCurrent,
      });
      setSelectedYearId(id);
      setDialogOpen(true);
    }
  }

  function handleDelete(id: string) {
    setSelectedYearId(id);
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (selectedYearId) {
      setAcademicYears(academicYears.filter(year => year.id !== selectedYearId));
      setDeleteDialogOpen(false);
      setSelectedYearId(null);
    }
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
          <h1 className="text-2xl font-bold tracking-tight">Academic Years</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Academic Year
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedYearId ? "Edit Academic Year" : "Add New Academic Year"}</DialogTitle>
              <DialogDescription>
                {selectedYearId 
                  ? "Update the details of the academic year" 
                  : "Create a new academic year for your institution"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 2023-2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full pl-3 text-left font-normal"
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full pl-3 text-left font-normal"
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date()
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="isCurrent"
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
                          Set as current academic year
                        </FormLabel>
                        <p className="text-sm text-gray-500">
                          This will mark this academic year as the active one.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">
                    {selectedYearId ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Academic Years</CardTitle>
          <CardDescription>Manage your institution's academic years</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Year Name</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Start Date</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">End Date</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Terms</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Classes</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {academicYears.map((year) => (
                    <tr key={year.id} className="border-b">
                      <td className="py-3 px-4 align-middle font-medium">{year.name}</td>
                      <td className="py-3 px-4 align-middle">{format(year.startDate, 'MMM d, yyyy')}</td>
                      <td className="py-3 px-4 align-middle">{format(year.endDate, 'MMM d, yyyy')}</td>
                      <td className="py-3 px-4 align-middle">
                        <span 
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            year.isCurrent ? 'bg-green-100 text-green-800' : 
                            year.startDate > new Date() ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {year.isCurrent ? 'Current' : 
                           year.startDate > new Date() ? 'Planned' : 'Past'}
                        </span>
                      </td>
                      <td className="py-3 px-4 align-middle">{year.terms}</td>
                      <td className="py-3 px-4 align-middle">{year.classes}</td>
                      <td className="py-3 px-4 align-middle text-right">
                        <Link href={`/admin/academic/academic-years/${year.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(year.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-500"
                          onClick={() => handleDelete(year.id)}
                        >
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
            <DialogTitle>Delete Academic Year</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this academic year? This action cannot be undone.
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
