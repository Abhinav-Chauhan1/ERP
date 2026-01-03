# Event Category Service Documentation

## Overview

The Event Category Service provides CRUD operations for managing calendar event categories. Categories are used to classify and visually distinguish different types of events in the calendar system.

## Features

- **Category Management**: Create, read, update, and delete event categories
- **Unique Names**: Enforces unique category names (case-insensitive)
- **Color Validation**: Validates hex color codes for visual consistency
- **Event Reassignment**: Requires reassignment of events when deleting categories
- **Ordering**: Support for custom category display order
- **Search**: Search categories by name or description

## Requirements Implemented

- **Requirement 8.1**: Requires a unique category name and color code for each category

## API Reference

### Category Creation

```typescript
import { createEventCategory, CreateEventCategoryInput } from '@/lib/services/event-category-service';

const categoryData: CreateEventCategoryInput = {
  name: 'Holiday',
  description: 'School holidays and breaks',
  color: '#EF4444',
  icon: 'calendar-off',
  isActive: true,
  order: 0
};

const category = await createEventCategory(categoryData);
```

### Get Category by ID

```typescript
import { getEventCategoryById } from '@/lib/services/event-category-service';

const category = await getEventCategoryById('cat_123');

// Includes event count
console.log(`Category has ${category._count.events} events`);
```

### Get All Categories

```typescript
import { getAllEventCategories } from '@/lib/services/event-category-service';

// Get only active categories
const activeCategories = await getAllEventCategories();

// Get all categories including inactive
const allCategories = await getAllEventCategories(true);
```

### Update Category

```typescript
import { updateEventCategory, UpdateEventCategoryInput } from '@/lib/services/event-category-service';

const updateData: UpdateEventCategoryInput = {
  name: 'School Holiday',
  color: '#DC2626',
  description: 'Updated description'
};

const updated = await updateEventCategory('cat_123', updateData);
```

### Delete Category

```typescript
import { deleteEventCategory } from '@/lib/services/event-category-service';

// Delete category without events
await deleteEventCategory('cat_123');

// Delete category with events (requires replacement)
await deleteEventCategory('cat_123', 'cat_replacement_456');
```

### Reorder Categories

```typescript
import { reorderEventCategories } from '@/lib/services/event-category-service';

const newOrder = [
  { id: 'cat_1', order: 0 },
  { id: 'cat_2', order: 1 },
  { id: 'cat_3', order: 2 }
];

await reorderEventCategories(newOrder);
```

### Search Categories

```typescript
import { searchEventCategories } from '@/lib/services/event-category-service';

const results = await searchEventCategories('exam');
```

## Default Categories

The system seeds the following default categories:

| Name | Color | Icon | Description |
|------|-------|------|-------------|
| Holiday | #EF4444 | calendar-off | School holidays and breaks |
| Exam | #F59E0B | file-text | Examinations and tests |
| Assignment | #3B82F6 | clipboard | Assignment deadlines |
| Meeting | #8B5CF6 | users | Parent-teacher meetings |
| School Event | #10B981 | flag | School-wide events |
| Sports Event | #EC4899 | trophy | Sports activities |

## Validation Rules

