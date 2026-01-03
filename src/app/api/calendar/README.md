# Calendar API Endpoints

This directory contains the API endpoints for the Academic Calendar System.

## Endpoints

### GET /api/calendar/events

Retrieves calendar events with filtering and pagination. Applies role-based visibility filtering automatically.

**Query Parameters:**
- `startDate` (optional): ISO date string - Filter events starting from this date
- `endDate` (optional): ISO date string - Filter events ending before this date
- `categories` (optional): Comma-separated category IDs - Filter by event categories
- `search` (optional): Search term - Search in title, description, and location
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response:**
```json
{
  "events": [
    {
      "id": "event-id",
      "title": "Event Title",
      "description": "Event description",
      "category": {
        "id": "cat-id",
        "name": "Category Name",
        "color": "#FF5733"
      },
      "startDate": "2025-12-25T00:00:00.000Z",
      "endDate": "2025-12-25T23:59:59.000Z",
      "isAllDay": true,
      "location": "School Hall",
      "visibleToRoles": ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
      "visibleToClasses": [],
      "visibleToSections": [],
      "attachments": [],
      "notes": [],
      "reminders": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

**Requirements:** 1.2, 2.1, 3.1, 4.1

---

### POST /api/calendar/events

Creates a new calendar event. **Admin-only operation.**

**Request Body:**
```json
{
  "title": "Event Title",
  "description": "Event description",
  "categoryId": "category-id",
  "startDate": "2025-12-25T10:00:00.000Z",
  "endDate": "2025-12-25T11:00:00.000Z",
  "isAllDay": false,
  "location": "Conference Room",
  "visibleToRoles": ["TEACHER", "STUDENT"],
  "visibleToClasses": ["class-id-1", "class-id-2"],
  "visibleToSections": ["section-id-1"],
  "isRecurring": false,
  "recurrenceRule": null,
  "exceptionDates": [],
  "attachments": []
}
```

**Response:**
```json
{
  "event": {
    "id": "new-event-id",
    "title": "Event Title",
    ...
  }
}
```

**Requirements:** 1.1

---

### GET /api/calendar/events/:id

Retrieves a single calendar event by ID. Checks visibility permissions before returning.

**Response:**
```json
{
  "event": {
    "id": "event-id",
    "title": "Event Title",
    ...
  }
}
```

**Requirements:** 3.5

---

### PUT /api/calendar/events/:id

Updates a calendar event. **Admin-only operation.**

**Query Parameters:**
- `updateType` (optional): 'single' | 'future' | 'all' (default: 'single')
  - `single`: Update only this instance
  - `future`: Update this and all future instances
  - `all`: Update all instances of a recurring event

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "startDate": "2025-12-26T10:00:00.000Z",
  "endDate": "2025-12-26T11:00:00.000Z"
}
```

**Response:**
```json
{
  "event": {
    "id": "event-id",
    "title": "Updated Title",
    ...
  }
}
```

**Requirements:** 1.4

---

### DELETE /api/calendar/events/:id

Deletes a calendar event. **Admin-only operation.**

**Query Parameters:**
- `deleteType` (optional): 'single' | 'future' | 'all' (default: 'single')
  - `single`: Delete only this instance
  - `future`: Delete this and all future instances
  - `all`: Delete all instances of a recurring event

**Response:**
```json
{
  "message": "Event deleted successfully"
}
```

**Requirements:** 1.5

---

### GET /api/calendar/categories

Retrieves all event categories.

**Query Parameters:**
- `includeInactive` (optional): boolean - Include inactive categories (default: false)

**Response:**
```json
{
  "categories": [
    {
      "id": "category-id",
      "name": "Holiday",
      "description": "School holidays and breaks",
      "color": "#EF4444",
      "icon": "Calendar",
      "isActive": true,
      "order": 0,
      "createdAt": "2025-12-25T00:00:00.000Z",
      "updatedAt": "2025-12-25T00:00:00.000Z",
      "_count": {
        "events": 5
      }
    }
  ]
}
```

**Requirements:** 8.1, 8.2

---

