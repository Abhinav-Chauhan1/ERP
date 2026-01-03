# Event Visibility Service

## Overview

The Event Visibility Service provides comprehensive role-based filtering and visibility rule evaluation for calendar events. It implements the visibility logic defined in the Academic Calendar System requirements.

## Requirements Covered

- **1.2**: Restrict event access to specified user roles
- **2.1**: Display all events visible to teachers including holidays, exams, meetings, and school events
- **2.2**: Highlight exams for subjects they teach
- **2.3**: Display assignments they have created
- **3.1**: Display events relevant to student's class and section
- **3.2**: Show only exams for their enrolled subjects
- **3.3**: Display assignments assigned to their class
- **4.1**: Display events for all registered children
- **4.2**: Provide a filter to view events for specific children
- **4.3**: Highlight meetings scheduled for their children
- **4.4**: Display exams for all subjects of their children

## Visibility Rules

### Admin
- Can see **all events** without restrictions

### Teacher
Can see:
- All school-wide events (holidays, school events)
- Exams for subjects they teach
- Assignments they created
- Meetings they are invited to
- Events marked visible to teachers
- Events for classes they teach

### Student
Can see:
- All school-wide events
- Exams for their enrolled subjects
- Assignments for their class
- Events for their class/section
- Events marked visible to students

### Parent
Can see:
- All school-wide events
- All events visible to their children
- Parent-teacher meetings for their children
- Events marked visible to parents

## Main Functions

### `getEventsForUser(userId, options)`

The primary function for retrieving calendar events for a user. Automatically applies all visibility rules.

```typescript
const events = await getEventsForUser(userId, {
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31'),
  categoryIds: ['cat1', 'cat2'],
  searchTerm: 'exam'
});
```

**Parameters:**
- `userId`: The user's ID
- `options`: Optional filtering options
  - `startDate`: Filter events starting from this date
  - `endDate`: Filter events ending before this date
  - `categoryIds`: Filter by event categories
  - `searchTerm`: Search in title, description, and location

**Returns:** Array of `CalendarEvent` objects visible to the user

### `getEventsForParentChild(parentId, studentId, options)`

Gets events for a specific child of a parent. Useful for parent dashboards with child selectors.

```typescript
const childEvents = await getEventsForParentChild(parentId, studentId, {
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-31')
});
```

**Parameters:**
- `parentId`: The parent's ID
- `studentId`: The child's student ID
- `options`: Same as `getEventsForUser`

**Returns:** Array of `CalendarEvent` objects visible to the specified child

### `isEventVisibleToUser(event, userContext)`

Checks if a single event is visible to a user based on their role and relationships.

```typescript
const userContext = await getUserContext(userId);
const isVisible = await isEventVisibleToUser(event, userContext);
```

**Parameters:**
- `event`: The `CalendarEvent` object
- `userContext`: User context with role and IDs

**Returns:** `boolean` indicating visibility

### `filterEventsByVisibility(events, userContext)`

Filters an array of events based on user visibility rules.

```typescript
const userContext = await getUserContext(userId);
const visibleEvents = await filterEventsByVisibility(allEvents, userContext);
```

**Parameters:**
- `events`: Array of `CalendarEvent` objects
- `userContext`: User context with role and IDs

**Returns:** Filtered array of visible events

### `evaluateVisibilityRules(eventId, userId)`

Debugging function that explains why an event is or isn't visible to a user.

```typescript
const evaluation = await evaluateVisibilityRules(eventId, userId);
console.log(evaluation);
// {
//   isVisible: true,
//   reason: 'All visibility rules passed',
//   appliedRules: [
//     'Event visible to role: TEACHER',
//     'Teacher teaches subject for exam event'
//   ]
// }
```

**Parameters:**
- `eventId`: The event's ID
- `userId`: The user's ID

**Returns:** Object with visibility status, reason, and applied rules

## Helper Functions

### `getUserContext(userId)`

Gets the user context including role-specific IDs (teacherId, studentId, parentId).

### Role-Specific Helpers

