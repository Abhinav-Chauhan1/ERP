/**
 * Calendar Events API
 * 
 * Provides endpoints for calendar event management with role-based access control.
 * Includes security measures: rate limiting, input sanitization, audit logging, CSRF protection.
 * 
 * Requirements: 1.1, 1.2, 1.4, 1.5, 2.1, 3.1, 4.1
 * Security Requirements: Rate limiting, input sanitization, audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { withSchoolAuth } from '@/lib/auth/security-wrapper';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  createCalendarEvent,
  getCalendarEvents,
  ValidationError
} from '@/lib/services/calendar-service';
import {
  getEventsForUser,
  getUserContext
} from '@/lib/services/event-visibility-service';
import { getPaginatedCalendarEvents } from '@/lib/services/cached-calendar-service';
import { parseSortOptions } from '@/lib/utils/calendar-sorting';
import { UserRole } from '@prisma/client';
import {
  checkCalendarRateLimit,
  sanitizeEventData,
  logEventCreation,
  createRateLimitError,
} from '@/lib/utils/calendar-security';

/**
 * GET /api/calendar/events
 * 
 * Retrieves calendar events with filtering, sorting, and pagination.
 * Applies role-based visibility filtering automatically.
 * 
 * Query Parameters:
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - categories: Comma-separated category IDs (optional)
 * - search: Search term (optional)
 * - sortBy: Sort field - 'startDate', 'endDate', 'title', 'createdAt' (optional, default: 'startDate')
 * - sortOrder: Sort order - 'asc' or 'desc' (optional, default: 'asc')
 * - page: Page number for pagination (optional, default: 1)
 * - limit: Items per page (optional, default: 50)
 * 
 * Requirements: 1.2, 2.1, 3.1, 3.4, 4.1
 */
export const GET = withSchoolAuth(async (request, context) => {
  try {
    // Apply rate limiting for event queries
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
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
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

    // Get user from database - CRITICAL: Filter by school (context.schoolId from withSchoolAuth)
    const user = await db.user.findFirst({
      where: {
        id: session.user.id,      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const categoriesParam = searchParams.get('categories');
    const searchTerm = searchParams.get('search');
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const childId = searchParams.get('childId'); // For parent filtering by specific child

    // Build filter options
    const options: any = {};

    if (startDateParam) {
      options.startDate = new Date(startDateParam);
    }

    if (endDateParam) {
      options.endDate = new Date(endDateParam);
    }

    if (categoriesParam) {
      options.categoryIds = categoriesParam.split(',').filter(id => id.trim());
    }

    if (searchTerm) {
      options.searchTerm = searchTerm;
    }

    // Parse sorting options
    const sortOptions = parseSortOptions(sortBy, sortOrder);
    options.sortOptions = sortOptions;

    // Get events with visibility filtering
    let allEvents;

    // For parents filtering by specific child (Requirement 4.2)
    if (childId && user.role === UserRole.PARENT) {
      const parent = await db.parent.findFirst({
        where: {          userId: user.id
        }
      });

      if (!parent) {
        return NextResponse.json(
          { error: 'Parent record not found' },
          { status: 404 }
        );
      }

      // Import getEventsForParentChild
      const { getEventsForParentChild } = await import('@/lib/services/event-visibility-service');
      allEvents = await getEventsForParentChild(parent.id, childId, options);
    } else {
      allEvents = await getEventsForUser(user.id, options);
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEvents = allEvents.slice(startIndex, endIndex);

    return NextResponse.json(
      {
        events: paginatedEvents,
        pagination: {
          page,
          limit,
          total: allEvents.length,
          totalPages: Math.ceil(allEvents.length / limit)
        },
        sorting: sortOptions
      },
      {
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        },
      }
    );
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/calendar/events
 * 
 * Creates a new calendar event.
 * Admin-only operation.
 * 
 * Request Body:
 * - title: string (required)
 * - description: string (optional)
 * - categoryId: string (required)
 * - startDate: ISO date string (required)
 * - endDate: ISO date string (required)
 * - isAllDay: boolean (optional)
 * - location: string (optional)
 * - visibleToRoles: string[] (required)
 * - visibleToClasses: string[] (optional)
 * - visibleToSections: string[] (optional)
 * - isRecurring: boolean (optional)
 * - recurrenceRule: string (optional, iCal RRULE format)
 * - exceptionDates: ISO date string[] (optional)
 * - attachments: string[] (optional)
 * 
 * Requirements: 1.1
 */
export const POST = withSchoolAuth(async (request, context) => {
  try {
    // Apply rate limiting for event creation
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
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
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

    // Get user from database - CRITICAL: Filter by school (context.schoolId from withSchoolAuth)
    const user = await db.user.findFirst({
      where: {
        id: session.user.id,      }
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

    // Parse request body
    const body = await request.json();

    // Sanitize input data
    const sanitizedData = sanitizeEventData(body);

    // Convert date strings to Date objects
    const eventData = {
      ...sanitizedData,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      exceptionDates: body.exceptionDates?.map((d: string) => new Date(d)),
      createdBy: user.id
    };

    // Create the event
    const event = await createCalendarEvent(eventData);

    // Log event creation for audit trail
    await logEventCreation(user.id, event.id, eventData);

    return NextResponse.json(
      { event },
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
    console.error('Error creating calendar event:', error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    );
  }
});
