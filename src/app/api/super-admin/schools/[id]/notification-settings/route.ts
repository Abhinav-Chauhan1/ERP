import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';
import { schoolNotificationSettingsService } from '@/lib/services/school-notification-settings-service';

const notificationSettingsSchema = z.object({
  settings: z.object({
    emailNotifications: z.object({
      enabled: z.boolean(),
      adminAlerts: z.boolean(),
      systemUpdates: z.boolean(),
      billingAlerts: z.boolean(),
      usageAlerts: z.boolean(),
    }),
    smsNotifications: z.object({
      enabled: z.boolean(),
      criticalAlerts: z.boolean(),
      billingAlerts: z.boolean(),
    }),
    whatsappNotifications: z.object({
      enabled: z.boolean(),
      adminAlerts: z.boolean(),
      systemUpdates: z.boolean(),
    }),
    pushNotifications: z.object({
      enabled: z.boolean(),
      realTimeAlerts: z.boolean(),
      dailyDigest: z.boolean(),
    }),
    alertThresholds: z.object({
      usageWarning: z.number().min(0).max(100),
      usageCritical: z.number().min(0).max(100),
      billingDueDays: z.number().min(1).max(30),
    }),
    notificationTiming: z.object({
      quietHoursStart: z.string(),
      quietHoursEnd: z.string(),
      timezone: z.string(),
    }),
  }),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 100,
};

/**
 * GET /api/super-admin/schools/[id]/notification-settings
 * Get school notification settings
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
      where: { id: (await params).id },
      select: { id: true, name: true },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Get settings using the service
    const settings = await schoolNotificationSettingsService.getSchoolNotificationSettings((await params).id);
    const channels = await schoolNotificationSettingsService.getNotificationChannels((await params).id);
    const stats = await schoolNotificationSettingsService.getNotificationStats((await params).id);

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'SCHOOL_NOTIFICATION_SETTINGS',
      resourceId: (await params).id,
    });

    return NextResponse.json({
      schoolId: (await params).id,
      schoolName: school.name,
      settings,
      channels,
      stats,
    });
  } catch (error) {
    console.error('Error fetching school notification settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/super-admin/schools/[id]/notification-settings
 * Update school notification settings
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = notificationSettingsSchema.parse(body);

    // Check if school exists
    const school = await db.school.findUnique({
      where: { id: (await params).id },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Update settings using the service
    const updatedSettings = await schoolNotificationSettingsService.updateSchoolNotificationSettings(
      (await params).id,
      {
        emailEnabled: settings.emailNotifications.enabled,
        emailSystemUpdates: settings.emailNotifications.systemUpdates,
        smsEnabled: settings.smsNotifications.enabled,
        whatsappEnabled: settings.whatsappNotifications.enabled,
        pushEnabled: settings.pushNotifications.enabled,
        quietHoursEnabled: true,
        quietHoursStart: settings.notificationTiming.quietHoursStart,
        quietHoursEnd: settings.notificationTiming.quietHoursEnd,
      },
      session.user.id
    );

    return NextResponse.json({
      message: 'School notification settings updated successfully',
      settings: updatedSettings,
    });
  } catch (error) {
    console.error('Error updating school notification settings:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}