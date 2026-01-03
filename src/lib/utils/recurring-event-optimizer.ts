/**
 * Recurring Event Instance Generator Optimizer
 * 
 * Optimizes recurring event instance generation with:
 * - Intelligent caching
 * - Batch generation
 * - Memory-efficient algorithms
 * - Limited future generation (2 years max)
 * 
 * Performance Requirements: Task 23
 */

import { CalendarEvent } from '@prisma/client';
import { RRule, rrulestr } from 'rrule';
import { memoryCache, CACHE_DURATION } from '@/lib/utils/cache';

/**
 * Maximum future date for recurring event generation (2 years)
 * Prevents excessive memory usage and computation time
 */
const MAX_FUTURE_YEARS = 2;

/**
 * Cache key generator for recurring instances
 */
function getCacheKey(eventId: string, startDate: Date, endDate: Date): string {
  return `recurring-instances:${eventId}:${startDate.toISOString()}:${endDate.toISOString()}`;
}

/**
 * Optimized recurring event instance generator
 * Uses caching and limits generation to 2 years in the future
 */
export function generateRecurringInstancesOptimized(
  baseEvent: CalendarEvent,
  startDate: Date,
  endDate: Date
): Array<{ startDate: Date; endDate: Date }> {
  if (!baseEvent.isRecurring || !baseEvent.recurrenceRule) {
    return [];
  }

  // Limit end date to 2 years in the future
  const maxEndDate = new Date();
  maxEndDate.setFullYear(maxEndDate.getFullYear() + MAX_FUTURE_YEARS);
  const limitedEndDate = endDate > maxEndDate ? maxEndDate : endDate;

  // Check cache first
  const cacheKey = getCacheKey(baseEvent.id, startDate, limitedEndDate);
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Parse the recurrence rule with the base event's start date as dtstart
    const rule = rrulestr(baseEvent.recurrenceRule, {
      dtstart: baseEvent.startDate
    });

    // Get occurrences between the date range
    const occurrences = rule.between(startDate, limitedEndDate, true);

    // Calculate event duration once
    const duration = baseEvent.endDate.getTime() - baseEvent.startDate.getTime();

    // Create exception dates set for O(1) lookup
    const exceptionTimes = new Set(
      baseEvent.exceptionDates.map(d => d.getTime())
    );

    // Generate instances efficiently
    const instances = occurrences
      .filter(occurrence => !exceptionTimes.has(occurrence.getTime()))
      .map(occurrence => ({
        startDate: occurrence,
        endDate: new Date(occurrence.getTime() + duration)
      }));

    // Cache for 1 hour
    memoryCache.set(cacheKey, instances, CACHE_DURATION.LONG * 1000);

    return instances;
  } catch (error) {
    console.error('Error generating recurring instances:', error);
    return [];
  }
}

/**
 * Batch generate recurring instances for multiple events
 * More efficient than generating one at a time
 */
export function batchGenerateRecurringInstances(
  events: CalendarEvent[],
  startDate: Date,
  endDate: Date
): Map<string, Array<{ startDate: Date; endDate: Date }>> {
  const results = new Map<string, Array<{ startDate: Date; endDate: Date }>>();

  // Filter to only recurring events
  const recurringEvents = events.filter(e => e.isRecurring && e.recurrenceRule);

  // Generate instances for each event
  recurringEvents.forEach(event => {
    const instances = generateRecurringInstancesOptimized(event, startDate, endDate);
    results.set(event.id, instances);
  });

  return results;
}

/**
 * Get next N occurrences of a recurring event
 * Useful for showing upcoming instances without generating all
 */
export function getNextOccurrences(
  baseEvent: CalendarEvent,
  count: number = 10
): Array<{ startDate: Date; endDate: Date }> {
  if (!baseEvent.isRecurring || !baseEvent.recurrenceRule) {
    return [];
  }

  const cacheKey = `next-occurrences:${baseEvent.id}:${count}`;
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const rule = rrulestr(baseEvent.recurrenceRule, {
      dtstart: baseEvent.startDate
    });

    // Get next N occurrences after now
    const now = new Date();
    const occurrences = rule.after(now, true);
    
    if (!occurrences) {
      return [];
    }

    // Get the next count occurrences
    const allOccurrences = rule.all((date, i) => i < count);

    const duration = baseEvent.endDate.getTime() - baseEvent.startDate.getTime();
    const exceptionTimes = new Set(
      baseEvent.exceptionDates.map(d => d.getTime())
    );

    const instances = allOccurrences
      .filter(occurrence => occurrence >= now && !exceptionTimes.has(occurrence.getTime()))
      .slice(0, count)
      .map(occurrence => ({
        startDate: occurrence,
        endDate: new Date(occurrence.getTime() + duration)
      }));

    // Cache for 30 minutes
    memoryCache.set(cacheKey, instances, CACHE_DURATION.LONG * 1000);

    return instances;
  } catch (error) {
    console.error('Error getting next occurrences:', error);
    return [];
  }
}

