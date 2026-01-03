/**
 * Validation utilities for Enhanced Syllabus System
 * Provides comprehensive validation for modules, sub-modules, and documents
 * Requirements: Task 14 - Validation error messages
 */

import { ValidationMessages, SyllabusErrorCodes } from "./syllabus-error-handling";

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Module validation input
 */
export interface ModuleValidationInput {
  title: string;
  description?: string | null;
  chapterNumber: number;
  order: number;
  syllabusId: string;
}

/**
 * Sub-module validation input
 */
export interface SubModuleValidationInput {
  title: string;
  description?: string | null;
  order: number;
  moduleId: string;
}

/**
 * Document validation input
 */
export interface DocumentValidationInput {
  title?: string;
  description?: string | null;
  filename: string;
  fileType: string;
  fileSize: number;
  moduleId?: string;
  subModuleId?: string;
}

/**
 * Validate module data
 */
export function validateModule(
  data: Partial<ModuleValidationInput>
): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate title
  if (!data.title || data.title.trim() === "") {
    errors.push({
      field: "title",
      message: ValidationMessages.MODULE_TITLE_REQUIRED,
      code: SyllabusErrorCodes.REQUIRED_FIELD,
    });
  } else if (data.title.length > 200) {
    errors.push({
      field: "title",
      message: "Module title cannot exceed 200 characters",
      code: SyllabusErrorCodes.INVALID_FORMAT,
      value: data.title.length,
    });
  }

  // Validate chapter number
  if (data.chapterNumber === undefined || data.chapterNumber === null) {
    errors.push({
      field: "chapterNumber",
      message: ValidationMessages.MODULE_CHAPTER_NUMBER_REQUIRED,
      code: SyllabusErrorCodes.REQUIRED_FIELD,
    });
  } else if (typeof data.chapterNumber !== "number" || data.chapterNumber <= 0) {
    errors.push({
      field: "chapterNumber",
      message: ValidationMessages.MODULE_CHAPTER_NUMBER_POSITIVE,
      code: SyllabusErrorCodes.INVALID_TYPE,
      value: data.chapterNumber,
    });
  }

  // Validate order
  if (data.order === undefined || data.order === null) {
    errors.push({
      field: "order",
      message: ValidationMessages.MODULE_ORDER_REQUIRED,
      code: SyllabusErrorCodes.REQUIRED_FIELD,
    });
  } else if (typeof data.order !== "number" || data.order <= 0) {
    errors.push({
      field: "order",
      message: ValidationMessages.MODULE_ORDER_POSITIVE,
      code: SyllabusErrorCodes.INVALID_TYPE,
      value: data.order,
    });
  }

  // Validate syllabus ID
  if (!data.syllabusId || data.syllabusId.trim() === "") {
    errors.push({
      field: "syllabusId",
      message: "Syllabus ID is required",
      code: SyllabusErrorCodes.REQUIRED_FIELD,
    });
  }

  // Validate description length if provided
  if (data.description && data.description.length > 1000) {
    errors.push({
      field: "description",
      message: "Module description cannot exceed 1000 characters",
      code: SyllabusErrorCodes.INVALID_FORMAT,
      value: data.description.length,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate sub-module data
 */
export function validateSubModule(
  data: Partial<SubModuleValidationInput>
): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate title
  if (!data.title || data.title.trim() === "") {
    errors.push({
      field: "title",
      message: ValidationMessages.SUBMODULE_TITLE_REQUIRED,
      code: SyllabusErrorCodes.REQUIRED_FIELD,
    });
  } else if (data.title.length > 200) {
    errors.push({
      field: "title",
      message: "Sub-module title cannot exceed 200 characters",
      code: SyllabusErrorCodes.INVALID_FORMAT,
      value: data.title.length,
    });
  }

  // Validate order
  if (data.order === undefined || data.order === null) {
    errors.push({
      field: "order",
      message: ValidationMessages.SUBMODULE_ORDER_REQUIRED,
      code: SyllabusErrorCodes.REQUIRED_FIELD,
    });
  } else if (typeof data.order !== "number" || data.order <= 0) {
    errors.push({
      field: "order",
      message: ValidationMessages.SUBMODULE_ORDER_POSITIVE,
      code: SyllabusErrorCodes.INVALID_TYPE,
      value: data.order,
    });
  }

  // Validate module ID
  if (!data.moduleId || data.moduleId.trim() === "") {
    errors.push({
      field: "moduleId",
      message: ValidationMessages.SUBMODULE_PARENT_REQUIRED,
      code: SyllabusErrorCodes.REQUIRED_FIELD,
    });
  }

  // Validate description length if provided
  if (data.description && data.description.length > 1000) {
    errors.push({
      field: "description",
      message: "Sub-module description cannot exceed 1000 characters",
      code: SyllabusErrorCodes.INVALID_FORMAT,
      value: data.description.length,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate document data
 */
export function validateDocument(
  data: Partial<DocumentValidationInput>
): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate filename
  if (!data.filename || data.filename.trim() === "") {
    errors.push({
      field: "filename",
      message: "Filename is required",
      code: SyllabusErrorCodes.REQUIRED_FIELD,
    });
  }

  // Validate file type
  if (!data.fileType || data.fileType.trim() === "") {
    errors.push({
      field: "fileType",
      message: "File type is required",
      code: SyllabusErrorCodes.REQUIRED_FIELD,
    });
  } else if (!isValidFileType(data.fileType)) {
    errors.push({
      field: "fileType",
      message: ValidationMessages.INVALID_FILE_TYPE(data.fileType),
      code: SyllabusErrorCodes.INVALID_FILE_TYPE,
      value: data.fileType,
    });
  }

  // Validate file size
  if (data.fileSize === undefined || data.fileSize === null) {
    errors.push({
      field: "fileSize",
      message: "File size is required",
      code: SyllabusErrorCodes.REQUIRED_FIELD,
    });
  } else if (data.fileSize <= 0) {
    errors.push({
      field: "fileSize",
      message: "File size must be positive",
      code: SyllabusErrorCodes.INVALID_TYPE,
      value: data.fileSize,
    });
  } else if (!isValidFileSize(data.fileSize)) {
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    errors.push({
      field: "fileSize",
      message: ValidationMessages.FILE_TOO_LARGE(data.fileSize, MAX_FILE_SIZE),
      code: SyllabusErrorCodes.FILE_TOO_LARGE,
      value: data.fileSize,
    });
  }

  // Validate parent reference (must have either moduleId or subModuleId)
  if (!data.moduleId && !data.subModuleId) {
    errors.push({
      field: "parent",
      message: ValidationMessages.DOCUMENT_PARENT_REQUIRED,
      code: SyllabusErrorCodes.REQUIRED_FIELD,
    });
  }

  // Validate title length if provided
  if (data.title && data.title.length > 200) {
    errors.push({
      field: "title",
      message: "Document title cannot exceed 200 characters",
      code: SyllabusErrorCodes.INVALID_FORMAT,
      value: data.title.length,
    });
  }

  // Validate description length if provided
  if (data.description && data.description.length > 500) {
    errors.push({
      field: "description",
      message: "Document description cannot exceed 500 characters",
      code: SyllabusErrorCodes.INVALID_FORMAT,
      value: data.description.length,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if file type is valid
 */
function isValidFileType(fileType: string): boolean {
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
 * Check if file size is valid (max 50MB)
 */
function isValidFileSize(fileSize: number): boolean {
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
  return fileSize <= MAX_FILE_SIZE;
}

/**
 * Validate reorder operation
 */
export function validateReorder(
  items: Array<{ id: string; order: number }>
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check for duplicate IDs
  const ids = items.map((item) => item.id);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    errors.push({
      field: "items",
      message: "Duplicate item IDs detected",
      code: SyllabusErrorCodes.VALIDATION_ERROR,
    });
  }

  // Check for duplicate orders
  const orders = items.map((item) => item.order);
  const uniqueOrders = new Set(orders);
  if (orders.length !== uniqueOrders.size) {
    errors.push({
      field: "orders",
      message: ValidationMessages.DUPLICATE_ORDERS,
      code: SyllabusErrorCodes.VALIDATION_ERROR,
    });
  }

  // Check for sequential orders starting from 1
  const sortedOrders = [...orders].sort((a, b) => a - b);
  const expectedOrders = Array.from({ length: items.length }, (_, i) => i + 1);
  const isSequential = sortedOrders.every(
    (order, index) => order === expectedOrders[index]
  );

  if (!isSequential) {
    errors.push({
      field: "orders",
      message: ValidationMessages.INVALID_ORDER_SEQUENCE,
      code: SyllabusErrorCodes.INVALID_MODULE_ORDER,
      value: { received: sortedOrders, expected: expectedOrders },
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate chapter numbers for uniqueness
 */
export function validateChapterNumbers(
  items: Array<{ id: string; chapterNumber: number }>
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check for duplicate chapter numbers
  const chapterNumbers = items.map((item) => item.chapterNumber);
  const uniqueChapterNumbers = new Set(chapterNumbers);

  if (chapterNumbers.length !== uniqueChapterNumbers.size) {
    // Find duplicates
    const duplicates = chapterNumbers.filter(
      (num, index) => chapterNumbers.indexOf(num) !== index
    );
    const uniqueDuplicates = [...new Set(duplicates)];

    errors.push({
      field: "chapterNumbers",
      message: `Duplicate chapter numbers detected: ${uniqueDuplicates.join(", ")}`,
      code: SyllabusErrorCodes.DUPLICATE_CHAPTER_NUMBER,
      value: uniqueDuplicates,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate bulk upload
 */
export interface BulkUploadValidationResult {
  isValid: boolean;
  validFiles: Array<{ index: number; file: DocumentValidationInput }>;
  invalidFiles: Array<{ index: number; file: DocumentValidationInput; errors: ValidationError[] }>;
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}

export function validateBulkUpload(
  files: DocumentValidationInput[]
): BulkUploadValidationResult {
  const validFiles: Array<{ index: number; file: DocumentValidationInput }> = [];
  const invalidFiles: Array<{ 
    index: number; 
    file: DocumentValidationInput; 
    errors: ValidationError[] 
  }> = [];

  files.forEach((file, index) => {
    const result = validateDocument(file);
    if (result.isValid) {
      validFiles.push({ index, file });
    } else {
      invalidFiles.push({ index, file, errors: result.errors });
    }
  });

  return {
    isValid: invalidFiles.length === 0,
    validFiles,
    invalidFiles,
    summary: {
      total: files.length,
      valid: validFiles.length,
      invalid: invalidFiles.length,
    },
  };
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(
  errors: ValidationError[]
): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  errors.forEach((error) => {
    if (!formatted[error.field]) {
      formatted[error.field] = [];
    }
    formatted[error.field].push(error.message);
  });

  return formatted;
}

/**
 * Get first validation error message
 */
export function getFirstError(errors: ValidationError[]): string | null {
  return errors.length > 0 ? errors[0].message : null;
}
