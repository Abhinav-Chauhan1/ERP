import { PrismaClient, UserRole, PermissionAction } from '@prisma/client';
import { logPermissionCheck, logPermissionDenial } from '@/lib/services/permission-audit';
import { hasDefaultResourcePermission, getRoleDefaultPermissions, DEFAULT_PERMISSIONS } from './permission-defaults';
import { redirect } from "next/navigation";
import { auth } from "@/auth";

const prisma = new PrismaClient();

// Try to import cache from React, but make it optional for non-React contexts
let cache: typeof import('react').cache | undefined;
try {
  cache = require('react').cache;
} catch {
  // React not available, cache will be undefined
  cache = undefined;
}

/**
 * Permission utility functions for checking user permissions
 * Supports both role-based and user-specific permissions
 */

export interface PermissionCheck {
  resource: string;
  action: PermissionAction;
}

/**
 * Check if a user has a specific permission
 * Checks both role-based permissions and user-specific permissions
 * Logs all permission checks and denials for audit purposes
 * 
 * @param userId - The user ID to check permissions for
 * @param resource - The resource to check (e.g., 'USER', 'STUDENT', 'EXAM')
 * @param action - The action to check (e.g., 'CREATE', 'READ', 'UPDATE', 'DELETE')
 * @param auditContext - Optional context for audit logging (ipAddress, userAgent)
 * @returns Promise<boolean> - True if user has permission, false otherwise
 */
