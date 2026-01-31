import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { schoolPermissionsService } from '@/lib/services/school-permissions-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

const permissionsSchema = z.object({
  permissions: z.record(z.boolean()),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 100,
};

/**
 * GET /api/super-admin/schools/[id]/permissions
 * Get school permissions
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

    // Get school permissions using the service
    const permissions = await schoolPermissionsService.getSchoolPermissions((await params).id);
    const categories = schoolPermissionsService.getPermissionCategories();

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'SCHOOL_PERMISSIONS',
      resourceId: (await params).id,
    });

    return NextResponse.json({
      schoolId: (await params).id,
      permissions,
      categories,
    });
  } catch (error) {
    console.error('Error fetching school permissions:', error);
    
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
 * PUT /api/super-admin/schools/[id]/permissions
 * Update school permissions
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
    const { permissions } = permissionsSchema.parse(body);

    // Update permissions using the service
    const updatedPermissions = await schoolPermissionsService.updateSchoolPermissions(
      (await params).id,
      permissions,
      session.user.id
    );

    return NextResponse.json({
      message: 'School permissions updated successfully',
      permissions: updatedPermissions,
    });
  } catch (error) {
    console.error('Error updating school permissions:', error);
    
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