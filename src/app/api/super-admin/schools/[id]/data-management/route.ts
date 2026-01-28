import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

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
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if school exists
    const school = await db.school.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, plan: true },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Get current storage usage (this would be calculated from actual file storage)
    const currentUsage = 2.5; // GB - placeholder

    // Set storage quota based on plan
    const storageQuotas = {
      STARTER: 1,
      GROWTH: 5,
      DOMINATE: 50,
    };

    const defaultSettings = {
      backupSettings: {
        autoBackupEnabled: true,
        backupFrequency: "DAILY" as const,
        backupRetention: 30,
        includeFiles: true,
        encryptBackups: true,
      },
      exportSettings: {
        allowDataExport: true,
        exportFormats: ["CSV", "JSON", "PDF"],
        requireApproval: true,
      },
      dataRetention: {
        studentDataRetention: 7,
        auditLogRetention: 365,
        messageRetention: 90,
        autoCleanup: false,
      },
      storageManagement: {
        storageQuota: storageQuotas[school.plan as keyof typeof storageQuotas] || 1,
        currentUsage,
        compressionEnabled: true,
        autoArchive: true,
        archiveAfterDays: 365,
      },
    };

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'SCHOOL_DATA_MANAGEMENT',
      resourceId: params.id,
    });

    return NextResponse.json({
      schoolId: params.id,
      schoolName: school.name,
      settings: defaultSettings,
    });
  } catch (error) {
    console.error('Error fetching school data management settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/super-admin/schools/[id]/data-management
 * Update school data management settings
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = dataManagementSettingsSchema.parse(body);

    // Check if school exists
    const school = await db.school.findUnique({
      where: { id: params.id },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Validate export formats
    const validFormats = ['CSV', 'JSON', 'PDF', 'XLSX'];
    const invalidFormats = settings.exportSettings.exportFormats.filter(
      format => !validFormats.includes(format)
    );

    if (invalidFormats.length > 0) {
      return NextResponse.json(
        { error: 'Invalid export formats', invalidFormats },
        { status: 400 }
      );
    }

    // In a real implementation, you would store settings in a data_management_settings table
    // For now, we'll simulate the update
    
    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      resource: 'SCHOOL_DATA_MANAGEMENT',
      resourceId: params.id,
      changes: { settings },
    });

    return NextResponse.json({
      message: 'School data management settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('Error updating school data management settings:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}