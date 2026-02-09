# Calendar Performance Quick Reference

Quick reference guide for using optimized calendar functions.

## Import Statements

```typescript
// Cached services
import {
  getCachedEventCategories,
  getCachedUserPreferences,
  getPaginatedCalendarEvents
} from '@/lib/services/cached-calendar-service';

// Query optimizers
import {
  getEventsByDateRangeOptimized,
  batchGetEventsByDateRanges,
  getEventCountByCategoryOptimized,
  getUpcomingEventsOptimized
} from '@/lib/utils/calendar-query-optimizer';

// Recurring event optimizers
import {
  generateRecurringInstancesOptimized,
  getNextOccurrences,
  isOccurrenceDate,
  getOccurrenceCount
} from '@/lib/utils/recurring-event-optimizer';

// Virtual scrolling
import { VirtualEventList } from '@/components/calendar/virtual-event-list';

// Performance monitoring
import {
  calendarPerformanceMonitor,
  withPerformanceMonitoring
} from '@/lib/utils/calendar-performance-monitor';
```

## Common Operations

### 1. Get Event Categories (Cached)

```typescript
// ✅ Use this
const categories = await getCachedEventCategories();

// ❌ Don't use this
const categories = await db.calendarEventCategory.findMany();
```

### 2. Get User Preferences (Cached)

```typescript
// ✅ Use this
const preferences = await getCachedUserPreferences(userId);

// ❌ Don't use this
const preferences = await db.userCalendarPreferences.findUnique({ where: { userId } });
```

### 3. Get Events with Pagination

```typescript
// ✅ Use this
const result = await getPaginatedCalendarEvents(
  {
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31'),
    categoryIds: ['cat1', 'cat2'],
    visibleToRoles: ['STUDENT']
  },
  { page: 1, limit: 50 }
);

// Access results
const { events, total, page, limit, totalPages } = result;
```

### 4. Get Events by Date Range

```typescript
// ✅ Use this
const events = await getEventsByDateRangeOptimized(
  startDate,
  endDate,
  {
    categoryIds: ['cat1'],
    visibleToRoles: ['TEACHER'],
    limit: 100,
    offset: 0
  }
);
```

### 5. Batch Get Events for Multiple Ranges

```typescript
// ✅ Use this (1 query)
const ranges = [
  { startDate: jan1, endDate: jan31 },
  { startDate: feb1, endDate: feb28 }
];
const eventMap = await batchGetEventsByDateRanges(ranges, {
  categoryIds: ['cat1'],
  visibleToRoles: ['STUDENT']
});

// Access results
const janEvents = eventMap.get(`${jan1.toISOString()}-${jan31.toISOString()}`);

// ❌ Don't do this (N queries)
for (const range of ranges) {
  const events = await getEvents(range);
}
```

### 6. Get Event Count by Category

```typescript
// ✅ Use this (database aggregation)
const counts = await getEventCountByCategoryOptimized(
  startDate,
  endDate,
  { visibleToRoles: ['STUDENT'] }
);

// Access counts
const examCount = counts.get(examCategoryId);

// ❌ Don't do this (fetch all and count in memory)
const events = await getAllEvents();
const counts = events.reduce((acc, event) => {
  acc[event.categoryId] = (acc[event.categoryId] || 0) + 1;
  return acc;
}, {});
```

### 7. Get Upcoming Events

```typescript
// ✅ Use this (optimized for dashboards)
const upcomingEvents = await getUpcomingEventsOptimized(
  userId,
  10, // limit
  { categoryIds: ['exam', 'assignment'] }
);
```

### 8. Generate Recurring Event Instances

```typescript
// ✅ Use this (cached)
const instances = generateRecurringInstancesOptimized(
  baseEvent,
  startDate,
  endDate
);

// ❌ Don't use this (no caching)
const instances = generateRecurringInstances(baseEvent, startDate, endDate);
```

### 9. Get Next Occurrences

```typescript
// ✅ Use this for "upcoming" lists
const nextOccurrences = getNextOccurrences(baseEvent, 10);
```

### 10. Check if Date is Occurrence

```typescript
// ✅ Use this for single date checks
const isOccurrence = isOccurrenceDate(baseEvent, specificDate);
```

## UI Components

### Virtual Event List (Agenda View)

```typescript
<VirtualEventList
  events={events}
  onEventClick={handleEventClick}
  groupBy="date" // or "category"
  itemHeight={100}
  overscan={5}
  className="h-full"
/>
```

### Regular Event List (Small Lists)

```typescript
// For lists < 50 items, regular rendering is fine
{events.map(event => (
  <EventCard key={event.id} event={event} onClick={handleClick} />
))}
```

## Performance Monitoring

### Monitor an Operation

```typescript
const endTimer = calendarPerformanceMonitor.startTimer('loadEvents');
try {
  const events = await getCalendarEvents(filters);
  endTimer({ success: true, eventCount: events.length });
} catch (error) {
  endTimer({ success: false, error: error.message });
  throw error;
}
```

### Monitor with Wrapper

