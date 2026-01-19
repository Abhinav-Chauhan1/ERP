"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateStudent, updateUserPassword } from "@/lib/actions/usersAction";
import { getStudentWithDetails } from "@/lib/actions/studentActions";
import { UserRole } from "@prisma/client";
import { z } from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AnimatedDatePicker } from "@/components/ui/animated-date-picker";
import { StudentAvatarUpload } from "@/components/admin/student-avatar-upload";

// Create a standalone edit schema
const editStudentSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.literal(UserRole.STUDENT),
  active: z.boolean(),
  admissionId: z.string().min(1, "Admission ID is required"),
  admissionDate: z.date({
    required_error: "Admission date is required",
    invalid_type_error: "Admission date must be a valid date",
  }),
  rollNumber: z.string().optional(),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
    invalid_type_error: "Date of birth must be a valid date",
  }),
  gender: z.string().min(1, "Gender is required"),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  height: z.coerce.number().optional(),
  weight: z.coerce.number().optional(),

  // Indian-specific fields
  aadhaarNumber: z.string().max(12, "Aadhaar number must be 12 digits").optional(),
  apaarId: z.string().max(50, "APAAR ID must be 50 characters or less").optional(),
  pen: z.string().max(50, "PEN must be 50 characters or less").optional(),
  abcId: z.string().max(50, "ABC ID must be 50 characters or less").optional(),
  nationality: z.string().optional(),
  religion: z.string().optional(),
  caste: z.string().optional(),
  category: z.string().optional(),
  motherTongue: z.string().optional(),
  birthPlace: z.string().optional(),
  previousSchool: z.string().optional(),
  previousClass: z.string().optional(),
  tcNumber: z.string().optional(),
  medicalConditions: z.string().optional(),
  specialNeeds: z.string().optional(),

  // Parent/Guardian details
  fatherName: z.string().optional(),
  fatherOccupation: z.string().optional(),
  fatherPhone: z.string().optional(),
  fatherEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  fatherAadhaar: z.string().max(12, "Aadhaar must be 12 digits").optional(),
  motherName: z.string().optional(),
  motherOccupation: z.string().optional(),
  motherPhone: z.string().optional(),
  motherEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  motherAadhaar: z.string().max(12, "Aadhaar must be 12 digits").optional(),
  guardianName: z.string().optional(),
  guardianRelation: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  guardianAadhaar: z.string().max(12, "Aadhaar must be 12 digits").optional(),
});

type EditStudentFormData = z.infer<typeof editStudentSchema>;

