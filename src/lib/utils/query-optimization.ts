/**
 * Database Query Optimization Utilities
 * 
 * Provides utilities for optimizing Prisma queries to prevent N+1 problems,
 * implement efficient pagination, and use proper indexing strategies.
 */

import { Prisma } from '@prisma/client';

/**
 * Standard pagination configuration
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Normalize pagination parameters
 */
export function normalizePagination(page: number = 1, limit: number = 50) {
  const normalizedPage = Math.max(1, page);
  const normalizedLimit = Math.min(100, Math.max(1, limit));
  const skip = (normalizedPage - 1) * normalizedLimit;
  
  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip,
    take: normalizedLimit
  };
}

/**
 * Calculate pagination metadata
 */
export function calculatePaginationMeta(totalCount: number, page: number, limit: number) {
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    page,
    limit,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
}

/**
 * Monitored query wrapper for performance tracking
 */
export async function monitoredQuery<T>(
  queryFn: () => Promise<T>,
  queryName: string
): Promise<T> {
  return QueryPerformanceMonitor.monitor(queryName, queryFn);
}

/**
 * Select fields for message list queries
 */
export const MESSAGE_SELECT_LIST = {
  id: true,
  subject: true,
  content: true,
  isRead: true,
  createdAt: true,
  readAt: true,
  sender: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatar: true,
      role: true
    }
  },
  recipient: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatar: true,
      role: true
    }
  }
} as const;

/**
 * Select fields for announcement list queries
 */
export const ANNOUNCEMENT_SELECT_LIST = {
  id: true,
  title: true,
  content: true,
  startDate: true,
  endDate: true,
  isActive: true,
  targetAudience: true,
  createdAt: true,
  author: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      role: true
    }
  }
} as const;

/**
 * Minimal user select for contact lists
 */
export const USER_SELECT_MINIMAL = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  avatar: true,
  role: true
} as const;

/**
 * Minimal class select for dropdowns
 */
export const CLASS_SELECT_MINIMAL = {
  id: true,
  name: true
} as const;

/**
 * Minimal subject select for dropdowns
 */
export const SUBJECT_SELECT_MINIMAL = {
  id: true,
  name: true,
  code: true
} as const;

/**
 * Calculate pagination skip and take values
 */
export function getPaginationParams(params: PaginationParams) {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 50)); // Max 100, default 50
  const skip = (page - 1) * pageSize;
  
  return { page, pageSize, skip, take: pageSize };
}

/**
 * Create pagination result
 */
export function createPaginationResult<T>(
  data: T[],
  totalCount: number,
  params: PaginationParams
): PaginationResult<T> {
  const { page, pageSize } = getPaginationParams(params);
  const totalPages = Math.ceil(totalCount / pageSize);
  
  return {
    data,
    pagination: {
      page,
      pageSize,
      totalPages,
      totalCount,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

/**
 * Optimized student query with all relations
 * Prevents N+1 queries by including all necessary relations
 */
export const optimizedStudentInclude = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatar: true,
    },
  },
  enrollments: {
    include: {
      class: {
        include: {
          academicYear: true,
        },
      },
      section: true,
    },
  },
  parents: {
    include: {
      parent: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      },
    },
  },
  attendance: {
    take: 30, // Last 30 days
    orderBy: {
      date: 'desc' as const,
    },
  },
  examResults: {
    take: 10, // Last 10 exams
    orderBy: {
      createdAt: 'desc' as const,
    },
    include: {
      exam: {
        select: {
          title: true,
          totalMarks: true,
          examDate: true,
        },
      },
    },
  },
} satisfies Prisma.StudentInclude;

/**
 * Optimized teacher query with relations
 */
export const optimizedTeacherInclude = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatar: true,
    },
  },
  subjects: {
    include: {
      subject: true,
    },
  },
  classes: {
    include: {
      class: true,
    },
  },
} satisfies Prisma.TeacherInclude;

/**
 * Optimized class query with relations
 */
export const optimizedClassInclude = {
  academicYear: true,
  sections: {
    include: {
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  },
} satisfies Prisma.ClassInclude;

/**
 * Optimized attendance query
 * Uses composite indexes on (studentId, date) and (sectionId, date, status)
 */
export function getOptimizedAttendanceQuery(filters: {
  studentId?: string;
  sectionId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
}) {
  const where: Prisma.StudentAttendanceWhereInput = {};
  
  if (filters.studentId) {
    where.studentId = filters.studentId;
  }
  
  if (filters.sectionId) {
    where.sectionId = filters.sectionId;
  }
  
  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) {
      where.date.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.date.lte = filters.endDate;
    }
  }
  
  if (filters.status) {
    where.status = filters.status as any;
  }
  
  return where;
}

