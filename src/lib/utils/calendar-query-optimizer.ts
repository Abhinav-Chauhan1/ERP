/**
 * Calendar Query Optimizer
 * 
 * Provides optimized database queries for calendar operations with:
 * - Efficient index usage
 * - Query result caching
 * - Batch operations
 * - Connection pooling awareness
 * 
 * Performance Requirements: Task 23
 */

import { db } from '@/lib/db';
import { CalendarEvent, CalendarEventCategory, UserCalendarPreferences, Prisma } from '@prisma/client';
import { memoryCache, CACHE_DURATION } from '@/lib/utils/cache';

/**
 * Optimized query to get events by date range
 * Uses composite index on (startDate, endDate)
 */
export async function getEventsByDateRangeOptimized(
  startDate: Date,
  endDate: Date,
  options?: {
    categoryIds?: string[];
    visibleToRoles?: string[];
    limit?: number;
    offset?: number;
  }
): Promise<CalendarEvent[]> {
  const where: Prisma.CalendarEventWhereInput = {
    AND: [
      { endDate: { gte: startDate } },
      { startDate: { lte: endDate } }
    ]
  };

  if (options?.categoryIds && options.categoryIds.length > 0) {
    where.categoryId = { in: options.categoryIds };
  }

  if (options?.visibleToRoles && options.visibleToRoles.length > 0) {
    where.visibleToRoles = { hasSome: options.visibleToRoles };
  }

  return await db.calendarEvent.findMany({
    where,
    include: {
      category: true,
      notes: true,
      reminders: true
    },
    orderBy: {
      startDate: 'asc'
    },
    take: options?.limit,
    skip: options?.offset
  });
}

/**
 * Batch fetch events for multiple date ranges
 * More efficient than multiple individual queries
 */
export async function batchGetEventsByDateRanges(
  ranges: Array<{ startDate: Date; endDate: Date }>,
  options?: {
    categoryIds?: string[];
    visibleToRoles?: string[];
  }
): Promise<Map<string, CalendarEvent[]>> {
  // Build OR conditions for all date ranges
  const dateConditions = ranges.map(range => ({
    AND: [
      { endDate: { gte: range.startDate } },
      { startDate: { lte: range.endDate } }
    ]
  }));

  const where: Prisma.CalendarEventWhereInput = {
    OR: dateConditions
  };

  if (options?.categoryIds && options.categoryIds.length > 0) {
    where.categoryId = { in: options.categoryIds };
  }

  if (options?.visibleToRoles && options.visibleToRoles.length > 0) {
    where.visibleToRoles = { hasSome: options.visibleToRoles };
  }

  // Fetch all events in a single query
  const allEvents = await db.calendarEvent.findMany({
    where,
    include: {
      category: true,
      notes: true,
      reminders: true
    },
    orderBy: {
      startDate: 'asc'
    }
  });

  // Group events by date range
  const results = new Map<string, CalendarEvent[]>();
  
  ranges.forEach(range => {
    const key = `${range.startDate.toISOString()}-${range.endDate.toISOString()}`;
    const rangeEvents = allEvents.filter(event => 
      event.endDate >= range.startDate && event.startDate <= range.endDate
    );
    results.set(key, rangeEvents);
  });

  return results;
}

/**
 * Get event count by category with optimized groupBy query
 * Uses database aggregation instead of fetching all events
 */
export async function getEventCountByCategoryOptimized(
  startDate: Date,
  endDate: Date,
  options?: {
    visibleToRoles?: string[];
    classIds?: string[];
    sectionIds?: string[];
  }
): Promise<Map<string, number>> {
  const cacheKey = `event-count-by-category:${startDate.toISOString()}:${endDate.toISOString()}:${JSON.stringify(options)}`;
  
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return new Map(cached);
  }

  const where: Prisma.CalendarEventWhereInput = {
    AND: [
      { endDate: { gte: startDate } },
      { startDate: { lte: endDate } }
    ]
  };

  if (options?.visibleToRoles && options.visibleToRoles.length > 0) {
    where.visibleToRoles = { hasSome: options.visibleToRoles };
  }

  if (options?.classIds && options.classIds.length > 0) {
    where.visibleToClasses = { hasSome: options.classIds };
  }

  if (options?.sectionIds && options.sectionIds.length > 0) {
    where.visibleToSections = { hasSome: options.sectionIds };
  }

  // Use groupBy for efficient aggregation
  const results = await db.calendarEvent.groupBy({
    by: ['categoryId'],
    where,
    _count: {
      id: true
    }
  });

  const countMap = new Map<string, number>();
  results.forEach(item => {
    countMap.set(item.categoryId, item._count.id);
  });

  // Cache for 5 minutes
  memoryCache.set(cacheKey, Array.from(countMap.entries()), CACHE_DURATION.CALENDAR_EVENTS * 1000);

  return countMap;
}

