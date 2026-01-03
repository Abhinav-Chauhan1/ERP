# Calendar Import/Export Service

This service provides functionality to import and export calendar events in multiple formats: iCal (.ics), CSV, and JSON.

## Features

- **Import**: Import calendar events from iCal, CSV, or JSON files
- **Export**: Export calendar events to iCal, CSV, or JSON formats
- **Validation**: Comprehensive validation of imported data
- **Duplicate Detection**: Automatically detects and skips duplicate events
- **Error Reporting**: Detailed error messages for failed imports
- **Format Support**: Full support for all event fields including recurrence rules

## Import Formats

### iCal (.ics)

Standard calendar format compatible with Google Calendar, Outlook, and other calendar applications.

**Supported Fields:**
- SUMMARY (title)
- DESCRIPTION
- LOCATION
- DTSTART (start date/time)
- DTEND (end date/time)
- CATEGORIES (category name)
- RRULE (recurrence rule)
- Custom X-properties for extended fields

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
X-CATEGORY-ID:cat_123
X-VISIBLE-ROLES:ADMIN,TEACHER,STUDENT
X-VISIBLE-CLASSES:class_456
X-VISIBLE-SECTIONS:section_789
END:VEVENT
END:VCALENDAR
```

### CSV

Spreadsheet format for easy editing in Excel or Google Sheets.

**Required Columns:**
- title
- categoryId
- startDate (ISO 8601 format)
- endDate (ISO 8601 format)
- visibleToRoles (comma-separated)

**Optional Columns:**
- description
- location
- isAllDay (true/false)
- visibleToClasses (comma-separated)
- visibleToSections (comma-separated)
- isRecurring (true/false)
- recurrenceRule
- exceptionDates (comma-separated ISO dates)
- attachments (comma-separated URLs)

**Example:**
```csv
title,description,categoryId,startDate,endDate,isAllDay,location,visibleToRoles,visibleToClasses
Math Exam,Final exam,cat_123,2025-01-30T09:00:00Z,2025-01-30T11:00:00Z,false,Room 101,ADMIN,TEACHER,STUDENT,class_456
```

### JSON

Structured format for programmatic access.

**Example:**
```json
[
  {
    "title": "Math Exam",
    "description": "Final exam for Mathematics",
    "categoryId": "cat_123",
    "startDate": "2025-01-30T09:00:00Z",
    "endDate": "2025-01-30T11:00:00Z",
    "isAllDay": false,
    "location": "Room 101",
    "visibleToRoles": ["ADMIN", "TEACHER", "STUDENT"],
    "visibleToClasses": ["class_456"],
    "visibleToSections": ["section_789"],
    "isRecurring": false,
    "recurrenceRule": null,
    "exceptionDates": [],
    "attachments": []
  }
]
```

## Export Formats

All export formats include the same comprehensive event data:
- Event details (title, description, location)
- Date and time information
- Category information
- Visibility settings
- Recurrence rules
- Attachments
- Source information
- Metadata (created by, created at)

## API Usage

### Import Events

**Endpoint:** `POST /api/calendar/import`

**Request:**
```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('format', 'ical'); // or 'csv', 'json'

const response = await fetch('/api/calendar/import', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

**Response:**
```json
{
  "message": "Import completed successfully",
  "result": {
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
}
```

### Export Events

**Endpoint:** `GET /api/calendar/export`

**Query Parameters:**
- `format`: 'ical', 'csv', or 'json' (required)
- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)
- `categories`: Comma-separated category IDs (optional)
- `includeNotes`: 'true' or 'false' (optional)
- `includeReminders`: 'true' or 'false' (optional)

**Example:**
```typescript
const params = new URLSearchParams({
  format: 'ical',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  categories: 'cat_123,cat_456'
});

const response = await fetch(`/api/calendar/export?${params}`);
const blob = await response.blob();
// Download the file
```

## Service Functions

### Import Functions

#### `importCalendarEvents(content: string, format: ImportFormat, createdBy: string): Promise<ImportResult>`

Imports calendar events from a string content.

**Parameters:**
- `content`: File content as string
- `format`: 'ical', 'csv', or 'json'
- `createdBy`: User ID of the importer