### POST /api/calendar/categories

Creates a new event category. **Admin-only operation.**

**Request Body:**
```json
{
  "name": "Holiday",
  "description": "School holidays and breaks",
  "color": "#EF4444",
  "icon": "Calendar",
  "isActive": true,
  "order": 0
}
```

**Response:**
```json
{
  "category": {
    "id": "new-category-id",
    "name": "Holiday",
    "description": "School holidays and breaks",
    "color": "#EF4444",
    "icon": "Calendar",
    "isActive": true,
    "order": 0,
    "createdAt": "2025-12-25T00:00:00.000Z",
    "updatedAt": "2025-12-25T00:00:00.000Z"
  }
}
```

**Requirements:** 8.1

---

### GET /api/calendar/categories/:id

Retrieves a single event category by ID.

**Response:**
```json
{
  "category": {
    "id": "category-id",
    "name": "Holiday",
    "description": "School holidays and breaks",
    "color": "#EF4444",
    "icon": "Calendar",
    "isActive": true,
    "order": 0,
    "createdAt": "2025-12-25T00:00:00.000Z",
    "updatedAt": "2025-12-25T00:00:00.000Z",
    "_count": {
      "events": 5
    }
  }
}
```

**Requirements:** 8.1

---

### PUT /api/calendar/categories/:id

Updates an event category. **Admin-only operation.**

**Request Body:**
```json
{
  "name": "Updated Holiday",
  "description": "Updated description",
  "color": "#3B82F6",
  "icon": "CalendarDays",
  "isActive": true,
  "order": 1
}
```

**Response:**
```json
{
  "category": {
    "id": "category-id",
    "name": "Updated Holiday",
    "description": "Updated description",
    "color": "#3B82F6",
    "icon": "CalendarDays",
    "isActive": true,
    "order": 1,
    "createdAt": "2025-12-25T00:00:00.000Z",
    "updatedAt": "2025-12-25T12:00:00.000Z"
  }
}
```

**Requirements:** 8.2, 8.3

---

### DELETE /api/calendar/categories/:id

Deletes an event category. **Admin-only operation.**

If the category has events, a replacement category must be provided to reassign those events.

**Request Body:**
```json
{
  "replacementCategoryId": "replacement-category-id"
}
```

**Response:**
```json
{
  "message": "Category deleted successfully"
}
```

**Requirements:** 8.4

---

## Authorization

- **GET /api/calendar/events**: All authenticated users
- **GET /api/calendar/events/:id**: All authenticated users (with visibility check)
- **POST /api/calendar/events**: Admin only
- **PUT /api/calendar/events/:id**: Admin only
- **DELETE /api/calendar/events/:id**: Admin only
- **GET /api/calendar/categories**: All authenticated users
- **GET /api/calendar/categories/:id**: All authenticated users
- **POST /api/calendar/categories**: Admin only
- **PUT /api/calendar/categories/:id**: Admin only
- **DELETE /api/calendar/categories/:id**: Admin only

## Visibility Rules

Events are filtered based on user roles and relationships:

1. **Admin**: Can see all events
2. **Teacher**: Can see:
   - All school-wide events
   - Exams for subjects they teach
   - Assignments they created
   - Meetings they are invited to
   - Events marked visible to teachers

3. **Student**: Can see:
   - All school-wide events
   - Exams for their enrolled subjects
   - Assignments for their class
   - Events for their class/section
   - Events marked visible to students

4. **Parent**: Can see:
   - All school-wide events
   - All events visible to their children
   - Parent-teacher meetings for their children
   - Events marked visible to parents

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions. Admin access required."
}
```

### 404 Not Found
```json
{
  "error": "Event not found"
}
```

### 400 Bad Request
```json
{
  "error": "Title is required"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to fetch calendar events"
}
```

## Testing

Run the test suite:
```bash
npm run test -- src/app/api/calendar/__tests__/calendar-api.test.ts --run
```

The test suite covers:
- Authentication and authorization
- Event creation, retrieval, update, and deletion
- Filtering and pagination
- Visibility rules
- Error handling
- Recurring event operations
