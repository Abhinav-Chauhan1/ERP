import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { monitoringService } from '@/lib/services/monitoring-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { rateLimit } from '@/lib/middleware/rate-limit';

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 200, // Higher limit for health checks
};

/**
 * GET /api/super-admin/monitoring/health
 * Get system health status
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const systemHealthResult = await monitoringService.getSystemHealth();
    
    if (!systemHealthResult.success) {
      throw systemHealthResult.error;
    }

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'SYSTEM_HEALTH',
      metadata: {
        healthStatus: systemHealthResult.data.overall,
      },
    });

    return NextResponse.json(systemHealthResult.data);
  } catch (error) {
    console.error('Error fetching system health:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}