"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateTeacherSchema, UpdateTeacherFormData } from "@/lib/schemaValidation/usersSchemaValidation";
import { updateTeacher, getTeacherById } from "@/lib/actions/usersAction";
import { UserRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface EditTeacherDialogProps {
    teacher: { id: string } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditTeacherDialog({ teacher, open, onOpenChange }: EditTeacherDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const form = useForm<UpdateTeacherFormData>({
        resolver: zodResolver(updateTeacherSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            role: UserRole.TEACHER,
            active: true,
            employeeId: "",
            qualification: "",
            schoolId: "",
            // Password fields are optional
        },
    });

    useEffect(() => {
        if (open && teacher) {
            const fetchData = async () => {
                setIsLoading(true);
                const fullTeacher = await getTeacherById(teacher.id);
                if (fullTeacher) {
                    form.reset({
                        firstName: fullTeacher.user.firstName || "",
                        lastName: fullTeacher.user.lastName || "",
                        email: fullTeacher.user.email || "",
                        phone: fullTeacher.user.phone || "",
                        role: UserRole.TEACHER,
                        active: fullTeacher.user.isActive ?? true,
                        employeeId: fullTeacher.employeeId || "",
                        qualification: fullTeacher.qualification || "",
                        joinDate: fullTeacher.joinDate ? new Date(fullTeacher.joinDate) : new Date(),
                        salary: fullTeacher.salary || undefined,
                        schoolId: fullTeacher.schoolId || "",
                    });
                }
                setIsLoading(false);
            };
            fetchData();
        }
    }, [open, teacher, form]);

    const onSubmit = async (data: UpdateTeacherFormData) => {
        if (!teacher) return;
        try {
            setIsSubmitting(true);
            await updateTeacher(teacher.id, data);
            toast.success("Teacher updated successfully");
            onOpenChange(false);
            router.refresh();
        } catch (error: any) {
            console.error("Error updating teacher:", error);
            toast.error(error.message || "Failed to update teacher");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold dark:text-white">Edit Teacher</DialogTitle>
                    <DialogDescription className="dark:text-gray-400">Update teacher details.</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                        {isLoading ? (
                            <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                        ) : (
                            <>
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
                                        name="employeeId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="dark:text-gray-300">Employee ID</FormLabel>
                                                <FormControl>
                                                    <Input {...field} className="dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="qualification"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="dark:text-gray-300">Qualification</FormLabel>
                                                <FormControl>
                                                    <Input {...field} className="dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="mb-2 font-medium">Change Password (Optional)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="dark:text-gray-300">New Password</FormLabel>
                                                    <FormControl>
                                                        <Input type="password" {...field} className="dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="confirmPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="dark:text-gray-300">Confirm Password</FormLabel>
                                                    <FormControl>
                                                        <Input type="password" {...field} className="dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
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
                            </>
                        )}
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
