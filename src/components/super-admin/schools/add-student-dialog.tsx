"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createStudentSchema, CreateStudentFormData } from "@/lib/schemaValidation/usersSchemaValidation";
import { createStudent } from "@/lib/actions/usersAction";
import { UserRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";

interface AddStudentDialogProps {
    schoolId: string;
}

export function AddStudentDialog({ schoolId }: AddStudentDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    // Class and Section state
    const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
    const [sections, setSections] = useState<Array<{ id: string; name: string }>>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [selectedSectionId, setSelectedSectionId] = useState<string>("");
    const [loadingClasses, setLoadingClasses] = useState(false);
    const [loadingSections, setLoadingSections] = useState(false);

    const form = useForm<CreateStudentFormData>({
        resolver: zodResolver(createStudentSchema),
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
            schoolId: schoolId, // Important: pass schoolId
        },
    });

    // Fetch classes when dialog opens
    useEffect(() => {
        if (open) {
            const fetchClasses = async () => {
                try {
                    setLoadingClasses(true);
                    // Note: This API might need to be scoped to the specific school if not implicitly handled
                    // Assuming /api/classes fetches for the current context, but for Super Admin we might need a specific endpoint
                    // For now, let's try the generic one, or fallback to an empty list if it fails.
                    const response = await fetch('/api/classes');
                    if (response.ok) {
                        const data = await response.json();
                        setClasses(data);
                    }
                } catch (error) {
                    console.error('Error fetching classes:', error);
                } finally {
                    setLoadingClasses(false);
                }
            };
            fetchClasses();
        }
    }, [open]);

    // Fetch sections when class is selected
    useEffect(() => {
        if (selectedClassId) {
            const fetchSections = async () => {
                try {
                    setLoadingSections(true);
                    setSections([]);
                    setSelectedSectionId("");
                    const response = await fetch(`/api/classes/${selectedClassId}/sections`);
                    if (response.ok) {
                        const data = await response.json();
                        setSections(data);
                    }
                } catch (error) {
                    console.error('Error fetching sections:', error);
                } finally {
                    setLoadingSections(false);
                }
            };
            fetchSections();
        } else {
            setSections([]);
            setSelectedSectionId("");
        }
    }, [selectedClassId]);


    const onSubmit = async (data: CreateStudentFormData) => {
        try {
            setIsSubmitting(true);

            // Ensure schoolId is set in the data
            data.schoolId = schoolId;

            const result = await createStudent(data);

            if (selectedClassId && selectedSectionId && result.student) {
                try {
                    const enrollmentResponse = await fetch('/api/students/enroll', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            studentId: result.student.id,
                            classId: selectedClassId,
                            sectionId: selectedSectionId,
                        }),
                    });
                    if (!enrollmentResponse.ok) {
                        toast.error("Student created, but enrollment failed.");
                    }
                } catch (e) {
                    console.error(e);
                    toast.error("Student created, but enrollment failed.");
                }
            }

            toast.success("Student created successfully");
            setOpen(false);
            form.reset();
            router.refresh(); // Refresh the page to show new student
        } catch (error: any) {
            console.error("Error creating student:", error);
            toast.error(error.message || "Failed to create student");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Student
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold dark:text-white">Add New Student</DialogTitle>
                    <DialogDescription className="dark:text-gray-400">
                        Create a new student account. They will be able to log in with their phone number.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">

                        <div className="space-y-4">
                            <h3 className="text-lg font-medium dark:text-gray-200 border-b dark:border-gray-700 pb-2">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="dark:text-gray-300">First Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="First Name" {...field} className="dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
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
                                                <Input placeholder="Last Name" {...field} className="dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
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
                                                <Input placeholder="Phone Number" {...field} className="dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
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
                                            <FormLabel className="dark:text-gray-300">Email (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Email" {...field} className="dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-medium dark:text-gray-200 border-b dark:border-gray-700 pb-2">Academic Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="admissionId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="dark:text-gray-300">Admission ID</FormLabel>
                                            <FormControl>
                                                <Input placeholder="ADM-001" {...field} className="dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
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
                                                <Input placeholder="Roll No" {...field} className="dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {/* Class Selector */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-300">Class</label>
                                    <Select
                                        value={selectedClassId}
                                        onValueChange={setSelectedClassId}
                                        disabled={loadingClasses}
                                    >
                                        <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                                            <SelectValue placeholder={loadingClasses ? "Loading..." : "Select Class"} />
                                        </SelectTrigger>
                                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                                            {classes.map((c) => (
                                                <SelectItem key={c.id} value={c.id} className="dark:text-white dark:focus:bg-gray-700">
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Section Selector */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-300">Section</label>
                                    <Select
                                        value={selectedSectionId}
                                        onValueChange={setSelectedSectionId}
                                        disabled={!selectedClassId || loadingSections}
                                    >
                                        <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                                            <SelectValue placeholder={loadingSections ? "Loading..." : "Select Section"} />
                                        </SelectTrigger>
                                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                                            {sections.map((s) => (
                                                <SelectItem key={s.id} value={s.id} className="dark:text-white dark:focus:bg-gray-700">
                                                    {s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="dark:bg-transparent dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Create Student
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
