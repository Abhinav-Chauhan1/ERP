# Calendar Service Documentation

## Overview

The Calendar Service provides comprehensive CRUD operations for managing calendar events in the Academic Calendar System. It includes event validation, recurrence rule parsing, and instance generation for recurring events.

## Features

- **Event Validation**: Validates all required fields including title, date, category, and visibility settings
- **Recurrence Support**: Parses iCal RRULE format and generates recurring event instances
- **Flexible Filtering**: Query events by date range, category, role, class, section, and more
- **Update Modes**: Support for updating single instances, future instances, or all instances of recurring events
- **Delete Modes**: Support for deleting single instances, future instances, or all instances of recurring events
- **Search**: Full-text search across event title, description, and location

## Requirements Implemented

- **Requirement 1.1**: Validates all required fields including title, date, time, category, and description
- **Requirement 1.3**: Generates all event instances based on the recurrence pattern (daily, weekly, monthly, yearly)

## API Reference

### Event Creation

```typescript
import { createCalendarEvent, CreateCalendarEventInput } from '@/lib/services/calendar-service';

const eventData: CreateCalendarEventInput = {
  title: 'Math Exam',
  description: 'Final exam for Mathematics',
  categoryId: 'cat_exam_123',
  startDate: new Date('2025-06-15T09:00:00'),
  endDate: new Date('2025-06-15T11:00:00'),
  isAllDay: false,
  location: 'Room 101',
  visibleToRoles: ['STUDENT', 'TEACHER', 'PARENT'],
  visibleToClasses: ['class_10a'],
  visibleToSections: ['section_a'],
  sourceType: 'EXAM',
  sourceId: 'exam_123',
  createdBy: 'user_admin_123'
};

const event = await createCalendarEvent(eventData);
```

### Recurring Event Creation

```typescript
const recurringEventData: CreateCalendarEventInput = {
  title: 'Weekly Staff Meeting',
  description: 'Regular staff meeting every Monday',
  categoryId: 'cat_meeting_123',
  startDate: new Date('2025-01-06T10:00:00'),
  endDate: new Date('2025-01-06T11:00:00'),
  isAllDay: false,
  location: 'Conference Room',
  visibleToRoles: ['ADMIN', 'TEACHER'],
  isRecurring: true,
  recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO;UNTIL=20251231',
  exceptionDates: [new Date('2025-12-25')], // Skip Christmas
  createdBy: 'user_admin_123'
};

const recurringEvent = await createCalendarEvent(recurringEventData);
```

### Event Retrieval

```typescript
import { getCalendarEvents } from '@/lib/services/calendar-service';

// Get events for a specific date range
const events = await getCalendarEvents({
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-31'),
  categoryIds: ['cat_exam_123', 'cat_assignment_123'],
  visibleToRoles: ['STUDENT']
});

// Get events for a specific class
const classEvents = await getCalendarEvents({
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31'),
  classIds: ['class_10a']
});
```

### Event Updates

```typescript
import { updateCalendarEvent, UpdateCalendarEventInput } from '@/lib/services/calendar-service';

// Update a single event
const updateData: UpdateCalendarEventInput = {
  title: 'Updated Math Exam',
  startDate: new Date('2025-06-16T09:00:00'),
  endDate: new Date('2025-06-16T11:00:00')
};

const updated = await updateCalendarEvent('event_123', updateData, 'single');

// Update all instances of a recurring event
const updatedAll = await updateCalendarEvent('event_123', updateData, 'all');

// Update this and future instances
const updatedFuture = await updateCalendarEvent('event_123', updateData, 'future');
```

### Event Deletion

```typescript
import { deleteCalendarEvent } from '@/lib/services/calendar-service';

// Delete a single event
await deleteCalendarEvent('event_123', 'single');

// Delete all instances of a recurring event
await deleteCalendarEvent('event_123', 'all');

// Delete this and future instances
await deleteCalendarEvent('event_123', 'future');
```

### Search Events

```typescript
import { searchCalendarEvents } from '@/lib/services/calendar-service';

// Search for events containing "exam"
const results = await searchCalendarEvents('exam', {
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31'),
  categoryIds: ['cat_exam_123']
});
```

### Generate Recurring Instances

```typescript
import { generateRecurringInstances } from '@/lib/services/calendar-service';

// Generate instances for display in calendar view
const instances = generateRecurringInstances(
  recurringEvent,
  new Date('2025-01-01'),
  new Date('2025-01-31')
);

// Each instance has startDate and endDate
instances.forEach(instance => {
  console.log(`Event on ${instance.startDate} to ${instance.endDate}`);
});
```

## Recurrence Rule Format

