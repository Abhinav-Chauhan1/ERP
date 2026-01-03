import * as z from "zod";

/**
 * Schema for marking a sub-module as complete/incomplete
 */
export const markSubModuleCompleteSchema = z.object({
  subModuleId: z.string().min(1, "Sub-module ID is required"),
  teacherId: z.string().min(1, "Teacher ID is required"),
  completed: z.boolean({
    required_error: "Completion status is required",
  }),
});

/**
 * Schema for getting module progress
 */
export const getModuleProgressSchema = z.object({
  moduleId: z.string().min(1, "Module ID is required"),
  teacherId: z.string().min(1, "Teacher ID is required"),
});

/**
 * Schema for getting syllabus progress
 */
export const getSyllabusProgressSchema = z.object({
  syllabusId: z.string().min(1, "Syllabus ID is required"),
  teacherId: z.string().min(1, "Teacher ID is required"),
});

/**
 * Schema for batch module progress
 */
export const getBatchModuleProgressSchema = z.object({
  moduleIds: z
    .array(z.string().min(1, "Module ID is required"))
    .min(1, "At least one module ID is required"),
  teacherId: z.string().min(1, "Teacher ID is required"),
});

// Type exports
export type MarkSubModuleCompleteFormValues = z.infer<
  typeof markSubModuleCompleteSchema
>;
export type GetModuleProgressFormValues = z.infer<
  typeof getModuleProgressSchema
>;
export type GetSyllabusProgressFormValues = z.infer<
  typeof getSyllabusProgressSchema
>;
export type GetBatchModuleProgressFormValues = z.infer<
  typeof getBatchModuleProgressSchema
>;
