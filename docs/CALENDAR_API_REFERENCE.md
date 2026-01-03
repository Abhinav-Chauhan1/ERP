# Academic Calendar System - API Reference

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Calendar Events API](#calendar-events-api)
4. [Event Categories API](#event-categories-api)
5. [Event Notes API](#event-notes-api)
6. [User Preferences API](#user-preferences-api)
7. [Import/Export API](#importexport-api)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [Examples](#examples)

---

## Overview

The Academic Calendar API provides programmatic access to calendar events, categories, notes, and preferences. All endpoints require authentication and implement role-based access control.

**Base URL**: `https://your-school-erp.com/api/calendar`

**API Version**: v1

**Content Type**: `application/json`

**Authentication**: Clerk JWT tokens via cookies or Authorization header

---

## Authentication

All API requests require authentication using Clerk session tokens.

### Authentication Methods

**1. Cookie-based (Browser)**
```javascript
// Automatic with Clerk session
fetch('/api/calendar/events')
```

**2. Token-based (API)**
```javascript
fetch('/api/calendar/events', {
  headers: {
    'Authorization': 'Bearer YOUR_CLERK_TOKEN'
  }
})
```

### Authorization Levels

- **Admin**: Full access to all endpoints
- **Teacher**: Read access + note management
- **Student**: Read access (filtered by visibility)
- **Parent**: Read access (filtered by children's visibility)

---

## Calendar Events API

### List Events

Retrieve calendar events with filtering and pagination.

**Endpoint**: `GET /api/calendar/events`

**Authorization**: All authenticated users

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | ISO 8601 Date | No | Filter events starting from this date |
| `endDate` | ISO 8601 Date | No | Filter events ending before this date |
| `categories` | string[] | No | Filter by category IDs (comma-separated) |
| `classId` | string | No | Filter by class ID |
| `sectionId` | string | No | Filter by section ID |
| `search` | string | No | Search in title, description, location |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 50, max: 100) |

**Response**: `200 OK`

```json
{
  "events": [
    {
      "id": "evt_123abc",
      "title": "Mathematics Final Exam",
      "description": "Final examination for Mathematics",
      "category": {
        "id": "cat_exam",
        "name": "Exam",
        "color": "#F59E0B",
        "icon": "file-text"
      },
      "startDate": "2025-06-15T09:00:00Z",
      "endDate": "2025-06-15T11:00:00Z",
      "isAllDay": false,
      "location": "Room 101",
      "visibleToRoles": ["STUDENT", "TEACHER", "PARENT"],
      "visibleToClasses": ["cls_10a"],
      "visibleToSections": ["sec_a"],
      "sourceType": "EXAM",
      "sourceId": "exam_456",
      "isRecurring": false,
      "attachments": [],
      "createdBy": "user_admin",
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

**Example Request**:
```bash
curl -X GET "https://your-school-erp.com/api/calendar/events?startDate=2025-06-01&endDate=2025-06-30&categories=cat_exam,cat_assignment" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Create Event

Create a new calendar event (Admin only).

**Endpoint**: `POST /api/calendar/events`

**Authorization**: Admin only

**Request Body**:

```json
{
  "title": "School Sports Day",
  "description": "Annual sports competition",
  "categoryId": "cat_sports",
  "startDate": "2025-07-20T08:00:00Z",
  "endDate": "2025-07-20T16:00:00Z",
  "isAllDay": false,
  "location": "School Playground",
  "visibleToRoles": ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
  "visibleToClasses": [],
  "visibleToSections": [],
  "isRecurring": false,
  "attachments": ["https://cloudinary.com/file1.pdf"]
}
```

**Recurring Event Example**:
```json
{
  "title": "Weekly Assembly",
  "categoryId": "cat_school_event",
  "startDate": "2025-01-06T09:00:00Z",
  "endDate": "2025-01-06T09:30:00Z",
  "isRecurring": true,
  "recurrenceRule": "FREQ=WEEKLY;BYDAY=MO;UNTIL=20251231",
  "visibleToRoles": ["ADMIN", "TEACHER", "STUDENT"]
}
```

**Response**: `201 Created`

```json
{
  "event": {
    "id": "evt_789xyz",
    "title": "School Sports Day",
    // ... full event object
  }
}
```

**Errors**:
- `400 Bad Request`: Missing required fields or invalid data
- `403 Forbidden`: User is not admin
- `404 Not Found`: Category not found

---

### Get Single Event

Retrieve details of a specific event.

**Endpoint**: `GET /api/calendar/events/:id`

**Authorization**: Users with visibility access

**Response**: `200 OK`

```json
{
  "event": {
    "id": "evt_123abc",
    "title": "Mathematics Final Exam",
    // ... full event object with notes (if teacher)
    "notes": [
      {
        "id": "note_1",
        "content": "Prepare answer sheets",
        "userId": "teacher_1",
        "createdAt": "2025-06-01T10:00:00Z",
        "updatedAt": "2025-06-01T10:00:00Z"
      }
    ]
  }
}
```

**Errors**:
- `404 Not Found`: Event not found or user doesn't have access

---

### Update Event

Update an existing calendar event (Admin only).

**Endpoint**: `PUT /api/calendar/events/:id`

**Authorization**: Admin only

**Query Parameters** (for recurring events):

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `updateType` | string | No | `single`, `future`, or `all` (default: `single`) |

**Request Body**: Same as Create Event

**Response**: `200 OK`

```json
{
  "event": {
    "id": "evt_123abc",
    // ... updated event object
  },
  "updatedCount": 1  // Number of instances updated (for recurring events)
}
```

**Errors**:
- `400 Bad Request`: Invalid data
- `403 Forbidden`: User is not admin
- `404 Not Found`: Event not found

---

### Delete Event

Delete a calendar event (Admin only).

**Endpoint**: `DELETE /api/calendar/events/:id`

**Authorization**: Admin only

**Query Parameters** (for recurring events):

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `deleteType` | string | No | `single`, `future`, or `all` (default: `single`) |

**Response**: `200 OK`

```json
{
  "message": "Event deleted successfully",
  "deletedCount": 1
}
```

**Errors**:
- `403 Forbidden`: User is not admin
- `404 Not Found`: Event not found

---

## Event Categories API

### List Categories

Retrieve all event categories.

**Endpoint**: `GET /api/calendar/categories`

**Authorization**: All authenticated users

**Response**: `200 OK`

```json
{
  "categories": [
    {
      "id": "cat_holiday",
      "name": "Holiday",
      "description": "School holidays and breaks",
      "color": "#EF4444",
      "icon": "calendar-off",
      "isActive": true,
      "order": 1,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### Create Category

Create a new event category (Admin only).

**Endpoint**: `POST /api/calendar/categories`

**Authorization**: Admin only

**Request Body**:

```json
{
  "name": "Parent Workshop",
  "description": "Workshops for parents",
  "color": "#6366F1",
  "icon": "users",
  "order": 7
}
```

**Response**: `201 Created`

```json
{
  "category": {
    "id": "cat_workshop",
    "name": "Parent Workshop",
    // ... full category object
  }
}
```

**Errors**:
- `400 Bad Request`: Category name already exists
- `403 Forbidden`: User is not admin

---

### Update Category

Update an existing category (Admin only).

**Endpoint**: `PUT /api/calendar/categories/:id`

**Authorization**: Admin only

**Request Body**: Same as Create Category

**Response**: `200 OK`

```json
{
  "category": {
    "id": "cat_workshop",
    // ... updated category object
  }
}
```

---

### Delete Category

Delete a category and reassign its events (Admin only).

**Endpoint**: `DELETE /api/calendar/categories/:id`

**Authorization**: Admin only

**Request Body**:

```json
{
  "replacementCategoryId": "cat_school_event"
}
```

**Response**: `200 OK`

```json
{
  "message": "Category deleted and events reassigned",
  "eventsReassigned": 15
}
```

**Errors**:
- `400 Bad Request`: Missing replacement category when events exist
- `404 Not Found`: Category or replacement category not found

---

## Event Notes API

### Create Note

Add a personal note to an event (Teachers only).

**Endpoint**: `POST /api/calendar/events/:eventId/notes`

**Authorization**: Teachers only

**Request Body**:

```json
{
  "content": "Remember to bring extra answer sheets"
}
```

**Response**: `201 Created`

```json
{
  "note": {
    "id": "note_123",
    "eventId": "evt_456",
    "userId": "teacher_1",
    "content": "Remember to bring extra answer sheets",
    "createdAt": "2025-06-01T10:00:00Z",
    "updatedAt": "2025-06-01T10:00:00Z"
  }
}
```

---

### Update Note

Update an existing note (Note owner only).

**Endpoint**: `PUT /api/calendar/events/:eventId/notes/:noteId`

**Authorization**: Note owner only

**Request Body**:

```json
{
  "content": "Updated note content"
}
```

**Response**: `200 OK`

---

### Delete Note

Delete a note (Note owner only).

**Endpoint**: `DELETE /api/calendar/events/:eventId/notes/:noteId`

**Authorization**: Note owner only

**Response**: `200 OK`

```json
{
  "message": "Note deleted successfully"
}
```

---

## User Preferences API

### Get Preferences

Retrieve user's calendar preferences.

**Endpoint**: `GET /api/calendar/preferences`

**Authorization**: All authenticated users

**Response**: `200 OK`

```json
{
  "preferences": {
    "userId": "user_123",
    "defaultView": "month",
    "filterSettings": {
      "selectedCategories": ["cat_exam", "cat_assignment"],
      "showWeekends": true
    },
    "reminderSettings": {
      "defaultReminderTime": "1_DAY_BEFORE",
      "reminderMethods": ["EMAIL", "IN_APP"],
      "categoryReminders": {
        "cat_exam": "1_WEEK_BEFORE",
        "cat_assignment": "1_DAY_BEFORE"
      }
    }
  }
}
```

---

### Update Preferences

Update user's calendar preferences.

**Endpoint**: `PUT /api/calendar/preferences`

**Authorization**: All authenticated users

**Request Body**:

```json
{
  "defaultView": "week",
  "filterSettings": {
    "selectedCategories": ["cat_exam"],
    "showWeekends": false
  }
}
```

**Response**: `200 OK`

---

### Partial Update Preferences

Partially update preferences (PATCH).

**Endpoint**: `PATCH /api/calendar/preferences`

**Authorization**: All authenticated users

**Request Body**:

```json
{
  "defaultView": "agenda"
}
```

**Response**: `200 OK`

---

## Import/Export API

### Import Events

Import calendar events from file (Admin only).

**Endpoint**: `POST /api/calendar/import`

**Authorization**: Admin only

**Content Type**: `multipart/form-data`

**Request Body**:

```
file: [iCal/CSV/JSON file]
format: "ical" | "csv" | "json"
```

**Response**: `200 OK`

```json
{
  "summary": {
    "totalProcessed": 100,
    "successCount": 95,
    "duplicateCount": 3,
    "errorCount": 2,
    "errors": [
      {
        "row": 15,
        "error": "Invalid date format"
      },
      {
        "row": 42,
        "error": "Missing required field: title"
      }
    ]
  }
}
```

**Errors**:
- `400 Bad Request`: Invalid file format or data
- `403 Forbidden`: User is not admin

---

### Export Events

Export calendar events to file (Admin only).

**Endpoint**: `GET /api/calendar/export`

**Authorization**: Admin only

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `format` | string | Yes | `ical`, `csv`, or `json` |
| `startDate` | ISO 8601 Date | No | Export events from this date |
| `endDate` | ISO 8601 Date | No | Export events until this date |
| `categories` | string[] | No | Filter by category IDs |

**Response**: `200 OK`

- Content-Type: `text/calendar` (iCal), `text/csv` (CSV), or `application/json` (JSON)
- Content-Disposition: `attachment; filename="calendar-export.ics"`

**Example Request**:
```bash
curl -X GET "https://your-school-erp.com/api/calendar/export?format=ical&startDate=2025-01-01&endDate=2025-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o calendar.ics
```

---

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Common Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication required |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `INVALID_INPUT` | Invalid request data |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `DUPLICATE_RESOURCE` | Resource already exists |
| `VALIDATION_ERROR` | Data validation failed |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

---

## Rate Limiting

### Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Event Creation | 100 requests | 1 hour |
| Event Queries | 1000 requests | 1 hour |
| Import Operations | 10 requests | 1 hour |
| Export Operations | 20 requests | 1 hour |
| Other Operations | 500 requests | 1 hour |

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded Response

```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 3600
}
```

---

## Examples

### Example 1: Fetch Upcoming Exams

```javascript
const response = await fetch('/api/calendar/events?' + new URLSearchParams({
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  categories: 'cat_exam'
}));

const { events } = await response.json();
console.log('Upcoming exams:', events);
```

### Example 2: Create Recurring Event

```javascript
const response = await fetch('/api/calendar/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Weekly Staff Meeting',
    categoryId: 'cat_meeting',
    startDate: '2025-01-06T14:00:00Z',
    endDate: '2025-01-06T15:00:00Z',
    isRecurring: true,
    recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO;COUNT=52',
    visibleToRoles: ['ADMIN', 'TEACHER']
  })
});

const { event } = await response.json();
console.log('Created recurring event:', event);
```

### Example 3: Search Events

```javascript
const response = await fetch('/api/calendar/events?' + new URLSearchParams({
  search: 'mathematics',
  startDate: '2025-06-01',
  endDate: '2025-06-30'
}));

const { events } = await response.json();
console.log('Mathematics events in June:', events);
```

### Example 4: Export Calendar

```javascript
const response = await fetch('/api/calendar/export?' + new URLSearchParams({
  format: 'ical',
  startDate: '2025-01-01',
  endDate: '2025-12-31'
}));

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'calendar-2025.ics';
a.click();
```

### Example 5: Add Personal Note

```javascript
const response = await fetch('/api/calendar/events/evt_123/notes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Prepare study materials for this exam'
  })
});

const { note } = await response.json();
console.log('Note added:', note);
```

---

*Last Updated: December 2025*
*API Version: 1.0*
