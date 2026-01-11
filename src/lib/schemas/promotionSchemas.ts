import { z } from "zod";

/**
 * Promotion Validation Schemas
 * 
 * These schemas validate inputs for student promotion operations.
 * Requirements: 13.1, 13.7
 */

// ============================================================================
// Enums
// ============================================================================

export const rollNumberStrategyEnum = z.enum(["auto", "manual", "preserve"]);

// ============================================================================
// Input Validation Schemas
// ============================================================================

/**
 * Schema for getting students for promotion
 */
export const getStudentsForPromotionSchema = z.object({
  classId: z.string().min(1, "Class ID is required"),
  sectionId: z.string().optional(),
  academicYearId: z.string().optional(),
});

/**
 * Schema for promotion preview
 */
export const promotionPreviewSchema = z.object({
  sourceClassId: z.string().min(1, "Source class ID is required"),
  sourceSectionId: z.string().optional(),
  sourceAcademicYearId: z.string().optional(),
  targetAcademicYearId: z.string().min(1, "Target academic year ID is required"),
  targetClassId: z.string().min(1, "Target class ID is required"),
  targetSectionId: z.string().optional(),
  studentIds: z.array(z.string().min(1)).min(1, "At least one student must be selected"),
});

/**
 * Schema for excluded students
 */
export const excludedStudentSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  reason: z.string().min(1, "Reason is required").max(500, "Reason must be less than 500 characters"),
});

/**
 * Schema for bulk promotion execution
 */
export const bulkPromotionSchema = z.object({
  sourceClassId: z.string().min(1, "Source class ID is required"),
  sourceSectionId: z.string().optional(),
  sourceAcademicYearId: z.string().optional(),
  targetAcademicYearId: z.string().min(1, "Target academic year ID is required"),
  targetClassId: z.string().min(1, "Target class ID is required"),
  targetSectionId: z.string().min(1, "Target section ID is required"),
  studentIds: z.array(z.string().min(1)).min(1, "At least one student must be selected"),
  excludedStudents: z.array(excludedStudentSchema).default([]),
  rollNumberStrategy: rollNumberStrategyEnum,
  rollNumberMapping: z.record(z.string(), z.string()).optional(),
  sendNotifications: z.boolean().default(true),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
});

/**
 * Schema for promotion history filters
 */
export const promotionHistoryFiltersSchema = z.object({
  academicYear: z.string().optional(),
  classId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

/**
 * Schema for promotion details
 */
export const promotionDetailsSchema = z.object({
  historyId: z.string().min(1, "History ID is required"),
});

/**
 * Schema for promotion rollback
 */
export const promotionRollbackSchema = z.object({
  historyId: z.string().min(1, "History ID is required"),
  reason: z.string().min(1, "Reason is required").max(500, "Reason must be less than 500 characters"),
});

// ============================================================================
// Type Exports
// ============================================================================

export type GetStudentsForPromotionInput = z.infer<typeof getStudentsForPromotionSchema>;
export type PromotionPreviewInput = z.infer<typeof promotionPreviewSchema>;
export type ExcludedStudentInput = z.infer<typeof excludedStudentSchema>;
export type BulkPromotionInput = z.infer<typeof bulkPromotionSchema>;
export type PromotionHistoryFiltersInput = z.infer<typeof promotionHistoryFiltersSchema>;
export type PromotionDetailsInput = z.infer<typeof promotionDetailsSchema>;
export type PromotionRollbackInput = z.infer<typeof promotionRollbackSchema>;
