# Calendar Search and Filter Service

## Overview

The Calendar Search and Filter Service provides comprehensive search and filtering functionality for calendar events. It supports text search across multiple fields, category filtering, date range filtering, and multi-filter combination with AND logic.

## Requirements Coverage

- **Requirement 7.1**: Search across title, description, location, and category name
- **Requirement 7.2**: Filter by event categories
- **Requirement 7.3**: Filter by date range
- **Requirement 7.4**: Combine multiple filters with AND logic
- **Requirement 7.5**: Clear filters and restore default view

## Core Functions

### `searchAndFilterEvents(filters: CalendarEventFilters): Promise<CalendarEventSearchResult>`

Main function that applies all filters with AND logic.

**Parameters:**
- `filters.searchTerm` - Text to search across title, description, location, and category name (case-insensitive)
- `filters.categoryIds` - Array of category IDs to filter by
- `filters.startDate` - Start of date range (events ending on or after this date)
- `filters.endDate` - End of date range (events starting on or before this date)
- `filters.visibleToRoles` - Array of roles for visibility filtering
- `filters.visibleToClasses` - Array of class IDs for visibility filtering
- `filters.visibleToSections` - Array of section IDs for visibility filtering
- `filters.skip` - Number of records to skip (pagination)
- `filters.take` - Number of records to return (pagination, default: 100)

**Returns:**
```typescript
{
  events: CalendarEvent[],      // Filtered events
  totalCount: number,            // Total matching events
  hasMore: boolean               // Whether more results exist
}
```

**Example:**
```typescript
const result = await searchAndFilterEvents({
  searchTerm: 'math',
  categoryIds: ['cat_exam', 'cat_assignment'],
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31'),
  visibleToRoles: ['STUDENT'],
  skip: 0,
  take: 50
});

console.log(`Found ${result.totalCount} events`);
console.log(`Showing ${result.events.length} events`);
console.log(`Has more: ${result.hasMore}`);
```

### `searchEvents(searchTerm: string, visibilityFilters?): Promise<CalendarEvent[]>`

Search events by text only (Requirement 7.1).

**Example:**
```typescript
const events = await searchEvents('exam', {
  visibleToRoles: ['STUDENT']
});
```

### `filterEventsByCategory(categoryIds: string[], visibilityFilters?): Promise<CalendarEvent[]>`

Filter events by category only (Requirement 7.2).

**Example:**
```typescript
const examEvents = await filterEventsByCategory(['cat_exam'], {
  visibleToRoles: ['STUDENT']
});
```

### `filterEventsByDateRange(startDate: Date, endDate: Date, visibilityFilters?): Promise<CalendarEvent[]>`

Filter events by date range only (Requirement 7.3).

**Example:**
```typescript
const januaryEvents = await filterEventsByDateRange(
  new Date('2025-01-01'),
  new Date('2025-01-31'),
  { visibleToRoles: ['STUDENT'] }
);
```

### `combineFilters(filters: CalendarEventFilters): Promise<CalendarEventSearchResult>`

Explicitly combine multiple filters with AND logic (Requirement 7.4).

**Example:**
```typescript
const result = await combineFilters({
  searchTerm: 'final',
  categoryIds: ['cat_exam'],
  startDate: new Date('2025-06-01'),
  endDate: new Date('2025-06-30')
});
```

### `getDefaultCalendarView(visibilityFilters?): Promise<CalendarEvent[]>`

Get all events without filters (Requirement 7.5).

**Example:**
```typescript
const allEvents = await getDefaultCalendarView({
  visibleToRoles: ['STUDENT'],
  visibleToClasses: ['class_10a']
});
```

### `clearFiltersAndGetDefaultView(visibilityFilters?): Promise<CalendarEvent[]>`

Explicitly clear all filters and return to default view (Requirement 7.5).

**Example:**
```typescript
const defaultView = await clearFiltersAndGetDefaultView({
  visibleToRoles: ['TEACHER']
});
```

### `validateFilters(filters: CalendarEventFilters): { valid: boolean; errors: string[] }`

Validate filter inputs before applying them.

**Example:**
```typescript
const validation = validateFilters({
  startDate: new Date('2025-12-31'),
  endDate: new Date('2025-01-01')
});

if (!validation.valid) {
  console.error('Invalid filters:', validation.errors);
  // Output: ['End date must be after start date']
}
```

## Filter Logic

### AND Logic (Requirement 7.4)

All filters are combined with AND logic. An event must match ALL specified filters to be included in results:

