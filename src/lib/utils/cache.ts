/**
 * Caching utilities for React Server Components
 * Implements stale-while-revalidate pattern
 */

/**
 * Cache configuration for different data types
 */
export const CacheConfig = {
  // Static data that rarely changes
  STATIC: {
    revalidate: 3600, // 1 hour
    tags: ['static'],
  },
  
  // Academic data (classes, subjects, etc.)
  ACADEMIC: {
    revalidate: 1800, // 30 minutes
    tags: ['academic'],
  },
  
  // User data (profiles, settings)
  USER: {
    revalidate: 300, // 5 minutes
    tags: ['user'],
  },
  
  // Dynamic data (messages, notifications)
  DYNAMIC: {
    revalidate: 60, // 1 minute
    tags: ['dynamic'],
  },
  
  // Real-time data (attendance, live updates)
  REALTIME: {
    revalidate: 0, // No caching
    tags: ['realtime'],
  },
} as const;

/**
 * Get cache configuration for a specific data type
 */
export function getCacheConfig(type: keyof typeof CacheConfig) {
  return CacheConfig[type];
}

/**
 * Create fetch options with caching configuration
 */
export function createCacheOptions(
  type: keyof typeof CacheConfig,
  additionalTags?: string[]
) {
  const config = getCacheConfig(type);
  
  return {
    next: {
      revalidate: config.revalidate,
      tags: additionalTags ? [...config.tags, ...additionalTags] : config.tags,
    },
  };
}

/**
 * Cache keys for different data types
 */
export const CacheKeys = {
  // Parent-specific cache keys
  PARENT_CHILDREN: (parentId: string) => `parent:${parentId}:children`,
  PARENT_SETTINGS: (parentId: string) => `parent:${parentId}:settings`,
  
  // Student-specific cache keys
  STUDENT_PROFILE: (studentId: string) => `student:${studentId}:profile`,
  STUDENT_ATTENDANCE: (studentId: string) => `student:${studentId}:attendance`,
  STUDENT_FEES: (studentId: string) => `student:${studentId}:fees`,
  STUDENT_PERFORMANCE: (studentId: string) => `student:${studentId}:performance`,
  
  // Academic cache keys
  ACADEMIC_YEAR: (yearId: string) => `academic:year:${yearId}`,
  CLASS_SCHEDULE: (classId: string) => `class:${classId}:schedule`,
  TIMETABLE: (timetableId: string) => `timetable:${timetableId}`,
  
  // Communication cache keys
  MESSAGES: (userId: string, type: string) => `messages:${userId}:${type}`,
  ANNOUNCEMENTS: 'announcements:active',
  NOTIFICATIONS: (userId: string) => `notifications:${userId}`,
} as const;
