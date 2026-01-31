import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { schoolService } from '@/lib/services/school-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

const suspendSchema = z.object({
  reason: z.string().min(1),
  suspendUntil: z.string().transform(str => new Date(str)).optional(),
  notifyUsers: z.boolean().default(true),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 20, // Restrictive for suspension operations
};

/**
 * POST /api/super-admin/schools/[id]/suspend
 * Suspend a school
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = suspendSchema.parse(body);

    // Use the school service to suspend the school
    const result = await schoolService.suspendSchool((await params).id, validatedData.reason);

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      resource: 'SCHOOL',
      resourceId: (await params).id,
      changes: {
        action: 'suspend',
        reason: validatedData.reason,
        suspendUntil: validatedData.suspendUntil,
        notifyUsers: validatedData.notifyUsers,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'School suspended successfully',
      school: result,
    });
  } catch (error) {
    console.error('Error suspending school:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/super-admin/schools/[id]/suspend
 * Reactivate a suspended school
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await schoolService.reactivateSchool((await params).id);

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      resource: 'SCHOOL',
      resourceId: (await params).id,
      changes: {
        action: 'reactivate',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'School reactivated successfully',
      school: result,
    });
  } catch (error) {
    console.error('Error reactivating school:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}