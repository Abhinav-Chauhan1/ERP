/**
 * Notifications API
 * 
 * GET /api/notifications - Get user notifications
 * POST /api/notifications/mark-all-read - Mark all notifications as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getUserNotifications,
  getNotificationSummary,
  markAllNotificationsAsRead
} from '@/lib/services/notification-service';

/**
 * GET /api/notifications
 * Get notifications for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const summary = searchParams.get('summary') === 'true';

    if (summary) {
      const data = await getNotificationSummary(userId);
      return NextResponse.json(data);
    }

    const notifications = await getUserNotifications(userId, limit, unreadOnly);
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const count = await markAllNotificationsAsRead(userId);
    
    return NextResponse.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
