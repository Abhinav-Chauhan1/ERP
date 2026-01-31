/**
 * Event Notes API Endpoints
 * 
 * POST /api/calendar/events/:id/notes - Create a new note
 * Includes security measures: rate limiting, input sanitization, audit logging.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 * Security Requirements: Rate limiting, input sanitization, audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  createEventNote,
  getEventNotesByUser,
  NoteValidationError,
  NoteAuthorizationError
} from '@/lib/services/event-note-service';
import {
  checkCalendarRateLimit,
  sanitizeNoteData,
  createRateLimitError,
} from '@/lib/utils/calendar-security';
import { logCreate } from '@/lib/utils/audit-log';

/**
 * POST /api/calendar/events/:id/notes
 * Create a new event note
 * 
 * Authorization: Teachers only
 * Requirement 9.1: Store the note privately visible only to that teacher
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params
    const { id } = await params;
    
    // Apply rate limiting
    const rateLimitResult = await checkCalendarRateLimit(request, 'EVENT_CREATE');
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult.limit, rateLimitResult.reset),
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          },
        }
      );
    }

    // Authenticate user
    const session = await auth();
const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get user role from database
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        teacher: true,
        userSchools: {
          where: { isActive: true },
          include: { school: true }
        }
      }
    });
    
    if (!user || !user.teacher) {
      return NextResponse.json(
        { error: 'Only teachers can create event notes' },
        { status: 403 }
      );
    }

    // Get the user's school
    const userSchool = user.userSchools[0];
    if (!userSchool) {
      return NextResponse.json(
        { error: 'User not associated with any school' },
        { status: 400 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    if (!body.content) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      );
    }
    
    // Sanitize input data
    const sanitizedData = sanitizeNoteData({
      content: body.content,
      eventId: id,
      userId: user.id,
    });
    
    // Create the note
    const note = await createEventNote({
      schoolId: userSchool.schoolId,
      eventId: sanitizedData.eventId,
      userId: sanitizedData.userId,
      content: sanitizedData.content
    });
    
    // Log note creation for audit trail
    await logCreate(user.id, 'calendar_event_note', note.id, {
      eventId: id,
    });
    
    return NextResponse.json(
      note,
      {
        status: 201,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        },
      }
    );
    
  } catch (error) {
    console.error('Error creating event note:', error);
    
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
      { error: 'Failed to create event note' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/calendar/events/:id/notes
 * Get all notes for an event (only notes created by the requesting user)
 * 
 * Authorization: Teachers only
 * Requirement 9.1: Notes are private to the creator
 * Requirement 9.2: Display the notes in the event detail view
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params
    const { id } = await params;
    
    // Apply rate limiting
    const rateLimitResult = await checkCalendarRateLimit(request, 'EVENT_QUERY');
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult.limit, rateLimitResult.reset),
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          },
        }
      );
    }

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
        { error: 'Only teachers can view event notes' },
        { status: 403 }
      );
    }
    
    // Get notes for this event by this user
    const notes = await getEventNotesByUser(id, user.id);
    
    return NextResponse.json(
      notes,
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        },
      }
    );
    
  } catch (error) {
    console.error('Error fetching event notes:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch event notes' },
      { status: 500 }
    );
  }
}
