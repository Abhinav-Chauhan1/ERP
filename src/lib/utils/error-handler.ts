/**
 * Error Handling Utilities
 * Provides consistent error handling across the application
 */

export type ErrorType = 
  | 'network'
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'not_found'
  | 'server'
  | 'unknown';

export interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  retryable: boolean;
  statusCode?: number;
  originalError?: Error;
}

/**
 * Custom error class for application errors
 */
export class ApplicationError extends Error {
  type: ErrorType;
  userMessage: string;
  retryable: boolean;
  statusCode?: number;

  constructor(
    type: ErrorType,
    message: string,
    userMessage: string,
    retryable: boolean = false,
    statusCode?: number
  ) {
    super(message);
    this.name = 'ApplicationError';
    this.type = type;
    this.userMessage = userMessage;
    this.retryable = retryable;
    this.statusCode = statusCode;
  }
}

/**
 * Result type for operations that can fail
 */
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: AppError };

/**
 * Parse error and convert to AppError
 */
export function parseError(error: unknown): AppError {
  // Handle ApplicationError
  if (error instanceof ApplicationError) {
    return {
      type: error.type,
      message: error.message,
      userMessage: error.userMessage,
      retryable: error.retryable,
      statusCode: error.statusCode,
      originalError: error,
    };
  }

  // Handle standard Error
  if (error instanceof Error) {
    // Network errors
    if (
      error.message.toLowerCase().includes('network') ||
      error.message.toLowerCase().includes('fetch') ||
      error.message.toLowerCase().includes('connection')
    ) {
      return {
        type: 'network',
        message: error.message,
        userMessage:
          'Unable to connect to the server. Please check your internet connection and try again.',
        retryable: true,
        originalError: error,
      };
    }

    // Timeout errors
    if (error.message.toLowerCase().includes('timeout')) {
      return {
        type: 'network',
        message: error.message,
        userMessage: 'The request took too long. Please try again.',
        retryable: true,
        originalError: error,
      };
    }

    // Authentication errors
    if (
      error.message.toLowerCase().includes('unauthorized') ||
      error.message.toLowerCase().includes('authentication')
    ) {
      return {
        type: 'authentication',
        message: error.message,
        userMessage: 'Please log in to continue.',
        retryable: false,
        statusCode: 401,
        originalError: error,
      };
    }

    // Authorization errors
    if (
      error.message.toLowerCase().includes('forbidden') ||
      error.message.toLowerCase().includes('permission')
    ) {
      return {
        type: 'authorization',
        message: error.message,
        userMessage: "You don't have permission to perform this action.",
        retryable: false,
        statusCode: 403,
        originalError: error,
      };
    }

    // Not found errors
    if (error.message.toLowerCase().includes('not found')) {
      return {
        type: 'not_found',
        message: error.message,
        userMessage: 'The requested resource was not found.',
        retryable: false,
        statusCode: 404,
        originalError: error,
      };
    }

    // Generic error
    return {
      type: 'unknown',
      message: error.message,
      userMessage: 'An unexpected error occurred. Please try again.',
      retryable: false,
      originalError: error,
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      type: 'unknown',
      message: error,
      userMessage: error,
      retryable: false,
    };
  }

  // Handle unknown errors
  return {
    type: 'unknown',
    message: 'An unknown error occurred',
    userMessage: 'An unexpected error occurred. Please try again.',
    retryable: false,
  };
}

/**
 * Wrap an async operation with error handling
 */
export async function handleAsync<T>(
  operation: () => Promise<T>
): Promise<Result<T>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const appError = parseError(error);
    return { success: false, error: appError };
  }
}

/**
 * Retry an operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
  } = options;

  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Check if error is retryable
      const appError = parseError(error);
      if (!appError.retryable) {
        throw lastError;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Log error to monitoring service
 */
export function logError(error: Error | AppError, context?: Record<string, any>) {
  const errorData = {
    error: {
      name: error instanceof Error ? error.name : 'AppError',
      message: error.message,
      stack: error instanceof Error ? error.stack : undefined,
      ...(error instanceof ApplicationError && {
        type: error.type,
        userMessage: error.userMessage,
        retryable: error.retryable,
        statusCode: error.statusCode,
      }),
    },
    context,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorData);
  }

  // TODO: Send to monitoring service (Sentry, etc.)
  // if (typeof window !== 'undefined' && window.Sentry) {
  //   window.Sentry.captureException(error, { extra: errorData });
  // }
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  const appError = parseError(error);
  return appError.userMessage;
}

/**
 * Check if error is retryable
 */
export function isRetryable(error: unknown): boolean {
  const appError = parseError(error);
  return appError.retryable;
}
