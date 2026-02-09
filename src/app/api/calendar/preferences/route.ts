/**
 * Calendar Preferences API
 * 
 * GET /api/calendar/preferences - Get user calendar preferences
 * PUT /api/calendar/preferences - Update user calendar preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { ReminderType } from '@prisma/client';

/**
 * GET /api/calendar/preferences
 * Get calendar preferences for the authenticated user
 */
export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // CRITICAL: Get school context first
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Get user with school associations - CRITICAL: Filter by school
    const user = await db.user.findFirst({
      where: { 
        id: userId,      },
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

    let preferences = await db.userCalendarPreferences.findFirst({
      where: { 
        userId,
        schoolId: userSchoolId, // CRITICAL: Filter by school
      }
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await db.userCalendarPreferences.create({
        data: {
          userId,
          schoolId: userSchoolId, // CRITICAL: Use verified schoolId
          defaultView: 'month',
          defaultReminderTime: 1440, // 1 day
          reminderTypes: ['IN_APP']
        }
      });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching calendar preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar preferences' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/calendar/preferences
 * Update calendar preferences for the authenticated user
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // CRITICAL: Get school context first
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Get user with school associations - CRITICAL: Filter by school
    const user = await db.user.findFirst({
      where: { 
        id: userId,      },
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

    const body = await request.json();

    // Validate reminder types
    if (body.reminderTypes) {
      const validTypes: ReminderType[] = ['EMAIL', 'SMS', 'PUSH', 'IN_APP'];
      const invalidTypes = body.reminderTypes.filter(
        (type: string) => !validTypes.includes(type as ReminderType)
      );

      if (invalidTypes.length > 0) {
        return NextResponse.json(
          { error: `Invalid reminder types: ${invalidTypes.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate reminder time
    if (body.defaultReminderTime !== undefined) {
      const time = parseInt(body.defaultReminderTime);
      if (isNaN(time) || time < 0) {
        return NextResponse.json(
          { error: 'Invalid reminder time. Must be a positive number of minutes.' },
          { status: 400 }
        );
      }
    }

    // Validate default view
    if (body.defaultView) {
      const validViews = ['month', 'week', 'day', 'agenda'];
      if (!validViews.includes(body.defaultView)) {
        return NextResponse.json(
          { error: `Invalid view. Must be one of: ${validViews.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Update or create preferences
    const preferences = await db.userCalendarPreferences.upsert({
      where: { 
        userId,
      },
      update: {
        ...(body.defaultView && { defaultView: body.defaultView }),
        ...(body.filterSettings && { filterSettings: body.filterSettings }),
        ...(body.defaultReminderTime !== undefined && { 
          defaultReminderTime: parseInt(body.defaultReminderTime) 
        }),
        ...(body.reminderTypes && { reminderTypes: body.reminderTypes })
      },
      create: {
        userId,
        schoolId: userSchoolId, // CRITICAL: Use verified schoolId
        defaultView: body.defaultView ?? 'month',
        filterSettings: body.filterSettings,
        defaultReminderTime: body.defaultReminderTime ?? 1440,
        reminderTypes: body.reminderTypes ?? ['IN_APP']
      }
    });

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error updating calendar preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update calendar preferences' },
      { status: 500 }
    );
  }
}
