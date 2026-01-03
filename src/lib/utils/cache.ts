/**
 * Caching Utilities for Next.js Server Components
 * Implements React Server Component caching with revalidate and stale-while-revalidate patterns
 */

import { unstable_cache } from "next/cache";

/**
 * Cache duration constants (in seconds)
 */
export const CACHE_TAGS = {
  USERS: "users",
  STUDENTS: "students",
  TEACHERS: "teachers",
  PARENTS: "parents",
  ADMINS: "admins",
  CLASSES: "classes",
  SECTIONS: "sections",
  SUBJECTS: "subjects",
  MESSAGES: "messages",
  NOTIFICATIONS: "notifications",
  ANNOUNCEMENTS: "announcements",
  ATTENDANCE: "attendance",
  EXAMS: "exams",
  ASSIGNMENTS: "assignments",
  FEE_PAYMENTS: "fee-payments",
  EVENTS: "events",
  TIMETABLE: "timetable",
  SETTINGS: "settings",
  DASHBOARD: "dashboard",
  ACADEMIC_YEARS: "academic-years",
  TERMS: "terms",
  DEPARTMENTS: "departments",
  ROOMS: "rooms",
  GRADES: "grades",
  RESULTS: "results",
  DOCUMENTS: "documents",
  LIBRARY: "library",
  TRANSPORT: "transport",
  SYLLABUS: "syllabus",
  MODULES: "modules",
  SUB_MODULES: "sub-modules",
  SYLLABUS_DOCUMENTS: "syllabus-documents",
  SYLLABUS_PROGRESS: "syllabus-progress",
  CALENDAR_EVENTS: "calendar-events",
  CALENDAR_CATEGORIES: "calendar-categories",
  CALENDAR_PREFERENCES: "calendar-preferences",
} as const;

export const CACHE_DURATION = {
  // Static content - rarely changes
  STATIC: 3600, // 1 hour
  LONG: 1800, // 30 minutes
  
  // Semi-static content - changes occasionally
  MEDIUM: 300, // 5 minutes
  SHORT: 60, // 1 minute
  
  // Dynamic content - changes frequently
  REALTIME: 0, // No cache
  
  // Specific use cases
  USER_PROFILE: 300, // 5 minutes
  DASHBOARD_STATS: 60, // 1 minute
  ANNOUNCEMENTS: 300, // 5 minutes
  TIMETABLE: 1800, // 30 minutes
  SETTINGS: 3600, // 1 hour
  DROPDOWN_DATA: 600, // 10 minutes
  ACADEMIC_YEARS: 3600, // 1 hour - as per requirements
  TERMS: 3600, // 1 hour - as per requirements
  CLASSES: 1800, // 30 minutes
  SUBJECTS: 1800, // 30 minutes
  LIBRARY: 300, // 5 minutes
  TRANSPORT: 600, // 10 minutes
  CALENDAR_EVENTS: 300, // 5 minutes
  CALENDAR_CATEGORIES: 3600, // 1 hour - rarely change
  CALENDAR_PREFERENCES: 1800, // 30 minutes
} as const;

/**
 * Create a cached function with Next.js unstable_cache
 * Implements stale-while-revalidate pattern
 */
export function createCachedFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    keyPrefix: string;
    tags?: string[];
    revalidate?: number;
  }
): T {
  const { keyPrefix, tags = [], revalidate = CACHE_DURATION.MEDIUM } = options;
  
  return unstable_cache(
    fn,
    [keyPrefix],
    {
      tags,
      revalidate,
    }
  ) as T;
}

/**
 * Cache wrapper for database queries
 * Automatically generates cache keys based on function name and arguments
 */
export function cachedQuery<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    name: string;
    tags?: string[];
    revalidate?: number;
  }
): T {
  return createCachedFunction(fn, {
    keyPrefix: `query:${options.name}`,
    tags: options.tags,
    revalidate: options.revalidate,
  });
}

/**
 * Cached fetch wrapper with Next.js fetch cache options
 */
export async function cachedFetch(
  url: string,
  options?: RequestInit & {
    revalidate?: number;
    tags?: string[];
  }
) {
  const { revalidate = CACHE_DURATION.MEDIUM, tags = [], ...fetchOptions } = options || {};
  
  return fetch(url, {
    ...fetchOptions,
    next: {
      revalidate,
      tags,
    },
  });
}

/**
 * In-memory cache for frequently accessed data
 * Useful for data that doesn't change during a request lifecycle
 */
class MemoryCache {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;
  
  constructor() {
    this.cache = new Map();
  }
  
  set(key: string, data: any, ttl: number = CACHE_DURATION.SHORT * 1000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }
  
