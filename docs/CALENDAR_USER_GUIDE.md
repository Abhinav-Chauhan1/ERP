# Academic Calendar System - User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Calendar Views](#calendar-views)
4. [Managing Events (Admin)](#managing-events-admin)
5. [Viewing Events (All Users)](#viewing-events-all-users)
6. [Filtering and Searching](#filtering-and-searching)
7. [Event Reminders](#event-reminders)
8. [Personal Notes (Teachers)](#personal-notes-teachers)
9. [Import and Export (Admin)](#import-and-export-admin)
10. [Mobile Access](#mobile-access)
11. [Keyboard Shortcuts](#keyboard-shortcuts)
12. [Troubleshooting](#troubleshooting)

---

## Introduction

The Academic Calendar System provides a centralized view of all academic events, holidays, exams, assignments, meetings, and important school dates. The calendar is integrated across all user dashboards and automatically syncs with other ERP modules.

### Key Features

- **Role-Based Access**: See only events relevant to your role and relationships
- **Multiple Views**: Month, week, day, and agenda views
- **Automatic Integration**: Events automatically created from exams, assignments, and meetings
- **Smart Filtering**: Filter by category, date range, and search terms
- **Event Reminders**: Configurable notifications for upcoming events
- **Import/Export**: Sync with external calendar applications
- **Mobile Friendly**: Responsive design works on all devices
- **Accessible**: Full keyboard navigation and screen reader support

---

## Getting Started

### Accessing the Calendar

1. **Log in** to your School ERP account
2. **Navigate** to the Calendar section from your dashboard sidebar
   - Look for the calendar icon (📅) in the left sidebar
   - Click "Calendar" to open the full calendar view

### Dashboard Widget

A calendar widget is also available on your dashboard home page showing:
- Current month view with event indicators
- List of upcoming events (next 7 days)
- Quick access to full calendar page

---

## Calendar Views

The calendar supports four different view modes to suit your preferences:

### Month View (Default)

- Shows a full month calendar grid
- Event indicators on dates with events
- Color-coded by event category
- Click any date to see events for that day
- Navigate between months using arrow buttons

### Week View

- Shows a 7-day week with time slots
- Hourly breakdown of events
- Ideal for detailed weekly planning
- Scroll to see different times of day

### Day View

- Shows a single day with hourly time slots
- Detailed view of all events for the selected day
- Perfect for daily planning
- Navigate between days using arrow buttons

### Agenda View

- List view of all upcoming events
- Chronologically sorted
- Shows event details inline
- Infinite scroll for browsing future events
- Group by date or category

**Switching Views:**
- Use the view selector buttons at the top of the calendar
- Your preference is saved automatically for future sessions

---

## Managing Events (Admin)

### Creating a New Event

1. Click the **"Create Event"** button (top right of calendar)
2. Fill in the event details:
   - **Title**: Event name (required)
   - **Description**: Additional details about the event
   - **Category**: Select from predefined categories (required)
   - **Date & Time**: Start and end date/time (required)
   - **All Day**: Toggle if event spans entire day
   - **Location**: Physical or virtual location
   - **Visibility**: Select which roles can see this event
   - **Classes/Sections**: Limit visibility to specific classes
   - **Attachments**: Upload relevant files (PDF, DOC, images)
3. **For Recurring Events**:
   - Enable "Recurring Event" toggle
   - Select recurrence pattern (daily, weekly, monthly, yearly)
   - Choose specific days (for weekly recurrence)
   - Set end date or number of occurrences
4. Click **"Create Event"** to save

### Editing an Event

1. Click on the event in the calendar
2. Click the **"Edit"** button in the event detail modal
3. Modify the event details
4. **For Recurring Events**, choose update scope:
   - **This Event Only**: Update only this instance
   - **This and Future Events**: Update from this date forward
   - **All Events**: Update all instances in the series
5. Click **"Save Changes"**

### Deleting an Event

1. Click on the event in the calendar
2. Click the **"Delete"** button in the event detail modal
3. **For Recurring Events**, choose deletion scope:
   - **This Event Only**: Delete only this instance
   - **This and Future Events**: Delete from this date forward
   - **All Events**: Delete all instances in the series
4. Confirm the deletion

### Managing Event Categories

1. Navigate to **Calendar Settings** (gear icon)
2. Click **"Manage Categories"**
3. **Create New Category**:
   - Enter category name
   - Choose a color (for visual distinction)
   - Select an icon (optional)
   - Set display order
4. **Edit Category**:
   - Click edit icon next to category
   - Update name, color, or icon
   - Changes apply to all events in that category
5. **Delete Category**:
   - Click delete icon next to category
   - Select a replacement category for existing events
   - Confirm deletion

**Default Categories:**
- 🔴 Holiday (Red)
- 🟠 Exam (Orange)
- 🔵 Assignment (Blue)
- 🟣 Meeting (Purple)
- 🟢 School Event (Green)
- 🌸 Sports Event (Pink)

---

## Viewing Events (All Users)

### Event Details

Click on any event to view full details:
- Event title and description
- Date, time, and location
- Event category
- Attached files (click to download)
- Personal notes (teachers only)
- Related information (exam details, assignment info, etc.)

### Role-Based Visibility

**Administrators** see:
- All events in the system
- Full management capabilities

**Teachers** see:
- School-wide events (holidays, school events)
- Exams for subjects they teach
- Assignments they created
- Meetings they're invited to
- Events marked visible to teachers

**Students** see:
- School-wide events
- Exams for their enrolled subjects
- Assignments for their class
- Events for their class/section
- Events marked visible to students

**Parents** see:
- School-wide events
- All events visible to their children
- Parent-teacher meetings for their children
- Events marked visible to parents

### Multi-Child View (Parents)

If you have multiple children enrolled:
1. Use the **child selector** dropdown at the top
2. Select "All Children" to see combined events
3. Select a specific child to see only their events
4. Events are color-coded by child (optional setting)

---

## Filtering and Searching

### Category Filters

1. Click the **"Filter"** button (funnel icon)
2. Check/uncheck categories to show/hide
3. Selected filters are applied immediately
4. Click **"Clear Filters"** to reset

### Date Range Filter

1. Click the **"Date Range"** button
2. Select start date and end date
3. Only events within the range are shown
4. Click **"Clear"** to remove date filter

### Search Events

1. Use the search box at the top of the calendar
2. Type keywords to search:
   - Event titles
   - Event descriptions
   - Location names
   - Category names
3. Results update as you type
4. Search is case-insensitive

### Combining Filters

- Multiple filters work together (AND logic)
- Example: Search "exam" + Category "Exam" + Date range "This month"
- All filters must match for an event to appear

---

## Event Reminders

### Configuring Reminders

1. Go to **Settings** > **Calendar Preferences**
2. Under **Reminders**, configure:
   - **Default Reminder Time**: How far in advance (1 day, 1 week, etc.)
   - **Reminder Methods**: Email, SMS, Push, In-App
   - **Category-Specific Settings**: Different reminders for different event types
3. Click **"Save Preferences"**

### Reminder Notifications

- Reminders are sent at the configured time before events
- Notifications include:
  - Event title
  - Date and time
  - Location
  - Quick link to event details
- Dismiss a reminder to prevent duplicates
- Reminders update automatically if event time changes

### Managing Reminders

- **Snooze**: Postpone reminder for later
- **Dismiss**: Mark as acknowledged
- **View Event**: Jump directly to event details
- **Disable**: Turn off reminders for specific event

---

## Personal Notes (Teachers)

Teachers can add private notes to any calendar event for personal reference.

### Adding a Note

1. Click on an event to open details
2. Scroll to the **"My Notes"** section
3. Click **"Add Note"**
4. Type your note content
5. Click **"Save Note"**

### Editing Notes

1. Click the edit icon next to your note
2. Modify the content
3. Click **"Save Changes"**
4. Note timestamp updates automatically

### Note Privacy

- Notes are **private** and visible only to you
- Other users cannot see your notes
- Notes are preserved even if the event is updated
- Notes are deleted if the event is deleted

---

## Import and Export (Admin)

### Exporting Calendar Data

1. Click **"Export"** button (download icon)
2. Select export format:
   - **iCal (.ics)**: For Apple Calendar, Google Calendar, Outlook
   - **CSV (.csv)**: For spreadsheet applications
   - **JSON (.json)**: For data processing
3. Choose date range (optional)
4. Select categories to include (optional)
5. Click **"Download"**
6. File downloads to your device

### Importing Calendar Data

1. Click **"Import"** button (upload icon)
2. Select file format (iCal, CSV, or JSON)
3. Click **"Choose File"** and select your file
4. Review import preview:
   - Shows number of events to import
   - Highlights any errors or warnings
   - Lists duplicate events (will be skipped)
5. Click **"Import Events"**
6. Review import summary:
   - Number of events successfully imported
   - Number of duplicates skipped
   - Any errors encountered

### Import File Formats

**iCal Format (.ics):**
```
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:School Holiday
DTSTART:20250101
DTEND:20250101
DESCRIPTION:New Year's Day
LOCATION:School Closed
END:VEVENT
END:VCALENDAR
```

**CSV Format (.csv):**
```
Title,Description,Category,Start Date,End Date,All Day,Location,Visible To Roles
"School Holiday","New Year's Day","Holiday","2025-01-01","2025-01-01","true","School Closed","ADMIN,TEACHER,STUDENT,PARENT"
```

**JSON Format (.json):**
```json
[
  {
    "title": "School Holiday",
    "description": "New Year's Day",
    "category": "Holiday",
    "startDate": "2025-01-01",
    "endDate": "2025-01-01",
    "isAllDay": true,
    "location": "School Closed",
    "visibleToRoles": ["ADMIN", "TEACHER", "STUDENT", "PARENT"]
  }
]
```

---

## Mobile Access

### Mobile-Optimized Features

- **Responsive Design**: Calendar adapts to screen size
- **Touch Gestures**:
  - Swipe left/right to navigate months
  - Tap event to view details
  - Long press for quick actions
  - Pinch to zoom (day/week views)
- **Mobile Menu**: Hamburger menu for filters and settings
- **Quick Actions**: Floating action button for common tasks

### Mobile Tips

- Use **Agenda View** for easier scrolling on small screens
- Enable **Push Notifications** for mobile reminders
- Add calendar to home screen for quick access
- Use **Voice Search** for hands-free event lookup

---

## Keyboard Shortcuts

### Navigation

- **T**: Go to Today
- **N**: Next month/week/day
- **P**: Previous month/week/day
- **Arrow Keys**: Navigate between dates
- **Enter**: Select date / Open event
- **Escape**: Close modal / Cancel action

### Views

- **M**: Switch to Month view
- **W**: Switch to Week view
- **D**: Switch to Day view
- **A**: Switch to Agenda view

### Actions (Admin)

- **C**: Create new event
- **E**: Edit selected event
- **Delete**: Delete selected event
- **F**: Open filters
- **S**: Focus search box

### Accessibility

- **Tab**: Move to next element
- **Shift + Tab**: Move to previous element
- **Space**: Activate button / Toggle checkbox
- **?**: Show keyboard shortcuts help

---

## Troubleshooting

### Events Not Showing

**Problem**: Calendar appears empty or missing events

**Solutions**:
1. Check if filters are applied (clear all filters)
2. Verify date range includes the events
3. Ensure you have visibility permissions for the events
4. Refresh the page (Ctrl+R or Cmd+R)
5. Check your internet connection

### Reminders Not Received

**Problem**: Not receiving event reminder notifications

**Solutions**:
1. Check reminder settings in Calendar Preferences
2. Verify email/phone number is correct in profile
3. Check spam/junk folder for email reminders
4. Ensure browser notifications are enabled
5. Contact admin if issue persists

### Import Errors

**Problem**: Calendar import fails or shows errors

**Solutions**:
1. Verify file format is supported (iCal, CSV, JSON)
2. Check file for formatting errors
3. Ensure all required fields are present
4. Remove special characters from event titles
5. Try importing smaller batches of events

### Recurring Events Not Updating

**Problem**: Changes to recurring events don't apply correctly

**Solutions**:
1. Verify you selected the correct update scope
2. Check if exception dates are blocking updates
3. Try updating "All Events" instead of "Future Events"
4. Delete and recreate the recurring event if needed
5. Contact admin for assistance

### Performance Issues

**Problem**: Calendar loads slowly or feels sluggish

**Solutions**:
1. Clear browser cache and cookies
2. Reduce date range for large event sets
3. Use Agenda view for better performance
4. Disable unnecessary filters
5. Close other browser tabs
6. Try a different browser

### Mobile Display Issues

**Problem**: Calendar doesn't display correctly on mobile

**Solutions**:
1. Rotate device to landscape orientation
2. Zoom out if calendar is too large
3. Use Agenda view for better mobile experience
4. Update browser to latest version
5. Clear mobile browser cache

---

## Getting Help

### Support Resources

- **In-App Help**: Click the "?" icon for contextual help
- **Admin Support**: Contact your school administrator
- **Technical Support**: Email support@schoolerp.com
- **User Forum**: Visit community.schoolerp.com
- **Video Tutorials**: Available at help.schoolerp.com/calendar

### Reporting Issues

When reporting a problem, include:
1. Your user role (Admin, Teacher, Student, Parent)
2. Browser and version
3. Device type (Desktop, Mobile, Tablet)
4. Steps to reproduce the issue
5. Screenshots if applicable
6. Error messages (if any)

---

## Best Practices

### For Administrators

- Create events well in advance for better planning
- Use consistent naming conventions for events
- Assign appropriate visibility to avoid confusion
- Regularly review and update event categories
- Export calendar data monthly for backup
- Monitor import/export logs for errors

### For Teachers

- Add personal notes to track preparation tasks
- Set reminders for important deadlines
- Use filters to focus on relevant events
- Check calendar daily for updates
- Report missing or incorrect events to admin

### For Students

- Enable reminders for exams and assignments
- Check calendar weekly for upcoming events
- Use Agenda view to see all deadlines
- Add important dates to personal calendar
- Sync with mobile device for on-the-go access

### For Parents

- Set up multi-child view if applicable
- Enable email reminders for important events
- Check calendar before parent-teacher meetings
- Monitor exam schedules and holidays
- Coordinate family schedule with school calendar

---

*Last Updated: December 2025*
*Version: 1.0*
