import { db } from "@/lib/db";
import { getCurrentSchoolId, requireSchoolAccess } from "@/lib/auth/tenant";

export interface UsageLimits {
  whatsappLimit: number;
  smsLimit: number;
  storageLimitMB: number;
}

export interface UsageStats {
  whatsappUsed: number;
  smsUsed: number;
  storageUsedMB: number;
  whatsappLimit: number;
  smsLimit: number;
  storageLimitMB: number;
  whatsappRemaining: number;
  smsRemaining: number;
  storageRemainingMB: number;
}

/**
 * Get current usage limits for a school
 */
export async function getUsageLimits(schoolId?: string): Promise<UsageLimits> {
  const { schoolId: currentSchoolId, isSuperAdmin } = await requireSchoolAccess();

  // If schoolId is provided, verify access
  if (schoolId && schoolId !== currentSchoolId && !isSuperAdmin) {
    throw new Error("Unauthorized access to school limits");
  }

  const targetSchoolId = schoolId || currentSchoolId;

  if (!targetSchoolId) {
    throw new Error("School ID required");
  }

  const usageCounter = await db.usageCounter.findFirst({
    where: {
      schoolId: targetSchoolId,
      month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    },
  });

  if (!usageCounter) {
    // Create default usage counter if it doesn't exist
    const newCounter = await db.usageCounter.create({
      data: {
        schoolId: targetSchoolId,
        month: new Date().toISOString().slice(0, 7),
        whatsappLimit: 1000, // Default limits
        smsLimit: 1000,
        storageLimitMB: 1024,
      },
    });

    return {
      whatsappLimit: newCounter.whatsappLimit,
      smsLimit: newCounter.smsLimit,
      storageLimitMB: newCounter.storageLimitMB,
    };
  }

  return {
    whatsappLimit: usageCounter.whatsappLimit,
    smsLimit: usageCounter.smsLimit,
    storageLimitMB: usageCounter.storageLimitMB,
  };
}

/**
 * Get current usage statistics for a school
 */
export async function getUsageStats(schoolId?: string): Promise<UsageStats> {
  const { schoolId: currentSchoolId, isSuperAdmin } = await requireSchoolAccess();

  // If schoolId is provided, verify access
  if (schoolId && schoolId !== currentSchoolId && !isSuperAdmin) {
    throw new Error("Unauthorized access to school stats");
  }

  const targetSchoolId = schoolId || currentSchoolId;

  if (!targetSchoolId) {
    throw new Error("School ID required");
  }

  const limits = await getUsageLimits(targetSchoolId);

  const usageCounter = await db.usageCounter.findFirst({
    where: {
      schoolId: targetSchoolId,
      month: new Date().toISOString().slice(0, 7),
    },
  });

  const currentUsage = usageCounter || {
    whatsappUsed: 0,
    smsUsed: 0,
    storageUsedMB: 0,
  };

  return {
    whatsappUsed: currentUsage.whatsappUsed,
    smsUsed: currentUsage.smsUsed,
    storageUsedMB: currentUsage.storageUsedMB,
    whatsappLimit: limits.whatsappLimit,
    smsLimit: limits.smsLimit,
    storageLimitMB: limits.storageLimitMB,
    whatsappRemaining: Math.max(0, limits.whatsappLimit - currentUsage.whatsappUsed),
    smsRemaining: Math.max(0, limits.smsLimit - currentUsage.smsUsed),
    storageRemainingMB: Math.max(0, limits.storageLimitMB - currentUsage.storageUsedMB),
  };
}

/**
 * Check if a school can send WhatsApp messages
 */
export async function canSendWhatsApp(count: number = 1, schoolId?: string): Promise<boolean> {
  const stats = await getUsageStats(schoolId);
  return stats.whatsappRemaining >= count;
}

/**
 * Check if a school can send SMS messages
 */
export async function canSendSMS(count: number = 1, schoolId?: string): Promise<boolean> {
  const stats = await getUsageStats(schoolId);
  return stats.smsRemaining >= count;
}

/**
 * Check if a school has storage space available
 */
export async function hasStorageSpace(sizeMB: number, schoolId?: string): Promise<boolean> {
  const stats = await getUsageStats(schoolId);
  return stats.storageRemainingMB >= sizeMB;
}

/**
 * Validate file upload against storage limits
 */
export async function validateFileUpload(fileSizeBytes: number, schoolId?: string): Promise<{
  allowed: boolean;
  error?: string;
  remainingSpaceMB?: number;
}> {
  const fileSizeMB = fileSizeBytes / (1024 * 1024); // Convert bytes to MB
  const stats = await getUsageStats(schoolId);

  if (stats.storageRemainingMB < fileSizeMB) {
    return {
      allowed: false,
      error: `File upload would exceed storage limit. Available space: ${stats.storageRemainingMB.toFixed(2)} MB, File size: ${fileSizeMB.toFixed(2)} MB`,
      remainingSpaceMB: stats.storageRemainingMB,
    };
  }

  return {
    allowed: true,
    remainingSpaceMB: stats.storageRemainingMB,
  };
}

/**
 * Increment WhatsApp usage counter
 */
