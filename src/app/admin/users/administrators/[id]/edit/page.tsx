"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateAdministrator } from "@/lib/actions/usersAction";
import { getAdministratorWithDetails } from "@/lib/actions/administratorActions";
import { UserRole } from "@prisma/client";
import { z } from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Create a standalone edit schema instead of using omit
const editAdministratorSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.literal(UserRole.ADMIN),
  active: z.boolean(),
  position: z.string().optional(),

});

type EditAdministratorFormData = z.infer<typeof editAdministratorSchema>;

interface EditAdministratorPageProps {
  params: Promise<{ id: string }>;
}

export default function EditAdministratorPage({ params }: EditAdministratorPageProps) {
  const { id } = use(params);

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EditAdministratorFormData>({
    resolver: zodResolver(editAdministratorSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: UserRole.ADMIN,
      active: true,
      position: "",

    },
  });

  useEffect(() => {
    const fetchAdministrator = async () => {
      try {
        setLoading(true);
        const administrator = await getAdministratorWithDetails(id);

        if (!administrator) {
          toast.error("Administrator not found");
          router.push("/admin/users/administrators");
          return;
        }

        form.reset({
          firstName: administrator.user.firstName,
          lastName: administrator.user.lastName,
          email: administrator.user.email,
          phone: administrator.user.phone || "",
          role: UserRole.ADMIN,
          active: administrator.user.active,
          position: administrator.position || "",

        });
      } catch (error) {
        console.error("Error fetching administrator:", error);
        toast.error("Failed to load administrator data");
      } finally {
        setLoading(false);
      }
    };

    fetchAdministrator();
  }, [id, router, form]);

  const onSubmit = async (data: EditAdministratorFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await updateAdministrator(id, data);
      toast.success("Administrator updated successfully");
      router.push(`/admin/users/administrators/${id}`);
    } catch (error: any) {
      console.error("Error updating administrator:", error);

      let errorMessage = "Failed to update administrator. Please try again.";

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
        <Link href={`/admin/users/administrators/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Administrator Details
          </Button>
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Edit Administrator</h1>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Administrator Information</CardTitle>
          <CardDescription>Update administrator details</CardDescription>
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
                          Disable to temporarily prevent user from accessing the system
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

                <h3 className="text-lg font-medium">Administrative Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position</FormLabel>
                        <FormControl>
                          <Input placeholder="Position" {...field} />
                        </FormControl>
                        <FormDescription>
                          The administrative position (e.g., Principal, Vice Principal)
                        </FormDescription>
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
                  onClick={() => router.push(`/admin/users/administrators/${id}`)}
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
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Reset Password</h3>
              <p className="text-sm text-muted-foreground">
                Send a password reset link to the administrator
              </p>
            </div>
            <Button variant="outline">Send Reset Link</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
