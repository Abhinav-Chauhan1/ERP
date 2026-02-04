"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createParentSchema, CreateParentFormData } from "@/lib/schemaValidation/usersSchemaValidation";
import { createParent } from "@/lib/actions/usersAction";
import { UserRole } from "@prisma/client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, Users, UserPlus } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function CreateParentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<any>(null);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [associateWithStudent, setAssociateWithStudent] = useState(!!studentId);
  const [isPrimaryContact, setIsPrimaryContact] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(studentId || "");
  const [studentSearch, setStudentSearch] = useState("");

  const form = useForm<CreateParentFormData>({
    resolver: zodResolver(createParentSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: UserRole.PARENT,
      active: true,
      occupation: "",
      alternatePhone: "",
      relation: "",
      // No password - mobile-only authentication
    },
  });

  // Fetch student details if studentId is provided
  useEffect(() => {
    if (studentId) {
      const fetchStudent = async () => {
        setLoadingStudent(true);
        try {
          const response = await fetch(`/api/students/${studentId}`);
          if (response.ok) {
            const data = await response.json();
            setStudent(data);
          }
        } catch (error) {
          console.error("Error fetching student:", error);
        } finally {
          setLoadingStudent(false);
        }
      };
      fetchStudent();
    }
  }, [studentId]);

  // Fetch all students when user wants to associate
  useEffect(() => {
    if (associateWithStudent && !studentId) {
      const fetchStudents = async () => {
        setLoadingStudents(true);
        try {
          const response = await fetch("/api/students");
          if (response.ok) {
            const data = await response.json();
            setStudents(data);
          }
        } catch (error) {
          console.error("Error fetching students:", error);
        } finally {
          setLoadingStudents(false);
        }
      };
      fetchStudents();
    }
  }, [associateWithStudent, studentId]);

  const onSubmit = async (data: CreateParentFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Create the parent
      const result = await createParent(data);

      // If we need to associate with a student
      const targetStudentId = studentId || selectedStudentId;
      if (associateWithStudent && targetStudentId && result.parent) {
        try {
          const response = await fetch("/api/students/associate-parent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId: targetStudentId,
              parentId: result.parent.id,
              isPrimary: isPrimaryContact
            })
          });

          if (!response.ok) {
            console.error("Failed to associate parent with student");
            toast.error("Parent created but failed to associate with student");
          }
        } catch (error) {
          console.error("Error associating parent:", error);
        }
      }

      toast.success("Parent created successfully");

      // Redirect back to student page if came from there, otherwise to parents list
      if (studentId) {
        router.push(`/admin/users/students/${studentId}`);
      } else {
        router.push("/admin/users/parents");
      }
    } catch (error: any) {
      console.error("Error creating parent:", error);

      let errorMessage = "Failed to create parent. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes('is unknown') || error.message.includes('Clerk')) {
          errorMessage = "There was an issue with the authentication service. Please check all fields and try again.";
        } else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href={studentId ? `/admin/users/students/${studentId}` : "/admin/users/parents"}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {studentId ? "Back to Student" : "Back to Parents"}
          </Button>
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Create Parent</h1>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Student Association Card */}
      {studentId && student && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Creating Parent for Student
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{student.user.firstName} {student.user.lastName}</p>
                <p className="text-sm text-muted-foreground">
                  Admission ID: {student.admissionId}
                  {student.enrollments?.[0] && ` • Class: ${student.enrollments[0].class.name}`}
                </p>
              </div>
              <Badge variant="outline">Will be associated</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Parent Information</CardTitle>
          <CardDescription>Add a new parent to the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
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
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Email address" {...field} />
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
                        <FormLabel>Phone (For Login)</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number for login" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="my-4" />

                <h3 className="text-lg font-medium">Parent Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Occupation</FormLabel>
                        <FormControl>
                          <Input placeholder="Occupation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="alternatePhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alternate Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Alternate phone number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Secondary contact number
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="relation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relation to Student</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select relation" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="FATHER">Father</SelectItem>
                            <SelectItem value="MOTHER">Mother</SelectItem>
                            <SelectItem value="GUARDIAN">Guardian</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="my-4" />

                {/* Student Association Section */}
                {!studentId && (
                  <>
                    <h3 className="text-lg font-medium">Student Association</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="associateStudent"
                          checked={associateWithStudent}
                          onCheckedChange={(checked) => setAssociateWithStudent(checked as boolean)}
                        />
                        <label htmlFor="associateStudent" className="text-sm font-medium cursor-pointer">
                          Associate with a student
                        </label>
                      </div>

                      {associateWithStudent && (
                        <div className="pl-6 space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Search Student</label>
                            {loadingStudents ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading students...
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  placeholder="Search by name or admission ID..."
                                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                  onChange={(e) => setStudentSearch(e.target.value.toLowerCase())}
                                />
                                <div className="max-h-48 overflow-y-auto border rounded-md">
                                  {students.length === 0 ? (
                                    <div className="p-4 text-sm text-muted-foreground text-center">
                                      No students found
                                    </div>
                                  ) : (
                                    students
                                      .filter((s) => {
                                        if (!studentSearch) return true;
                                        const fullName = `${s.user.firstName} ${s.user.lastName}`.toLowerCase();
                                        const admissionId = s.admissionId.toLowerCase();
                                        return fullName.includes(studentSearch) || admissionId.includes(studentSearch);
                                      })
                                      .slice(0, 50)
                                      .map((s) => (
                                        <div
                                          key={s.id}
                                          className={`p-3 cursor-pointer hover:bg-accent border-b last:border-b-0 ${selectedStudentId === s.id ? 'bg-primary/10' : ''}`}
                                          onClick={() => setSelectedStudentId(s.id)}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <p className="font-medium text-sm">{s.user.firstName} {s.user.lastName}</p>
                                              <p className="text-xs text-muted-foreground">ID: {s.admissionId}</p>
                                            </div>
                                            {selectedStudentId === s.id && (
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
                            <Checkbox
                              id="isPrimary"
                              checked={isPrimaryContact}
                              onCheckedChange={(checked) => setIsPrimaryContact(checked as boolean)}
                            />
                            <label htmlFor="isPrimary" className="text-sm cursor-pointer">
                              Set as primary contact
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator className="my-4" />
                  </>
                )}

                {/* Primary contact checkbox when coming from student page */}
                {studentId && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isPrimary"
                      checked={isPrimaryContact}
                      onCheckedChange={(checked) => setIsPrimaryContact(checked as boolean)}
                    />
                    <label htmlFor="isPrimary" className="text-sm font-medium cursor-pointer">
                      Set as primary contact for the student
                    </label>
                  </div>
                )}

              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(studentId ? `/admin/users/students/${studentId}` : "/admin/users/parents")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Parent
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
