# Event Reminder Service

## Overview

The Event Reminder Service manages automated reminders for calendar events. It handles reminder scheduling, notification generation, deduplication, and synchronization when events are updated.

## Requirements

This service implements the following requirements:

- **5.1**: Send notifications based on user-configured reminder settings (1 day before, 1 week before, etc.)
- **5.2**: Apply settings to all future events of selected categories
- **5.3**: Include event title, date, time, and location in the notification
- **5.4**: Not send duplicate reminders for the same event
- **5.5**: Send updated reminders to all affected users when event is updated

## Core Functions

### Reminder Scheduling

#### `calculateReminderTime(eventDate: Date, reminderOffsetMinutes: number): Date`

Calculates when a reminder should be sent based on the event date and user's preferred offset.

**Example:**
```typescript
const eventDate = new Date('2025-12-31T10:00:00');
const reminderTime = calculateReminderTime(eventDate, 1440); // 1 day before
// Returns: 2025-12-30T10:00:00
```

#### `createRemindersForEvent(eventId: string, userIds: string[]): Promise<EventReminder[]>`

Creates reminders for an event based on each user's preferences. Automatically:
- Fetches user reminder preferences
- Calculates reminder times
- Creates reminders for each enabled reminder type (EMAIL, SMS, PUSH, IN_APP)
- Only creates reminders for future events

**Example:**
```typescript
const reminders = await createRemindersForEvent('event-123', ['user-1', 'user-2']);
// Creates reminders for both users based on their preferences
```

### Notification Generation

#### `generateReminderNotification(event: CalendarEvent): ReminderNotificationData`

Generates notification content with complete event details including:
- Event title
- Event date
- Event time (formatted or "All Day")
- Location (if available)
- Description (if available)

**Example:**
```typescript
const notification = generateReminderNotification(event);
// Returns: { eventTitle, eventDate, eventTime, location, description }
```

#### `sendReminderNotification(reminder: EventReminder, event: CalendarEvent, userEmail: string): Promise<boolean>`

Sends a reminder notification via the appropriate channel (EMAIL, SMS, PUSH, IN_APP).

**Example:**
```typescript
const success = await sendReminderNotification(
  reminder,
  event,
  'user@example.com'
);
```

### Deduplication

#### `hasExistingReminder(eventId: string, userId: string, reminderType: ReminderType): Promise<boolean>`

Checks if a reminder has already been sent to prevent duplicates.

**Example:**
```typescript
const isDuplicate = await hasExistingReminder('event-123', 'user-1', 'EMAIL');
if (!isDuplicate) {
  // Send the reminder
}
```

#### `markReminderAsSent(reminderId: string): Promise<EventReminder>`

Marks a reminder as sent and records the timestamp.

### Event Update Synchronization

#### `synchronizeRemindersOnEventUpdate(eventId: string, oldStartDate: Date, newStartDate: Date): Promise<number>`

When an event's date/time changes, this function:
- Calculates the time difference
- Updates all unsent reminders to reflect the new event time
- Returns the number of reminders updated

**Example:**
```typescript
const oldDate = new Date('2025-12-31T10:00:00');
const newDate = new Date('2025-12-31T14:00:00'); // Moved 4 hours later

const updated = await synchronizeRemindersOnEventUpdate('event-123', oldDate, newDate);
// All unsent reminders are shifted 4 hours later
```

### Reminder Processing

#### `getPendingReminders(beforeTime?: Date): Promise<Array<EventReminder & { event: CalendarEvent }>>`

Retrieves all reminders that need to be sent.

**Example:**
```typescript
const pending = await getPendingReminders();
// Returns all reminders scheduled before now
```

#### `processPendingReminders(): Promise<{ processed: number; sent: number; failed: number }>`

Processes all pending reminders. This function should be called periodically (e.g., by a cron job).

**Example:**
```typescript
const result = await processPendingReminders();
console.log(`Processed ${result.processed} reminders: ${result.sent} sent, ${result.failed} failed`);
```

