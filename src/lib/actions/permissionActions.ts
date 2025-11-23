'use server';

import { auth } from '@clerk/nextjs/server';
import { PrismaClient, UserRole, PermissionAction } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { hasPermission } from '@/lib/utils/permissions';

const prisma = new PrismaClient();

/**
 * Server actions for permission management
 */

/**
 * Helper function to get database user ID from Clerk user ID
 */
async function getDbUserId(clerkUserId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });
  return user?.id || null;
}

// Get all permissions
export async function getAllPermissions() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get database user ID
    const userId = await getDbUserId(clerkUserId);
    if (!userId) {
      return { success: false, error: 'User not found in database' };
    }

    // Check if user has permission to read settings
    const canRead = await hasPermission(userId, 'SETTINGS', 'READ' as PermissionAction);
    if (!canRead) {
      return { success: false, error: 'You do not have permission to view permissions' };
    }

    const permissions = await prisma.permission.findMany({
      orderBy: [
        { category: 'asc' },
        { resource: 'asc' },
        { action: 'asc' },
      ],
    });

    return { success: true, data: permissions };
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return { success: false, error: 'Failed to fetch permissions' };
  }
}

// Get permissions by category
export async function getPermissionsByCategory() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get database user ID
    const userId = await getDbUserId(clerkUserId);
    if (!userId) {
      return { success: false, error: 'User not found in database' };
    }

    const canRead = await hasPermission(userId, 'SETTINGS', 'READ' as PermissionAction);
    if (!canRead) {
      return { success: false, error: 'You do not have permission to view permissions' };
    }

    const permissions = await prisma.permission.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { resource: 'asc' },
        { action: 'asc' },
      ],
    });

    // Group by category
    const grouped = permissions.reduce((acc, permission) => {
      const category = permission.category || 'OTHER';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(permission);
      return acc;
    }, {} as Record<string, typeof permissions>);

    return { success: true, data: grouped };
  } catch (error) {
    console.error('Error fetching permissions by category:', error);
    return { success: false, error: 'Failed to fetch permissions' };
  }
}

// Get role permissions
export async function getRolePermissions(role: UserRole) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get database user ID
    const userId = await getDbUserId(clerkUserId);
    if (!userId) {
      return { success: false, error: 'User not found in database' };
    }

    const canRead = await hasPermission(userId, 'SETTINGS', 'READ' as PermissionAction);
    if (!canRead) {
      return { success: false, error: 'You do not have permission to view role permissions' };
    }

    const rolePermissions = await prisma.rolePermission.findMany({
      where: { role },
      include: { permission: true },
    });

    return { success: true, data: rolePermissions };
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return { success: false, error: 'Failed to fetch role permissions' };
  }
}

// Assign permission to role
export async function assignPermissionToRole(role: UserRole, permissionId: string) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get database user ID
    const userId = await getDbUserId(clerkUserId);
    if (!userId) {
      return { success: false, error: 'User not found in database' };
    }

    const canUpdate = await hasPermission(userId, 'SETTINGS', 'UPDATE' as PermissionAction);
    if (!canUpdate) {
      return { success: false, error: 'You do not have permission to assign permissions to roles' };
    }

    // Check if permission exists
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      return { success: false, error: 'Permission not found' };
    }

    // Check if already assigned
    const existing = await prisma.rolePermission.findUnique({
      where: {
        role_permissionId: {
          role,
          permissionId,
        },
      },
    });

    if (existing) {
      return { success: false, error: 'Permission already assigned to this role' };
    }

    // Assign permission
    await prisma.rolePermission.create({
      data: {
        role,
        permissionId,
        isDefault: false,
      },
    });

    revalidatePath('/admin/settings/permissions');
    return { success: true, message: 'Permission assigned to role successfully' };
  } catch (error) {
    console.error('Error assigning permission to role:', error);
    return { success: false, error: 'Failed to assign permission to role' };
  }
}

// Remove permission from role
export async function removePermissionFromRole(role: UserRole, permissionId: string) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get database user ID
    const userId = await getDbUserId(clerkUserId);
    if (!userId) {
      return { success: false, error: 'User not found in database' };
    }

    const canUpdate = await hasPermission(userId, 'SETTINGS', 'UPDATE' as PermissionAction);
    if (!canUpdate) {
      return { success: false, error: 'You do not have permission to remove permissions from roles' };
    }

    await prisma.rolePermission.delete({
      where: {
        role_permissionId: {
          role,
          permissionId,
        },
      },
    });

    revalidatePath('/admin/settings/permissions');
    return { success: true, message: 'Permission removed from role successfully' };
  } catch (error) {
    console.error('Error removing permission from role:', error);
    return { success: false, error: 'Failed to remove permission from role' };
  }
}

