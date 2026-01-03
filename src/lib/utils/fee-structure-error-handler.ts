import { ZodError } from "zod";

/**
 * Error codes for fee structure validation and operations
 */
export enum FeeStructureErrorCode {
  NO_CLASSES_SELECTED = "NO_CLASSES_SELECTED",
  INVALID_CLASS_ID = "INVALID_CLASS_ID",
  DUPLICATE_CLASS_ASSOCIATION = "DUPLICATE_CLASS_ASSOCIATION",
  INVALID_ACADEMIC_YEAR = "INVALID_ACADEMIC_YEAR",
  INVALID_DATE_RANGE = "INVALID_DATE_RANGE",
  NO_FEE_ITEMS = "NO_FEE_ITEMS",
  INVALID_AMOUNT = "INVALID_AMOUNT",
  TEMPLATE_CANNOT_BE_ACTIVE = "TEMPLATE_CANNOT_BE_ACTIVE",
  DUPLICATE_CLASS_AMOUNT = "DUPLICATE_CLASS_AMOUNT",
  CLASS_NOT_FOUND = "CLASS_NOT_FOUND",
  FEE_STRUCTURE_NOT_FOUND = "FEE_STRUCTURE_NOT_FOUND",
  FEE_TYPE_NOT_FOUND = "FEE_TYPE_NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  DATABASE_ERROR = "DATABASE_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
}

/**
 * Custom error class for fee structure validation errors
 */
export class FeeStructureValidationError extends Error {
  code: FeeStructureErrorCode;
  field?: string;
  details?: any;

  constructor(
    code: FeeStructureErrorCode,
    message: string,
    field?: string,
    details?: any
  ) {
    super(message);
    this.name = "FeeStructureValidationError";
    this.code = code;
    this.field = field;
    this.details = details;
  }
}

/**
 * Error messages for each error code
 */
export const FeeStructureErrorMessages: Record<FeeStructureErrorCode, string> = {
  [FeeStructureErrorCode.NO_CLASSES_SELECTED]:
    "At least one class must be selected",
  [FeeStructureErrorCode.INVALID_CLASS_ID]:
    "One or more selected classes are invalid",
  [FeeStructureErrorCode.DUPLICATE_CLASS_ASSOCIATION]:
    "This class is already associated with the fee structure",
  [FeeStructureErrorCode.INVALID_ACADEMIC_YEAR]:
    "Invalid academic year selected",
  [FeeStructureErrorCode.INVALID_DATE_RANGE]:
    "Valid from date must be before valid to date",
  [FeeStructureErrorCode.NO_FEE_ITEMS]:
    "At least one fee item is required",
  [FeeStructureErrorCode.INVALID_AMOUNT]:
    "Amount must be a positive number",
  [FeeStructureErrorCode.TEMPLATE_CANNOT_BE_ACTIVE]:
    "Templates cannot be marked as active",
  [FeeStructureErrorCode.DUPLICATE_CLASS_AMOUNT]:
    "Each class can only have one custom amount",
  [FeeStructureErrorCode.CLASS_NOT_FOUND]:
    "Class not found",
  [FeeStructureErrorCode.FEE_STRUCTURE_NOT_FOUND]:
    "Fee structure not found",
  [FeeStructureErrorCode.FEE_TYPE_NOT_FOUND]:
    "Fee type not found",
  [FeeStructureErrorCode.UNAUTHORIZED]:
    "You don't have permission to perform this action",
  [FeeStructureErrorCode.DATABASE_ERROR]:
    "A database error occurred",
  [FeeStructureErrorCode.VALIDATION_ERROR]:
    "Validation failed",
};

/**
 * Interface for standardized error response
 */
export interface FeeStructureError {
  code: FeeStructureErrorCode;
  message: string;
  field?: string;
  details?: any;
}

/**
 * Handles errors and converts them to standardized FeeStructureError format
 */
export function handleFeeStructureError(error: unknown): FeeStructureError {
  // Handle FeeStructureValidationError instances
  if (error instanceof FeeStructureValidationError) {
    return {
      code: error.code,
      message: error.message,
      field: error.field,
      details: error.details,
    };
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return {
      code: FeeStructureErrorCode.VALIDATION_ERROR,
      message: "Validation failed",
      details: error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    };
  }

  // Handle Prisma errors
  if (error && typeof error === "object" && "code" in error) {
    const prismaError = error as any;

    switch (prismaError.code) {
      case "P2002":
        return {
          code: FeeStructureErrorCode.DUPLICATE_CLASS_ASSOCIATION,
          message: "A record with this information already exists",
          details: prismaError.meta,
        };
      case "P2025":
        return {
          code: FeeStructureErrorCode.FEE_STRUCTURE_NOT_FOUND,
          message: "Record not found",
          details: prismaError.meta,
        };
      case "P2003":
        return {
          code: FeeStructureErrorCode.INVALID_CLASS_ID,
          message: "Invalid reference to related record",
          details: prismaError.meta,
        };
      default:
        return {
          code: FeeStructureErrorCode.DATABASE_ERROR,
          message: "Database operation failed",
          details: prismaError.message,
        };
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      code: FeeStructureErrorCode.DATABASE_ERROR,
      message: error.message,
    };
  }

  // Fallback for unknown errors
  return {
    code: FeeStructureErrorCode.DATABASE_ERROR,
    message: "An unexpected error occurred",
  };
}

/**
 * Creates a no classes selected error
 */
