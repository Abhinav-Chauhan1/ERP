"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createParentSchema, CreateParentFormData } from "@/lib/schemaValidation/usersSchemaValidation";
import { createParent } from "@/lib/actions/usersAction";
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
import { UserPlus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface AddParentDialogProps {
    schoolId: string;
}

export function AddParentDialog({ schoolId }: AddParentDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    // Note: CreateParentFormData might need adjustment if it doesn't support 'schoolId' directly in schema
    // But usually parent creation is linked to school context or children.
    // For now, assuming basic user creation + parent profile.
    const form = useForm<CreateParentFormData>({
        resolver: zodResolver(createParentSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            role: UserRole.PARENT,
            active: true,
            relation: "Father",
            occupation: "",
            alternatePhone: "",
            schoolId: schoolId,
        },
    });

    const onSubmit = async (data: CreateParentFormData) => {
        try {
            setIsSubmitting(true);
            data.schoolId = schoolId;

            await createParent(data);

            toast.success("Parent created successfully");
            setOpen(false);
            form.reset();
            router.refresh();
        } catch (error: any) {
            console.error("Error creating parent:", error);
            toast.error(error.message || "Failed to create parent");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Parent
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold dark:text-white">Add New Parent</DialogTitle>
                    <DialogDescription className="dark:text-gray-400">
                        Create a new parent account. Link students later.
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
                                    name="relation"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="dark:text-gray-300">Relation</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Father, Mother" {...field} className="dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="occupation"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="dark:text-gray-300">Occupation</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Occupation" {...field} className="dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <FormField
                                control={form.control}
                                name="alternatePhone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="dark:text-gray-300">Alternate Phone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Alternate Phone" {...field} className="dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="dark:bg-transparent dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Create Parent
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
