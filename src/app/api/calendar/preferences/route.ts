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

    // Get user with school associations
    const user = await db.user.findUnique({
      where: { id: userId },
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

    let preferences = await db.userCalendarPreferences.findUnique({
      where: { userId }
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await db.userCalendarPreferences.create({
        data: {
          userId,
          schoolId,
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

    // Get user with school associations
    const user = await db.user.findUnique({
      where: { id: userId },
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
      where: { userId },
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
        schoolId,
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
