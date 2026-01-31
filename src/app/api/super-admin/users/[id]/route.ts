import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';
import { logAuditEvent } from '@/lib/services/audit-service';
import bcrypt from 'bcryptjs';

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
};

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  mobile: z.string().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const updateUserSchoolSchema = z.object({
  schoolId: z.string(),
  role: z.enum(['STUDENT', 'PARENT', 'TEACHER', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/super-admin/users/[id]
 * Get detailed user information with all school associations
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

    const user = await db.user.findUnique({
      where: { id },
      include: {
        userSchools: {
          include: {
            school: {
              select: {
                id: true,
                name: true,
                schoolCode: true,
                status: true,
                plan: true,
                createdAt: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        auditLogs: {
          select: {
            id: true,
            action: true,
            resource: true,
            createdAt: true,
            details: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 audit logs
        },
        _count: {
          select: {
            userSchools: true,
            auditLogs: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get additional role-specific data
    let roleSpecificData = null;
    const primaryRole = user.userSchools[0]?.role;

    if (primaryRole === 'STUDENT') {
      roleSpecificData = await db.student.findFirst({
        where: { 
          user: { id: user.id }
        },
        include: {
          enrollments: {
            include: {
              class: {
                select: {
                  name: true,
                  sections: true,
                }
              }
            }
          }
        }
      });
    } else if (primaryRole === 'TEACHER') {
      roleSpecificData = await db.teacher.findFirst({
        where: { 
          user: { id: user.id }
        },
        select: {
          employeeId: true,
          departments: true,
          qualification: true,
          subjects: {
            select: {
              subject: {
                select: {
                  name: true,
                }
              }
            }
          }
        }
      });
    } else if (primaryRole === 'PARENT') {
      roleSpecificData = await db.parent.findFirst({
        where: { 
          user: { id: user.id }
        },
        include: {
          children: {
            include: {
              student: {
                include: {
                  user: {
                    select: {
                      name: true,
                      firstName: true,
                      lastName: true,
                    }
                  },
                  enrollments: {
                    include: {
                      class: {
                        select: {
                          name: true,
                          sections: true,
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });
    }

    // Transform the response
    const transformedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      hasPassword: !!user.passwordHash,
      schools: user.userSchools.map(us => ({
        id: us.id,
        schoolId: us.schoolId,
        schoolName: us.school.name,
        schoolCode: us.school.schoolCode,
        schoolStatus: us.school.status,
        schoolPlan: us.school.plan,
        role: us.role,
        isActive: us.isActive,
        joinedAt: us.createdAt,
        updatedAt: us.updatedAt,
      })),
      roleSpecificData,
      recentActivity: user.auditLogs,
      stats: {
        totalSchools: user._count.userSchools,
        totalAuditLogs: user._count.auditLogs,
      }
    };

    // Log the access
    await logAuditEvent({
      userId: session.user.id,
      action: 'READ',
      resource: 'USER',
      resourceId: user.id,
      metadata: {
        accessedUserName: user.name,
        accessedUserEmail: user.email,
        schoolCount: user.userSchools.length,
      },
    });

    return NextResponse.json({
      success: true,
      data: transformedUser
    });

  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/super-admin/users/[id]
 * Update user information
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
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        isActive: true,
      }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check for email/mobile conflicts if they're being updated
    if (validatedData.email || validatedData.mobile) {
      const conflictWhere: any = {
        id: { not: id },
        OR: []
      };

      if (validatedData.email) {
        conflictWhere.OR.push({ email: validatedData.email });
      }
      if (validatedData.mobile) {
        conflictWhere.OR.push({ mobile: validatedData.mobile });
      }

      const conflictingUser = await db.user.findFirst({
        where: conflictWhere
      });

      if (conflictingUser) {
        return NextResponse.json(
          { error: 'Email or mobile number already exists' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.email !== undefined) updateData.email = validatedData.email;
    if (validatedData.mobile !== undefined) updateData.mobile = validatedData.mobile;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    if (validatedData.firstName !== undefined) updateData.firstName = validatedData.firstName;
    if (validatedData.lastName !== undefined) updateData.lastName = validatedData.lastName;

    // Handle password update
    if (validatedData.password) {
      updateData.passwordHash = await bcrypt.hash(validatedData.password, 12);
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        isActive: true,
        updatedAt: true,
      }
    });

    // If user is being deactivated, also deactivate all school associations
    if (validatedData.isActive === false) {
      await db.userSchool.updateMany({
        where: { userId: id },
        data: { isActive: false }
      });
    }

    // Log the update
    await logAuditEvent({
      userId: session.user.id,
      action: 'UPDATE',
      resource: 'USER',
      resourceId: id,
      changes: {
        before: existingUser,
        after: updateData,
        passwordChanged: !!validatedData.password,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    
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
 * DELETE /api/super-admin/users/[id]
 * Delete a user account (with safety checks)
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

    // Check if user exists and get their details
    const user = await db.user.findUnique({
      where: { id },
      include: {
        userSchools: {
          include: {
            school: {
              select: { name: true }
            }
          }
        },
        _count: {
          select: {
            userSchools: true,
            auditLogs: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Safety checks - prevent deletion of users with critical data
    if (user._count.userSchools > 1) {
      return NextResponse.json(
        { error: 'Cannot delete user associated with multiple schools. Remove school associations first.' },
        { status: 400 }
      );
    }

    // Check if user is a super admin
    const isSuperAdmin = user.userSchools.some(us => us.role === 'SUPER_ADMIN');
    if (isSuperAdmin) {
      return NextResponse.json(
        { error: 'Cannot delete super admin users' },
        { status: 400 }
      );
    }

    // Store user info for audit log before deletion
    const userInfo = {
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      schools: user.userSchools.map(us => ({
        schoolName: us.school.name,
        role: us.role,
      })),
    };

    // Delete user (cascade will handle related records)
    await db.user.delete({
      where: { id }
    });

    // Log the deletion
    await logAuditEvent({
      userId: session.user.id,
      action: 'DELETE',
      resource: 'USER',
      resourceId: id,
      changes: {
        deletedUser: userInfo,
        reason: 'Super admin deletion',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}