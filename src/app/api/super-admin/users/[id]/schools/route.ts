import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { UserRole, SchoolStatus } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';
import { logAuditEvent } from '@/lib/services/audit-service';

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
};

const addSchoolAssociationSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  role: z.enum(['STUDENT', 'PARENT', 'TEACHER', 'ADMIN']),
  isActive: z.boolean().default(true),
});

const updateSchoolAssociationSchema = z.object({
  role: z.enum(['STUDENT', 'PARENT', 'TEACHER', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/super-admin/users/[id]/schools
 * Get all school associations for a user
 * Requirements: 10.5 - Super admin should manage user accounts across all schools
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

    const { id } = await params;

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id },
      select: { id: true, name: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all school associations
    const userSchools = await db.userSchool.findMany({
      where: { userId: id },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            schoolCode: true,
            status: true,
            plan: true,
            createdAt: true,
            _count: {
              select: {
                students: true,
                teachers: true,
                administrators: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const transformedAssociations = userSchools.map(us => ({
      id: us.id,
      schoolId: us.schoolId,
      schoolName: us.school.name,
      schoolCode: us.school.schoolCode,
      schoolStatus: us.school.status,
      schoolPlan: us.school.plan,
      schoolCreatedAt: us.school.createdAt,
      schoolUserCounts: us.school._count,
      role: us.role,
      isActive: us.isActive,
      joinedAt: us.createdAt,
      updatedAt: us.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
        },
        schools: transformedAssociations,
        totalSchools: transformedAssociations.length,
      }
    });

  } catch (error) {
    console.error('Error fetching user school associations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/super-admin/users/[id]/schools
 * Add a new school association for a user
 * Requirements: 10.5 - Super admin should manage user accounts across all schools
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

    const { id } = await params;
    const body = await request.json();
    const validatedData = addSchoolAssociationSchema.parse(body);

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id },
      select: { id: true, name: true, isActive: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if school exists and is active
    const school = await db.school.findUnique({
      where: { id: validatedData.schoolId },
      select: { id: true, name: true, schoolCode: true, status: true }
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    if (school.status !== SchoolStatus.ACTIVE) {
      return NextResponse.json(
        { error: 'Cannot add users to inactive school' },
        { status: 400 }
      );
    }

    // Check if association already exists
    const existingAssociation = await db.userSchool.findUnique({
      where: {
        userId_schoolId: {
          userId: id,
          schoolId: validatedData.schoolId
        }
      }
    });

    if (existingAssociation) {
      return NextResponse.json(
        { error: 'User is already associated with this school' },
        { status: 400 }
      );
    }

    // Create the association
    const userSchool = await db.userSchool.create({
      data: {
        userId: id,
        schoolId: validatedData.schoolId,
        role: validatedData.role,
        isActive: validatedData.isActive,
      },
      include: {
        school: {
          select: {
            name: true,
            schoolCode: true,
            status: true,
          }
        }
      }
    });

    // Log the association creation
    await logAuditEvent({
      userId: session.user.id,
      action: 'CREATE',
      resource: 'USER_SCHOOL',
      resourceId: userSchool.id,
      changes: {
        userId: id,
        userName: user.name,
        schoolId: validatedData.schoolId,
        schoolName: school.name,
        schoolCode: school.schoolCode,
        role: validatedData.role,
        isActive: validatedData.isActive,
      },
      schoolId: validatedData.schoolId,
    });

    return NextResponse.json({
      success: true,
      message: 'User associated with school successfully',
      data: {
        id: userSchool.id,
        schoolId: userSchool.schoolId,
        schoolName: userSchool.school.name,
        schoolCode: userSchool.school.schoolCode,
        schoolStatus: userSchool.school.status,
        role: userSchool.role,
        isActive: userSchool.isActive,
        joinedAt: userSchool.createdAt,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user school association:', error);
    
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

/**
 * PATCH /api/super-admin/users/[id]/schools/[schoolId]
 * Update a user's school association
 * Requirements: 10.5 - Super admin should manage user accounts across all schools
 */
export async function PATCH(
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

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');

    if (!schoolId) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateSchoolAssociationSchema.parse(body);

    // Check if association exists
    const existingAssociation = await db.userSchool.findUnique({
      where: {
        userId_schoolId: {
          userId: id,
          schoolId: schoolId
        }
      },
      include: {
        user: { select: { name: true } },
        school: { select: { name: true, schoolCode: true } }
      }
    });

    if (!existingAssociation) {
      return NextResponse.json(
        { error: 'User school association not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (validatedData.role !== undefined) updateData.role = validatedData.role;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

    // Update the association
    const updatedAssociation = await db.userSchool.update({
      where: {
        userId_schoolId: {
          userId: id,
          schoolId: schoolId
        }
      },
      data: updateData,
      include: {
        school: {
          select: {
            name: true,
            schoolCode: true,
            status: true,
          }
        }
      }
    });

    // Log the update
    await logAuditEvent({
      userId: session.user.id,
      action: 'UPDATE',
      resource: 'USER_SCHOOL',
      resourceId: existingAssociation.id,
      changes: {
        userId: id,
        userName: existingAssociation.user.name,
        schoolId: schoolId,
        schoolName: existingAssociation.school.name,
        before: {
          role: existingAssociation.role,
          isActive: existingAssociation.isActive,
        },
        after: updateData,
      },
      schoolId: schoolId,
    });

    return NextResponse.json({
      success: true,
      message: 'User school association updated successfully',
      data: {
        id: updatedAssociation.id,
        schoolId: updatedAssociation.schoolId,
        schoolName: updatedAssociation.school.name,
        schoolCode: updatedAssociation.school.schoolCode,
        schoolStatus: updatedAssociation.school.status,
        role: updatedAssociation.role,
        isActive: updatedAssociation.isActive,
        updatedAt: updatedAssociation.updatedAt,
      }
    });

  } catch (error) {
    console.error('Error updating user school association:', error);
    
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

/**
 * DELETE /api/super-admin/users/[id]/schools/[schoolId]
 * Remove a user's school association
 * Requirements: 10.5 - Super admin should manage user accounts across all schools
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

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');

    if (!schoolId) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      );
    }

    // Check if association exists
    const existingAssociation = await db.userSchool.findUnique({
      where: {
        userId_schoolId: {
          userId: id,
          schoolId: schoolId
        }
      },
      include: {
        user: { select: { name: true } },
        school: { select: { name: true, schoolCode: true } }
      }
    });

    if (!existingAssociation) {
      return NextResponse.json(
        { error: 'User school association not found' },
        { status: 404 }
      );
    }

    // Check if this is the user's last school association
    const totalAssociations = await db.userSchool.count({
      where: { userId: id }
    });

    if (totalAssociations === 1) {
      return NextResponse.json(
        { error: 'Cannot remove user\'s last school association. Delete the user instead.' },
        { status: 400 }
      );
    }

    // Store association info for audit log
    const associationInfo = {
      userId: id,
      userName: existingAssociation.user.name,
      schoolId: schoolId,
      schoolName: existingAssociation.school.name,
      schoolCode: existingAssociation.school.schoolCode,
      role: existingAssociation.role,
      isActive: existingAssociation.isActive,
    };

    // Delete the association
    await db.userSchool.delete({
      where: {
        userId_schoolId: {
          userId: id,
          schoolId: schoolId
        }
      }
    });

    // Log the deletion
    await logAuditEvent({
      userId: session.user.id,
      action: 'DELETE',
      resource: 'USER_SCHOOL',
      resourceId: existingAssociation.id,
      changes: {
        deletedAssociation: associationInfo,
        reason: 'Super admin removal',
      },
      schoolId: schoolId,
    });

    return NextResponse.json({
      success: true,
      message: 'User school association removed successfully'
    });

  } catch (error) {
    console.error('Error removing user school association:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}