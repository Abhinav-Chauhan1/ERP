# Academic Calendar System - Administrator Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Initial Setup](#initial-setup)
3. [Event Management](#event-management)
4. [Category Management](#category-management)
5. [Visibility and Access Control](#visibility-and-access-control)
6. [Recurring Events](#recurring-events)
7. [Import and Export](#import-and-export)
8. [Integration Management](#integration-management)
9. [User Support](#user-support)
10. [Monitoring and Maintenance](#monitoring-and-maintenance)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Introduction

As an administrator, you have full control over the Academic Calendar System. This guide covers all administrative functions including event management, category configuration, data import/export, and system maintenance.

### Administrator Responsibilities

- Create and manage calendar events
- Configure event categories and colors
- Set visibility rules for events
- Import/export calendar data
- Monitor system usage and performance
- Support users with calendar-related issues
- Maintain data integrity and backups

---

## Initial Setup

### 1. Database Migration

Ensure the calendar database tables are created:

```bash
# Run Prisma migration
npx prisma migrate deploy

# Verify tables exist
npx prisma studio
```

**Required Tables:**
- `CalendarEvent`
- `CalendarEventCategory`
- `EventNote`
- `EventReminder`
- `UserCalendarPreferences`

### 2. Seed Default Categories

Run the category seeding script:

```bash
# Seed default event categories
npx prisma db seed
```

**Default Categories Created:**
- 🔴 Holiday (Red - #EF4444)
- 🟠 Exam (Orange - #F59E0B)
- 🔵 Assignment (Blue - #3B82F6)
- 🟣 Meeting (Purple - #8B5CF6)
- 🟢 School Event (Green - #10B981)
- 🌸 Sports Event (Pink - #EC4899)

### 3. Configure Academic Year

Import academic year holidays and term dates:

1. Navigate to **Calendar** > **Import**
2. Select the academic year template file
3. Review and confirm import
4. Verify holidays appear in calendar

### 4. Set Up Integrations

Enable automatic event creation from other modules:

**Exam Integration:**
- Events auto-created when exams are scheduled
- Syncs exam date/time changes
- Deletes events when exams are removed

**Assignment Integration:**
- Events auto-created for assignment due dates
- Updates when due dates change
- Removes events when assignments are deleted

**Meeting Integration:**
- Creates events for all meeting participants
- Syncs meeting time changes
- Handles meeting cancellations

### 5. Configure Notifications

Set up reminder notification system:

1. Go to **Settings** > **Notifications**
2. Configure email server settings
3. Test email delivery
4. Enable SMS notifications (optional)
5. Configure push notification service

---

## Event Management

### Creating Events

#### Standard Event

1. Click **"Create Event"** button
2. Fill in required fields:
   - **Title**: Clear, descriptive name
   - **Category**: Select appropriate category
   - **Date & Time**: Start and end times
   - **Description**: Detailed information
   - **Location**: Physical or virtual location
3. Set visibility:
   - **Roles**: Select which user types can see event
   - **Classes**: Limit to specific classes (optional)
   - **Sections**: Further limit to sections (optional)
4. Add attachments (optional)
5. Click **"Create Event"**

#### School-Wide Event

For events visible to everyone:

```
Title: School Closed - National Holiday
Category: Holiday
Visible To Roles: [Admin, Teacher, Student, Parent]
Classes: [] (empty = all classes)
Sections: [] (empty = all sections)
```

#### Class-Specific Event

For events limited to specific classes:

```
Title: Grade 10 Science Fair
Category: School Event
Visible To Roles: [Student, Parent, Teacher]
Classes: [Grade 10A, Grade 10B, Grade 10C]
Sections: [] (all sections in selected classes)
```

#### Subject-Specific Event

For events related to specific subjects:

```
Title: Mathematics Olympiad
Category: School Event
Visible To Roles: [Student, Teacher]
Classes: [Grade 9, Grade 10, Grade 11, Grade 12]
Description: Include subject: Mathematics
```

### Editing Events

1. Click on the event in calendar
2. Click **"Edit"** button
3. Modify fields as needed
4. For recurring events, choose scope:
   - **This Event Only**: Single instance
   - **This and Future**: From this date forward
   - **All Events**: Entire series
5. Click **"Save Changes"**

### Deleting Events

1. Click on the event
2. Click **"Delete"** button
3. Confirm deletion
4. For recurring events, choose scope
5. Event removed from all user calendars

### Bulk Operations

#### Bulk Create

Use import feature for multiple events:

1. Prepare CSV/JSON file with event data
2. Navigate to **Import**
3. Upload file
4. Review preview
5. Confirm import

#### Bulk Update

1. Export events to CSV
2. Edit in spreadsheet application
3. Re-import with "Update existing" option
4. Review changes
5. Confirm update

#### Bulk Delete

1. Filter events by criteria
2. Select multiple events (Shift+Click)
3. Click **"Delete Selected"**
4. Confirm bulk deletion

---

## Category Management

### Creating Categories

1. Navigate to **Calendar Settings** > **Categories**
2. Click **"Add Category"**
3. Enter details:
   - **Name**: Unique category name
   - **Description**: Purpose of category
   - **Color**: Hex colo