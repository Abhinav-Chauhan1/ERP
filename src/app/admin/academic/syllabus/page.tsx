"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  ChevronLeft, Edit, Trash2, PlusCircle, 
  BookOpen, FileText, Layers, GripVertical,
  ChevronDown, BookText, Upload, Plus,
  AlertCircle, Loader2
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
import toast from "react-hot-toast";

// Import schema validation and server actions
import { 
  syllabusSchema, 
  syllabusUnitSchema, 
  lessonSchema, 
  SyllabusFormValues,
  SyllabusUnitFormValues,
  LessonFormValues
} from "@/lib/schemaValidation/syllabusSchemaValidations";

import {
  getSubjectsForDropdown,
  getSyllabusBySubject,
  createSyllabus,
  updateSyllabus,
  deleteSyllabus,
  createSyllabusUnit,
  updateSyllabusUnit,
  deleteSyllabusUnit,
  createLesson,
  updateLesson,
  deleteLesson,
  getMaxUnitOrder
} from "@/lib/actions/syllabusActions";

function SyllabusContent() {
  const searchParams = useSearchParams();
  const initialSubjectId = searchParams.get("subject");
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId || "");
  const [currentSyllabus, setCurrentSyllabus] = useState<any>(null);
  
  const [syllabusDialogOpen, setSyllabusDialogOpen] = useState(false);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [deleteItemInfo, setDeleteItemInfo] = useState<{id: string, type: string} | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileProgress, setFileProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const syllabusForm = useForm<SyllabusFormValues>({
    resolver: zodResolver(syllabusSchema),
    defaultValues: {
      title: "",
      description: "",
      subjectId: initialSubjectId || "",
      document: "",
    },
  });

  const unitForm = useForm<SyllabusUnitFormValues>({
    resolver: zodResolver(syllabusUnitSchema),
    defaultValues: {
      title: "",
      description: "",
      order: 1,
      syllabusId: "",
    },
  });

  const lessonForm = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: "",
      description: "",
      subjectId: "",
      syllabusUnitId: "",
    },
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubjectId) {
      fetchSyllabus(selectedSubjectId);
    } else {
      setCurrentSyllabus(null);
    }
  }, [selectedSubjectId]);

  async function fetchSubjects() {
    try {
      const result = await getSubjectsForDropdown();
      
      if (result.success) {
        setSubjects(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch subjects");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  async function fetchSyllabus(subjectId: string) {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getSyllabusBySubject(subjectId);
      
      if (result.success) {
        setCurrentSyllabus(result.data);
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

  async function onSyllabusSubmit(values: SyllabusFormValues) {
    try {
      setIsUploading(true);
      let result;
      
      if (editingItemId) {
        // Update existing syllabus
        result = await updateSyllabus({ ...values, id: editingItemId }, uploadedFile);
      } else {
        // Create new syllabus
        result = await createSyllabus(values, uploadedFile);
      }
      
      if (result.success) {
        toast.success(`Syllabus ${editingItemId ? "updated" : "created"} successfully`);
        setSyllabusDialogOpen(false);
        syllabusForm.reset();
        setEditingItemId(null);
        setUploadedFile(null);
        fetchSyllabus(values.subjectId);
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files[0]) {
      setUploadedFile(files[0]);
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
      if (!validTypes.includes(files[0].type)) {
        toast.error("Please upload a valid document file (PDF, Word, or PowerPoint)");
        setUploadedFile(null);
        e.target.value = '';
        return;
      }
      
      let progress = 0;
      setFileProgress(progress);
      const interval = setInterval(() => {
        progress += 10;
        setFileProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
        }
      }, 100);
    }
  }

  function handleRemoveFile() {
    setUploadedFile(null);
    setFileProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function onUnitSubmit(values: SyllabusUnitFormValues) {
    try {
      let result;
      
      if (editingItemId) {
        // Update existing unit
        result = await updateSyllabusUnit({ ...values, id: editingItemId });
      } else {
        // Create new unit
        result = await createSyllabusUnit(values);
      }
      
      if (result.success) {
        toast.success(`Unit ${editingItemId ? "updated" : "created"} successfully`);
        setUnitDialogOpen(false);
        unitForm.reset();
        setEditingItemId(null);
        if (selectedSubjectId) {
          fetchSyllabus(selectedSubjectId);
        }
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  async function onLessonSubmit(values: LessonFormValues) {
    try {
      let result;
      
      if (editingItemId) {
        // Update existing lesson
        result = await updateLesson({ ...values, id: editingItemId });
      } else {
        // Create new lesson
        result = await createLesson(values);
      }
      
      if (result.success) {
        toast.success(`Lesson ${editingItemId ? "updated" : "created"} successfully`);
        setLessonDialogOpen(false);
        lessonForm.reset();
        setEditingItemId(null);
        if (selectedSubjectId) {
          fetchSyllabus(selectedSubjectId);
        }
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  async function confirmDelete() {
    if (!deleteItemInfo) return;
    
    try {
      const { id, type } = deleteItemInfo;
      let result;
      
      if (type === 'syllabus') {
        result = await deleteSyllabus(id);
      } else if (type === 'unit') {
        result = await deleteSyllabusUnit(id);
      } else if (type === 'lesson') {
        result = await deleteLesson(id);
      }
      
      if (result && result.success) {
        toast.success(`${type} deleted successfully`);
        setDeleteDialogOpen(false);
        setDeleteItemInfo(null);
        
        if (type === 'syllabus') {
          setCurrentSyllabus(null);
        } else if (selectedSubjectId) {
          fetchSyllabus(selectedSubjectId);
        }
      } else {
        toast.error((result && result.error) || `Failed to delete ${type}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  function handleEditSyllabus() {
    if (currentSyllabus) {
      syllabusForm.reset({
        title: currentSyllabus.title,
        description: currentSyllabus.description || "",
        subjectId: currentSyllabus.subjectId,
        document: currentSyllabus.document || "",
      });
      setUploadedFile(null);
      setEditingItemId(currentSyllabus.id);
      setSyllabusDialogOpen(true);
    }
  }

  async function handleAddUnit() {
    if (!currentSyllabus) return;
    
    try {
      const orderResult = await getMaxUnitOrder(currentSyllabus.id);
      const nextOrder = orderResult.success && orderResult.data !== undefined ? orderResult.data + 1 : 1;
      
      unitForm.reset({
        title: "",
        description: "",
        order: nextOrder,
        syllabusId: currentSyllabus.id,
      });
      setEditingItemId(null);
      setUnitDialogOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  function handleEditUnit(unitId: string) {
    const unitToEdit = currentSyllabus?.units.find((unit: any) => unit.id === unitId);
    if (unitToEdit) {
      unitForm.reset({
        title: unitToEdit.title,
        description: unitToEdit.description || "",
        order: unitToEdit.order,
        syllabusId: currentSyllabus.id,
      });
      setEditingItemId(unitId);
      setUnitDialogOpen(true);
    }
  }

  function handleAddLesson(unitId: string) {
    if (!currentSyllabus || !selectedSubjectId) return;
    
    lessonForm.reset({
      title: "",
      description: "",
      subjectId: selectedSubjectId,
      syllabusUnitId: unitId,
    });
    setEditingItemId(null);
    setLessonDialogOpen(true);
  }

  function handleEditLesson(lessonId: string, unitId: string) {
    const unit = currentSyllabus?.units.find((u: any) => u.id === unitId);
    if (!unit) return;
    
    const lessonToEdit = unit.lessons.find((lesson: any) => lesson.id === lessonId);
    if (lessonToEdit && selectedSubjectId) {
      lessonForm.reset({
        title: lessonToEdit.title,
        description: lessonToEdit.description || "",
        subjectId: selectedSubjectId,
        syllabusUnitId: unitId,
        content: lessonToEdit.content || "",
        resources: lessonToEdit.resources || "",
        duration: lessonToEdit.duration || undefined,
      });
      setEditingItemId(lessonId);
      setLessonDialogOpen(true);
    }
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

  function handleDeleteItem(id: string, type: string) {
    setDeleteItemInfo({ id, type });
    setDeleteDialogOpen(true);
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
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))}
                  <SelectItem value="none">None (Uncategorized)</SelectItem>
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

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!selectedSubjectId && (
        <div className="text-center py-12 text-gray-500">
          <BookText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium mb-1">No Subject Selected</h3>
          <p className="text-sm">Please select a subject to view or create a syllabus</p>
        </div>
      )}

      {selectedSubjectId && loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {selectedSubjectId && !loading && !currentSyllabus && (
        <div className="text-center py-12 text-gray-500">
          <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium mb-1">No Syllabus Found</h3>
          <p className="text-sm mb-4">This subject doesn't have a syllabus yet.</p>
          <Button onClick={handleCreateSyllabus}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Syllabus
          </Button>
        </div>
      )}

      {currentSyllabus && !loading && (
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
                      {currentSyllabus.subject?.name} ({currentSyllabus.subject?.code})
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
                  <Button variant="outline" size="sm" onClick={handleEditSyllabus}>
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
                        {subjects.map(subject => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name} ({subject.code})
                          </SelectItem>
                        ))}
                        <SelectItem value="none">None (Uncategorized)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <FormLabel>Syllabus Document</FormLabel>
                {uploadedFile ? (
                  <div className="flex items-center justify-between p-2 border rounded-md bg-blue-50">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div className="text-sm">
                        <p className="font-medium">{uploadedFile.name}</p>
                        <p className="text-xs text-gray-500">{(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleRemoveFile}
                      className="text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-2">
                      <FormField
                        control={syllabusForm.control}
                        name="document"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">Document URL</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter document URL or upload a file" 
                                {...field} 
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-center text-sm text-gray-500">
                        <span>Or</span>
                        <div className="flex-1 border-t mx-2"></div>
                      </div>
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          id="document-upload"
                          className="hidden"
                          accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                          onChange={handleFileChange}
                        />
                        <Button 
                          type="button"
                          variant="outline" 
                          className="w-full"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Document
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingItemId ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingItemId ? "Update" : "Create"
                  )}
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
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Lesson content or URL to content" 
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
                name="resources"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resources (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="URLs to resources, separated by commas" 
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
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration in Minutes (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        placeholder="e.g. 45" 
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


export default function SyllabusPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SyllabusContent />
    </Suspense>
  );
}
