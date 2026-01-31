/**
 * School Data Management Service
 * 
 * Manages school-specific data management settings including backups, exports,
 * data retention policies, and storage management.
 */

import { db } from "@/lib/db";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { logAuditEvent, AuditAction } from "./audit-service";
import { SchoolDataManagementSettings } from "@prisma/client";

export interface SchoolDataManagementSettingsData {
  // Backup Settings
  autoBackupEnabled?: boolean;
  backupFrequency?: string; // HOURLY, DAILY, WEEKLY, MONTHLY
  backupRetention?: number; // days
  includeFiles?: boolean;
  encryptBackups?: boolean;
  
  // Export Settings
  allowDataExport?: boolean;
  exportFormats?: string[]; // CSV, JSON, PDF, XLSX
  requireApproval?: boolean;
  
  // Data Retention
  studentDataRetention?: number; // years
  auditLogRetention?: number; // days
  messageRetention?: number; // days
  autoCleanup?: boolean;
  
  // Storage Management
  storageQuota?: number; // GB
  compressionEnabled?: boolean;
  autoArchive?: boolean;
  archiveAfterDays?: number;
}

export interface DataManagementValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface StorageUsage {
  totalUsed: number; // GB
  breakdown: {
    documents: number;
    images: number;
    videos: number;
    backups: number;
    other: number;
  };
  quota: number;
  percentage: number;
}

