"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { 
  Calendar, Edit, Trash2, PlusCircle, 
  ChevronLeft, Eye, AlertCircle, ChevronRight 
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
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

import { academicYearSchema, AcademicYearFormValues } from "@/lib/schemaValidation/academicyearsSchemaValidation";
import { getAcademicYears, createAcademicYear, updateAcademicYear, deleteAcademicYear } from "@/lib/actions/academicyearsActions";

export default function AcademicYearsPage() {
  const router = useRouter();
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AcademicYearFormValues>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: {
      name: "",
      isCurrent: false,
    },
  });

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  async function fetchAcademicYears() {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getAcademicYears();
      
      if (result.success) {
        setAcademicYears(result.data || []);
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

  async function onSubmit(values: AcademicYearFormValues) {
    try {
      const result = selectedYearId 
        ? await updateAcademicYear({ ...values, id: selectedYearId })
        : await createAcademicYear(values);
      
      if (result.success) {
        toast.success(`Academic year ${selectedYearId ? "updated" : "created"} successfully`);
        setDialogOpen(false);
        form.reset();
        fetchAcademicYears();
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  function handleEdit(id: string) {
    const yearToEdit = academicYears.find(year => year.id === id);
    if (yearToEdit) {
      form.reset({
        name: yearToEdit.name,
        startDate: new Date(yearToEdit.startDate),
        endDate: new Date(yearToEdit.endDate),
        isCurrent: yearToEdit.isCurrent,
      });
      setSelectedYearId(id);
      setDialogOpen(true);
    }
  }

  function handleCreate() {
    form.reset({
      name: "",
      isCurrent: false,
    });
    setSelectedYearId(null);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    setSelectedYearId(id);
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (selectedYearId) {
      try {
        const result = await deleteAcademicYear(selectedYearId);
        
        if (result.success) {
          toast.success("Academic year deleted successfully");
          setDeleteDialogOpen(false);
          setSelectedYearId(null);
          fetchAcademicYears();
        } else {
          toast.error(result.error || "Failed to delete academic year");
        }
      } catch (err) {
        console.error(err);
        toast.error("An unexpected error occurred");
      }
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
            <Button onClick={handleCreate}>
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
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            onSelect={field.onChange}
                            placeholder="Select start date"
                          />
                        </FormControl>
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
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            onSelect={field.onChange}
                            placeholder="Select end date"
                            disabled={(date) => {
                              const startDate = form.getValues("startDate");
                              return startDate ? date < startDate : false;
                            }}
                          />
                        </FormControl>
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
                        <p className="text-sm text-muted-foreground">
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

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Academic Years</CardTitle>
          <CardDescription>Manage your institution's academic years</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-6">Loading academic years...</div>
          ) : academicYears.length === 0 ? (
            <div className="text-center py-6">
              <p className="mb-4">No academic years found</p>
              <Button onClick={handleCreate}>
                <PlusCircle className="mr-2 h-4 w-4" /> Create First Academic Year
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-accent border-b">
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Year Name</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Start Date</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">End Date</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Terms</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Classes</th>
                      <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {academicYears.map((year) => (
                      <tr key={year.id} className="border-b">
                        <td className="py-3 px-4 align-middle font-medium">{year.name}</td>
                        <td className="py-3 px-4 align-middle">{format(new Date(year.startDate), 'MMM d, yyyy')}</td>
                        <td className="py-3 px-4 align-middle">{format(new Date(year.endDate), 'MMM d, yyyy')}</td>
                        <td className="py-3 px-4 align-middle">
                          <span 
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              year.isCurrent ? 'bg-green-100 text-green-800' : 
                              new Date(year.startDate) > new Date() ? 'bg-primary/10 text-primary' : 
                              'bg-muted text-gray-800'
                            }`}
                          >
                            {year.isCurrent ? 'Current' : 
                             new Date(year.startDate) > new Date() ? 'Planned' : 'Past'}
                          </span>
                        </td>
                        <td className="py-3 px-4 align-middle">{year._count?.terms || 0}</td>
                        <td className="py-3 px-4 align-middle">{year._count?.classes || 0}</td>
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
          )}
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
