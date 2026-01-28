import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { analyticsService } from '@/lib/services/analytics-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

const timeRangeSchema = z.object({
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 100,
};

/**
 * GET /api/super-admin/analytics/revenue
 * Get comprehensive revenue analytics
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const validatedTimeRange = timeRangeSchema.parse({ startDate, endDate });
    const revenueMetrics = await analyticsService.getRevenueMetrics(validatedTimeRange);

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'ANALYTICS',
      metadata: {
        type: 'revenue',
        timeRange: validatedTimeRange,
      },
    });

    return NextResponse.json(revenueMetrics);
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}