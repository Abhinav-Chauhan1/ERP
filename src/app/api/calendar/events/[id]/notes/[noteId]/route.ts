/**
 * Individual Event Note API Endpoints
 * 
 * PUT /api/calendar/events/:id/notes/:noteId - Update a note
 * DELETE /api/calendar/events/:id/notes/:noteId - Delete a note
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  updateEventNote,
  deleteEventNote,
  NoteValidationError,
  NoteAuthorizationError
} from '@/lib/services/event-note-service';

/**
 * PUT /api/calendar/events/:id/notes/:noteId
 * Update an event note
 * 
 * Authorization: Note owner only
 * Requirement 9.3: Update the note content and timestamp
 * Requirement 9.5: Maintain note history with creation and modification timestamps
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; noteId: string }> }) {
  try {
    // Await params
    const { id, noteId } = await params;
    
    // Authenticate user
    const session = await auth();
const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get user from database
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { teacher: true }
    });
    
    if (!user || !user.teacher) {
      return NextResponse.json(
        { error: 'Only teachers can update event notes' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { content } = body;
    
    if (!content) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      );
    }
    
    // Update the note (authorization check is done in the service)
    const note = await updateEventNote(
      noteId,
      user.id,
      { content }
    );
    
    return NextResponse.json(note, { status: 200 });
    
  } catch (error) {
    console.error('Error updating event note:', error);
    
    if (error instanceof NoteValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    if (error instanceof NoteAuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update event note' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/calendar/events/:id/notes/:noteId
 * Delete an event note
 * 
 * Authorization: Note owner only
 * Requirement 9.4: Remove the note without affecting the original event
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; noteId: string }> }) {
  try {
    // Await params
    const { id, noteId } = await params;
    
    // Authenticate user
    const session = await auth();
const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get user from database
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { teacher: true }
    });
    
    if (!user || !user.teacher) {
      return NextResponse.json(
        { error: 'Only teachers can delete event notes' },
        { status: 403 }
      );
    }
    
    // Delete the note (authorization check is done in the service)
    await deleteEventNote(noteId, user.id);
    
    return NextResponse.json(
      { message: 'Note deleted successfully' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error deleting event note:', error);
    
    if (error instanceof NoteValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    if (error instanceof NoteAuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete event note' },
      { status: 500 }
    );
  }
}