**Returns:**
```typescript
{
  success: number;      // Number of successfully imported events
  failed: number;       // Number of failed imports
  duplicates: number;   // Number of duplicate events skipped
  errors: ImportError[]; // Detailed error information
}
```

#### `validateImportFormat(content: string, format: ImportFormat): void`

Validates the format of import content. Throws an error if invalid.

#### `isDuplicateEvent(title: string, startDate: Date, endDate: Date): Promise<boolean>`

Checks if an event with the same title and dates already exists.

### Export Functions

#### `exportCalendarEvents(options: ExportOptions): Promise<string>`

Exports calendar events to the specified format.

**Parameters:**
```typescript
{
  format: 'ical' | 'csv' | 'json';
  startDate?: Date;
  endDate?: Date;
  categoryIds?: string[];
  includeNotes?: boolean;
  includeReminders?: boolean;
}
```

**Returns:** String content in the requested format

#### `exportToICalFormat(events: CalendarEvent[]): Promise<string>`

Exports events to iCal format.

#### `exportToCSVFormat(events: CalendarEvent[]): Promise<string>`

Exports events to CSV format.

#### `exportToJSONFormat(events: CalendarEvent[]): Promise<string>`

Exports events to JSON format.

## Error Handling

### Import Errors

The service provides detailed error information for failed imports:

1. **Format Validation Errors**: Invalid file format or structure
2. **Data Validation Errors**: Missing required fields, invalid dates, etc.
3. **Category Errors**: Referenced category doesn't exist
4. **Duplicate Events**: Events with matching title and dates

Each error includes:
- `row`: Row number where the error occurred
- `field`: Field that caused the error (if applicable)
- `message`: Human-readable error message
- `data`: The problematic event data (for debugging)

### Export Errors

Export operations may fail due to:
- Invalid date ranges
- Database connection issues
- Format generation errors

All errors are caught and returned with appropriate HTTP status codes.

## Duplicate Detection

The service automatically detects duplicate events based on:
- Event title (exact match)
- Start date and time (exact match)
- End date and time (exact match)

Duplicate events are skipped during import and counted in the result.

## Validation Rules

### Required Fields
- title (non-empty string)
- startDate (valid date)
- endDate (valid date, must be after startDate)
- categoryId (must exist in database)
- visibleToRoles (at least one role)

### Optional Fields
- description
- location
- isAllDay (defaults to false)
- visibleToClasses
- visibleToSections
- isRecurring (defaults to false)
- recurrenceRule (validated if provided)
- exceptionDates
- attachments

## Best Practices

1. **Validate Before Import**: Check file format and structure before uploading
2. **Use Category IDs**: Always use valid category IDs from your system
3. **Date Formats**: Use ISO 8601 format for dates (YYYY-MM-DDTHH:mm:ssZ)
4. **Batch Imports**: For large imports, consider breaking into smaller batches
5. **Error Review**: Always review import errors and fix data before retrying
6. **Export Filters**: Use date range and category filters to export only needed events
7. **Backup Before Import**: Export existing events before importing new ones

## Examples

### Import from CSV

```typescript
import { importCalendarEvents } from '@/lib/services/import-export-service';

const csvContent = `
title,categoryId,startDate,endDate,visibleToRoles
Math Exam,cat_123,2025-01-30T09:00:00Z,2025-01-30T11:00:00Z,"ADMIN,TEACHER,STUDENT"
Science Fair,cat_456,2025-02-15T10:00:00Z,2025-02-15T16:00:00Z,"ADMIN,TEACHER,STUDENT,PARENT"
`;

const result = await importCalendarEvents(csvContent, 'csv', 'user_123');
console.log(`Imported ${result.success} events, ${result.failed} failed, ${result.duplicates} duplicates`);
```

### Export to iCal

```typescript
import { exportCalendarEvents } from '@/lib/services/import-export-service';

const icalContent = await exportCalendarEvents({
  format: 'ical',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31'),
  categoryIds: ['cat_123', 'cat_456']
});

// Save to file or send as download
```

## Requirements Mapping

- **Requirement 6.1**: Export to iCal, CSV, JSON formats ✓
- **Requirement 6.2**: Validate file format and data integrity ✓
- **Requirement 6.3**: Prevent duplicate events ✓
- **Requirement 6.4**: Detailed error messages ✓
- **Requirement 6.5**: Include all event fields in export ✓