```typescript
const events = await withPerformanceMonitoring(
  'loadEvents',
  () => getCalendarEvents(filters),
  { userId, filterCount: Object.keys(filters).length }
);
```

### Get Performance Statistics

```typescript
// Get stats for specific operation
const stats = calendarPerformanceMonitor.getStatistics('loadEvents');
console.log(`Average: ${stats.avgDuration}ms`);
console.log(`P95: ${stats.p95Duration}ms`);

// Get all operations
const operations = calendarPerformanceMonitor.getOperations();

// Get slow operations
const slowOps = calendarPerformanceMonitor.getSlowOperations(1000, 10);

// Generate full report
console.log(calendarPerformanceMonitor.generateReport());
```

## Cache Management

### Invalidate Cache

```typescript
// Invalidate specific event
await invalidateCalendarEventCache(eventId);

// Invalidate all calendar events
await invalidateCalendarEventCache();

// Invalidate query cache
invalidateCalendarQueryCache({
  userId: 'user123',
  categoryId: 'cat1',
  sourceType: 'EXAM',
  sourceId: 'exam123'
});
```

### Warm Cache

```typescript
// Warm cache for user
await warmCalendarCache(userId);

// Warm recurring event cache
const recurringEvents = await getRecurringEvents();
await warmRecurringEventCache(recurringEvents);

// Prefetch calendar data
await prefetchCalendarDataOptimized(userId, {
  startDate: monthStart,
  endDate: monthEnd
});
```

## Best Practices Checklist

- [ ] Use cached functions for categories and preferences
- [ ] Implement pagination for lists > 50 items
- [ ] Use virtual scrolling for lists > 100 items
- [ ] Limit date ranges to visible period
- [ ] Use batch operations when fetching multiple ranges
- [ ] Use database aggregation for counts/statistics
- [ ] Use optimized recurring event functions
- [ ] Monitor performance in development
- [ ] Warm cache on application startup
- [ ] Invalidate cache on data changes

## Performance Targets

| Operation | Target | Threshold |
|-----------|--------|-----------|
| Load events | < 300ms | 500ms |
| Filter events | < 100ms | 200ms |
| Generate recurring | < 50ms | 2000ms |
| Render calendar | < 200ms | 500ms |
| API response | < 500ms | 1000ms |

## Common Mistakes

### ❌ Fetching All Events

```typescript
// DON'T
const allEvents = await db.calendarEvent.findMany();
const filtered = allEvents.filter(e => e.categoryId === categoryId);
```

### ✅ Filter at Database Level

```typescript
// DO
const events = await db.calendarEvent.findMany({
  where: { categoryId }
});
```

### ❌ Multiple Sequential Queries

```typescript
// DON'T
const categories = await getCategories();
const preferences = await getPreferences(userId);
const events = await getEvents(filters);
```

### ✅ Parallel Queries

```typescript
// DO
const [categories, preferences, events] = await Promise.all([
  getCachedEventCategories(),
  getCachedUserPreferences(userId),
  getCalendarEvents(filters)
]);
```

### ❌ Rendering Large Lists

```typescript
// DON'T (for > 100 items)
{events.map(event => <EventCard key={event.id} event={event} />)}
```

### ✅ Virtual Scrolling

```typescript
// DO (for > 100 items)
<VirtualEventList events={events} onEventClick={handleClick} />
```

### ❌ Generating All Recurring Instances

```typescript
// DON'T
const allInstances = generateRecurringInstances(
  event,
  new Date('2000-01-01'),
  new Date('2100-12-31')
);
```

### ✅ Limit to Visible Range

```typescript
// DO
const instances = generateRecurringInstancesOptimized(
  event,
  monthStart,
  monthEnd
);
```

## Debugging Performance Issues

### 1. Enable Monitoring

```typescript
calendarPerformanceMonitor.setEnabled(true);
```

### 2. Check Slow Operations

```typescript
const slowOps = calendarPerformanceMonitor.getSlowOperations(500);
slowOps.forEach(op => {
  console.log(`Slow: ${op.operation} - ${op.duration}ms`);
});
```

### 3. Check Cache Hit Rate

```typescript
// Add logging to cache functions
const cached = memoryCache.get(key);
if (cached) {
  console.log('Cache HIT:', key);
} else {
  console.log('Cache MISS:', key);
}
```

### 4. Profile Database Queries

```typescript
// Enable Prisma query logging
// In .env:
// DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=20"
// DEBUG="prisma:query"
```

### 5. Check Index Usage

```sql
-- In PostgreSQL
EXPLAIN ANALYZE
SELECT * FROM calendar_events
WHERE "startDate" >= '2025-01-01'
  AND "endDate" <= '2025-01-31'
  AND "categoryId" = 'cat123';
```

## Need Help?

- See full documentation: `docs/CALENDAR_PERFORMANCE_OPTIMIZATIONS.md`
- Check implementation: `src/lib/services/cached-calendar-service.ts`
- Review optimizers: `src/lib/utils/calendar-query-optimizer.ts`
- Virtual scrolling: `src/components/calendar/virtual-event-list.tsx`
