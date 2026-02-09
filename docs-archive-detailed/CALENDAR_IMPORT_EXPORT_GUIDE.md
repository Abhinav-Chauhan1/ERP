# Calendar Import/Export Guide

This guide explains how to use the calendar import and export functionality in the School ERP system.

## Overview

The calendar system supports importing and exporting events in three formats:
- **iCal (.ics)**: Standard calendar format compatible with Google Calendar, Outlook, Apple Calendar
- **CSV**: Spreadsheet format for Excel, Google Sheets
- **JSON**: Structured data format for programmatic access

## Quick Start

### Exporting Events

1. Navigate to the calendar page
2. Click the "Export" button
3. Select your desired format (iCal, CSV, or JSON)
4. Optionally filter by date range or categories
5. Click "Download" to save the file

### Importing Events

1. Prepare your import file in one of the supported formats
2. Navigate to the calendar page
3. Click the "Import" button
4. Select your file and format
5. Review the import summary
6. Confirm the import

## Export Formats

### iCal Format (.ics)

Best for: Importing into other calendar applications

**Features:**
- Standard calendar format
- Compatible with all major calendar apps
- Includes recurrence rules
- Preserves all event metadata

**Example Use Cases:**
- Sync school calendar with Google Calendar
- Share calendar with external stakeholders
- Backup calendar data

### CSV Format

Best for: Editing in spreadsheets, bulk data management

**Features:**
- Easy to edit in Excel or Google Sheets
- Human-readable format
- Good for bulk updates
- Simple structure

**Example Use Cases:**
- Bulk edit event details
- Create events from spreadsheet
- Data analysis and reporting

### JSON Format

Best for: Programmatic access, API integration

**Features:**
- Structured data format
- Easy to parse programmatically
- Includes all event fields
- Perfect for backups

**Example Use Cases:**
- API integration
- Automated backups
- Data migration
- Custom processing

## Import File Formats

### iCal (.ics) Import

**Required Fields:**
- SUMMARY (event title)
- DTSTART (start date/time)
- DTEND (end date/time)

**Optional Fields:**
- DESCRIPTION
- LOCATION
- CATEGORIES
- RRULE (recurrence)
- Custom X-properties

**Example:**
```ical
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//School ERP//Calendar//EN
BEGIN:VEVENT
SUMMARY:Math Exam
DESCRIPTION:Final exam for Mathematics
LOCATION:Room 101
DTSTART:20250130T090000
DTEND:20250130T110000
CATEGORIES:Exam
X-CATEGORY-ID:cat_exam_123
X-VISIBLE-ROLES:ADMIN,TEACHER,STUDENT
END:VEVENT
END:VCALENDAR
```

### CSV Import

**Required Columns:**
- title
- categoryId
- startDate (ISO 8601 format: YYYY-MM-DDTHH:mm:ssZ)
- endDate (ISO 8601 format: YYYY-MM-DDTHH:mm:ssZ)
- visibleToRoles (comma-separated)

**Optional Columns:**
- description
- location
- isAllDay (true/false)
- visibleToClasses (comma-separated IDs)
- visibleToSections (comma-separated IDs)
- isRecurring (true/false)
- recurrenceRule
- exceptionDates (comma-separated ISO dates)
- attachments (comma-separated URLs)

**Example:**
```csv
title,description,categoryId,startDate,endDate,isAllDay,location,visibleToRoles
Math Exam,Final exam,cat_exam_123,2025-01-30T09:00:00Z,2025-01-30T11:00:00Z,false,Room 101,"ADMIN,TEACHER,STUDENT"
Science Fair,Annual event,cat_event_456,2025-02-15T10:00:00Z,2025-02-15T16:00:00Z,false,Main Hall,"ADMIN,TEACHER,STUDENT,PARENT"
```

### JSON Import

**Required Fields:**
- title (string)
- categoryId (string)
- startDate (ISO 8601 string)
- endDate (ISO 8601 string)
- visibleToRoles (array of strings)

**Optional Fields:**
- description (string)
- location (string)
- isAllDay (boolean)
- visibleToClasses (array of strings)
- visibleToSections (array of strings)
- isRecurring (boolean)
- recurrenceRule (string)
- exceptionDates (array of ISO date strings)
- attachments (array of URLs)

**Example:**
```json
[
  {
    "title": "Math Exam",
    "description": "Final exam for Mathematics",
    "categoryId": "cat_exam_123",
    "startDate": "2025-01-30T09:00:00Z",
    "endDate": "2025-01-30T11:00:00Z",
    "isAllDay": false,
    "location": "Room 101",
    "visibleToRoles": ["ADMIN", "TEACHER", "STUDENT"],
    "visibleToClasses": [],
    "visibleToSections": [],
    "isRecurring": false,
    "recurrenceRule": null,
    "exceptionDates": [],
    "attachments": []
  }
]
```

## Category IDs

Before importing events, you need to know the category IDs in your system. You can:

1. Export existing events to see category IDs
2. Check the category management page
3. Use the API to list categories: `GET /api/calendar/categories`

Common categories:
- Holiday
- Exam
- Assignment
- Meeting
- School Event
- Sports Event

