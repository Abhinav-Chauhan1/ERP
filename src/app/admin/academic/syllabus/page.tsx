"use client";


import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft, Edit, Trash2, PlusCircle,
  BookOpen, FileText, Layers, GripVertical,
  ChevronDown, BookText, Upload, Plus,
  AlertCircle, Loader2, Copy
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
import { useEnhancedSyllabusClient } from "@/lib/utils/feature-flags";

// Import schema validation and server actions
// Import schema validation and server actions
import {
  syllabusSchema,
  SyllabusFormValues,
} from "@/lib/schemaValidation/syllabusSchemaValidations";

import {
  getSubjectsForDropdown,
  getSyllabusByScope,
  createSyllabus,
  updateSyllabus,
  deleteSyllabus,
  getAcademicYearsForDropdown,
  getClassesForDropdown,
  getSectionsForDropdown
} from "@/lib/actions/syllabusActions";
import { ScopeSelector } from "@/components/admin/syllabus/scope-selector";
import { CurriculumTypeSelector } from "@/components/admin/syllabus/curriculum-type-selector";
import { MetadataInputs } from "@/components/admin/syllabus/metadata-inputs";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { CloneSyllabusDialog } from "@/components/admin/syllabus/clone-syllabus-dialog";
import { StatusBadge } from "@/components/admin/syllabus/status-badge";
import { StatusChangeDropdown } from "@/components/admin/syllabus/status-change-dropdown";
import { useSession } from "next-auth/react";
import { ModuleList } from "@/components/academic/module-list";

