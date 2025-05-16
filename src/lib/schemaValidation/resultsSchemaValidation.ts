import * as z from "zod";

// Schema for filtering results
export const resultFilterSchema = z.object({
  searchTerm: z.string().optional(),
  subjectId: z.string().optional(),
  gradeId: z.string().optional(),
  examTypeId: z.string().optional(),
  termId: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

// Schema for publishing exam results
export const publishResultsSchema = z.object({
  examId: z.string({
    required_error: "Exam ID is required",
  }),
  isPublished: z.boolean().default(true),
  publishDate: z.date().default(() => new Date()),
  sendNotifications: z.boolean().default(false),
});

// Schema for generating report cards
export const generateReportCardSchema = z.object({
  studentId: z.string({
    required_error: "Student ID is required",
  }),
  termId: z.string({
    required_error: "Term ID is required",
  }),
  includeRemarks: z.boolean().default(false),
  teacherRemarks: z.string().optional(),
  principalRemarks: z.string().optional(),
});

// Define types based on the schemas
export type ResultFilterValues = z.infer<typeof resultFilterSchema>;
export type PublishResultsValues = z.infer<typeof publishResultsSchema>;
export type GenerateReportCardValues = z.infer<typeof generateReportCardSchema>;
