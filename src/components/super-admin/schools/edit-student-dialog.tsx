"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateStudentSchema, UpdateStudentFormData } from "@/lib/schemaValidation/usersSchemaValidation";
import { updateStudent, getStudentById } from "@/lib/actions/usersAction";
import { UserRole } from "@prisma/client";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface EditStudentDialogProps {
    student: { id: string } | null; // Minimal prop
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditStudentDialog({ student, open, onOpenChange }: EditStudentDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const form = useForm<UpdateStudentFormData>({
        resolver: zodResolver(updateStudentSchema),
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
            gender: "Male",
            schoolId: "",
        },
    });

    useEffect(() => {
        if (open && student) {
            const fetchData = async () => {
                setIsLoading(true);
                const fullStudent = await getStudentById(student.id);
                if (fullStudent) {
                    form.reset({
                        firstName: fullStudent.user.firstName || "",
                        lastName: fullStudent.user.lastName || "",
                        email: fullStudent.user.email || "",
                        phone: fullStudent.user.phone || "",
                        role: UserRole.STUDENT,
                        active: fullStudent.user.isActive ?? true,
                        admissionId: fullStudent.admissionId || "",
                        admissionDate: fullStudent.admissionDate ? new Date(fullStudent.admissionDate) : new Date(),
                        rollNumber: fullStudent.rollNumber || "",
                        dateOfBirth: fullStudent.dateOfBirth ? new Date(fullStudent.dateOfBirth) : new Date(),
                        gender: fullStudent.gender || "Male",
                        schoolId: fullStudent.schoolId || "",
                    });
                }
                setIsLoading(false);
            };
            fetchData();
        }
    }, [open, student, form]);

    const onSubmit = async (data: UpdateStudentFormData) => {
        if (!student) return;
        try {
            setIsSubmitting(true);
            await updateStudent(student.id, data);
            toast.success("Student updated successfully");
            onOpenChange(false);
            router.refresh();
        } catch (error: any) {
            console.error("Error updating student:", error);
            toast.error(error.message || "Failed to update student");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold dark:text-white">Edit Student</DialogTitle>
                    <DialogDescription className="dark:text-gray-400">
                        Update student details.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="dark:text-gray-300">First Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} className="dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
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
                                        <FormLabel className="dark:text-gray-300">Last Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} className="dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
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
                                        <FormLabel className="dark:text-gray-300">Phone</FormLabel>
                                        <FormControl>
                                            <Input {...field} className="dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
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
                                        <FormLabel className="dark:text-gray-300">Email</FormLabel>
                                        <FormControl>
                                            <Input {...field} className="dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="admissionId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="dark:text-gray-300">Admission ID</FormLabel>
                                        <FormControl>
                                            <Input {...field} className="dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
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
                                        <FormLabel className="dark:text-gray-300">Roll Number</FormLabel>
                                        <FormControl>
                                            <Input {...field} className="dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="dark:bg-transparent dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