function SyllabusContent() {
  const searchParams = useSearchParams();
  const initialSubjectId = searchParams.get("subject");
  const useEnhancedSyllabus = useEnhancedSyllabusClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [subjects, setSubjects] = useState<any[]>([]);
  const [syllabiList, setSyllabiList] = useState<any[]>([]);

  const [syllabusDialogOpen, setSyllabusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [deleteItemInfo, setDeleteItemInfo] = useState<{ id: string, type: string } | null>(null);
  const [currentSyllabus, setCurrentSyllabus] = useState<any>(null);
  const [syllabusToClone, setSyllabusToClone] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileProgress, setFileProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // New state for enhanced syllabus features
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  // Filter state
  const [filters, setFilters] = useState({
    subjectId: initialSubjectId || "all",
    academicYearId: "all",
    classId: "all",
    sectionId: "all",
    curriculumType: "all",
    status: [] as string[],
    tags: [] as string[],
  });

  const syllabusForm = useForm<SyllabusFormValues>({
    resolver: zodResolver(syllabusSchema),
    defaultValues: {
      title: "",
      description: "",
      subjectId: initialSubjectId || "all",
      document: "",
      scopeType: "SUBJECT_WIDE",
      academicYearId: undefined,
      classId: undefined,
      sectionId: undefined,
      curriculumType: "GENERAL",
      boardType: "",
      version: "1.0",
      difficultyLevel: "INTERMEDIATE",
      estimatedHours: undefined,
      tags: [],
      prerequisites: "",
      effectiveFrom: undefined,
      effectiveTo: undefined,
    },
  });

  const fetchSyllabi = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getSyllabusByScope({
        subjectId: filters.subjectId && filters.subjectId !== "all" ? filters.subjectId : undefined,
        academicYearId: filters.academicYearId && filters.academicYearId !== "all" ? filters.academicYearId : undefined,
        classId: filters.classId && filters.classId !== "all" ? filters.classId : undefined,
        sectionId: filters.sectionId && filters.sectionId !== "all" ? filters.sectionId : undefined,
        curriculumType: filters.curriculumType && filters.curriculumType !== "all" ? filters.curriculumType as "GENERAL" | "ADVANCED" | "REMEDIAL" | "INTEGRATED" | "VOCATIONAL" | "SPECIAL_NEEDS" : undefined,
        status: filters.status.length > 0 && filters.status[0] !== "all" ? filters.status as ("DRAFT" | "PENDING_REVIEW" | "APPROVED" | "PUBLISHED" | "ARCHIVED" | "DEPRECATED")[] : undefined,
        tags: filters.tags.length > 0 ? filters.tags : undefined,
        isActive: true,
      });

      if (result.success) {
        setSyllabiList(result.data || []);
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
  }, [filters]);

  useEffect(() => {
    fetchSubjects();
    fetchAcademicYears();
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchSyllabi();
  }, [filters, fetchSyllabi]);

  // Fetch sections when classId changes in filters
  useEffect(() => {
    if (filters.classId) {
      fetchSections(filters.classId);
    } else {
      setSections([]);
    }
  }, [filters.classId]);

  // Fetch sections when classId changes
  const watchedClassId = syllabusForm.watch("classId");
  useEffect(() => {
    if (watchedClassId) {
      fetchSections(watchedClassId);
    } else {
      setSections([]);
      syllabusForm.setValue("sectionId", undefined);
    }
  }, [watchedClassId, syllabusForm]);

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

  async function fetchAcademicYears() {
    try {
      const result = await getAcademicYearsForDropdown();

      if (result.success) {
        setAcademicYears(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch academic years");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
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
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  async function fetchSections(classId: string) {
    try {
      const result = await getSectionsForDropdown(classId);

      if (result.success) {
        setSections(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch sections");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  async function onSyllabusSubmit(values: SyllabusFormValues) {
    try {
      setIsUploading(true);
      let result;

      if (editingItemId) {
        // Update existing syllabus
        result = await updateSyllabus({ ...values, id: editingItemId } as Parameters<typeof updateSyllabus>[0], uploadedFile);
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
        fetchSyllabi();
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

  async function confirmDelete() {
    if (!deleteItemInfo) return;

    try {
      const { id, type } = deleteItemInfo;
      let result;

      if (type === 'syllabus') {
        result = await deleteSyllabus(id);
      }

      if (result && result.success) {
        toast.success(`${type} deleted successfully`);
        setDeleteDialogOpen(false);
        setDeleteItemInfo(null);

        if (type === 'syllabus') {
          setCurrentSyllabus(null);
        }
        fetchSyllabi();
      } else {
        toast.error((result && result.error) || `Failed to delete ${type}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  function handleEditSyllabus(syllabus: any) {
    syllabusForm.reset({
      title: syllabus.title,
      description: syllabus.description || "",
      subjectId: syllabus.subjectId,
      document: syllabus.document || "",
      scopeType: syllabus.classId
        ? (syllabus.sectionId ? "SECTION_SPECIFIC" : "CLASS_WIDE")
        : "SUBJECT_WIDE",
      academicYearId: syllabus.academicYearId || undefined,
      classId: syllabus.classId || undefined,
      sectionId: syllabus.sectionId || undefined,
      curriculumType: syllabus.curriculumType || "GENERAL",
      boardType: syllabus.boardType || "",
      version: syllabus.version || "1.0",
      difficultyLevel: syllabus.difficultyLevel || "INTERMEDIATE",
      estimatedHours: syllabus.estimatedHours || undefined,
      tags: syllabus.tags || [],
      prerequisites: syllabus.prerequisites || "",
      effectiveFrom: syllabus.effectiveFrom ? new Date(syllabus.effectiveFrom) : undefined,
      effectiveTo: syllabus.effectiveTo ? new Date(syllabus.effectiveTo) : undefined,
    });
    setUploadedFile(null);
    setEditingItemId(syllabus.id);
    setSyllabusDialogOpen(true);
  }

  function handleCreateSyllabus() {
    syllabusForm.reset({
      title: "",
      description: "",
      subjectId: filters.subjectId || "",
      document: "",
      scopeType: "SUBJECT_WIDE",
      academicYearId: undefined,
      classId: undefined,
      sectionId: undefined,
      curriculumType: "GENERAL",
      boardType: "",
      version: "1.0",
      difficultyLevel: "INTERMEDIATE",
      estimatedHours: undefined,
      tags: [],
      prerequisites: "",
      effectiveFrom: undefined,
      effectiveTo: undefined,
    });
    setEditingItemId(null);
    setSyllabusDialogOpen(true);
  }

  function handleDeleteItem(id: string, type: string) {
    setDeleteItemInfo({ id, type });
    setDeleteDialogOpen(true);
  }

  function handleCloneSyllabus(syllabus: any) {
    setSyllabusToClone(syllabus);
    setCloneDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/admin/academic">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Syllabus Management</h1>
        </div>
        <Button onClick={handleCreateSyllabus} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Create Syllabus
        </Button>
      </div>




      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter syllabi by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Subject Filter */}
            <div>
              <label htmlFor="filter-subject" className="text-sm font-medium block mb-1">Subject</label>
              <Select
                value={filters.subjectId}
                onValueChange={(value) => setFilters({ ...filters, subjectId: value })}
              >
                <SelectTrigger id="filter-subject">
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjects.filter(s => s.id).map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Academic Year Filter */}
            <div>
              <label htmlFor="filter-academic-year" className="text-sm font-medium block mb-1">Academic Year</label>
              <Select
                value={filters.academicYearId}
                onValueChange={(value) => setFilters({ ...filters, academicYearId: value })}
              >
                <SelectTrigger id="filter-academic-year">
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {academicYears.filter(y => y.id).map(year => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Class Filter */}
            <div>
              <label htmlFor="filter-class" className="text-sm font-medium block mb-1">Class</label>
              <Select
                value={filters.classId}
                onValueChange={(value) => setFilters({ ...filters, classId: value, sectionId: "" })}
              >
                <SelectTrigger id="filter-class">
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {classes.filter(c => c.id).map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Section Filter */}
            <div>
              <label htmlFor="filter-section" className="text-sm font-medium block mb-1">Section</label>
              <Select
                value={filters.sectionId}
                onValueChange={(value) => setFilters({ ...filters, sectionId: value })}
                disabled={!filters.classId}
              >
                <SelectTrigger id="filter-section">
                  <SelectValue placeholder={filters.classId ? "All sections" : "Select class first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sections</SelectItem>
                  {sections.filter(s => s.id).map(section => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Curriculum Type Filter */}
            <div>
              <label htmlFor="filter-curriculum" className="text-sm font-medium block mb-1">Curriculum Type</label>
              <Select
                value={filters.curriculumType}
                onValueChange={(value) => setFilters({ ...filters, curriculumType: value })}
              >
                <SelectTrigger id="filter-curriculum">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                  <SelectItem value="REMEDIAL">Remedial</SelectItem>
                  <SelectItem value="INTEGRATED">Integrated</SelectItem>
                  <SelectItem value="VOCATIONAL">Vocational</SelectItem>
                  <SelectItem value="SPECIAL_NEEDS">Special Needs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter - Placeholder for now */}
            <div>
              <label htmlFor="filter-status" className="text-sm font-medium block mb-1">Status</label>
              <Select
                value={filters.status.length > 0 ? filters.status[0] : ""}
                onValueChange={(value) => setFilters({ ...filters, status: value ? [value] : [] })}
              >
                <SelectTrigger id="filter-status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                  <SelectItem value="DEPRECATED">Deprecated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({
                subjectId: "all",
                academicYearId: "all",
                classId: "all",
                sectionId: "all",
                curriculumType: "all",
                status: [],
                tags: [],
              })}
            >
              Clear Filters
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

      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && syllabiList.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium mb-1">No Syllabi Found</h3>
          <p className="text-sm mb-4">No syllabi match your current filters.</p>
          <Button onClick={handleCreateSyllabus}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Syllabus
          </Button>
        </div>
      )}

      {!loading && syllabiList.length > 0 && (
        <div className="space-y-4">
          {syllabiList.map((syllabus: any) => (
            <Card key={syllabus.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{syllabus.title}</CardTitle>
                    <CardDescription>{syllabus.description}</CardDescription>

                    {/* Scope Information Display */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {/* Status Badge */}
                      <StatusBadge status={syllabus.status || "DRAFT"} />

                      <div className="flex items-center gap-1 text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{syllabus.subject?.name} ({syllabus.subject?.code})</span>
                      </div>

                      {syllabus.academicYear && (
                        <div className="flex items-center gap-1 text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          <span>📅 {syllabus.academicYear.name}</span>
                        </div>
                      )}

                      {syllabus.class && (
                        <div className="flex items-center gap-1 text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                          <span>🎓 {syllabus.class.name}</span>
                        </div>
                      )}

                      {syllabus.section && (
                        <div className="flex items-center gap-1 text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          <span>📚 Section {syllabus.section.name}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded">
                        <span>{syllabus.curriculumType}</span>
                      </div>

                      {syllabus.boardType && (
                        <div className="flex items-center gap-1 text-sm bg-pink-100 text-pink-700 px-2 py-1 rounded">
                          <span>{syllabus.boardType}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {userId && (
                      <StatusChangeDropdown
                        syllabusId={syllabus.id}
                        currentStatus={syllabus.status || "DRAFT"}
                        userId={userId}
                        onStatusChanged={fetchSyllabi}
                      />
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleCloneSyllabus(syllabus)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Clone
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditSyllabus(syllabus)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500"
                      onClick={() => handleDeleteItem(syllabus.id, 'syllabus')}
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
                      <span className="text-muted-foreground">Version:</span>{" "}
                      <span className="font-medium">{syllabus.version}</span>
                    </div>
                    {syllabus.document && (
                      <a
                        href={syllabus.document}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-primary hover:text-primary"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        View Document
                      </a>
                    )}
                  </div>
                </div>

                <div className="mt-6 border-t pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Layers className="h-5 w-5 text-primary" />
                    <h4 className="font-medium text-lg">Course Content</h4>
                  </div>
                  <ModuleList
                    modules={syllabus.modules || []}
                    syllabusId={syllabus.id}
                    onRefresh={fetchSyllabi}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Syllabus Dialog */}
      <Dialog open={syllabusDialogOpen} onOpenChange={setSyllabusDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItemId ? "Edit Syllabus" : "Create New Syllabus"}</DialogTitle>
            <DialogDescription>
              {editingItemId
                ? "Update the details of the syllabus"
                : "Define a new syllabus for the selected subject"}
            </DialogDescription>
          </DialogHeader>
          <Form {...syllabusForm}>
            <form onSubmit={syllabusForm.handleSubmit(onSyllabusSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
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
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={syllabusForm.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Version</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 1.0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Scope Selection */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-medium">Scope</h3>
                <FormField
                  control={syllabusForm.control}
                  name="scopeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ScopeSelector
                          scopeType={field.value}
                          onScopeTypeChange={(value) => {
                            field.onChange(value);
                            // Clear class and section when changing scope type
                            if (value === "SUBJECT_WIDE") {
                              syllabusForm.setValue("classId", undefined);
                              syllabusForm.setValue("sectionId", undefined);
                            } else if (value === "CLASS_WIDE") {
                              syllabusForm.setValue("sectionId", undefined);
                            }
                          }}
                          classId={syllabusForm.watch("classId")}
                          onClassChange={(value) => syllabusForm.setValue("classId", value)}
                          sectionId={syllabusForm.watch("sectionId")}
                          onSectionChange={(value) => syllabusForm.setValue("sectionId", value)}
                          classes={classes}
                          sections={sections}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={syllabusForm.control}
                  name="academicYearId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select academic year (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None (All Years)</SelectItem>
                          {academicYears.map(year => (
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
              </div>

              {/* Curriculum Details */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-medium">Curriculum Details</h3>
                <FormField
                  control={syllabusForm.control}
                  name="curriculumType"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <CurriculumTypeSelector
                          curriculumType={field.value}
                          onCurriculumTypeChange={field.onChange}
                          boardType={syllabusForm.watch("boardType")}
                          onBoardTypeChange={(value) => syllabusForm.setValue("boardType", value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Metadata */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-medium">Metadata</h3>
                <FormField
                  control={syllabusForm.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <MetadataInputs
                          tags={field.value}
                          onTagsChange={field.onChange}
                          difficultyLevel={syllabusForm.watch("difficultyLevel")}
                          onDifficultyLevelChange={(value) => syllabusForm.setValue("difficultyLevel", value)}
                          estimatedHours={syllabusForm.watch("estimatedHours")}
                          onEstimatedHoursChange={(value) => syllabusForm.setValue("estimatedHours", value)}
                          prerequisites={syllabusForm.watch("prerequisites")}
                          onPrerequisitesChange={(value) => syllabusForm.setValue("prerequisites", value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Effective Date Range */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-medium">Effective Date Range</h3>
                <FormField
                  control={syllabusForm.control}
                  name="effectiveFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective Date Range (Optional)</FormLabel>
                      <FormControl>
                        <DateRangePicker
                          value={{
                            from: syllabusForm.watch("effectiveFrom"),
                            to: syllabusForm.watch("effectiveTo"),
                          }}
                          onChange={(range) => {
                            syllabusForm.setValue("effectiveFrom", range?.from);
                            syllabusForm.setValue("effectiveTo", range?.to);
                          }}
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">
                        Set when this syllabus becomes active and when it expires
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Document Upload */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-medium">Document</h3>
                <div className="space-y-2">
                  <FormLabel>Syllabus Document</FormLabel>
                  {uploadedFile ? (
                    <div className="flex items-center justify-between p-2 border rounded-md bg-primary/10">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <div className="text-sm">
                          <p className="font-medium">{uploadedFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
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
                        <div className="flex items-center text-sm text-muted-foreground">
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

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete Syllabus
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this syllabus? This action cannot be undone.
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

      {/* Clone Dialog */}
      {syllabusToClone && userId && (
        <CloneSyllabusDialog
          open={cloneDialogOpen}
          onOpenChange={setCloneDialogOpen}
          syllabus={syllabusToClone}
          academicYears={academicYears}
          classes={classes}
          sections={sections}
          onSectionsLoad={fetchSections}
          userId={userId}
          onSuccess={() => {
            fetchSyllabi();
            setSyllabusToClone(null);
          }}
        />
      )}
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

