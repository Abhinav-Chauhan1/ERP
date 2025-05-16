import * as z from "zod";

// Schema for creating a report card
export const reportCardCreateSchema = z.object({
  studentId: z.string({
    required_error: "Student is required",
  }),
  termId: z.string({
    required_error: "Term is required",
  }),
  totalMarks: z.number().optional(),
  averageMarks: z.number().optional(),
  percentage: z.number().optional(),
  grade: z.string().optional(),
  rank: z.number().int().optional(),
  attendance: z.number().min(0).max(100).optional(),
});

// Schema for updating a report card
export const reportCardUpdateSchema = reportCardCreateSchema.extend({
  id: z.string({
    required_error: "Report card ID is required",
  }),
});

// Schema for adding remarks to a report card
export const reportCardRemarksSchema = z.object({
  id: z.string({
    required_error: "Report card ID is required",
  }),
  teacherRemarks: z.string().min(5, "Teacher remarks must be at least 5 characters"),
  principalRemarks: z.string().min(5, "Principal remarks must be at least 5 characters"),
});

// Schema for publishing a report card
export const reportCardPublishSchema = z.object({
  id: z.string({
    required_error: "Report card ID is required",
  }),
  sendNotification: z.boolean().default(false),
});

// Define types based on the schemas
export type ReportCardCreateValues = z.infer<typeof reportCardCreateSchema>;
export type ReportCardUpdateValues = z.infer<typeof reportCardUpdateSchema>;
export type ReportCardRemarksValues = z.infer<typeof reportCardRemarksSchema>;
export type ReportCardPublishValues = z.infer<typeof reportCardPublishSchema>;