export async function hasPermission(
  userId: string,
  resource: string,
  action: PermissionAction,
  auditContext?: { ipAddress?: string; userAgent?: string; metadata?: Record<string, any> }
): Promise<boolean> {
  let granted = false;

  try {
    // Get user with role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      granted = false;
      // Log permission denial
      await logPermissionDenial({
        userId,
        resource,
        action,
        granted: false,
        ipAddress: auditContext?.ipAddress,
        userAgent: auditContext?.userAgent,
        metadata: {
          ...auditContext?.metadata,
          reason: 'User not found',
        },
      });
      return false;
    }

    // ADMIN users have all permissions by default (superuser bypass)
    // This ensures admins can always access all features regardless of permission seeding status
    if (user.role === 'ADMIN') {
      await logPermissionCheck({
        userId,
        resource,
        action,
        granted: true,
        ipAddress: auditContext?.ipAddress,
        userAgent: auditContext?.userAgent,
        metadata: {
          ...auditContext?.metadata,
          grantType: 'admin-bypass',
          role: user.role,
        },
      });
      return true;
    }

    // Check if permission exists in database
    const permission = await prisma.permission.findFirst({
      where: {
        resource,
        action,
        isActive: true,
      },
    });

    // If permission not in DB, fall back to hardcoded defaults
    // This supports "allow by default" mode - no seeding required
    if (!permission) {
      const hasDefault = hasDefaultResourcePermission(user.role, resource, action);

      if (hasDefault) {
        await logPermissionCheck({
          userId,
          resource,
          action,
          granted: true,
          ipAddress: auditContext?.ipAddress,
          userAgent: auditContext?.userAgent,
          metadata: {
            ...auditContext?.metadata,
            grantType: 'default-fallback',
            role: user.role,
          },
        });
        return true;
      } else {
        await logPermissionDenial({
          userId,
          resource,
          action,
          granted: false,
          ipAddress: auditContext?.ipAddress,
          userAgent: auditContext?.userAgent,
          metadata: {
            ...auditContext?.metadata,
            reason: 'No default permission for this role',
          },
        });
        return false;
      }
    }

    // Check role-based permission
    const rolePermission = await prisma.rolePermission.findUnique({
      where: {
        role_permissionId: {
          role: user.role,
          permissionId: permission.id,
        },
      },
    });

    if (rolePermission) {
      granted = true;
      // Log successful permission check
      await logPermissionCheck({
        userId,
        resource,
        action,
        granted: true,
        ipAddress: auditContext?.ipAddress,
        userAgent: auditContext?.userAgent,
        metadata: {
          ...auditContext?.metadata,
          grantType: 'role-based',
          role: user.role,
        },
      });
      return true;
    }

    // Check user-specific permission
    const userPermission = await prisma.userPermission.findFirst({
      where: {
        userId,
        permissionId: permission.id,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    granted = !!userPermission;

    if (granted && userPermission) {
      // Log successful permission check
      await logPermissionCheck({
        userId,
        resource,
        action,
        granted: true,
        ipAddress: auditContext?.ipAddress,
        userAgent: auditContext?.userAgent,
        metadata: {
          ...auditContext?.metadata,
          grantType: 'user-specific',
          permissionId: userPermission.id,
        },
      });
    } else {
      // Log permission denial
      await logPermissionDenial({
        userId,
        resource,
        action,
        granted: false,
        ipAddress: auditContext?.ipAddress,
        userAgent: auditContext?.userAgent,
        metadata: {
          ...auditContext?.metadata,
          reason: 'No role-based or user-specific permission found',
        },
      });
    }

    return granted;
  } catch (error) {
    console.error('Error checking permission:', error);

    // Log permission check error
    await logPermissionDenial({
      userId,
      resource,
      action,
      granted: false,
      ipAddress: auditContext?.ipAddress,
      userAgent: auditContext?.userAgent,
      metadata: {
        ...auditContext?.metadata,
        reason: 'Error during permission check',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return false;
  }
}

/**
 * Check if a user has multiple permissions (AND logic)
 * User must have ALL specified permissions
 * 
 * @param userId - The user ID to check permissions for
 * @param checks - Array of permission checks
 * @param auditContext - Optional context for audit logging (ipAddress, userAgent)
 * @returns Promise<boolean> - True if user has all permissions, false otherwise
 */
export async function hasAllPermissions(
  userId: string,
  checks: PermissionCheck[],
  auditContext?: { ipAddress?: string; userAgent?: string; metadata?: Record<string, any> }
): Promise<boolean> {
  const results = await Promise.all(
    checks.map(check => hasPermission(userId, check.resource, check.action, auditContext))
  );
  return results.every(result => result === true);
}

/**
 * Check if a user has any of the specified permissions (OR logic)
 * User must have AT LEAST ONE of the specified permissions
 * 
 * @param userId - The user ID to check permissions for
 * @param checks - Array of permission checks
 * @param auditContext - Optional context for audit logging (ipAddress, userAgent)
 * @returns Promise<boolean> - True if user has any permission, false otherwise
 */
export async function hasAnyPermission(
  userId: string,
  checks: PermissionCheck[],
  auditContext?: { ipAddress?: string; userAgent?: string; metadata?: Record<string, any> }
): Promise<boolean> {
  const results = await Promise.all(
    checks.map(check => hasPermission(userId, check.resource, check.action, auditContext))
  );
  return results.some(result => result === true);
}

/**
 * Get all permissions for a user
 * Combines role-based and user-specific permissions
 * 
 * @param userId - The user ID to get permissions for
 * @returns Promise<Permission[]> - Array of permissions
 */
export async function getUserPermissions(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return [];
    }

    // Get role-based permissions
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { role: user.role },
      include: { permission: true },
    });

    // Get user-specific permissions
    const userPermissions = await prisma.userPermission.findMany({
      where: {
        userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: { permission: true },
    });

    // Combine and deduplicate permissions
    const allPermissions = [
      ...rolePermissions.map(rp => rp.permission),
      ...userPermissions.map(up => up.permission),
    ];

    // Remove duplicates based on permission ID
    const uniquePermissions = Array.from(
      new Map(allPermissions.map(p => [p.id, p])).values()
    );

    return uniquePermissions.filter(p => p.isActive);
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}

/**
 * Grant a permission to a user
 * 
 * @param userId - The user ID to grant permission to
 * @param permissionName - The permission name (e.g., 'CREATE_USER')
 * @param grantedBy - The user ID who is granting the permission
 * @param expiresAt - Optional expiration date for the permission
 * @returns Promise<boolean> - True if permission was granted, false otherwise
 */
export async function grantPermission(
  userId: string,
  permissionName: string,
  grantedBy: string,
  expiresAt?: Date
): Promise<boolean> {
  try {
    const permission = await prisma.permission.findUnique({
      where: { name: permissionName },
    });

    if (!permission) {
      console.error(`Permission ${permissionName} not found`);
      return false;
    }

    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId,
          permissionId: permission.id,
        },
      },
      create: {
        userId,
        permissionId: permission.id,
        grantedBy,
        expiresAt,
      },
      update: {
        grantedBy,
        expiresAt,
        grantedAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    console.error('Error granting permission:', error);
    return false;
  }
}

/**
 * Revoke a permission from a user
 * 
 * @param userId - The user ID to revoke permission from
 * @param permissionName - The permission name (e.g., 'CREATE_USER')
 * @returns Promise<boolean> - True if permission was revoked, false otherwise
 */
export async function revokePermission(
  userId: string,
  permissionName: string
): Promise<boolean> {
  try {
    const permission = await prisma.permission.findUnique({
      where: { name: permissionName },
    });

    if (!permission) {
      console.error(`Permission ${permissionName} not found`);
      return false;
    }

    await prisma.userPermission.deleteMany({
      where: {
        userId,
        permissionId: permission.id,
      },
    });

    return true;
  } catch (error) {
    console.error('Error revoking permission:', error);
    return false;
  }
}

/**
 * Check if a user has a specific role
 * 
 * @param userId - The user ID to check
 * @param role - The role to check for
 * @returns Promise<boolean> - True if user has the role, false otherwise
 */
export async function hasRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return user?.role === role;
  } catch (error) {
    console.error('Error checking role:', error);
    return false;
  }
}