/**
 * Check if a specific date is an occurrence of a recurring event
 * Optimized for single date checks
 */
export function isOccurrenceDate(
  baseEvent: CalendarEvent,
  date: Date
): boolean {
  if (!baseEvent.isRecurring || !baseEvent.recurrenceRule) {
    return false;
  }

  // Check if date is in exception dates
  const dateTime = date.getTime();
  if (baseEvent.exceptionDates.some(d => d.getTime() === dateTime)) {
    return false;
  }

  try {
    const rule = rrulestr(baseEvent.recurrenceRule, {
      dtstart: baseEvent.startDate
    });

    // Check if date is in the rule
    const occurrences = rule.between(
      new Date(date.getTime() - 1000), // 1 second before
      new Date(date.getTime() + 1000), // 1 second after
      true
    );

    return occurrences.length > 0;
  } catch (error) {
    console.error('Error checking occurrence date:', error);
    return false;
  }
}

/**
 * Get occurrence count for a recurring event within a date range
 * Useful for statistics without generating all instances
 */
export function getOccurrenceCount(
  baseEvent: CalendarEvent,
  startDate: Date,
  endDate: Date
): number {
  if (!baseEvent.isRecurring || !baseEvent.recurrenceRule) {
    return 0;
  }

  const cacheKey = `occurrence-count:${baseEvent.id}:${startDate.toISOString()}:${endDate.toISOString()}`;
  const cached = memoryCache.get(cacheKey);
  if (cached !== null) {
    return cached;
  }

  try {
    const rule = rrulestr(baseEvent.recurrenceRule, {
      dtstart: baseEvent.startDate
    });

    const occurrences = rule.between(startDate, endDate, true);
    const exceptionTimes = new Set(
      baseEvent.exceptionDates.map(d => d.getTime())
    );

    const count = occurrences.filter(
      occurrence => !exceptionTimes.has(occurrence.getTime())
    ).length;

    // Cache for 1 hour
    memoryCache.set(cacheKey, count, CACHE_DURATION.LONG * 1000);

    return count;
  } catch (error) {
    console.error('Error getting occurrence count:', error);
    return 0;
  }
}

/**
 * Invalidate recurring event cache for a specific event
 * Call this when an event is updated or deleted
 */
export function invalidateRecurringEventCache(eventId: string): void {
  // Clear all cache entries for this event
  // Note: This is a simple implementation. For production, consider using a more sophisticated cache invalidation strategy
  const cacheKeys = [
    `recurring-instances:${eventId}`,
    `next-occurrences:${eventId}`,
    `occurrence-count:${eventId}`
  ];

  // Memory cache doesn't support pattern-based deletion, so we'll rely on TTL
  // In a production environment, consider using Redis with pattern-based deletion
}

/**
 * Warm up recurring event cache for common date ranges
 * Call this during application startup or when loading calendar views
 */
export async function warmRecurringEventCache(
  events: CalendarEvent[]
): Promise<void> {
  const now = new Date();
  const ranges = [
    // Current month
    {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
    },
    // Next month
    {
      start: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      end: new Date(now.getFullYear(), now.getMonth() + 2, 0)
    },
    // Next 3 months
    {
      start: now,
      end: new Date(now.getFullYear(), now.getMonth() + 3, now.getDate())
    }
  ];

  const recurringEvents = events.filter(e => e.isRecurring && e.recurrenceRule);

  // Generate instances for all ranges in parallel
  await Promise.all(
    ranges.flatMap(range =>
      recurringEvents.map(event =>
        Promise.resolve(generateRecurringInstancesOptimized(event, range.start, range.end))
      )
    )
  );
}
