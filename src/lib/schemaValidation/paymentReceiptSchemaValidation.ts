import { z } from "zod";
import { validateFileContent, validateImageHeader } from "@/lib/utils/input-sanitization";

// Allowed file formats and size
const ALLOWED_FORMATS = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Receipt Upload Schema
export const receiptUploadSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  feeStructureId: z.string().min(1, "Fee structure is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  paymentDate: z.date({
    required_error: "Payment date is required",
  }).refine(
    (date) => date <= new Date(),
    {
      message: "Payment date cannot be in the future",
    }
  ),
  paymentMethod: z.enum(["CASH", "CHEQUE", "BANK_TRANSFER"], {
    required_error: "Payment method is required",
  }),
  transactionRef: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export type ReceiptUploadFormValues = z.infer<typeof receiptUploadSchema>;

/**
 * Comprehensive file validation with content checking
 * Validates format, size, extension, and file header
 */
export async function validateReceiptFile(file: File): Promise<{ valid: boolean; error?: string }> {
  // Check file format (MIME type)
  if (!ALLOWED_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: "Only JPEG, PNG, and PDF files are allowed",
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size must not exceed ${MAX_FILE_SIZE_MB}MB`,
    };
  }
  
  // Check file size is not zero
  if (file.size === 0) {
    return {
      valid: false,
      error: "File is empty",
    };
  }

  // Validate file content matches MIME type
  const contentValidation = validateFileContent(file, ALLOWED_FORMATS);
  if (!contentValidation.valid) {
    return contentValidation;
  }

  // Validate file header (magic bytes)
  const headerValidation = await validateImageHeader(file);
  if (!headerValidation.valid) {
    return headerValidation;
  }

  return { valid: true };
}

// Receipt Filter Schema
export const receiptFilterSchema = z.object({
  studentId: z.string().optional(),
  status: z.enum(["PENDING_VERIFICATION", "VERIFIED", "REJECTED"]).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export type ReceiptFilterValues = z.infer<typeof receiptFilterSchema>;
