import * as z from "zod";

// Timetable schema
export const timetableSchema = z.object({
  name: z.string().min(3, "Timetable name must be at least 3 characters"),
  description: z.string().optional(),
  effectiveFrom: z.date({
    required_error: "Start date is required",
  }),
  effectiveTo: z.date().optional(),
  isActive: z.boolean().default(true),
});

export const timetableUpdateSchema = timetableSchema.extend({
  id: z.string().min(1, "Timetable ID is required"),
});

// Timetable slot schema - base definition without refinement
const timetableSlotBase = z.object({
  timetableId: z.string().min(1, "Timetable is required"),
  classId: z.string().min(1, "Class is required"),
  sectionId: z.string().optional(),
  subjectTeacherId: z.string().min(1, "Subject and teacher combination is required"),
  roomId: z.string().optional(),
  topicId: z.string().optional(), // Optional assigned syllabus topic (sub-module)
  day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"], {
    required_error: "Day is required",
  }),
  startTime: z.date({
    required_error: "Start time is required",
  }),
  endTime: z.date({
    required_error: "End time is required",
  }),
});

// Timetable slot schema with refinement
export const timetableSlotSchema = timetableSlotBase.superRefine((data, ctx) => {
  if (!data.startTime || !data.endTime) return;
  if (data.endTime <= data.startTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End time must be after start time",
      path: ["endTime"],
    });
  }
});

// Create update schema from the base schema, then add the same refinement
export const timetableSlotUpdateSchema = timetableSlotBase.extend({
  id: z.string().min(1, "Slot ID is required"),
}).superRefine((data, ctx) => {
  if (!data.startTime || !data.endTime) return;
  if (data.endTime <= data.startTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End time must be after start time",
      path: ["endTime"],
    });
  }
});

export type TimetableFormValues = z.infer<typeof timetableSchema>;
export type TimetableUpdateFormValues = z.infer<typeof timetableUpdateSchema>;
export type TimetableSlotFormValues = z.infer<typeof timetableSlotSchema>;
export type TimetableSlotUpdateFormValues = z.infer<typeof timetableSlotUpdateSchema>;
