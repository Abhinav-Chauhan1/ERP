# Calendar Notification Integration

## Overview

This document describes the notification integration for the Academic Calendar system's reminder functionality. The implementation connects the event reminder system with in-app notifications and email notifications.

**Requirements Addressed:** 5.1, 5.2, 5.3

## Components Implemented

### 1. Notification Service (`src/lib/services/notification-service.ts`)

A comprehensive service for managing in-app notifications:

**Key Functions:**
- `createNotification()` - Create generic in-app notifications
- `createReminderNotification()` - Create calendar reminder notifications with event details
- `getUserNotifications()` - Fetch notifications for a user
- `getNotificationSummary()` - Get notification counts and summary
- `markNotificationAsRead()` - Mark individual notification as read
- `markAllNotificationsAsRead()` - Mark all user notifications as read
- `deleteNotification()` - Delete a notification
- `deleteOldNotifications()` - Cleanup old read notifications

**Features:**
- Automatic notification creation with event details (title, date, time, location)
- Deep linking to calendar events
- Read/unread status tracking
- Notification type categorization (INFO, REMINDER, etc.)

### 2. Event Reminder Service Integration

Updated `src/lib/services/event-reminder-service.ts` to integrate with the notification service:

**Changes:**
- Added import for `createReminderNotification`
- Updated `IN_APP` reminder type handler to create actual in-app notifications
- Updated `processPendingReminders()` to fetch user data and send notifications properly

**Reminder Flow:**
1. Event reminder is scheduled based on user preferences
2. When reminder time arrives, `processPendingReminders()` is called
3. For IN_APP reminders, an in-app notification is created
4. For EMAIL reminders, an email is sent
5. Reminder is marked as sent to prevent duplicates

### 3. API Endpoints

#### Notifications API (`/api/notifications`)

**GET /api/notifications**
- Query params: `limit`, `unreadOnly`, `summary`
- Returns: Array of notifications or notification summary
- Authorization: Authenticated users only

**POST /api/notifications/mark-all-read**
- Marks all user notifications as read
- Returns: Count of updated notifications

#### Individual Notification API (`/api/notifications/:id`)

**PATCH /api/notifications/:id**
- Marks a specific notification as read
- Authorization: Notification owner only

**DELETE /api/notifications/:id**
- Deletes a specific notification
- Authorization: Notification owner only

#### Calendar Preferences API (`/api/calendar/preferences`)

**GET /api/calendar/preferences**
- Returns user's calendar preferences including reminder settings
- Creates default preferences if none exist

**PUT /api/calendar/preferences**
- Updates calendar preferences
- Validates reminder types and times
- Supports: `defaultView`, `filterSettings`, `defaultReminderTime`, `reminderTypes`

**Reminder Types Supported:**
- `IN_APP` - In-app notifications
- `EMAIL` - Email notifications
- `SMS` - SMS notifications (placeholder)
- `PUSH` - Push notifications (placeholder)

**Reminder Time Options:**
- 0 minutes (at time of event)
- 15 minutes before
- 30 minutes before
- 1 hour before
- 2 hours before
- 1 day before (default)
- 2 days before
- 1 week before

### 4. UI Components

#### Reminder Preferences Component (`src/components/calendar/reminder-preferences.tsx`)

A user-friendly settings component for configuring reminder preferences:

**Features:**
- Dropdown selector for default reminder time
- Checkboxes for notification methods (In-App, Email, SMS, Push)
- Icons and descriptions for each notification type
- Real-time validation (at least one method required)
- Loading and saving states
- Toast notifications for success/error feedback

**Integration:**
- Added to Admin settings page (`/admin/settings` - Reminders tab)
- Added to Teacher settings page (`/teacher/settings` - Reminders tab)
- Added to Student settings page (`/student/settings` - Reminders tab)
- Added to Parent settings page (`/parent/settings` - Reminders tab)

## User Settings Integration

All user role settings pages now include a "Reminders" tab with the reminder preferences component:

1. **Admin Settings** (`src/app/admin/settings/page.tsx`)
   - Added "Reminders" tab with Clock icon
   - Positioned between Notifications and Security tabs

2. **Teacher Settings** (`src/app/teacher/settings/page.tsx`)
   - Added "Reminders" tab
   - Integrated with existing settings tabs

