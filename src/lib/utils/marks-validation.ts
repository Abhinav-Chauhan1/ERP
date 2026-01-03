/**
 * Comprehensive validation utilities for marks entry
 * Implements Requirements 16.1, 16.2, 16.3, 16.4, 16.5
 */

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface MarkConfig {
  theoryMaxMarks?: number | null;
  practicalMaxMarks?: number | null;
  internalMaxMarks?: number | null;
  totalMarks: number;
}

export interface MarkEntry {
  studentId: string;
  theoryMarks?: number | null;
  practicalMarks?: number | null;
  internalMarks?: number | null;
  isAbsent: boolean;
  remarks?: string;
}

/**
 * Validation error codes for specific error types
 */
export const ValidationErrorCodes = {
  REQUIRED_FIELD: "REQUIRED_FIELD",
  INVALID_TYPE: "INVALID_TYPE",
  NEGATIVE_VALUE: "NEGATIVE_VALUE",
  EXCEEDS_MAXIMUM: "EXCEEDS_MAXIMUM",
  INVALID_FORMAT: "INVALID_FORMAT",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  MISSING_CONFIGURATION: "MISSING_CONFIGURATION",
  COMPONENT_SUM_MISMATCH: "COMPONENT_SUM_MISMATCH",
  REMARKS_TOO_LONG: "REMARKS_TOO_LONG",
  NO_MARKS_PROVIDED: "NO_MARKS_PROVIDED",
} as const;

/**
 * Validate that a value is numeric
 * Requirement 16.1: Marks must be numeric and non-negative
 */
export function validateNumeric(
  value: any,
  fieldName: string
): ValidationError | null {
  if (value === null || value === undefined) {
    return null; // Null/undefined is valid for optional fields
  }

  if (typeof value === "string") {
    // Try to parse string to number
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid number`,
        code: ValidationErrorCodes.INVALID_TYPE,
        value,
      };
    }
    // Check if parsed value is negative
    if (parsed < 0) {
      return {
        field: fieldName,
        message: `${fieldName} cannot be negative`,
        code: ValidationErrorCodes.NEGATIVE_VALUE,
        value: parsed,
      };
    }
    return null;
  }

  if (typeof value !== "number") {
    return {
      field: fieldName,
      message: `${fieldName} must be a number`,
      code: ValidationErrorCodes.INVALID_TYPE,
      value,
    };
  }

  if (isNaN(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid number`,
      code: ValidationErrorCodes.INVALID_TYPE,
      value,
    };
  }

  if (value < 0) {
    return {
      field: fieldName,
      message: `${fieldName} cannot be negative`,
      code: ValidationErrorCodes.NEGATIVE_VALUE,
      value,
    };
  }

  return null;
}

/**
 * Validate that marks do not exceed maximum
 * Requirement 16.2: Display error when marks exceed maximum
 */
export function validateMaximum(
  value: number | null | undefined,
  maximum: number | null | undefined,
  fieldName: string
): ValidationError | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (maximum === null || maximum === undefined) {
    return null; // No maximum configured
  }

  if (value > maximum) {
    return {
      field: fieldName,
      message: `${fieldName} (${value}) exceeds maximum allowed (${maximum})`,
      code: ValidationErrorCodes.EXCEEDS_MAXIMUM,
      value,
    };
  }

  return null;
}

/**
 * Validate required fields
 * Requirement 16.3: Highlight required fields and prevent submission
 */
export function validateRequired(
  value: any,
  fieldName: string
): ValidationError | null {
  if (value === null || value === undefined || value === "") {
    return {
      field: fieldName,
      message: `${fieldName} is required`,
      code: ValidationErrorCodes.REQUIRED_FIELD,
      value,
    };
  }
  return null;
}

/**
 * Validate remarks length
 */
export function validateRemarksLength(
  remarks: string | null | undefined
): ValidationError | null {
  if (!remarks) {
    return null;
  }

  if (remarks.length > 500) {
    return {
      field: "remarks",
      message: `Remarks cannot exceed 500 characters (current: ${remarks.length})`,
      code: ValidationErrorCodes.REMARKS_TOO_LONG,
      value: remarks.length,
    };
  }

  return null;
}

/**
 * Validate component sum equals total
 * Requirement 4.2: Component sum must equal total marks
 */
export function validateComponentSum(
  config: MarkConfig
): ValidationError | null {
  const sum =
    (config.theoryMaxMarks || 0) +
    (config.practicalMaxMarks || 0) +
    (config.internalMaxMarks || 0);

  // Allow small floating point differences
  if (Math.abs(sum - config.totalMarks) > 0.01) {
    return {
      field: "totalMarks",
      message: `Sum of components (${sum}) does not equal total marks (${config.totalMarks})`,
      code: ValidationErrorCodes.COMPONENT_SUM_MISMATCH,
      value: { sum, total: config.totalMarks },
    };
  }

  return null;
}

/**
 * Comprehensive validation for a single mark entry
 * Implements all validation requirements
 */
