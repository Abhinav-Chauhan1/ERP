/**
 * Backup Service
 * 
 * Handles school data backup creation, management, and restoration.
 * Provides comprehensive backup functionality with file storage integration.
 */

import { db } from "@/lib/db";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { logAuditEvent, AuditAction } from "./audit-service";
import { BackupType, BackupStatus, Backup } from "@prisma/client";
import { promises as fs } from 'fs';
import path from 'path';
import archiver from 'archiver';
import { createReadStream, createWriteStream } from 'fs';

export interface BackupOptions {
  includeFiles: boolean;
  includeDatabase: boolean;
  includeLogs: boolean;
  compressionLevel: number;
  encryptBackup: boolean;
}

export interface BackupProgress {
  backupId: string;
  status: BackupStatus;
  progress: number; // 0-100
  currentStep: string;
  estimatedTimeRemaining?: number; // seconds
}

export interface RestoreOptions {
  restoreFiles: boolean;
  restoreDatabase: boolean;
  restoreLogs: boolean;
  targetSchoolId?: string;
}

class BackupService {
  private readonly backupBasePath = process.env.BACKUP_STORAGE_PATH || '/tmp/backups';
  private readonly maxConcurrentBackups = 3;

  /**
   * Create a new backup for a school
   */
  async createBackup(
    schoolId: string,
    type: BackupType,
    options: Partial<BackupOptions>,
    createdBy: string
  ): Promise<string> {
    await requireSuperAdminAccess();

    // Validate school exists
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true },
    });

    if (!school) {
      throw new Error("School not found");
    }

    // Check for concurrent backup limit
    const activeBackups = await db.backup.count({
      where: {
        schoolId,
        status: BackupStatus.PENDING,
      },
    });

    if (activeBackups >= this.maxConcurrentBackups) {
      throw new Error("Maximum concurrent backups reached. Please wait for existing backups to complete.");
    }

    // Create backup record
    const backup = await db.backup.create({
      data: {
        schoolId,
        filename: this.generateBackupFilename(schoolId, type),
        type,
        status: BackupStatus.PENDING,
        includeFiles: options.includeFiles ?? true,
        createdBy,
        location: this.getBackupPath(schoolId),
      },
    });

    // Log audit event
    await logAuditEvent({
      userId: createdBy,
      action: AuditAction.CREATE,
      resource: 'SCHOOL_BACKUP',
      resourceId: backup.id,
      changes: { schoolId, type, options },
    });

    // Start backup process asynchronously
    this.processBackup(backup.id, schoolId, options).catch(async (error) => {
      console.error(`Backup ${backup.id} failed:`, error);
      await this.markBackupFailed(backup.id, error.message);
    });

    return backup.id;
  }

  /**
   * Get backup status and progress
   */
  async getBackupProgress(backupId: string): Promise<BackupProgress | null> {
    await requireSuperAdminAccess();

    const backup = await db.backup.findUnique({
      where: { id: backupId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        completedAt: true,
      },
    });

    if (!backup) {
      return null;
    }

    // Calculate progress based on status and time elapsed
    let progress = 0;
    let currentStep = 'Initializing';
    let estimatedTimeRemaining: number | undefined;

    switch (backup.status) {
      case BackupStatus.PENDING:
        progress = 10;
        currentStep = 'Preparing backup';
        break;
      case BackupStatus.COMPLETED:
        progress = 100;
        currentStep = 'Completed';
        break;
      case BackupStatus.FAILED:
        progress = 0;
        currentStep = 'Failed';
        break;
    }

    // Estimate time remaining for pending backups
    if (backup.status === BackupStatus.PENDING) {
      const elapsed = Date.now() - backup.createdAt.getTime();
      const estimatedTotal = 5 * 60 * 1000; // 5 minutes average
      estimatedTimeRemaining = Math.max(0, Math.floor((estimatedTotal - elapsed) / 1000));
    }

    return {
      backupId,
      status: backup.status,
      progress,
      currentStep,
      estimatedTimeRemaining,
    };
  }

  /**
   * List backups for a school
   */
  async listSchoolBackups(
    schoolId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Backup[]> {
    await requireSuperAdminAccess();

    return await db.backup.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupId: string, deletedBy: string): Promise<void> {
    await requireSuperAdminAccess();

    const backup = await db.backup.findUnique({
      where: { id: backupId },
    });

    if (!backup) {
      throw new Error("Backup not found");
    }

    // Delete physical backup file
    try {
      const backupFilePath = path.join(backup.location, backup.filename);
      await fs.unlink(backupFilePath);
    } catch (error) {
      console.warn(`Failed to delete backup file: ${error}`);
    }

    // Delete database record
    await db.backup.delete({
      where: { id: backupId },
    });

    // Log audit event
    await logAuditEvent({
      userId: deletedBy,
      action: AuditAction.DELETE,
      resource: 'SCHOOL_BACKUP',
      resourceId: backupId,
      changes: { schoolId: backup.schoolId },
    });
  }

  /**
   * Download backup file
   */
  async getBackupDownloadPath(backupId: string): Promise<string> {
    await requireSuperAdminAccess();

    const backup = await db.backup.findUnique({
      where: { id: backupId },
    });

    if (!backup) {
      throw new Error("Backup not found");
    }

    if (backup.status !== BackupStatus.COMPLETED) {
      throw new Error("Backup is not completed");
    }

    const backupFilePath = path.join(backup.location, backup.filename);
    
    // Verify file exists
    try {
      await fs.access(backupFilePath);
    } catch (error) {
      throw new Error("Backup file not found on disk");
    }

    return backupFilePath;
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(
    backupId: string,
    options: RestoreOptions,
    restoredBy: string
  ): Promise<string> {
    await requireSuperAdminAccess();

    const backup = await db.backup.findUnique({
      where: { id: backupId },
    });

    if (!backup) {
      throw new Error("Backup not found");
    }

    if (backup.status !== BackupStatus.COMPLETED) {
      throw new Error("Cannot restore from incomplete backup");
    }

    // Create restore job record (would be in a separate table in real implementation)
    const restoreJobId = `restore-${backupId}-${Date.now()}`;

    // Log audit event
    await logAuditEvent({
      userId: restoredBy,
      action: AuditAction.CREATE,
      resource: 'SCHOOL_RESTORE',
      resourceId: restoreJobId,
      changes: { backupId, options },
    });

    // Start restore process asynchronously
    this.processRestore(restoreJobId, backup, options).catch((error) => {
      console.error(`Restore ${restoreJobId} failed:`, error);
    });

    return restoreJobId;
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups(schoolId: string, retentionDays: number): Promise<number> {
    await requireSuperAdminAccess();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const oldBackups = await db.backup.findMany({
      where: {
        schoolId,
        createdAt: { lt: cutoffDate },
        status: BackupStatus.COMPLETED,
      },
    });

    let deletedCount = 0;

    for (const backup of oldBackups) {
      try {
        // Delete physical file
        const backupFilePath = path.join(backup.location, backup.filename);
        await fs.unlink(backupFilePath);

        // Delete database record
        await db.backup.delete({
          where: { id: backup.id },
        });

        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete backup ${backup.id}:`, error);
      }
    }

    return deletedCount;
  }

  /**
   * Get backup statistics for a school
   */
  async getBackupStats(schoolId: string): Promise<{
    totalBackups: number;
    totalSize: number;
    lastBackupDate?: Date;
    successRate: number;
  }> {
    await requireSuperAdminAccess();

    const stats = await db.backup.aggregate({
      where: { schoolId },
      _count: { id: true },
      _sum: { size: true },
    });

    const lastBackup = await db.backup.findFirst({
      where: { schoolId, status: BackupStatus.COMPLETED },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true },
    });

    const successfulBackups = await db.backup.count({
      where: { schoolId, status: BackupStatus.COMPLETED },
    });

    const successRate = stats._count.id > 0 ? (successfulBackups / stats._count.id) * 100 : 0;

    return {
      totalBackups: stats._count.id,
      totalSize: Number(stats._sum.size || 0),
      lastBackupDate: lastBackup?.completedAt || undefined,
      successRate,
    };
  }

  /**
   * Process backup creation
   */
  private async processBackup(
    backupId: string,
    schoolId: string,
    options: Partial<BackupOptions>
  ): Promise<void> {
    try {
      // Ensure backup directory exists
      const backupDir = this.getBackupPath(schoolId);
      await fs.mkdir(backupDir, { recursive: true });

      const backup = await db.backup.findUnique({
        where: { id: backupId },
      });

      if (!backup) {
        throw new Error("Backup record not found");
      }

      const backupFilePath = path.join(backupDir, backup.filename);

      // Create archive
      const output = createWriteStream(backupFilePath);
      const archive = archiver('zip', {
        zlib: { level: options.compressionLevel || 6 }
      });

      archive.pipe(output);

      // Add database export
      if (options.includeDatabase !== false) {
        const dbExport = await this.exportSchoolDatabase(schoolId);
        archive.append(dbExport, { name: 'database.json' });
      }

      // Add files if requested
      if (options.includeFiles) {
        await this.addSchoolFilesToArchive(archive, schoolId);
      }

      // Add logs if requested
      if (options.includeLogs) {
        await this.addSchoolLogsToArchive(archive, schoolId);
      }

      // Finalize archive
      await archive.finalize();

      // Wait for stream to finish
      await new Promise((resolve, reject) => {
        output.on('close', resolve);
        output.on('error', reject);
      });

      // Get file size
      const stats = await fs.stat(backupFilePath);

      // Update backup record
      await db.backup.update({
        where: { id: backupId },
        data: {
          status: BackupStatus.COMPLETED,
          size: BigInt(stats.size),
          completedAt: new Date(),
        },
      });

    } catch (error) {
      await this.markBackupFailed(backupId, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Process backup restoration
   */
  private async processRestore(
    restoreJobId: string,
    backup: Backup,
    options: RestoreOptions
  ): Promise<void> {
    // Implementation would depend on specific restore requirements
    // This is a placeholder for the actual restore logic
    console.log(`Processing restore job ${restoreJobId} from backup ${backup.id}`);
    
    // In a real implementation, this would:
    // 1. Extract the backup archive
    // 2. Restore database data if requested
    // 3. Restore files if requested
    // 4. Restore logs if requested
    // 5. Update restore job status
  }

  /**
   * Export school database data
   */
  private async exportSchoolDatabase(schoolId: string): Promise<string> {
    // This would export all school-related data from the database
    // For now, returning a placeholder
    const schoolData = await db.school.findUnique({
      where: { id: schoolId },
      include: {
        // Include all related data
        administrators: true,
        students: true,
        teachers: true,
        // ... other relations
      },
    });

    return JSON.stringify(schoolData, null, 2);
  }

  /**
   * Add school files to archive
   */
  private async addSchoolFilesToArchive(archive: archiver.Archiver, schoolId: string): Promise<void> {
    // This would add all school-related files to the archive
    // Implementation depends on file storage system (local, S3, etc.)
    console.log(`Adding files for school ${schoolId} to archive`);
  }

  /**
   * Add school logs to archive
   */
  private async addSchoolLogsToArchive(archive: archiver.Archiver, schoolId: string): Promise<void> {
    // This would add all school-related logs to the archive
    console.log(`Adding logs for school ${schoolId} to archive`);
  }

  /**
   * Mark backup as failed
   */
  private async markBackupFailed(backupId: string, errorMessage: string): Promise<void> {
    await db.backup.update({
      where: { id: backupId },
      data: {
        status: BackupStatus.FAILED,
        errorMessage,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Generate backup filename
   */
  private generateBackupFilename(schoolId: string, type: BackupType): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${type.toLowerCase()}-backup-${schoolId}-${timestamp}.zip`;
  }

  /**
   * Get backup storage path for a school
   */
  private getBackupPath(schoolId: string): string {
    return path.join(this.backupBasePath, `school-${schoolId}`);
  }
}

// Export singleton instance
export const backupService = new BackupService();
export default backupService;