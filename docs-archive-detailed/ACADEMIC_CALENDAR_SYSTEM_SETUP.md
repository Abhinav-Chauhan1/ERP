# Academic Calendar System - Database Setup

## Overview

This document describes the database models and migrations created for the Academic Calendar System as part of Task 1 of the implementation plan.

## Models Created

### 1. CalendarEventCategory

Stores event categories with customizable colors and icons.

**Fields:**
- `id`: Unique identifier (CUID)
- `name`: Category name (unique)
- `description`: Optional description
- `color`: Hex color code (e.g., "#3b82f6")
- `icon`: Icon name from lucide-react
- `isActive`: Whether the category is active
- `order`: Display order
- `createdAt`, `updatedAt`: Timestamps

**Indexes:**
- Composite index on `(isActive, order)` for efficient filtering and sorting

### 2. CalendarEvent

Main event model with support for recurrence, visibility control, and integration with other modules.

**Fields:**
- `id`: Unique identifier (CUID)
- `title`: Event title
- `description`: Optional detailed description
- `categoryId`: Foreign key to CalendarEventCategory
- `startDate`, `endDate`: Event date range
- `isAllDay`: Boolean flag for all-day events
- `location`: Optional location
- `visibleToRoles`: Array of user roles (ADMIN, TEACHER, STUDENT, PARENT)
- `visibleToClasses`: Array of class IDs
- `visibleToSections`: Array of section IDs
- `sourceType`: Integration source (EXAM, ASSIGNMENT, MEETING, HOLIDAY, SCHOOL_EVENT, MANUAL)
- `sourceId`: ID of the source entity
- `isRecurring`: Boolean flag for recurring events
- `recurrenceRule`: iCal RRULE format string
- `recurrenceId`: Groups recurring event instances
- `exceptionDates`: Array of dates to skip in recurrence
- `attachments`: Array of file URLs
- `createdBy`: User ID of creator
- `createdAt`, `updatedAt`: Timestamps

**Indexes:**
- `(startDate, endDate)`: For date range queries
- `categoryId`: For category filtering
- `(sourceType, sourceId)`: For integration lookups
- `recurrenceId`: For recurring event queries
- `createdBy`: For creator-based queries

### 3. EventNote

Private notes that teachers can add to events.

**Fields:**
- `id`: Unique identifier (CUID)
- `eventId`: Foreign key to CalendarEvent (CASCADE delete)
- `userId`: Teacher who created the note
- `content`: Note content
- `createdAt`, `updatedAt`: Timestamps

**Indexes:**
- `(eventId, userId)`: For efficient note retrieval
- `userId`: For user-specific queries

### 4. EventReminder

Scheduled reminders for events.

**Fields:**
- `id`: Unique identifier (CUID)
- `eventId`: Foreign key to CalendarEvent (CASCADE delete)
- `userId`: User who will receive the reminder
- `reminderTime`: When to send the reminder
- `reminderType`: EMAIL, SMS, PUSH, or IN_APP
- `isSent`: Boolean flag for sent status
- `sentAt`: Timestamp when sent
- `createdAt`, `updatedAt`: Timestamps

**Indexes:**
- `(eventId, userId)`: For event-user reminder lookups
- `(userId, isSent)`: For pending reminders
- `(reminderTime, isSent)`: For scheduled reminder processing

### 5. UserCalendarPreferences

User-specific calendar preferences.

**Fields:**
- `id`: Unique identifier (CUID)
- `userId`: User ID (unique)
- `defaultView`: Default calendar view (month, week, day, agenda)
- `filterSettings`: JSON object with filter preferences
- `defaultReminderTime`: Minutes before event (default: 1440 = 1 day)
- `reminderTypes`: Array of preferred reminder types
- `createdAt`, `updatedAt`: Timestamps

**Indexes:**
- `userId`: For user-specific lookups (unique)

## Enums Created

### EventSourceType
- `EXAM`: Event created from exam module
- `ASSIGNMENT`: Event created from assignment module
- `MEETING`: Event created from meeting module
- `HOLIDAY`: School holiday
- `SCHOOL_EVENT`: General school event
- `MANUAL`: Manually created event

### ReminderType
- `EMAIL`: Email notification
- `SMS`: SMS notification
- `PUSH`: Push notification
- `IN_APP`: In-app notification

## Migration

**Migration Name:** `20251225052519_add_academic_calendar_system`

**Changes:**
1. Created all calendar-related tables
2. Created EventSourceType and ReminderType enums
3. Added all necessary indexes for performance
4. Set up foreign key relationships with CASCADE delete for notes and reminders
5. Fixed existing Event model by removing invalid index on relation field

## Default Categories Seeded

The following default event categories were seeded into the database:

1. **Holiday** - Red (#ef4444) - Calendar icon
2. **Exam** - Amber (#f59e0b) - FileText icon
3. **Assignment** - Purple (#8b5cf6) - ClipboardList icon
4. **Meeting** - Blue (#3b82f6) - Users icon
5. **School Event** - Green (#10b981) - Star icon
6. **Sports Event** - Orange (#f97316) - Trophy icon

## Files Created

1. **Migration:** `prisma/migrations/20251225052519_add_academic_calendar_system/migration.sql`
2. **Seed Script:** `prisma/seed-calendar-categories.ts`
3. **Verification Script:** `scripts/verify-calendar-models.ts`
4. **Documentation:** `docs/ACADEMIC_CALENDAR_SYSTEM_SETUP.md` (this file)

## Verification

All models were verified successfully:
- ✅ CalendarEventCategory: 6 categories created
- ✅ CalendarEvent: Model ready (0 events)
- ✅ EventNote: Model ready (0 notes)
- ✅ EventReminder: Model ready (0 reminders)
- ✅ UserCalendarPreferences: Model ready (0 preferences)

## Next Steps

The database foundation is now ready for:
1. Implementing the calendar service layer (Task 2)
2. Creating API endpoints (Task 4)
3. Building UI components (Task 15)
4. Integrating with existing modules (Tasks 12-14)

## Requirements Validated

This implementation satisfies:
- **Requirement 1.1**: Event creation with validation
- **Requirement 8.1**: Event category management with unique names and colors
- All database models support the full feature set described in the design document
