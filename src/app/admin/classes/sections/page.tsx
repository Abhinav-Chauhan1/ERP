"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ChevronLeft, Edit, Trash2, PlusCircle, 
  Users, Layers, School, MoreVertical,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Mock data - replace with actual API calls
const sectionsData = [
  {
    id: "1",
    name: "Grade 10 Science - Section A",
    capacity: 40,
    students: 35,
    classTeacher: "Emily Johnson",
    room: "Science Block - 101",
    academicYear: "2023-2024"
  },
  {
    id: "2",
    name: "Grade 10 Science - Section B",
    capacity: 40,
    students: 32,
    classTeacher: "Michael Davis",
    room: "Science Block - 102",
    academicYear: "2023-2024"
  },
  {
    id: "3",
    name: "Grade 10 Commerce - Section A",
    capacity: 35,
    students: 30,
    classTeacher: "David Wilson",
    room: "Commerce Block - 201",
    academicYear: "2023-2024"
  },
  {
    id: "4",
    name: "Grade 11 Science - Section A",
    capacity: 30,
    students: 28,
    classTeacher: "Sarah Thompson",
    room: "Science Block - 201",
    academicYear: "2023-2024"
  },
  {
    id: "5",
    name: "Grade 11 Arts - Section A",
    capacity: 30,
    students: 25,
    classTeacher: "Robert Brown",
    room: "Arts Block - 301",
    academicYear: "2023-2024"
  },
  {
    id: "6",
    name: "Grade 9 - Section A",
    capacity: 40,
    students: 38,
    classTeacher: "Jennifer Wilson",
    room: "Main Block - 101",
    academicYear: "2023-2024"
  },
  {
    id: "7",
    name: "Grade 9 - Section B",
    capacity: 40,
    students: 36,
    classTeacher: "Thomas Clark",
    room: "Main Block - 102",
    academicYear: "2023-2024"
  },
  {
    id: "8",
    name: "Grade 8 - Section A",
    capacity: 35,
    students: 34,
    classTeacher: "Laura Johnson",
    room: "Junior Block - 201",
    academicYear: "2023-2024"
  },
];

// Classes for the form
const classesData = [
  { id: "c1", name: "Grade 10 Science" },
  { id: "c2", name: "Grade 10 Commerce" },
  { id: "c3", name: "Grade 11 Science" },
  { id: "c4", name: "Grade 11 Arts" },
  { id: "c5", name: "Grade 9" },
  { id: "c6", name: "Grade 8" },
];

// Rooms for the form
const roomsData = [
  { id: "r1", name: "Science Block - 101" },
  { id: "r2", name: "Science Block - 102" },
  { id: "r3", name: "Science Block - 201" },
  { id: "r4", name: "Commerce Block - 201" },
  { id: "r5", name: "Arts Block - 301" },
  { id: "r6", name: "Main Block - 101" },
  { id: "r7", name: "Main Block - 102" },
  { id: "r8", name: "Junior Block - 201" },
];

// Teachers for the form
const teachersData = [
  { id: "t1", name: "Emily Johnson" },
  { id: "t2", name: "Michael Davis" },
  { id: "t3", name: "David Wilson" },
  { id: "t4", name: "Sarah Thompson" },
  { id: "t5", name: "Robert Brown" },
  { id: "t6", name: "Jennifer Wilson" },
  { id: "t7", name: "Thomas Clark" },
  { id: "t8", name: "Laura Johnson" },
];

// Form schema
const sectionFormSchema = z.object({
  className: z.string({
    required_error: "Please select a class",
  }),
  sectionName: z.string().min(1, "Section name is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1").max(100, "Capacity should not exceed 100"),
  classTeacherId: z.string({
    required_error: "Please select a class teacher",
  }),
  roomId: z.string({
    required_error: "Please select a room",
  }),
});

