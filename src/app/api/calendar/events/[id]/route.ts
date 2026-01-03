/**
 * Calendar Event API - Individual Event Operations
 * 
 * Provides endpoints for updating and deleting individual calendar events.
 * Includes security measures: rate limiting, input sanitization, audit logging.
 * 
 * Requirements: 1.4, 1.5
 * Security Requirements: Rate limiting, input sanitization, audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  updateCalendarEvent,
  deleteCalendarEvent,
  ValidationError
} from '@/lib/services/calendar-service';
import { UserRole } from '@prisma/client';
import {
  checkCalendarRateLimit,
  sanitizeEventData,
  logEventUpdate,
  logEventDeletion,
  createRateLimitError,
} from '@/lib/utils/calendar-security';

/**
 * GET /api/calendar/events/:id
 * 
 * Retrieves a single calendar event by ID.
 * Applies role-based visibility filtering.
 * 
 * Requirements: 3.5
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Await params
    const { id } = await params;

    // Get the event
    const event = await db.calendarEvent.findUnique({
      where: { id },
      include: {
        category: true,
        notes: {
          where: {
            userId: user.id
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check visibility
    const hasAccess = 
      user.role === UserRole.ADMIN ||
      event.visibleToRoles.includes(user.role);

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Event not found or you don\'t have access' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { event },
      {
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        },
      }
    );
  } catch (error) {
    console.error('Error fetching calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar event' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/calendar/events/:id
 * 
 * Updates a calendar event.
 * Admin-only operation.
 * 
 * Query Parameters:
 * - updateType: 'single' | 'future' | 'all' (for recurring events)
 * 
 * Request Body: Same as POST /api/calendar/events
 * 
 * Requirements: 1.4
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin access required.' },
        { status: 403 }
      );
    }

    // Get the existing event for audit logging
    const existingEvent = await db.calendarEvent.findUnique({
      where: { id: id }
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Sanitize input data
    const sanitizedData = sanitizeEventData(body);

    // Get update type for recurring events
    const searchParams = request.nextUrl.searchParams;
    const updateType = searchParams.get('updateType') || 'single';

    // Convert date strings to Date objects
    const eventData = {
      ...sanitizedData,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      exceptionDates: body.exceptionDates?.map((d: string) => new Date(d)),
    };

    // Update the event
    const event = await updateCalendarEvent(id, eventData, updateType as any);

    // Log event update for audit trail
    await logEventUpdate(user.id, id, existingEvent, event);

    return NextResponse.json(
      { event },
      {
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        },
      }
    );
  } catch (error) {
    console.error('Error updating calendar event:', error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update calendar event' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/calendar/events/:id
 * 
 * Deletes a calendar event.
 * Admin-only operation.
 * 
 * Query Parameters:
 * - deleteType: 'single' | 'future' | 'all' (for recurring events)
 * 
 * Requirements: 1.5
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin access required.' },
        { status: 403 }
      );
    }

    // Get the existing event for audit logging
    const existingEvent = await db.calendarEvent.findUnique({
      where: { id: id }
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get delete type for recurring events
    const searchParams = request.nextUrl.searchParams;
    const deleteType = searchParams.get('deleteType') || 'single';

    // Delete the event
    await deleteCalendarEvent(id, deleteType as any);

    // Log event deletion for audit trail
    await logEventDeletion(user.id, id, existingEvent);

    return NextResponse.json(
      { message: 'Event deleted successfully' },
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
    console.error('Error deleting calendar event:', error);

    return NextResponse.json(
      { error: 'Failed to delete calendar event' },
      { status: 500 }
    );
  }
}