  get(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    const age = Date.now() - cached.timestamp;
    
    if (age > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  has(key: string): boolean {
    return this.get(key) !== null;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, value] of entries) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const memoryCache = new MemoryCache();

// Cleanup expired cache entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    memoryCache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Memoize function results within a single request
 * Useful for avoiding duplicate queries in the same request
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options?: {
    ttl?: number;
    keyGenerator?: (...args: Parameters<T>) => string;
  }
): T {
  const { ttl = CACHE_DURATION.SHORT * 1000, keyGenerator } = options || {};
  
  return ((...args: Parameters<T>) => {
    const key = keyGenerator
      ? keyGenerator(...args)
      : `${fn.name}:${JSON.stringify(args)}`;
    
    const cached = memoryCache.get(key);
    if (cached !== null) {
      return cached;
    }
    
    const result = fn(...args);
    
    // Handle promises
    if (result instanceof Promise) {
      return result.then((data) => {
        memoryCache.set(key, data, ttl);
        return data;
      });
    }
    
    memoryCache.set(key, result, ttl);
    return result;
  }) as T;
}

/**
 * Cache configuration for different data types
 */
export const CACHE_CONFIG = {
  // User data
  userProfile: {
    tags: [CACHE_TAGS.USERS],
    revalidate: CACHE_DURATION.USER_PROFILE,
  },
  userList: {
    tags: [CACHE_TAGS.USERS],
    revalidate: CACHE_DURATION.MEDIUM,
  },
  students: {
    tags: [CACHE_TAGS.STUDENTS],
    revalidate: CACHE_DURATION.MEDIUM,
  },
  teachers: {
    tags: [CACHE_TAGS.TEACHERS],
    revalidate: CACHE_DURATION.MEDIUM,
  },
  parents: {
    tags: [CACHE_TAGS.PARENTS],
    revalidate: CACHE_DURATION.MEDIUM,
  },
  
  // Dashboard data
  dashboardStats: {
    tags: [CACHE_TAGS.DASHBOARD],
    revalidate: CACHE_DURATION.DASHBOARD_STATS,
  },
  
  // Communication data
  announcements: {
    tags: [CACHE_TAGS.ANNOUNCEMENTS],
    revalidate: CACHE_DURATION.ANNOUNCEMENTS,
  },
  messages: {
    tags: [CACHE_TAGS.MESSAGES],
    revalidate: CACHE_DURATION.REALTIME, // Messages should be real-time
  },
  notifications: {
    tags: [CACHE_TAGS.NOTIFICATIONS],
    revalidate: CACHE_DURATION.REALTIME, // Notifications should be real-time
  },
  
  // Academic data
  academicYears: {
    tags: [CACHE_TAGS.ACADEMIC_YEARS],
    revalidate: CACHE_DURATION.ACADEMIC_YEARS,
  },
  terms: {
    tags: [CACHE_TAGS.TERMS],
    revalidate: CACHE_DURATION.TERMS,
  },
  timetable: {
    tags: [CACHE_TAGS.TIMETABLE],
    revalidate: CACHE_DURATION.TIMETABLE,
  },
  classes: {
    tags: [CACHE_TAGS.CLASSES],
    revalidate: CACHE_DURATION.CLASSES,
  },
  sections: {
    tags: [CACHE_TAGS.SECTIONS],
    revalidate: CACHE_DURATION.LONG,
  },
  subjects: {
    tags: [CACHE_TAGS.SUBJECTS],
    revalidate: CACHE_DURATION.SUBJECTS,
  },
  departments: {
    tags: [CACHE_TAGS.DEPARTMENTS],
    revalidate: CACHE_DURATION.LONG,
  },
  rooms: {
    tags: [CACHE_TAGS.ROOMS],
    revalidate: CACHE_DURATION.LONG,
  },
  
  // Assessment data
  exams: {
    tags: [CACHE_TAGS.EXAMS],
    revalidate: CACHE_DURATION.MEDIUM,
  },
  assignments: {
    tags: [CACHE_TAGS.ASSIGNMENTS],
    revalidate: CACHE_DURATION.MEDIUM,
  },
  grades: {
    tags: [CACHE_TAGS.GRADES],
    revalidate: CACHE_DURATION.MEDIUM,
  },
  results: {
    tags: [CACHE_TAGS.RESULTS],
    revalidate: CACHE_DURATION.MEDIUM,
  },
  
  // Attendance data
  attendance: {
    tags: [CACHE_TAGS.ATTENDANCE],
    revalidate: CACHE_DURATION.SHORT,
  },
  
  // Financial data
  feePayments: {
    tags: [CACHE_TAGS.FEE_PAYMENTS],
    revalidate: CACHE_DURATION.SHORT,
  },
  
  // Events
  events: {
    tags: [CACHE_TAGS.EVENTS],
    revalidate: CACHE_DURATION.MEDIUM,
  },
  
  // Documents
  documents: {
    tags: [CACHE_TAGS.DOCUMENTS],
    revalidate: CACHE_DURATION.MEDIUM,
  },
  
  // Library
  library: {
    tags: [CACHE_TAGS.LIBRARY],
    revalidate: CACHE_DURATION.LIBRARY,
  },
  
  // Transport
  transport: {
    tags: [CACHE_TAGS.TRANSPORT],
    revalidate: CACHE_DURATION.TRANSPORT,
  },
  
  // Settings
  settings: {
    tags: [CACHE_TAGS.SETTINGS],
    revalidate: CACHE_DURATION.SETTINGS,
  },
  
  // Dropdown data
  dropdownData: {
    tags: [],
    revalidate: CACHE_DURATION.DROPDOWN_DATA,
  },
  
  // Syllabus data
  syllabus: {
    tags: [CACHE_TAGS.SYLLABUS],
    revalidate: CACHE_DURATION.MEDIUM,
  },
  modules: {
    tags: [CACHE_TAGS.MODULES, CACHE_TAGS.SYLLABUS],
    revalidate: CACHE_DURATION.MEDIUM,
  },
  subModules: {
    tags: [CACHE_TAGS.SUB_MODULES, CACHE_TAGS.MODULES],
    revalidate: CACHE_DURATION.MEDIUM,
  },
  syllabusDocuments: {
    tags: [CACHE_TAGS.SYLLABUS_DOCUMENTS, CACHE_TAGS.DOCUMENTS],
    revalidate: CACHE_DURATION.MEDIUM,
  },
  syllabusProgress: {
    tags: [CACHE_TAGS.SYLLABUS_PROGRESS],
    revalidate: CACHE_DURATION.SHORT,
  },
  
  // Calendar data
  calendarEvents: {
    tags: [CACHE_TAGS.CALENDAR_EVENTS],
    revalidate: CACHE_DURATION.CALENDAR_EVENTS,
  },
  calendarCategories: {
    tags: [CACHE_TAGS.CALENDAR_CATEGORIES],
    revalidate: CACHE_DURATION.CALENDAR_CATEGORIES,
  },
  calendarPreferences: {
    tags: [CACHE_TAGS.CALENDAR_PREFERENCES],
    revalidate: CACHE_DURATION.CALENDAR_PREFERENCES,
  },
} as const;

/**
 * Helper to invalidate cache by tags
 * Note: This requires Next.js 14+ with revalidateTag
 */
export async function invalidateCache(tags: string | string[]) {
  const { revalidateTag } = await import("next/cache");
  const tagArray = Array.isArray(tags) ? tags : [tags];
  
  for (const tag of tagArray) {
    revalidateTag(tag);
  }
}

/**
 * Helper to invalidate cache by path
 * Note: This requires Next.js 14+ with revalidatePath
 */
export async function invalidatePath(path: string, type?: "page" | "layout") {
  const { revalidatePath } = await import("next/cache");
  revalidatePath(path, type);
}

/**
 * Batch cache invalidation
 */
export async function invalidateCacheBatch(options: {
  tags?: string[];
  paths?: string[];
}) {
  const { tags = [], paths = [] } = options;
  
  await Promise.all([
    ...tags.map((tag) => invalidateCache(tag)),
    ...paths.map((path) => invalidatePath(path)),
  ]);
}

/**
 * Cache warming - preload frequently accessed data
 */
export async function warmCache(
  queries: Array<{
    fn: () => Promise<any>;
    key: string;
    ttl?: number;
  }>
) {
  await Promise.all(
    queries.map(async ({ fn, key, ttl }) => {
      try {
        const data = await fn();
        memoryCache.set(key, data, ttl);
      } catch (error) {
        console.error(`Failed to warm cache for ${key}:`, error);
      }
    })
  );
}

/**
 * Stale-while-revalidate pattern implementation
 * Returns cached data immediately while fetching fresh data in background
 */
export async function staleWhileRevalidate<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options?: {
    ttl?: number;
    staleTime?: number;
  }
): Promise<T> {
  const { ttl = CACHE_DURATION.MEDIUM * 1000, staleTime = CACHE_DURATION.SHORT * 1000 } = options || {};
  
  const cached = memoryCache.get(key);
  
  if (cached) {
    // Return cached data immediately
    // Revalidate in background if stale
    const age = Date.now() - cached.timestamp;
    if (age > staleTime) {
      // Don't await - fetch in background
      fetchFn().then((data) => {
        memoryCache.set(key, data, ttl);
      }).catch((error) => {
        console.error(`Background revalidation failed for ${key}:`, error);
      });
    }
    return cached;
  }
  
  // No cache - fetch and cache
  const data = await fetchFn();
  memoryCache.set(key, data, ttl);
  return data;
}