```typescript
// This will return events that:
// - Contain "math" in title/description/location/category name
// - AND are in the "Exam" category
// - AND occur in January 2025
// - AND are visible to students
const result = await searchAndFilterEvents({
  searchTerm: 'math',
  categoryIds: ['cat_exam'],
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-31'),
  visibleToRoles: ['STUDENT']
});
```

### Search Logic (Requirement 7.1)

Search terms are matched against:
- Event title (case-insensitive)
- Event description (case-insensitive)
- Event location (case-insensitive)
- Event category name (case-insensitive)

An event matches if the search term appears in ANY of these fields (OR logic within search).

### Date Range Logic (Requirement 7.3)

Date range filtering includes events that overlap with the specified range:
- Event ends on or after `startDate`
- Event starts on or before `endDate`

This ensures multi-day events are included if they overlap with the range.

### Category Filtering (Requirement 7.2)

Events are included if their `categoryId` is in the `categoryIds` array.

### Visibility Filtering

Visibility filters are always applied to ensure users only see events they have access to:
- `visibleToRoles`: Event must be visible to at least one of the specified roles
- `visibleToClasses`: Event must be visible to at least one of the specified classes (or all classes)
- `visibleToSections`: Event must be visible to at least one of the specified sections (or all sections)

## Usage Patterns

### Basic Search
```typescript
// Search for all events containing "exam"
const events = await searchEvents('exam');
```

### Category Filter
```typescript
// Get all exam events
const exams = await filterEventsByCategory(['cat_exam']);
```

### Date Range Filter
```typescript
// Get events in the next 30 days
const upcoming = await filterEventsByDateRange(
  new Date(),
  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
);
```

### Combined Filters
```typescript
// Search for math exams in June for students in class 10A
const result = await searchAndFilterEvents({
  searchTerm: 'math',
  categoryIds: ['cat_exam'],
  startDate: new Date('2025-06-01'),
  endDate: new Date('2025-06-30'),
  visibleToRoles: ['STUDENT'],
  visibleToClasses: ['class_10a']
});
```

### Pagination
```typescript
// Get first page (50 events)
const page1 = await searchAndFilterEvents({
  searchTerm: 'exam',
  skip: 0,
  take: 50
});

// Get second page
const page2 = await searchAndFilterEvents({
  searchTerm: 'exam',
  skip: 50,
  take: 50
});
```

### Clear Filters
```typescript
// User clicks "Clear Filters" button
const allEvents = await clearFiltersAndGetDefaultView({
  visibleToRoles: ['STUDENT']
});
```

## API Integration

This service is designed to be used in API routes:

```typescript
// app/api/calendar/events/route.ts
import { searchAndFilterEvents, validateFilters } from '@/lib/services/calendar-search-filter-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const filters = {
    searchTerm: searchParams.get('search') || undefined,
    categoryIds: searchParams.getAll('category'),
    startDate: searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate')!) 
      : undefined,
    endDate: searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate')!) 
      : undefined,
    skip: parseInt(searchParams.get('skip') || '0'),
    take: parseInt(searchParams.get('take') || '50')
  };
  
  // Validate filters
  const validation = validateFilters(filters);
  if (!validation.valid) {
    return Response.json(
      { error: 'Invalid filters', details: validation.errors },
      { status: 400 }
    );
  }
  
  // Apply filters
  const result = await searchAndFilterEvents(filters);
  
  return Response.json(result);
}
```

## Performance Considerations

- **Indexing**: Ensure database indexes exist on:
  - `startDate` and `endDate` for date range queries
  - `categoryId` for category filtering
  - `visibleToRoles`, `visibleToClasses`, `visibleToSections` for visibility filtering
  
- **Pagination**: Always use `skip` and `take` for large result sets

- **Search Optimization**: Text search uses case-insensitive contains, which may be slow on large datasets. Consider full-text search indexes for production.

## Error Handling

The service validates inputs and returns descriptive errors:

```typescript
const validation = validateFilters({
  startDate: new Date('2025-12-31'),
  endDate: new Date('2025-01-01'),
  skip: -10,
  take: 0
});

// validation.errors will contain:
// - "End date must be after start date"
// - "Skip value must be non-negative"
// - "Take value must be positive"
```

## Testing

See `calendar-search-filter-service.test.ts` for comprehensive test coverage including:
- Text search across all fields
- Category filtering
- Date range filtering
- Multi-filter combination with AND logic
- Filter clearing
- Edge cases and validation

## Related Services

- **CalendarService**: Core CRUD operations for events
- **EventVisibilityService**: Role-based event visibility
- **EventCategoryService**: Category management