/**
 * Get upcoming events with limit
 * Optimized for dashboard widgets
 */
export async function getUpcomingEventsOptimized(
  userId: string,
  limit: number = 10,
  options?: {
    categoryIds?: string[];
    visibleToRoles?: string[];
  }
): Promise<CalendarEvent[]> {
  const cacheKey = `upcoming-events:${userId}:${limit}:${JSON.stringify(options)}`;
  
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const now = new Date();
  
  const where: Prisma.CalendarEventWhereInput = {
    startDate: { gte: now }
  };

  if (options?.categoryIds && options.categoryIds.length > 0) {
    where.categoryId = { in: options.categoryIds };
  }

  if (options?.visibleToRoles && options.visibleToRoles.length > 0) {
    where.visibleToRoles = { hasSome: options.visibleToRoles };
  }

  const events = await db.calendarEvent.findMany({
    where,
    include: {
      category: true
    },
    orderBy: {
      startDate: 'asc'
    },
    take: limit
  });

  // Cache for 5 minutes
  memoryCache.set(cacheKey, events, CACHE_DURATION.CALENDAR_EVENTS * 1000);

  return events;
}

/**
 * Get events by source (exam, assignment, meeting)
 * Uses composite index on (sourceType, sourceId)
 */
export async function getEventsBySourceOptimized(
  sourceType: string,
  sourceId: string
): Promise<CalendarEvent[]> {
  const cacheKey = `events-by-source:${sourceType}:${sourceId}`;
  
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const events = await db.calendarEvent.findMany({
    where: {
      sourceType: sourceType as any,
      sourceId: sourceId
    },
    include: {
      category: true,
      notes: true,
      reminders: true
    },
    orderBy: {
      startDate: 'asc'
    }
  });

  // Cache for 5 minutes
  memoryCache.set(cacheKey, events, CACHE_DURATION.CALENDAR_EVENTS * 1000);

  return events;
}

/**
 * Batch fetch categories with caching
 * Categories rarely change, so aggressive caching is safe
 */
export async function getCategoriesOptimized(): Promise<CalendarEventCategory[]> {
  const cacheKey = 'calendar-categories:all';
  
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const categories = await db.calendarEventCategory.findMany({
    where: { isActive: true },
    orderBy: [
      { order: 'asc' },
      { name: 'asc' }
    ]
  });

  // Cache for 1 hour
  memoryCache.set(cacheKey, categories, CACHE_DURATION.CALENDAR_CATEGORIES * 1000);

  return categories;
}

/**
 * Get user preferences with caching
 */
