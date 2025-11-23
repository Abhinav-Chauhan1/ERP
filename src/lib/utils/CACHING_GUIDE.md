# Next.js Caching Infrastructure Guide

## Overview

This guide explains how to use the Next.js caching infrastructure implemented in the ERP system. The caching system uses Next.js 15's built-in caching features including `unstable_cache()`, `revalidateTag()`, and `revalidatePath()`.

## Architecture

The caching system consists of three main components:

1. **Cache Utilities** (`cache.ts`) - Core caching functions and configurations
2. **Cached Queries** (`cached-queries.ts`) - Pre-configured cached database queries
3. **Cache Invalidation** (`cache-invalidation.ts`) - Helpers for invalidating cache after mutations

## Cache Tags

Cache tags are used to group related cached data for easy invalidation:

```typescript
import { CACHE_TAGS } from '@/lib/utils/cache';

// Available tags:
CACHE_TAGS.USERS
CACHE_TAGS.STUDENTS
CACHE_TAGS.TEACHERS
CACHE_TAGS.PARENTS
CACHE_TAGS.CLASSES
CACHE_TAGS.SECTIONS
CACHE_TAGS.SUBJECTS
CACHE_TAGS.ACADEMIC_YEARS
CACHE_TAGS.TERMS
CACHE_TAGS.ATTENDANCE
CACHE_TAGS.EXAMS
CACHE_TAGS.ASSIGNMENTS
CACHE_TAGS.FEE_PAYMENTS
CACHE_TAGS.EVENTS
CACHE_TAGS.TIMETABLE
CACHE_TAGS.ANNOUNCEMENTS
CACHE_TAGS.DOCUMENTS
CACHE_TAGS.LIBRARY
CACHE_TAGS.TRANSPORT
CACHE_TAGS.SETTINGS
CACHE_TAGS.DASHBOARD
```

## Cache Durations

Different types of data have different cache durations:

```typescript
import { CACHE_DURATION } from '@/lib/utils/cache';

// Static data (rarely changes)
CACHE_DURATION.ACADEMIC_YEARS  // 1 hour
CACHE_DURATION.TERMS           // 1 hour
CACHE_DURATION.SETTINGS        // 1 hour
CACHE_DURATION.STATIC          // 1 hour

// Semi-static data (changes occasionally)
CACHE_DURATION.CLASSES         // 30 minutes
CACHE_DURATION.SUBJECTS        // 30 minutes
CACHE_DURATION.TIMETABLE       // 30 minutes
CACHE_DURATION.LONG            // 30 minutes

// Dynamic data (changes frequently)
CACHE_DURATION.ANNOUNCEMENTS   // 5 minutes
CACHE_DURATION.LIBRARY         // 5 minutes
CACHE_DURATION.MEDIUM          // 5 minutes

// Real-time data (no cache)
CACHE_DURATION.MESSAGES        // 0 (no cache)
CACHE_DURATION.NOTIFICATIONS   // 0 (no cache)
CACHE_DURATION.REALTIME        // 0 (no cache)
```

## Using Cached Queries

### Pre-configured Cached Queries

Use pre-configured cached queries for common data:

```typescript
import {
  getActiveAcademicYear,
  getAllAcademicYears,
  getActiveTerm,
  getTermsByAcademicYear,
  getClassesForDropdown,
  getSubjectsForDropdown,
  getActiveAnnouncements,
  getSystemSettings,
} from '@/lib/utils/cached-queries';

// In a server component
export default async function DashboardPage() {
  const academicYear = await getActiveAcademicYear();
  const classes = await getClassesForDropdown();
  
  return (
    <div>
      <h1>Academic Year: {academicYear?.name}</h1>
      {/* ... */}
    </div>
  );
}
```

### Creating Custom Cached Queries

Create your own cached queries using the `cachedQuery` helper:

```typescript
import { cachedQuery, CACHE_TAGS, CACHE_DURATION } from '@/lib/utils/cache';
import { db } from '@/lib/db';

export const getStudentsByGrade = cachedQuery(
  async (grade: string) => {
    return await db.student.findMany({
      where: {
        enrollments: {
          some: {
            class: {
              grade: grade,
            },
            status: 'ACTIVE',
          },
        },
      },
    });
  },
  {
    name: 'students-by-grade',
    tags: [CACHE_TAGS.STUDENTS, CACHE_TAGS.CLASSES],
    revalidate: CACHE_DURATION.MEDIUM,
  }
);
```

## Cache Invalidation

### After Mutations

Always invalidate cache after data mutations:

