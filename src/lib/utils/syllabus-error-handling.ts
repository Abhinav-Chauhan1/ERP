/**
 * Error handling and validation utilities for Enhanced Syllabus System
 * Implements comprehensive error handling as per design document
 * Requirements: All (Task 14)
 */

import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

/**
 * Standard error response interface
 * Matches design document specification
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: string;
}

/**
 * Success response interface
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp?: string;
}

/**
 * Combined action response type
 */
export type ActionResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Error codes for syllabus system
 */
export const SyllabusErrorCodes = {
  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  REQUIRED_FIELD: "REQUIRED_FIELD",
  INVALID_TYPE: "INVALID_TYPE",
  INVALID_FORMAT: "INVALID_FORMAT",
  
  // Module errors
  DUPLICATE_CHAPTER_NUMBER: "DUPLICATE_CHAPTER_NUMBER",
  MODULE_NOT_FOUND: "MODULE_NOT_FOUND",
  INVALID_MODULE_ORDER: "INVALID_MODULE_ORDER",
  
  // Sub-module errors
  SUBMODULE_NOT_FOUND: "SUBMODULE_NOT_FOUND",
  INVALID_SUBMODULE_ORDER: "INVALID_SUBMODULE_ORDER",
  SUBMODULE_PARENT_MISMATCH: "SUBMODULE_PARENT_MISMATCH",
  
  // Document errors
  DOCUMENT_NOT_FOUND: "DOCUMENT_NOT_FOUND",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  UPLOAD_FAILED: "UPLOAD_FAILED",
  DELETE_FAILED: "DELETE_FAILED",
  STORAGE_QUOTA_EXCEEDED: "STORAGE_QUOTA_EXCEEDED",
  
  // Database errors
  CONSTRAINT_VIOLATION: "CONSTRAINT_VIOLATION",
  CASCADE_DELETE_FAILED: "CASCADE_DELETE_FAILED",
  TRANSACTION_FAILED: "TRANSACTION_FAILED",
  
  // Parent reference errors
  SYLLABUS_NOT_FOUND: "SYLLABUS_NOT_FOUND",
  PARENT_NOT_FOUND: "PARENT_NOT_FOUND",
  
  // Generic errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  message: string,
  code?: string,
  details?: Record<string, any>
): ErrorResponse {
  return {
    success: false,
    error: message,
    code,
    details,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Handle Zod validation errors
 * Converts Zod errors to user-friendly messages
 */
export function handleZodError(error: ZodError): ErrorResponse {
  const errors = error.errors.map((e) => ({
    field: e.path.join("."),
    message: e.message,
  }));

  const errorMessages = errors.map((e) => `${e.field}: ${e.message}`).join(", ");

  return createErrorResponse(
    errorMessages || "Validation failed",
    SyllabusErrorCodes.VALIDATION_ERROR,
    { validationErrors: errors }
  );
}

/**
 * Handle Prisma database errors
 * Converts Prisma errors to user-friendly messages
 */
export function handlePrismaError(error: unknown): ErrorResponse {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        // Unique constraint violation
        const target = (error.meta?.target as string[]) || [];
        if (target.includes("chapterNumber")) {
          return createErrorResponse(
            "Chapter number already exists in this syllabus",
            SyllabusErrorCodes.DUPLICATE_CHAPTER_NUMBER,
            { constraint: target }
          );
        }
        return createErrorResponse(
          "A record with this value already exists",
          SyllabusErrorCodes.CONSTRAINT_VIOLATION,
          { constraint: target }
        );

      case "P2003":
        // Foreign key constraint violation
        return createErrorResponse(
          "Referenced record does not exist",
          SyllabusErrorCodes.PARENT_NOT_FOUND,
          { field: error.meta?.field_name }
        );

      case "P2025":
        // Record not found
        return createErrorResponse(
          "Record not found",
          SyllabusErrorCodes.MODULE_NOT_FOUND
        );

      case "P2014":
        // Relation violation
        return createErrorResponse(
          "Cannot delete record due to existing relationships",
          SyllabusErrorCodes.CASCADE_DELETE_FAILED
        );

      case "P2034":
        // Transaction failed
        return createErrorResponse(
          "Transaction failed due to conflict",
          SyllabusErrorCodes.TRANSACTION_FAILED
        );

      default:
        return createErrorResponse(
          "Database operation failed",
          SyllabusErrorCodes.CONSTRAINT_VIOLATION,
          { code: error.code }
        );
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return createErrorResponse(
      "Invalid data provided to database",
      SyllabusErrorCodes.VALIDATION_ERROR
    );
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return createErrorResponse(
      "Database connection failed",
      SyllabusErrorCodes.INTERNAL_ERROR
    );
  }

  return createErrorResponse(
    "Database error occurred",
    SyllabusErrorCodes.INTERNAL_ERROR
  );
}

/**
 * Handle file storage errors
 * Converts Cloudinary and file system errors to user-friendly messages
 */
export function handleFileStorageError(error: unknown): ErrorResponse {
  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes("quota") || error.message.includes("limit")) {
      return createErrorResponse(
        "Storage quota exceeded",
        SyllabusErrorCodes.STORAGE_QUOTA_EXCEEDED
      );
    }

    if (error.message.includes("upload")) {
      return createErrorResponse(
        `Failed to upload file: ${error.message}`,
        SyllabusErrorCodes.UPLOAD_FAILED
      );
    }

    if (error.message.includes("delete") || error.message.includes("remove")) {
      return createErrorResponse(
        `Failed to delete file from storage: ${error.message}`,
        SyllabusErrorCodes.DELETE_FAILED
      );
    }

    return createErrorResponse(
      `File storage error: ${error.message}`,
      SyllabusErrorCodes.INTERNAL_ERROR
    );
  }

  return createErrorResponse(
    "File storage operation failed",
    SyllabusErrorCodes.INTERNAL_ERROR
  );
}

