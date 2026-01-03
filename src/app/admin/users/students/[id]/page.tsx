"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { OptimizedImage } from "@/components/shared/optimized-image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, Mail, Phone, BookOpen, GraduationCap, Calendar, User, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { studentEnrollmentSchema, StudentEnrollmentFormValues } from "@/lib/schemaValidation/classesSchemaValidation";
import { enrollStudentInClass } from "@/lib/actions/classesActions";

export default function StudentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const enrollmentForm = useForm<StudentEnrollmentFormValues>({
    resolver: zodResolver(studentEnrollmentSchema),
    defaultValues: {
      studentId: id,
      classId: "",
      sectionId: "",
      rollNumber: "",
      status: "ACTIVE",
    },
  });

  const fetchStudentDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/students/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch student details");
      }
      const data = await response.json();
      setStudent(data);
    } catch (error) {
      console.error("Error fetching student:", error);
      toast.error("Failed to load student details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStudentDetails();
  }, [fetchStudentDetails]);

  const fetchClasses = useCallback(async () => {
    setLoadingClasses(true);
    try {
      const response = await fetch("/api/classes");
      if (!response.ok) {
        throw new Error("Failed to fetch classes");
      }
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Failed to load classes");
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  const fetchSections = useCallback(async (classId: string) => {
    try {
      const response = await fetch(`/api/classes/${classId}/sections`);
      if (!response.ok) {
        throw new Error("Failed to fetch sections");
      }
      const data = await response.json();
      setSections(data);
    } catch (error) {
      console.error("Error fetching sections:", error);
      toast.error("Failed to load sections");
    }
  }, []);

  function handleEnrollStudent() {
    enrollmentForm.reset({
      studentId: id,
      classId: "",
      sectionId: "",
      rollNumber: "",
      status: "ACTIVE",
    });
    fetchClasses();
    setEnrollDialogOpen(true);
  }

  async function onEnrollmentSubmit(values: StudentEnrollmentFormValues) {
    try {
      const result = await enrollStudentInClass(values);

      if (result.success) {
        toast.success("Student enrolled successfully");
        setEnrollDialogOpen(false);
        fetchStudentDetails();
      } else {
        toast.error(result.error || "Failed to enroll student");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  const watchClassId = enrollmentForm.watch("classId");

  useEffect(() => {
    if (watchClassId) {
      fetchSections(watchClassId);
      enrollmentForm.setValue("sectionId", "");
    }
  }, [watchClassId, fetchSections, enrollmentForm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Student not found</p>
      </div>
    );
  }

  // Calculate attendance statistics
  const totalAttendanceRecords = student.attendance?.length || 0;
  const presentCount = student.attendance?.filter((record: any) => record.status === 'PRESENT').length || 0;
  const absentCount = student.attendance?.filter((record: any) => record.status === 'ABSENT').length || 0;
  const lateCount = student.attendance?.filter((record: any) => record.status === 'LATE').length || 0;

  const attendancePercentage = totalAttendanceRecords > 0
    ? Math.round((presentCount / totalAttendanceRecords) * 100)
    : 0;

  const currentEnrollment = student.enrollments?.[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href="/admin/users/students">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
        </Link>
      </div>

      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold tracking-tight">
          {student.user.firstName} {student.user.lastName}
        </h1>
        <div className="flex gap-2">
          <Link href={`/admin/users/students/${student.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>Personal and academic details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-none flex flex-col items-center gap-2">
                {student.user.avatar ? (
                  <OptimizedImage
                    src={student.user.avatar}
                    alt={`${student.user.firstName} ${student.user.lastName}`}
                    width={128}
                    height={128}
                    className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-md"
                    qualityPreset="high"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-2xl font-bold border-4 border-white shadow-md">
                    {student.user.firstName[0]}
                    {student.user.lastName[0]}
                  </div>
                )}
                <div className="text-center">
                  <Badge
                    className={student.user.active ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}
                  >
                    {student.user.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">
                    {student.user.firstName} {student.user.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{student.user.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{student.user.phone || "Not provided"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{formatDate(student.dateOfBirth)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium capitalize">{student.gender.toLowerCase()}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Blood Group</p>
                  <p className="font-medium">{student.bloodGroup || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Admission ID</p>
                  <p className="font-medium">{student.admissionId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Admission Date</p>
                  <p className="font-medium">{formatDate(student.admissionDate)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{student.address || "Not provided"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Class Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentEnrollment ? (
              <>
                <div className="bg-primary/10 p-4 rounded-md border border-primary/20 flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-primary">Current Class</p>
                    <p className="font-bold text-primary">{currentEnrollment.class.name} - {currentEnrollment.section.name}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Roll Number</p>
                  <p className="font-medium">{currentEnrollment.rollNumber || student.rollNumber || "Not assigned"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Enrollment Date</p>
                  <p className="font-medium">{formatDate(currentEnrollment.enrollDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    className={currentEnrollment.status === 'ACTIVE' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'}
                  >
                    {currentEnrollment.status}
                  </Badge>
                </div>
              </>
            ) : (
              <div className="text-center p-4">
                <p className="text-sm text-muted-foreground">Not currently enrolled in any class</p>
                <Button size="sm" variant="outline" className="mt-2" onClick={handleEnrollStudent}>
                  Enroll Student
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Parents/Guardians</CardTitle>
            <CardDescription>Associated family members</CardDescription>
          </CardHeader>
          <CardContent>
            {student.parents.length > 0 ? (
              <div className="space-y-4">
                {student.parents.map((parentRelation: any) => (
                  <div key={parentRelation.id} className="flex justify-between items-center p-4 rounded-md border">
                    <div className="flex items-center gap-4">
                      {parentRelation.parent.user.avatar ? (
                        <OptimizedImage
                          src={parentRelation.parent.user.avatar}
                          alt={`${parentRelation.parent.user.firstName} ${parentRelation.parent.user.lastName}`}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover"
                          qualityPreset="medium"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                          {parentRelation.parent.user.firstName[0]}
                          {parentRelation.parent.user.lastName[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{parentRelation.parent.user.firstName} {parentRelation.parent.user.lastName}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{parentRelation.parent.user.email}</span>
                          </div>
                          {parentRelation.parent.user.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{parentRelation.parent.user.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={parentRelation.isPrimary ? 'bg-primary/10 text-primary hover:bg-primary/10' : 'bg-muted text-foreground hover:bg-muted'}>
                        {parentRelation.isPrimary ? 'Primary Contact' : parentRelation.parent.relation?.toLowerCase() || 'Guardian'}
                      </Badge>
                      <Link href={`/admin/users/parents/${parentRelation.parent.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4">
                <p className="text-sm text-muted-foreground">No parents or guardians associated</p>
                <Button size="sm" variant="outline" className="mt-2">Add Parent</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Attendance Summary</CardTitle>
            <CardDescription>Last 10 recorded days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Present</p>
                <p className="text-lg font-bold text-green-600">{presentCount}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Absent</p>
                <p className="text-lg font-bold text-red-600">{absentCount}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Late</p>
                <p className="text-lg font-bold text-yellow-600">{lateCount}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold">{totalAttendanceRecords}</p>
              </div>
            </div>

            <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
              <div
                className="bg-green-500 h-4"
                style={{ width: `${attendancePercentage}%` }}
              ></div>
            </div>
            <p className="text-center text-sm">
              <span className="font-bold">{attendancePercentage}%</span> attendance rate
            </p>

            <div className="space-y-2 mt-4">
              {student.attendance.slice(0, 5).map((record: any) => (
                <div key={record.id} className="flex justify-between items-center text-sm">
                  <span>{formatDate(record.date)}</span>
                  <Badge
                    className={
                      record.status === 'PRESENT' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                        record.status === 'ABSENT' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                          'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                    }
                  >
                    {record.status}
                  </Badge>
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" className="w-full">View Full Attendance</Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Exam Results</CardTitle>
            <CardDescription>Performance in the latest examinations</CardDescription>
          </CardHeader>
          <CardContent>
            {student.examResults.length > 0 ? (
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-accent border-b">
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Subject</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Exam</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Date</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Marks</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Grade</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {student.examResults.map((result: any) => (
                        <tr key={result.id} className="border-b">
                          <td className="py-3 px-4 align-middle">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                              {result.exam.subject.name}
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle">{result.exam.title}</td>
                          <td className="py-3 px-4 align-middle">{formatDate(result.exam.examDate)}</td>
                          <td className="py-3 px-4 align-middle font-semibold">{result.marks} / {result.exam.totalMarks}</td>
                          <td className="py-3 px-4 align-middle">{result.grade || "-"}</td>
                          <td className="py-3 px-4 align-middle">
                            <Badge
                              className={
                                result.marks >= result.exam.passingMarks
                                  ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                  : 'bg-red-100 text-red-800 hover:bg-red-100'
                              }
                            >
                              {result.marks >= result.exam.passingMarks ? "Pass" : "Fail"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center p-4">
                <p className="text-sm text-muted-foreground">No exam results recorded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enroll Student Dialog */}
      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll Student</DialogTitle>
            <DialogDescription>
              Enroll {student.user.firstName} {student.user.lastName} in a class
            </DialogDescription>
          </DialogHeader>
          <Form {...enrollmentForm}>
            <form onSubmit={enrollmentForm.handleSubmit(onEnrollmentSubmit)} className="space-y-4">
              <FormField
                control={enrollmentForm.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadingClasses ? (
                          <div className="flex justify-center items-center py-2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          </div>
                        ) : classes.length === 0 ? (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            No classes found
                          </div>
                        ) : (
                          classes.map((cls: any) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
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
                      disabled={!watchClassId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a section" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sections.length === 0 ? (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            {watchClassId ? "No sections found" : "Select a class first"}
                          </div>
                        ) : (
                          sections.map((section: any) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.name}
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
                <Button type="button" variant="outline" onClick={() => setEnrollDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Enroll Student</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
