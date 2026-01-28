import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { UserRole, SchoolStatus } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';
import { logAuditEvent } from '@/lib/services/audit-service';
import bcrypt from 'bcryptjs';

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
};

const searchUsersSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['STUDENT', 'PARENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN']).optional(),
  schoolId: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'email', 'createdAt', 'lastLoginAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional(),
  mobile: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.enum(['STUDENT', 'PARENT', 'TEACHER', 'ADMIN']),
  schoolId: z.string().min(1, 'School ID is required'),
  isActive: z.boolean().default(true),
  // Additional fields based on role
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  mobile: z.string().optional(),
  isActive: z.boolean().optional(),
  role: z.enum(['STUDENT', 'PARENT', 'TEACHER', 'ADMIN']).optional(),
  password: z.string().min(8).optional(),
});

const bulkActionSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user ID is required'),
  action: z.enum(['activate', 'deactivate', 'delete', 'change_role']),
  data: z.object({
    role: z.enum(['STUDENT', 'PARENT', 'TEACHER', 'ADMIN']).optional(),
    reason: z.string().optional(),
  }).optional(),
});

/**
 * GET /api/super-admin/users
 * Search and filter users across all schools
 * Requirements: 10.5 - Super admin should manage user accounts across all schools
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
    const params = Object.fromEntries(searchParams.entries());
    const validatedParams = searchUsersSchema.parse(params);

    // Build where clause for user search
    const where: any = {};
    
    if (validatedParams.search) {
      where.OR = [
        { name: { contains: validatedParams.search, mode: 'insensitive' } },
        { email: { contains: validatedParams.search, mode: 'insensitive' } },
        { mobile: { contains: validatedParams.search, mode: 'insensitive' } },
        { firstName: { contains: validatedParams.search, mode: 'insensitive' } },
        { lastName: { contains: validatedParams.search, mode: 'insensitive' } },
      ];
    }

    if (validatedParams.status) {
      where.isActive = validatedParams.status === 'active';
    }

    // If specific school is requested, filter by school
    let userSchoolWhere: any = {};
    if (validatedParams.schoolId) {
      userSchoolWhere.schoolId = validatedParams.schoolId;
    }

    if (validatedParams.role) {
      userSchoolWhere.role = validatedParams.role;
    }

    // Get users with their school relationships
    const [users, totalCount] = await Promise.all([
      db.user.findMany({
        where: {
          ...where,
          userSchools: {
            some: userSchoolWhere
          }
        },
        include: {
          userSchools: {
            include: {
              school: {
                select: {
                  id: true,
                  name: true,
                  schoolCode: true,
                  status: true,
                }
              }
            }
          },
          _count: {
            select: {
              userSchools: true,
            }
          }
        },
        orderBy: {
          [validatedParams.sortBy]: validatedParams.sortOrder
        },
        skip: (validatedParams.page - 1) * validatedParams.limit,
        take: validatedParams.limit,
      }),
      db.user.count({
        where: {
          ...where,
          userSchools: {
            some: userSchoolWhere
          }
        }
      })
    ]);

    // Transform the data for the response
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      schools: user.userSchools.map(us => ({
        schoolId: us.schoolId,
        schoolName: us.school.name,
        schoolCode: us.school.schoolCode,
        schoolStatus: us.school.status,
        role: us.role,
        isActive: us.isActive,
        joinedAt: us.createdAt,
      })),
      totalSchools: user._count.userSchools,
    }));

    // Log the search action
    await logAuditEvent({
      userId: session.user.id,
      action: 'READ',
      resource: 'USER',
      metadata: {
        searchParams: validatedParams,
        resultCount: users.length,
        totalCount,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        users: transformedUsers,
        pagination: {
          page: validatedParams.page,
          limit: validatedParams.limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / validatedParams.limit),
        }
      }
    });

  } catch (error) {
    console.error('Error searching users:', error);
    
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
 * POST /api/super-admin/users
 * Create a new user account
 * Requirements: 10.5 - Super admin should manage user accounts across all schools
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
    const validatedData = createUserSchema.parse(body);

    // Validate school exists and is active
    const school = await db.school.findUnique({
      where: { id: validatedData.schoolId },
      select: { id: true, name: true, status: true }
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    if (school.status !== SchoolStatus.ACTIVE) {
      return NextResponse.json(
        { error: 'Cannot add users to inactive school' },
        { status: 400 }
      );
    }

    // Check if user with email/mobile already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          ...(validatedData.email ? [{ email: validatedData.email }] : []),
          ...(validatedData.mobile ? [{ mobile: validatedData.mobile }] : []),
        ]
      }
    });

    let user;
    let isNewUser = false;

    if (existingUser) {
      // Check if user is already associated with this school
      const existingAssociation = await db.userSchool.findUnique({
        where: {
          userId_schoolId: {
            userId: existingUser.id,
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

      user = existingUser;
    } else {
      // Create new user
      const passwordHash = validatedData.password 
        ? await bcrypt.hash(validatedData.password, 12)
        : null;

      user = await db.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          mobile: validatedData.mobile,
          passwordHash,
          isActive: validatedData.isActive,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
        }
      });
      isNewUser = true;
    }

    // Create user-school association
    const userSchool = await db.userSchool.create({
      data: {
        userId: user.id,
        schoolId: validatedData.schoolId,
        role: validatedData.role,
        isActive: validatedData.isActive,
      },
      include: {
        school: {
          select: {
            name: true,
            schoolCode: true,
          }
        }
      }
    });

    // Log the user creation/association
    await logAuditEvent({
      userId: session.user.id,
      action: 'CREATE',
      resource: 'USER',
      resourceId: user.id,
      changes: {
        isNewUser,
        userData: {
          name: validatedData.name,
          email: validatedData.email,
          mobile: validatedData.mobile,
          role: validatedData.role,
        },
        schoolAssociation: {
          schoolId: validatedData.schoolId,
          schoolName: school.name,
          role: validatedData.role,
        }
      },
      schoolId: validatedData.schoolId,
    });

    return NextResponse.json({
      success: true,
      message: isNewUser ? 'User created successfully' : 'User associated with school successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
        schoolAssociation: {
          schoolId: userSchool.schoolId,
          schoolName: userSchool.school.name,
          schoolCode: userSchool.school.schoolCode,
          role: userSchool.role,
          isActive: userSchool.isActive,
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    
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
 * PATCH /api/super-admin/users
 * Bulk operations on users
 * Requirements: 10.5 - Super admin should manage user accounts across all schools
 */
