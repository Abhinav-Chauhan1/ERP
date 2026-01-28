import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { analyticsService } from '@/lib/services/analytics-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

const exportConfigSchema = z.object({
  type: z.enum(['revenue', 'churn', 'usage', 'schools', 'subscriptions']),
  format: z.enum(['csv', 'json', 'excel']),
  timeRange: z.object({
    startDate: z.string().transform(str => new Date(str)),
    endDate: z.string().transform(str => new Date(str)),
  }).optional(),
  filters: z.record(z.any()).optional(),
  includeDetails: z.boolean().optional(),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 20, // Very restrictive for data exports
};

/**
 * POST /api/super-admin/analytics/export
 * Export analytics data
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
    const validatedConfig = exportConfigSchema.parse(body);

    const exportResult = await analyticsService.exportData(validatedConfig);

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.CREATE,
      resource: 'DATA_EXPORT',
      resourceId: exportResult.id,
      changes: {
        exportConfig: validatedConfig,
        recordCount: exportResult.recordCount,
      },
    });

    return NextResponse.json(exportResult, { status: 201 });
  } catch (error) {
    console.error('Error exporting data:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}