The service uses iCal RRULE format for recurrence patterns. Here are common examples:

### Daily Recurrence
```
FREQ=DAILY
FREQ=DAILY;UNTIL=20251231
FREQ=DAILY;COUNT=10
```

### Weekly Recurrence
```
FREQ=WEEKLY;BYDAY=MO,WE,FR
FREQ=WEEKLY;BYDAY=MO;UNTIL=20251231
```

### Monthly Recurrence
```
FREQ=MONTHLY;BYMONTHDAY=15
FREQ=MONTHLY;BYDAY=1MO (First Monday of each month)
```

### Yearly Recurrence
```
FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1 (New Year's Day)
FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25 (Christmas)
```

## Validation Rules

### Required Fields (Creation)
- `title`: Non-empty string
- `categoryId`: Valid category ID
- `startDate`: Valid date
- `endDate`: Valid date (must be after startDate)
- `visibleToRoles`: Non-empty array of roles
- `createdBy`: User ID

### Optional Fields
- `description`: Text description
- `location`: Event location
- `isAllDay`: Boolean (default: false)
- `visibleToClasses`: Array of class IDs
- `visibleToSections`: Array of section IDs
- `sourceType`: Integration source type
- `sourceId`: Source entity ID
- `isRecurring`: Boolean (default: false)
- `recurrenceRule`: iCal RRULE string
- `exceptionDates`: Array of dates to skip
- `attachments`: Array of file URLs

### Validation Errors

The service throws `ValidationError` for:
- Missing required fields
- Invalid date ranges (end before start)
- Invalid recurrence rules
- Non-existent categories

## Error Handling

```typescript
import { ValidationError } from '@/lib/services/calendar-service';

try {
  const event = await createCalendarEvent(eventData);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
    // Handle validation error
  } else {
    console.error('Unexpected error:', error);
    // Handle other errors
  }
}
```

## Integration with Other Modules

The Calendar Service supports automatic event creation from other ERP modules:

### Exam Integration
```typescript
const examEvent: CreateCalendarEventInput = {
  title: `${exam.title} - ${subject.name}`,
  categoryId: 'cat_exam',
  startDate: exam.date,
  endDate: exam.endTime,
  sourceType: 'EXAM',
  sourceId: exam.id,
  visibleToRoles: ['STUDENT', 'TEACHER', 'PARENT'],
  visibleToClasses: [exam.classId],
  createdBy: exam.createdBy
};
```

### Assignment Integration
```typescript
const assignmentEvent: CreateCalendarEventInput = {
  title: assignment.title,
  categoryId: 'cat_assignment',
  startDate: assignment.dueDate,
  endDate: assignment.dueDate,
  isAllDay: true,
  sourceType: 'ASSIGNMENT',
  sourceId: assignment.id,
  visibleToRoles: ['STUDENT', 'TEACHER', 'PARENT'],
  visibleToClasses: [assignment.classId],
  createdBy: assignment.teacherId
};
```

### Meeting Integration
```typescript
const meetingEvent: CreateCalendarEventInput = {
  title: `Parent-Teacher Meeting: ${student.name}`,
  categoryId: 'cat_meeting',
  startDate: meeting.startTime,
  endDate: meeting.endTime,
  location: meeting.location,
  sourceType: 'MEETING',
  sourceId: meeting.id,
  visibleToRoles: ['TEACHER', 'PARENT'],
  createdBy: meeting.createdBy
};
```

## Performance Considerations

### Recurring Event Generation
- Instances are generated on-demand, not stored in database
- Use reasonable date ranges to avoid generating too many instances
- Consider caching generated instances for frequently accessed date ranges

### Query Optimization
- Use specific filters to reduce result set size
- Leverage database indexes on startDate, endDate, categoryId
- Limit date range queries to 3-6 months for optimal performance

### Batch Operations
For bulk event creation, consider using transactions:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

await prisma.$transaction(async (tx) => {
  for (const eventData of bulkEventData) {
    await createCalendarEvent(eventData);
  }
});
```

## Testing

The service includes comprehensive unit tests covering:
- Event validation (required fields, date ranges, recurrence rules)
- Recurring instance generation (weekly, daily, monthly patterns)
- Exception date handling
- Event duration preservation in recurring instances

Run tests:
```bash
npm run test:run -- src/lib/services/__tests__/calendar-service.test.ts
```

## Related Services

- **EventCategoryService**: Manages event categories and colors
- **EventVisibilityService**: Handles role-based event filtering (to be implemented)
- **EventReminderService**: Manages event reminders (to be implemented)
- **EventNoteService**: Manages teacher notes on events (to be implemented)
