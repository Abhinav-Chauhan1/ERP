import { z } from "zod";

/**
 * Schema for getting exam results with filters
 */
export const getExamResultsSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
  termId: z.string().optional(),
  subjectId: z.string().optional(),
  examTypeId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  includeAbsent: z.boolean().optional().default(false),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
});

export type GetExamResultsInput = z.infer<typeof getExamResultsSchema>;

/**
 * Schema for getting progress reports
 */
export const getProgressReportsSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
  termId: z.string().optional(),
  academicYearId: z.string().optional(),
  includeUnpublished: z.boolean().optional().default(false),
});

export type GetProgressReportsInput = z.infer<typeof getProgressReportsSchema>;

/**
 * Schema for getting performance analytics
 */
export const getPerformanceAnalyticsSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
  includeTermHistory: z.boolean().optional().default(true),
  includeSubjectTrends: z.boolean().optional().default(true),
});

export type GetPerformanceAnalyticsInput = z.infer<typeof getPerformanceAnalyticsSchema>;

/**
 * Schema for downloading report card
 */
export const downloadReportCardSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
  termId: z.string().min(1, "Term ID is required"),
});

export type DownloadReportCardInput = z.infer<typeof downloadReportCardSchema>;

/**
 * Schema for getting class comparison
 */
export const getClassComparisonSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
  examId: z.string().min(1, "Exam ID is required"),
});

export type GetClassComparisonInput = z.infer<typeof getClassComparisonSchema>;
