/**
 * Individual Notification API
 * 
 * PATCH /api/notifications/:id - Mark notification as read
 * DELETE /api/notifications/:id - Delete notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  markNotificationAsRead,
  deleteNotification
} from '@/lib/services/notification-service';

/**
 * PATCH /api/notifications/:id
 * Mark a notification as read
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const notification = await markNotificationAsRead(id, userId);

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await deleteNotification(id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
