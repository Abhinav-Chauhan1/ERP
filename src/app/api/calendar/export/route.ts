/**
 * Calendar Export API Endpoint
 * 
 * GET /api/calendar/export
 * 
 * Exports calendar events to iCal, CSV, or JSON format.
 * Supports filtering by date range and categories.
 * Includes security measures: rate limiting, audit logging.
 * 
 * Requirements: 6.1, 6.5
 * Security Requirements: Rate limiting, audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { exportCalendarEvents, ExportOptions } from '@/lib/services/import-export-service';
import {
  checkCalendarRateLimit,
  logCalendarExport,
  createRateLimitError,
} from '@/lib/utils/calendar-security';

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting for export operations
    const rateLimitResult = await checkCalendarRateLimit(request, 'EXPORT');
    
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

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') as 'ical' | 'csv' | 'json';
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const categoriesStr = searchParams.get('categories');
    const includeNotes = searchParams.get('includeNotes') === 'true';
    const includeReminders = searchParams.get('includeReminders') === 'true';

    // Validate format
    if (!format || !['ical', 'csv', 'json'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be ical, csv, or json' },
        { status: 400 }
      );
    }

    // CRITICAL: Get school context first
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Get user with school associations - CRITICAL: Filter by school
    const user = await db.user.findFirst({
      where: { 
        id: session.user.id,      },
      include: {
        userSchools: {
          where: {          },
          include: {
            school: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get the first school (or handle multiple schools as needed)
    const userSchoolId = user.userSchools[0]?.schoolId || schoolId;
    if (!userSchoolId) {
      return NextResponse.json(
        { error: 'No school association found' },
        { status: 403 }
      );
    }

    // Build export options
    const options: ExportOptions = {
      format,
      schoolId: userSchoolId, // CRITICAL: Use verified schoolId
      includeNotes,
      includeReminders
    };

    if (startDateStr) {
      options.startDate = new Date(startDateStr);
      if (isNaN(options.startDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid start date format' },
          { status: 400 }
        );
      }
    }

    if (endDateStr) {
      options.endDate = new Date(endDateStr);
      if (isNaN(options.endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid end date format' },
          { status: 400 }
        );
      }
    }

    if (categoriesStr) {
      options.categoryIds = categoriesStr.split(',').filter(Boolean);
    }

    // Export events
    const content = await exportCalendarEvents(options);

    // Log export operation for audit trail
    await logCalendarExport(user.id, format, {
      startDate: options.startDate,
      endDate: options.endDate,
      categoryIds: options.categoryIds,
      includeNotes,
      includeReminders,
    });

    // Determine content type and file extension
    let contentType: string;
    let fileExtension: string;
    let filename: string;

    switch (format) {
      case 'ical':
        contentType = 'text/calendar';
        fileExtension = 'ics';
        break;
      case 'csv':
        contentType = 'text/csv';
        fileExtension = 'csv';
        break;
      case 'json':
        contentType = 'application/json';
        fileExtension = 'json';
        break;
      default:
        contentType = 'text/plain';
        fileExtension = 'txt';
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    filename = `calendar-export-${timestamp}.${fileExtension}`;

    // Return file as download
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.reset.toString(),
      }
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export calendar events' },
      { status: 500 }
    );
  }
}
