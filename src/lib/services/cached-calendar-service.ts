/**
 * Cached Calendar Service
 * 
 * Provides cached versions of calendar operations with performance optimizations.
 * Implements caching for event categories, user preferences, and query results.
 * 
 * Performance Requirements: Task 23
 */

import { CalendarEvent, CalendarEventCategory, UserCalendarPreferences } from '@prisma/client';
import { db } from '@/lib/db';
import { cachedQuery, CACHE_CONFIG, memoryCache, CACHE_DURATION } from '@/lib/utils/cache';
import { getCalendarEvents } from './calendar-service';

/**
 * Get all event categories with caching
 * Categories rarely change, so we cache them for 1 hour
 */
export const getCachedEventCategories = cachedQuery(
  async (): Promise<CalendarEventCategory[]> => {
    return await db.calendarEventCategory.findMany({
      where: { isActive: true },
      orderBy: [
        { order: 'asc' },
        { name: 'asc' }
      ]
    });
  },
  {
    name: 'calendar-categories',
    tags: CACHE_CONFIG.calendarCategories.tags as unknown as string[],
    revalidate: CACHE_CONFIG.calendarCategories.revalidate,
  }
);

/**
 * Get user calendar preferences with caching
 * Preferences change occasionally, so we cache them for 30 minutes
 */
export const getCachedUserPreferences = cachedQuery(
  async (userId: string): Promise<UserCalendarPreferences | null> => {
    return await db.userCalendarPreferences.findUnique({
      where: { userId }
    });
  },
  {
    name: 'calendar-preferences',
    tags: CACHE_CONFIG.calendarPreferences.tags as unknown as string[],
    revalidate: CACHE_CONFIG.calendarPreferences.revalidate,
  }
);

/**
 * Get calendar events with pagination and caching
 * Implements efficient pagination at the database level
 */
