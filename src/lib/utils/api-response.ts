import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Custom API Error class for structured error handling
 */
export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Standardized error response handler
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);
  
  if (error instanceof ApiError) {
    return NextResponse.json(
      { 
        error: error.message, 
        code: error.code,
        details: error.details 
      },
      { status: error.statusCode }
    );
  }
  
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { 
        error: 'Validation error', 
        code: 'VALIDATION_ERROR',
        details: error.errors 
      },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const message = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Internal server error';
    
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
  
  return NextResponse.json(
    { error: 'Internal server error', code: 'UNKNOWN_ERROR' },
    { status: 500 }
  );
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Created response helper
 */
export function createdResponse<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 201 });
}

/**
 * No content response helper
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Paginated response helper
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  limit: number,
  offset: number
): NextResponse {
  return NextResponse.json({
    data,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit)
    }
  });
}