import { z } from "zod";

// File validation constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain',
];

// Document validation schemas
export const documentCategoryEnum = z.enum([
  'CERTIFICATE',
  'ID_PROOF',
  'TEACHING_MATERIAL',
  'LESSON_PLAN',
  'CURRICULUM',
  'POLICY',
  'OTHER',
]);

export const documentUploadSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .nullable(),
  fileName: z.string().min(1, "File name is required"),
  fileUrl: z.string().url("Invalid file URL"),
  fileType: z
    .string()
    .refine(
      (type) => ALLOWED_DOCUMENT_TYPES.includes(type),
      "File type not allowed"
    ),
  fileSize: z
    .number()
    .int()
    .positive("File size must be positive")
    .max(MAX_FILE_SIZE, `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`),
  category: documentCategoryEnum,
  tags: z.string().optional().nullable(),
  userId: z.string().min(1, "User ID is required"),
});

export const documentUpdateSchema = documentUploadSchema
  .omit({ userId: true, fileName: true, fileUrl: true, fileType: true, fileSize: true })
  .partial();

// Achievement validation schemas
export const achievementCategoryEnum = z.enum([
  "AWARD",
  "CERTIFICATION",
  "PROFESSIONAL_DEVELOPMENT",
  "PUBLICATION",
  "RECOGNITION",
  "OTHER",
]);

export const achievementSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional()
    .nullable(),
  category: achievementCategoryEnum,
  date: z
    .string()
    .min(1, "Date is required")
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, "Invalid date format"),
  teacherId: z.string().min(1, "Teacher ID is required"),
  documents: z.array(z.string().url("Invalid document URL")).optional().default([]),
});

export const achievementUpdateSchema = achievementSchema
  .omit({ teacherId: true })
  .partial();

// Event RSVP validation schema
export const rsvpStatusEnum = z.enum(["PENDING", "ACCEPTED", "DECLINED", "MAYBE"]);

export const eventRsvpSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  userId: z.string().min(1, "User ID is required"),
  status: rsvpStatusEnum,
});

// Type exports
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>;
export type AchievementInput = z.infer<typeof achievementSchema>;
export type AchievementUpdateInput = z.infer<typeof achievementUpdateSchema>;
export type EventRsvpInput = z.infer<typeof eventRsvpSchema>;

// Validation helper functions
export function validateFileSize(size: number): { valid: boolean; error?: string } {
  if (size <= 0) {
    return { valid: false, error: "File size must be positive" };
  }
  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }
  return { valid: true };
}

export function validateFileType(type: string): { valid: boolean; error?: string } {
  if (!ALLOWED_DOCUMENT_TYPES.includes(type)) {
    return {
      valid: false,
      error: "File type not allowed. Please upload PDF, Word, Excel, PowerPoint, or image files.",
    };
  }
  return { valid: true };
}

export function validateFile(file: {
  size: number;
  type: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const sizeValidation = validateFileSize(file.size);
  if (!sizeValidation.valid && sizeValidation.error) {
    errors.push(sizeValidation.error);
  }

  const typeValidation = validateFileType(file.type);
  if (!typeValidation.valid && typeValidation.error) {
    errors.push(typeValidation.error);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
