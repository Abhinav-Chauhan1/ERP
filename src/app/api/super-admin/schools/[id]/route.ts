import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { schoolService } from '@/lib/services/school-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

const updateSchoolSchema = z.object({
  name: z.string().min(1).optional(),
  schoolCode: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  domain: z.string().optional(),
  subdomain: z.string().optional(),
  plan: z.enum(['STARTER', 'GROWTH', 'DOMINATE']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  isOnboarded: z.boolean().optional(),
  tagline: z.string().optional(),
  logo: z.string().optional(),
  favicon: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  razorpayCustomerId: z.string().optional(),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 100,
};

/**
 * GET /api/super-admin/schools/[id]
 * Get a specific school with detailed information
 */
export async function GET(
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

    const school = await schoolService.getSchoolById((await params).id);
    
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'SCHOOL',
      resourceId: (await params).id,
    });

    return NextResponse.json(school);
  } catch (error) {
    console.error('Error fetching school:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/super-admin/schools/[id]
 * Update a school
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
    const validatedData = updateSchoolSchema.parse(body);

    const school = await schoolService.updateSchool((await params).id, validatedData);

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      resource: 'SCHOOL',
      resourceId: (await params).id,
      changes: validatedData,
    });

    return NextResponse.json(school);
  } catch (error) {
    console.error('Error updating school:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/super-admin/schools/[id]
 * Delete/deactivate a school
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

    await schoolService.performBulkOperation({
      operation: 'delete',
      schoolIds: [(await params).id]
    });

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.DELETE,
      resource: 'SCHOOL',
      resourceId: (await params).id,
    });

    return NextResponse.json({ message: 'School deleted successfully' });
  } catch (error) {
    console.error('Error deleting school:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}