```typescript
'use server';

import { db } from '@/lib/db';
import { invalidateClassCache } from '@/lib/utils/cache-invalidation';

export async function createClass(data: ClassInput) {
  try {
    const newClass = await db.class.create({ data });
    
    // Invalidate class-related caches
    await invalidateClassCache();
    
    return { success: true, data: newClass };
  } catch (error) {
    return { success: false, error: 'Failed to create class' };
  }
}
```

### Available Invalidation Helpers

```typescript
import {
  invalidateUserCache,
  invalidateStudentCache,
  invalidateTeacherCache,
  invalidateClassCache,
  invalidateSubjectCache,
  invalidateAcademicYearCache,
  invalidateTermCache,
  invalidateAttendanceCache,
  invalidateExamCache,
  invalidateAssignmentCache,
  invalidateFeePaymentCache,
  invalidateAnnouncementCache,
  invalidateEventCache,
  invalidateTimetableCache,
  invalidateLibraryCache,
  invalidateTransportCache,
  invalidateSettingsCache,
  invalidateDashboardCache,
} from '@/lib/utils/cache-invalidation';

// Example: After updating a student
await invalidateStudentCache(studentId);

// Example: After creating an exam
await invalidateExamCache();

// Example: After updating timetable
await invalidateTimetableCache();
```

### Batch Invalidation

Invalidate multiple caches at once:

```typescript
import { invalidateCacheBatch, CACHE_TAGS } from '@/lib/utils/cache-invalidation';

await invalidateCacheBatch({
  tags: [CACHE_TAGS.STUDENTS, CACHE_TAGS.CLASSES, CACHE_TAGS.DASHBOARD],
  paths: [
    { path: '/student/123' },
    { path: '/admin/classes/456' },
  ],
});
```

### Manual Invalidation

For custom invalidation needs:

```typescript
import { invalidateCacheTags, invalidateCachePath } from '@/lib/utils/cache-invalidation';

// Invalidate by tags
await invalidateCacheTags([CACHE_TAGS.STUDENTS, CACHE_TAGS.CLASSES]);

// Invalidate by path
await invalidateCachePath('/admin/students');
await invalidateCachePath('/admin', 'layout');
```

## Best Practices

### 1. Choose Appropriate Cache Duration

- **Static data** (academic years, terms, settings): 1 hour
- **Semi-static data** (classes, subjects, timetable): 30 minutes
- **Dynamic data** (announcements, library): 5 minutes
- **Real-time data** (messages, notifications): No cache

### 2. Use Specific Cache Tags

Tag your cached data appropriately for granular invalidation:

```typescript
// Good - specific tags
{
  tags: [CACHE_TAGS.STUDENTS, CACHE_TAGS.CLASSES],
  revalidate: CACHE_DURATION.MEDIUM,
}

// Avoid - too generic
{
  tags: [CACHE_TAGS.DASHBOARD],
  revalidate: CACHE_DURATION.SHORT,
}
```

### 3. Always Invalidate After Mutations

```typescript
export async function updateStudent(id: string, data: StudentInput) {
  const updated = await db.student.update({ where: { id }, data });
  
  // Always invalidate related caches
  await invalidateStudentCache(id);
  
  return updated;
}
```

### 4. Use Request Memoization for Same-Request Deduplication

Next.js automatically deduplicates identical requests within a single render:

```typescript
// These will only execute once per request
const academicYear = await getActiveAcademicYear();
const sameAcademicYear = await getActiveAcademicYear(); // Uses memoized result
```

### 5. Implement Stale-While-Revalidate for Critical Data

```typescript
import { staleWhileRevalidate } from '@/lib/utils/cache';

const data = await staleWhileRevalidate(
  'critical-data-key',
  async () => {
    return await db.criticalData.findMany();
  },
  {
    ttl: 60000, // 1 minute
    staleTime: 30000, // 30 seconds
  }
);
```

## Cache Configuration Examples

### Example 1: Academic Year Caching

```typescript
// Academic years rarely change - cache for 1 hour
export const getAllAcademicYears = cachedQuery(
  async () => {
    return await db.academicYear.findMany({
      orderBy: { startDate: 'desc' },
    });
  },
  {
    name: 'all-academic-years',
    tags: [CACHE_TAGS.ACADEMIC_YEARS],
    revalidate: CACHE_DURATION.ACADEMIC_YEARS, // 1 hour
  }
);

// Invalidate after creating/updating academic year
export async function createAcademicYear(data: AcademicYearInput) {
  const academicYear = await db.academicYear.create({ data });
  await invalidateAcademicYearCache();
  return academicYear;
}
```

