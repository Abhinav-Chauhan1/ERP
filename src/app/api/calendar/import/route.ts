/**
 * Calendar Import API Endpoint
 * 
 * POST /api/calendar/import
 * 
 * Imports calendar events from uploaded files in iCal, CSV, or JSON format.
 * Validates data, checks for duplicates, and provides detailed error reporting.
 * Includes security measures: rate limiting, file validation, audit logging.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 * Security Requirements: Rate limiting, file validation, audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';
import { importCalendarEvents, ImportFormat } from '@/lib/services/import-export-service';
import {
  checkCalendarRateLimit,
  logCalendarImport,
  createRateLimitError,
} from '@/lib/utils/calendar-security';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for import operations
    const rateLimitResult = await checkCalendarRateLimit(request, 'IMPORT');
    
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

    // Get user from database with school associations
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        userSchools: {
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
    const schoolId = user.userSchools[0]?.schoolId;
    if (!schoolId) {
      return NextResponse.json(
        { error: 'No school association found' },
        { status: 403 }
      );
    }

    // Check if user is admin
    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin access required.' },
        { status: 403 }
      );
    }
    
    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const format = formData.get('format') as ImportFormat;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!format || !['ical', 'csv', 'json'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be ical, csv, or json' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedMimeTypes = [
      'text/calendar',
      'text/csv',
      'application/json',
      'text/plain',
    ];
    
    if (!allowedMimeTypes.includes(file.type) && file.type !== '') {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed types: iCal, CSV, JSON` },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();

    // Import events
    const result = await importCalendarEvents(content, format, schoolId, user.id);

    // Log import operation for audit trail
    await logCalendarImport(user.id, format, result.success, {
      failed: result.failed,
      duplicates: result.duplicates,
      errors: result.errors?.slice(0, 10), // Log first 10 errors only
    });

    // Return result with appropriate status
    if (result.failed > 0 && result.success === 0) {
      return NextResponse.json(
        {
          message: 'Import failed',
          result
        },
        {
          status: 400,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          },
        }
      );
    }

    if (result.failed > 0 || result.duplicates > 0) {
      return NextResponse.json(
        {
          message: 'Import completed with warnings',
          result
        },
        {
          status: 200,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          },
        }
      );
    }

    return NextResponse.json(
      {
        message: 'Import completed successfully',
        result
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        },
      }
    );
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import calendar events' },
      { status: 500 }
    );
  }
}
