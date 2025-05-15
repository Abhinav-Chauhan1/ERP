"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  ChevronLeft, Edit, Trash2, PlusCircle, 
  BookOpen, FileText, Layers, GripVertical,
  ChevronDown, BookText, Upload, Plus
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Mock data - replace with actual API calls
const subjectsData = [
  { id: "1", name: "Mathematics", code: "MATH101" },
  { id: "2", name: "Physics", code: "PHYS101" },
  { id: "3", name: "Chemistry", code: "CHEM101" },
  { id: "4", name: "Biology", code: "BIOL101" },
  { id: "5", name: "English", code: "ENGL101" },
  { id: "6", name: "History", code: "HIST101" },
  { id: "7", name: "Geography", code: "GEOG101" },
  { id: "8", name: "Computer Science", code: "COMP101" },
];

const syllabusData = {
  "1": {
    id: "s1",
    title: "Mathematics Syllabus",
    description: "Complete syllabus for Mathematics covering algebra, geometry, and calculus",
    subjectId: "1",
    document: "https://example.com/documents/math_syllabus.pdf",
    units: [
      {
        id: "u1",
        title: "Algebra",
        description: "Basic algebraic operations and equations",
        order: 1,
        lessons: [
          { id: "l1", title: "Linear Equations", description: "Solving linear equations" },
          { id: "l2", title: "Quadratic Equations", description: "Solving quadratic equations" },
          { id: "l3", title: "Polynomials", description: "Operations with polynomials" }
        ]
      },
      {
        id: "u2",
        title: "Geometry",
        description: "Study of shapes, sizes, and properties of space",
        order: 2,
        lessons: [
          { id: "l4", title: "Triangles", description: "Properties of triangles" },
          { id: "l5", title: "Circles", description: "Properties of circles" },
          { id: "l6", title: "Coordinate Geometry", description: "Coordinates and distances" }
        ]
      },
      {
        id: "u3",
        title: "Calculus",
        description: "Study of continuous change",
        order: 3,
        lessons: [
          { id: "l7", title: "Limits", description: "Introduction to limits" },
          { id: "l8", title: "Derivatives", description: "Finding derivatives" },
          { id: "l9", title: "Integrals", description: "Basic integration techniques" }
        ]
      }
    ]
  },
  "2": {
    id: "s2",
    title: "Physics Syllabus",
    description: "Complete syllabus for Physics covering mechanics, thermodynamics, and electricity",
    subjectId: "2",
    document: "https://example.com/documents/physics_syllabus.pdf",
    units: [
      {
        id: "u4",
        title: "Mechanics",
        description: "Study of motion and forces",
        order: 1,
        lessons: [
          { id: "l10", title: "Newton's Laws", description: "Introduction to Newton's laws of motion" },
          { id: "l11", title: "Work and Energy", description: "Concepts of work and energy" },
          { id: "l12", title: "Circular Motion", description: "Mechanics of circular motion" }
        ]
      },
      {
        id: "u5",
        title: "Thermodynamics",
        description: "Study of heat and temperature",
        order: 2,
        lessons: [
          { id: "l13", title: "Laws of Thermodynamics", description: "Basic thermodynamic laws" },
          { id: "l14", title: "Heat Transfer", description: "Mechanisms of heat transfer" },
          { id: "l15", title: "Thermal Properties", description: "Properties of materials related to heat" }
        ]
      },
      {
        id: "u6",
        title: "Electricity and Magnetism",
        description: "Study of electrical and magnetic phenomena",
        order: 3,
        lessons: [
          { id: "l16", title: "Electric Fields", description: "Concepts of electric fields" },
          { id: "l17", title: "Electric Circuits", description: "Analysis of electric circuits" },
          { id: "l18", title: "Magnetic Fields", description: "Properties of magnetic fields" }
        ]
      }
    ]
  }
};

const syllabusFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  subjectId: z.string({
    required_error: "Please select a subject",
  }),
  document: z.string().optional(),
});

const unitFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  order: z.coerce.number().min(1, "Order must be at least 1"),
});

const lessonFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  unitId: z.string({
    required_error: "Please select a unit",
  }),
});

