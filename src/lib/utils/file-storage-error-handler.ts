/**
 * File storage error handling utilities
 * Handles Cloudinary and file system errors with proper error messages
 * Requirements: Task 14 - File storage error handling
 */

import {
  createErrorResponse,
  SyllabusErrorCodes,
  type ErrorResponse,
} from "./syllabus-error-handling";

/**
 * File upload result
 */
export interface FileUploadResult {
  success: boolean;
  fileUrl?: string;
  publicId?: string;
  error?: string;
  code?: string;
}

/**
 * File delete result
 */
export interface FileDeleteResult {
  success: boolean;
  error?: string;
  code?: string;
}

/**
 * Bulk upload result
 */
export interface BulkUploadResult {
  success: boolean;
  results: Array<{
    index: number;
    filename: string;
    success: boolean;
    fileUrl?: string;
    publicId?: string;
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

/**
 * Wrap file upload operation with error handling
 */
export async function withFileUploadErrorHandling(
  uploadFn: () => Promise<{ url: string; publicId: string }>,
  filename: string
): Promise<FileUploadResult> {
  try {
    const result = await uploadFn();
    return {
      success: true,
      fileUrl: result.url,
      publicId: result.publicId,
    };
  } catch (error) {
    console.error(`File upload error for ${filename}:`, error);

    if (error instanceof Error) {
      // Check for specific error patterns
      if (error.message.includes("quota") || error.message.includes("limit")) {
        return {
          success: false,
          error: "Storage quota exceeded. Please contact administrator.",
          code: SyllabusErrorCodes.STORAGE_QUOTA_EXCEEDED,
        };
      }

      if (error.message.includes("network") || error.message.includes("timeout")) {
        return {
          success: false,
          error: "Network error during upload. Please check your connection and try again.",
          code: SyllabusErrorCodes.UPLOAD_FAILED,
        };
      }

      if (error.message.includes("invalid") || error.message.includes("format")) {
        return {
          success: false,
          error: "Invalid file format. Please check the file and try again.",
          code: SyllabusErrorCodes.INVALID_FILE_TYPE,
        };
      }

      return {
        success: false,
        error: `Upload failed: ${error.message}`,
        code: SyllabusErrorCodes.UPLOAD_FAILED,
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred during upload",
      code: SyllabusErrorCodes.UPLOAD_FAILED,
    };
  }
}

/**
 * Wrap file delete operation with error handling
 */
export async function withFileDeleteErrorHandling(
  deleteFn: () => Promise<void>,
  publicId: string
): Promise<FileDeleteResult> {
  try {
    await deleteFn();
    return {
      success: true,
    };
  } catch (error) {
    console.error(`File delete error for ${publicId}:`, error);

    if (error instanceof Error) {
      // Check for specific error patterns
      if (error.message.includes("not found") || error.message.includes("404")) {
        // File already deleted or doesn't exist - consider this a success
        return {
          success: true,
        };
      }

      if (error.message.includes("network") || error.message.includes("timeout")) {
        return {
          success: false,
          error: "Network error during deletion. The file may still exist in storage.",
          code: SyllabusErrorCodes.DELETE_FAILED,
        };
      }

      return {
        success: false,
        error: `Delete failed: ${error.message}`,
        code: SyllabusErrorCodes.DELETE_FAILED,
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred during deletion",
      code: SyllabusErrorCodes.DELETE_FAILED,
    };
  }
}

/**
 * Handle bulk file upload with individual error tracking
 */
export async function handleBulkUpload(
  files: Array<{ filename: string; uploadFn: () => Promise<{ url: string; publicId: string }> }>
): Promise<BulkUploadResult> {
  const results: BulkUploadResult["results"] = [];

  // Process uploads sequentially to avoid overwhelming the service
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const uploadResult = await withFileUploadErrorHandling(
      file.uploadFn,
      file.filename
    );

    results.push({
      index: i,
      filename: file.filename,
      success: uploadResult.success,
      fileUrl: uploadResult.fileUrl,
      publicId: uploadResult.publicId,
      error: uploadResult.error,
    });
  }

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return {
    success: failed === 0,
    results,
    summary: {
      total: files.length,
      successful,
      failed,
    },
  };
}

/**
 * Validate file before upload
 */
export function validateFileBeforeUpload(
  file: File
): { valid: boolean; error?: ErrorResponse } {
  // Check file size (50MB max)
  const MAX_FILE_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: createErrorResponse(
        `File size ${formatFileSize(file.size)} exceeds maximum limit of ${formatFileSize(MAX_FILE_SIZE)}`,
        SyllabusErrorCodes.FILE_TOO_LARGE,
        { fileSize: file.size, maxSize: MAX_FILE_SIZE }
      ),
    };
  }

  // Check file type
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ];

  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: createErrorResponse(
        `File type ${file.type} is not supported. Supported types: PDF, Word, PowerPoint, images, videos`,
        SyllabusErrorCodes.INVALID_FILE_TYPE,
        { fileType: file.type }
      ),
    };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

/**
 * Get file type category
 */
export function getFileTypeCategory(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.includes("word") || mimeType.includes("document")) return "document";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "presentation";
  return "file";
}

/**
 * Retry file operation with exponential backoff
 */
export async function retryFileOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on certain errors
      if (
        lastError.message.includes("quota") ||
        lastError.message.includes("invalid") ||
        lastError.message.includes("format")
      ) {
        throw lastError;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Operation failed after retries");
}

/**
 * Clean up orphaned files
 * Used when database operation fails after successful upload
 */
export async function cleanupOrphanedFile(
  publicId: string,
  deleteFn: (publicId: string) => Promise<void>
): Promise<void> {
  try {
    await deleteFn(publicId);
    console.log(`Cleaned up orphaned file: ${publicId}`);
  } catch (error) {
    console.error(`Failed to cleanup orphaned file ${publicId}:`, error);
    // Don't throw - this is a cleanup operation
  }
}
