"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarEvent, CalendarEventCategory, UserRole } from "@prisma/client";
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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Form validation schema
const eventFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  startDate: z.string().min(1, "Start date is required"),
  startTime: z.string().optional(),
  endDate: z.string().min(1, "End date is required"),
  endTime: z.string().optional(),
  isAllDay: z.boolean().default(false),
  location: z.string().optional(),
  visibleToRoles: z.array(z.string()).min(1, "At least one role must be selected"),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventFormModalProps {
  event?: CalendarEvent | null;
  categories: CalendarEventCategory[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  className?: string;
}

const USER_ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "TEACHER", label: "Teacher" },
  { value: "STUDENT", label: "Student" },
  { value: "PARENT", label: "Parent" },
];

/**
 * EventFormModal Component
 * 
 * Form for creating and editing calendar events.
 * Admin-only component with full event management capabilities.
 * 
 * Features:
 * - Create/Edit event form
 * - Category selection
 * - Date/Time pickers
 * - Recurrence configuration
 * - Visibility settings
 * - Form validation
 * 
 * Requirements: 1.1
 */
export function EventFormModal({
  event,
  categories,
  isOpen,
  onClose,
  onSave,
  className,
}: EventFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!event;

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      isAllDay: false,
      location: "",
      visibleToRoles: [],
      isRecurring: false,
      recurrenceRule: "",
    },
  });

  const isAllDay = form.watch("isAllDay");
  const isRecurring = form.watch("isRecurring");

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (event) {
        // Format dates for input fields
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);

        form.reset({
          title: event.title,
          description: event.description || "",
          categoryId: event.categoryId,
          startDate: startDate.toISOString().split("T")[0],
          startTime: event.isAllDay ? "" : startDate.toTimeString().slice(0, 5),
          endDate: endDate.toISOString().split("T")[0],
          endTime: event.isAllDay ? "" : endDate.toTimeString().slice(0, 5),
          isAllDay: event.isAllDay,
          location: event.location || "",
          visibleToRoles: event.visibleToRoles,
          isRecurring: event.isRecurring,
          recurrenceRule: event.recurrenceRule || "",
        });
      } else {
        // Set default values for new event
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        form.reset({
          title: "",
          description: "",
          categoryId: categories[0]?.id || "",
          startDate: tomorrow.toISOString().split("T")[0],
          startTime: "09:00",
          endDate: tomorrow.toISOString().split("T")[0],
          endTime: "10:00",
          isAllDay: false,
          location: "",
          visibleToRoles: ["ADMIN"],
          isRecurring: false,
          recurrenceRule: "",
        });
      }
    }
  }, [isOpen, event, categories, form]);

  const onSubmit = async (values: EventFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Combine date and time
      const startDateTime = values.isAllDay
        ? new Date(values.startDate)
        : new Date(`${values.startDate}T${values.startTime}`);

      const endDateTime = values.isAllDay
        ? new Date(values.endDate)
        : new Date(`${values.endDate}T${values.endTime}`);

      // Validate date range
      if (endDateTime <= startDateTime) {
        setError("End date/time must be after start date/time");
        setIsSubmitting(false);
        return;
      }

      const eventData = {
        title: values.title,
        description: values.description,
        categoryId: values.categoryId,
        startDate: startDateTime,
        endDate: endDateTime,
        isAllDay: values.isAllDay,
        location: values.location,
        visibleToRoles: values.visibleToRoles,
        isRecurring: values.isRecurring,
        recurrenceRule: values.isRecurring ? values.recurrenceRule : undefined,
      };

      await onSave(eventData);
      onClose();
    } catch (err) {
      console.error("Error submitting event form:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={cn("sm:max-w-[600px] max-h-[90vh] overflow-y-auto", className)}
        aria-describedby="event-form-description"
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Event" : "Create New Event"}
          </DialogTitle>
          <DialogDescription id="event-form-description">
            {isEditing
              ? "Update the details of this calendar event"
              : "Add a new event to the academic calendar"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" role="alert">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            aria-label={isEditing ? "Edit event form" : "Create event form"}
          >
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="event-title">Event Title *</FormLabel>
                  <FormControl>
                    <Input
                      id="event-title"
                      placeholder="e.g. Mid-term Exam"
                      {...field}
                      disabled={isSubmitting}
                      aria-required="true"
                    />
                  </FormControl>
                  <FormMessage role="alert" />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="event-category">Category *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger id="event-category" aria-required="true">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage role="alert" />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="event-description">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      id="event-description"
                      placeholder="Event details..."
                      rows={3}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage role="alert" />
                </FormItem>
              )}
            />

            {/* All Day Checkbox */}
            <FormField
              control={form.control}
              name="isAllDay"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      id="is-all-day"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel htmlFor="is-all-day" className="cursor-pointer">
                      All Day Event
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="start-date">Start Date *</FormLabel>
                    <FormControl>
                      <Input
                        id="start-date"
                        type="date"
                        {...field}
                        disabled={isSubmitting}
                        aria-required="true"
                      />
                    </FormControl>
                    <FormMessage role="alert" />
                  </FormItem>
                )}
              />

              {!isAllDay && (
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="start-time">Start Time *</FormLabel>
                      <FormControl>
                        <Input
                          id="start-time"
                          type="time"
                          {...field}
                          disabled={isSubmitting}
                          aria-required="true"
                        />
                      </FormControl>
                      <FormMessage role="alert" />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="end-date">End Date *</FormLabel>
                    <FormControl>
                      <Input
                        id="end-date"
                        type="date"
                        {...field}
                        disabled={isSubmitting}
                        aria-required="true"
                      />
                    </FormControl>
                    <FormMessage role="alert" />
                  </FormItem>
                )}
              />

              {!isAllDay && (
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="end-time">End Time *</FormLabel>
                      <FormControl>
                        <Input
                          id="end-time"
                          type="time"
                          {...field}
                          disabled={isSubmitting}
                          aria-required="true"
                        />
                      </FormControl>
                      <FormMessage role="alert" />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="event-location">Location</FormLabel>
                  <FormControl>
                    <Input
                      id="event-location"
                      placeholder="e.g. Main Hall"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage role="alert" />
                </FormItem>
              )}
            />

            {/* Visible to Roles */}
            <FormField
              control={form.control}
              name="visibleToRoles"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Visible to Roles *</FormLabel>
                    <FormDescription>
                      Select which user roles can see this event
                    </FormDescription>
                  </div>
                  <div className="space-y-2">
                    {USER_ROLES.map((role) => (
                      <FormField
                        key={role.value}
                        control={form.control}
                        name="visibleToRoles"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={role.value}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(role.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, role.value])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== role.value
                                          )
                                        );
                                  }}
                                  disabled={isSubmitting}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {role.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage role="alert" />
                </FormItem>
              )}
            />

            {/* Recurring Event */}
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      id="is-recurring"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel htmlFor="is-recurring" className="cursor-pointer">
                      Recurring Event
                    </FormLabel>
                    <FormDescription>
                      Event repeats on a regular schedule
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {isRecurring && (
              <FormField
                control={form.control}
                name="recurrenceRule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="recurrence-rule">
                      Recurrence Rule (iCal RRULE format)
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="recurrence-rule"
                        placeholder="e.g. FREQ=WEEKLY;BYDAY=MO,WE,FR"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Example: FREQ=WEEKLY;BYDAY=MO,WE,FR (Every Monday, Wednesday, Friday)
                    </FormDescription>
                    <FormMessage role="alert" />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{isEditing ? "Update Event" : "Create Event"}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