export default function SyllabusPage() {
  const searchParams = useSearchParams();
  const initialSubjectId = searchParams.get("subject");
  
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId || "");
  const [currentSyllabus, setCurrentSyllabus] = useState<any>(null);
  
  const [syllabusDialogOpen, setSyllabusDialogOpen] = useState(false);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [deleteItemInfo, setDeleteItemInfo] = useState<{id: string, type: string} | null>(null);

  const syllabusForm = useForm<z.infer<typeof syllabusFormSchema>>({
    resolver: zodResolver(syllabusFormSchema),
    defaultValues: {
      title: "",
      description: "",
      subjectId: initialSubjectId || "",
      document: "",
    },
  });

  const unitForm = useForm<z.infer<typeof unitFormSchema>>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: {
      title: "",
      description: "",
      order: 1,
    },
  });

  const lessonForm = useForm<z.infer<typeof lessonFormSchema>>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: {
      title: "",
      description: "",
      unitId: "",
    },
  });

  useEffect(() => {
    if (selectedSubjectId) {
      const syllabus = syllabusData[selectedSubjectId as keyof typeof syllabusData];
      setCurrentSyllabus(syllabus || null);
    } else {
      setCurrentSyllabus(null);
    }
  }, [selectedSubjectId]);

  function onSyllabusSubmit(values: z.infer<typeof syllabusFormSchema>) {
    console.log("Syllabus form values:", values);
    
    // Simulating API call to create/update syllabus
    const newSyllabus = {
      id: currentSyllabus?.id || `s${Object.keys(syllabusData).length + 1}`,
      title: values.title,
      description: values.description || "",
      subjectId: values.subjectId,
      document: values.document || "",
      units: currentSyllabus?.units || []
    };
    
    setCurrentSyllabus(newSyllabus);
    setSelectedSubjectId(values.subjectId);
    setSyllabusDialogOpen(false);
    syllabusForm.reset();
    setEditingItemId(null);
  }

  function onUnitSubmit(values: z.infer<typeof unitFormSchema>) {
    console.log("Unit form values:", values);
    
    if (editingItemId) {
      // Update existing unit
      const updatedUnits = currentSyllabus.units.map((unit: any) => 
        unit.id === editingItemId 
          ? { ...unit, title: values.title, description: values.description || "", order: values.order }
          : unit
      );
      
      setCurrentSyllabus({...currentSyllabus, units: updatedUnits});
    } else {
      // Create new unit
      const newUnit = {
        id: `u${Date.now()}`,
        title: values.title,
        description: values.description || "",
        order: values.order,
        lessons: []
      };
      
      setCurrentSyllabus({
        ...currentSyllabus, 
        units: [...(currentSyllabus?.units || []), newUnit]
      });
    }
    
    setUnitDialogOpen(false);
    unitForm.reset();
    setEditingItemId(null);
  }

  function onLessonSubmit(values: z.infer<typeof lessonFormSchema>) {
    console.log("Lesson form values:", values);
    
    const unitId = values.unitId;
    
    if (editingItemId) {
      // Find which unit contains this lesson
      let updatedUnits = [...currentSyllabus.units];
      
      for (let i = 0; i < updatedUnits.length; i++) {
        const lessonIndex = updatedUnits[i].lessons.findIndex((lesson: any) => lesson.id === editingItemId);
        
        if (lessonIndex >= 0) {
          // If current unit is the target unit, update in place
          if (updatedUnits[i].id === unitId) {
            const updatedLessons = [...updatedUnits[i].lessons];
            updatedLessons[lessonIndex] = {
              ...updatedLessons[lessonIndex],
              title: values.title,
              description: values.description || ""
            };
            updatedUnits[i] = {...updatedUnits[i], lessons: updatedLessons};
          } else {
            // If moving to a different unit, remove from current unit
            const lessonToMove = {...updatedUnits[i].lessons[lessonIndex]};
            lessonToMove.title = values.title;
            lessonToMove.description = values.description || "";
            
            // Remove from current unit
            const currentUnitLessons = updatedUnits[i].lessons.filter((l: any) => l.id !== editingItemId);
            updatedUnits[i] = {...updatedUnits[i], lessons: currentUnitLessons};
            
            // Add to target unit
            const targetUnitIndex = updatedUnits.findIndex((u: any) => u.id === unitId);
            if (targetUnitIndex >= 0) {
              updatedUnits[targetUnitIndex] = {
                ...updatedUnits[targetUnitIndex],
                lessons: [...updatedUnits[targetUnitIndex].lessons, lessonToMove]
              };
            }
          }
          
          break;
        }
      }
      
      setCurrentSyllabus({...currentSyllabus, units: updatedUnits});
    } else {
      // Create new lesson
      const newLesson = {
        id: `l${Date.now()}`,
        title: values.title,
        description: values.description || ""
      };
      
      // Add to the selected unit
      const updatedUnits = currentSyllabus.units.map((unit: any) => 
        unit.id === unitId
          ? { ...unit, lessons: [...unit.lessons, newLesson] }
          : unit
      );
      
      setCurrentSyllabus({...currentSyllabus, units: updatedUnits});
    }
    
    setLessonDialogOpen(false);
    lessonForm.reset();
    setEditingItemId(null);
  }

  function handleEditSyllabus() {
    if (currentSyllabus) {
      syllabusForm.reset({
        title: currentSyllabus.title,
        description: currentSyllabus.description,
        subjectId: currentSyllabus.subjectId,
        document: currentSyllabus.document,
      });
      setEditingItemId(currentSyllabus.id);
      setSyllabusDialogOpen(true);
    }
  }

  function handleEditUnit(unitId: string) {
    const unitToEdit = currentSyllabus?.units.find((unit: any) => unit.id === unitId);
    if (unitToEdit) {
      unitForm.reset({
        title: unitToEdit.title,
        description: unitToEdit.description,
        order: unitToEdit.order,
      });
      setEditingItemId(unitId);
      setUnitDialogOpen(true);
    }
  }

  function handleEditLesson(lessonId: string, unitId: string) {
    // Find the lesson in the specified unit
    const unitIndex = currentSyllabus?.units.findIndex((unit: any) => unit.id === unitId);
    if (unitIndex >= 0) {
      const lessonToEdit = currentSyllabus.units[unitIndex].lessons.find(
        (lesson: any) => lesson.id === lessonId
      );
      
      if (lessonToEdit) {
        lessonForm.reset({
          title: lessonToEdit.title,
          description: lessonToEdit.description,
          unitId: unitId,
        });
        setEditingItemId(lessonId);
        setLessonDialogOpen(true);
      }
    }
  }

  function handleAddLesson(unitId: string) {
    lessonForm.reset({
      title: "",
      description: "",
      unitId: unitId,
    });
    setEditingItemId(null);
    setLessonDialogOpen(true);
  }

  function handleDeleteItem(id: string, type: string) {
    setDeleteItemInfo({ id, type });
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (!deleteItemInfo) return;
    
    const { id, type } = deleteItemInfo;
    
    if (type === 'syllabus') {
      setCurrentSyllabus(null);
    } else if (type === 'unit') {
      // Remove the unit from the syllabus
      const updatedUnits = currentSyllabus.units.filter((unit: any) => unit.id !== id);
      setCurrentSyllabus({...currentSyllabus, units: updatedUnits});
    } else if (type === 'lesson') {
      // Find which unit contains this lesson and remove it
      const updatedUnits = currentSyllabus.units.map((unit: any) => {
        const containsLesson = unit.lessons.some((lesson: any) => lesson.id === id);
        if (containsLesson) {
          return {
            ...unit,
            lessons: unit.lessons.filter((lesson: any) => lesson.id !== id)
          };
        }
        return unit;
      });
      
      setCurrentSyllabus({...currentSyllabus, units: updatedUnits});
    }
    
    setDeleteDialogOpen(false);
    setDeleteItemInfo(null);
  }

  function handleCreateSyllabus() {
    syllabusForm.reset({
      title: "",
      description: "",
      subjectId: selectedSubjectId,
      document: "",
    });
    setEditingItemId(null);
    setSyllabusDialogOpen(true);
  }

  function handleAddUnit() {
    if (!currentSyllabus) return;
    
    unitForm.reset({
      title: "",
      description: "",
      order: currentSyllabus.units?.length ? Math.max(...currentSyllabus.units.map((u: any) => u.order)) + 1 : 1,
    });
    setEditingItemId(null);
    setUnitDialogOpen(true);
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
          <h1 className="text-2xl font-bold tracking-tight">Syllabus Management</h1>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="subject-select" className="text-sm font-medium block mb-1">Select Subject</label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger id="subject-select">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjectsData.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleCreateSyllabus} 
              disabled={!selectedSubjectId}
              className="md:w-auto w-full"
            >
              {currentSyllabus ? (
                <>
                  <Edit className="mr-2 h-4 w-4" /> Edit Syllabus
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Syllabus
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {!selectedSubjectId && (
        <div className="text-center py-12 text-gray-500">
          <BookText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium mb-1">No Subject Selected</h3>
          <p className="text-sm">Please select a subject to view or create a syllabus</p>
        </div>
      )}

      {selectedSubjectId && !currentSyllabus && (
        <div className="text-center py-12 text-gray-500">
          <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium mb-1">No Syllabus Found</h3>
          <p className="text-sm mb-4">This subject doesn't have a syllabus yet.</p>
          <Button onClick={handleCreateSyllabus}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Syllabus
          </Button>
        </div>
      )}

      {currentSyllabus && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{currentSyllabus.title}</CardTitle>
                  <CardDescription>{currentSyllabus.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleEditSyllabus}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-500" 
                    onClick={() => handleDeleteItem(currentSyllabus.id, 'syllabus')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="text-gray-500">Subject:</span>{" "}
                    <span className="font-medium">
                      {subjectsData.find(s => s.id === currentSyllabus.subjectId)?.name}
                    </span>
                  </div>
                  {currentSyllabus.document && (
                    <a 
                      href={currentSyllabus.document} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      View Full Syllabus Document
                    </a>
                  )}
                </div>
                {!currentSyllabus.document && (
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Syllabus Document
                  </Button>
                )}
              </div>

              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Units</h3>
                <Button size="sm" onClick={handleAddUnit}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Unit
                </Button>
              </div>

              {currentSyllabus.units?.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border rounded-md">
                  <Layers className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <p>No units have been added to this syllabus yet.</p>
                  <Button variant="outline" className="mt-4" onClick={handleAddUnit}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Unit
                  </Button>
                </div>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {currentSyllabus.units?.sort((a: any, b: any) => a.order - b.order).map((unit: any) => (
                    <AccordionItem key={unit.id} value={unit.id} className="border rounded-md px-4 mb-3">
                      <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700">
                            <span className="text-sm font-medium">{unit.order}</span>
                          </div>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="text-left">
                              <h3 className="text-base font-medium">{unit.title}</h3>
                              {unit.description && <p className="text-sm text-gray-500">{unit.description}</p>}
                            </div>
                          </AccordionTrigger>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditUnit(unit.id);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-500" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteItem(unit.id, 'unit');
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <AccordionContent>
                        <div className="py-2">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-medium">Lessons</h4>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAddLesson(unit.id)}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1.5" />
                              Add Lesson
                            </Button>
                          </div>
                          {unit.lessons.length === 0 ? (
                            <div className="text-center py-4 text-gray-500 border rounded-md">
                              <p className="text-sm">No lessons have been added to this unit yet.</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {unit.lessons.map((lesson: any, index: number) => (
                                <div key={lesson.id} className="flex justify-between items-center p-3 border rounded-md bg-gray-50">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-gray-700">{index + 1}.</span>
                                      <h5 className="text-sm font-medium">{lesson.title}</h5>
                                    </div>
                                    {lesson.description && (
                                      <p className="text-xs text-gray-500 mt-1 ml-6">{lesson.description}</p>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 w-7 p-0" 
                                      onClick={() => handleEditLesson(lesson.id, unit.id)}
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 w-7 p-0 text-red-500" 
                                      onClick={() => handleDeleteItem(lesson.id, 'lesson')}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Syllabus Dialog */}
      <Dialog open={syllabusDialogOpen} onOpenChange={setSyllabusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItemId ? "Edit Syllabus" : "Create New Syllabus"}</DialogTitle>
            <DialogDescription>
              {editingItemId 
                ? "Update the details of the syllabus" 
                : "Define a new syllabus for the selected subject"}
            </DialogDescription>
          </DialogHeader>
          <Form {...syllabusForm}>
            <form onSubmit={syllabusForm.handleSubmit(onSyllabusSubmit)} className="space-y-4">
              <FormField
                control={syllabusForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Syllabus Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Mathematics Syllabus 2023" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={syllabusForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the syllabus" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={syllabusForm.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjectsData.map(subject => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name} ({subject.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={syllabusForm.control}
                name="document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document URL (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/syllabus-document.pdf" 
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
                  {editingItemId ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Unit Dialog */}
      <Dialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItemId ? "Edit Unit" : "Add New Unit"}</DialogTitle>
            <DialogDescription>
              {editingItemId 
                ? "Update the details of this unit" 
                : "Add a new unit to the syllabus"}
            </DialogDescription>
          </DialogHeader>
          <Form {...unitForm}>
            <form onSubmit={unitForm.handleSubmit(onUnitSubmit)} className="space-y-4">
              <FormField
                control={unitForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Algebra" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={unitForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the unit" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={unitForm.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">
                  {editingItemId ? "Update" : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItemId ? "Edit Lesson" : "Add New Lesson"}</DialogTitle>
            <DialogDescription>
              {editingItemId 
                ? "Update the details of this lesson" 
                : "Add a new lesson to the unit"}
            </DialogDescription>
          </DialogHeader>
          <Form {...lessonForm}>
            <form onSubmit={lessonForm.handleSubmit(onLessonSubmit)} className="space-y-4">
              <FormField
                control={lessonForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Linear Equations" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={lessonForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the lesson" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={lessonForm.control}
                name="unitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currentSyllabus?.units.map((unit: any) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">
                  {editingItemId ? "Update" : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {deleteItemInfo?.type === 'syllabus' ? 'Syllabus' : 
                     deleteItemInfo?.type === 'unit' ? 'Unit' : 'Lesson'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {deleteItemInfo?.type}? This action cannot be undone.
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
