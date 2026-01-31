/**
 * Calendar Event Categories API
 * 
 * Provides endpoints for managing calendar event categories.
 * Includes security measures: rate limiting, input sanitization, audit logging.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 * Security Requirements: Rate limiting, input sanitization, audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  createEventCategory,
  getAllEventCategories,
  CategoryValidationError,
  type CreateEventCategoryInput
} from '@/lib/services/event-category-service';
import { UserRole } from '@prisma/client';
import {
  checkCalendarRateLimit,
  sanitizeCategoryData,
  createRateLimitError,
} from '@/lib/utils/calendar-security';
import { logCreate } from '@/lib/utils/audit-log';

/**
 * GET /api/calendar/categories
 * 
 * Retrieves all event categories.
 * Available to all authenticated users.
 * 
 * Query Parameters:
 * - includeInactive: boolean (optional, default: false) - Include inactive categories
 * 
 * Requirements: 8.1, 8.2
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Get all categories
    const categories = await getAllEventCategories(includeInactive);

    return NextResponse.json(
      {
        categories
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
    console.error('Error fetching event categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event categories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/calendar/categories
 * 
 * Creates a new event category.
 * Admin-only operation.
 * 
 * Request Body:
 * - name: string (required) - Unique category name
 * - description: string (optional) - Category description
 * - color: string (required) - Hex color code (e.g., "#3b82f6")
 * - icon: string (optional) - Icon name from lucide-react
 * - isActive: boolean (optional, default: true) - Whether category is active
 * - order: number (optional, default: 0) - Display order
 * 
 * Requirements: 8.1
 */
export async function POST(request: NextRequest) {
  try {
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

    // Get user from database with school information
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        userSchools: {
          where: { isActive: true },
          include: { school: true }
        }
      }
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

    // Sanitize input data
    const sanitizedData = sanitizeCategoryData(body);

    const categoryData: CreateEventCategoryInput = {
      schoolId: userSchool.schoolId,
      name: sanitizedData.name,
      description: sanitizedData.description,
      color: sanitizedData.color,
      icon: sanitizedData.icon,
      isActive: sanitizedData.isActive,
      order: sanitizedData.order
    };

    // Create the category
    const category = await createEventCategory(categoryData);

    // Log category creation for audit trail
    await logCreate(user.id, 'calendar_category', category.id, {
      name: category.name,
      color: category.color,
    });

    return NextResponse.json(
      { category },
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
    console.error('Error creating event category:', error);

    if (error instanceof CategoryValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create event category' },
      { status: 500 }
    );
  }
}
