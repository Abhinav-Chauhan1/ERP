import { z } from "zod";

// ============================================================================
// Alumni Profile Schemas
// ============================================================================

/**
 * Schema for creating alumni profile (auto-generated during promotion)
 */
export const createAlumniProfileSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  graduationDate: z.coerce.date(),
  finalClass: z.string().min(1, "Final class is required"),
  finalSection: z.string().min(1, "Final section is required"),
  finalAcademicYear: z.string().min(1, "Final academic year is required"),
  createdBy: z.string().min(1, "Creator user ID is required"),
});

/**
 * Schema for updating alumni profile
 */
export const updateAlumniProfileSchema = z.object({
  // Current information
  currentOccupation: z.string().max(200, "Occupation must be 200 characters or less").optional(),
  currentEmployer: z.string().max(200, "Employer must be 200 characters or less").optional(),
  currentJobTitle: z.string().max(200, "Job title must be 200 characters or less").optional(),
  currentAddress: z.string().max(500, "Address must be 500 characters or less").optional(),
  currentCity: z.string().max(100, "City must be 100 characters or less").optional(),
  currentState: z.string().max(100, "State must be 100 characters or less").optional(),
  currentCountry: z.string().max(100, "Country must be 100 characters or less").optional(),
  currentPhone: z.string().max(20, "Phone must be 20 characters or less").optional(),
  currentEmail: z.string().email("Invalid email address").optional().or(z.literal("")),

  // Higher education
  higherEducation: z.string().max(200, "Higher education must be 200 characters or less").optional(),
  collegeName: z.string().max(200, "College name must be 200 characters or less").optional(),
  collegeLocation: z.string().max(200, "College location must be 200 characters or less").optional(),
  graduationYearCollege: z.coerce.number().int().min(1900).max(2100).optional(),

  // Additional information
  achievements: z.array(z.string().max(500)).optional(),
  linkedInProfile: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  profilePhoto: z.string().url("Invalid photo URL").optional().or(z.literal("")),

  // Communication preferences
  allowCommunication: z.boolean().optional(),
  communicationEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
}).refine(
  (data) => {
    // If graduation year is provided, it should not be in the future
    if (data.graduationYearCollege) {
      const currentYear = new Date().getFullYear();
      return data.graduationYearCollege <= currentYear + 5; // Allow up to 5 years in future for ongoing education
    }
    return true;
  },
  {
    message: "Graduation year cannot be more than 5 years in the future",
    path: ["graduationYearCollege"],
  }
);

/**
 * Schema for alumni search and filter
 */
export const alumniSearchFilterSchema = z.object({
  searchTerm: z.string().max(200, "Search term must be 200 characters or less").optional(),
  graduationYearFrom: z.coerce.number().int().min(1900).max(2100).optional(),
  graduationYearTo: z.coerce.number().int().min(1900).max(2100).optional(),
  finalClass: z.string().optional(),
  currentCity: z.string().max(100).optional(),
  currentOccupation: z.string().max(200).optional(),
  collegeName: z.string().max(200).optional(),
  allowCommunicationOnly: z.boolean().default(false),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["name", "graduationDate", "updatedAt"]).default("graduationDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
}).refine(
  (data) => {
    // Ensure graduationYearTo is after or equal to graduationYearFrom
    if (data.graduationYearFrom && data.graduationYearTo) {
      return data.graduationYearTo >= data.graduationYearFrom;
    }
    return true;
  },
  {
    message: "Graduation year 'to' must be after or equal to 'from'",
    path: ["graduationYearTo"],
  }
);

/**
 * Schema for alumni statistics filters
 */
export const alumniStatisticsFilterSchema = z.object({
  graduationYearFrom: z.coerce.number().int().min(1900).max(2100).optional(),
  graduationYearTo: z.coerce.number().int().min(1900).max(2100).optional(),
  finalClass: z.string().optional(),
}).refine(
  (data) => {
    // Ensure graduationYearTo is after or equal to graduationYearFrom
    if (data.graduationYearFrom && data.graduationYearTo) {
      return data.graduationYearTo >= data.graduationYearFrom;
    }
    return true;
  },
  {
    message: "Graduation year 'to' must be after or equal to 'from'",
    path: ["graduationYearTo"],
  }
);

/**
 * Schema for alumni report generation
 */
export const alumniReportSchema = z.object({
  graduationYearFrom: z.coerce.number().int().min(1900).max(2100).optional(),
  graduationYearTo: z.coerce.number().int().min(1900).max(2100).optional(),
  finalClass: z.string().optional(),
  format: z.enum(["pdf", "excel"], {
    errorMap: () => ({ message: "Format must be 'pdf' or 'excel'" }),
  }),
  includeFields: z.array(z.string()).optional(),
}).refine(
  (data) => {
    // Ensure graduationYearTo is after or equal to graduationYearFrom
    if (data.graduationYearFrom && data.graduationYearTo) {
      return data.graduationYearTo >= data.graduationYearFrom;
    }
    return true;
  },
  {
    message: "Graduation year 'to' must be after or equal to 'from'",
    path: ["graduationYearTo"],
  }
);

