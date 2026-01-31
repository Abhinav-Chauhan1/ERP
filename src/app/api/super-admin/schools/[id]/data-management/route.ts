import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';
import { schoolDataManagementService } from '@/lib/services/school-data-management-service';
import { cacheService } from '@/lib/services/cache-service';
import { withErrorHandler, NotFoundError, validateInput } from '@/lib/middleware/enhanced-error-handler';

const dataManagementSettingsSchema = z.object({
  settings: z.object({
    backupSettings: z.object({
      autoBackupEnabled: z.boolean(),
      backupFrequency: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY']),
      backupRetention: z.number().min(7).max(365),
      includeFiles: z.boolean(),
      encryptBackups: z.boolean(),
    }),
    exportSettings: z.object({
      allowDataExport: z.boolean(),
      exportFormats: z.array(z.string()),
      requireApproval: z.boolean(),
    }),
    dataRetention: z.object({
      studentDataRetention: z.number().min(1).max(50),
      auditLogRetention: z.number().min(30).max(2555),
      messageRetention: z.number().min(7).max(365),
      autoCleanup: z.boolean(),
    }),
    storageManagement: z.object({
      storageQuota: z.number().min(1),
      currentUsage: z.number().min(0),
      compressionEnabled: z.boolean(),
      autoArchive: z.boolean(),
      archiveAfterDays: z.number().min(30).max(3650),
    }),
  }),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 100,
};

/**
 * GET /api/super-admin/schools/[id]/data-management
 * Get school data management settings
 */
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const rateLimitResult = await rateLimit(request, rateLimitConfig);
  if (rateLimitResult) return rateLimitResult;

  const session = await auth();
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Try to get from cache first
  const cacheKey = `data-management-settings:${(await params).id}`;
  const cached = cacheService.getSettings('data-management', (await params).id);
  
  if (cached) {
    return NextResponse.json(cached);
  }

  // Check if school exists
  const school = await db.school.findUnique({
    where: { id: (await params).id },
    select: { id: true, name: true, plan: true },
  });

  if (!school) {
    throw new NotFoundError('School');
  }

  // Get settings using the service
  const settings = await schoolDataManagementService.getSchoolDataManagementSettings((await params).id);
  const storageUsage = await schoolDataManagementService.getStorageUsage((await params).id);
  const recommendations = await schoolDataManagementService.getDataRetentionRecommendations((await params).id);

  const response = {
    schoolId: (await params).id,
    schoolName: school.name,
    settings,
    storageUsage,
    recommendations,
  };

  // Cache the response
  cacheService.cacheSettings('data-management', (await params).id, response);

  await logAuditEvent({
    userId: session.user.id,
    action: AuditAction.READ,
    resource: 'SCHOOL_DATA_MANAGEMENT',
    resourceId: (await params).id,
  });

  return NextResponse.json(response);
});

/**
 * PUT /api/super-admin/schools/[id]/data-management
 * Update school data management settings
 */
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const rateLimitResult = await rateLimit(request, rateLimitConfig);
  if (rateLimitResult) return rateLimitResult;

  const session = await auth();
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const validatedData = validateInput<{ settings: any }>(dataManagementSettingsSchema, body);
  const { settings } = validatedData;

  // Check if school exists
  const school = await db.school.findUnique({
    where: { id: (await params).id },
  });

  if (!school) {
    throw new NotFoundError('School');
  }

  // Update settings using the service
  const updatedSettings = await schoolDataManagementService.updateSchoolDataManagementSettings(
    (await params).id,
    {
      autoBackupEnabled: settings.backupSettings.autoBackupEnabled,
      backupFrequency: settings.backupSettings.backupFrequency,
      backupRetention: settings.backupSettings.backupRetention,
      includeFiles: settings.backupSettings.includeFiles,
      encryptBackups: settings.backupSettings.encryptBackups,
      allowDataExport: settings.exportSettings.allowDataExport,
      exportFormats: settings.exportSettings.exportFormats,
      requireApproval: settings.exportSettings.requireApproval,
      studentDataRetention: settings.dataRetention.studentDataRetention,
      auditLogRetention: settings.dataRetention.auditLogRetention,
      messageRetention: settings.dataRetention.messageRetention,
      autoCleanup: settings.dataRetention.autoCleanup,
      storageQuota: settings.storageManagement.storageQuota,
      compressionEnabled: settings.storageManagement.compressionEnabled,
      autoArchive: settings.storageManagement.autoArchive,
      archiveAfterDays: settings.storageManagement.archiveAfterDays,
    },
    session.user.id
  );

  // Invalidate cache
  cacheService.invalidateSettingsCache((await params).id);

  return NextResponse.json({
    message: 'School data management settings updated successfully',
    settings: updatedSettings,
  });
});