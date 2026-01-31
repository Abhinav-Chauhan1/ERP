import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { analyticsService } from '@/lib/services/analytics-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

const reportConfigSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['revenue', 'churn', 'usage', 'custom']),
  timeRange: z.object({
    startDate: z.string().transform(str => new Date(str)),
    endDate: z.string().transform(str => new Date(str)),
  }),
  filters: z.record(z.any()).optional(),
  metrics: z.array(z.string()),
  format: z.enum(['json', 'csv', 'pdf']),
  schedule: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    recipients: z.array(z.string().email()),
  }).optional(),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 50, // Lower limit for report generation
};

/**
 * POST /api/super-admin/analytics/reports
 * Generate a custom report
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
    const validatedConfig = reportConfigSchema.parse(body);

    const report = await analyticsService.generateCustomReport({
      ...validatedConfig,
      filters: validatedConfig.filters || {}
    });

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.CREATE,
      resource: 'REPORT',
      resourceId: report.id,
      changes: {
        reportConfig: validatedConfig,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error generating report:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}