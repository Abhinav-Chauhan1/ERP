import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { emergencyAccessService } from '@/lib/services/emergency-access-service';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

const historyFiltersSchema = z.object({
  targetType: z.enum(['USER', 'SCHOOL']).optional(),
  targetId: z.string().optional(),
  performedBy: z.string().optional(),
  action: z.enum(['DISABLE', 'ENABLE', 'FORCE_DISABLE']).optional(),
  startDate: z.string().transform(str => new Date(str)).optional(),
  endDate: z.string().transform(str => new Date(str)).optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Allow reasonable access to history
};

/**
 * GET /api/super-admin/emergency/history
 * Get emergency access history with filtering
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
    const filters = historyFiltersSchema.parse({
      targetType: searchParams.get('targetType') || undefined,
      targetId: searchParams.get('targetId') || undefined,
      performedBy: searchParams.get('performedBy') || undefined,
      action: searchParams.get('action') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    });

    const result = await emergencyAccessService.getEmergencyAccessHistory(filters);

    return NextResponse.json({
      success: true,
      data: {
        history: result.history,
        total: result.total,
        hasMore: result.hasMore,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          totalPages: Math.ceil(result.total / filters.limit),
          currentPage: Math.floor(filters.offset / filters.limit) + 1,
        }
      }
    });

  } catch (error) {
    console.error('Emergency access history error:', error);
    
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