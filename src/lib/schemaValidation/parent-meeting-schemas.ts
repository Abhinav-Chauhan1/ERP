import { z } from "zod";

// ============================================================================
// MEETING SCHEMAS
// ============================================================================

/**
 * Schedule meeting schema
 */
export const scheduleMeetingSchema = z.object({
  teacherId: z.string().min(1, "Teacher is required"),
  childId: z.string().min(1, "Child is required"),
  meetingDate: z.date({
    required_error: "Meeting date is required",
    invalid_type_error: "Invalid date format",
  }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  mode: z.enum(["IN_PERSON", "ONLINE"], {
    required_error: "Meeting mode is required",
  }),
  purpose: z.string().min(10, "Purpose must be at least 10 characters").max(500, "Purpose must be less than 500 characters"),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
}).refine(
  (data) => {
    const start = new Date(`2000-01-01T${data.startTime}`);
    const end = new Date(`2000-01-01T${data.endTime}`);
    return end > start;
  },
  {
    message: "End time must be after start time",
    path: ["endTime"],
  }
);

export type ScheduleMeetingInput = z.infer<typeof scheduleMeetingSchema>;

/**
 * Get upcoming meetings schema
 */
export const getUpcomingMeetingsSchema = z.object({
  parentId: z.string().min(1, "Parent ID is required"),
  childId: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(50),
});

export type GetUpcomingMeetingsInput = z.infer<typeof getUpcomingMeetingsSchema>;

/**
 * Get meeting history schema
 */
export const getMeetingHistorySchema = z.object({
  parentId: z.string().min(1, "Parent ID is required"),
  childId: z.string().optional(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "RESCHEDULED"]).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(50),
});

export type GetMeetingHistoryInput = z.infer<typeof getMeetingHistorySchema>;

/**
 * Cancel meeting schema
 */
export const cancelMeetingSchema = z.object({
  meetingId: z.string().min(1, "Meeting ID is required"),
  reason: z.string().min(10, "Cancellation reason must be at least 10 characters").max(500, "Reason must be less than 500 characters"),
});

export type CancelMeetingInput = z.infer<typeof cancelMeetingSchema>;

/**
 * Reschedule meeting schema
 */
export const rescheduleMeetingSchema = z.object({
  meetingId: z.string().min(1, "Meeting ID is required"),
  newMeetingDate: z.date({
    required_error: "New meeting date is required",
    invalid_type_error: "Invalid date format",
  }),
  newStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  newEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  reason: z.string().min(10, "Reschedule reason must be at least 10 characters").max(500, "Reason must be less than 500 characters"),
}).refine(
  (data) => {
    const start = new Date(`2000-01-01T${data.newStartTime}`);
    const end = new Date(`2000-01-01T${data.newEndTime}`);
    return end > start;
  },
  {
    message: "End time must be after start time",
    path: ["newEndTime"],
  }
);

export type RescheduleMeetingInput = z.infer<typeof rescheduleMeetingSchema>;

/**
 * Get teacher availability schema
 */
export const getTeacherAvailabilitySchema = z.object({
  teacherId: z.string().min(1, "Teacher ID is required"),
  date: z.date({
    required_error: "Date is required",
    invalid_type_error: "Invalid date format",
  }),
});

export type GetTeacherAvailabilityInput = z.infer<typeof getTeacherAvailabilitySchema>;

/**
 * Meeting detail schema (for responses)
 */
export const meetingDetailSchema = z.object({
  id: z.string(),
  teacherId: z.string(),
  teacherName: z.string(),
  childId: z.string(),
  childName: z.string(),
  meetingDate: z.date(),
  startTime: z.string(),
  endTime: z.string(),
  mode: z.enum(["IN_PERSON", "ONLINE"]),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "RESCHEDULED"]),
  purpose: z.string(),
  notes: z.string().nullable(),
  meetingLink: z.string().url().nullable(),
  location: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type MeetingDetail = z.infer<typeof meetingDetailSchema>;

