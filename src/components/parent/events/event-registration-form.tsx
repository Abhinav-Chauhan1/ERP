"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { registerForEvent } from "@/lib/actions/parent-event-actions";

const registrationSchema = z.object({
  childId: z.string().min(1, { message: "Please select a child" }),
  eventId: z.string().min(1, { message: "Event ID is required" }),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

interface EventRegistrationFormProps {
  eventId: string;
  eventTitle: string;
  schoolId: string;
  children: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  }[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function EventRegistrationForm({
  eventId,
  eventTitle,
  schoolId,
  children,
  onSuccess,
  onCancel,
}: EventRegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      eventId,
      childId: children.length === 1 ? children[0].id : "",
    },
  });

  const onSubmit = async (data: RegistrationFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await registerForEvent(data, schoolId);
      
      if (result.success) {
        toast.success(result.message || "Successfully registered for the event");
        onSuccess();
      } else {
        toast.error(result.message || "Failed to register for the event");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">Register for Event</h3>
        <p className="text-sm text-gray-600">{eventTitle}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="childId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Child</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a child to register" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.user.firstName} {child.user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose which child you want to register for this event
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Registering..." : "Register"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
