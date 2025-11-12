import { z } from "zod";

// ============================================================================
// DOCUMENT SCHEMAS
// ============================================================================

/**
 * Get documents filter schema
 */
export const getDocumentsSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
  category: z.enum(["REPORT_CARD", "CERTIFICATE", "LETTER", "MEDICAL", "OTHER"]).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(50),
});

export type GetDocumentsInput = z.infer<typeof getDocumentsSchema>;

/**
 * Download document schema
 */
export const downloadDocumentSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  childId: z.string().min(1, "Child ID is required"),
});

export type DownloadDocumentInput = z.infer<typeof downloadDocumentSchema>;

/**
 * Preview document schema
 */
export const previewDocumentSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  childId: z.string().min(1, "Child ID is required"),
});

export type PreviewDocumentInput = z.infer<typeof previewDocumentSchema>;

/**
 * Bulk download documents schema
 */
export const bulkDownloadDocumentsSchema = z.object({
  documentIds: z.array(z.string()).min(1, "At least one document must be selected").max(20, "Maximum 20 documents can be downloaded at once"),
  childId: z.string().min(1, "Child ID is required"),
});

export type BulkDownloadDocumentsInput = z.infer<typeof bulkDownloadDocumentsSchema>;

/**
 * Document detail schema (for responses)
 */
export const documentDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  category: z.enum(["REPORT_CARD", "CERTIFICATE", "LETTER", "MEDICAL", "OTHER"]),
  fileUrl: z.string().url(),
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
  uploadedBy: z.string(),
  uploadedByName: z.string(),
  uploadDate: z.date(),
  childId: z.string(),
  childName: z.string(),
  isPublic: z.boolean(),
  expiryDate: z.date().nullable(),
});

export type DocumentDetail = z.infer<typeof documentDetailSchema>;

