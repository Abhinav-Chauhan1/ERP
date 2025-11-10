import { z } from "zod";

// Academic Report Filters Schema
export const academicReportFiltersSchema = z.object({
  academicYearId: z.string().optional(),
  classId: z.string().optional(),
  studentId: z.string().optional(),
  termId: z.string().optional(),
  subjectId: z.string().optional(),
});

// Financial Report Filters Schema
export const financialReportFiltersSchema = z.object({
  academicYearId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
});

// Attendance Report Filters Schema
export const attendanceReportFiltersSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  classId: z.string().optional(),
  month: z.number().min(1).max(12).optional(),
  year: z.number().min(2020).max(2030).optional(),
  threshold: z.number().min(1).optional(),
});

// Performance Report Filters Schema
export const performanceReportFiltersSchema = z.object({
  academicYearId: z.string().optional(),
  teacherId: z.string().optional(),
  studentId: z.string().optional(),
  compareBy: z.enum(["class", "term", "subject"]).optional(),
  termId: z.string().optional(),
  metric: z.enum(["grades", "attendance", "behavior", "overall"]).optional(),
});

// Report Generation Schema
export const reportGenerationSchema = z.object({
  reportType: z.string().min(1, "Report type is required"),
  filters: z.record(z.any()).optional(),
  format: z.enum(["PDF", "EXCEL", "CSV"]).default("PDF"),
  includeCharts: z.boolean().default(true),
});

export type AcademicReportFilters = z.infer<typeof academicReportFiltersSchema>;
export type FinancialReportFilters = z.infer<typeof financialReportFiltersSchema>;
export type AttendanceReportFilters = z.infer<typeof attendanceReportFiltersSchema>;
export type PerformanceReportFilters = z.infer<typeof performanceReportFiltersSchema>;
export type ReportGeneration = z.infer<typeof reportGenerationSchema>;
