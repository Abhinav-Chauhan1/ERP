import { z } from "zod";

// Parent Meeting Schema
export const parentMeetingSchema = z.object({
  parentId: z.string().min(1, "Parent is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  scheduledAt: z.string().min(1, "Meeting date and time is required"),
  duration: z.number().min(15, "Duration must be at least 15 minutes").max(180, "Duration cannot exceed 3 hours").default(30),
  location: z.string().optional().nullable(),
  purpose: z.string().optional().nullable(),
});

export type ParentMeetingFormValues = z.infer<typeof parentMeetingSchema>;

// Update Meeting Schema
export const updateMeetingSchema = z.object({
  id: z.string(),
  scheduledAt: z.string().optional(),
  duration: z.number().min(15).max(180).optional(),
  location: z.string().optional().nullable(),
  purpose: z.string().optional().nullable(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "RESCHEDULED"]).optional(),
  notes: z.string().optional().nullable(),
});

export type UpdateMeetingFormValues = z.infer<typeof updateMeetingSchema>;

// Complete Meeting Schema
export const completeMeetingSchema = z.object({
  id: z.string(),
  notes: z.string().optional().nullable(),
});

export type CompleteMeetingFormValues = z.infer<typeof completeMeetingSchema>;

// Cancel Meeting Schema
export const cancelMeetingSchema = z.object({
  id: z.string(),
  reason: z.string().optional().nullable(),
});

export type CancelMeetingFormValues = z.infer<typeof cancelMeetingSchema>;

// Reschedule Meeting Schema
export const rescheduleMeetingSchema = z.object({
  id: z.string(),
  newDate: z.string().min(1, "New date and time is required"),
});

export type RescheduleMeetingFormValues = z.infer<typeof rescheduleMeetingSchema>;