## User Preferences

Reminder behavior is controlled by user preferences stored in `UserCalendarPreferences`:

- `defaultReminderTime`: Minutes before event to send reminder (default: 1440 = 1 day)
- `reminderTypes`: Array of enabled reminder types (e.g., ['EMAIL', 'IN_APP'])

## Reminder Types

The service supports four reminder types:

1. **EMAIL**: Sends email notifications via the email service
2. **SMS**: Sends SMS notifications (requires SMS service integration)
3. **PUSH**: Sends push notifications (requires push notification service)
4. **IN_APP**: Creates in-app notifications (requires notification service)

## Integration with Calendar Service

The reminder service integrates with the calendar service for:

1. **Event Creation**: Call `createRemindersForEvent()` after creating an event
2. **Event Update**: Call `synchronizeRemindersOnEventUpdate()` when event date/time changes
3. **Event Deletion**: Reminders are automatically deleted via cascade delete in the database

## Example Usage

### Creating Reminders for a New Event

```typescript
import { createCalendarEvent } from './calendar-service';
import { createRemindersForEvent } from './event-reminder-service';

// Create the event
const event = await createCalendarEvent({
  title: 'Team Meeting',
  startDate: new Date('2025-12-31T10:00:00'),
  endDate: new Date('2025-12-31T11:00:00'),
  categoryId: 'meeting-category',
  visibleToRoles: ['TEACHER', 'ADMIN'],
  createdBy: 'admin-user-id'
});

// Create reminders for all affected users
const userIds = ['user-1', 'user-2', 'user-3'];
await createRemindersForEvent(event.id, userIds);
```

### Updating Event and Synchronizing Reminders

```typescript
import { updateCalendarEvent } from './calendar-service';
import { synchronizeRemindersOnEventUpdate } from './event-reminder-service';

const event = await getCalendarEventById('event-123');
const oldStartDate = event.startDate;

// Update the event
const updatedEvent = await updateCalendarEvent('event-123', {
  startDate: new Date('2025-12-31T14:00:00'),
  endDate: new Date('2025-12-31T15:00:00')
});

// Synchronize reminders
await synchronizeRemindersOnEventUpdate(
  'event-123',
  oldStartDate,
  updatedEvent.startDate
);
```

### Processing Reminders (Cron Job)

```typescript
import { processPendingReminders } from './event-reminder-service';

// This should be called periodically (e.g., every 5 minutes)
async function reminderCronJob() {
  const result = await processPendingReminders();
  console.log(`Reminder processing complete:`, result);
}

// Schedule with your preferred cron library
// e.g., node-cron, bull, etc.
```

## Database Schema

The service uses the `EventReminder` model:

```prisma
model EventReminder {
  id      String        @id @default(cuid())
  event   CalendarEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  eventId String
  userId  String

  reminderTime DateTime
  reminderType ReminderType

  isSent Boolean   @default(false)
  sentAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([eventId, userId])
  @@index([userId, isSent])
  @@index([reminderTime, isSent])
}
```

## Error Handling

The service throws `ReminderValidationError` for validation failures:

- Event not found
- Invalid reminder data

All other errors are caught and logged, allowing the system to continue processing other reminders.

## Performance Considerations

1. **Indexes**: The database has indexes on `[eventId, userId]`, `[userId, isSent]`, and `[reminderTime, isSent]` for efficient queries
2. **Batch Processing**: `processPendingReminders()` processes all pending reminders in a single query
3. **Deduplication**: Checks for existing reminders before sending to avoid unnecessary work

## Future Enhancements

1. **Retry Logic**: Implement retry mechanism for failed notifications
2. **User Notification Preferences**: Allow users to disable reminders for specific events
3. **Reminder Templates**: Support customizable reminder templates
4. **Reminder History**: Track reminder delivery history for analytics
5. **Smart Scheduling**: Adjust reminder times based on user timezone
