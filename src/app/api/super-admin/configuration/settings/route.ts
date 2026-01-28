import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { configurationService } from '@/lib/services/configuration-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

const updateSettingsSchema = z.object({
  category: z.string().min(1),
  settings: z.record(z.any()),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 50, // Restrictive for configuration changes
};

/**
 * GET /api/super-admin/configuration/settings
 * Get system configuration settings
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const settings = await configurationService.getSettings(category || undefined);

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'SYSTEM_CONFIG',
      metadata: {
        category: category || 'all',
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/super-admin/configuration/settings
 * Update system configuration settings
 */
export async function PUT(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateSettingsSchema.parse(body);

    const updatedSettings = await configurationService.updateSettings(
      validatedData.category,
      validatedData.settings
    );

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      resource: 'SYSTEM_CONFIG',
      resourceId: validatedData.category,
      changes: validatedData.settings,
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}