### Required Fields (Creation)
- `name`: Non-empty string, must be unique (case-insensitive)
- `color`: Valid hex color code (e.g., #3B82F6 or #F00)

### Optional Fields
- `description`: Text description of the category
- `icon`: Icon name from lucide-react library
- `isActive`: Boolean (default: true)
- `order`: Display order (default: 0)

### Color Format

Valid color formats:
- 6-digit hex: `#3B82F6`, `#EF4444`
- 3-digit hex: `#F00`, `#0F0`

Invalid formats:
- Without hash: `3B82F6`
- Color names: `red`, `blue`
- RGB format: `rgb(59, 130, 246)`

### Validation Errors

The service throws `CategoryValidationError` for:
- Missing required fields (name, color)
- Invalid color format
- Duplicate category names
- Deleting category with events without replacement
- Non-existent category or replacement category

## Error Handling

```typescript
import { CategoryValidationError } from '@/lib/services/event-category-service';

try {
  const category = await createEventCategory(categoryData);
} catch (error) {
  if (error instanceof CategoryValidationError) {
    console.error('Validation failed:', error.message);
    // Handle validation error
  } else {
    console.error('Unexpected error:', error);
    // Handle other errors
  }
}
```

## Common Use Cases

### Creating a Custom Category

```typescript
const customCategory: CreateEventCategoryInput = {
  name: 'Field Trip',
  description: 'Educational field trips and excursions',
  color: '#06B6D4',
  icon: 'bus',
  isActive: true,
  order: 6
};

const category = await createEventCategory(customCategory);
```

### Updating Category Color

```typescript
// Update category color to match school branding
await updateEventCategory('cat_exam', {
  color: '#1E40AF' // School's primary color
});
```

### Deactivating a Category

```typescript
// Deactivate category without deleting
await updateEventCategory('cat_sports', {
  isActive: false
});
```

### Merging Categories

```typescript
// Merge "Test" category into "Exam" category
try {
  await deleteEventCategory('cat_test', 'cat_exam');
  console.log('All test events moved to exam category');
} catch (error) {
  console.error('Failed to merge categories:', error);
}
```

### Reordering for Display

```typescript
// Set custom display order
const displayOrder = [
  { id: 'cat_holiday', order: 0 },    // Show holidays first
  { id: 'cat_exam', order: 1 },       // Then exams
  { id: 'cat_assignment', order: 2 }, // Then assignments
  { id: 'cat_meeting', order: 3 },    // Then meetings
  { id: 'cat_school_event', order: 4 },
  { id: 'cat_sports', order: 5 }
];

await reorderEventCategories(displayOrder);
```

## Integration with Calendar Service

Categories are used by the Calendar Service to classify events:

```typescript
import { createCalendarEvent } from '@/lib/services/calendar-service';
import { getAllEventCategories } from '@/lib/services/event-category-service';

// Get exam category
const categories = await getAllEventCategories();
const examCategory = categories.find(c => c.name === 'Exam');

// Create exam event with category
const examEvent = await createCalendarEvent({
  title: 'Math Final Exam',
  categoryId: examCategory.id,
  startDate: new Date('2025-06-15T09:00:00'),
  endDate: new Date('2025-06-15T11:00:00'),
  visibleToRoles: ['STUDENT', 'TEACHER'],
  createdBy: 'user_admin_123'
});
```

## UI Integration

### Category Color Display

```typescript
// Display event with category color
const event = await getCalendarEventById('event_123');

<div 
  className="event-card"
  style={{ borderLeftColor: event.category.color }}
>
  <span 
    className="category-badge"
    style={{ backgroundColor: event.category.color }}
  >
    {event.category.name}
  </span>
  <h3>{event.title}</h3>
</div>
```

### Category Filter

```typescript
// Create category filter UI
const categories = await getAllEventCategories();

<div className="category-filters">
  {categories.map(category => (
    <label key={category.id}>
      <input 
        type="checkbox" 
        value={category.id}
        onChange={handleCategoryToggle}
      />
      <span 
        className="color-indicator"
        style={{ backgroundColor: category.color }}
      />
      {category.name}
    </label>
  ))}
</div>
```

### Category Management UI

```typescript
// Admin category management
const categories = await getAllEventCategories(true);

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Color</th>
      <th>Events</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {categories.map(category => (
      <tr key={category.id}>
        <td>{category.name}</td>
        <td>
          <div 
            className="color-swatch"
            style={{ backgroundColor: category.color }}
          />
          {category.color}
        </td>
        <td>{category._count.events}</td>
        <td>{category.isActive ? 'Active' : 'Inactive'}</td>
        <td>
          <button onClick={() => editCategory(category)}>Edit</button>
          <button onClick={() => deleteCategory(category)}>Delete</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

## Performance Considerations

### Caching
Categories change infrequently, so they're good candidates for caching:

```typescript
// Cache categories for 1 hour
const CACHE_TTL = 60 * 60 * 1000;
let cachedCategories: CalendarEventCategory[] | null = null;
let cacheTime: number = 0;

async function getCachedCategories() {
  const now = Date.now();
  if (cachedCategories && (now - cacheTime) < CACHE_TTL) {
    return cachedCategories;
  }
  
  cachedCategories = await getAllEventCategories();
  cacheTime = now;
  return cachedCategories;
}
```

### Batch Operations
When creating multiple categories, use transactions:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

await prisma.$transaction(async (tx) => {
  for (const categoryData of bulkCategories) {
    await createEventCategory(categoryData);
  }
});
```

## Testing

The service includes comprehensive unit tests covering:
- Category validation (required fields, color format)
- Unique name enforcement
- Color format validation (6-digit, 3-digit hex)
- Update validation
- Partial updates

Run tests:
```bash
npm run test:run -- src/lib/services/__tests__/event-category-service.test.ts
```

## Related Services

- **CalendarService**: Uses categories to classify events
- **EventVisibilityService**: May filter events by category (to be implemented)
- **ReportService**: May generate reports grouped by category (to be implemented)
