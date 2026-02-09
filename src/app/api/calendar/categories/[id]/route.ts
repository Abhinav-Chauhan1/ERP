/**
 * Calendar Event Categories API - Individual Category Operations
 * 
 * Provides endpoints for updating and deleting individual event categories.
 * 
 * Requirements: 8.2, 8.3, 8.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  updateEventCategory,
  deleteEventCategory,
  CategoryValidationError,
  type UpdateEventCategoryInput
} from '@/lib/services/event-category-service';
import { UserRole } from '@prisma/client';

/**
 * PUT /api/calendar/categories/:id
 * 
 * Updates an event category.
 * Admin-only operation.
 * 
 * Request Body:
 * - name: string (optional) - Unique category name
 * - description: string (optional) - Category description
 * - color: string (optional) - Hex color code
 * - icon: string (optional) - Icon name
 * - isActive: boolean (optional) - Whether category is active
 * - order: number (optional) - Display order
 * 
 * Requirements: 8.2, 8.3
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params
    const { id } = await params;

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // CRITICAL: Get school context first
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Get user from database - CRITICAL: Filter by school
    const user = await db.user.findFirst({
      where: { 
        id: session.user.id,
        schoolId, // CRITICAL: Filter by school
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

    // Verify category belongs to current school
    const existingCategory = await db.eventCategory.findFirst({
      where: {
        id,
        schoolId, // CRITICAL: Ensure category belongs to current school
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();

    const categoryData: UpdateEventCategoryInput = {
      name: body.name,
      description: body.description,
      color: body.color,
      icon: body.icon,
      isActive: body.isActive,
      order: body.order
    };


    // Update the category
    const category = await updateEventCategory(id, categoryData);

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error updating event category:', error);

    if (error instanceof CategoryValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update event category' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/calendar/categories/:id
 * 
 * Deletes an event category.
 * Admin-only operation.
 * Requires reassignment of existing events to another category.
 * 
 * Query Parameters:
 * - replacementCategoryId: string (required if category has events)
 * 
 * Requirements: 8.4
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params
    const { id } = await params;

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // CRITICAL: Get school context first
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Get user from database - CRITICAL: Filter by school
    const user = await db.user.findFirst({
      where: { 
        id: session.user.id,
        schoolId, // CRITICAL: Filter by school
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

    // Verify category belongs to current school
    const existingCategory = await db.eventCategory.findFirst({
      where: {
        id,
        schoolId, // CRITICAL: Ensure category belongs to current school
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get replacement category ID from query params
    const searchParams = request.nextUrl.searchParams;
    const replacementCategoryId = searchParams.get('replacementCategoryId');

    // Params already awaited above

    // Delete the category
    await deleteEventCategory(id, replacementCategoryId || undefined);

    return NextResponse.json(
      { message: 'Category deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting event category:', error);

    if (error instanceof CategoryValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete event category' },
      { status: 500 }
    );
  }
}