export async function getUserPreferencesOptimized(
  userId: string
): Promise<UserCalendarPreferences | null> {
  const cacheKey = `calendar-preferences:${userId}`;
  
  const cached = memoryCache.get(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const preferences = await db.userCalendarPreferences.findUnique({
    where: { userId }
  });

  // Cache for 30 minutes
  memoryCache.set(cacheKey, preferences, CACHE_DURATION.CALENDAR_PREFERENCES * 1000);

  return preferences;
}

/**
 * Batch fetch user preferences for multiple users
 */
export async function batchGetUserPreferences(
  userIds: string[]
): Promise<Map<string, UserCalendarPreferences | null>> {
  const results = new Map<string, UserCalendarPreferences | null>();
  
  // Check cache first
  const uncachedUserIds: string[] = [];
  userIds.forEach(userId => {
    const cacheKey = `calendar-preferences:${userId}`;
    const cached = memoryCache.get(cacheKey);
    if (cached !== null) {
      results.set(userId, cached);
    } else {
      uncachedUserIds.push(userId);
    }
  });

  // Fetch uncached preferences in a single query
  if (uncachedUserIds.length > 0) {
    const preferences = await db.userCalendarPreferences.findMany({
      where: {
        userId: { in: uncachedUserIds }
      }
    });

    // Cache and add to results
    preferences.forEach(pref => {
      const cacheKey = `calendar-preferences:${pref.userId}`;
      memoryCache.set(cacheKey, pref, CACHE_DURATION.CALENDAR_PREFERENCES * 1000);
      results.set(pref.userId, pref);
    });

    // Add null for users without preferences
    uncachedUserIds.forEach(userId => {
      if (!results.has(userId)) {
        results.set(userId, null);
      }
    });
  }

  return results;
}

/**
 * Get event statistics for a date range
 * Optimized aggregation query
 */
export async function getEventStatisticsOptimized(
  startDate: Date,
  endDate: Date,
  options?: {
    visibleToRoles?: string[];
  }
): Promise<{
  totalEvents: number;
  eventsByCategory: Map<string, number>;
  eventsByMonth: Map<string, number>;
  recurringEvents: number;
}> {
  const cacheKey = `event-statistics:${startDate.toISOString()}:${endDate.toISOString()}:${JSON.stringify(options)}`;
  
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const where: Prisma.CalendarEventWhereInput = {
    AND: [
      { endDate: { gte: startDate } },
      { startDate: { lte: endDate } }
    ]
  };

  if (options?.visibleToRoles && options.visibleToRoles.length > 0) {
    where.visibleToRoles = { hasSome: options.visibleToRoles };
  }

  // Execute all aggregations in parallel
  const [
    totalCount,
    categoryGroups,
    recurringCount,
    allEvents
  ] = await Promise.all([
    db.calendarEvent.count({ where }),
    db.calendarEvent.groupBy({
      by: ['categoryId'],
      where,
      _count: { id: true }
    }),
    db.calendarEvent.count({
      where: { ...where, isRecurring: true }
    }),
    db.calendarEvent.findMany({
      where,
      select: { startDate: true }
    })
  ]);

  // Group by month
  const eventsByMonth = new Map<string, number>();
  allEvents.forEach(event => {
    const monthKey = event.startDate.toISOString().substring(0, 7); // YYYY-MM
    eventsByMonth.set(monthKey, (eventsByMonth.get(monthKey) || 0) + 1);
  });

  const eventsByCategory = new Map<string, number>();
  categoryGroups.forEach(group => {
    eventsByCategory.set(group.categoryId, group._count.id);
  });

  const statistics = {
    totalEvents: totalCount,
    eventsByCategory,
    eventsByMonth,
    recurringEvents: recurringCount
  };

  // Cache for 5 minutes
  memoryCache.set(cacheKey, statistics, CACHE_DURATION.CALENDAR_EVENTS * 1000);

  return statistics;
}

/**
 * Prefetch calendar data for a user
 * Loads commonly accessed data in parallel
 */
export async function prefetchCalendarDataOptimized(
  userId: string,
  dateRange?: { startDate: Date; endDate: Date }
): Promise<void> {
  const now = new Date();
  const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const start = dateRange?.startDate || defaultStartDate;
  const end = dateRange?.endDate || defaultEndDate;

  // Prefetch in parallel
  await Promise.all([
    getCategoriesOptimized(),
    getUserPreferencesOptimized(userId),
    getUpcomingEventsOptimized(userId, 10)
  ]);
}

/**
 * Invalidate calendar query cache
 */
export function invalidateCalendarQueryCache(options?: {
  userId?: string;
  categoryId?: string;
  sourceType?: string;
  sourceId?: string;
}): void {
  // Clear relevant cache entries
  // Note: This is a simple implementation. For production, consider using Redis with pattern-based deletion
  
  if (options?.userId) {
    memoryCache.delete(`calendar-preferences:${options.userId}`);
    memoryCache.delete(`upcoming-events:${options.userId}`);
  }

  if (options?.sourceType && options?.sourceId) {
    memoryCache.delete(`events-by-source:${options.sourceType}:${options.sourceId}`);
  }

  // Clear category cache if category changed
  if (options?.categoryId) {
    memoryCache.delete('calendar-categories:all');
  }
}
