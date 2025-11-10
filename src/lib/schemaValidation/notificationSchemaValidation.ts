import { z } from "zod";

// Notification Schema
export const notificationSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  message: z.string().min(1, "Message is required").max(1000, "Message must be less than 1000 characters"),
  type: z.enum(["INFO", "WARNING", "ALERT", "SUCCESS"], {
    required_error: "Notification type is required",
  }).default("INFO"),
  link: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  recipientRole: z.enum(["ALL", "STUDENT", "TEACHER", "PARENT", "ADMIN", "STAFF", "CUSTOM"], {
    required_error: "Recipient role is required",
  }).default("ALL"),
});

export type NotificationFormValues = z.infer<typeof notificationSchema>;

// Update Notification Schema
export const updateNotificationSchema = notificationSchema.extend({
  id: z.string(),
});

export type UpdateNotificationFormValues = z.infer<typeof updateNotificationSchema>;

// Bulk Notification Schema
export const bulkNotificationSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  message: z.string().min(1, "Message is required").max(1000, "Message must be less than 1000 characters"),
  type: z.enum(["INFO", "WARNING", "ALERT", "SUCCESS"]).default("INFO"),
  link: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  userIds: z.array(z.string()).min(1, "At least one recipient is required"),
});

export type BulkNotificationFormValues = z.infer<typeof bulkNotificationSchema>;
