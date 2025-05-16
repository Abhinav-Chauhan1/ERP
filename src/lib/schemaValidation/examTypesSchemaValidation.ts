import * as z from "zod";

// Base schema for exam types
const examTypeBaseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  weight: z.coerce.number().min(0, "Weight cannot be negative").max(100, "Weight cannot exceed 100"),
  isActive: z.boolean().default(true),
  canRetest: z.boolean().default(false),
  includeInGradeCard: z.boolean().default(true),
});

// Schema for creating a new exam type
export const examTypeSchema = examTypeBaseSchema;

// Schema for updating an existing exam type
export const examTypeUpdateSchema = examTypeBaseSchema.extend({
  id: z.string().min(1, "Exam type ID is required"),
});

// Schema for grade thresholds
export const gradeThresholdSchema = z.object({
  grade: z.string().min(1, "Grade label is required"),
  minScore: z.coerce.number().min(0, "Minimum score cannot be negative").max(100, "Maximum score cannot exceed 100"),
  description: z.string().optional(),
});

// Define types based on the schemas
export type ExamTypeFormValues = z.infer<typeof examTypeSchema>;
export type ExamTypeUpdateFormValues = z.infer<typeof examTypeUpdateSchema>;
export type GradeThresholdFormValues = z.infer<typeof gradeThresholdSchema>;