export async function getPaginatedCalendarEvents(
  filters: {
    startDate?: Date;
    endDate?: Date;
    categoryIds?: string[];
    visibleToRoles?: string[];
    classIds?: string[];
    sectionIds?: string[];
    sourceType?: any;
    sourceId?: string;
    createdBy?: string;
  },
  pagination: {
    page: number;
    limit: number;
  }
): Promise<{
  events: CalendarEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  // Date range filter
  if (filters.startDate || filters.endDate) {
    where.AND = [];
    if (filters.startDate) {
      where.AND.push({ endDate: { gte: filters.startDate } });
    }
    if (filters.endDate) {
      where.AND.push({ startDate: { lte: filters.endDate } });
    }
  }

  // Category filter
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    where.categoryId = { in: filters.categoryIds };
  }

  // Role filter
  if (filters.visibleToRoles && filters.visibleToRoles.length > 0) {
    where.visibleToRoles = { hasSome: filters.visibleToRoles };
  }

  // Class filter
  if (filters.classIds && filters.classIds.length > 0) {
    where.visibleToClasses = { hasSome: filters.classIds };
  }

  // Section filter
  if (filters.sectionIds && filters.sectionIds.length > 0) {
    where.visibleToSections = { hasSome: filters.sectionIds };
  }

  // Source type filter
  if (filters.sourceType) {
    where.sourceType = filters.sourceType;
  }

  // Source ID filter
  if (filters.sourceId) {
    where.sourceId = filters.sourceId;
  }

  // Created by filter
  if (filters.createdBy) {
    where.createdBy = filters.createdBy;
  }

  // Execute count and query in parallel for better performance
  const [total, events] = await Promise.all([
    db.calendarEvent.count({ where }),
    db.calendarEvent.findMany({
      where,
      include: {
        category: true,
        notes: true,
        reminders: true
      },
      orderBy: {
        startDate: 'asc'
      },
      skip,
      take: limit
    })
  ]);

  return {
    events,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Optimized recurring event instance generation with caching
 * Caches generated instances for the current view window
 */
export function getCachedRecurringInstances(
  baseEvent: CalendarEvent,
  startDate: Date,
  endDate: Date
): Array<{ startDate: Date; endDate: Date }> {
  // Create cache key based on event ID and date range
  const cacheKey = `recurring-instances:${baseEvent.id}:${startDate.toISOString()}:${endDate.toISOString()}`;

  // Check memory cache first
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Generate instances (using existing logic from calendar-service)
  const { generateRecurringInstances } = require('./calendar-service');
  const instances = generateRecurringInstances(baseEvent, startDate, endDate);

  // Cache for 1 hour
  memoryCache.set(cacheKey, instances, CACHE_DURATION.LONG * 1000);

  return instances;
}

/**
 * Batch fetch events for multiple date ranges
 * Useful for calendar views that need to load multiple months
 */
export async function batchFetchEventsByDateRanges(
  dateRanges: Array<{ startDate: Date; endDate: Date }>,
  filters: {
    categoryIds?: string[];
    visibleToRoles?: string[];
    classIds?: string[];
    sectionIds?: string[];
  }
): Promise<Map<string, CalendarEvent[]>> {
  const results = new Map<string, CalendarEvent[]>();

  // Fetch all ranges in parallel
  await Promise.all(
    dateRanges.map(async (range) => {
      const key = `${range.startDate.toISOString()}-${range.endDate.toISOString()}`;
      const events = await getCalendarEvents({
        startDate: range.startDate,
        endDate: range.endDate,
        ...filters
      });
      results.set(key, events);
    })
  );

  return results;
}

/**
 * Prefetch calendar data for improved perceived performance
 * Loads categories and preferences in parallel
 */
export async function prefetchCalendarData(userId: string): Promise<{
  categories: CalendarEventCategory[];
  preferences: UserCalendarPreferences | null;
}> {
  const [categories, preferences] = await Promise.all([
    getCachedEventCategories(),
    getCachedUserPreferences(userId)
  ]);

  return { categories, preferences };
}

/**
 * Get event count by category with caching
 * Useful for dashboard widgets and statistics
 */
export async function getCachedEventCountByCategory(
  startDate: Date,
  endDate: Date,
  filters?: {
    visibleToRoles?: string[];
    classIds?: string[];
    sectionIds?: string[];
  }
): Promise<Map<string, number>> {
  const cacheKey = `event-count-by-category:${startDate.toISOString()}:${endDate.toISOString()}:${JSON.stringify(filters)}`;

  // Check memory cache
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return new Map(cached);
  }

  // Build where clause
  const where: any = {
    AND: [
      { endDate: { gte: startDate } },
      { startDate: { lte: endDate } }
    ]
  };

  if (filters?.visibleToRoles && filters.visibleToRoles.length > 0) {
    where.visibleToRoles = { hasSome: filters.visibleToRoles };
  }

  if (filters?.classIds && filters.classIds.length > 0) {
    where.visibleToClasses = { hasSome: filters.classIds };
  }

  if (filters?.sectionIds && filters.sectionIds.length > 0) {
    where.visibleToSections = { hasSome: filters.sectionIds };
  }

  // Group by category
  const events = await db.calendarEvent.groupBy({
    by: ['categoryId'],
    where,
    _count: {
      id: true
    }
  });

  const countMap = new Map<string, number>();
  events.forEach(item => {
    countMap.set(item.categoryId, item._count.id);
  });

  // Cache for 5 minutes
  memoryCache.set(cacheKey, Array.from(countMap.entries()), CACHE_DURATION.CALENDAR_EVENTS * 1000);

  return countMap;
}

/**
 * Warm up calendar cache for a specific user
 * Preloads frequently accessed data
 */
export async function warmCalendarCache(userId: string): Promise<void> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Preload categories, preferences, and current month events in parallel
  await Promise.all([
    getCachedEventCategories(),
    getCachedUserPreferences(userId),
    // Preload current month events
    getCalendarEvents({
      startDate: startOfMonth,
      endDate: endOfMonth
    })
  ]);
}
