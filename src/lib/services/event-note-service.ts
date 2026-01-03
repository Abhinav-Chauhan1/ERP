/**
 * Event Note Service
 * 
 * Provides CRUD operations for event notes with privacy controls.
 * Notes are private to the teacher who created them.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { PrismaClient, EventNote } from '@prisma/client';

const prisma = new PrismaClient();

// Types for note creation and updates
export interface CreateEventNoteInput {
  eventId: string;
  userId: string;
  content: string;
}

export interface UpdateEventNoteInput {
  content: string;
}

// Validation errors
export class NoteValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoteValidationError';
  }
}

export class NoteAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoteAuthorizationError';
  }
}

/**
 * Validates note data
 */
function validateNoteData(content: string): void {
  if (!content || content.trim() === '') {
    throw new NoteValidationError('Note content is required');
  }
}

/**
 * Creates a new event note
 * Requirement 9.1: Store the note privately visible only to that teacher
 * Requirement 9.3: Record the creation timestamp
 */
export async function createEventNote(
  data: CreateEventNoteInput
): Promise<EventNote> {
  // Validate input
  validateNoteData(data.content);
  
  // Verify event exists
  const event = await prisma.calendarEvent.findUnique({
    where: { id: data.eventId }
  });
  
  if (!event) {
    throw new NoteValidationError('Event not found');
  }
  
  // Create the note
  const note = await prisma.eventNote.create({
    data: {
      eventId: data.eventId,
      userId: data.userId,
      content: data.content.trim()
    }
  });
  
  return note;
}

/**
 * Gets a note by ID with authorization check
 * Requirement 9.2: Display the notes in the event detail view (only to owner)
 * Requirement 9.4: Note should not affect the original event
 */
export async function getEventNoteById(
  noteId: string,
  userId: string
): Promise<EventNote | null> {
  const note = await prisma.eventNote.findUnique({
    where: { id: noteId }
  });
  
  if (!note) {
    return null;
  }
  
  // Verify the user owns this note
  if (note.userId !== userId) {
    throw new NoteAuthorizationError('You do not have permission to access this note');
  }
  
  return note;
}

/**
 * Gets all notes for an event by a specific user
 * Requirement 9.1: Notes are private to the creator
 */
export async function getEventNotesByUser(
  eventId: string,
  userId: string
): Promise<EventNote[]> {
  return await prisma.eventNote.findMany({
    where: {
      eventId,
      userId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

/**
 * Updates an event note
 * Requirement 9.3: Update the note content and timestamp
 * Requirement 9.5: Maintain note history with creation and modification timestamps
 */
export async function updateEventNote(
  noteId: string,
  userId: string,
  data: UpdateEventNoteInput
): Promise<EventNote> {
  // Validate input
  validateNoteData(data.content);
  
  // Get the existing note and verify ownership
  const existingNote = await getEventNoteById(noteId, userId);
  
  if (!existingNote) {
    throw new NoteValidationError('Note not found');
  }
  
  // Update the note (updatedAt is automatically updated by Prisma)
  const updated = await prisma.eventNote.update({
    where: { id: noteId },
    data: {
      content: data.content.trim()
    }
  });
  
  return updated;
}

/**
 * Deletes an event note
 * Requirement 9.4: Remove the note without affecting the original event
 */
export async function deleteEventNote(
  noteId: string,
  userId: string
): Promise<void> {
  // Verify the note exists and user owns it
  const existingNote = await getEventNoteById(noteId, userId);
  
  if (!existingNote) {
    throw new NoteValidationError('Note not found');
  }
  
  // Delete the note
  await prisma.eventNote.delete({
    where: { id: noteId }
  });
}

/**
 * Gets all notes for an event (admin only - for debugging/audit purposes)
 */
export async function getAllEventNotes(
  eventId: string
): Promise<EventNote[]> {
  return await prisma.eventNote.findMany({
    where: {
      eventId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}
