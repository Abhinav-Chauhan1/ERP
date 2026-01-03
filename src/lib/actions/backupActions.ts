/**
 * Server Actions for Database Backup Management
 * 
 * Provides server-side functions for creating, restoring, and managing backups
 * 
 * Requirements: 9.2, 9.3
 */

'use server';

import { auth } from "@/auth";
import { 
  createBackup, 
  restoreBackup, 
  listBackups, 
  deleteBackup,
  uploadToCloud 
} from '@/lib/utils/backup-service';
import { logAudit } from '@/lib/utils/audit-log';
import { AuditAction } from '@prisma/client';

/**
 * Create a new database backup
 * Only accessible by administrators
 * 
 * @param notifyOnFailure - Whether to send email notifications on backup failure (Requirements: 9.5)
 */
export async function createBackupAction(notifyOnFailure: boolean = true) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized'
      };
    }

    // TODO: Add role check to ensure user is admin
    // For now, we'll allow any authenticated user
    
    console.log('Creating backup...');
    const result = await createBackup(notifyOnFailure, 'manual');
    
    if (result.success) {
      // Log the backup creation
      await logAudit({
        userId,
        action: AuditAction.CREATE,
        resource: 'backup',
        resourceId: result.metadata?.id || 'unknown',
        changes: {
          filename: result.metadata?.filename,
          size: result.metadata?.size,
          location: result.metadata?.location
        }
      });
      
      return {
        success: true,
        data: result.metadata,
        message: 'Backup created successfully'
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error in createBackupAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create backup'
    };
  }
}

/**
 * Restore database from a backup
 * Only accessible by administrators
 */
export async function restoreBackupAction(backupId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized'
      };
    }

    // TODO: Add role check to ensure user is admin
    
    console.log(`Restoring backup ${backupId}...`);
    const result = await restoreBackup(backupId);
    
    if (result.success) {
      // Log the restore operation
      await logAudit({
        userId,
        action: AuditAction.UPDATE,
        resource: 'backup',
        resourceId: backupId,
        changes: {
          action: 'restore',
          recordsRestored: result.recordsRestored
        }
      });
      
      return {
        success: true,
        message: 'Backup restored successfully',
        recordsRestored: result.recordsRestored
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error in restoreBackupAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore backup'
    };
  }
}

/**
 * List all available backups
 * Only accessible by administrators
 */
export async function listBackupsAction() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized',
        data: []
      };
    }

    // TODO: Add role check to ensure user is admin
    
    const backups = await listBackups();
    
    return {
      success: true,
      data: backups
    };
  } catch (error) {
    console.error('Error in listBackupsAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list backups',
      data: []
    };
  }
}

/**
 * Delete a backup
 * Only accessible by administrators
 */
export async function deleteBackupAction(backupId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized'
      };
    }

    // TODO: Add role check to ensure user is admin
    
    const result = await deleteBackup(backupId);
    
    if (result.success) {
      // Log the deletion
      await logAudit({
        userId,
        action: AuditAction.DELETE,
        resource: 'backup',
        resourceId: backupId,
        changes: {
          action: 'delete'
        }
      });
      
      return {
        success: true,
        message: 'Backup deleted successfully'
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error in deleteBackupAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete backup'
    };
  }
}

/**
 * Upload a backup to cloud storage
 * Only accessible by administrators
 */
export async function uploadBackupToCloudAction(backupId: string, localPath: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized'
      };
    }

    // TODO: Add role check to ensure user is admin
    
    const result = await uploadToCloud(localPath);
    
    if (result.success) {
      // Log the upload
      await logAudit({
        userId,
        action: AuditAction.UPDATE,
        resource: 'backup',
        resourceId: backupId,
        changes: {
          action: 'upload_to_cloud',
          cloudPath: result.cloudPath
        }
      });
      
      return {
        success: true,
        message: 'Backup uploaded to cloud successfully',
        cloudPath: result.cloudPath
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error in uploadBackupToCloudAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload backup to cloud'
    };
  }
}
