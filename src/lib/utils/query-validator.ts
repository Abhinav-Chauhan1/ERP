/**
 * Query input validation to prevent SQL injection and other attacks
 */

import { z } from 'zod';

// SECURITY: Whitelist allowed values for enum-like fields
const ALLOWED_SCHOOL_STATUSES = ['ACTIVE', 'SUSPENDED', 'PENDING', 'ALL'] as const;
const ALLOWED_PLANS = ['BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE', 'ALL'] as const;
const ALLOWED_TIME_RANGES = ['7d', '30d', '90d', '1y', 'mtd'] as const;
const ALLOWED_SORT_ORDERS = ['asc', 'desc'] as const;

// Schema for school filters
export const schoolFiltersSchema = z.object({
  search: z.string().max(100).optional(),
  status: z.enum(ALLOWED_SCHOOL_STATUSES).optional(),
  plan: z.enum(ALLOWED_PLANS).optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
  userCountMin: z.number().min(0).max(100000).optional(),
  userCountMax: z.number().min(0).max(100000).optional(),
  hasActiveSubscription: z.boolean().optional(),
  isOnboarded: z.boolean().optional(),
});

// Schema for analytics time range
export const timeRangeSchema = z.enum(ALLOWED_TIME_RANGES);

// Schema for pagination
export const paginationSchema = z.object({
  page: z.number().min(1).max(1000).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(ALLOWED_SORT_ORDERS).default('desc'),
});

/**
 * Validate and sanitize school filters
 */
export function validateSchoolFilters(filters: any) {
  try {
    return schoolFiltersSchema.parse(filters);
  } catch (error) {
    throw new Error(`Invalid school filters: ${error}`);
  }
}

/**
 * Validate time range parameter
 */
export function validateTimeRange(timeRange: any) {
  try {
    return timeRangeSchema.parse(timeRange);
  } catch (error) {
    throw new Error(`Invalid time range: ${error}`);
  }
}

/**
 * Validate pagination parameters
 */
export function validatePagination(params: any) {
  try {
    return paginationSchema.parse(params);
  } catch (error) {
    throw new Error(`Invalid pagination parameters: ${error}`);
  }
}

/**
 * Sanitize string input to prevent injection attacks
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  // Remove potentially dangerous characters
  return input
    .replace(/[<>'"]/g, '') // Remove HTML/script injection chars
    .replace(/[;-]/g, '') // Remove SQL comment chars
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Validate array of IDs (UUIDs)
 */
export function validateIds(ids: any[]): string[] {
  if (!Array.isArray(ids)) {
    throw new Error('IDs must be an array');
  }
  
  if (ids.length > 100) {
    throw new Error('Too many IDs provided (max 100)');
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  return ids.map(id => {
    if (typeof id !== 'string' || !uuidRegex.test(id)) {
      throw new Error(`Invalid ID format: ${id}`);
    }
    return id;
  });
}