export function validateMarkEntry(
  entry: MarkEntry,
  config: MarkConfig | null,
  index?: number
): ValidationResult {
  const errors: ValidationError[] = [];
  const prefix = index !== undefined ? `Student ${index + 1}` : "Entry";

  // Validate student ID is required
  const studentIdError = validateRequired(entry.studentId, `${prefix} - Student ID`);
  if (studentIdError) {
    errors.push(studentIdError);
  }

  // If student is absent, skip marks validation
  if (entry.isAbsent) {
    // Validate remarks if provided
    const remarksError = validateRemarksLength(entry.remarks);
    if (remarksError) {
      errors.push({
        ...remarksError,
        field: `${prefix} - ${remarksError.field}`,
      });
    }
    return { isValid: errors.length === 0, errors };
  }

  // For non-absent students, validate at least one mark is provided
  const hasAnyMarks =
    (entry.theoryMarks !== null && entry.theoryMarks !== undefined) ||
    (entry.practicalMarks !== null && entry.practicalMarks !== undefined) ||
    (entry.internalMarks !== null && entry.internalMarks !== undefined);

  if (!hasAnyMarks) {
    errors.push({
      field: `${prefix} - marks`,
      message: "At least one mark component is required for non-absent students",
      code: ValidationErrorCodes.NO_MARKS_PROVIDED,
    });
  }

  // Validate theory marks
  if (entry.theoryMarks !== null && entry.theoryMarks !== undefined) {
    const numericError = validateNumeric(entry.theoryMarks, `${prefix} - Theory marks`);
    if (numericError) {
      errors.push(numericError);
    } else if (config?.theoryMaxMarks) {
      const maxError = validateMaximum(
        entry.theoryMarks,
        config.theoryMaxMarks,
        `${prefix} - Theory marks`
      );
      if (maxError) {
        errors.push(maxError);
      }
    }
  }

  // Validate practical marks
  if (entry.practicalMarks !== null && entry.practicalMarks !== undefined) {
    const numericError = validateNumeric(entry.practicalMarks, `${prefix} - Practical marks`);
    if (numericError) {
      errors.push(numericError);
    } else if (config?.practicalMaxMarks) {
      const maxError = validateMaximum(
        entry.practicalMarks,
        config.practicalMaxMarks,
        `${prefix} - Practical marks`
      );
      if (maxError) {
        errors.push(maxError);
      }
    }
  }

  // Validate internal marks
  if (entry.internalMarks !== null && entry.internalMarks !== undefined) {
    const numericError = validateNumeric(entry.internalMarks, `${prefix} - Internal marks`);
    if (numericError) {
      errors.push(numericError);
    } else if (config?.internalMaxMarks) {
      const maxError = validateMaximum(
        entry.internalMarks,
        config.internalMaxMarks,
        `${prefix} - Internal marks`
      );
      if (maxError) {
        errors.push(maxError);
      }
    }
  }

  // Validate remarks
  const remarksError = validateRemarksLength(entry.remarks);
  if (remarksError) {
    errors.push({
      ...remarksError,
      field: `${prefix} - ${remarksError.field}`,
    });
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Detect duplicate entries in marks submission
 * Requirement 16.4: Detect and warn about duplicate entries
 */
export function detectDuplicates(
  entries: MarkEntry[]
): Map<string, number[]> {
  const studentIdMap = new Map<string, number[]>();

  entries.forEach((entry, index) => {
    if (entry.studentId) {
      const existing = studentIdMap.get(entry.studentId) || [];
      existing.push(index);
      studentIdMap.set(entry.studentId, existing);
    }
  });

  // Filter to only duplicates (more than one occurrence)
  const duplicates = new Map<string, number[]>();
  studentIdMap.forEach((indices, studentId) => {
    if (indices.length > 1) {
      duplicates.set(studentId, indices);
    }
  });

  return duplicates;
}

/**
 * Validate bulk marks entry
 */
export function validateBulkMarks(
  entries: MarkEntry[],
  config: MarkConfig | null
): {
  isValid: boolean;
  errors: Record<string, ValidationError[]>;
  duplicates: Map<string, number[]>;
} {
  const errors: Record<string, ValidationError[]> = {};
  let hasErrors = false;

  // Validate each entry
  entries.forEach((entry, index) => {
    const result = validateMarkEntry(entry, config, index);
    if (!result.isValid) {
      errors[`student_${index}`] = result.errors;
      hasErrors = true;
    }
  });

  // Detect duplicates
  const duplicates = detectDuplicates(entries);

  return {
    isValid: !hasErrors && duplicates.size === 0,
    errors,
    duplicates,
  };
}

/**
 * Format validation errors for API response
 * Requirement 16.5: Specific error messages for each validation failure
 */
export function formatValidationErrors(
  errors: Record<string, ValidationError[]>
): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  Object.entries(errors).forEach(([key, errorList]) => {
    formatted[key] = errorList.map((error) => error.message);
  });

  return formatted;
}

/**
 * Create a standardized error response
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: Record<string, string[]>;
  duplicates?: { studentId: string; indices: number[] }[];
  timestamp: string;
}

export function createErrorResponse(
  message: string,
  code: string,
  details?: Record<string, string[]>,
  duplicates?: Map<string, number[]>
): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString(),
  };

  if (details && Object.keys(details).length > 0) {
    response.details = details;
  }

  if (duplicates && duplicates.size > 0) {
    response.duplicates = Array.from(duplicates.entries()).map(
      ([studentId, indices]) => ({
        studentId,
        indices,
      })
    );
  }

  return response;
}

/**
 * Error recovery: Separate valid and invalid entries
 */
export function separateValidInvalidEntries(
  entries: MarkEntry[],
  config: MarkConfig | null
): {
  valid: { entry: MarkEntry; index: number }[];
  invalid: { entry: MarkEntry; index: number; errors: ValidationError[] }[];
} {
  const valid: { entry: MarkEntry; index: number }[] = [];
  const invalid: { entry: MarkEntry; index: number; errors: ValidationError[] }[] = [];

  entries.forEach((entry, index) => {
    const result = validateMarkEntry(entry, config, index);
    if (result.isValid) {
      valid.push({ entry, index });
    } else {
      invalid.push({ entry, index, errors: result.errors });
    }
  });

  return { valid, invalid };
}
