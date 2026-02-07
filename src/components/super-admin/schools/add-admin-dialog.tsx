"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAdministratorSchema, CreateAdministratorFormData } from "@/lib/schemaValidation/usersSchemaValidation";
import { createAdministrator } from "@/lib/actions/usersAction";
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

interface AddAdminDialogProps {
    schoolId: string;
}

export function AddAdminDialog({ schoolId }: AddAdminDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const form = useForm<CreateAdministratorFormData>({
        resolver: zodResolver(createAdministratorSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            role: UserRole.ADMIN,
            active: true,
            position: "Administrator",
            schoolId: schoolId,
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (data: CreateAdministratorFormData) => {
        try {
            setIsSubmitting(true);
            data.schoolId = schoolId;

            await createAdministrator(data);

            toast.success("Administrator created successfully");
            setOpen(false);
            form.reset();
            router.refresh();
        } catch (error: any) {
            console.error("Error creating admin:", error);
            toast.error(error.message || "Failed to create administrator");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Administrator
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold dark:text-white">Add New Administrator</DialogTitle>
                    <DialogDescription className="dark:text-gray-400">
                        Create a new administrator account.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">

                        <div className="space-y-4">
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
                            </div>
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="dark:text-gray-300">Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Email" {...field} className="dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
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
                                name="position"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="dark:text-gray-300">Position</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Principal" {...field} className="dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="dark:text-gray-300">Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="********" {...field} className="dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
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
                                            <Input type="password" placeholder="********" {...field} className="dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
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
                                Create Administrator
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
