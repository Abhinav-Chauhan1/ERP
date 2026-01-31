import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { configurationService } from '@/lib/services/configuration-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

const createFeatureFlagSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isEnabled: z.boolean().default(false),
  rolloutPercentage: z.number().min(0).max(100).default(0),
  targetSchools: z.array(z.string()).optional(),
  conditions: z.record(z.any()).optional(),
});

const updateFeatureFlagSchema = createFeatureFlagSchema.partial();

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 50,
};

/**
 * GET /api/super-admin/configuration/feature-flags
 * Get all feature flags
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const featureFlags = await configurationService.getFeatureFlags();

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'FEATURE_FLAG',
      metadata: {
        count: featureFlags.length,
      },
    });

    return NextResponse.json(featureFlags);
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/super-admin/configuration/feature-flags
 * Create a new feature flag
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createFeatureFlagSchema.parse(body);

    const featureFlag = await configurationService.setFeatureFlag(
      session.user.id,
      validatedData
    );

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.CREATE,
      resource: 'FEATURE_FLAG',
      resourceId: featureFlag.id,
      changes: validatedData,
    });

    return NextResponse.json(featureFlag, { status: 201 });
  } catch (error) {
    console.error('Error creating feature flag:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}