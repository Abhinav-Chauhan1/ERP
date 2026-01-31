/**
 * Enhanced Error Handler Middleware
 * 
 * Provides comprehensive error handling with detailed logging,
 * user-friendly error responses, and security considerations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logAuditEvent, AuditAction } from '../services/audit-service';

export interface ErrorContext {
  userId?: string;
  schoolId?: string;
  endpoint: string;
  method: string;
  userAgent?: string;
  ip?: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR', true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR', true);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR', true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR', true);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR', true);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE_ERROR', true);
  }
}

/**
 * Enhanced error handler function
 */
export async function handleError(
  error: unknown,
  context: ErrorContext
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const timestamp = new Date().toISOString();

  // Log the error with context
  await logError(error, context, requestId);

  // Determine error type and create appropriate response
  const errorResponse = createErrorResponse(error, requestId, timestamp);

  // Log security-related errors for audit
  if (isSecurityError(error)) {
    await logSecurityEvent(error, context, requestId);
  }

  return NextResponse.json(errorResponse, { 
    status: getStatusCode(error),
    headers: {
      'X-Request-ID': requestId,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Create standardized error response
 */
function createErrorResponse(
  error: unknown,
  requestId: string,
  timestamp: string
): ErrorResponse {
  if (error instanceof AppError) {
    return {
      error: error.code,
      message: error.message,
      code: error.code,
      details: error.details,
      timestamp,
      requestId,
    };
  }

  if (error instanceof ZodError) {
    return {
      error: 'VALIDATION_ERROR',
      message: 'Invalid input data',
      code: 'VALIDATION_ERROR',
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      })),
      timestamp,
      requestId,
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return createPrismaErrorResponse(error, requestId, timestamp);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      error: 'DATABASE_VALIDATION_ERROR',
      message: 'Invalid database operation',
      code: 'DATABASE_VALIDATION_ERROR',
      timestamp,
      requestId,
    };
  }

  // Generic error response (don't expose internal details)
  return {
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    code: 'INTERNAL_SERVER_ERROR',
    timestamp,
    requestId,
  };
}

/**
 * Create Prisma-specific error response
 */
function createPrismaErrorResponse(
  error: Prisma.PrismaClientKnownRequestError,
  requestId: string,
  timestamp: string
): ErrorResponse {
  switch (error.code) {
    case 'P2002':
      return {
        error: 'UNIQUE_CONSTRAINT_ERROR',
        message: 'A record with this information already exists',
        code: 'UNIQUE_CONSTRAINT_ERROR',
        details: { fields: error.meta?.target },
        timestamp,
        requestId,
      };
    
    case 'P2025':
      return {
        error: 'RECORD_NOT_FOUND',
        message: 'The requested record was not found',
        code: 'RECORD_NOT_FOUND',
        timestamp,
        requestId,
      };
    
    case 'P2003':
      return {
        error: 'FOREIGN_KEY_CONSTRAINT_ERROR',
        message: 'Referenced record does not exist',
        code: 'FOREIGN_KEY_CONSTRAINT_ERROR',
        timestamp,
        requestId,
      };
    
    case 'P2014':
      return {
        error: 'RELATION_VIOLATION_ERROR',
        message: 'The change would violate a relation constraint',
        code: 'RELATION_VIOLATION_ERROR',
        timestamp,
        requestId,
      };
    
    default:
      return {
        error: 'DATABASE_ERROR',
        message: 'A database error occurred',
        code: 'DATABASE_ERROR',
        timestamp,
        requestId,
      };
  }
}

/**
 * Get HTTP status code from error
 */
function getStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }

  if (error instanceof ZodError) {
    return 400;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
      case 'P2003':
      case 'P2014':
        return 400;
      case 'P2025':
        return 404;
      default:
        return 500;
    }
  }

  return 500;
}

/**
 * Check if error is security-related
 */
function isSecurityError(error: unknown): boolean {
  return (
    error instanceof AuthenticationError ||
    error instanceof AuthorizationError ||
    error instanceof RateLimitError ||
    (error instanceof AppError && error.code.includes('SECURITY'))
  );
}

/**
 * Log error with context
 */
async function logError(
  error: unknown,
  context: ErrorContext,
  requestId: string
): Promise<void> {
  const errorInfo = {
    requestId,
    error: {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      code: error instanceof AppError ? error.code : undefined,
    },
    context,
    timestamp: new Date().toISOString(),
  };

  // Log to console (in production, you might want to use a proper logging service)
  console.error('API Error:', JSON.stringify(errorInfo, null, 2));

  // In production, you might want to send to external logging service
  // await sendToLoggingService(errorInfo);
}

/**
 * Log security-related events
 */
async function logSecurityEvent(
  error: unknown,
  context: ErrorContext,
  requestId: string
): Promise<void> {
  if (!context.userId) return;

  try {
    await logAuditEvent({
      userId: context.userId,
      action: AuditAction.SECURITY_EVENT,
      resource: 'API_SECURITY',
      resourceId: requestId,
      changes: {
        error: error instanceof Error ? error.message : String(error),
        endpoint: context.endpoint,
        method: context.method,
        ip: context.ip,
        userAgent: context.userAgent,
      },
    });
  } catch (auditError) {
    console.error('Failed to log security event:', auditError);
  }
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Middleware wrapper for API routes
 */
export function withErrorHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      const errorContext: ErrorContext = {
        endpoint: request.nextUrl.pathname,
        method: request.method,
        userAgent: request.headers.get('user-agent') || undefined,
        ip: request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'unknown',
      };

      return handleError(error, errorContext);
    }
  };
}

/**
 * Async error handler for use in try-catch blocks
 */
export async function handleAsyncError(
  error: unknown,
  request: NextRequest,
  additionalContext?: Partial<ErrorContext>
): Promise<NextResponse> {
  const errorContext: ErrorContext = {
    endpoint: request.nextUrl.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown',
    ...additionalContext,
  };

  return handleError(error, errorContext);
}

/**
 * Validation helper that throws ValidationError
 */
export function validateInput<T>(
  schema: any,
  data: unknown,
  errorMessage?: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(
        errorMessage || 'Invalid input data',
        error.errors
      );
    }
    throw error;
  }
}

/**
 * Database operation wrapper with error handling
 */
export async function withDatabaseErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Let the error bubble up to be handled by the main error handler
      throw error;
    }
    
    if (error instanceof Prisma.PrismaClientValidationError) {
      throw new ValidationError('Invalid database operation');
    }
    
    // For unknown database errors, wrap in a generic error
    throw new AppError(
      context ? `Database operation failed: ${context}` : 'Database operation failed',
      500,
      'DATABASE_ERROR'
    );
  }
}