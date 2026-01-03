# Calendar Preferences API

This API provides endpoints for managing user calendar preferences including view settings, filter preferences, and reminder settings.

## Requirements

Implements Requirement 2.5: User preferences and view persistence

## Endpoints

### GET /api/calendar/preferences

Retrieves the current user's calendar preferences. Creates default preferences if none exist.

**Authentication:** Required

**Response:**
```json
{
  "preferences": {
    "id": "string",
    "userId": "string",
    "defaultView": "month" | "week" | "day" | "agenda",
    "filterSettings": {
      "selectedCategories": ["string"],
      "dateRange": {
        "start": "ISO date string",
        "end": "ISO date string"
      }
    } | null,
    "defaultReminderTime": number,
    "reminderTypes": ["EMAIL" | "SMS" | "PUSH" | "IN_APP"],
    "createdAt": "ISO date string",
    "updatedAt": "ISO date string"
  }
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 404: User not found
- 500: Server error

### PUT /api/calendar/preferences

Updates the current user's calendar preferences.

**Authentication:** Required

**Request Body:**
```json
{
  "defaultView": "month" | "week" | "day" | "agenda",
  "filterSettings": {
    "selectedCategories": ["string"],
    "dateRange": {
      "start": "ISO date string",
      "end": "ISO date string"
    }
  } | null,
  "defaultReminderTime": number,
  "reminderTypes": ["EMAIL" | "SMS" | "PUSH" | "IN_APP"]
}
```

All fields are optional. Only provided fields will be updated.

**Response:**
```json
{
  "preferences": {
    // Same as GET response
  }
}
```

**Status Codes:**
- 200: Success
- 400: Validation error
- 401: Unauthorized
- 404: User not found
- 500: Server error

### PATCH /api/calendar/preferences

Partially updates the current user's calendar preferences. Behaves identically to PUT.

**Authentication:** Required

**Request Body:** Same as PUT

**Response:** Same as PUT

**Status Codes:** Same as PUT

## Default Values

When preferences are created for the first time, the following defaults are used:

- `defaultView`: "month"
- `filterSettings`: null
- `defaultReminderTime`: 1440 (1 day in minutes)
- `reminderTypes`: ["IN_APP"]

## Validation Rules

### defaultView
- Must be one of: "month", "week", "day", "agenda"

### defaultReminderTime
- Must be a non-negative number
- Represents minutes before event

### reminderTypes
- Must be an array of valid reminder types
- Valid types: "EMAIL", "SMS", "PUSH", "IN_APP"

### filterSettings
- Can be null to clear filters
- If provided, must be an object
- `selectedCategories`: Optional array of category IDs
- `dateRange`: Optional object with `start` and `end` ISO date strings
  - `end` must be after `start`

## Examples

### Get Current Preferences

```bash
curl -X GET http://localhost:3000/api/calendar/preferences \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Calendar View

```bash
curl -X PUT http://localhost:3000/api/calendar/preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "defaultView": "week"
  }'
```

### Update Filter Settings

```bash
curl -X PUT http://localhost:3000/api/calendar/preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filterSettings": {
      "selectedCategories": ["cat-1", "cat-2"],
      "dateRange": {
        "start": "2025-01-01",
        "end": "2025-12-31"
      }
    }
  }'
```

### Clear Filter Settings

```bash
curl -X PUT http://localhost:3000/api/calendar/preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filterSettings": null
  }'
```

### Update Reminder Preferences

```bash
curl -X PUT http://localhost:3000/api/calendar/preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "defaultReminderTime": 720,
    "reminderTypes": ["EMAIL", "IN_APP"]
  }'
```

## Service Layer

The API uses the `calendar-preferences-service` for business logic:

- `getUserCalendarPreferences(userId)`: Get or create preferences
- `updateUserCalendarPreferences(userId, data)`: Update preferences
- `validatePreferencesData(data)`: Validate preference data
- `resetUserCalendarPreferences(userId)`: Reset to defaults
- `getUserFilterSettings(userId)`: Get only filter settings
- `updateUserFilterSettings(userId, filterSettings)`: Update only filters
- `clearUserFilterSettings(userId)`: Clear filter settings

## Database Model

Preferences are stored in the `UserCalendarPreferences` model:

```prisma
model UserCalendarPreferences {
  id     String @id @default(cuid())
  userId String @unique

  defaultView String @default("month")
  filterSettings Json?
  defaultReminderTime Int @default(1440)
  reminderTypes String[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@map("user_calendar_preferences")
}
```

## Testing

Tests are located in:
- API tests: `src/app/api/calendar/__tests__/preferences-api.test.ts`
- Service tests: `src/lib/services/__tests__/calendar-preferences-service.test.ts`

Run tests:
```bash
npm test -- src/app/api/calendar/__tests__/preferences-api.test.ts
npm test -- src/lib/services/__tests__/calendar-preferences-service.test.ts
```
