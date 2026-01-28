import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { emergencyAccessService } from '@/lib/services/emergency-access-service';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

const statusCheckSchema = z.object({
  targetType: z.enum(['USER', 'SCHOOL']),
  targetId: z.string().min(1),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Allow frequent status checks
};

/**
 * GET /api/super-admin/emergency/status
 * Check if account is emergency disabled
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

    const { searchParams } = new URL(request.url);
    const { targetType, targetId } = statusCheckSchema.parse({
      targetType: searchParams.get('targetType'),
      targetId: searchParams.get('targetId'),
    });

    const status = await emergencyAccessService.isEmergencyDisabled(targetType, targetId);

    return NextResponse.json({
      success: true,
      data: {
        targetType,
        targetId,
        ...status,
        checkedAt: new Date().toISOString(),
        checkedBy: session.user.name || session.user.email,
      }
    });

  } catch (error) {
    console.error('Emergency access status check error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}