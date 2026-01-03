# Calendar Event Sorting Guide

## Overview

The Academic Calendar System includes comprehensive sorting functionality that allows users to organize calendar events by various criteria. This guide explains how to use the sorting features in both the API and the UI.

**Requirements:** 3.4 - Sort events chronologically with nearest events first

## Sorting Options

### Available Sort Fields

1. **startDate** (default) - Sort by event start date
2. **endDate** - Sort by event end date
3. **title** - Sort alphabetically by event title
4. **createdAt** - Sort by event creation date

### Sort Orders

- **asc** (ascending) - Default order, earliest/A-Z first
- **desc** (descending) - Reverse order, latest/Z-A first

## API Usage

### GET /api/calendar/events

Add sorting parameters to the query string:

```
GET /api/calendar/events?sortBy=startDate&sortOrder=asc
```

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| sortBy | string | Field to sort by (startDate, endDate, title, createdAt) | startDate |
| sortOrder | string | Sort order (asc, desc) | asc |

#### Examples

**Sort by start date (nearest events first):**
```
GET /api/calendar/events?sortBy=startDate&sortOrder=asc
```

**Sort by title alphabetically:**
```
GET /api/calendar/events?sortBy=title&sortOrder=asc
```

**Sort by creation date (newest first):**
```
GET /api/calendar/events?sortBy=createdAt&sortOrder=desc
```

**Combine with other filters:**
```
GET /api/calendar/events?startDate=2025-01-01&endDate=2025-12-31&sortBy=startDate&sortOrder=asc
```

#### Response Format

```json
{
  "events": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  },
  "sorting": {
    "field": "startDate",
    "order": "asc"
  }
}
```

## Programmatic Usage

### Using the Sorting Utility

```typescript
import { sortEvents, sortEventsByDate } from '@/lib/utils/calendar-sorting';

// Sort events by start date
const sortedEvents = sortEventsByDate(events, 'asc');

// Sort with custom options
const sortedEvents = sortEvents(events, {
  field: 'title',
  order: 'desc'
});
```

### Using the Calendar Service

```typescript
import { getCalendarEvents } from '@/lib/services/calendar-service';

// Get events with sorting
const events = await getCalendarEvents(
  {
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31')
  },
  {
    field: 'startDate',
    order: 'asc'
  }
);
```

### Using the Event Visibility Service

```typescript
import { getEventsForUser } from '@/lib/services/event-visibility-service';

// Get events for a user with sorting
const events = await getEventsForUser(userId, {
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31'),
  sortOptions: {
    field: 'startDate',
    order: 'asc'
  }
});
```

## Utility Functions

### sortEventsByDate

Sorts events chronologically by start date.

```typescript
sortEventsByDate(events: CalendarEvent[], order: 'asc' | 'desc'): CalendarEvent[]
```

### sortEventsByTitle

Sorts events alphabetically by title (case-insensitive).

```typescript
sortEventsByTitle(events: CalendarEvent[], order: 'asc' | 'desc'): CalendarEvent[]
```

### sortEventsByEndDate

Sorts events by end date.

```typescript
sortEventsByEndDate(events: CalendarEvent[], order: 'asc' | 'desc'): CalendarEvent[]
```

### sortEventsByCreatedAt

Sorts events by creation timestamp.

```typescript
sortEventsByCreatedAt(events: CalendarEvent[], order: 'asc' | 'desc'): CalendarEvent[]
```

### sortEvents

Generic sorting function supporting all sort fields.

```typescript
sortEvents(
  events: CalendarEvent[],
  options: { field: SortField; order: SortOrder }
): CalendarEvent[]
```

### parseSortOptions

Parses and validates sort options from query parameters.

```typescript
parseSortOptions(
  sortBy?: string | null,
  sortOrder?: string | null
): SortOptions
```

Returns default options (`{ field: 'startDate', order: 'asc' }`) if invalid.

### isValidSortOptions

Validates sort field and order.

```typescript
isValidSortOptions(field: string, order: string): boolean
```

## Default Behavior

When no sorting parameters are provided:
- **Default field:** startDate
- **Default order:** asc (ascending)
- **Result:** Events are sorted chronologically with nearest events first

This ensures that Requirement 3.4 is met by default.

## Implementation Details

### Database Queries

All database queries include a default `orderBy: { startDate: 'asc' }` clause. Custom sorting is applied in-memory after fetching results, allowing for flexible sorting without complex database queries.

### Performance Considerations

- Sorting is performed in-memory on the application server
- For large result sets, consider using pagination to limit the number of events sorted
- Default database ordering ensures consistent results even without custom sorting

### Immutability

All sorting functions create a new array and do not mutate the original event array. This ensures predictable behavior and prevents side effects.

## Testing

The sorting functionality includes comprehensive unit tests covering:
- Ascending and descending order for all sort fields
- Case-insensitive title sorting
- Handling of events with identical values
- Array immutability
- Validation of sort options
- Parsing of query parameters

Run tests with:
```bash
npm test -- src/lib/utils/__tests__/calendar-sorting.test.ts
```

## Common Use Cases

### Student Dashboard - Upcoming Events

Show nearest events first:
```typescript
const upcomingEvents = await getEventsForUser(studentId, {
  startDate: new Date(),
  sortOptions: { field: 'startDate', order: 'asc' }
});
```

### Admin Dashboard - Recently Created Events

Show newest events first:
```typescript
const recentEvents = await getEventsForUser(adminId, {
  sortOptions: { field: 'createdAt', order: 'desc' }
});
```

### Calendar View - Alphabetical List

Show events alphabetically:
```typescript
const alphabeticalEvents = await getEventsForUser(userId, {
  sortOptions: { field: 'title', order: 'asc' }
});
```

## Error Handling

Invalid sort parameters are handled gracefully:
- Invalid field names default to 'startDate'
- Invalid order values default to 'asc'
- No errors are thrown for invalid parameters

This ensures the API always returns sorted results even with malformed requests.

## Future Enhancements

Potential improvements for future versions:
- Multi-field sorting (e.g., sort by date, then by title)
- Custom sort functions for complex sorting logic
- Database-level sorting for improved performance with large datasets
- User-specific default sort preferences