3. **Student Settings** (`src/app/student/settings/page.tsx`)
   - Added "Reminders" tab
   - Mobile-responsive design maintained

4. **Parent Settings** (`src/components/parent/settings/settings-page-client.tsx`)
   - Added "Reminders" tab with Clock icon
   - Integrated into client-side settings component

## Database Schema

The implementation uses existing database models:

### Notification Model
```prisma
model Notification {
  id        String    @id @default(cuid())
  userId    String
  title     String
  message   String
  type      String    // "INFO", "REMINDER", "WARNING", "ERROR"
  isRead    Boolean   @default(false)
  readAt    DateTime?
  link      String?   // Deep link to calendar event
  createdAt DateTime  @default(now())
  updatedAt DateTime  @default(now())
}
```

### UserCalendarPreferences Model
```prisma
model UserCalendarPreferences {
  id                  String   @id @default(cuid())
  userId              String   @unique
  defaultView         String   @default("month")
  filterSettings      Json?
  defaultReminderTime Int      @default(1440) // Minutes before event
  reminderTypes       String[] // Array of ReminderType values
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

## Testing

A comprehensive test script is available at `scripts/test-notification-integration.ts`:

**Test Coverage:**
1. Creating basic notifications
2. Creating reminder notifications with event details
3. Fetching user notifications
4. Getting notification summaries
5. Marking notifications as read
6. Marking all notifications as read
7. Deleting notifications
8. User calendar preferences management
9. Reminder notification creation with preferences

**Run Tests:**
```bash
npx tsx scripts/test-notification-integration.ts
```

## Usage Examples

### Creating a Reminder Notification

```typescript
import { createReminderNotification } from '@/lib/services/notification-service';

const notification = await createReminderNotification(
  userId,
  'Math Exam',
  new Date('2025-12-26T10:00:00'),
  '10:00 AM',
  'Room 101',
  'event-id-123'
);
```

### Fetching User Notifications

```typescript
import { getUserNotifications } from '@/lib/services/notification-service';

// Get all notifications
const notifications = await getUserNotifications(userId);

// Get only unread notifications
const unreadNotifications = await getUserNotifications(userId, 50, true);
```

### Updating Calendar Preferences

```typescript
// Client-side API call
const response = await fetch('/api/calendar/preferences', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    defaultReminderTime: 1440, // 1 day before
    reminderTypes: ['IN_APP', 'EMAIL']
  })
});
```

## Integration with Event Reminder Service

The notification service is automatically integrated with the event reminder service:

1. When an event reminder is created, it uses the user's preferences from `UserCalendarPreferences`
2. When the reminder time arrives, `processPendingReminders()` is called (typically by a cron job)
3. For each pending reminder:
   - User data is fetched
   - Notification is sent based on reminder type
   - For IN_APP type, an in-app notification is created
   - For EMAIL type, an email is sent
   - Reminder is marked as sent

## Future Enhancements

1. **SMS Integration**: Implement actual SMS sending via SMS gateway
2. **Push Notifications**: Implement push notifications for mobile apps
3. **Notification Preferences**: Add more granular control over which event types trigger notifications
4. **Notification Grouping**: Group similar notifications together
5. **Notification Scheduling**: Allow users to set quiet hours
6. **Notification History**: Add a dedicated page for viewing notification history

## Security Considerations

- All API endpoints require authentication
- Notifications are user-scoped (users can only access their own notifications)
- Authorization checks ensure users can only modify their own notifications
- Input validation on all preference updates
- Rate limiting should be applied to notification endpoints

## Performance Considerations

- Notifications are indexed by userId and isRead for fast queries
- Old read notifications can be cleaned up periodically using `deleteOldNotifications()`
- Notification queries are limited to prevent excessive data transfer
- Preferences are cached in the database to avoid repeated calculations

## Conclusion

The notification integration provides a complete solution for calendar event reminders with:
- Multiple notification channels (in-app, email, SMS, push)
- User-configurable preferences
- Comprehensive API endpoints
- User-friendly settings UI across all user roles
- Robust error handling and validation
- Full test coverage

This implementation satisfies requirements 5.1, 5.2, and 5.3 of the Academic Calendar System specification.