export function createNoClassesSelectedError(): FeeStructureValidationError {
  return new FeeStructureValidationError(
    FeeStructureErrorCode.NO_CLASSES_SELECTED,
    FeeStructureErrorMessages[FeeStructureErrorCode.NO_CLASSES_SELECTED],
    "classIds"
  );
}

/**
 * Creates an invalid class ID error
 */
export function createInvalidClassIdError(classId: string): FeeStructureValidationError {
  return new FeeStructureValidationError(
    FeeStructureErrorCode.INVALID_CLASS_ID,
    `Invalid class ID: ${classId}`,
    "classIds",
    { classId }
  );
}

/**
 * Creates a duplicate class association error
 */
export function createDuplicateClassAssociationError(
  classId: string
): FeeStructureValidationError {
  return new FeeStructureValidationError(
    FeeStructureErrorCode.DUPLICATE_CLASS_ASSOCIATION,
    FeeStructureErrorMessages[FeeStructureErrorCode.DUPLICATE_CLASS_ASSOCIATION],
    "classIds",
    { classId }
  );
}

/**
 * Creates an invalid academic year error
 */
export function createInvalidAcademicYearError(
  academicYearId: string
): FeeStructureValidationError {
  return new FeeStructureValidationError(
    FeeStructureErrorCode.INVALID_ACADEMIC_YEAR,
    `Invalid academic year ID: ${academicYearId}`,
    "academicYearId",
    { academicYearId }
  );
}

/**
 * Creates an invalid date range error
 */
export function createInvalidDateRangeError(): FeeStructureValidationError {
  return new FeeStructureValidationError(
    FeeStructureErrorCode.INVALID_DATE_RANGE,
    FeeStructureErrorMessages[FeeStructureErrorCode.INVALID_DATE_RANGE],
    "validFrom"
  );
}

/**
 * Creates a no fee items error
 */
export function createNoFeeItemsError(): FeeStructureValidationError {
  return new FeeStructureValidationError(
    FeeStructureErrorCode.NO_FEE_ITEMS,
    FeeStructureErrorMessages[FeeStructureErrorCode.NO_FEE_ITEMS],
    "items"
  );
}

/**
 * Creates an invalid amount error
 */
export function createInvalidAmountError(field: string): FeeStructureValidationError {
  return new FeeStructureValidationError(
    FeeStructureErrorCode.INVALID_AMOUNT,
    FeeStructureErrorMessages[FeeStructureErrorCode.INVALID_AMOUNT],
    field
  );
}

/**
 * Creates a template cannot be active error
 */
export function createTemplateCannotBeActiveError(): FeeStructureValidationError {
  return new FeeStructureValidationError(
    FeeStructureErrorCode.TEMPLATE_CANNOT_BE_ACTIVE,
    FeeStructureErrorMessages[FeeStructureErrorCode.TEMPLATE_CANNOT_BE_ACTIVE],
    "isTemplate"
  );
}

/**
 * Creates a duplicate class amount error
 */
export function createDuplicateClassAmountError(
  classId: string
): FeeStructureValidationError {
  return new FeeStructureValidationError(
    FeeStructureErrorCode.DUPLICATE_CLASS_AMOUNT,
    FeeStructureErrorMessages[FeeStructureErrorCode.DUPLICATE_CLASS_AMOUNT],
    "classAmounts",
    { classId }
  );
}

/**
 * Creates a class not found error
 */
export function createClassNotFoundError(classId: string): FeeStructureValidationError {
  return new FeeStructureValidationError(
    FeeStructureErrorCode.CLASS_NOT_FOUND,
    `Class not found: ${classId}`,
    "classIds",
    { classId }
  );
}

/**
 * Creates a fee structure not found error
 */
export function createFeeStructureNotFoundError(
  feeStructureId: string
): FeeStructureValidationError {
  return new FeeStructureValidationError(
    FeeStructureErrorCode.FEE_STRUCTURE_NOT_FOUND,
    `Fee structure not found: ${feeStructureId}`,
    undefined,
    { feeStructureId }
  );
}

/**
 * Creates a fee type not found error
 */
export function createFeeTypeNotFoundError(feeTypeId: string): FeeStructureValidationError {
  return new FeeStructureValidationError(
    FeeStructureErrorCode.FEE_TYPE_NOT_FOUND,
    `Fee type not found: ${feeTypeId}`,
    undefined,
    { feeTypeId }
  );
}

/**
 * Creates an unauthorized error
 */
export function createUnauthorizedError(
  message: string = "Unauthorized access"
): FeeStructureValidationError {
  return new FeeStructureValidationError(
    FeeStructureErrorCode.UNAUTHORIZED,
    message
  );
}

/**
 * Logs error for debugging purposes
 */
export function logFeeStructureError(error: unknown, context: string): void {
  console.error(`[Fee Structure Error - ${context}]:`, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Formats error message for user display
 */
export function formatFeeStructureErrorMessage(error: FeeStructureError): string {
  return FeeStructureErrorMessages[error.code] || error.message;
}

/**
 * Checks if error is retryable
 */
export function isRetryableFeeStructureError(error: FeeStructureError): boolean {
  const retryableCodes = [FeeStructureErrorCode.DATABASE_ERROR];
  return retryableCodes.includes(error.code);
}

/**
 * Wraps async fee structure operations with error handling
 */
export async function withFeeStructureErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<{ success: true; data: T } | { success: false; error: FeeStructureError }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    logFeeStructureError(error, context);
    const feeStructureError = handleFeeStructureError(error);
    return { success: false, error: feeStructureError };
  }
}
