import { z } from "zod";

// Supported file types for syllabus documents
export const SUPPORTED_FILE_TYPES = {
  // Documents
  PDF: "application/pdf",
  DOC: "application/msword",
  DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  PPT: "application/vnd.ms-powerpoint",
  PPTX: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  
  // Images
  JPEG: "image/jpeg",
  JPG: "image/jpg",
  PNG: "image/png",
  GIF: "image/gif",
  WEBP: "image/webp",
  
  // Videos
  MP4: "video/mp4",
  WEBM: "video/webm",
  MOV: "video/quicktime",
} as const;

export const SUPPORTED_FILE_TYPES_ARRAY = Object.values(SUPPORTED_FILE_TYPES);

// Maximum file size: 50MB
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Validates if a file type is supported
 */
export function isValidFileType(fileType: string): boolean {
  return SUPPORTED_FILE_TYPES_ARRAY.includes(fileType as any);
}

/**
 * Gets a human-readable error message for unsupported file types
 */
export function getFileTypeErrorMessage(fileType: string): string {
  return `File type ${fileType} is not supported. Supported types: PDF, Word, PowerPoint, images (JPEG, PNG, GIF, WebP), videos (MP4, WebM, MOV)`;
}

// Schema for uploading a single document
export const uploadDocumentSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  filename: z.string().min(1, "Filename is required"),
  fileUrl: z.string().url("Invalid file URL"),
  fileType: z.string().refine(isValidFileType, {
    message: "Unsupported file type",
  }),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE, "File size exceeds maximum limit of 50MB"),
  moduleId: z.string().optional(),
  subModuleId: z.string().optional(),
  uploadedBy: z.string().min(1, "Uploader ID is required"),
  order: z.number().int().nonnegative().optional(),
}).refine(
  (data) => data.moduleId || data.subModuleId,
  {
    message: "Either moduleId or subModuleId must be provided",
    path: ["moduleId"],
  }
);

export type UploadDocumentFormValues = z.infer<typeof uploadDocumentSchema>;

// Schema for bulk uploading documents
export const bulkUploadDocumentsSchema = z.object({
  documents: z.array(uploadDocumentSchema).min(1, "At least one document is required"),
});

export type BulkUploadDocumentsFormValues = z.infer<typeof bulkUploadDocumentsSchema>;

// Schema for updating document metadata
export const updateDocumentMetadataSchema = z.object({
  id: z.string().min(1, "Document ID is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export type UpdateDocumentMetadataFormValues = z.infer<typeof updateDocumentMetadataSchema>;

// Schema for reordering documents
export const reorderDocumentsSchema = z.object({
  parentId: z.string().min(1, "Parent ID is required"),
  parentType: z.enum(["module", "subModule"], {
    errorMap: () => ({ message: "Parent type must be either 'module' or 'subModule'" }),
  }),
  documentOrders: z.array(
    z.object({
      id: z.string().min(1, "Document ID is required"),
      order: z.number().int().nonnegative("Order must be a non-negative integer"),
    })
  ).min(1, "At least one document order is required"),
});

export type ReorderDocumentsFormValues = z.infer<typeof reorderDocumentsSchema>;

// Schema for file type validation utility
export const fileTypeValidationSchema = z.object({
  fileType: z.string().min(1, "File type is required"),
  fileSize: z.number().int().positive("File size must be positive"),
});

export type FileTypeValidationFormValues = z.infer<typeof fileTypeValidationSchema>;
