import { FeeError, FeeErrorCode } from "@/lib/types/fees";
import { ZodError } from "zod";

/**
 * Custom error class for payment-related errors
 */
export class PaymentError extends Error {
  code: FeeErrorCode;
  details?: any;

  constructor(code: FeeErrorCode, message: string, details?: any) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Handles errors and converts them to standardized FeeError format
 */
export function handlePaymentError(error: unknown): FeeError {
  // Handle PaymentError instances
  if (error instanceof PaymentError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return {
      code: FeeErrorCode.VALIDATION_ERROR,
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
          code: FeeErrorCode.DATABASE_ERROR,
          message: "A record with this information already exists",
          details: prismaError.meta,
        };
      case "P2025":
        return {
          code: FeeErrorCode.INVALID_CHILD,
          message: "Record not found",
          details: prismaError.meta,
        };
      default:
        return {
          code: FeeErrorCode.DATABASE_ERROR,
          message: "Database operation failed",
          details: prismaError.message,
        };
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      code: FeeErrorCode.DATABASE_ERROR,
      message: error.message,
    };
  }

  // Fallback for unknown errors
  return {
    code: FeeErrorCode.DATABASE_ERROR,
    message: "An unexpected error occurred",
  };
}

/**
 * Validates parent-child relationship
 */
export function createUnauthorizedError(message: string = "Unauthorized access"): PaymentError {
  return new PaymentError(FeeErrorCode.UNAUTHORIZED, message);
}

/**
 * Creates an invalid child error
 */
export function createInvalidChildError(childId: string): PaymentError {
  return new PaymentError(
    FeeErrorCode.INVALID_CHILD,
    `Invalid or unauthorized child ID: ${childId}`
  );
}

/**
 * Creates an invalid fee structure error
 */
export function createInvalidFeeStructureError(feeStructureId: string): PaymentError {
  return new PaymentError(
    FeeErrorCode.INVALID_FEE_STRUCTURE,
    `Invalid fee structure ID: ${feeStructureId}`
  );
}

/**
 * Creates a payment failed error
 */
export function createPaymentFailedError(message: string, details?: any): PaymentError {
  return new PaymentError(FeeErrorCode.PAYMENT_FAILED, message, details);
}

/**
 * Creates a payment verification failed error
 */
export function createPaymentVerificationError(message: string, details?: any): PaymentError {
  return new PaymentError(
    FeeErrorCode.PAYMENT_VERIFICATION_FAILED,
    message,
    details
  );
}

/**
 * Creates a receipt not found error
 */
export function createReceiptNotFoundError(paymentId: string): PaymentError {
  return new PaymentError(
    FeeErrorCode.RECEIPT_NOT_FOUND,
    `Receipt not found for payment ID: ${paymentId}`
  );
}

/**
 * Creates an invalid amount error
 */
export function createInvalidAmountError(message: string): PaymentError {
  return new PaymentError(FeeErrorCode.INVALID_AMOUNT, message);
}

/**
 * Creates a payment gateway error
 */
export function createPaymentGatewayError(message: string, details?: any): PaymentError {
  return new PaymentError(
    FeeErrorCode.PAYMENT_GATEWAY_ERROR,
    message,
    details
  );
}

/**
 * Logs error for debugging purposes
 */
export function logPaymentError(error: unknown, context: string): void {
  console.error(`[Payment Error - ${context}]:`, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Formats error message for user display
 */
export function formatErrorMessage(error: FeeError): string {
  const userFriendlyMessages: Record<FeeErrorCode, string> = {
    [FeeErrorCode.UNAUTHORIZED]: "You don't have permission to perform this action",
    [FeeErrorCode.INVALID_CHILD]: "Invalid student information",
    [FeeErrorCode.INVALID_FEE_STRUCTURE]: "Invalid fee structure",
    [FeeErrorCode.PAYMENT_FAILED]: "Payment processing failed",
    [FeeErrorCode.PAYMENT_VERIFICATION_FAILED]: "Payment verification failed",
    [FeeErrorCode.RECEIPT_NOT_FOUND]: "Receipt not found",
    [FeeErrorCode.INVALID_AMOUNT]: "Invalid payment amount",
    [FeeErrorCode.DATABASE_ERROR]: "A system error occurred",
    [FeeErrorCode.VALIDATION_ERROR]: "Please check your input",
    [FeeErrorCode.PAYMENT_GATEWAY_ERROR]: "Payment gateway error",
  };

  return userFriendlyMessages[error.code] || error.message;
}

/**
 * Checks if error is retryable
 */
export function isRetryableError(error: FeeError): boolean {
  const retryableCodes = [
    FeeErrorCode.DATABASE_ERROR,
    FeeErrorCode.PAYMENT_GATEWAY_ERROR,
  ];
  
  return retryableCodes.includes(error.code);
}

/**
 * Wraps async payment operations with error handling
 */
export async function withPaymentErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<{ success: true; data: T } | { success: false; error: FeeError }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    logPaymentError(error, context);
    const feeError = handlePaymentError(error);
    return { success: false, error: feeError };
  }
}