// Get user permissions
export async function getUserPermissions(targetUserId: string) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get database user ID
    const userId = await getDbUserId(clerkUserId);
    if (!userId) {
      return { success: false, error: 'User not found in database' };
    }

    const canRead = await hasPermission(userId, 'SETTINGS', 'READ' as PermissionAction);
    if (!canRead) {
      return { success: false, error: 'You do not have permission to view user permissions' };
    }

    const userPermissions = await prisma.userPermission.findMany({
      where: { userId: targetUserId },
      include: { permission: true },
    });

    return { success: true, data: userPermissions };
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return { success: false, error: 'Failed to fetch user permissions' };
  }
}

// Assign custom permission to user
export async function assignPermissionToUser(
  targetUserId: string,
  permissionId: string,
  expiresAt?: Date
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get database user ID
    const userId = await getDbUserId(clerkUserId);
    if (!userId) {
      return { success: false, error: 'User not found in database' };
    }

    const canUpdate = await hasPermission(userId, 'SETTINGS', 'UPDATE' as PermissionAction);
    if (!canUpdate) {
      return { success: false, error: 'You do not have permission to assign permissions to users' };
    }

    // Check if permission exists
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      return { success: false, error: 'Permission not found' };
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Upsert user permission
    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId: targetUserId,
          permissionId,
        },
      },
      create: {
        userId: targetUserId,
        permissionId,
        grantedBy: userId,
        expiresAt,
      },
      update: {
        grantedBy: userId,
        expiresAt,
        grantedAt: new Date(),
      },
    });

    revalidatePath('/admin/settings/permissions');
    return { success: true, message: 'Permission assigned to user successfully' };
  } catch (error) {
    console.error('Error assigning permission to user:', error);
    return { success: false, error: 'Failed to assign permission to user' };
  }
}

// Remove custom permission from user
export async function removePermissionFromUser(targetUserId: string, permissionId: string) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get database user ID
    const userId = await getDbUserId(clerkUserId);
    if (!userId) {
      return { success: false, error: 'User not found in database' };
    }

    const canUpdate = await hasPermission(userId, 'SETTINGS', 'UPDATE' as PermissionAction);
    if (!canUpdate) {
      return { success: false, error: 'You do not have permission to remove permissions from users' };
    }

    await prisma.userPermission.delete({
      where: {
        userId_permissionId: {
          userId: targetUserId,
          permissionId,
        },
      },
    });

    revalidatePath('/admin/settings/permissions');
    return { success: true, message: 'Permission removed from user successfully' };
  } catch (error) {
    console.error('Error removing permission from user:', error);
    return { success: false, error: 'Failed to remove permission from user' };
  }
}

// Get all users with their roles
export async function getUsersForPermissionManagement() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get database user ID
    const userId = await getDbUserId(clerkUserId);
    if (!userId) {
      return { success: false, error: 'User not found in database' };
    }

    const canRead = await hasPermission(userId, 'SETTINGS', 'READ' as PermissionAction);
    if (!canRead) {
      return { success: false, error: 'You do not have permission to view users' };
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
      },
      orderBy: [
        { role: 'asc' },
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });

    return { success: true, data: users };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, error: 'Failed to fetch users' };
  }
}

// Bulk assign permissions to role
export async function bulkAssignPermissionsToRole(role: UserRole, permissionIds: string[]) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get database user ID
    const userId = await getDbUserId(clerkUserId);
    if (!userId) {
      return { success: false, error: 'User not found in database' };
    }

    const canUpdate = await hasPermission(userId, 'SETTINGS', 'UPDATE' as PermissionAction);
    if (!canUpdate) {
      return { success: false, error: 'You do not have permission to assign permissions to roles' };
    }

    // Remove all existing permissions for this role
    await prisma.rolePermission.deleteMany({
      where: { role },
    });

    // Add new permissions
    await prisma.rolePermission.createMany({
      data: permissionIds.map(permissionId => ({
        role,
        permissionId,
        isDefault: false,
      })),
      skipDuplicates: true,
    });

    revalidatePath('/admin/settings/permissions');
    return { success: true, message: 'Permissions updated for role successfully' };
  } catch (error) {
    console.error('Error bulk assigning permissions to role:', error);
    return { success: false, error: 'Failed to update role permissions' };
  }
}