export default function EditStudentPage() {
  const params = useParams();
  const id = params.id as string;

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [studentAvatar, setStudentAvatar] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>("");

  const handlePasswordUpdate = async () => {
    try {
      if (!newPassword) return;
      if (!userId) {
        toast.error("User ID not found");
        return;
      }
      setPasswordLoading(true);
      await updateUserPassword(userId, newPassword);
      toast.success("Password updated successfully");
      setNewPassword("");
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast.error(error.message || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const form = useForm<EditStudentFormData>({
    resolver: zodResolver(editStudentSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: UserRole.STUDENT,
      active: true,
      admissionId: "",
      admissionDate: new Date(),
      rollNumber: "",
      dateOfBirth: new Date(),
      gender: "",
      address: "",
      bloodGroup: "",
      height: undefined,
      weight: undefined,
      emergencyContact: "",
      emergencyPhone: "",
      // Indian-specific fields
      aadhaarNumber: "",
      apaarId: "",
      pen: "",
      abcId: "",
      nationality: "",
      religion: "",
      caste: "",
      category: "",
      motherTongue: "",
      birthPlace: "",
      previousSchool: "",
      previousClass: "",
      tcNumber: "",
      medicalConditions: "",
      specialNeeds: "",
      // Parent/Guardian details
      fatherName: "",
      fatherOccupation: "",
      fatherPhone: "",
      fatherEmail: "",
      fatherAadhaar: "",
      motherName: "",
      motherOccupation: "",
      motherPhone: "",
      motherEmail: "",
      motherAadhaar: "",
      guardianName: "",
      guardianRelation: "",
      guardianPhone: "",
      guardianEmail: "",
      guardianAadhaar: "",
    },
  });

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        console.log("Fetching student with ID:", id);

        const student = await getStudentWithDetails(id);
        console.log("Fetched student data:", student);

        if (!student) {
          console.error("Student not found with ID:", id);
          setError("Student not found");
          return;
        }

        setUserId(student.userId);
        setStudentAvatar(student.user.avatar || null);
        setStudentName(`${student.user.firstName} ${student.user.lastName}`);

        form.reset({
          firstName: student.user.firstName,
          lastName: student.user.lastName,
          email: student.user.email,
          phone: student.user.phone || "",
          role: UserRole.STUDENT,
          active: student.user.active ?? true,
          admissionId: student.admissionId,
          admissionDate: new Date(student.admissionDate),
          rollNumber: student.rollNumber || "",
          dateOfBirth: new Date(student.dateOfBirth),
          gender: student.gender || "",
          address: student.address || "",
          bloodGroup: student.bloodGroup || "",
          height: student.height || undefined,
          weight: student.weight || undefined,
          emergencyContact: student.emergencyContact || "",
          emergencyPhone: student.emergencyPhone || "",
          // Indian-specific fields
          aadhaarNumber: student.aadhaarNumber || "",
          apaarId: student.apaarId || "",
          pen: student.pen || "",
          abcId: student.abcId || "",
          nationality: student.nationality || "",
          religion: student.religion || "",
          caste: student.caste || "",
          category: student.category || "",
          motherTongue: student.motherTongue || "",
          birthPlace: student.birthPlace || "",
          previousSchool: student.previousSchool || "",
          previousClass: student.previousClass || "",
          tcNumber: student.tcNumber || "",
          medicalConditions: student.medicalConditions || "",
          specialNeeds: student.specialNeeds || "",
          // Parent/Guardian details
          fatherName: student.fatherName || "",
          fatherOccupation: student.fatherOccupation || "",
          fatherPhone: student.fatherPhone || "",
          fatherEmail: student.fatherEmail || "",
          fatherAadhaar: student.fatherAadhaar || "",
          motherName: student.motherName || "",
          motherOccupation: student.motherOccupation || "",
          motherPhone: student.motherPhone || "",
          motherEmail: student.motherEmail || "",
          motherAadhaar: student.motherAadhaar || "",
          guardianName: student.guardianName || "",
          guardianRelation: student.guardianRelation || "",
          guardianPhone: student.guardianPhone || "",
          guardianEmail: student.guardianEmail || "",
          guardianAadhaar: student.guardianAadhaar || "",
        });
      } catch (err) {
        console.error("Error fetching student:", err);
        setError("Failed to fetch student details");
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id, form]);

  const onSubmit = async (data: EditStudentFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await updateStudent(id, data);
      toast.success("Student updated successfully");
      router.push(`/admin/users/students/${id}`);
    } catch (error: any) {
      console.error("Error updating student:", error);

      let errorMessage = "Failed to update student. Please try again.";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href={`/admin/users/students/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Student Details
          </Button>
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Edit Student</h1>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
          <CardDescription>Update student details</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                {/* Profile Photo Section */}
                <div className="flex justify-center pb-4 border-b">
                  <StudentAvatarUpload
                    studentId={id}
                    currentAvatar={studentAvatar}
                    studentName={studentName}
                    onSuccess={(avatarUrl) => setStudentAvatar(avatarUrl)}
                  />
                </div>

                <h3 className="text-lg font-medium">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="First name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Account Status</FormLabel>
                        <FormDescription>
                          Disable to temporarily prevent student from accessing the system
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Separator className="my-4" />

                <h3 className="text-lg font-medium">Admission Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="admissionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admission ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Admission ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rollNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roll Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Roll Number" value={field.value || ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="admissionDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Admission Date</FormLabel>
                        <AnimatedDatePicker
                          date={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          startYear={2000}
                          endYear={new Date().getFullYear() + 1}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date of Birth</FormLabel>
                        <AnimatedDatePicker
                          date={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          startYear={1950}
                          endYear={new Date().getFullYear()}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bloodGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blood Group</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select blood group" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="A+">A+</SelectItem>
                            <SelectItem value="A-">A-</SelectItem>
                            <SelectItem value="B+">B+</SelectItem>
                            <SelectItem value="B-">B-</SelectItem>
                            <SelectItem value="AB+">AB+</SelectItem>
                            <SelectItem value="AB-">AB-</SelectItem>
                            <SelectItem value="O+">O+</SelectItem>
                            <SelectItem value="O-">O-</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Height (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Height in cm" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Weight in kg" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Full address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="emergencyContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Emergency contact name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emergencyPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Emergency phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator className="my-4" />

                <h3 className="text-lg font-medium">Indian-Specific Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="aadhaarNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aadhaar Number</FormLabel>
                        <FormControl>
                          <Input placeholder="12-digit Aadhaar" maxLength={12} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="apaarId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>APAAR ID</FormLabel>
                        <FormControl>
                          <Input placeholder="One Nation One Student ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pen"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PEN (UDISE+)</FormLabel>
                        <FormControl>
                          <Input placeholder="Permanent Education Number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="abcId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ABC ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Academic Bank of Credits ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality</FormLabel>
                        <FormControl>
                          <Input placeholder="Nationality" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="religion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Religion</FormLabel>
                        <FormControl>
                          <Input placeholder="Religion" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="caste"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Caste</FormLabel>
                        <FormControl>
                          <Input placeholder="Caste" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="General">General</SelectItem>
                            <SelectItem value="OBC">OBC</SelectItem>
                            <SelectItem value="SC">SC</SelectItem>
                            <SelectItem value="ST">ST</SelectItem>
                            <SelectItem value="EWS">EWS</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="motherTongue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mother Tongue</FormLabel>
                        <FormControl>
                          <Input placeholder="Mother tongue" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="birthPlace"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birth Place</FormLabel>
                        <FormControl>
                          <Input placeholder="Place of birth" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="my-4" />

                <h3 className="text-lg font-medium">Previous Education</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="previousSchool"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Previous School</FormLabel>
                        <FormControl>
                          <Input placeholder="Previous school name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="previousClass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Previous Class</FormLabel>
                        <FormControl>
                          <Input placeholder="Previous class/grade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tcNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TC Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Transfer Certificate number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="my-4" />

                <h3 className="text-lg font-medium">Health Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="medicalConditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medical Conditions</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Any medical conditions (allergies, chronic illnesses, etc.)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="specialNeeds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Needs</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Any special needs or requirements" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="my-4" />

                <h3 className="text-lg font-medium">Father&apos;s Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="fatherName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Father&apos;s Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Father's full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fatherOccupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Occupation</FormLabel>
                        <FormControl>
                          <Input placeholder="Father's occupation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fatherPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Father's phone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fatherEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Father's email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fatherAadhaar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aadhaar Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Father's Aadhaar" maxLength={12} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="my-4" />

                <h3 className="text-lg font-medium">Mother&apos;s Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="motherName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mother&apos;s Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Mother's full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="motherOccupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Occupation</FormLabel>
                        <FormControl>
                          <Input placeholder="Mother's occupation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="motherPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Mother's phone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="motherEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Mother's email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="motherAadhaar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aadhaar Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Mother's Aadhaar" maxLength={12} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="my-4" />

                <h3 className="text-lg font-medium">Guardian&apos;s Details (Optional)</h3>
                <p className="text-sm text-muted-foreground mb-4">Fill this section if guardian is different from parents</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="guardianName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guardian&apos;s Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Guardian's full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="guardianRelation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relation</FormLabel>
                        <FormControl>
                          <Input placeholder="Relation with student" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="guardianPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Guardian's phone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="guardianEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Guardian's email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="guardianAadhaar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aadhaar Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Guardian's Aadhaar" maxLength={12} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/admin/users/students/${id}`)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Manage account security settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Reset Password</h3>
                <p className="text-sm text-muted-foreground">
                  Send a password reset link to the student
                </p>
              </div>
              <Button variant="outline">Send Reset Link</Button>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Manual Password Update</h3>
                <p className="text-sm text-muted-foreground">
                  Manually set a new password for this user
                </p>
              </div>
              <div className="flex items-end gap-4 max-w-md">
                <div className="grid w-full gap-1.5">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="text"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handlePasswordUpdate}
                  disabled={passwordLoading || !newPassword}
                >
                  {passwordLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Update"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
