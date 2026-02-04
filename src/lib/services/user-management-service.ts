import { db } from "@/lib/db";
import { UserRole, SchoolStatus, Prisma } from "@prisma/client";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import bcrypt from 'bcryptjs';

// Types for user management operations
export interface UserSearchFilters {
  search?: string;
  role?: UserRole;
  schoolId?: string;
  status?: 'active' | 'inactive';
  hasMultipleSchools?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  lastLoginAfter?: Date;
  lastLoginBefore?: Date;
}

export interface UserCreateData {
  name: string;
  email?: string;
  mobile?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

export interface UserUpdateData {
  name?: string;
  email?: string;
  mobile?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

export interface UserSchoolAssociation {
  userId: string;
  schoolId: string;
  role: UserRole;
  isActive?: boolean;
}

export interface BulkUserOperation {
  userIds: string[];
  operation: 'activate' | 'deactivate' | 'delete' | 'change_role' | 'add_to_school' | 'remove_from_school';
  data?: {
    role?: UserRole;
    schoolId?: string;
    reason?: string;
  };
}

export interface UserWithDetails {
  id: string;
  name: string;
  email: string | null;
  mobile: string | null;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  hasPassword: boolean;
  schools: Array<{
    id: string;
    schoolId: string;
    schoolName: string;
    schoolCode: string;
    schoolStatus: SchoolStatus;
    role: UserRole;
    isActive: boolean;
    joinedAt: Date;
  }>;
  totalSchools: number;
  roleSpecificData?: any;
}

/**
 * Comprehensive User Management Service
 * Provides user account management capabilities for super-admin dashboard
 * Requirements: 10.5 - Super admin should manage user accounts across all schools
 */
export class UserManagementService {
  /**
   * Search and filter users across all schools
   * Requirements: 10.5 - Super admin should manage user accounts across all schools
   */
  async searchUsers(
    filters: UserSearchFilters,
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{
    users: UserWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    await requireSuperAdminAccess();

    // Build where clause for user search
    const where: Prisma.UserWhereInput = {};
    
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { mobile: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.status) {
      where.isActive = filters.status === 'active';
    }

    if (filters.createdAfter || filters.createdBefore) {
      where.createdAt = {};
      if (filters.createdAfter) {
        where.createdAt.gte = filters.createdAfter;
      }
      if (filters.createdBefore) {
        where.createdAt.lte = filters.createdBefore;
      }
    }

    if (filters.lastLoginAfter || filters.lastLoginBefore) {
      where.lastLoginAt = {};
      if (filters.lastLoginAfter) {
        where.lastLoginAt.gte = filters.lastLoginAfter;
      }
      if (filters.lastLoginBefore) {
        where.lastLoginAt.lte = filters.lastLoginBefore;
      }
    }

    // Filter by school or role if specified
    let userSchoolWhere: Prisma.UserSchoolWhereInput = {};
    if (filters.schoolId) {
      userSchoolWhere.schoolId = filters.schoolId;
    }
    if (filters.role) {
      userSchoolWhere.role = filters.role;
    }

    // Add user school filter to main where clause
    if (Object.keys(userSchoolWhere).length > 0) {
      where.userSchools = {
        some: userSchoolWhere
      };
    }

    // Get total count
    const total = await db.user.count({ where });

    // Get users with comprehensive details to avoid N+1 queries
    const users = await db.user.findMany({
      where,
      include: {
        userSchools: {
          include: {
            school: {
              select: {
                id: true,
                name: true,
                schoolCode: true,
                status: true,
                plan: true, // Include plan for subscription info
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            userSchools: true,
          }
        },
        // Include role-specific data to prevent future N+1 queries
        student: {
          select: {
            id: true,
            rollNumber: true,
            admissionId: true,
            enrollments: {
              include: {
                class: {
                  select: {
                    name: true,
                    sections: true,
                  }
                }
              },
              take: 1,
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        teacher: {
          select: {
            id: true,
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
              },
              take: 3 // Limit subjects for performance
            }
          }
        },
        parent: {
          select: {
            id: true,
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
                    }
                  }
                }
              },
              take: 5 // Limit children for performance
            }
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }) as any[];

    // Filter by hasMultipleSchools if specified
    let filteredUsers = users;
    if (filters.hasMultipleSchools !== undefined) {
      filteredUsers = users.filter(user => {
        const hasMultiple = user._count.userSchools > 1;
        return filters.hasMultipleSchools ? hasMultiple : !hasMultiple;
      });
    }

    // Transform users to UserWithDetails format with role-specific data
    const transformedUsers: UserWithDetails[] = filteredUsers.map(user => {
      // Determine primary role and extract role-specific data
      const primaryRole = user.userSchools[0]?.role;
      let roleSpecificData = null;

      if (primaryRole === UserRole.STUDENT && user.student) {
        roleSpecificData = user.student;
      } else if (primaryRole === UserRole.TEACHER && user.teacher) {
        roleSpecificData = user.teacher;
      } else if (primaryRole === UserRole.PARENT && user.parent) {
        roleSpecificData = user.parent;
      }

      return {
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
        schools: user.userSchools.map((us: any) => ({
          id: us.id,
          schoolId: us.schoolId,
          schoolName: us.school.name,
          schoolCode: us.school.schoolCode,
          schoolStatus: us.school.status,
          role: us.role,
          isActive: us.isActive,
          joinedAt: us.createdAt,
        })),
        totalSchools: user._count.userSchools,
        roleSpecificData, // Include role-specific data to prevent future queries
      };
    });

    return {
      users: transformedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get detailed user information
   * Requirements: 10.5 - Super admin should manage user accounts across all schools
   */
  async getUserDetails(userId: string): Promise<UserWithDetails | null> {
    await requireSuperAdminAccess();

    // First, get basic user info to determine primary role
    const basicUser = await db.user.findUnique({
      where: { id: userId },
      include: {
        userSchools: {
          select: { role: true },
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!basicUser) {
      return null;
    }

    const primaryRole = basicUser.userSchools[0]?.role;

    // Build dynamic include based on role to avoid N+1 queries
    const includeConfig: any = {
      userSchools: {
        include: {
          school: {
            select: {
              id: true,
              name: true,
              schoolCode: true,
              status: true,
              plan: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: {
          userSchools: true,
        }
      }
    };

    // Conditionally include role-specific data based on primary role
    if (primaryRole === UserRole.STUDENT) {
      includeConfig.student = {
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
      };
    } else if (primaryRole === UserRole.TEACHER) {
      includeConfig.teacher = {
        select: {
          employeeId: true,
          department: true,
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
      };
    } else if (primaryRole === UserRole.PARENT) {
      includeConfig.parent = {
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
      };
    }

    // Single query with all necessary data (fixes N+1)
    const user = await db.user.findUnique({
      where: { id: userId },
      include: includeConfig
    }) as any;

    if (!user) {
      return null;
    }

    // Extract role-specific data from the single query result
    let roleSpecificData = null;
    if (primaryRole === UserRole.STUDENT && user.student) {
      roleSpecificData = user.student;
    } else if (primaryRole === UserRole.TEACHER && user.teacher) {
      roleSpecificData = user.teacher;
    } else if (primaryRole === UserRole.PARENT && user.parent) {
      roleSpecificData = user.parent;
    }

    return {
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
      schools: user.userSchools.map((us: any) => ({
        id: us.id,
        schoolId: us.schoolId,
        schoolName: us.school.name,
        schoolCode: us.school.schoolCode,
        schoolStatus: us.school.status,
        role: us.role,
        isActive: us.isActive,
        joinedAt: us.createdAt,
      })),
      totalSchools: user._count.userSchools,
      roleSpecificData,
    };
  }

  /**
   * Create a new user account
   * Requirements: 10.5 - Super admin should manage user accounts across all schools
   */
  async createUser(userData: UserCreateData, schoolAssociation: UserSchoolAssociation): Promise<{
    user: UserWithDetails;
    isNewUser: boolean;
  }> {
    await requireSuperAdminAccess();

    // Validate school exists and is active
    const school = await db.school.findUnique({
      where: { id: schoolAssociation.schoolId },
      select: { id: true, name: true, schoolCode: true, status: true }
    });

    if (!school) {
      throw new Error('School not found');
    }

    if (school.status !== SchoolStatus.ACTIVE) {
      throw new Error('Cannot add users to inactive school');
    }

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          ...(userData.email ? [{ email: userData.email }] : []),
          ...(userData.mobile ? [{ mobile: userData.mobile }] : []),
        ]
      }
    });

    let user;
    let isNewUser = false;

    if (existingUser) {
      // Check if already associated with this school
      const existingAssociation = await db.userSchool.findUnique({
        where: {
          userId_schoolId: {
            userId: existingUser.id,
            schoolId: schoolAssociation.schoolId
          }
        }
      });

      if (existingAssociation) {
        throw new Error('User is already associated with this school');
      }

      user = existingUser;
    } else {
      // Create new user
      const passwordHash = userData.password 
        ? await bcrypt.hash(userData.password, 12)
        : null;

      user = await db.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          mobile: userData.mobile,
          passwordHash,
          firstName: userData.firstName,
          lastName: userData.lastName,
          isActive: userData.isActive ?? true,
        }
      });
      isNewUser = true;
    }

    // Create user-school association
    await db.userSchool.create({
      data: {
        userId: user.id,
        schoolId: schoolAssociation.schoolId,
        role: schoolAssociation.role,
        isActive: schoolAssociation.isActive ?? true,
      }
    });

    // Get the complete user details
    const userDetails = await this.getUserDetails(user.id);
    if (!userDetails) {
      throw new Error('Failed to retrieve created user details');
    }

    return {
      user: userDetails,
      isNewUser,
    };
  }

  /**
   * Update user information
   * Requirements: 10.5 - Super admin should manage user accounts across all schools
   */
  async updateUser(userId: string, updateData: UserUpdateData): Promise<UserWithDetails> {
    await requireSuperAdminAccess();

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, mobile: true }
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Check for email/mobile conflicts
    if (updateData.email || updateData.mobile) {
      const conflictWhere: Prisma.UserWhereInput = {
        id: { not: userId },
        OR: []
      };

      if (updateData.email) {
        conflictWhere.OR!.push({ email: updateData.email });
      }
      if (updateData.mobile) {
        conflictWhere.OR!.push({ mobile: updateData.mobile });
      }

      const conflictingUser = await db.user.findFirst({
        where: conflictWhere
      });

      if (conflictingUser) {
        throw new Error('Email or mobile number already exists');
      }
    }

    // Prepare update data
    const updatePayload: Prisma.UserUpdateInput = {};
    
    if (updateData.name !== undefined) updatePayload.name = updateData.name;
    if (updateData.email !== undefined) updatePayload.email = updateData.email;
    if (updateData.mobile !== undefined) updatePayload.mobile = updateData.mobile;
    if (updateData.firstName !== undefined) updatePayload.firstName = updateData.firstName;
    if (updateData.lastName !== undefined) updatePayload.lastName = updateData.lastName;
    if (updateData.isActive !== undefined) updatePayload.isActive = updateData.isActive;

    // Handle password update
    if (updateData.password) {
      updatePayload.passwordHash = await bcrypt.hash(updateData.password, 12);
    }

    // Update user
    await db.user.update({
      where: { id: userId },
      data: updatePayload,
    });

    // If user is being deactivated, also deactivate all school associations
    if (updateData.isActive === false) {
      await db.userSchool.updateMany({
        where: { userId },
        data: { isActive: false }
      });
    }

    // Get updated user details
    const updatedUser = await this.getUserDetails(userId);
    if (!updatedUser) {
      throw new Error('Failed to retrieve updated user details');
    }

    return updatedUser;
  }

  /**
   * Perform bulk operations on users
   * Requirements: 10.5 - Super admin should manage user accounts across all schools
   */
  async performBulkOperation(operation: BulkUserOperation): Promise<{
    success: number;
    failed: number;
    errors: Array<{ userId: string; error: string }>;
  }> {
    await requireSuperAdminAccess();

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ userId: string; error: string }>
    };

    // Validate all user IDs exist
    const existingUsers = await db.user.findMany({
      where: { id: { in: operation.userIds } },
      select: { id: true, name: true, isActive: true }
    });

    const existingUserIds = existingUsers.map(u => u.id);
    const missingUserIds = operation.userIds.filter(id => !existingUserIds.includes(id));

    // Add errors for missing users
    missingUserIds.forEach(id => {
      results.errors.push({ userId: id, error: 'User not found' });
      results.failed++;
    });

    // Process existing users
    for (const user of existingUsers) {
      try {
        switch (operation.operation) {
          case 'activate':
            await this.activateUser(user.id);
            results.success++;
            break;

          case 'deactivate':
            await this.deactivateUser(user.id);
            results.success++;
            break;

          case 'change_role':
            if (!operation.data?.role) {
              throw new Error('Role is required for change_role operation');
            }
            await this.changeUserRole(user.id, operation.data.role, operation.data.schoolId);
            results.success++;
            break;

          case 'add_to_school':
            if (!operation.data?.schoolId || !operation.data?.role) {
              throw new Error('School ID and role are required for add_to_school operation');
            }
            await this.addUserToSchool(user.id, operation.data.schoolId, operation.data.role);
            results.success++;
            break;

          case 'remove_from_school':
            if (!operation.data?.schoolId) {
              throw new Error('School ID is required for remove_from_school operation');
            }
            await this.removeUserFromSchool(user.id, operation.data.schoolId);
            results.success++;
            break;

          case 'delete':
            await this.deleteUser(user.id);
            results.success++;
            break;

          default:
            throw new Error(`Unknown operation: ${operation.operation}`);
        }
      } catch (error: any) {
        results.errors.push({ 
          userId: user.id, 
          error: error.message || 'Unknown error' 
        });
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Activate a user account
   */
  private async activateUser(userId: string): Promise<void> {
    await db.user.update({
      where: { id: userId },
      data: { isActive: true }
    });

    // Also activate all user-school relationships
    await db.userSchool.updateMany({
      where: { userId },
      data: { isActive: true }
    });
  }

  /**
   * Deactivate a user account
   */
  private async deactivateUser(userId: string): Promise<void> {
    await db.user.update({
      where: { id: userId },
      data: { isActive: false }
    });

    // Also deactivate all user-school relationships
    await db.userSchool.updateMany({
      where: { userId },
      data: { isActive: false }
    });
  }

  /**
   * Change user role across all schools or specific school
   */
  private async changeUserRole(userId: string, role: UserRole, schoolId?: string): Promise<void> {
    const where: Prisma.UserSchoolWhereInput = { userId };
    if (schoolId) {
      where.schoolId = schoolId;
    }

    await db.userSchool.updateMany({
      where,
      data: { role }
    });
  }

  /**
   * Add user to a school
   */
  private async addUserToSchool(userId: string, schoolId: string, role: UserRole): Promise<void> {
    // Check if association already exists
    const existing = await db.userSchool.findUnique({
      where: {
        userId_schoolId: { userId, schoolId }
      }
    });

    if (existing) {
      throw new Error('User is already associated with this school');
    }

    // Validate school exists and is active
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { status: true }
    });

    if (!school) {
      throw new Error('School not found');
    }

    if (school.status !== SchoolStatus.ACTIVE) {
      throw new Error('Cannot add users to inactive school');
    }

    await db.userSchool.create({
      data: {
        userId,
        schoolId,
        role,
        isActive: true,
      }
    });
  }

  /**
   * Remove user from a school
   */
  private async removeUserFromSchool(userId: string, schoolId: string): Promise<void> {
    // Check if this is the user's last school association
    const totalAssociations = await db.userSchool.count({
      where: { userId }
    });

    if (totalAssociations === 1) {
      throw new Error('Cannot remove user\'s last school association');
    }

    await db.userSchool.delete({
      where: {
        userId_schoolId: { userId, schoolId }
      }
    });
  }

  /**
   * Delete a user account (with safety checks)
   */
  private async deleteUser(userId: string): Promise<void> {
    // Safety checks
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        userSchools: {
          select: { role: true }
        },
        _count: {
          select: { userSchools: true }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Prevent deletion of super admins
    const isSuperAdmin = user.userSchools.some(us => us.role === UserRole.SUPER_ADMIN);
    if (isSuperAdmin) {
      throw new Error('Cannot delete super admin users');
    }

    // Prevent deletion of users with multiple school associations
    if (user._count.userSchools > 1) {
      throw new Error('Cannot delete user associated with multiple schools');
    }

    // Delete user (cascade will handle related records)
    await db.user.delete({
      where: { id: userId }
    });
  }

  /**
   * Get student-specific data
   */
  private async getStudentData(userId: string) {
    return await db.student.findFirst({
      where: { 
        user: { id: userId }
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
  }

  /**
   * Get teacher-specific data
   */
  private async getTeacherData(userId: string) {
    return await db.teacher.findFirst({
      where: { 
        user: { id: userId }
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
  }

  /**
   * Get parent-specific data
   */
  private async getParentData(userId: string) {
    return await db.parent.findFirst({
      where: { 
        user: { id: userId }
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

  /**
   * Get user statistics across all schools
   */
  async getUserStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<UserRole, number>;
    multiSchoolUsers: number;
    recentlyCreated: number;
    recentlyActive: number;
  }> {
    await requireSuperAdminAccess();

    const [total, active, inactive] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { isActive: true } }),
      db.user.count({ where: { isActive: false } })
    ]);

    // Get counts by role (from UserSchool relationships)
    const roleCounts = await db.userSchool.groupBy({
      by: ['role'],
      _count: { role: true }
    });

    const byRole = roleCounts.reduce((acc, item) => {
      acc[item.role] = item._count.role;
      return acc;
    }, {} as Record<UserRole, number>);

    // Ensure all roles are represented
    Object.values(UserRole).forEach(role => {
      if (!(role in byRole)) {
        byRole[role] = 0;
      }
    });

    // Get multi-school users count
    const multiSchoolUsers = await db.user.count({
      where: {
        userSchools: {
          some: {
            userId: {
              in: await db.userSchool.groupBy({
                by: ['userId'],
                having: {
                  userId: {
                    _count: {
                      gt: 1
                    }
                  }
                }
              }).then(results => results.map(r => r.userId))
            }
          }
        }
      }
    });

    // Get recently created users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentlyCreated = await db.user.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    });

    // Get recently active users (last 7 days)
    const recentlyActive = await db.user.count({
      where: {
        lastLoginAt: {
          gte: sevenDaysAgo
        }
      }
    });

    return {
      total,
      active,
      inactive,
      byRole,
      multiSchoolUsers,
      recentlyCreated,
      recentlyActive,
    };
  }
}

// Export singleton instance
export const userManagementService = new UserManagementService();