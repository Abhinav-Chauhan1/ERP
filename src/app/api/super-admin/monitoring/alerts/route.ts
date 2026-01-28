import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { monitoringService } from '@/lib/services/monitoring-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

const createAlertSchema = z.object({
  alertType: z.string().min(1),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  title: z.string().min(1),
  description: z.string().min(1),
  threshold: z.number().optional(),
  conditions: z.record(z.any()).optional(),
  recipients: z.array(z.string().email()).optional(),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 100,
};

/**
 * GET /api/super-admin/monitoring/alerts
 * Get system alerts
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
    const filters = {
      severity: searchParams.get('severity') || undefined,
      isResolved: searchParams.get('isResolved') === 'true' ? true : 
                  searchParams.get('isResolved') === 'false' ? false : undefined,
      alertType: searchParams.get('alertType') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const alerts = await monitoringService.getAlerts(filters);

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'ALERT',
      metadata: {
        filters,
        resultCount: alerts.length,
      },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/super-admin/monitoring/alerts
 * Create a new alert
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
    const validatedData = createAlertSchema.parse(body);

    const alert = await monitoringService.createAlert(validatedData);

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.CREATE,
      resource: 'ALERT',
      resourceId: alert.id,
      changes: validatedData,
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error('Error creating alert:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}