export async function incrementWhatsAppUsage(count: number = 1, schoolId?: string): Promise<void> {
  const { schoolId: currentSchoolId, isSuperAdmin } = await requireSchoolAccess();

  if (schoolId && schoolId !== currentSchoolId && !isSuperAdmin) {
    throw new Error("Unauthorized access to school usage");
  }

  const targetSchoolId = schoolId || currentSchoolId;

  if (!targetSchoolId) {
    throw new Error("School ID required");
  }

  const month = new Date().toISOString().slice(0, 7);

  await db.usageCounter.upsert({
    where: {
      schoolId_month: {
        schoolId: targetSchoolId,
        month,
      },
    },
    update: {
      whatsappUsed: {
        increment: count,
      },
    },
    create: {
      schoolId: targetSchoolId,
      month,
      whatsappUsed: count,
      smsUsed: 0,
      storageUsedMB: 0,
      whatsappLimit: 1000,
      smsLimit: 1000,
      storageLimitMB: 1024,
    },
  });
}

/**
 * Increment SMS usage counter
 */
export async function incrementSMSUsage(count: number = 1, schoolId?: string): Promise<void> {
  const { schoolId: currentSchoolId, isSuperAdmin } = await requireSchoolAccess();

  if (schoolId && schoolId !== currentSchoolId && !isSuperAdmin) {
    throw new Error("Unauthorized access to school usage");
  }

  const targetSchoolId = schoolId || currentSchoolId;

  if (!targetSchoolId) {
    throw new Error("School ID required");
  }

  const month = new Date().toISOString().slice(0, 7);

  await db.usageCounter.upsert({
    where: {
      schoolId_month: {
        schoolId: targetSchoolId,
        month,
      },
    },
    update: {
      smsUsed: {
        increment: count,
      },
    },
    create: {
      schoolId: targetSchoolId,
      month,
      smsUsed: count,
      whatsappUsed: 0,
      storageUsedMB: 0,
      whatsappLimit: 1000,
      smsLimit: 1000,
      storageLimitMB: 1024,
    },
  });
}

/**
 * Increment storage usage counter
 */
export async function incrementStorageUsage(sizeMB: number, schoolId?: string): Promise<void> {
  const { schoolId: currentSchoolId, isSuperAdmin } = await requireSchoolAccess();

  if (schoolId && schoolId !== currentSchoolId && !isSuperAdmin) {
    throw new Error("Unauthorized access to school usage");
  }

  const targetSchoolId = schoolId || currentSchoolId;

  if (!targetSchoolId) {
    throw new Error("School ID required");
  }

  const month = new Date().toISOString().slice(0, 7);

  await db.usageCounter.upsert({
    where: {
      schoolId_month: {
        schoolId: targetSchoolId,
        month,
      },
    },
    update: {
      storageUsedMB: {
        increment: sizeMB,
      },
    },
    create: {
      schoolId: targetSchoolId,
      month,
      storageUsedMB: sizeMB,
      whatsappUsed: 0,
      smsUsed: 0,
      whatsappLimit: 1000,
      smsLimit: 1000,
      storageLimitMB: 1024,
    },
  });
}

/**
 * Update usage limits for a school (Super Admin only)
 */
export async function updateUsageLimits(
  schoolId: string,
  limits: Partial<UsageLimits>
): Promise<void> {
  const month = new Date().toISOString().slice(0, 7);

  await db.usageCounter.upsert({
    where: {
      schoolId_month: {
        schoolId,
        month,
      },
    },
    update: limits,
    create: {
      schoolId,
      month,
      whatsappLimit: limits.whatsappLimit || 1000,
      smsLimit: limits.smsLimit || 1000,
      storageLimitMB: limits.storageLimitMB || 1024,
      whatsappUsed: 0,
      smsUsed: 0,
      storageUsedMB: 0,
    },
  });
}

/**
 * Get usage statistics for all schools (Super Admin only)
 */
export async function getAllSchoolsUsageStats(): Promise<Array<{
  schoolId: string;
  schoolName: string;
  stats: UsageStats;
}>> {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const usageCounters = await db.usageCounter.findMany({
    where: {
      month: currentMonth,
    },
    include: {
      school: {
        select: {
          name: true,
        },
      },
    },
  });

  return usageCounters.map(counter => ({
    schoolId: counter.schoolId,
    schoolName: counter.school.name,
    stats: {
      whatsappUsed: counter.whatsappUsed,
      smsUsed: counter.smsUsed,
      storageUsedMB: counter.storageUsedMB,
      whatsappLimit: counter.whatsappLimit,
      smsLimit: counter.smsLimit,
      storageLimitMB: counter.storageLimitMB,
      whatsappRemaining: Math.max(0, counter.whatsappLimit - counter.whatsappUsed),
      smsRemaining: Math.max(0, counter.smsLimit - counter.smsUsed),
      storageRemainingMB: Math.max(0, counter.storageLimitMB - counter.storageUsedMB),
    },
  }));
}

/**
 * Reset monthly usage counters (run at the start of each month)
 */
export async function resetMonthlyUsage(): Promise<void> {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStr = lastMonth.toISOString().slice(0, 7);

  // Archive last month's data (optional - could be moved to a separate table)
  // For now, we'll just reset the counters for the new month

  const currentMonth = new Date().toISOString().slice(0, 7);

  // Create new counters for current month with reset usage
  const schools = await db.school.findMany({
    select: { id: true },
  });

  for (const school of schools) {
    const existingCounter = await db.usageCounter.findFirst({
      where: {
        schoolId: school.id,
        month: currentMonth,
      },
    });

    if (!existingCounter) {
      // Get limits from subscription/plan
      const limits = await getUsageLimits(school.id);

      await db.usageCounter.create({
        data: {
          schoolId: school.id,
          month: currentMonth,
          whatsappUsed: 0,
          smsUsed: 0,
          storageUsedMB: 0,
          whatsappLimit: limits.whatsappLimit,
          smsLimit: limits.smsLimit,
          storageLimitMB: limits.storageLimitMB,
        },
      });
    }
  }
}