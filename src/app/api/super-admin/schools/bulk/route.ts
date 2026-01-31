import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { schoolService } from '@/lib/services/school-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

const bulkOperationSchema = z.object({
  action: z.enum(['suspend', 'reactivate', 'update', 'delete']),
  schoolIds: z.array(z.string()).min(1).max(100), // Limit bulk operations
  data: z.record(z.any()).optional(), // For update operations
  reason: z.string().optional(), // For suspend/delete operations
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 10, // Very restrictive for bulk operations
};

/**
 * POST /api/super-admin/schools/bulk
 * Perform bulk operations on schools
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
    const validatedData = bulkOperationSchema.parse(body);

    let results;
    switch (validatedData.action) {
      case 'suspend':
        results = await schoolService.bulkSuspendSchools(
          validatedData.schoolIds,
          validatedData.reason || 'Bulk suspension'
        );
        break;
      case 'reactivate':
        results = await schoolService.bulkReactivateSchools(validatedData.schoolIds);
        break;
      case 'update':
        if (!validatedData.data) {
          return NextResponse.json(
            { error: 'Data is required for update operations' },
            { status: 400 }
          );
        }
        results = await schoolService.performBulkOperation({
          operation: 'update_plan',
          schoolIds: validatedData.schoolIds,
          data: validatedData.data
        });
        break;
      case 'delete':
        results = await schoolService.performBulkOperation({
          operation: 'delete',
          schoolIds: validatedData.schoolIds
        });
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid bulk operation' },
          { status: 400 }
        );
    }

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      resource: 'SCHOOL',
      changes: {
        bulkOperation: validatedData.action,
        schoolIds: validatedData.schoolIds,
        affectedCount: results.success,
        data: validatedData.data,
        reason: validatedData.reason,
      },
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}