import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { emergencyAccessService } from '@/lib/services/emergency-access-service';
import { rateLimit } from '@/lib/middleware/rate-limit';

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // Allow reasonable access to stats
};

/**
 * GET /api/super-admin/emergency/stats
 * Get emergency access statistics
 * Requirements: 10.7 - Super admin should have emergency access to disable any school or user account
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await emergencyAccessService.getEmergencyAccessStats();

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        generatedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Emergency access stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}