class SchoolDataManagementService {
  /**
   * Get school data management settings with defaults if not exists
   */
  async getSchoolDataManagementSettings(schoolId: string): Promise<SchoolDataManagementSettings> {
    await requireSuperAdminAccess();

    let settings = await db.schoolDataManagementSettings.findUnique({
      where: { schoolId },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await this.createDefaultDataManagementSettings(schoolId);
    }

    return settings;
  }

  /**
   * Update school data management settings
   */
  async updateSchoolDataManagementSettings(
    schoolId: string,
    data: SchoolDataManagementSettingsData,
    updatedBy: string
  ): Promise<SchoolDataManagementSettings> {
    await requireSuperAdminAccess();

    // Validate school exists
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, plan: true },
    });

    if (!school) {
      throw new Error("School not found");
    }

    // Validate settings
    const validation = this.validateDataManagementSettings(data);
    if (!validation.isValid) {
      throw new Error(`Invalid data management settings: ${validation.errors.join(', ')}`);
    }

    // Get current settings for audit trail
    const currentSettings = await this.getSchoolDataManagementSettings(schoolId);

    // Update settings
    const updatedSettings = await db.schoolDataManagementSettings.upsert({
      where: { schoolId },
      update: {
        ...data,
        updatedAt: new Date(),
      },
      create: {
        schoolId,
        ...data,
      },
    });

    // Log audit event
    await logAuditEvent({
      userId: updatedBy,
      action: AuditAction.UPDATE,
      resource: 'SCHOOL_DATA_MANAGEMENT_SETTINGS',
      resourceId: schoolId,
      changes: {
        before: this.extractSettingsChanges(currentSettings),
        after: this.extractSettingsChanges(updatedSettings),
      },
    });

    return updatedSettings;
  }

  /**
   * Create default data management settings for a school
   */
  async createDefaultDataManagementSettings(schoolId: string): Promise<SchoolDataManagementSettings> {
    // Get school plan to set appropriate defaults
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { plan: true },
    });

    const planDefaults = this.getDefaultsForPlan(school?.plan || 'STARTER');

    const defaultSettings = await db.schoolDataManagementSettings.create({
      data: {
        schoolId,
        ...planDefaults,
      },
    });

    return defaultSettings;
  }

  /**
   * Get default settings based on plan
   */
  private getDefaultsForPlan(plan: string): Partial<SchoolDataManagementSettingsData> {
    const planDefaults = {
      STARTER: {
        storageQuota: 1, // 1GB
        backupFrequency: 'WEEKLY',
        backupRetention: 14,
        exportFormats: ['CSV', 'PDF'],
        requireApproval: true,
      },
      GROWTH: {
        storageQuota: 5, // 5GB
        backupFrequency: 'DAILY',
        backupRetention: 30,
        exportFormats: ['CSV', 'JSON', 'PDF', 'XLSX'],
        requireApproval: false,
      },
      DOMINATE: {
        storageQuota: 50, // 50GB
        backupFrequency: 'DAILY',
        backupRetention: 90,
        exportFormats: ['CSV', 'JSON', 'PDF', 'XLSX'],
        requireApproval: false,
      },
    };

    return planDefaults[plan as keyof typeof planDefaults] || planDefaults.STARTER;
  }

  /**
   * Validate data management settings
   */
  validateDataManagementSettings(data: SchoolDataManagementSettingsData): DataManagementValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate backup retention
    if (data.backupRetention !== undefined) {
      if (data.backupRetention < 7 || data.backupRetention > 365) {
        errors.push("Backup retention must be between 7 and 365 days");
      }
      if (data.backupRetention < 14) {
        warnings.push("Backup retention less than 14 days may not provide adequate recovery options");
      }
    }

    // Validate backup frequency
    if (data.backupFrequency && !['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'].includes(data.backupFrequency)) {
      errors.push("Invalid backup frequency. Must be HOURLY, DAILY, WEEKLY, or MONTHLY");
    }

    // Validate export formats
    if (data.exportFormats) {
      const validFormats = ['CSV', 'JSON', 'PDF', 'XLSX'];
      const invalidFormats = data.exportFormats.filter(format => !validFormats.includes(format));
      if (invalidFormats.length > 0) {
        errors.push(`Invalid export formats: ${invalidFormats.join(', ')}`);
      }
    }

    // Validate data retention periods
    if (data.studentDataRetention !== undefined) {
      if (data.studentDataRetention < 1 || data.studentDataRetention > 50) {
        errors.push("Student data retention must be between 1 and 50 years");
      }
    }

    if (data.auditLogRetention !== undefined) {
      if (data.auditLogRetention < 30 || data.auditLogRetention > 2555) {
        errors.push("Audit log retention must be between 30 and 2555 days");
      }
    }

    if (data.messageRetention !== undefined) {
      if (data.messageRetention < 7 || data.messageRetention > 365) {
        errors.push("Message retention must be between 7 and 365 days");
      }
    }

    // Validate storage quota
    if (data.storageQuota !== undefined) {
      if (data.storageQuota < 1) {
        errors.push("Storage quota must be at least 1 GB");
      }
    }

    // Validate archive settings
    if (data.archiveAfterDays !== undefined) {
      if (data.archiveAfterDays < 30 || data.archiveAfterDays > 3650) {
        errors.push("Archive after days must be between 30 and 3650 days");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get storage usage for a school
   */
  async getStorageUsage(schoolId: string): Promise<StorageUsage> {
    await requireSuperAdminAccess();

    const settings = await this.getSchoolDataManagementSettings(schoolId);

    // In a real implementation, this would calculate actual storage usage
    // For now, returning mock data
    const mockUsage = {
      totalUsed: 2.5, // GB
      breakdown: {
        documents: 1.2,
        images: 0.8,
        videos: 0.3,
        backups: 0.15,
        other: 0.05,
      },
      quota: settings.storageQuota,
      percentage: (2.5 / settings.storageQuota) * 100,
    };

    return mockUsage;
  }

  /**
   * Get data retention recommendations
   */
  async getDataRetentionRecommendations(schoolId: string): Promise<string[]> {
    const settings = await this.getSchoolDataManagementSettings(schoolId);
    const recommendations: string[] = [];

    if (!settings.autoBackupEnabled) {
      recommendations.push("Enable automatic backups to protect against data loss");
    }

    if (settings.backupRetention < 30) {
      recommendations.push("Consider increasing backup retention to at least 30 days");
    }

    if (!settings.encryptBackups) {
      recommendations.push("Enable backup encryption for enhanced security");
    }

    if (!settings.compressionEnabled) {
      recommendations.push("Enable compression to optimize storage usage");
    }

    if (!settings.autoArchive) {
      recommendations.push("Enable auto-archive to manage old data automatically");
    }

    if (settings.messageRetention > 180) {
      recommendations.push("Consider reducing message retention to optimize storage");
    }

    if (!settings.autoCleanup) {
      recommendations.push("Enable auto-cleanup to automatically remove old data");
    }

    return recommendations;
  }

  /**
   * Trigger manual backup for a school
   */
  async triggerManualBackup(schoolId: string, triggeredBy: string, includeFiles: boolean = true): Promise<string> {
    await requireSuperAdminAccess();

    const settings = await this.getSchoolDataManagementSettings(schoolId);

    // Create backup record
    const backup = await db.backup.create({
      data: {
        schoolId,
        filename: `manual-backup-${schoolId}-${Date.now()}.zip`,
        type: 'MANUAL',
        status: 'PENDING',
        includeFiles,
        createdBy: triggeredBy,
        location: `/backups/school-${schoolId}/`,
      },
    });

    // Log audit event
    await logAuditEvent({
      userId: triggeredBy,
      action: AuditAction.CREATE,
      resource: 'SCHOOL_BACKUP',
      resourceId: backup.id,
      changes: { schoolId, type: 'MANUAL', includeFiles },
    });

    // In a real implementation, trigger actual backup process here
    // For now, simulate with timeout
    setTimeout(async () => {
      try {
        await db.backup.update({
          where: { id: backup.id },
          data: {
            status: 'COMPLETED',
            size: BigInt(Math.floor(Math.random() * 500000000) + 100000000),
            completedAt: new Date(),
          },
        });
      } catch (error) {
        await db.backup.update({
          where: { id: backup.id },
          data: {
            status: 'FAILED',
            errorMessage: 'Backup process failed',
            completedAt: new Date(),
          },
        });
      }
    }, 5000);

    return backup.id;
  }

  /**
   * Export school data
   */
  async exportSchoolData(
    schoolId: string,
    format: string,
    dataTypes: string[],
    requestedBy: string
  ): Promise<{ exportId: string; requiresApproval: boolean }> {
    await requireSuperAdminAccess();

    const settings = await this.getSchoolDataManagementSettings(schoolId);

    // Validate export format
    if (!settings.exportFormats.includes(format)) {
      throw new Error(`Export format ${format} is not allowed for this school`);
    }

    if (!settings.allowDataExport) {
      throw new Error("Data export is not enabled for this school");
    }

    // Create export record (would be in a separate table in real implementation)
    const exportId = `export-${schoolId}-${Date.now()}`;

    // Log audit event
    await logAuditEvent({
      userId: requestedBy,
      action: AuditAction.CREATE,
      resource: 'SCHOOL_DATA_EXPORT',
      resourceId: exportId,
      changes: { schoolId, format, dataTypes },
    });

    return {
      exportId,
      requiresApproval: settings.requireApproval,
    };
  }

  /**
   * Extract settings changes for audit logging
   */
  private extractSettingsChanges(settings: SchoolDataManagementSettings): Record<string, any> {
    const {
      id, schoolId, createdAt, updatedAt, ...settingsData
    } = settings;
    return settingsData;
  }

  /**
   * Bulk update data management settings for multiple schools
   */
  async bulkUpdateDataManagementSettings(
    schoolIds: string[],
    data: SchoolDataManagementSettingsData,
    updatedBy: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    await requireSuperAdminAccess();

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const schoolId of schoolIds) {
      try {
        await this.updateSchoolDataManagementSettings(schoolId, data, updatedBy);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`School ${schoolId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }
}

// Export singleton instance
export const schoolDataManagementService = new SchoolDataManagementService();
export default schoolDataManagementService;