/**
 * Cached version of hasPermission for better performance
 * Use this in Server Components where caching is beneficial
 */
export const hasPermissionCached = cache ? cache(hasPermission) : hasPermission;

/**
 * Cached version of getUserPermissions for better performance
 * Use this in Server Components where caching is beneficial
 */
export const getUserPermissionsCached = cache ? cache(getUserPermissions) : getUserPermissions;

/**
 * Get all effective permission names for a user
 * Accounts for defaults and DB overrides
 * 
 * @param userId - The user ID
 * @returns Promise<string[]> - Array of permission names
 */
export async function getUserPermissionNames(userId: string): Promise<string[]> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return [];
    }

    // ADMIN Bypass - admins have all permissions
    if (user.role === 'ADMIN') {
      const allSystemPermissions = DEFAULT_PERMISSIONS.map(p => p.name);
      // Also include any custom permissions from DB that might not be in defaults
      const dbPermissions = await prisma.permission.findMany({ select: { name: true } });
      const dbNames = dbPermissions.map(p => p.name);
      return Array.from(new Set([...allSystemPermissions, ...dbNames]));
    }

    // 1. Get all permission definitions from DB to know what is "managed"
    const dbPermissions = await prisma.permission.findMany({
      select: { id: true, name: true, isActive: true }
    });

    // Set of permission names that exist in DB
    const dbDefinedPermissionNames = new Set(dbPermissions.map(p => p.name));

    // 2. Get permissions granted via DB (RoleBased + UserSpecific)

    // Role permissions
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { role: user.role },
      include: { permission: true },
    });

    // User specific permissions
    const userPermissions = await prisma.userPermission.findMany({
      where: {
        userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: { permission: true },
    });

    // Set of granted permission names (from DB)
    const grantedNames = new Set<string>();

    rolePermissions.forEach(rp => {
      if (rp.permission.isActive) grantedNames.add(rp.permission.name);
    });

    userPermissions.forEach(up => {
      if (up.permission.isActive) grantedNames.add(up.permission.name);
    });

    // 3. Get Default permissions
    const defaultNames = getRoleDefaultPermissions(user.role);

    // 4. Merge: defaults are used ONLY if not defined in DB
    const finalPermissions = new Set(grantedNames);

    if (defaultNames.includes('*')) {
      // If wildcard default (should satisfy admin above, but safe to keep)
      DEFAULT_PERMISSIONS.forEach(def => {
        if (!dbDefinedPermissionNames.has(def.name)) {
          finalPermissions.add(def.name);
        }
      });
    } else {
      defaultNames.forEach(name => {
        // Only add default if it's NOT defined in DB
        // If it IS defined in DB, it must be in grantedNames to be included
        if (!dbDefinedPermissionNames.has(name)) {
          finalPermissions.add(name);
        }
      });
    }

    return Array.from(finalPermissions);
  } catch (error) {
    console.error('Error getting user permission names:', error);
    return [];
  }
}

/**
 * Cached version of getUserPermissionNames for better performance
 * Use this in Server Components
 */
export const getUserPermissionNamesCached = cache ? cache(getUserPermissionNames) : getUserPermissionNames;

/**
 * Server-side permission check that redirects if failed.
 * Use this in Page components.
 * 
 * @param permission - Permission name to check
 * @param redirectUrl - URL to redirect to if permission denied (default: /admin)
 */
export async function requirePermission(permission: string | string[], redirectUrl: string = "/admin") {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userPermissions = await getUserPermissionNamesCached(session.user.id);

  if (Array.isArray(permission)) {
    const hasAny = permission.some(p => userPermissions.includes(p));
    if (!hasAny) redirect(redirectUrl);
  } else {
    if (!userPermissions.includes(permission)) redirect(redirectUrl);
  }
}

/**
 * Permission names enum for type safety
 */
export { PERMISSIONS } from '@/lib/constants/permissions';
