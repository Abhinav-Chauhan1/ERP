import { z } from "zod";

// Document type schema
export const documentTypeSchema = z.object({
  id: z.string().optional(), // Optional for new document types
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
});

// Document schema
export const documentSchema = z.object({
  id: z.string().optional(), // Optional for new documents
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  fileName: z.string().min(1, "File name is required"),
  fileUrl: z.string().url("File URL must be a valid URL"),
  fileType: z.string().optional(),
  fileSize: z.number().optional(),
  userId: z.string(), // User who uploaded/owns the document
  documentTypeId: z.string().optional(),
  isPublic: z.boolean().default(false),
  tags: z.string().optional(), // Comma-separated tags
});

// Document filter schema
export const documentFilterSchema = z.object({
  documentTypeId: z.string().optional(),
  userId: z.string().optional(),
  isPublic: z.boolean().optional(),
  searchTerm: z.string().optional(),
});

export type DocumentTypeData = z.infer<typeof documentTypeSchema>;
export type DocumentData = z.infer<typeof documentSchema>;
export type DocumentFilterData = z.infer<typeof documentFilterSchema>;
