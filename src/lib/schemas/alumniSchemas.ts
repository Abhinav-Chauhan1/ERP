import { z } from "zod";

/**
 * Alumni Validation Schemas
 * 
 * These schemas validate inputs for alumni management operations.
 * Requirements: 13.1, 13.7
 */

// ============================================================================
// Enums
// ============================================================================

export const sortByEnum = z.enum(["name", "graduationDate", "updatedAt"]);
export const sortOrderEnum = z.enum(["asc", "desc"]);
export const reportFormatEnum = z.enum(["pdf", "excel"]);
export const communicationChannelEnum = z.enum(["email", "sms", "whatsapp"]);

// ============================================================================
// Input Validation Schemas
// ============================================================================

/**
 * Schema for alumni search filters
 */
export const alumniSearchSchema = z.object({
  searchTerm: z.string().optional(),
  graduationYearFrom: z.number().int().min(1900).max(2100).optional(),
  graduationYearTo: z.number().int().min(1900).max(2100).optional(),
  finalClass: z.string().optional(),
  currentCity: z.string().optional(),
  currentOccupation: z.string().optional(),
  collegeName: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  sortBy: sortByEnum.default("graduationDate"),
  sortOrder: sortOrderEnum.default("desc"),
});

/**
 * Schema for getting alumni profile
 */
export const getAlumniProfileSchema = z.object({
  alumniId: z.string().min(1, "Alumni ID is required"),
});

/**
 * Schema for alumni profile update
 */
export const updateAlumniProfileSchema = z.object({
  alumniId: z.string().min(1, "Alumni ID is required"),
  currentOccupation: z.string().max(200).optional(),
  currentEmployer: z.string().max(200).optional(),
  currentJobTitle: z.string().max(200).optional(),
  currentAddress: z.string().max(500).optional(),
  currentCity: z.string().max(100).optional(),
  currentState: z.string().max(100).optional(),
  currentCountry: z.string().max(100).optional(),
  currentPhone: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number format").optional(),
  currentEmail: z.string().email("Invalid email format").optional(),
  higherEducation: z.string().max(200).optional(),
  collegeName: z.string().max(200).optional(),
  collegeLocation: z.string().max(200).optional(),
  graduationYearCollege: z.number().int().min(1900).max(2100).optional(),
  achievements: z.array(z.string()).optional(),
  linkedInProfile: z.string().url("Invalid LinkedIn URL").optional(),
  profilePhoto: z.string().url("Invalid photo URL").optional(),
  allowCommunication: z.boolean().optional(),
  communicationEmail: z.string().email("Invalid communication email format").optional(),
});

/**
 * Schema for alumni report generation
 */
export const generateAlumniReportSchema = z.object({
  graduationYearFrom: z.number().int().min(1900).max(2100).optional(),
  graduationYearTo: z.number().int().min(1900).max(2100).optional(),
  finalClass: z.string().optional(),
  format: reportFormatEnum,
});

/**
 * Schema for alumni communication
 */
export const sendAlumniMessageSchema = z.object({
  alumniIds: z.array(z.string().min(1)).min(1, "At least one alumni must be selected"),
  subject: z.string().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  message: z.string().min(1, "Message is required").max(5000, "Message must be less than 5000 characters"),
  channels: z.array(communicationChannelEnum).min(1, "At least one channel must be selected"),
});

/**
 * Schema for getting alumni for communication
 */
export const getAlumniForCommunicationSchema = z.object({
  graduationYearFrom: z.number().int().min(1900).max(2100).optional(),
  graduationYearTo: z.number().int().min(1900).max(2100).optional(),
  finalClass: z.string().optional(),
  currentCity: z.string().optional(),
  allowCommunicationOnly: z.boolean().default(true),
});

// ============================================================================
// Type Exports
// ============================================================================

export type AlumniSearchInput = z.infer<typeof alumniSearchSchema>;
export type GetAlumniProfileInput = z.infer<typeof getAlumniProfileSchema>;
export type UpdateAlumniProfileInput = z.infer<typeof updateAlumniProfileSchema>;
export type GenerateAlumniReportInput = z.infer<typeof generateAlumniReportSchema>;
export type SendAlumniMessageInput = z.infer<typeof sendAlumniMessageSchema>;
export type GetAlumniForCommunicationInput = z.infer<typeof getAlumniForCommunicationSchema>;
