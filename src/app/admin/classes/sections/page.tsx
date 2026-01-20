"use client";


import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Edit, Trash2, PlusCircle,
  Users, Layers, School, MoreVertical,
  Search, Loader2, AlertCircle, Building
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

// Import schema validation and server actions
import { sectionSchema, SectionFormValues } from "@/lib/schemaValidation/sectionsSchemaValidation";
import {
  getSections,
  getClassesForDropdown,
  getTeachersForDropdown,
  getClassRoomsForDropdown,
  createSection,
  updateSection,
  deleteSection
} from "@/lib/actions/sectionsActions";

export default function SectionsPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      name: "",
      capacity: 40,
      classId: "",
      teacherId: undefined,
      roomId: undefined,
      isClassHead: false
    },
  });

  useEffect(() => {
    fetchSections();
    fetchClasses();
    fetchTeachers();
    fetchClassrooms();
  }, []);

  async function fetchSections() {
    setLoading(true);
    setError(null);

    try {
      const result = await getSections();

      if (result.success) {
        setSections(result.data || []);
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

  async function fetchClasses() {
    try {
      const result = await getClassesForDropdown();

      if (result.success) {
        setClasses(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch classes");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      console.error(err);
    }
  }

  async function fetchTeachers() {
    try {
      const result = await getTeachersForDropdown();

      if (result.success) {
        setTeachers(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch teachers");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      console.error(err);
    }
  }

  async function fetchClassrooms() {
    try {
      const result = await getClassRoomsForDropdown();

      if (result.success) {
        setClassrooms(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch classrooms");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      console.error(err);
    }
  }

  async function onSubmit(values: SectionFormValues) {
    try {
      // Convert "none" to undefined/null for the teacherId
      if (values.teacherId === "none") {
        values.teacherId = undefined;
      }

      let result;

      if (selectedSectionId) {
        // Update existing section
        result = await updateSection({ ...values, id: selectedSectionId });
      } else {
        // Create new section
        result = await createSection(values);
      }

      if (result.success) {
        toast.success(`Section ${selectedSectionId ? "updated" : "created"} successfully`);
        setDialogOpen(false);
        form.reset();
        setSelectedSectionId(null);
        setSelectedSection(null);
        fetchSections();
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  function handleEditSection(section: any) {
    setSelectedSection(section);
    setSelectedSectionId(section.id);

    form.reset({
      name: section.name,
      capacity: section.capacity || 40,
      classId: section.classId,
      teacherId: section.teacherId,
      isClassHead: true, // If teacher is assigned, they're the class head
    });

    setDialogOpen(true);
  }

  function handleAddSection() {
    form.reset({
      name: "",
      capacity: 40,
      classId: "",
      teacherId: undefined,
      roomId: undefined,
      isClassHead: false
    });
    setSelectedSectionId(null);
    setSelectedSection(null);
    setDialogOpen(true);
  }

  function handleDeleteSection(section: any) {
    setSelectedSection(section);
    setSelectedSectionId(section.id);
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (selectedSectionId) {
      try {
        const result = await deleteSection(selectedSectionId);

        if (result.success) {
          toast.success("Section deleted successfully");
          setDeleteDialogOpen(false);
          setSelectedSectionId(null);
          setSelectedSection(null);
          fetchSections();
        } else {
          toast.error(result.error || "Failed to delete section");
        }
      } catch (err) {
        console.error(err);
        toast.error("An unexpected error occurred");
      }
    }
  }

  // Filter sections based on search term and class filter
  const filteredSections = sections.filter(section => {
    const matchesSearch =
      section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.room.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = classFilter === "all" || section.classId === classFilter;

    return matchesSearch && matchesClass;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/admin/classes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Classes
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Section Management</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={handleAddSection} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Create Section
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedSectionId ? "Edit Section" : "Create New Section"}</DialogTitle>
              <DialogDescription>
                {selectedSectionId
                  ? "Update the details of the existing section."
                  : "Define a new section for a class."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name} ({cls.academicYear.name})
                              {cls.academicYear.isCurrent && " - Current"}
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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. A, B, C, Science" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={100}
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
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Teacher (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select teacher" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name} ({teacher.employeeId})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch("teacherId") && (
                  <FormField
                    control={form.control}
                    name="isClassHead"
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
                            Assign as class head teacher
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            This teacher will be responsible for the class.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                )}
                <DialogFooter>
                  <Button type="submit">{selectedSectionId ? "Save Changes" : "Create Section"}</Button>
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

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4 items-end">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search sections by name, teacher, room..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64">
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.academicYear.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredSections.map((section) => (
                <Card key={section.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Layers className="h-5 w-5 text-primary" />
                          {section.name}
                        </CardTitle>
                        <CardDescription>
                          {section.className} | {section.academicYear}
                          {section.isCurrent && <span className="text-green-600"> (Current)</span>}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditSection(section)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteSection(section)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>Students:</span>
                        </div>
                        <span className="font-medium">{section.students} / {section.capacity || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span>Room:</span>
                        </div>
                        <span className="font-medium">{section.room}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <School className="h-4 w-4 text-muted-foreground" />
                          <span>Teacher:</span>
                        </div>
                        <span className="font-medium">{section.teacherName}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t flex justify-end">
                      <Link href={`/admin/classes/${section.classId}?section=${section.id}`}>
                        <Button variant="outline" size="sm">
                          View Students
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && filteredSections.length === 0 && (
            <div className="text-center py-10">
              <Layers className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">No sections found</h3>
              <p className="text-sm text-muted-foreground mb-4">Try adjusting your search terms or create a new section</p>
              <Button onClick={handleAddSection}>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Section
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Section</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this section? This action cannot be undone and may affect students currently assigned to this section.
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