export default function SectionsPage() {
  const [sections, setSections] = useState(sectionsData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<z.infer<typeof sectionFormSchema>>({
    resolver: zodResolver(sectionFormSchema),
    defaultValues: {
      capacity: 40,
    },
  });

  // Filter sections based on search term
  const filteredSections = sections.filter(section => 
    section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.classTeacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.room.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function onSubmit(values: z.infer<typeof sectionFormSchema>) {
    console.log("Form submitted:", values);
    
    const selectedClass = classesData.find(c => c.id === values.className);
    const selectedTeacher = teachersData.find(t => t.id === values.classTeacherId);
    const selectedRoom = roomsData.find(r => r.id === values.roomId);
    
    if (selectedClass && selectedTeacher && selectedRoom) {
      const sectionData = {
        id: selectedSectionId || String(sections.length + 1),
        name: `${selectedClass.name} - Section ${values.sectionName}`,
        capacity: values.capacity,
        students: selectedSectionId ? sections.find(s => s.id === selectedSectionId)?.students || 0 : 0,
        classTeacher: selectedTeacher.name,
        room: selectedRoom.name,
        academicYear: "2023-2024"
      };
      
      if (selectedSectionId) {
        // Update existing section
        setSections(sections.map(section => 
          section.id === selectedSectionId ? sectionData : section
        ));
      } else {
        // Add new section
        setSections([...sections, sectionData]);
      }
      
      setDialogOpen(false);
      form.reset();
      setSelectedSectionId(null);
    }
  }

  function handleEditSection(id: string) {
    const sectionToEdit = sections.find(section => section.id === id);
    if (sectionToEdit) {
      // Extract values from section name
      const nameParts = sectionToEdit.name.split(" - ");
      const className = nameParts[0];
      const sectionName = nameParts[1].replace("Section ", "");
      
      // Find matching IDs from the data arrays
      const classId = classesData.find(c => c.name === className)?.id || "";
      const teacherId = teachersData.find(t => t.name === sectionToEdit.classTeacher)?.id || "";
      const roomId = roomsData.find(r => r.name === sectionToEdit.room)?.id || "";
      
      form.reset({
        className: classId,
        sectionName: sectionName,
        capacity: sectionToEdit.capacity,
        classTeacherId: teacherId,
        roomId: roomId,
      });
      
      setSelectedSectionId(id);
      setDialogOpen(true);
    }
  }

  function handleDeleteSection(id: string) {
    setSelectedSectionId(id);
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (selectedSectionId) {
      setSections(sections.filter(section => section.id !== selectedSectionId));
      setDeleteDialogOpen(false);
      setSelectedSectionId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/classes">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Classes
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Section Management</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Section
            </Button>
          </DialogTrigger>
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
                  name="className"
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
                          {classesData.map((class_) => (
                            <SelectItem key={class_.id} value={class_.id}>
                              {class_.name}
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
                  name="sectionName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. A, B, C" {...field} />
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
                      <FormLabel>Capacity</FormLabel>
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
                  name="classTeacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Teacher</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select teacher" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teachersData.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name}
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
                  name="roomId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned Room</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select room" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roomsData.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">{selectedSectionId ? "Save Changes" : "Create Section"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search sections by name, teacher, room..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredSections.map((section) => (
              <Card key={section.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Layers className="h-5 w-5 text-blue-500" />
                      {section.name}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditSection(section.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDeleteSection(section.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription>Academic Year: {section.academicYear}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>Students:</span>
                      </div>
                      <span className="font-medium">{section.students} / {section.capacity}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <School className="h-4 w-4 text-gray-500" />
                        <span>Room:</span>
                      </div>
                      <span className="font-medium">{section.room}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-gray-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        <span>Teacher:</span>
                      </div>
                      <span className="font-medium">{section.classTeacher}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-end">
                    <Link href={`/admin/classes?section=${section.id}`}>
                      <Button variant="outline" size="sm">
                        View Students
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredSections.length === 0 && (
            <div className="text-center py-10">
              <Layers className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">No sections found</h3>
              <p className="text-sm text-gray-500 mb-4">Try adjusting your search terms or create a new section</p>
              <Button onClick={() => setDialogOpen(true)}>
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