## Duplicate Detection

The system automatically detects duplicate events based on:
- Event title (exact match)
- Start date and time (exact match)
- End date and time (exact match)

Duplicate events are **skipped** during import and reported in the import summary.

## Validation Rules

### Required Fields
- ✅ Title must be non-empty
- ✅ Start date must be valid
- ✅ End date must be valid and after start date
- ✅ Category ID must exist in the system
- ✅ At least one visible role must be specified

### Date Formats
- Use ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`
- Example: `2025-01-30T09:00:00Z`
- Timezone: UTC (Z suffix)

### Role Values
Valid roles:
- `ADMIN`
- `TEACHER`
- `STUDENT`
- `PARENT`

## Error Handling

### Import Errors

When importing, you'll receive a detailed summary:

```json
{
  "success": 10,
  "failed": 2,
  "duplicates": 3,
  "errors": [
    {
      "row": 5,
      "field": "startDate",
      "message": "Invalid start date format",
      "data": {...}
    }
  ]
}
```

**Common Errors:**
- Missing required fields
- Invalid date formats
- Category not found
- End date before start date
- Invalid role values

### How to Fix Errors

1. Review the error messages
2. Check the row number indicated
3. Fix the data in your import file
4. Re-import the file

## Best Practices

### Before Importing

1. ✅ **Backup First**: Export existing events before importing
2. ✅ **Validate Data**: Check your import file for errors
3. ✅ **Test Small**: Import a few events first to test
4. ✅ **Check Categories**: Ensure category IDs are correct
5. ✅ **Use Templates**: Start with an exported file as a template

### During Import

1. ✅ **Review Summary**: Check the import summary carefully
2. ✅ **Fix Errors**: Address any validation errors
3. ✅ **Check Duplicates**: Review skipped duplicates
4. ✅ **Verify Results**: Check the calendar after import

### After Import

1. ✅ **Verify Events**: Check that events appear correctly
2. ✅ **Test Visibility**: Ensure events are visible to correct roles
3. ✅ **Check Dates**: Verify dates and times are correct
4. ✅ **Review Recurrence**: Test recurring events if applicable

## API Usage

### Export API

**Endpoint:** `GET /api/calendar/export`

**Query Parameters:**
- `format`: Required. One of: `ical`, `csv`, `json`
- `startDate`: Optional. ISO date string
- `endDate`: Optional. ISO date string
- `categories`: Optional. Comma-separated category IDs
- `includeNotes`: Optional. `true` or `false`
- `includeReminders`: Optional. `true` or `false`

**Example:**
```bash
curl "https://your-school.com/api/calendar/export?format=ical&startDate=2025-01-01&endDate=2025-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o calendar.ics
```

### Import API

**Endpoint:** `POST /api/calendar/import`

**Form Data:**
- `file`: Required. The file to import
- `format`: Required. One of: `ical`, `csv`, `json`

**Example:**
```bash
curl -X POST "https://your-school.com/api/calendar/import" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@calendar.csv" \
  -F "format=csv"
```

**Response:**
```json
{
  "message": "Import completed successfully",
  "result": {
    "success": 10,
    "failed": 0,
    "duplicates": 2,
    "errors": []
  }
}
```

## Troubleshooting

### Import Issues

**Problem:** "Invalid date format"
- **Solution:** Use ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`

**Problem:** "Category not found"
- **Solution:** Export existing events to see valid category IDs

**Problem:** "All events marked as duplicates"
- **Solution:** Check if events already exist with same title and dates

**Problem:** "End date before start date"
- **Solution:** Verify date/time values in your import file

### Export Issues

**Problem:** "No events exported"
- **Solution:** Check date range filters and category filters

**Problem:** "File download fails"
- **Solution:** Check browser settings and popup blockers

## Examples

### Example 1: Bulk Import Holidays

1. Create a CSV file with holidays:
```csv
title,categoryId,startDate,endDate,isAllDay,visibleToRoles
New Year,cat_holiday,2025-01-01T00:00:00Z,2025-01-01T23:59:59Z,true,"ADMIN,TEACHER,STUDENT,PARENT"
Independence Day,cat_holiday,2025-08-15T00:00:00Z,2025-08-15T23:59:59Z,true,"ADMIN,TEACHER,STUDENT,PARENT"
```

2. Import via UI or API
3. Verify holidays appear on calendar

### Example 2: Export and Backup

1. Export all events to JSON:
   - Format: JSON
   - Date range: Full year
   - Include notes: Yes
   - Include reminders: Yes

2. Save file with date: `calendar-backup-2025-01-30.json`

3. Store in secure location

### Example 3: Sync with Google Calendar

1. Export events to iCal format
2. Open Google Calendar
3. Settings → Import & Export
4. Import the .ics file
5. Events appear in Google Calendar

## Support

For additional help:
- Check the API documentation
- Contact system administrator
- Review error messages carefully
- Test with small datasets first

## Related Documentation

- [Calendar System Overview](./ACADEMIC_CALENDAR_SYSTEM_SETUP.md)
- [API Reference](../src/lib/services/import-export-service.README.md)
- [Calendar Service Documentation](../src/lib/services/calendar-service.README.md)
