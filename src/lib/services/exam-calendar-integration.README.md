# Exam Calendar Integration

This module provides automatic integration between the Exam module and the Academic Calendar System. When exams are created, updated, or deleted, corresponding calendar events are automatically managed.

## Features

### Automatic Event Creation (Requirement 10.1)
When an exam is created, a calendar event is automatically generated with:
- **Title**: `{ExamType}: {Subject}` (e.g., "Mid-term: Mathematics")
- **Description**: Exam title, instructions, total marks, and passing marks
- **Date/Time**: Exam start and end times
- **Category**: "Exam" category
- **Visibility**: Visible to Admin, Teacher, Student, and Parent roles
- **Source Tracking**: Linked to the exam via `sourceType: EXAM` and `sourceId`

### Event Synchronization (Requirement 10.4)
When an exam is updated, the corresponding calendar event is automatically updated to reflect:
- Changes to exam title
- Changes to exam date/time
- Changes to exam instructions
- Changes to marks configuration

### Event Deletion (Requirement 10.5)
When an exam is deleted, the associated calendar event is automatically removed from all user calendars.

## Integration Points

### 1. Admin Exam Actions (`src/lib/actions/examsActions.ts`)
- `createExam()`: Automatically creates calendar event after exam creation
- `updateExam()`: Automatically updates calendar event after exam modification
- `deleteExam()`: Automatically deletes calendar event before exam deletion

### 2. Teacher Exam Actions (`src/lib/actions/teacherExamsActions.ts`)
- `createExam()`: Automatically creates calendar event after exam creation

## API Functions

### `createCalendarEventFromExam(exam, createdBy)`
Creates a calendar event from an exam object.

**Parameters:**
- `exam`: Exam object with relations (subject, examType, term)
- `createdBy`: User ID of the creator

**Returns:** `Promise<void>`

**Example:**
```typescript
await createCalendarEventFromExam(exam, userId);
```

### `updateCalendarEventFromExam(exam)`
Updates the calendar event associated with an exam.

**Parameters:**
- `exam`: Updated exam object with relations

**Returns:** `Promise<void>`

**Example:**
```typescript
await updateCalendarEventFromExam(updatedExam);
```

### `deleteCalendarEventFromExam(examId)`
Deletes the calendar event associated with an exam.

**Parameters:**
- `examId`: ID of the exam being deleted

**Returns:** `Promise<void>`

**Example:**
```typescript
await deleteCalendarEventFromExam(examId);
```

### `syncExamToCalendar(examId, createdBy)`
Synchronizes an existing exam to the calendar system (useful for migration).

**Parameters:**
- `examId`: ID of the exam to sync
- `createdBy`: User ID of the creator

**Returns:** `Promise<void>`

**Example:**
```typescript
await syncExamToCalendar(examId, userId);
```

## Error Handling

All integration functions are designed to fail gracefully:
- If the "Exam" category doesn't exist, an error is logged but exam operations continue
- If a calendar event is not found during update/delete, a warning is logged
- Errors in calendar operations do not prevent exam CRUD operations from completing

This ensures that issues with the calendar system don't break core exam functionality.

## Event Visibility

Calendar events created from exams are visible to:
- **Admins**: All exam events
- **Teachers**: All exam events (with highlighting for subjects they teach)
- **Students**: Exams for their enrolled subjects and class
- **Parents**: Exams for their children's subjects and classes

Visibility is controlled through:
- `visibleToRoles`: Array of user roles
- `visibleToClasses`: Array of class IDs (if available from term)
- `visibleToSections`: Array of section IDs (if available from term)

## Testing

Unit tests are provided in `src/lib/services/__tests__/exam-calendar-integration.test.ts` covering:
- Calendar event creation with correct exam details
- Handling missing exam category
- Calendar event updates with new exam details
- Handling missing calendar events
- Calendar event deletion
- Handling multiple calendar events for the same exam
- Exam synchronization to calendar
- Duplicate prevention

Run tests with:
```bash
npm test src/lib/services/__tests__/exam-calendar-integration.test.ts
```

## Migration

To sync existing exams to the calendar system, use the `syncExamToCalendar` function:

```typescript
import { syncExamToCalendar } from '@/lib/services/exam-calendar-integration';

// Sync a single exam
await syncExamToCalendar(examId, 'system');

// Sync all exams
const exams = await db.exam.findMany();
for (const exam of exams) {
  await syncExamToCalendar(exam.id, 'system');
}
```

## Future Enhancements

Potential improvements for future iterations:
1. Add location field to exams and sync to calendar events
2. Support for exam room assignments
3. Automatic reminder creation for upcoming exams
4. Integration with student timetables
5. Conflict detection for overlapping exams