/**
 * Validation error messages for specific scenarios
 */
export const ValidationMessages = {
  // Module validation
  MODULE_TITLE_REQUIRED: "Module title is required",
  MODULE_CHAPTER_NUMBER_REQUIRED: "Chapter number is required",
  MODULE_CHAPTER_NUMBER_POSITIVE: "Chapter number must be positive",
  MODULE_ORDER_REQUIRED: "Module order is required",
  MODULE_ORDER_POSITIVE: "Module order must be positive",
  DUPLICATE_CHAPTER_NUMBER: (chapterNumber: number) =>
    `Chapter number ${chapterNumber} already exists in this syllabus`,

  // Sub-module validation
  SUBMODULE_TITLE_REQUIRED: "Sub-module title is required",
  SUBMODULE_ORDER_REQUIRED: "Sub-module order is required",
  SUBMODULE_ORDER_POSITIVE: "Sub-module order must be positive",
  SUBMODULE_PARENT_REQUIRED: "Parent module is required",

  // Document validation
  DOCUMENT_TITLE_REQUIRED: "Document title is required",
  DOCUMENT_FILE_REQUIRED: "File is required",
  INVALID_FILE_TYPE: (fileType: string) =>
    `File type ${fileType} is not supported. Supported types: PDF, Word, PowerPoint, images, videos`,
  FILE_TOO_LARGE: (size: number, maxSize: number) =>
    `File size ${formatFileSize(size)} exceeds maximum limit of ${formatFileSize(maxSize)}`,
  DOCUMENT_PARENT_REQUIRED: "Document must be attached to a module or sub-module",

  // Reordering validation
  INVALID_ORDER_SEQUENCE: "Invalid order sequence. Orders must be sequential starting from 1",
  DUPLICATE_ORDERS: "Duplicate order values detected",
  MISSING_ITEMS: "Some items are missing from the reorder operation",

  // Parent reference validation
  SYLLABUS_NOT_FOUND: "Syllabus not found",
  MODULE_NOT_FOUND: "Module not found",
  SUBMODULE_NOT_FOUND: "Sub-module not found",
  DOCUMENT_NOT_FOUND: "Document not found",
  PARENT_MISMATCH: "Item does not belong to the specified parent",
} as const;

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

/**
 * Validate file type against allowed types
 */
export function validateFileType(fileType: string): boolean {
  const allowedTypes = [
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    // Videos
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ];

  return allowedTypes.includes(fileType.toLowerCase());
}

/**
 * Validate file size against maximum limit (50MB)
 */
export function validateFileSize(fileSize: number): boolean {
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
  return fileSize <= MAX_FILE_SIZE;
}

/**
 * Create file validation error response
 */
export function createFileValidationError(
  fileType: string,
  fileSize: number
): ErrorResponse | null {
  if (!validateFileType(fileType)) {
    return createErrorResponse(
      ValidationMessages.INVALID_FILE_TYPE(fileType),
      SyllabusErrorCodes.INVALID_FILE_TYPE,
      { fileType }
    );
  }

  if (!validateFileSize(fileSize)) {
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    return createErrorResponse(
      ValidationMessages.FILE_TOO_LARGE(fileSize, MAX_FILE_SIZE),
      SyllabusErrorCodes.FILE_TOO_LARGE,
      { fileSize, maxSize: MAX_FILE_SIZE }
    );
  }

  return null;
}

/**
 * Wrap async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorContext?: string
): Promise<ActionResponse<T>> {
  try {
    const result = await operation();
    return createSuccessResponse(result);
  } catch (error) {
    console.error(`Error in ${errorContext || "operation"}:`, error);

    // Handle specific error types
    if (error instanceof ZodError) {
      return handleZodError(error);
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Prisma.PrismaClientValidationError ||
      error instanceof Prisma.PrismaClientInitializationError
    ) {
      return handlePrismaError(error);
    }

    // Handle generic errors
    if (error instanceof Error) {
      return createErrorResponse(
        error.message,
        SyllabusErrorCodes.INTERNAL_ERROR
      );
    }

    return createErrorResponse(
      "An unexpected error occurred",
      SyllabusErrorCodes.UNKNOWN_ERROR
    );
  }
}

/**
 * Validate required field
 */
export function validateRequired(
  value: any,
  fieldName: string
): string | null {
  if (value === null || value === undefined || value === "") {
    return `${fieldName} is required`;
  }
  return null;
}

/**
 * Validate positive number
 */
export function validatePositiveNumber(
  value: number,
  fieldName: string
): string | null {
  if (typeof value !== "number" || isNaN(value)) {
    return `${fieldName} must be a valid number`;
  }
  if (value <= 0) {
    return `${fieldName} must be positive`;
  }
  return null;
}

/**
 * Batch validation result
 */
export interface BatchValidationResult {
  isValid: boolean;
  errors: Array<{
    index: number;
    message: string;
    code: string;
  }>;
  validItems: number[];
  invalidItems: number[];
}

/**
 * Validate batch operation
 * Used for bulk uploads and batch updates
 */
export function validateBatch<T>(
  items: T[],
  validator: (item: T, index: number) => string | null
): BatchValidationResult {
  const errors: Array<{ index: number; message: string; code: string }> = [];
  const validItems: number[] = [];
  const invalidItems: number[] = [];

  items.forEach((item, index) => {
    const error = validator(item, index);
    if (error) {
      errors.push({
        index,
        message: error,
        code: SyllabusErrorCodes.VALIDATION_ERROR,
      });
      invalidItems.push(index);
    } else {
      validItems.push(index);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    validItems,
    invalidItems,
  };
}