- `getStudentClassIds(studentId)`: Gets class IDs for a student
- `getStudentSectionIds(studentId)`: Gets section IDs for a student
- `getStudentSubjectIds(studentId)`: Gets subject IDs a student is enrolled in
- `getTeacherSubjectIds(teacherId)`: Gets subject IDs a teacher teaches
- `getTeacherClassIds(teacherId)`: Gets class IDs a teacher teaches
- `getParentChildrenIds(parentId)`: Gets student IDs for a parent's children

## Usage Examples

### Example 1: Get Events for Teacher Dashboard

```typescript
import { getEventsForUser } from '@/lib/services/event-visibility-service';

// In your API route or server component
const teacherEvents = await getEventsForUser(teacherUserId, {
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
});
```

### Example 2: Get Events for Student with Category Filter

```typescript
const examEvents = await getEventsForUser(studentUserId, {
  categoryIds: ['exam-category-id'],
  startDate: new Date()
});
```

### Example 3: Parent Viewing Specific Child's Events

```typescript
const childEvents = await getEventsForParentChild(
  parentId,
  selectedChildId,
  {
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
  }
);
```

### Example 4: Check Event Visibility

```typescript
const userContext = await getUserContext(userId);
const event = await prisma.calendarEvent.findUnique({
  where: { id: eventId }
});

if (event) {
  const isVisible = await isEventVisibleToUser(event, userContext);
  if (isVisible) {
    // Show event details
  } else {
    // Show access denied
  }
}
```

### Example 5: Debug Visibility Rules

```typescript
const evaluation = await evaluateVisibilityRules(eventId, userId);
console.log('Is Visible:', evaluation.isVisible);
console.log('Reason:', evaluation.reason);
console.log('Applied Rules:', evaluation.appliedRules);
```

## Integration with Calendar Service

The Event Visibility Service works alongside the Calendar Service:

```typescript
import { getCalendarEvents } from '@/lib/services/calendar-service';
import { filterEventsByVisibility, getUserContext } from '@/lib/services/event-visibility-service';

// Get all events (admin operation)
const allEvents = await getCalendarEvents({
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
});

// Filter for specific user
const userContext = await getUserContext(userId);
const userEvents = await filterEventsByVisibility(allEvents, userContext);
```

However, it's recommended to use `getEventsForUser()` directly as it's more efficient.

## Performance Considerations

1. **Caching**: Consider caching user context and relationship data for frequently accessed users
2. **Batch Operations**: When checking visibility for multiple events, use `filterEventsByVisibility()` instead of calling `isEventVisibleToUser()` in a loop
3. **Database Queries**: The service makes multiple database queries for relationship checks. Consider using database views or materialized queries for production use
4. **Indexing**: Ensure proper indexes exist on:
   - `ClassEnrollment(studentId, status)`
   - `SubjectTeacher(teacherId)`
   - `ClassTeacher(teacherId)`
   - `StudentParent(parentId)`
   - `AssignmentClass(assignmentId)`

## Error Handling

The service throws errors in the following cases:
- User not found: `throw new Error('User not found')`
- Parent-child relationship not found: `throw new Error('Parent-child relationship not found')`
- Student not found: `throw new Error('Student not found')`

Always wrap service calls in try-catch blocks:

```typescript
try {
  const events = await getEventsForUser(userId);
} catch (error) {
  console.error('Failed to get events:', error);
  // Handle error appropriately
}
```

## Testing

The service includes a debugging function `evaluateVisibilityRules()` that can be used for testing visibility logic:

```typescript
// Test visibility for different user roles
const testCases = [
  { userId: adminUserId, eventId: event1Id },
  { userId: teacherUserId, eventId: event1Id },
  { userId: studentUserId, eventId: event1Id },
  { userId: parentUserId, eventId: event1Id }
];

for (const testCase of testCases) {
  const result = await evaluateVisibilityRules(testCase.eventId, testCase.userId);
  console.log(`User ${testCase.userId}:`, result);
}
```

## Future Enhancements

1. **Caching Layer**: Add Redis caching for user context and relationships
2. **Batch Visibility Checks**: Optimize for checking visibility of many events at once
3. **Permission Overrides**: Allow admins to grant special visibility permissions
4. **Visibility Analytics**: Track which events are most viewed by which roles
5. **Custom Visibility Rules**: Allow schools to define custom visibility rules
