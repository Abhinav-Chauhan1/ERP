import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from '@/lib/utils/api-response';

/**
 * Middleware to validate request body against a Zod schema
 */
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (request: NextRequest): Promise<T> => {
    try {
      const body = await request.json();
      return schema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(
          'Validation error',
          400,
          'VALIDATION_ERROR',
          error.errors
        );
      }
      if (error instanceof SyntaxError) {
        throw new ApiError(
          'Invalid JSON in request body',
          400,
          'INVALID_JSON'
        );
      }
      throw error;
    }
  };
}

/**
 * Middleware to validate query parameters against a Zod schema
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (searchParams: URLSearchParams): T => {
    try {
      // Convert URLSearchParams to a plain object
      const queryObject: Record<string, any> = {};
      
      for (const [key, value] of searchParams.entries()) {
        // Handle multiple values for the same key
        if (queryObject[key]) {
          if (Array.isArray(queryObject[key])) {
            queryObject[key].push(value);
          } else {
            queryObject[key] = [queryObject[key], value];
          }
        } else {
          queryObject[key] = value;
        }
      }
      
      return schema.parse(queryObject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(
          'Invalid query parameters',
          400,
          'QUERY_VALIDATION_ERROR',
          error.errors
        );
      }
      throw error;
    }
  };
}

/**
 * Sanitize input to prevent XSS and other injection attacks
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

/**
 * Middleware to sanitize request data
 */
export function sanitizeRequest<T>(data: T): T {
  return sanitizeInput(data);
}