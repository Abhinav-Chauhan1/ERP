import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction, SchoolStatus } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE', 'DEACTIVATED']),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 50,
};

/**
 * PUT /api/super-admin/schools/[id]/status
 * Update school status
 */
export async function PUT(
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
    const { status } = updateStatusSchema.parse(body);

    // Check if school exists
    const existingSchool = await db.school.findUnique({
      where: { id: (await params).id },
    });

    if (!existingSchool) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Update school status
    const updatedSchool = await db.school.update({
      where: { id: (await params).id },
      data: { 
        status: status as SchoolStatus,
        updatedAt: new Date(),
      },
    });

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      resource: 'SCHOOL',
      resourceId: (await params).id,
      changes: { 
        status: { from: existingSchool.status, to: status }
      },
    });

    return NextResponse.json({
      message: 'School status updated successfully',
      school: updatedSchool,
    });
  } catch (error) {
    console.error('Error updating school status:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}