/**
 * Query Optimization Utilities
 * Provides helpers for optimizing database queries with pagination, caching, and performance monitoring
 */

import { db } from "@/lib/db";

/**
 * Standard pagination configuration
 */
export const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

/**
 * Validate and normalize pagination parameters
 */
export function normalizePagination(page?: number, limit?: number) {
  const normalizedPage = Math.max(
    PAGINATION_DEFAULTS.MIN_LIMIT,
    page || PAGINATION_DEFAULTS.DEFAULT_PAGE
  );
  
  const normalizedLimit = Math.min(
    PAGINATION_DEFAULTS.MAX_LIMIT,
    Math.max(PAGINATION_DEFAULTS.MIN_LIMIT, limit || PAGINATION_DEFAULTS.DEFAULT_LIMIT)
  );
  
  const skip = (normalizedPage - 1) * normalizedLimit;
  
  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip,
    take: normalizedLimit,
  };
}

/**
 * Calculate pagination metadata
 */
export function calculatePaginationMeta(
  totalCount: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;
  
  return {
    page,
    limit,
    totalCount,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  };
}

/**
 * Monitor slow queries and log warnings
 */
export async function monitoredQuery<T>(
  queryFn: () => Promise<T>,
  queryName: string,
  slowThreshold: number = 1000
): Promise<T> {
  const start = Date.now();
  
  try {
    const result = await queryFn();
    const duration = Date.now() - start;
    
    if (duration > slowThreshold) {
      console.warn(
        `[SLOW QUERY] ${queryName} took ${duration}ms (threshold: ${slowThreshold}ms)`
      );
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(
      `[QUERY ERROR] ${queryName} failed after ${duration}ms:`,
      error
    );
    throw error;
  }
}

/**
 * Common select fields for user data (optimized)
 */
export const USER_SELECT_MINIMAL = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  avatar: true,
  role: true,
} as const;

export const USER_SELECT_BASIC = {
  ...USER_SELECT_MINIMAL,
  phone: true,
  active: true,
} as const;

/**
 * Common select fields for message data (optimized)
 */
export const MESSAGE_SELECT_LIST = {
  id: true,
  subject: true,
  content: true,
  isRead: true,
  readAt: true,
  createdAt: true,
  attachments: true,
  sender: {
    select: USER_SELECT_MINIMAL,
  },
  recipient: {
    select: USER_SELECT_MINIMAL,
  },
} as const;

/**
 * Common select fields for notification data (optimized)
 */
export const NOTIFICATION_SELECT_LIST = {
  id: true,
  title: true,
  message: true,
  type: true,
  isRead: true,
  readAt: true,
  link: true,
  createdAt: true,
} as const;

/**
 * Common select fields for announcement data (optimized)
 */
export const ANNOUNCEMENT_SELECT_LIST = {
  id: true,
  title: true,
  content: true,
  startDate: true,
  endDate: true,
  isActive: true,
  attachments: true,
  createdAt: true,
  publisher: {
    select: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
    },
  },
} as const;

/**
 * Common select fields for student data (optimized)
 */
export const STUDENT_SELECT_MINIMAL = {
  id: true,
  admissionNumber: true,
  user: {
    select: USER_SELECT_MINIMAL,
  },
} as const;

/**
 * Common select fields for teacher data (optimized)
 */
export const TEACHER_SELECT_MINIMAL = {
  id: true,
  employeeId: true,
  user: {
    select: USER_SELECT_MINIMAL,
  },
} as const;

/**
 * Common select fields for class data (optimized)
 */
export const CLASS_SELECT_MINIMAL = {
  id: true,
  name: true,
  grade: true,
} as const;

/**
 * Common select fields for subject data (optimized)
 */
export const SUBJECT_SELECT_MINIMAL = {
  id: true,
  name: true,
  code: true,
} as const;

/**
 * Batch query helper to execute multiple queries in parallel
 */
export async function batchQueries<T extends Record<string, Promise<any>>>(
  queries: T
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  const keys = Object.keys(queries) as Array<keyof T>;
  const promises = keys.map((key) => queries[key]);
  
  const results = await Promise.all(promises);
  
  return keys.reduce((acc, key, index) => {
    acc[key] = results[index];
    return acc;
  }, {} as { [K in keyof T]: Awaited<T[K]> });
}

/**
 * Cache configuration for Next.js revalidation
 */
export const CACHE_REVALIDATION = {
  STATIC: 3600, // 1 hour for static content
  DYNAMIC: 60, // 1 minute for dynamic content
  REALTIME: 0, // No cache for real-time data
  DAILY: 86400, // 24 hours for daily data
} as const;

/**
 * Helper to create optimized where clauses for date ranges
 */
export function createDateRangeWhere(
  startDate?: Date,
  endDate?: Date,
  field: string = "createdAt"
) {
  if (!startDate && !endDate) {
    return undefined;
  }
  
  const where: any = {};
  
  if (startDate || endDate) {
    where[field] = {};
    if (startDate) {
      where[field].gte = startDate;
    }
    if (endDate) {
      where[field].lte = endDate;
    }
  }
  
  return where;
}

/**
 * Helper to create optimized search where clauses
 */
export function createSearchWhere(
  search: string | undefined,
  fields: string[]
) {
  if (!search || fields.length === 0) {
    return undefined;
  }
  
  return {
    OR: fields.map((field) => ({
      [field]: {
        contains: search,
        mode: "insensitive" as const,
      },
    })),
  };
}

/**
 * Optimized count with caching hint
 */
export async function cachedCount(
  model: any,
  where: any,
  cacheTime: number = CACHE_REVALIDATION.DYNAMIC
) {
  return await model.count({ where });
}

/**
 * Helper to merge where clauses
 */
export function mergeWhereClauses(...clauses: (any | undefined)[]) {
  const validClauses = clauses.filter(Boolean);
  
  if (validClauses.length === 0) {
    return {};
  }
  
  if (validClauses.length === 1) {
    return validClauses[0];
  }
  
  return {
    AND: validClauses,
  };
}
