"use client";

import { use } from "react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { OptimizedImage } from "@/components/shared/optimized-image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Trash2, Mail, Phone, BookOpen, GraduationCap, Calendar, User, Loader2, UserPlus, Users, Heart, Building, MapPin, CreditCard, FileText, Ruler, Scale } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { studentEnrollmentSchema, StudentEnrollmentFormValues } from "@/lib/schemaValidation/classesSchemaValidation";
import { enrollStudentInClass } from "@/lib/actions/classesActions";
import { getFeePayments, getPaymentReceiptHTML, getConsolidatedReceiptHTML } from "@/lib/actions/feePaymentActions";
import { PaymentsTable } from "@/components/admin/finance-tables";
import { Download } from "lucide-react";

// Add Parent Dialog Component
function AddParentDialog({
  studentId,
  studentName,
  onSuccess
}: {
  studentId: string;
  studentName: string;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"select" | "create">("select");
  const [parents, setParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [parentSearch, setParentSearch] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const router = useRouter();

  const fetchParents = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/parents");
      if (response.ok) {
        const data = await response.json();
        setParents(data);
      }
    } catch (error) {
      console.error("Error fetching parents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && mode === "select") {
      fetchParents();
    }
  }, [open, mode]);

  const handleAssociateExisting = async () => {
    if (!selectedParentId) {
      toast.error("Please select a parent");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/students/associate-parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          parentId: selectedParentId,
          isPrimary
        })
      });

      if (response.ok) {
        toast.success("Parent associated successfully");
        setOpen(false);
        setSelectedParentId("");
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to associate parent");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Parent
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Parent/Guardian</DialogTitle>
          <DialogDescription>
            Associate a parent or guardian with {studentName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={mode === "select" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("select")}
              className="flex-1"
            >
              <Users className="h-4 w-4 mr-2" />
              Select Existing
            </Button>
            <Button
              variant={mode === "create" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setOpen(false);
                router.push(`/admin/users/parents/create?studentId=${studentId}`);
              }}
              className="flex-1"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Create New
            </Button>
          </div>

          {mode === "select" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Parent</label>
                {loading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        onChange={(e) => {
                          const search = e.target.value.toLowerCase();
                          setParentSearch(search);
                        }}
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto border rounded-md">
                      {parents.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                          No parents found
                        </div>
                      ) : (
                        parents
                          .filter((parent) => {
                            if (!parentSearch) return true;
                            const fullName = `${parent.user.firstName} ${parent.user.lastName}`.toLowerCase();
                            const email = parent.user.email.toLowerCase();
                            return fullName.includes(parentSearch) || email.includes(parentSearch);
                          })
                          .slice(0, 50)
                          .map((parent) => (
                            <div
                              key={parent.id}
                              className={`p-3 cursor-pointer hover:bg-accent border-b last:border-b-0 ${selectedParentId === parent.id ? 'bg-primary/10' : ''}`}
                              onClick={() => setSelectedParentId(parent.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm">{parent.user.firstName} {parent.user.lastName}</p>
                                  <p className="text-xs text-muted-foreground">{parent.user.email}</p>
                                </div>
                                {selectedParentId === parent.id && (
                                  <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                                    <span className="text-white text-xs">✓</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isPrimary" className="text-sm">
                  Set as primary contact
                </label>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          {mode === "select" && (
            <Button onClick={handleAssociateExisting} disabled={submitting || !selectedParentId}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Associate Parent
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Detail Item Component
function DetailItem({ label, value, icon: Icon }: { label: string; value: string | null | undefined; icon?: any }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <p className="font-medium">{value || "Not provided"}</p>
      </div>
    </div>
  );
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  const [loadingClasses, setLoadingClasses] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [viewPaymentOpen, setViewPaymentOpen] = useState(false);

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

  const fetchPayments = useCallback(async () => {
    setLoadingPayments(true);
    try {
      const result = await getFeePayments({ studentId: id });

      if (Array.isArray(result)) {
        setPayments(result);
      } else if (result && typeof result === 'object' && 'data' in result && Array.isArray((result as any).data)) {
        setPayments((result as any).data);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoadingPayments(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  async function handleDownloadReceipt(paymentId: string) {
    try {
      const result = await getPaymentReceiptHTML(paymentId);

      if (result.success && result.data?.html) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(result.data.html);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.print();
          }, 500);
        } else {
          toast.error("Please allow popups to download receipt");
        }
        toast.success("Receipt generated successfully");
      } else {
        toast.error(result.error || "Failed to generate receipt");
      }
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast.error("Failed to download receipt");
    }
  }

  async function handleConsolidatedReceipt(studentId: string, paymentDate: Date) {
    try {
      const result = await getConsolidatedReceiptHTML(studentId, paymentDate);

      if (result.success && result.data?.html) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(result.data.html);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.print();
          }, 500);
        } else {
          toast.error("Please allow popups to download receipt");
        }
        toast.success(`Consolidated receipt generated (${result.data.paymentCount} payments)`);
      } else {
        toast.error(result.error || "Failed to generate consolidated receipt");
      }
    } catch (error) {
      console.error("Error generating consolidated receipt:", error);
      toast.error("Failed to generate consolidated receipt");
    }
  }





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

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex flex-wrap w-full h-auto">
          <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
          <TabsTrigger value="personal" className="flex-1">Personal Details</TabsTrigger>
          <TabsTrigger value="family" className="flex-1">Family Details</TabsTrigger>
          <TabsTrigger value="academic" className="flex-1">Academic</TabsTrigger>
          <TabsTrigger value="fees" className="flex-1">Fees</TabsTrigger>
          <TabsTrigger value="health" className="flex-1">Health</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
                <CardDescription>Basic personal and academic details</CardDescription>
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
                    <DetailItem label="Full Name" value={`${student.user.firstName} ${student.user.lastName}`} />
                    <DetailItem label="Email" value={student.user.email} icon={Mail} />
                    <DetailItem label="Phone" value={student.user.phone} icon={Phone} />
                    <DetailItem label="Date of Birth" value={formatDate(student.dateOfBirth)} icon={Calendar} />
                    <DetailItem label="Gender" value={student.gender} icon={User} />
                    <DetailItem label="Blood Group" value={student.bloodGroup} icon={Heart} />
                    <DetailItem label="Height" value={student.height ? `${student.height} cm` : "N/A"} icon={Ruler} />
                    <DetailItem label="Weight" value={student.weight ? `${student.weight} kg` : "N/A"} icon={Scale} />
                    <DetailItem label="Admission ID" value={student.admissionId} />
                    <DetailItem label="Admission Date" value={formatDate(student.admissionDate)} />
                    <div className="col-span-2">
                      <DetailItem label="Address" value={student.address} icon={MapPin} />
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
                    <DetailItem label="Roll Number" value={currentEnrollment.rollNumber || student.rollNumber} />
                    <DetailItem label="Enrollment Date" value={formatDate(currentEnrollment.enrollDate)} />
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
          </div>

          {/* Attendance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
              <CardDescription>Last 10 recorded days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-8 mb-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Present</p>
                  <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Late</p>
                  <p className="text-2xl font-bold text-yellow-600">{lateCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Attendance Rate</p>
                  <p className="text-2xl font-bold">{attendancePercentage}%</p>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden max-w-md">
                <div
                  className="bg-green-500 h-3"
                  style={{ width: `${attendancePercentage}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personal Details Tab */}
        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Indian-Specific Details</CardTitle>
              <CardDescription>National identification and background information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DetailItem label="Aadhaar Number" value={student.aadhaarNumber} icon={CreditCard} />
                <DetailItem label="APAAR ID" value={student.apaarId} />
                <DetailItem label="PEN" value={student.pen} />
                <DetailItem label="ABC ID" value={student.abcId} icon={FileText} />
                <DetailItem label="Nationality" value={student.nationality} />
                <DetailItem label="Religion" value={student.religion} />
                <DetailItem label="Caste" value={student.caste} />
                <DetailItem label="Category" value={student.category} />
                <DetailItem label="Mother Tongue" value={student.motherTongue} />
                <DetailItem label="Birth Place" value={student.birthPlace} icon={MapPin} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailItem label="Emergency Contact" value={student.emergencyContact} />
                <DetailItem label="Emergency Phone" value={student.emergencyPhone} icon={Phone} />
                <div className="md:col-span-2">
                  <DetailItem label="Address" value={student.address} icon={MapPin} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Previous Education</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DetailItem label="Previous School" value={student.previousSchool} icon={Building} />
                <DetailItem label="Previous Class" value={student.previousClass} />
                <DetailItem label="TC Number" value={student.tcNumber} icon={FileText} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Family Details Tab */}
        <TabsContent value="family" className="space-y-4">
          {/* Parent/Guardian Accounts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Parent/Guardian Accounts</CardTitle>
                <CardDescription>Associated parent accounts in the system</CardDescription>
              </div>
              <AddParentDialog
                studentId={student.id}
                studentName={`${student.user.firstName} ${student.user.lastName}`}
                onSuccess={fetchStudentDetails}
              />
            </CardHeader>
            <CardContent>
              {student.parents && student.parents.length > 0 ? (
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
                <div className="text-center p-8 border rounded-md border-dashed">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No parent accounts associated with this student</p>
                  <AddParentDialog
                    studentId={student.id}
                    studentName={`${student.user.firstName} ${student.user.lastName}`}
                    onSuccess={fetchStudentDetails}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Father's Details */}
          <Card>
            <CardHeader>
              <CardTitle>Father&apos;s Details</CardTitle>
              <CardDescription>Information stored in student record</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DetailItem label="Name" value={student.fatherName} icon={User} />
                <DetailItem label="Occupation" value={student.fatherOccupation} />
                <DetailItem label="Phone" value={student.fatherPhone} icon={Phone} />
                <DetailItem label="Email" value={student.fatherEmail} icon={Mail} />
                <DetailItem label="Aadhaar Number" value={student.fatherAadhaar} icon={CreditCard} />
              </div>
            </CardContent>
          </Card>

          {/* Mother's Details */}
          <Card>
            <CardHeader>
              <CardTitle>Mother&apos;s Details</CardTitle>
              <CardDescription>Information stored in student record</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DetailItem label="Name" value={student.motherName} icon={User} />
                <DetailItem label="Occupation" value={student.motherOccupation} />
                <DetailItem label="Phone" value={student.motherPhone} icon={Phone} />
                <DetailItem label="Email" value={student.motherEmail} icon={Mail} />
                <DetailItem label="Aadhaar Number" value={student.motherAadhaar} icon={CreditCard} />
              </div>
            </CardContent>
          </Card>

          {/* Guardian's Details */}
          {(student.guardianName || student.guardianPhone || student.guardianEmail) && (
            <Card>
              <CardHeader>
                <CardTitle>Guardian&apos;s Details</CardTitle>
                <CardDescription>Alternative guardian information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <DetailItem label="Name" value={student.guardianName} icon={User} />
                  <DetailItem label="Relation" value={student.guardianRelation} />
                  <DetailItem label="Phone" value={student.guardianPhone} icon={Phone} />
                  <DetailItem label="Email" value={student.guardianEmail} icon={Mail} />
                  <DetailItem label="Aadhaar Number" value={student.guardianAadhaar} icon={CreditCard} />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Fees Tab */}
        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fee Payment History</CardTitle>
              <CardDescription>View and download receipts for all fee payments</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <PaymentsTable
                  payments={payments}
                  onView={(payment) => {
                    setSelectedPayment(payment);
                    setViewPaymentOpen(true);
                  }}
                  onEdit={() => { }} // Read-only view
                  onDelete={() => { }} // Read-only view
                  emptyMessage="No payment records found for this student"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Tab */}
        <TabsContent value="academic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Exam Results</CardTitle>
              <CardDescription>Performance in the latest examinations</CardDescription>
            </CardHeader>
            <CardContent>
              {student.examResults && student.examResults.length > 0 ? (
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
                <div className="text-center p-8">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No exam results recorded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Health Information</CardTitle>
              <CardDescription>Medical conditions and special requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Blood Group</p>
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {student.bloodGroup || "Not specified"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Height</p>
                  <p className="font-medium text-lg">{student.height ? `${student.height} cm` : "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Weight</p>
                  <p className="font-medium text-lg">{student.weight ? `${student.weight} kg` : "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Emergency Contact</p>
                  <p className="font-medium">{student.emergencyContact || "Not provided"}</p>
                  <p className="text-sm text-muted-foreground">{student.emergencyPhone || ""}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Medical Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {student.medicalConditions || "No medical conditions reported"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Special Needs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {student.specialNeeds || "No special needs reported"}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

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

      <Dialog open={viewPaymentOpen} onOpenChange={setViewPaymentOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Receipt Number</h4>
                  <p className="font-mono">{selectedPayment.receiptNumber || "Pending"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Date</h4>
                  <p>{formatDate(selectedPayment.paymentDate)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Amount</h4>
                  <p className="font-semibold text-lg">₹{selectedPayment.paidAmount.toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                  <Badge className={selectedPayment.status === "COMPLETED" ? "bg-green-100 text-green-800" : ""}>
                    {selectedPayment.status}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Fee Structure</h4>
                  <p>{selectedPayment.feeStructure?.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Payment Method</h4>
                  <p>{selectedPayment.paymentMethod}</p>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="secondary"
                  onClick={() => handleConsolidatedReceipt(selectedPayment.studentId, new Date(selectedPayment.paymentDate))}
                  disabled={selectedPayment.status !== "COMPLETED"}
                >
                  <Download className="mr-2 h-4 w-4" />
                  All Day Receipts
                </Button>
                <Button
                  onClick={() => handleDownloadReceipt(selectedPayment.id)}
                  disabled={selectedPayment.status !== "COMPLETED"}
                >
                  <Download className="mr-2 h-4 w-4" />
                  This Receipt
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
