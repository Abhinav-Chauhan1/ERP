import { z } from "zod";
import { PromotionStatus } from "@prisma/client";

// ============================================================================
// Promotion Input Schemas
// ============================================================================

/**
 * Schema for selecting students for promotion
 */
export const studentSelectionSchema = z.object({
  sourceClassId: z.string().min(1, "Source class is required"),
  sourceSectionId: z.string().optional(),
  sourceAcademicYearId: z.string().min(1, "Source academic year is required"),
});

/**
 * Schema for excluded student with reason
 */
export const excludedStudentSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  reason: z.string().min(1, "Exclusion reason is required").max(500, "Reason must be 500 characters or less"),
});

/**
 * Roll number strategy enum
 */
export const rollNumberStrategyEnum = z.enum(["auto", "manual", "preserve"], {
  errorMap: () => ({ message: "Roll number strategy must be 'auto', 'manual', or 'preserve'" }),
});

/**
 * Schema for promotion preview request
 */
export const promotionPreviewSchema = z.object({
  sourceClassId: z.string().min(1, "Source class is required"),
  sourceSectionId: z.string().optional(),
  sourceAcademicYearId: z.string().min(1, "Source academic year is required"),
  targetAcademicYearId: z.string().min(1, "Target academic year is required"),
  targetClassId: z.string().min(1, "Target class is required"),
  targetSectionId: z.string().optional(),
  studentIds: z.array(z.string()).min(1, "At least one student must be selected"),
});

/**
 * Schema for bulk promotion execution
 */
export const bulkPromotionSchema = z.object({
  sourceClassId: z.string().min(1, "Source class is required"),
  sourceSectionId: z.string().optional(),
  sourceAcademicYearId: z.string().min(1, "Source academic year is required"),
  targetAcademicYearId: z.string().min(1, "Target academic year is required"),
  targetClassId: z.string().min(1, "Target class is required"),
  targetSectionId: z.string().optional(),
  studentIds: z.array(z.string()).min(1, "At least one student must be selected"),
  excludedStudents: z.array(excludedStudentSchema).default([]),
  rollNumberStrategy: rollNumberStrategyEnum.default("auto"),
  rollNumberMapping: z.record(z.string(), z.string()).optional(),
  sendNotifications: z.boolean().default(true),
  notes: z.string().max(1000, "Notes must be 1000 characters or less").optional(),
}).refine(
  (data) => {
    // If manual roll number strategy, mapping must be provided
    if (data.rollNumberStrategy === "manual" && !data.rollNumberMapping) {
      return false;
    }
    return true;
  },
  {
    message: "Roll number mapping is required when using manual strategy",
    path: ["rollNumberMapping"],
  }
).refine(
  (data) => {
    // If manual roll number strategy, mapping must include all students
    if (data.rollNumberStrategy === "manual" && data.rollNumberMapping) {
      const excludedIds = new Set(data.excludedStudents.map(e => e.studentId));
      const eligibleStudents = data.studentIds.filter(id => !excludedIds.has(id));
      const mappedStudents = Object.keys(data.rollNumberMapping);
      
      // Check if all eligible students have roll numbers
      return eligibleStudents.every(id => mappedStudents.includes(id));
    }
    return true;
  },
  {
    message: "Roll number mapping must include all eligible students",
    path: ["rollNumberMapping"],
  }
);

/**
 * Schema for promotion history filters
 */
export const promotionHistoryFilterSchema = z.object({
  academicYear: z.string().optional(),
  classId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
}).refine(
  (data) => {
    // Ensure end date is after start date if both provided
    if (data.startDate && data.endDate) {
      return data.endDate >= data.startDate;
    }
    return true;
  },
  {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  }
);

/**
 * Schema for rollback promotion request
 */
export const rollbackPromotionSchema = z.object({
  historyId: z.string().min(1, "Promotion history ID is required"),
  reason: z.string().min(1, "Rollback reason is required").max(500, "Reason must be 500 characters or less"),
});

/**
 * Schema for graduation ceremony
 */
export const graduationCeremonySchema = z.object({
  classId: z.string().min(1, "Class is required"),
  sectionId: z.string().optional(),
  academicYearId: z.string().min(1, "Academic year is required"),
  studentIds: z.array(z.string()).min(1, "At least one student must be selected"),
  graduationDate: z.coerce.date(),
  ceremonyVenue: z.string().max(200, "Venue must be 200 characters or less").optional(),
  chiefGuest: z.string().max(200, "Chief guest name must be 200 characters or less").optional(),
  ceremonyDetails: z.string().max(1000, "Ceremony details must be 1000 characters or less").optional(),
  generateCertificates: z.boolean().default(false),
  sendCongratulations: z.boolean().default(true),
}).refine(
  (data) => {
    // Graduation date should not be in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return data.graduationDate <= today;
  },
  {
    message: "Graduation date cannot be in the future",
    path: ["graduationDate"],
  }
);

// ============================================================================
// Type Exports
// ============================================================================

export type StudentSelectionInput = z.infer<typeof studentSelectionSchema>;
export type ExcludedStudentInput = z.infer<typeof excludedStudentSchema>;
export type RollNumberStrategy = z.infer<typeof rollNumberStrategyEnum>;
export type PromotionPreviewInput = z.infer<typeof promotionPreviewSchema>;
export type BulkPromotionInput = z.infer<typeof bulkPromotionSchema>;
export type PromotionHistoryFilterInput = z.infer<typeof promotionHistoryFilterSchema>;
export type RollbackPromotionInput = z.infer<typeof rollbackPromotionSchema>;
export type GraduationCeremonyInput = z.infer<typeof graduationCeremonySchema>;
