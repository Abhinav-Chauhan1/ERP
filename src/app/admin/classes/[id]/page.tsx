"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Edit, Trash2, PlusCircle,
  Users, BookOpen, Clock, Calendar,
  GraduationCap, Building, Search, Download,
  UploadCloud, Check, X, ExternalLink,
  Loader2, AlertCircle, UserPlus, FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";

// Import schema validation and server actions
import {
  classSectionSchema,
  classTeacherSchema,
  studentEnrollmentSchema,
  ClassSectionFormValues,
  ClassTeacherFormValues,
  ClassTeacherUpdateFormValues,
  StudentEnrollmentFormValues,
  classTeacherUpdateSchema
} from "@/lib/schemaValidation/classesSchemaValidation";
import {
  getClassById,
  deleteClass,
  createClassSection,
  getTeachersForDropdown,
  assignTeacherToClass,
  enrollStudentInClass,
  getAvailableStudentsForClass,
  updateTeacherAssignment,
  removeTeacherFromClass
} from "@/lib/actions/classesActions";

export default function ClassDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [classDetails, setClassDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentUploadDialogOpen, setStudentUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("students");

  // Section dialog state
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [teacherDialogOpen, setTeacherDialogOpen] = useState(false);
  const [editTeacherDialogOpen, setEditTeacherDialogOpen] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);

  // New state for student enrollment
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Forms
  const sectionForm = useForm<ClassSectionFormValues>({
    resolver: zodResolver(classSectionSchema),
    defaultValues: {
      name: "",
      capacity: 30,
      classId: "",
    },
  });

  const teacherForm = useForm<ClassTeacherFormValues>({
    resolver: zodResolver(classTeacherSchema),
    defaultValues: {
      teacherId: "",
      classId: "",
      isClassHead: false,
    },
  });

  const editTeacherForm = useForm<ClassTeacherUpdateFormValues>({
    resolver: zodResolver(classTeacherUpdateSchema),
    defaultValues: {
      id: "",
      classId: "",
      teacherId: "",
      isClassHead: false,
    },
  });

  // New enrollment form
  const enrollmentForm = useForm<StudentEnrollmentFormValues>({
    resolver: zodResolver(studentEnrollmentSchema),
    defaultValues: {
      studentId: "",
      classId: "",
      sectionId: "",
      rollNumber: "",
      status: "ACTIVE",
    },
  });

  const fetchClassDetails = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const id = params.id as string;
      const result = await getClassById(id);

      if (result.success) {
        setClassDetails(result.data);

        // Pre-populate forms with class ID
        sectionForm.setValue("classId", id);
        teacherForm.setValue("classId", id);
        enrollmentForm.setValue("classId", id);
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
  }, [params.id, sectionForm, teacherForm, enrollmentForm]);

  const fetchTeachers = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchClassDetails();
    fetchTeachers();
  }, [fetchClassDetails, fetchTeachers]);

  // New function to fetch available students
  async function fetchAvailableStudents() {
    setLoadingStudents(true);
    try {
      const classId = params.id as string;
      const result = await getAvailableStudentsForClass(classId);

      if (result.success) {
        setAvailableStudents(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch available students");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoadingStudents(false);
    }
  }

  async function handleDeleteClass() {
    try {
      const id = params.id as string;
      const result = await deleteClass(id);

      if (result.success) {
        toast.success("Class deleted successfully");
        router.push('/admin/classes');
      } else {
        toast.error(result.error || "Failed to delete class");
        setDeleteDialogOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  function handleAddSection() {
    sectionForm.reset({
      name: "",
      capacity: 30,
      classId: params.id as string,
    });
    setSectionDialogOpen(true);
  }

  async function onSectionSubmit(values: ClassSectionFormValues) {
    try {
      const result = await createClassSection(values);

      if (result.success) {
        toast.success("Section created successfully");
        setSectionDialogOpen(false);
        fetchClassDetails();
      } else {
        toast.error(result.error || "Failed to create section");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  function handleAddTeacher() {
    teacherForm.reset({
      teacherId: "",
      classId: params.id as string,
      sectionId: "", // Default to empty (which might mean "All" or "Select One" depending on logic)
      isClassHead: false,
    });

    setTeacherDialogOpen(true);
  }

  async function onTeacherSubmit(values: ClassTeacherFormValues) {
    try {
      // Convert empty string sectionId to undefined/null for the API if needed
      const payload = {
        ...values,
        sectionId: values.sectionId === "ALL" || values.sectionId === "" ? null : values.sectionId
      };

      const result = await assignTeacherToClass(payload);

      if (result.success) {
        toast.success("Teacher assigned successfully");
        setTeacherDialogOpen(false);
        fetchClassDetails();
      } else {
        toast.error(result.error || "Failed to assign teacher");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  function handleEditTeacher(teacher: any) {
    editTeacherForm.reset({
      id: teacher.id, // Assignment ID
      classId: params.id as string,
      teacherId: teacher.teacherId,
      sectionId: teacher.sectionId || "ALL", // Handle null as "ALL"
      isClassHead: teacher.isClassHead,
    });

    setEditTeacherDialogOpen(true);
  }

  async function onUpdateTeacherSubmit(values: ClassTeacherUpdateFormValues) {
    try {
      const payload = {
        ...values,
        sectionId: values.sectionId === "ALL" || values.sectionId === "" ? null : values.sectionId
      };

      const result = await updateTeacherAssignment(payload);

      if (result.success) {
        toast.success("Teacher assignment updated");
        setEditTeacherDialogOpen(false);
        fetchClassDetails();
      } else {
        toast.error(result.error || "Failed to update assignment");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  async function handleRemoveTeacher(id: string) {
    if (!confirm("Are you sure you want to remove this teacher?")) return;

    try {
      const result = await removeTeacherFromClass(id);
      if (result.success) {
        toast.success("Teacher removed successfully");
        fetchClassDetails();
      } else {
        toast.error(result.error || "Failed to remove teacher");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  }

  // New function to open enrollment dialog
  function handleEnrollStudent() {
    enrollmentForm.reset({
      studentId: "",
      classId: params.id as string,
      sectionId: "",
      rollNumber: "",
      status: "ACTIVE",
    });

    fetchAvailableStudents();
    setEnrollDialogOpen(true);
  }

  // New function to handle enrollment submission
  async function onEnrollmentSubmit(values: StudentEnrollmentFormValues) {
    try {
      const result = await enrollStudentInClass(values);

      if (result.success) {
        toast.success("Student enrolled successfully");
        setEnrollDialogOpen(false);
        fetchClassDetails();
      } else {
        toast.error(result.error || "Failed to enroll student");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  }

  // Filter students based on search term
  const filteredStudents = classDetails?.students?.filter((student: any) =>
    student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.rollNumber.includes(studentSearch)
  ) || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/classes')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Classes
        </Button>
      </div>
    );
  }

  if (!classDetails) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>Class not found</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/classes')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Classes
        </Button>
      </div>
    );
  }

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
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link href={`/admin/classes/${classDetails.id}/edit`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} className="w-full sm:w-auto">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {classDetails.name}
                  {classDetails.sections && classDetails.sections.length > 0 && (
                    <span className="text-gray-400 ml-2 text-lg">
                      (Sections: {classDetails.sections.map((s: any) => s.name).join(', ')})
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Academic Year: {classDetails.year}
                </CardDescription>
              </div>
              <Badge className={`${classDetails.isCurrent ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} hover:bg-green-100`}>
                {classDetails.isCurrent ? 'Current Year' : 'Past Year'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg">
                <Users className="h-8 w-8 text-blue-500 mb-2" />
                <span className="text-sm font-medium text-gray-500">Students</span>
                <span className="text-xl font-bold">{classDetails.students?.length || 0}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg">
                <GraduationCap className="h-8 w-8 text-green-500 mb-2" />
                <span className="text-sm font-medium text-gray-500">Class Teacher</span>
                <span className="text-xl font-bold">{classDetails.classTeacher || 'Not Assigned'}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg">
                <BookOpen className="h-8 w-8 text-purple-500 mb-2" />
                <span className="text-sm font-medium text-gray-500">Subjects</span>
                <span className="text-xl font-bold">{classDetails.subjects?.length || 0}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-yellow-50 rounded-lg">
                <Building className="h-8 w-8 text-yellow-500 mb-2" />
                <span className="text-sm font-medium text-gray-500">Sections</span>
                <span className="text-xl font-bold">{classDetails.sections?.length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-4">
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="teachers">Teachers</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="timetable">Timetable</TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Students</CardTitle>
                  <CardDescription>Manage students enrolled in this class</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog open={studentUploadDialogOpen} onOpenChange={setStudentUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <UploadCloud className="h-4 w-4 mr-2" />
                        Upload Students
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload Student List</DialogTitle>
                        <DialogDescription>
                          Upload a CSV or Excel file with student details to add multiple students at once.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="border rounded-md p-4">
                          <div className="mb-4">
                            <Input
                              type="file"
                              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                              onChange={handleFileChange}
                            />
                          </div>
                          {selectedFile && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <Check className="h-4 w-4" />
                              <span>{selectedFile.name} selected</span>
                            </div>
                          )}
                        </div>

                        <div className="border rounded-md p-4 bg-gray-50">
                          <h4 className="font-medium text-sm mb-2">Format Help</h4>
                          <div className="mb-2">
                            <p className="text-xs font-medium">Student List Upload Format</p>
                            <p className="text-xs text-gray-500">The file should be in CSV or Excel format with the following columns</p>
                          </div>
                          <div className="mb-2">
                            <p className="text-xs font-medium">Required Fields</p>
                            <p className="text-xs text-gray-500">Roll Number, First Name, Last Name, Gender, Date of Birth, Contact Email, Parent Contact, Address</p>
                          </div>
                          <Button variant="outline" size="sm" className="mt-2">
                            <Download className="h-3 w-3 mr-1" />
                            Download Template
                          </Button>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setStudentUploadDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button disabled={!selectedFile}>
                          Upload and Process
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button onClick={handleEnrollStudent}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Enroll Student
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Search by name or roll number..."
                      className="pl-9"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="sm" className="h-10">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Roll No.</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Name</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Section</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                          <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.length > 0 ? (
                          filteredStudents.map((student: any) => (
                            <tr key={student.id} className="border-b">
                              <td className="py-3 px-4 align-middle">{student.rollNumber}</td>
                              <td className="py-3 px-4 align-middle font-medium">{student.name}</td>
                              <td className="py-3 px-4 align-middle">{student.section}</td>
                              <td className="py-3 px-4 align-middle">
                                <Badge className={
                                  student.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                    student.status === 'INACTIVE' ? 'bg-red-100 text-red-800' :
                                      student.status === 'TRANSFERRED' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                }>
                                  {student.status}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 align-middle text-right">
                                <Link href={`/admin/students/${student.id}`}>
                                  <Button variant="ghost" size="sm">
                                    View
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-gray-500">
                              {studentSearch ? "No students match your search" : "No students enrolled yet"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teachers">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Teachers</CardTitle>
                  <CardDescription>Teachers assigned to this class</CardDescription>
                </div>
                <Button onClick={handleAddTeacher}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Assign Teacher
                </Button>
              </CardHeader>
              <CardContent>
                {classDetails.teachers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <GraduationCap className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                    <p>No teachers assigned to this class yet.</p>
                    <Button variant="outline" className="mt-4" onClick={handleAddTeacher}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Assign First Teacher
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Teacher</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Employee ID</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Email</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Section</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Role</th>
                            <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classDetails.teachers.map((teacher: any) => (
                            <tr key={teacher.id} className="border-b">
                              <td className="py-3 px-4 align-middle font-medium">{teacher.name}</td>
                              <td className="py-3 px-4 align-middle">{teacher.employeeId}</td>
                              <td className="py-3 px-4 align-middle">{teacher.email}</td>
                              <td className="py-3 px-4 align-middle">
                                {teacher.sectionName ? (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    {teacher.sectionName}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-500 italic">All Sections</span>
                                )}
                              </td>
                              <td className="py-3 px-4 align-middle">
                                {teacher.isClassHead ? (
                                  <Badge className="bg-green-100 text-green-800">Class Teacher</Badge>
                                ) : "Subject Teacher"}
                              </td>
                              <td className="py-3 px-4 align-middle text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditTeacher(teacher)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleRemoveTeacher(teacher.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  <Link href={`/admin/teachers/${teacher.teacherId}`}>
                                    <Button variant="ghost" size="sm">
                                      View
                                    </Button>
                                  </Link>
                                </div>
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
          </TabsContent>

          <TabsContent value="subjects">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Subjects</CardTitle>
                  <CardDescription>Subjects taught in this class</CardDescription>
                </div>
                <Link href={`/admin/academic/curriculum?classId=${params.id}`}>
                  <Button variant="outline" size="sm">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Manage Subjects
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {classDetails.subjects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                    <p>No subjects assigned to this class yet.</p>
                    <Link href={`/admin/academic/curriculum?classId=${classDetails.id}`}>
                      <Button variant="outline" className="mt-4">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Subjects
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Subject</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Code</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Teacher</th>
                            <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classDetails.subjects.map((subject: any) => (
                            <tr key={subject.id} className="border-b">
                              <td className="py-3 px-4 align-middle font-medium">{subject.name}</td>
                              <td className="py-3 px-4 align-middle">{subject.code}</td>
                              <td className="py-3 px-4 align-middle">{subject.teacher || 'Not Assigned'}</td>
                              <td className="py-3 px-4 align-middle text-right">
                                <Link href={`/admin/academic/syllabus?subject=${subject.id}`}>
                                  <Button variant="ghost" size="sm">
                                    Syllabus
                                  </Button>
                                </Link>
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
          </TabsContent>

          <TabsContent value="timetable">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Timetable</CardTitle>
                  <CardDescription>Class schedule</CardDescription>
                </div>
                <Link href={`/admin/timetable?classId=${classDetails.id}`}>
                  <Button>
                    <Edit className="h-4 w-4 mr-2" />
                    Manage Timetable
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {!classDetails.timetable || classDetails.timetable.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                    <p>No timetable has been set for this class.</p>
                    <Link href={`/admin/timetable?classId=${classDetails.id}`}>
                      <Button variant="outline" className="mt-4">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create Timetable
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {classDetails.timetable.map((day: any) => (
                      <div key={day.day} className="border rounded-md">
                        <div className="bg-gray-50 py-2 px-4 font-medium border-b">
                          {day.day}
                        </div>
                        <div className="p-2">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="py-2 px-3 text-left font-medium text-gray-500">Time</th>
                                <th className="py-2 px-3 text-left font-medium text-gray-500">Subject</th>
                                <th className="py-2 px-3 text-left font-medium text-gray-500">Teacher</th>
                                <th className="py-2 px-3 text-left font-medium text-gray-500">Room</th>
                              </tr>
                            </thead>
                            <tbody>
                              {day.periods.map((period: any) => (
                                <tr key={period.id} className="border-b">
                                  <td className="py-2 px-3">{period.time}</td>
                                  <td className="py-2 px-3 font-medium">{period.subject}</td>
                                  <td className="py-2 px-3">{period.teacher}</td>
                                  <td className="py-2 px-3">{period.room}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Section Dialog */}
      <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Section</DialogTitle>
            <DialogDescription>
              Create a new section for this class
            </DialogDescription>
          </DialogHeader>
          <Form {...sectionForm}>
            <form onSubmit={sectionForm.handleSubmit(onSectionSubmit)} className="space-y-4">
              <FormField
                control={sectionForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. A, B, Science" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={sectionForm.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="e.g. 30"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Create Section</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Teacher Dialog */}
      <Dialog open={teacherDialogOpen} onOpenChange={setTeacherDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Teacher</DialogTitle>
            <DialogDescription>
              Assign a teacher to this class
            </DialogDescription>
          </DialogHeader>
          <Form {...teacherForm}>
            <form onSubmit={teacherForm.handleSubmit(onTeacherSubmit)} className="space-y-4">
              <FormField
                control={teacherForm.control}
                name="teacherId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teacher</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a teacher" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teachers.map(teacher => (
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
              <FormField
                control={teacherForm.control}
                name="sectionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Section</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select section (Optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ALL">All Sections (Class Head)</SelectItem>
                        {classDetails?.sections?.map((section: any) => (
                          <SelectItem key={section.id} value={section.id}>
                            Section {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      If "All Sections" is selected, this teacher will be the head for the entire class.
                      Select a specific section to assign a Section Head.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={teacherForm.control}
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
                        Set as class teacher
                      </FormLabel>
                      <p className="text-sm text-gray-500">
                        This teacher will be responsible for this class.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Assign Teacher</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>



      {/* Edit Teacher Dialog */}
      <Dialog open={editTeacherDialogOpen} onOpenChange={setEditTeacherDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Teacher Assignment</DialogTitle>
            <DialogDescription>
              Modify teacher assignment details
            </DialogDescription>
          </DialogHeader>
          <Form {...editTeacherForm}>
            <form onSubmit={editTeacherForm.handleSubmit(onUpdateTeacherSubmit)} className="space-y-4">
              <FormField
                control={editTeacherForm.control}
                name="sectionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Section</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select section (Optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ALL">All Sections (Class Head)</SelectItem>
                        {classDetails?.sections?.map((section: any) => (
                          <SelectItem key={section.id} value={section.id}>
                            Section {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      If "All Sections" is selected, this teacher will be the head for the entire class.
                      Select a specific section to assign a Section Head.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editTeacherForm.control}
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
                        Set as class teacher
                      </FormLabel>
                      <p className="text-sm text-gray-500">
                        This teacher will be responsible for this class.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Update Assignment</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Class</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this class? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteClass}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enroll Student Dialog */}
      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll Student</DialogTitle>
            <DialogDescription>
              Add a student to this class
            </DialogDescription>
          </DialogHeader>
          <Form {...enrollmentForm}>
            <form onSubmit={enrollmentForm.handleSubmit(onEnrollmentSubmit)} className="space-y-4">
              <FormField
                control={enrollmentForm.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadingStudents ? (
                          <div className="flex justify-center items-center py-2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          </div>
                        ) : availableStudents.length === 0 ? (
                          <div className="p-2 text-center text-sm text-gray-500">
                            No available students found
                          </div>
                        ) : (
                          availableStudents.map(student => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.name} ({student.admissionId})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={enrollmentForm.control}
                name="sectionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a section" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classDetails.sections.map((section: any) => (
                          <SelectItem key={section.id} value={section.id}>
                            {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={enrollmentForm.control}
                name="rollNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roll Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 101, A-23, etc." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={enrollmentForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Enroll Student</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div >
  );
}