### Example 2: Terms Caching

```typescript
// Terms rarely change - cache for 1 hour
export const getTermsByAcademicYear = cachedQuery(
  async (academicYearId: string) => {
    return await db.term.findMany({
      where: { academicYearId },
      orderBy: { startDate: 'asc' },
    });
  },
  {
    name: 'terms-by-academic-year',
    tags: [CACHE_TAGS.TERMS],
    revalidate: CACHE_DURATION.TERMS, // 1 hour
  }
);

// Invalidate after creating/updating term
export async function createTerm(data: TermInput) {
  const term = await db.term.create({ data });
  await invalidateTermCache();
  return term;
}
```

### Example 3: Dashboard Statistics

```typescript
// Dashboard stats change frequently - cache for 1 minute
export const getDashboardStats = cachedQuery(
  async (userId: string, role: string) => {
    // Fetch role-specific stats
    return await fetchStatsForRole(userId, role);
  },
  {
    name: 'dashboard-stats',
    tags: [CACHE_TAGS.DASHBOARD],
    revalidate: CACHE_DURATION.DASHBOARD_STATS, // 1 minute
  }
);

// Invalidate after any action that affects stats
export async function markAttendance(data: AttendanceInput) {
  const attendance = await db.attendance.create({ data });
  await invalidateDashboardCache();
  return attendance;
}
```

## Monitoring Cache Performance

### Check Cache Hit Rates

Monitor cache effectiveness in production:

```typescript
// Add logging to cached queries
export const getActiveAcademicYear = cachedQuery(
  async () => {
    console.log('[CACHE MISS] Fetching active academic year');
    return await db.academicYear.findFirst({
      where: { isCurrent: true },
    });
  },
  {
    name: 'active-academic-year',
    tags: [CACHE_TAGS.ACADEMIC_YEARS],
    revalidate: CACHE_DURATION.ACADEMIC_YEARS,
  }
);
```

### Measure Query Performance

Track slow queries:

```typescript
export const getStudentPerformance = cachedQuery(
  async (studentId: string) => {
    const start = Date.now();
    const data = await db.student.findUnique({
      where: { id: studentId },
      include: {
        // Complex includes
      },
    });
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      console.warn(`[SLOW QUERY] getStudentPerformance took ${duration}ms`);
    }
    
    return data;
  },
  {
    name: 'student-performance',
    tags: [CACHE_TAGS.STUDENTS, CACHE_TAGS.RESULTS],
    revalidate: CACHE_DURATION.MEDIUM,
  }
);
```

## Troubleshooting

### Cache Not Invalidating

1. Check that you're calling the invalidation function after mutations
2. Verify the correct cache tags are being used
3. Ensure `revalidateTag()` and `revalidatePath()` are being called

### Stale Data Issues

1. Reduce cache duration for frequently changing data
2. Add more specific cache tags for granular invalidation
3. Use real-time updates for critical data (no cache)

### Performance Issues

1. Increase cache duration for static data
2. Use request memoization for same-request deduplication
3. Implement stale-while-revalidate for critical paths
4. Add database indexes for frequently queried fields

## Migration Guide

### Migrating Existing Queries to Use Caching

Before:
```typescript
export async function getClasses() {
  return await db.class.findMany();
}
```

After:
```typescript
import { cachedQuery, CACHE_TAGS, CACHE_DURATION } from '@/lib/utils/cache';

export const getClasses = cachedQuery(
  async () => {
    return await db.class.findMany();
  },
  {
    name: 'all-classes',
    tags: [CACHE_TAGS.CLASSES],
    revalidate: CACHE_DURATION.CLASSES,
  }
);
```

### Adding Cache Invalidation to Existing Mutations

Before:
```typescript
export async function createClass(data: ClassInput) {
  return await db.class.create({ data });
}
```

After:
```typescript
import { invalidateClassCache } from '@/lib/utils/cache-invalidation';

export async function createClass(data: ClassInput) {
  const newClass = await db.class.create({ data });
  await invalidateClassCache();
  return newClass;
}
```

## Summary

The caching infrastructure provides:

- ✅ Automatic caching with Next.js `unstable_cache()`
- ✅ Tag-based cache invalidation with `revalidateTag()`
- ✅ Path-based cache invalidation with `revalidatePath()`
- ✅ Pre-configured cache durations for different data types
- ✅ Convenient invalidation helpers for common mutations
- ✅ Request memoization for same-request deduplication
- ✅ Stale-while-revalidate pattern for critical data

Follow the best practices in this guide to ensure optimal caching performance and data freshness.