export async function PATCH(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = bulkActionSchema.parse(body);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ userId: string; error: string }>
    };

    // Validate all user IDs exist
    const existingUsers = await db.user.findMany({
      where: { id: { in: validatedData.userIds } },
      select: { id: true, name: true, isActive: true }
    });

    const existingUserIds = existingUsers.map(u => u.id);
    const missingUserIds = validatedData.userIds.filter(id => !existingUserIds.includes(id));

    // Add errors for missing users
    missingUserIds.forEach(id => {
      results.errors.push({ userId: id, error: 'User not found' });
      results.failed++;
    });

    // Process existing users
    for (const user of existingUsers) {
      try {
        switch (validatedData.action) {
          case 'activate':
            await db.user.update({
              where: { id: user.id },
              data: { isActive: true }
            });
            // Also activate all user-school relationships
            await db.userSchool.updateMany({
              where: { userId: user.id },
              data: { isActive: true }
            });
            results.success++;
            break;

          case 'deactivate':
            await db.user.update({
              where: { id: user.id },
              data: { isActive: false }
            });
            // Also deactivate all user-school relationships
            await db.userSchool.updateMany({
              where: { userId: user.id },
              data: { isActive: false }
            });
            results.success++;
            break;

          case 'change_role':
            if (!validatedData.data?.role) {
              throw new Error('Role is required for change_role action');
            }
            // Update role in all user-school relationships
            await db.userSchool.updateMany({
              where: { userId: user.id },
              data: { role: validatedData.data.role }
            });
            results.success++;
            break;

          case 'delete':
            // This is a dangerous operation - only allow if user has no critical data
            const userSchoolCount = await db.userSchool.count({
              where: { userId: user.id }
            });
            
            if (userSchoolCount > 1) {
              throw new Error('Cannot delete user associated with multiple schools');
            }

            // Delete user (cascade will handle related records)
            await db.user.delete({
              where: { id: user.id }
            });
            results.success++;
            break;

          default:
            throw new Error(`Unknown action: ${validatedData.action}`);
        }
      } catch (error: any) {
        results.errors.push({ 
          userId: user.id, 
          error: error.message || 'Unknown error' 
        });
        results.failed++;
      }
    }

    // Log bulk action
    await logAuditEvent({
      userId: session.user.id,
      action: 'UPDATE',
      resource: 'USER',
      changes: {
        action: validatedData.action,
        userCount: validatedData.userIds.length,
        successCount: results.success,
        failedCount: results.failed,
        data: validatedData.data,
        reason: validatedData.data?.reason,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Bulk ${validatedData.action} completed`,
      data: results
    });

  } catch (error) {
    console.error('Error performing bulk action:', error);
    
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