// ============================================================================
// Alumni Communication Schemas
// ============================================================================

/**
 * Communication channel enum
 */
export const communicationChannelEnum = z.enum(["email", "sms", "whatsapp"], {
  errorMap: () => ({ message: "Channel must be 'email', 'sms', or 'whatsapp'" }),
});

/**
 * Schema for sending messages to alumni
 */
export const alumniMessageSchema = z.object({
  alumniIds: z.array(z.string()).min(1, "At least one alumni must be selected"),
  subject: z.string().min(1, "Subject is required").max(200, "Subject must be 200 characters or less"),
  message: z.string().min(1, "Message is required").max(5000, "Message must be 5000 characters or less"),
  channels: z.array(communicationChannelEnum).min(1, "At least one communication channel must be selected"),
  scheduledAt: z.coerce.date().optional(),
}).refine(
  (data) => {
    // If scheduled, date must be in the future
    if (data.scheduledAt) {
      return data.scheduledAt > new Date();
    }
    return true;
  },
  {
    message: "Scheduled date must be in the future",
    path: ["scheduledAt"],
  }
);

/**
 * Schema for getting alumni for communication
 */
export const alumniCommunicationFilterSchema = z.object({
  graduationYearFrom: z.coerce.number().int().min(1900).max(2100).optional(),
  graduationYearTo: z.coerce.number().int().min(1900).max(2100).optional(),
  finalClass: z.string().optional(),
  currentCity: z.string().max(100).optional(),
  allowCommunicationOnly: z.boolean().default(true),
}).refine(
  (data) => {
    // Ensure graduationYearTo is after or equal to graduationYearFrom
    if (data.graduationYearFrom && data.graduationYearTo) {
      return data.graduationYearTo >= data.graduationYearFrom;
    }
    return true;
  },
  {
    message: "Graduation year 'to' must be after or equal to 'from'",
    path: ["graduationYearTo"],
  }
);

// ============================================================================
// Alumni Portal Schemas (for alumni self-service)
// ============================================================================

/**
 * Schema for alumni self-updating their profile
 * (restricted fields compared to admin update)
 */
export const alumniSelfUpdateSchema = z.object({
  // Current information
  currentOccupation: z.string().max(200, "Occupation must be 200 characters or less").optional(),
  currentEmployer: z.string().max(200, "Employer must be 200 characters or less").optional(),
  currentJobTitle: z.string().max(200, "Job title must be 200 characters or less").optional(),
  currentAddress: z.string().max(500, "Address must be 500 characters or less").optional(),
  currentCity: z.string().max(100, "City must be 100 characters or less").optional(),
  currentState: z.string().max(100, "State must be 100 characters or less").optional(),
  currentCountry: z.string().max(100, "Country must be 100 characters or less").optional(),
  currentPhone: z.string().max(20, "Phone must be 20 characters or less").optional(),
  currentEmail: z.string().email("Invalid email address").optional().or(z.literal("")),

  // Higher education
  higherEducation: z.string().max(200, "Higher education must be 200 characters or less").optional(),
  collegeName: z.string().max(200, "College name must be 200 characters or less").optional(),
  collegeLocation: z.string().max(200, "College location must be 200 characters or less").optional(),
  graduationYearCollege: z.coerce.number().int().min(1900).max(2100).optional(),

  // Additional information
  achievements: z.array(z.string().max(500)).optional(),
  linkedInProfile: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  profilePhoto: z.string().url("Invalid photo URL").optional().or(z.literal("")),

  // Communication preferences
  allowCommunication: z.boolean().optional(),
  communicationEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
}).refine(
  (data) => {
    // If graduation year is provided, it should not be in the future
    if (data.graduationYearCollege) {
      const currentYear = new Date().getFullYear();
      return data.graduationYearCollege <= currentYear + 5;
    }
    return true;
  },
  {
    message: "Graduation year cannot be more than 5 years in the future",
    path: ["graduationYearCollege"],
  }
);

// ============================================================================
// Type Exports
// ============================================================================

export type CreateAlumniProfileInput = z.infer<typeof createAlumniProfileSchema>;
export type UpdateAlumniProfileInput = z.infer<typeof updateAlumniProfileSchema>;
export type AlumniSearchFilterInput = z.infer<typeof alumniSearchFilterSchema>;
export type AlumniStatisticsFilterInput = z.infer<typeof alumniStatisticsFilterSchema>;
export type AlumniReportInput = z.infer<typeof alumniReportSchema>;
export type CommunicationChannel = z.infer<typeof communicationChannelEnum>;
export type AlumniMessageInput = z.infer<typeof alumniMessageSchema>;
export type AlumniCommunicationFilterInput = z.infer<typeof alumniCommunicationFilterSchema>;
export type AlumniSelfUpdateInput = z.infer<typeof alumniSelfUpdateSchema>;
