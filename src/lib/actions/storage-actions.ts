"use server";

import { db } from "@/lib/db";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { getR2Config } from "@/lib/config/r2-config";

export interface StorageAnalytics {
  totalSchools: number;
  totalUsageMB: number;
  totalLimitMB: number;
  averageUsagePercentage: number;
  schoolsOverWarningThreshold: number;
  schoolsOverLimit: number;
  topUsageSchools: Array<{
    schoolId: string;
    schoolName: string;
    currentUsageMB: number;
    maxLimitMB: number;
    percentageUsed: number;
    isOverLimit: boolean;
  }>;
}

export async function getStorageAnalytics(): Promise<{ success: boolean; data?: StorageAnalytics; error?: string }> {
  try {
    await requireSuperAdminAccess();

    // Check if R2 is configured
    const r2Config = getR2Config();
    if (!r2Config.isConfigured) {
      return {
        success: true,
        data: {
          totalSchools: 0,
          totalUsageMB: 0,
          totalLimitMB: 0,
          averageUsagePercentage: 0,
          schoolsOverWarningThreshold: 0,
          schoolsOverLimit: 0,
          topUsageSchools: []
        }
      };
    }

    // Get all active schools with their latest usage counters in a single optimized query
    const schools = await db.school.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        plan: true,
        usageCounters: {
          select: {
            storageUsedMB: true,
            month: true,
          },
          orderBy: {
            month: 'desc'
          },
          take: 1
        }
      }
    });

    // Calculate plan-based storage limits
    const planLimits = {
      STARTER: 1024, // 1GB in MB
      GROWTH: 5120,  // 5GB in MB
      DOMINATE: 51200 // 50GB in MB
    };

    let totalUsageMB = 0;
    let totalLimitMB = 0;
    let schoolsOverWarningThreshold = 0;
    let schoolsOverLimit = 0;
    const topUsageSchools: Array<{
      schoolId: string;
      schoolName: string;
      currentUsageMB: number;
      maxLimitMB: number;
      percentageUsed: number;
      isOverLimit: boolean;
    }> = [];

    // Process each school's storage data
    for (const school of schools) {
      const planLimit = planLimits[school.plan as keyof typeof planLimits] || planLimits.STARTER;
      const currentUsage = school.usageCounters[0]?.storageUsedMB || 0;
      const percentageUsed = (currentUsage / planLimit) * 100;

      totalUsageMB += currentUsage;
      totalLimitMB += planLimit;

      if (percentageUsed >= 80) {
        schoolsOverWarningThreshold++;
      }
      if (percentageUsed >= 100) {
        schoolsOverLimit++;
      }

      topUsageSchools.push({
        schoolId: school.id,
        schoolName: school.name,
        currentUsageMB: currentUsage,
        maxLimitMB: planLimit,
        percentageUsed,
        isOverLimit: percentageUsed >= 100
      });
    }

    // Sort by usage percentage (descending)
    topUsageSchools.sort((a, b) => b.percentageUsed - a.percentageUsed);

    const analytics: StorageAnalytics = {
      totalSchools: schools.length,
      totalUsageMB,
      totalLimitMB,
      averageUsagePercentage: schools.length > 0 ? (totalUsageMB / totalLimitMB) * 100 : 0,
      schoolsOverWarningThreshold,
      schoolsOverLimit,
      topUsageSchools: topUsageSchools.slice(0, 10) // Top 10 schools
    };

    return {
      success: true,
      data: analytics
    };

  } catch (error) {
    console.error("Error fetching storage analytics:", error);
    return {
      success: false,
      error: "Failed to fetch storage analytics"
    };
  }
}