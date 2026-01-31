import { NextRequest } from 'next/server';
import { headers } from 'next/headers';

/**
 * Extract client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  // Try to get real IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to connection remote address
  return (request as any).ip || 'unknown';
}

/**
 * Extract user agent from request
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Get request metadata for audit logging
 */
export function getRequestMetadata(request: NextRequest) {
  return {
    ipAddress: getClientIP(request),
    userAgent: getUserAgent(request),
    method: request.method,
    url: request.url,
    timestamp: new Date(),
  };
}

/**
 * Parse query parameters with type conversion
 */
export function parseQueryParams(searchParams: URLSearchParams) {
  const params: Record<string, any> = {};
  
  for (const [key, value] of searchParams.entries()) {
    // Handle multiple values for the same key
    if (params[key]) {
      if (Array.isArray(params[key])) {
        params[key].push(value);
      } else {
        params[key] = [params[key], value];
      }
    } else {
      params[key] = value;
    }
  }
  
  return params;
}

/**
 * Convert string to number with fallback
 */
export function parseNumber(value: string | null, fallback: number = 0): number {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Convert string to boolean
 */
export function parseBoolean(value: string | null, fallback: boolean = false): boolean {
  if (!value) return fallback;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Validate and parse date string
 */
export function parseDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return isNaN(date.getTime()) ? undefined : date;
}

/**
 * Extract pagination parameters from query
 */
export function extractPagination(searchParams: URLSearchParams) {
  const limit = Math.min(Math.max(parseNumber(searchParams.get('limit'), 50), 1), 100);
  const offset = Math.max(parseNumber(searchParams.get('offset'), 0), 0);
  
  return { limit, offset };
}

/**
 * Extract sorting parameters from query
 */
export function extractSorting(
  searchParams: URLSearchParams,
  allowedFields: string[] = [],
  defaultField: string = 'createdAt'
) {
  const sortBy = searchParams.get('sortBy') || defaultField;
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';
  
  // Validate sortBy field
  const validSortBy = allowedFields.length > 0 && !allowedFields.includes(sortBy) 
    ? defaultField 
    : sortBy;
  
  return { sortBy: validSortBy, sortOrder };
}