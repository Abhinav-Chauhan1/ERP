/**
 * Server Actions for Scheduled Backup Management
 * 
 * Provides server-side functions for managing scheduled backups
 * 
 * Requirements: 9.1
 */

'use server';

import { auth } from '@clerk/nextjs/server';
import {
  startScheduledBackups,
  stopScheduledBackups,
  getScheduledBackupStatus,
  triggerManualBackup
} from '@/lib/utils/scheduled-backup';
import { logAudit } from '@/lib/utils/audit-log';
import { AuditAction } from '@prisma/client';

/**
 * Get the status of scheduled backups
 */
export async function getScheduledBackupStatusAction() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized',
        data: null
      };
    }

    // TODO: Add role check to ensure user is admin
    
    const status = getScheduledBackupStatus();
    
    return {
      success: true,
      data: status
    };
  } catch (error) {
    console.error('Error getting scheduled backup status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get status',
      data: null
    };
  }
}

/**
 * Start scheduled backups
 */
export async function startScheduledBackupsAction() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized'
      };
    }

    // TODO: Add role check to ensure user is admin
    
    startScheduledBackups();
    
    // Log the action
    await logAudit({
      userId,
      action: AuditAction.UPDATE,
      resource: 'scheduled_backup',
      resourceId: 'system',
      changes: {
        action: 'start',
        timestamp: new Date().toISOString()
      }
    });
    
    return {
      success: true,
      message: 'Scheduled backups started successfully'
    };
  } catch (error) {
    console.error('Error starting scheduled backups:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start scheduled backups'
    };
  }
}

/**
 * Stop scheduled backups
 */
export async function stopScheduledBackupsAction() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized'
      };
    }

    // TODO: Add role check to ensure user is admin
    
    stopScheduledBackups();
    
    // Log the action
    await logAudit({
      userId,
      action: AuditAction.UPDATE,
      resource: 'scheduled_backup',
      resourceId: 'system',
      changes: {
        action: 'stop',
        timestamp: new Date().toISOString()
      }
    });
    
    return {
      success: true,
      message: 'Scheduled backups stopped successfully'
    };
  } catch (error) {
    console.error('Error stopping scheduled backups:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to stop scheduled backups'
    };
  }
}

/**
 * Trigger a manual backup immediately
 */
export async function triggerManualBackupAction() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized'
      };
    }

    // TODO: Add role check to ensure user is admin
    
    // Log the action
    await logAudit({
      userId,
      action: AuditAction.CREATE,
      resource: 'scheduled_backup',
      resourceId: 'manual',
      changes: {
        action: 'trigger_manual',
        timestamp: new Date().toISOString()
      }
    });
    
    // Trigger the backup (this runs asynchronously)
    triggerManualBackup().catch(error => {
      console.error('Manual backup failed:', error);
    });
    
    return {
      success: true,
      message: 'Manual backup triggered successfully. Check logs for progress.'
    };
  } catch (error) {
    console.error('Error triggering manual backup:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger manual backup'
    };
  }
}
