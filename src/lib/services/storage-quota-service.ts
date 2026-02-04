/**
 * Storage Quota Management Service
 * 
 * This service manages per-school storage quotas using existing UsageCounter and SubscriptionPlan models.
 * It provides real-time usage tracking, quota enforcement, and warning systems for the R2 migration.
 * 
 * Key Features:
 * - School-isolated quota checking using UsageCounter.storageLimitMB
 * - Real-time usage tracking via storageUsedMB updates
 * - Warning system at 80% usage threshold
 * - Integration with subscription plan features.storageGB
 * - Usage calculation from school-specific folder contents
 */

import { db } from "@/lib/db";
import { getCurrentSchoolId, requireSchoolAccess } from "@/lib/auth/tenant";
import { r2StorageService } from "./r2-storage-service";

/**
 * Storage quota status interface
 */
export interface StorageQuotaStatus {
  isWithinLimit: boolean;
  currentUsageMB: number;
  maxLimitMB: number;
  percentageUsed: number;
  warningThreshold: number; // 80%
  planStorageGB: number;
  isWarningTriggered: boolean;
  isHardLimitReached: boolean;
}

/**
 * School storage usage summary
 */
export interface SchoolStorageUsage {
  schoolId: string;
  schoolName: string;
  currentUsageMB: number;
  maxLimitMB: number;
  percentageUsed: number;
  planType: string;
  planStorageGB: number;
  isOverLimit: boolean;
  lastUpdated: Date;
}

/**
 * Storage usage analytics
 */
export interface StorageAnalytics {
  totalSchools: number;
  totalUsageMB: number;
  totalLimitMB: number;
  averageUsagePercentage: number;
  schoolsOverWarningThreshold: number;
  schoolsOverLimit: number;
  topUsageSchools: SchoolStorageUsage[];
}

/**
 * Storage Quota Service Class
 * 
 * Manages per-school storage quotas with complete isolation and real-time tracking
 */
export class StorageQuotaService {
  private readonly WARNING_THRESHOLD = 80; // 80% usage warning
  private readonly HARD_LIMIT_THRESHOLD = 100; // 100% usage hard limit

  /**
   * Check storage quota status for a school
   * 
   * @param schoolId - School identifier (optional, uses current school if not provided)
   * @returns Storage quota status
   */
  async checkQuota(schoolId?: string): Promise<StorageQuotaStatus> {
    const { schoolId: currentSchoolId, isSuperAdmin } = await requireSchoolAccess();

    // Validate access
    if (schoolId && schoolId !== currentSchoolId && !isSuperAdmin) {
      throw new Error("Unauthorized access to school quota");
    }

    const targetSchoolId = schoolId || currentSchoolId;
    if (!targetSchoolId) {
      throw new Error("School ID required");
    }

    // Get current usage counter
    const usageCounter = await this.getOrCreateUsageCounter(targetSchoolId);
    
    // Get subscription plan details
    const planStorageGB = await this.getPlanStorageLimit(targetSchoolId);
    
    // Calculate quota status
    const percentageUsed = (usageCounter.storageUsedMB / usageCounter.storageLimitMB) * 100;
    const isWarningTriggered = percentageUsed >= this.WARNING_THRESHOLD;
    const isHardLimitReached = percentageUsed >= this.HARD_LIMIT_THRESHOLD;

    return {
      isWithinLimit: !isHardLimitReached,
      currentUsageMB: usageCounter.storageUsedMB,
      maxLimitMB: usageCounter.storageLimitMB,
      percentageUsed: Math.round(percentageUsed * 100) / 100, // Round to 2 decimal places
      warningThreshold: this.WARNING_THRESHOLD,
      planStorageGB,
      isWarningTriggered,
      isHardLimitReached,
    };
  }

