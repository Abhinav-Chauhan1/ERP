/**
 * API Route for Scheduled Backup Management
 * 
 * Provides endpoints to start, stop, and check status of scheduled backups
 * 
 * Requirements: 9.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  startScheduledBackups,
  stopScheduledBackups,
  getScheduledBackupStatus,
  triggerManualBackup
} from '@/lib/utils/scheduled-backup';

/**
 * GET /api/admin/scheduled-backups
 * Get the status of scheduled backups
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

    // Verify admin role
    const userRole = session?.user?.role;
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const status = getScheduledBackupStatus();

    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting scheduled backup status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get status'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/scheduled-backups
 * Start or trigger scheduled backups
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

    // Verify admin role
    const userRole = session?.user?.role;
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'start') {
      startScheduledBackups();
      return NextResponse.json({
        success: true,
        message: 'Scheduled backups started'
      });
    } else if (action === 'trigger') {
      // Trigger a manual backup immediately
      await triggerManualBackup();
      return NextResponse.json({
        success: true,
        message: 'Manual backup triggered'
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "start" or "trigger"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error managing scheduled backups:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to manage scheduled backups'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/scheduled-backups
 * Stop scheduled backups
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin role
    const userRole = session?.user?.role;
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    stopScheduledBackups();

    return NextResponse.json({
      success: true,
      message: 'Scheduled backups stopped'
    });
  } catch (error) {
    console.error('Error stopping scheduled backups:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stop scheduled backups'
      },
      { status: 500 }
    );
  }
}
