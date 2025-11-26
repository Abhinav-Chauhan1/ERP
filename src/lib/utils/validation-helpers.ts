import { ZodError } from "zod";

/**
 * Format Zod validation errors for API responses
 */
export function formatValidationErrors(error: ZodError): {
  field: string;
  message: string;
}[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

/**
 * Create a standardized validation error response
 */
export function createValidationErrorResponse(error: ZodError) {
  return {
    message: "Validation failed",
    errors: formatValidationErrors(error),
  };
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(message: string, statusCode: number = 500) {
  return {
    message,
    statusCode,
  };
}

/**
 * Check if an error is a database constraint violation
 */
export function isDatabaseConstraintError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('Unique constraint') ||
      error.message.includes('Foreign key constraint') ||
      error.message.includes('unique_violation') ||
      error.message.includes('foreign_key_violation')
    );
  }
  return false;
}

/**
 * Get user-friendly message for database errors
 */
export function getDatabaseErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('Unique constraint')) {
      return "A record with this information already exists";
    }
    if (error.message.includes('Foreign key constraint')) {
      return "Cannot complete operation due to related records";
    }
  }
  return "A database error occurred. Please try again.";
}

/**
 * Sanitize error messages for client responses
 * Removes sensitive information like database paths, stack traces, etc.
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Remove any file paths or stack traces
    const message = error.message.split('\n')[0];
    
    // Remove database-specific details
    return message
      .replace(/at .+:\d+:\d+/g, '')
      .replace(/\(.+\)/g, '')
      .trim();
  }
  
  return "An unexpected error occurred";
}

/**
 * Validate required fields are present in an object
 */
export function validateRequiredFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): { valid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missingFields.push(String(field));
    }
  }
  
  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Create validation error for missing required fields
 */
export function createMissingFieldsError(missingFields: string[]) {
  return {
    message: "Required fields are missing",
    errors: missingFields.map((field) => ({
      field,
      message: `${field} is required`,
    })),
  };
}
