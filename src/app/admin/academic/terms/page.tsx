"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ChevronLeft, Edit, Trash2, PlusCircle, 
  Clock, CalendarIcon, AlertCircle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import toast from "react-hot-toast";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";

// Import schema validation and server actions
import { termSchema, TermFormValues, termUpdateSchema, TermUpdateFormValues } from "@/lib/schemaValidation/termsSchemaValidation";
import { 
  getTerms, 
  getAcademicYearsForDropdown, 
  createTerm, 
  updateTerm, 
  deleteTerm 
} from "@/lib/actions/termsActions";

export default function TermsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAcademicYearId = searchParams.get('academicYearId');
  
  const [terms, setTerms] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<TermFormValues>({
    resolver: zodResolver(termSchema),
    defaultValues: {
      name: "",
      academicYearId: initialAcademicYearId || "",
    },
  });

  useEffect(() => {
    fetchTerms();
    fetchAcademicYears();
  }, []);

  async function fetchTerms() {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getTerms();
      
      if (result.success) {
        setTerms(result.data || []);
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

  async function fetchAcademicYears() {
    try {
      const result = await getAcademicYearsForDropdown();
      
      if (result.success) {
        setAcademicYears(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch academic years");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      console.error(err);
    }
  }

  async function onSubmit(values: TermFormValues) {
    try {
      let result;
      
      if (selectedTermId) {
        // Update existing term
        const updateData: TermUpdateFormValues = { ...values, id: selectedTermId };
        result = await updateTerm(updateData);
      } else {
        // Create new term
        result = await createTerm(values);
      }
      
      if (result.success) {
        toast.success(`Term ${selectedTermId ? "updated" : "created"} successfully`);
        setDialogOpen(false);
        form.reset();
        setSelectedTermId(null);
        fetchTerms();
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  function handleEdit(id: string) {
    const termToEdit = terms.find(term => term.id === id);
    if (termToEdit) {
      form.reset({
        name: termToEdit.name,
        academicYearId: termToEdit.academicYearId,
        startDate: new Date(termToEdit.startDate),
        endDate: new Date(termToEdit.endDate),
      });
      setSelectedTermId(id);
      setDialogOpen(true);
    }
  }

  function handleAddNew() {
    form.reset({ 
      name: "",
      academicYearId: initialAcademicYearId || "",
    });
    setSelectedTermId(null);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    setSelectedTermId(id);
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (selectedTermId) {
      try {
        const result = await deleteTerm(selectedTermId);
        
        if (result.success) {
          toast.success("Term deleted successfully");
          setDeleteDialogOpen(false);
          setSelectedTermId(null);
          fetchTerms();
        } else {
          toast.error(result.error || "Failed to delete term");
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
          <h1 className="text-2xl font-bold tracking-tight">Academic Terms</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
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
                          {academicYears.map(year => (
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

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Academic Terms</CardTitle>
          <CardDescription>Manage your institution's academic terms</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : terms.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium mb-1">No terms found</h3>
              <p className="text-sm mb-4">Create your first academic term to get started</p>
              <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Term
              </Button>
            </div>
          ) : (
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
                        <td className="py-3 px-4 align-middle">
                          {term.academicYear.name}
                          {term.academicYear.isCurrent && (
                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                              Current
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 align-middle">{format(new Date(term.startDate), 'MMM d, yyyy')}</td>
                        <td className="py-3 px-4 align-middle">{format(new Date(term.endDate), 'MMM d, yyyy')}</td>
                        <td className="py-3 px-4 align-middle">
                          {Math.round((new Date(term.endDate).getTime() - new Date(term.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                        </td>
                        <td className="py-3 px-4 align-middle">{term._count?.exams || 0}</td>
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
          )}
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
