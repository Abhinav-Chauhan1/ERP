"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ChevronLeft, Edit, Trash2, PlusCircle, 
  Clock, CalendarIcon 
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Mock data - replace with actual API calls
const termsData = [
  {
    id: "1",
    name: "Term 1 2023-2024",
    academicYear: { id: "1", name: "2023-2024" },
    startDate: new Date("2023-08-15"),
    endDate: new Date("2023-12-15"),
    exams: 3,
    classes: 32
  },
  {
    id: "2",
    name: "Term 2 2023-2024",
    academicYear: { id: "1", name: "2023-2024" },
    startDate: new Date("2023-12-16"),
    endDate: new Date("2024-03-31"),
    exams: 2,
    classes: 32
  },
  {
    id: "3",
    name: "Term 3 2023-2024",
    academicYear: { id: "1", name: "2023-2024" },
    startDate: new Date("2024-04-01"),
    endDate: new Date("2024-05-31"),
    exams: 3,
    classes: 32
  },
  {
    id: "4",
    name: "Term 1 2022-2023",
    academicYear: { id: "2", name: "2022-2023" },
    startDate: new Date("2022-08-16"),
    endDate: new Date("2022-12-16"),
    exams: 3,
    classes: 30
  },
];

const academicYearsData = [
  { id: "1", name: "2023-2024" },
  { id: "2", name: "2022-2023" },
  { id: "3", name: "2024-2025" },
];

const formSchema = z.object({
  name: z.string().min(5, "Term name must be at least 5 characters"),
  academicYearId: z.string({
    required_error: "Please select an academic year",
  }),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }).refine(date => date > new Date(), {
    message: "End date must be in the future",
  }),
});

export default function TermsPage() {
  const [terms, setTerms] = useState(termsData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Handle form submission - create or update term
    console.log(values);
    
    const academicYear = academicYearsData.find(y => y.id === values.academicYearId);
    
    // For demonstration purposes, let's just add a new item to the state
    const newTerm = {
      id: (terms.length + 1).toString(),
      name: values.name,
      academicYear: academicYear || { id: "1", name: "Unknown" },
      startDate: values.startDate,
      endDate: values.endDate,
      exams: 0,
      classes: 0
    };
    
    setTerms([...terms, newTerm]);
    setDialogOpen(false);
    form.reset();
  }

  function handleEdit(id: string) {
    const termToEdit = terms.find(term => term.id === id);
    if (termToEdit) {
      form.reset({
        name: termToEdit.name,
        academicYearId: termToEdit.academicYear.id,
        startDate: termToEdit.startDate,
        endDate: termToEdit.endDate,
      });
      setSelectedTermId(id);
      setDialogOpen(true);
    }
  }

  function handleDelete(id: string) {
    setSelectedTermId(id);
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (selectedTermId) {
      setTerms(terms.filter(term => term.id !== selectedTermId));
      setDeleteDialogOpen(false);
      setSelectedTermId(null);
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
          <h1 className="text-2xl font-bold tracking-tight">Academic Terms</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Term
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedTermId ? "Edit Term" : "Add New Term"}</DialogTitle>
              <DialogDescription>
                {selectedTermId 
                  ? "Update the details of the academic term" 
                  : "Create a new academic term for your institution"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Term Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Term 1 2023-2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="academicYearId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an academic year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {academicYearsData.map(year => (
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
                            <Calendar
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
                            <Calendar
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
                <DialogFooter>
                  <Button type="submit">
                    {selectedTermId ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Academic Terms</CardTitle>
          <CardDescription>Manage your institution's academic terms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Term Name</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Academic Year</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Start Date</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">End Date</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Duration</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Exams</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {terms.map((term) => (
                    <tr key={term.id} className="border-b">
                      <td className="py-3 px-4 align-middle font-medium">{term.name}</td>
                      <td className="py-3 px-4 align-middle">{term.academicYear.name}</td>
                      <td className="py-3 px-4 align-middle">{format(term.startDate, 'MMM d, yyyy')}</td>
                      <td className="py-3 px-4 align-middle">{format(term.endDate, 'MMM d, yyyy')}</td>
                      <td className="py-3 px-4 align-middle">
                        {Math.round((term.endDate.getTime() - term.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                      </td>
                      <td className="py-3 px-4 align-middle">{term.exams}</td>
                      <td className="py-3 px-4 align-middle text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(term.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-500"
                          onClick={() => handleDelete(term.id)}
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
            <DialogTitle>Delete Term</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this term? This action cannot be undone.
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