  /**
   * Update storage usage for a school
   * 
   * @param schoolId - School identifier
   * @param sizeMB - Size change in MB (positive for additions, negative for deletions)
   */
  async updateUsage(schoolId: string, sizeMB: number): Promise<void> {
    const { schoolId: currentSchoolId, isSuperAdmin } = await requireSchoolAccess();

    // Validate access
    if (schoolId !== currentSchoolId && !isSuperAdmin) {
      throw new Error("Unauthorized access to school usage");
    }

    const month = new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Update usage counter
    await db.usageCounter.upsert({
      where: {
        schoolId_month: {
          schoolId,
          month,
        },
      },
      update: {
        storageUsedMB: {
          increment: sizeMB,
        },
        updatedAt: new Date(),
      },
      create: {
        schoolId,
        month,
        storageUsedMB: Math.max(0, sizeMB), // Ensure non-negative
        whatsappUsed: 0,
        smsUsed: 0,
        whatsappLimit: 1000,
        smsLimit: 1000,
        storageLimitMB: await this.getDefaultStorageLimit(schoolId),
      },
    });

    // Check if warning should be triggered
    const quotaStatus = await this.checkQuota(schoolId);
    if (quotaStatus.isWarningTriggered && !quotaStatus.isHardLimitReached) {
      await this.sendQuotaWarning(schoolId, quotaStatus);
    }
  }

  /**
   * Get usage statistics for a school
   * 
   * @param schoolId - School identifier
   * @returns Usage counter data
   */
  async getUsageStats(schoolId: string): Promise<any> {
    const { schoolId: currentSchoolId, isSuperAdmin } = await requireSchoolAccess();

    // Validate access
    if (schoolId !== currentSchoolId && !isSuperAdmin) {
      throw new Error("Unauthorized access to school stats");
    }

    return await this.getOrCreateUsageCounter(schoolId);
  }

  /**
   * Set custom storage quota for a school (Super Admin only)
   * 
   * @param schoolId - School identifier
   * @param limitMB - New storage limit in MB
   */
  async setCustomQuota(schoolId: string, limitMB: number): Promise<void> {
    const { isSuperAdmin } = await requireSchoolAccess();

    if (!isSuperAdmin) {
      throw new Error("Only super admins can set custom quotas");
    }

    if (limitMB <= 0) {
      throw new Error("Storage limit must be positive");
    }

    const month = new Date().toISOString().slice(0, 7);

    await db.usageCounter.upsert({
      where: {
        schoolId_month: {
          schoolId,
          month,
        },
      },
      update: {
        storageLimitMB: limitMB,
        updatedAt: new Date(),
      },
      create: {
        schoolId,
        month,
        storageLimitMB: limitMB,
        storageUsedMB: 0,
        whatsappUsed: 0,
        smsUsed: 0,
        whatsappLimit: 1000,
        smsLimit: 1000,
      },
    });
  }

  /**
   * Get storage usage for all schools (Super Admin only)
   * 
   * @returns Array of school storage usage data
   */
  async getAllSchoolUsage(): Promise<SchoolStorageUsage[]> {
    const { isSuperAdmin } = await requireSchoolAccess();

    if (!isSuperAdmin) {
      throw new Error("Only super admins can view all school usage");
    }

    const currentMonth = new Date().toISOString().slice(0, 7);

    const usageCounters = await db.usageCounter.findMany({
      where: {
        month: currentMonth,
      },
      include: {
        school: {
          select: {
            name: true,
            plan: true,
          },
        },
      },
      orderBy: {
        storageUsedMB: 'desc',
      },
    });

    const results: SchoolStorageUsage[] = [];

    for (const counter of usageCounters) {
      const planStorageGB = await this.getPlanStorageLimit(counter.schoolId);
      const percentageUsed = (counter.storageUsedMB / counter.storageLimitMB) * 100;

      results.push({
        schoolId: counter.schoolId,
        schoolName: counter.school.name,
        currentUsageMB: counter.storageUsedMB,
        maxLimitMB: counter.storageLimitMB,
        percentageUsed: Math.round(percentageUsed * 100) / 100,
        planType: counter.school.plan,
        planStorageGB,
        isOverLimit: percentageUsed >= this.HARD_LIMIT_THRESHOLD,
        lastUpdated: counter.updatedAt,
      });
    }

    return results;
  }

