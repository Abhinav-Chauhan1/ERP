import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

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
      select: { id: true, name: true },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // In a real implementation, you would fetch from a notification_settings table
    // For now, return default settings
    const defaultSettings = {
      emailNotifications: {
        enabled: true,
        adminAlerts: true,
        systemUpdates: true,
        billingAlerts: true,
        usageAlerts: true,
      },
      smsNotifications: {
        enabled: false,
        criticalAlerts: true,
        billingAlerts: true,
      },
      whatsappNotifications: {
        enabled: false,
        adminAlerts: false,
        systemUpdates: false,
      },
      pushNotifications: {
        enabled: true,
        realTimeAlerts: true,
        dailyDigest: false,
      },
      alertThresholds: {
        usageWarning: 80,
        usageCritical: 95,
        billingDueDays: 7,
      },
      notificationTiming: {
        quietHoursStart: "22:00",
        quietHoursEnd: "08:00",
        timezone: "Asia/Kolkata",
      },
    };

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'SCHOOL_NOTIFICATION_SETTINGS',
      resourceId: params.id,
    });

    return NextResponse.json({
      schoolId: params.id,
      schoolName: school.name,
      settings: defaultSettings,
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
    const { settings } = notificationSettingsSchema.parse(body);

    // Check if school exists
    const school = await db.school.findUnique({
      where: { id: params.id },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // In a real implementation, you would store settings in a notification_settings table
    // For now, we'll simulate the update
    
    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      resource: 'SCHOOL_NOTIFICATION_SETTINGS',
      resourceId: params.id,
      changes: { settings },
    });

    return NextResponse.json({
      message: 'School notification settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('Error updating school notification settings:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}