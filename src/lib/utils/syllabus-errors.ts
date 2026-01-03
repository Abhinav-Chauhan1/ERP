/**
 * Central export for all syllabus error handling utilities
 * Requirements: Task 14 - Error handling and validation
 */

// Core error handling
export {
  createErrorResponse,
  createSuccessResponse,
  handleZodError,
  handlePrismaError,
  handleFileStorageError,
  withErrorHandling,
  validateFileType,
  validateFileSize,
  createFileValidationError,
  validateRequired,
  validatePositiveNumber,
  validateBatch,
  SyllabusErrorCodes,
  ValidationMessages,
  type ErrorResponse,
  type SuccessResponse,
  type ActionResponse,
  type BatchValidationResult,
} from "./syllabus-error-handling";

// Validation utilities
export {
  validateModule,
  validateSubModule,
  validateDocument,
  validateReorder,
  validateChapterNumbers,
  validateBulkUpload,
  formatValidationErrors,
  getFirstError,
  type ValidationError,
  type ValidationResult,
  type ModuleValidationInput,
  type SubModuleValidationInput,
  type DocumentValidationInput,
  type BulkUploadValidationResult,
} from "./syllabus-validation";

// Database error handling
export {
  handleDatabaseError,
  withDatabaseErrorHandling,
  withTransactionErrorHandling,
  retryDatabaseOperation,
  ensureRecordExists,
  validateForeignKey,
  handleCascadeDelete,
  handleBatchOperation,
  type DatabaseOperationResult,
  type TransactionResult,
  type BatchOperationResult,
} from "./database-error-handler";

// File storage error handling
export {
  withFileUploadErrorHandling,
  withFileDeleteErrorHandling,
  handleBulkUpload,
  validateFileBeforeUpload,
  getFileExtension,
  getFileTypeCategory,
  retryFileOperation,
  cleanupOrphanedFile,
  type FileUploadResult,
  type FileDeleteResult,
  type BulkUploadResult,
} from "./file-storage-error-handler";

// Error logging
export {
  errorLogger,
  logModuleError,
  logSubModuleError,
  logDocumentError,
  logFileStorageError,
  logDatabaseError,
  logValidationError,
  logProgressError,
  logReorderingError,
  createErrorReport,
  sendErrorToMonitoring,
  type ErrorLogEntry,
} from "./error-logger";
