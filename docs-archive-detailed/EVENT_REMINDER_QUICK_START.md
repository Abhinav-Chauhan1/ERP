# Event Reminder System - Quick Start Guide

## Overview

The Event Reminder System automatically sends notifications to users before calendar events based on their preferences.

## Quick Setup

### 1. Import the Service

```typescript
import {
  createRemindersForEvent,
  synchronizeRemindersOnEventUpdate,
  processPendingReminders
} from '@/lib/services/event-reminder-service';
```

### 2. Create Reminders for an Event

```typescript
// After creating a calendar event
const event = await createCalendarEvent({
  title: 'Team Meeting',
  startDate: new Date('2025-12-31T10:00:00'),
  endDate: new Date('2025-12-31T11:00:00'),
  categoryId: 'meeting-category',
  visibleToRoles: ['TEACHER'],
  createdBy: 'admin-id'
});

// Create reminders for affected users
const userIds = ['user-1', 'user-2', 'user-3'];
await createRemindersForEvent(event.id, userIds);
```

### 3. Update Event (Automatic Sync)

```typescript
// Reminders are automatically synchronized when you update an event
const updatedEvent = await updateCalendarEvent('event-id', {
  startDate: new Date('2025-12-31T14:00:00')
});
// Reminders are automatically updated! ✅
```

### 4. Process Pending Reminders (Cron Job)

```typescript
// Set up a cron job to run every 5 minutes
import { processPendingReminders } from '@/lib/services/event-reminder-service';

async function reminderCronJob() {
  const result = await processPendingReminders();
  console.log(`Sent ${result.sent} reminders`);
}

// Schedule with your preferred cron library
```

## User Preferences

Users can configure their reminder preferences:

```typescript
// Update user preferences
await updateUserCalendarPreferences('user-id', {
  defaultReminderTime: 1440,           // 1 day before (in minutes)
  reminderTypes: ['EMAIL', 'IN_APP']   // Enabled reminder types
});
```

### Common Reminder Times

- **1 hour before**: 60 minutes
- **1 day before**: 1440 minutes (default)
- **1 week before**: 10080 minutes

## Reminder Types

- **EMAIL** - Email notifications
- **SMS** - SMS notifications
- **PUSH** - Push notifications
- **IN_APP** - In-app notifications

## Key Features

✅ **Automatic Creation** - Reminders created based on user preferences
✅ **Auto Sync** - Updates when events change
✅ **Deduplication** - Prevents duplicate notifications
✅ **Cascade Delete** - Reminders deleted with events
✅ **Batch Processing** - Efficient reminder processing

## Testing

### Run Unit Tests

```bash
npm test -- src/lib/services/__tests__/event-reminder-service.test.ts --run
```

### Run Integration Demo

```bash
npx tsx scripts/demo-reminder-integration.ts
```

## Common Use Cases

### 1. Create Event with Reminders

```typescript
// Create event
const event = await createCalendarEvent(eventData);

// Get affected users (teachers, students, parents)
const userIds = await getAffectedUsers(event);

// Create reminders
await createRemindersForEvent(event.id, userIds);
```

### 2. Update Event Time

```typescript
// Update event (reminders auto-sync)
await updateCalendarEvent(eventId, {
  startDate: newDate,
  endDate: newEndDate
});
```

### 3. Check Pending Reminders

```typescript
import { getPendingReminders } from '@/lib/services/event-reminder-service';

const pending = await getPendingReminders();
console.log(`${pending.length} reminders pending`);
```

## Troubleshooting

### Reminders Not Being Created

1. Check user preferences exist
2. Verify event is in the future
3. Check reminder types are enabled

### Reminders Not Sending

1. Verify email service is configured
2. Check cron job is running
3. Review error logs

### Duplicate Reminders

The system automatically prevents duplicates. If you see duplicates:
1. Check the `isSent` flag in database
2. Verify deduplication logic is working

## API Endpoints

### Get User Preferences

```typescript
GET /api/calendar/preferences
```

### Update User Preferences

```typescript
PUT /api/calendar/preferences
Body: {
  defaultReminderTime: 1440,
  reminderTypes: ['EMAIL', 'IN_APP']
}
```

## Database Queries

### Get User's Pending Reminders

```sql
SELECT * FROM event_reminders
WHERE userId = 'user-id'
  AND isSent = false
  AND reminderTime <= NOW()
ORDER BY reminderTime ASC;
```

### Get Event Reminders

```sql
SELECT * FROM event_reminders
WHERE eventId = 'event-id'
ORDER BY reminderTime ASC;
```

## Performance Tips

1. **Use Indexes** - Database has indexes on key fields
2. **Batch Processing** - Process reminders in batches
3. **Caching** - Cache user preferences
4. **Async Processing** - Use background jobs for sending

## Next Steps

1. ✅ Service implemented
2. ✅ Tests passing
3. ✅ Integration complete
4. ⏳ Set up cron job for reminder processing
5. ⏳ Configure email service
6. ⏳ Add monitoring and alerts

## Documentation

- **Full Documentation**: `src/lib/services/event-reminder-service.README.md`
- **Implementation Guide**: `docs/EVENT_REMINDER_SYSTEM_IMPLEMENTATION.md`
- **API Reference**: See service file for function signatures

## Support

For issues or questions:
1. Check the README
2. Run the demo script
3. Review the tests
4. Check error logs
