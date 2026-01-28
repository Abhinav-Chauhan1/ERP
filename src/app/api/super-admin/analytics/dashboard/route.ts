import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { analyticsService } from '@/lib/services/analytics-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { rateLimit } from '@/lib/middleware/rate-limit';

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 200, // Higher limit for dashboard data
};

/**
 * GET /api/super-admin/analytics/dashboard
 * Get KPI dashboard data
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const kpiDashboard = await analyticsService.getKPIDashboard();

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'ANALYTICS',
      metadata: {
        type: 'dashboard',
      },
    });

    return NextResponse.json(kpiDashboard);
  } catch (error) {
    console.error('Error fetching KPI dashboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}