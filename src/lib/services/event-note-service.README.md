# Event Note Service

## Overview

The Event Note Service provides CRUD operations for event notes with strict privacy controls. Notes are private to the teacher who created them and do not affect the original calendar event.

## Requirements Coverage

- **9.1**: Notes are stored privately, visible only to the teacher who created them
- **9.2**: Notes are displayed in the event detail view (only to the owner)
- **9.3**: Note content and timestamps are tracked on creation and updates
- **9.4**: Notes can be deleted without affecting the original event
- **9.5**: Note history is maintained with creation and modification timestamps

## Service Functions

### `createEventNote(data: CreateEventNoteInput): Promise<EventNote>`

Creates a new event note.

**Parameters:**
- `data.eventId`: ID of the calendar event
- `data.userId`: ID of the user creating the note (must be a teacher)
- `data.content`: Note content (required, non-empty)

**Returns:** Created EventNote object

**Throws:**
- `NoteValidationError`: If content is empty or event doesn't exist
- `NoteAuthorizationError`: If user doesn't have permission

**Example:**
```typescript
const note = await createEventNote({
  eventId: 'evt_123',
  userId: 'user_456',
  content: 'Remember to prepare handouts for this exam'
});
```

### `getEventNoteById(noteId: string, userId: string): Promise<EventNote | null>`

Gets a specific note by ID with authorization check.

**Parameters:**
- `noteId`: ID of the note
- `userId`: ID of the requesting user

**Returns:** EventNote object or null if not found

**Throws:**
- `NoteAuthorizationError`: If user doesn't own the note

### `getEventNotesByUser(eventId: string, userId: string): Promise<EventNote[]>`

Gets all notes for an event created by a specific user.

**Parameters:**
- `eventId`: ID of the calendar event
- `userId`: ID of the user

**Returns:** Array of EventNote objects (ordered by creation date, newest first)

### `updateEventNote(noteId: string, userId: string, data: UpdateEventNoteInput): Promise<EventNote>`

Updates an existing note.

**Parameters:**
- `noteId`: ID of the note to update
- `userId`: ID of the requesting user
- `data.content`: New note content

**Returns:** Updated EventNote object

**Throws:**
- `NoteValidationError`: If content is empty or note doesn't exist
- `NoteAuthorizationError`: If user doesn't own the note

**Example:**
```typescript
const updated = await updateEventNote(
  'note_789',
  'user_456',
  { content: 'Updated: Handouts prepared and printed' }
);
```

### `deleteEventNote(noteId: string, userId: string): Promise<void>`

Deletes a note.

**Parameters:**
- `noteId`: ID of the note to delete
- `userId`: ID of the requesting user

**Throws:**
- `NoteValidationError`: If note doesn't exist
- `NoteAuthorizationError`: If user doesn't own the note

**Example:**
```typescript
await deleteEventNote('note_789', 'user_456');
```

## API Endpoints

### POST `/api/calendar/events/:id/notes`

Create a new note for an event.

**Authorization:** Teachers only

**Request Body:**
```json
{
  "content": "Note content here"
}
```

**Response:** 201 Created
```json
{
  "id": "note_123",
  "eventId": "evt_456",
  "userId": "user_789",
  "content": "Note content here",
  "createdAt": "2025-12-25T10:00:00Z",
  "updatedAt": "2025-12-25T10:00:00Z"
}
```

### GET `/api/calendar/events/:id/notes`

Get all notes for an event (only notes created by the requesting user).

**Authorization:** Teachers only

**Response:** 200 OK
```json
[
  {
    "id": "note_123",
    "eventId": "evt_456",
    "userId": "user_789",
    "content": "Note content here",
    "createdAt": "2025-12-25T10:00:00Z",
    "updatedAt": "2025-12-25T10:00:00Z"
  }
]
```

### PUT `/api/calendar/events/:id/notes/:noteId`

Update a note.

**Authorization:** Note owner only

**Request Body:**
```json
{
  "content": "Updated note content"
}
```

**Response:** 200 OK
```json
{
  "id": "note_123",
  "eventId": "evt_456",
  "userId": "user_789",
  "content": "Updated note content",
  "createdAt": "2025-12-25T10:00:00Z",
  "updatedAt": "2025-12-25T11:00:00Z"
}
```

### DELETE `/api/calendar/events/:id/notes/:noteId`

Delete a note.

**Authorization:** Note owner only

**Response:** 200 OK
```json
{
  "message": "Note deleted successfully"
}
```

## Privacy and Security

1. **Note Privacy**: Notes are strictly private to the teacher who created them. Other users cannot see or access these notes.

2. **Authorization Checks**: All operations verify that the requesting user owns the note before allowing access or modifications.

3. **Teacher-Only Access**: Only users with the TEACHER role can create, view, update, or delete notes.

4. **Event Independence**: Deleting a note does not affect the original calendar event or its visibility to other users.

## Error Handling

### NoteValidationError (400 Bad Request)
- Empty or missing note content
- Event not found
- Note not found

### NoteAuthorizationError (403 Forbidden)
- User doesn't own the note
- User is not a teacher

### Authentication Error (401 Unauthorized)
- User is not authenticated

## Database Schema

```prisma
model EventNote {
  id      String        @id @default(cuid())
  event   CalendarEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  eventId String
  userId  String        // Teacher who created the note
  content String        @db.Text

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([eventId, userId])
  @@index([userId])
  @@map("event_notes")
}
```

## Usage Example

```typescript
import {
  createEventNote,
  getEventNotesByUser,
  updateEventNote,
  deleteEventNote
} from '@/lib/services/event-note-service';

// Create a note
const note = await createEventNote({
  eventId: 'evt_123',
  userId: 'user_456',
  content: 'Prepare exam papers'
});

// Get all notes for an event by a user
const notes = await getEventNotesByUser('evt_123', 'user_456');

// Update a note
const updated = await updateEventNote(
  note.id,
  'user_456',
  { content: 'Exam papers prepared' }
);

// Delete a note
await deleteEventNote(note.id, 'user_456');
```

## Testing

The service includes comprehensive error handling and validation:

1. **Content Validation**: Ensures note content is not empty
2. **Event Validation**: Verifies the event exists before creating a note
3. **Authorization**: Checks user ownership before any operation
4. **Timestamps**: Automatically tracks creation and modification times
5. **Cascade Deletion**: Notes are automatically deleted when the parent event is deleted
