/**
 * Database error handling utilities
 * Handles Prisma errors with proper error messages and recovery strategies
 * Requirements: Task 14 - Database error handling
 */

import { Prisma } from "@prisma/client";
import {
  createErrorResponse,
  SyllabusErrorCodes,
  type ErrorResponse,
} from "./syllabus-error-handling";

/**
 * Database operation result
 */
export interface DatabaseOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
}

/**
 * Transaction result
 */
export interface TransactionResult<T = any> {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
  rollback?: boolean;
}

/**
 * Handle Prisma errors with detailed error messages
 */
export function handleDatabaseError(error: unknown): ErrorResponse {
  // Handle Prisma known request errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2000":
        return createErrorResponse(
          "The provided value is too long for the column",
          SyllabusErrorCodes.VALIDATION_ERROR,
          { code: error.code, meta: error.meta }
        );

      case "P2001":
        return createErrorResponse(
          "The record searched for does not exist",
          SyllabusErrorCodes.MODULE_NOT_FOUND,
          { code: error.code }
        );

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
        const fieldName = error.meta?.field_name as string;
        return createErrorResponse(
          `Referenced ${fieldName || "record"} does not exist`,
          SyllabusErrorCodes.PARENT_NOT_FOUND,
          { field: fieldName }
        );

      case "P2004":
        return createErrorResponse(
          "A constraint failed on the database",
          SyllabusErrorCodes.CONSTRAINT_VIOLATION,
          { code: error.code }
        );

      case "P2011":
        return createErrorResponse(
          "Null constraint violation",
          SyllabusErrorCodes.REQUIRED_FIELD,
          { code: error.code, meta: error.meta }
        );

      case "P2014":
        // Relation violation
        return createErrorResponse(
          "Cannot delete record due to existing relationships. Delete related records first.",
          SyllabusErrorCodes.CASCADE_DELETE_FAILED,
          { code: error.code }
        );

      case "P2015":
        return createErrorResponse(
          "A related record could not be found",
          SyllabusErrorCodes.PARENT_NOT_FOUND,
          { code: error.code }
        );

      case "P2025":
        // Record not found for update/delete
        return createErrorResponse(
          "Record not found",
          SyllabusErrorCodes.MODULE_NOT_FOUND,
          { code: error.code }
        );

      case "P2034":
        // Transaction conflict
        return createErrorResponse(
          "Transaction failed due to a write conflict. Please try again.",
          SyllabusErrorCodes.TRANSACTION_FAILED,
          { code: error.code }
        );

      default:
        return createErrorResponse(
          `Database operation failed: ${error.message}`,
          SyllabusErrorCodes.CONSTRAINT_VIOLATION,
          { code: error.code, meta: error.meta }
        );
    }
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return createErrorResponse(
      "Invalid data provided to database. Please check your input.",
      SyllabusErrorCodes.VALIDATION_ERROR
    );
  }

  // Handle Prisma initialization errors
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return createErrorResponse(
      "Database connection failed. Please try again later.",
      SyllabusErrorCodes.INTERNAL_ERROR,
      { code: error.errorCode }
    );
  }

  // Handle Prisma Rust panic errors
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return createErrorResponse(
      "A critical database error occurred. Please contact support.",
      SyllabusErrorCodes.INTERNAL_ERROR
    );
  }

  // Handle generic errors
  if (error instanceof Error) {
    return createErrorResponse(
      error.message,
      SyllabusErrorCodes.INTERNAL_ERROR
    );
  }

  return createErrorResponse(
    "An unexpected database error occurred",
    SyllabusErrorCodes.UNKNOWN_ERROR
  );
}

/**
 * Wrap database operation with error handling
 */
export async function withDatabaseErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<DatabaseOperationResult<T>> {
  try {
    const data = await operation();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error(`Database error in ${context || "operation"}:`, error);
    return {
      success: false,
      error: handleDatabaseError(error),
    };
  }
}

/**
 * Execute database transaction with error handling
 */
export async function withTransactionErrorHandling<T>(
  transactionFn: () => Promise<T>,
  context?: string
): Promise<TransactionResult<T>> {
  try {
    const data = await transactionFn();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error(`Transaction error in ${context || "operation"}:`, error);
    
    // Check if it's a transaction conflict that should be retried
    const shouldRetry =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034";

    return {
      success: false,
      error: handleDatabaseError(error),
      rollback: true,
    };
  }
}

/**
 * Retry database operation with exponential backoff
 */
export async function retryDatabaseOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<DatabaseOperationResult<T>> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const data = await operation();
      return {
        success: true,
        data,
      };
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      const isRetryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2034" || // Transaction conflict
          error.code === "P2024"); // Timed out

      if (!isRetryable || attempt === maxRetries - 1) {
        break;
      }

      // Wait before retrying (exponential backoff)
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    error: handleDatabaseError(lastError),
  };
}

/**
 * Check if record exists before operation
 */
export async function ensureRecordExists<T>(
  findFn: () => Promise<T | null>,
  entityName: string
): Promise<DatabaseOperationResult<T>> {
  try {
    const record = await findFn();
    
    if (!record) {
      return {
        success: false,
        error: createErrorResponse(
          `${entityName} not found`,
          SyllabusErrorCodes.MODULE_NOT_FOUND
        ),
      };
    }

    return {
      success: true,
      data: record,
    };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error),
    };
  }
}

/**
 * Validate foreign key reference exists
 */
export async function validateForeignKey<T>(
  findFn: () => Promise<T | null>,
  entityName: string,
  fieldName: string
): Promise<{ valid: boolean; error?: ErrorResponse }> {
  try {
    const record = await findFn();
    
    if (!record) {
      return {
        valid: false,
        error: createErrorResponse(
          `${entityName} not found`,
          SyllabusErrorCodes.PARENT_NOT_FOUND,
          { field: fieldName }
        ),
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: handleDatabaseError(error),
    };
  }
}

/**
 * Handle cascade delete with proper error messages
 */
export async function handleCascadeDelete(
  deleteFn: () => Promise<void>,
  entityName: string,
  relatedEntities?: string[]
): Promise<DatabaseOperationResult<void>> {
  try {
    await deleteFn();
    return {
      success: true,
    };
  } catch (error) {
    console.error(`Cascade delete error for ${entityName}:`, error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2014"
    ) {
      const relatedList = relatedEntities?.join(", ") || "related records";
      return {
        success: false,
        error: createErrorResponse(
          `Cannot delete ${entityName} because it has ${relatedList}. Delete those first.`,
          SyllabusErrorCodes.CASCADE_DELETE_FAILED
        ),
      };
    }

    return {
      success: false,
      error: handleDatabaseError(error),
    };
  }
}

/**
 * Batch operation with individual error tracking
 */
export interface BatchOperationResult<T> {
  success: boolean;
  results: Array<{
    index: number;
    success: boolean;
    data?: T;
    error?: ErrorResponse;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export async function handleBatchOperation<T>(
  operations: Array<() => Promise<T>>
): Promise<BatchOperationResult<T>> {
  const results: BatchOperationResult<T>["results"] = [];

  for (let i = 0; i < operations.length; i++) {
    const result = await withDatabaseErrorHandling(operations[i], `batch item ${i}`);
    results.push({
      index: i,
      success: result.success,
      data: result.data,
      error: result.error,
    });
  }

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return {
    success: failed === 0,
    results,
    summary: {
      total: operations.length,
      successful,
      failed,
    },
  };
}
