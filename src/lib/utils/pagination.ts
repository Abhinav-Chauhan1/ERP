/**
 * Pagination utilities for database queries
 */

export const ITEMS_PER_PAGE = 50;

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Calculate skip and take values for Prisma queries
 */
export function getPaginationParams(page: number = 1, limit: number = ITEMS_PER_PAGE) {
  const validPage = Math.max(1, page);
  const validLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page
  
  return {
    skip: (validPage - 1) * validLimit,
    take: validLimit,
  };
}

/**
 * Create pagination result object
 */
export function createPaginationResult<T>(
  data: T[],
  total: number,
  page: number = 1,
  limit: number = ITEMS_PER_PAGE
): PaginationResult<T> {
  const validPage = Math.max(1, page);
  const validLimit = Math.min(Math.max(1, limit), 100);
  const totalPages = Math.ceil(total / validLimit);
  
  return {
    data,
    pagination: {
      page: validPage,
      limit: validLimit,
      total,
      totalPages,
      hasMore: validPage < totalPages,
    },
  };
}