  /**
   * Send quota warning to school administrators
   * 
   * @param schoolId - School identifier
   * @param quotaStatus - Current quota status
   */
  async sendQuotaWarning(schoolId: string, quotaStatus: StorageQuotaStatus): Promise<void> {
    try {
      // Get school administrators
      const administrators = await db.administrator.findMany({
        where: {
          schoolId,
        },
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      });

      // Create notification for each administrator
      for (const admin of administrators) {
        await db.notification.create({
          data: {
            userId: admin.userId,
            schoolId,
            title: "Storage Quota Warning",
            message: `Your school is using ${quotaStatus.percentageUsed}% of available storage (${quotaStatus.currentUsageMB} MB of ${quotaStatus.maxLimitMB} MB). Please consider upgrading your plan or removing unused files.`,
            type: "WARNING",
            isRead: false,
          },
        });
      }

      console.log(`Storage quota warning sent to ${administrators.length} administrators for school ${schoolId}`);
    } catch (error) {
      console.error("Failed to send quota warning:", error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Sync quota limits from subscription plan
   * 
   * @param schoolId - School identifier
   */
  async syncQuotaFromPlan(schoolId: string): Promise<void> {
    const { isSuperAdmin } = await requireSchoolAccess();

    if (!isSuperAdmin) {
      throw new Error("Only super admins can sync quotas from plans");
    }

    const planStorageGB = await this.getPlanStorageLimit(schoolId);
    const planStorageMB = planStorageGB * 1024; // Convert GB to MB

    const month = new Date().toISOString().slice(0, 7);

    await db.usageCounter.upsert({
      where: {
        schoolId_month: {
          schoolId,
          month,
        },
      },
      update: {
        storageLimitMB: planStorageMB,
        updatedAt: new Date(),
      },
      create: {
        schoolId,
        month,
        storageLimitMB: planStorageMB,
        storageUsedMB: 0,
        whatsappUsed: 0,
        smsUsed: 0,
        whatsappLimit: 1000,
        smsLimit: 1000,
      },
    });
  }

  /**
   * Calculate actual storage usage from R2 folder contents
   * 
   * @param schoolId - School identifier
   * @returns Calculated usage in MB
   */
  async calculateActualUsage(schoolId: string): Promise<number> {
    try {
      const fileList = await r2StorageService.listFiles(schoolId, '', 10000); // Get up to 10k files
      let totalSizeBytes = 0;

      for (const file of fileList.files) {
        totalSizeBytes += file.size;
      }

      // Handle pagination if there are more files
      let continuationToken = fileList.nextContinuationToken;
      while (continuationToken && fileList.isTruncated) {
        const nextBatch = await r2StorageService.listFiles(schoolId, '', 10000, continuationToken);
        
        for (const file of nextBatch.files) {
          totalSizeBytes += file.size;
        }
        
        continuationToken = nextBatch.nextContinuationToken;
      }

      return totalSizeBytes / (1024 * 1024); // Convert bytes to MB
    } catch (error) {
      console.error("Failed to calculate actual usage:", error);
      return 0; // Return 0 on error to avoid breaking operations
    }
  }

  /**
   * Sync database usage with actual R2 usage
   * 
   * @param schoolId - School identifier
   */
  async syncUsageWithR2(schoolId: string): Promise<void> {
    const { isSuperAdmin } = await requireSchoolAccess();

    if (!isSuperAdmin) {
      throw new Error("Only super admins can sync usage with R2");
    }

    const actualUsageMB = await this.calculateActualUsage(schoolId);
    const month = new Date().toISOString().slice(0, 7);

    await db.usageCounter.upsert({
      where: {
        schoolId_month: {
          schoolId,
          month,
        },
      },
      update: {
        storageUsedMB: actualUsageMB,
        updatedAt: new Date(),
      },
      create: {
        schoolId,
        month,
        storageUsedMB: actualUsageMB,
        whatsappUsed: 0,
        smsUsed: 0,
        whatsappLimit: 1000,
        smsLimit: 1000,
        storageLimitMB: await this.getDefaultStorageLimit(schoolId),
      },
    });
  }

  /**
   * Get storage analytics for super admin dashboard
   * 
   * @returns Storage analytics data
   */
  async getStorageAnalytics(): Promise<StorageAnalytics> {
    const { isSuperAdmin } = await requireSchoolAccess();

    if (!isSuperAdmin) {
      throw new Error("Only super admins can view storage analytics");
    }

    const allSchoolUsage = await this.getAllSchoolUsage();
    
    const totalUsageMB = allSchoolUsage.reduce((sum, school) => sum + school.currentUsageMB, 0);
    const totalLimitMB = allSchoolUsage.reduce((sum, school) => sum + school.maxLimitMB, 0);
    const averageUsagePercentage = allSchoolUsage.length > 0 
      ? allSchoolUsage.reduce((sum, school) => sum + school.percentageUsed, 0) / allSchoolUsage.length 
      : 0;

    const schoolsOverWarningThreshold = allSchoolUsage.filter(
      school => school.percentageUsed >= this.WARNING_THRESHOLD
    ).length;

    const schoolsOverLimit = allSchoolUsage.filter(school => school.isOverLimit).length;

    return {
      totalSchools: allSchoolUsage.length,
      totalUsageMB: Math.round(totalUsageMB * 100) / 100,
      totalLimitMB,
      averageUsagePercentage: Math.round(averageUsagePercentage * 100) / 100,
      schoolsOverWarningThreshold,
      schoolsOverLimit,
      topUsageSchools: allSchoolUsage.slice(0, 10), // Top 10 usage schools
    };
  }

  /**
   * Get or create usage counter for a school
   * 
   * @param schoolId - School identifier
   * @returns Usage counter data
   */
  private async getOrCreateUsageCounter(schoolId: string) {
    const month = new Date().toISOString().slice(0, 7);

    let usageCounter = await db.usageCounter.findUnique({
      where: {
        schoolId_month: {
          schoolId,
          month,
        },
      },
    });

    if (!usageCounter) {
      // Create new usage counter with plan-based limits
      const defaultLimit = await this.getDefaultStorageLimit(schoolId);
      
      usageCounter = await db.usageCounter.create({
        data: {
          schoolId,
          month,
          storageUsedMB: 0,
          storageLimitMB: defaultLimit,
          whatsappUsed: 0,
          smsUsed: 0,
          whatsappLimit: 1000,
          smsLimit: 1000,
        },
      });
    }

    return usageCounter;
  }

  /**
   * Get storage limit from subscription plan
   * 
   * @param schoolId - School identifier
   * @returns Storage limit in GB
   */
  private async getPlanStorageLimit(schoolId: string): Promise<number> {
    try {
      // Get active subscription
      const subscription = await db.enhancedSubscription.findFirst({
        where: {
          schoolId,
          status: 'ACTIVE',
        },
        include: {
          plan: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (subscription?.plan?.features) {
        const features = subscription.plan.features as any;
        return features.storageGB || 5; // Default to 5GB if not specified
      }

      // Fallback to school plan type
      const school = await db.school.findUnique({
        where: { id: schoolId },
        select: { plan: true },
      });

      // Default plan-based storage limits
      const planLimits = {
        STARTER: 5,    // 5GB
        GROWTH: 25,    // 25GB  
        ENTERPRISE: 100, // 100GB
      };

      return planLimits[school?.plan as keyof typeof planLimits] || 5;
    } catch (error) {
      console.error("Failed to get plan storage limit:", error);
      return 5; // Default to 5GB on error
    }
  }

  /**
   * Get default storage limit in MB for a school
   * 
   * @param schoolId - School identifier
   * @returns Storage limit in MB
   */
  private async getDefaultStorageLimit(schoolId: string): Promise<number> {
    const storageGB = await this.getPlanStorageLimit(schoolId);
    return storageGB * 1024; // Convert GB to MB
  }
}

// Export singleton instance
export const storageQuotaService = new StorageQuotaService();