/**
 * Optimized fee payment query
 * Uses composite indexes on (studentId, status, paymentDate)
 */
export function getOptimizedFeePaymentQuery(filters: {
  studentId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const where: Prisma.FeePaymentWhereInput = {};
  
  if (filters.studentId) {
    where.studentId = filters.studentId;
  }
  
  if (filters.status) {
    where.status = filters.status as any;
  }
  
  if (filters.startDate || filters.endDate) {
    where.paymentDate = {};
    if (filters.startDate) {
      where.paymentDate.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.paymentDate.lte = filters.endDate;
    }
  }
  
  return where;
}

/**
 * Optimized exam result query
 * Uses composite indexes on (studentId, examId) and (examId, marks)
 */
export function getOptimizedExamResultQuery(filters: {
  studentId?: string;
  examId?: string;
  minMarks?: number;
  maxMarks?: number;
}) {
  const where: Prisma.ExamResultWhereInput = {};
  
  if (filters.studentId) {
    where.studentId = filters.studentId;
  }
  
  if (filters.examId) {
    where.examId = filters.examId;
  }
  
  if (filters.minMarks !== undefined || filters.maxMarks !== undefined) {
    where.marks = {};
    if (filters.minMarks !== undefined) {
      where.marks.gte = filters.minMarks;
    }
    if (filters.maxMarks !== undefined) {
      where.marks.lte = filters.maxMarks;
    }
  }
  
  return where;
}

/**
 * Batch query helper to prevent N+1 queries
 * Fetches related data in a single query
 */
export async function batchFetch<T, K extends keyof T>(
  items: T[],
  key: K,
  fetchFn: (ids: T[K][]) => Promise<Map<T[K], any>>
): Promise<T[]> {
  const ids = items.map(item => item[key]);
  const uniqueIds = [...new Set(ids)];
  
  const relatedData = await fetchFn(uniqueIds);
  
  return items.map(item => ({
    ...item,
    [key]: relatedData.get(item[key]),
  }));
}

/**
 * Query performance monitoring
 */
export class QueryPerformanceMonitor {
  private static slowQueryThreshold = 1000; // 1 second
  
  static async monitor<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      if (duration > this.slowQueryThreshold) {
        console.warn(`⚠️ Slow query detected: ${queryName} took ${duration}ms`);
        // In production, send to monitoring service
        // await logSlowQuery(queryName, duration);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Query failed: ${queryName} after ${duration}ms`, error);
      throw error;
    }
  }
}

/**
 * Cursor-based pagination for large datasets
 * More efficient than offset-based pagination for large tables
 */
export interface CursorPaginationParams {
  cursor?: string;
  take?: number;
}

export interface CursorPaginationResult<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}

export function createCursorPaginationResult<T extends { id: string }>(
  data: T[],
  take: number
): CursorPaginationResult<T> {
  const hasMore = data.length > take;
  const items = hasMore ? data.slice(0, take) : data;
  const nextCursor = hasMore ? items[items.length - 1].id : undefined;
  
  return {
    data: items,
    nextCursor,
    hasMore,
  };
}

/**
 * Optimized search query with full-text search
 */
export function createSearchQuery(searchTerm: string, fields: string[]) {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return {};
  }
  
  const term = searchTerm.trim();
  
  return {
    OR: fields.map(field => ({
      [field]: {
        contains: term,
        mode: 'insensitive' as const,
      },
    })),
  };
}

/**
 * Aggregate query optimization
 * Use database aggregations instead of fetching all records
 */
export const aggregateQueries = {
  /**
   * Get student count by class
   */
  studentCountByClass: {
    _count: {
      id: true,
    },
    groupBy: ['sectionId'] as const,
  },
  
  /**
   * Get average marks by exam
   */
  averageMarksByExam: {
    _avg: {
      marks: true,
    },
    groupBy: ['examId'] as const,
  },
  
  /**
   * Get attendance statistics
   */
  attendanceStats: {
    _count: {
      id: true,
    },
    groupBy: ['status'] as const,
  },
};
