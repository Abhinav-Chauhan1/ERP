import { PrismaClient, UserRole, PermissionAction } from '@prisma/client';
import { logPermissionCheck, logPermissionDenial } from '@/lib/services/permission-audit';

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

    // Check if permission exists
    const permission = await prisma.permission.findFirst({
      where: {
        resource,
        action,
        isActive: true,
      },
    });

    if (!permission) {
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
          reason: 'Permission not found or inactive',
        },
      });
      return false;
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
 * Permission names enum for type safety
 */
export const PERMISSIONS = {
  // User Management
  CREATE_USER: 'CREATE_USER',
  READ_USER: 'READ_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  EXPORT_USER: 'EXPORT_USER',
  IMPORT_USER: 'IMPORT_USER',

  // Student Management
  CREATE_STUDENT: 'CREATE_STUDENT',
  READ_STUDENT: 'READ_STUDENT',
  UPDATE_STUDENT: 'UPDATE_STUDENT',
  DELETE_STUDENT: 'DELETE_STUDENT',
  EXPORT_STUDENT: 'EXPORT_STUDENT',
  IMPORT_STUDENT: 'IMPORT_STUDENT',

  // Teacher Management
  CREATE_TEACHER: 'CREATE_TEACHER',
  READ_TEACHER: 'READ_TEACHER',
  UPDATE_TEACHER: 'UPDATE_TEACHER',
  DELETE_TEACHER: 'DELETE_TEACHER',
  EXPORT_TEACHER: 'EXPORT_TEACHER',

  // Parent Management
  CREATE_PARENT: 'CREATE_PARENT',
  READ_PARENT: 'READ_PARENT',
  UPDATE_PARENT: 'UPDATE_PARENT',
  DELETE_PARENT: 'DELETE_PARENT',

  // Class Management
  CREATE_CLASS: 'CREATE_CLASS',
  READ_CLASS: 'READ_CLASS',
  UPDATE_CLASS: 'UPDATE_CLASS',
  DELETE_CLASS: 'DELETE_CLASS',

  // Subject Management
  CREATE_SUBJECT: 'CREATE_SUBJECT',
  READ_SUBJECT: 'READ_SUBJECT',
  UPDATE_SUBJECT: 'UPDATE_SUBJECT',
  DELETE_SUBJECT: 'DELETE_SUBJECT',

  // Exam Management
  CREATE_EXAM: 'CREATE_EXAM',
  READ_EXAM: 'READ_EXAM',
  UPDATE_EXAM: 'UPDATE_EXAM',
  DELETE_EXAM: 'DELETE_EXAM',
  PUBLISH_EXAM: 'PUBLISH_EXAM',

  // Assignment Management
  CREATE_ASSIGNMENT: 'CREATE_ASSIGNMENT',
  READ_ASSIGNMENT: 'READ_ASSIGNMENT',
  UPDATE_ASSIGNMENT: 'UPDATE_ASSIGNMENT',
  DELETE_ASSIGNMENT: 'DELETE_ASSIGNMENT',

  // Attendance Management
  CREATE_ATTENDANCE: 'CREATE_ATTENDANCE',
  READ_ATTENDANCE: 'READ_ATTENDANCE',
  UPDATE_ATTENDANCE: 'UPDATE_ATTENDANCE',
  EXPORT_ATTENDANCE: 'EXPORT_ATTENDANCE',

  // Fee Management
  CREATE_FEE: 'CREATE_FEE',
  READ_FEE: 'READ_FEE',
  UPDATE_FEE: 'UPDATE_FEE',
  DELETE_FEE: 'DELETE_FEE',

  // Payment Management
  CREATE_PAYMENT: 'CREATE_PAYMENT',
  READ_PAYMENT: 'READ_PAYMENT',
  UPDATE_PAYMENT: 'UPDATE_PAYMENT',
  DELETE_PAYMENT: 'DELETE_PAYMENT',
  APPROVE_PAYMENT: 'APPROVE_PAYMENT',
  EXPORT_PAYMENT: 'EXPORT_PAYMENT',

  // Communication
  CREATE_ANNOUNCEMENT: 'CREATE_ANNOUNCEMENT',
  READ_ANNOUNCEMENT: 'READ_ANNOUNCEMENT',
  UPDATE_ANNOUNCEMENT: 'UPDATE_ANNOUNCEMENT',
  DELETE_ANNOUNCEMENT: 'DELETE_ANNOUNCEMENT',
  PUBLISH_ANNOUNCEMENT: 'PUBLISH_ANNOUNCEMENT',
  CREATE_MESSAGE: 'CREATE_MESSAGE',
  READ_MESSAGE: 'READ_MESSAGE',
  DELETE_MESSAGE: 'DELETE_MESSAGE',

  // Document Management
  CREATE_DOCUMENT: 'CREATE_DOCUMENT',
  READ_DOCUMENT: 'READ_DOCUMENT',
  UPDATE_DOCUMENT: 'UPDATE_DOCUMENT',
  DELETE_DOCUMENT: 'DELETE_DOCUMENT',

  // Reports
  CREATE_REPORT: 'CREATE_REPORT',
  READ_REPORT: 'READ_REPORT',
  EXPORT_REPORT: 'EXPORT_REPORT',

  // Library Management
  CREATE_BOOK: 'CREATE_BOOK',
  READ_BOOK: 'READ_BOOK',
  UPDATE_BOOK: 'UPDATE_BOOK',
  DELETE_BOOK: 'DELETE_BOOK',

  // Transport Management
  CREATE_VEHICLE: 'CREATE_VEHICLE',
  READ_VEHICLE: 'READ_VEHICLE',
  UPDATE_VEHICLE: 'UPDATE_VEHICLE',
  DELETE_VEHICLE: 'DELETE_VEHICLE',
  CREATE_ROUTE: 'CREATE_ROUTE',
  READ_ROUTE: 'READ_ROUTE',
  UPDATE_ROUTE: 'UPDATE_ROUTE',
  DELETE_ROUTE: 'DELETE_ROUTE',

  // Admission Management
  CREATE_APPLICATION: 'CREATE_APPLICATION',
  READ_APPLICATION: 'READ_APPLICATION',
  UPDATE_APPLICATION: 'UPDATE_APPLICATION',
  DELETE_APPLICATION: 'DELETE_APPLICATION',
  APPROVE_APPLICATION: 'APPROVE_APPLICATION',
  REJECT_APPLICATION: 'REJECT_APPLICATION',

  // Certificate Management
  CREATE_CERTIFICATE: 'CREATE_CERTIFICATE',
  READ_CERTIFICATE: 'READ_CERTIFICATE',
  UPDATE_CERTIFICATE: 'UPDATE_CERTIFICATE',
  DELETE_CERTIFICATE: 'DELETE_CERTIFICATE',

  // Backup Management
  CREATE_BACKUP: 'CREATE_BACKUP',
  READ_BACKUP: 'READ_BACKUP',
  DELETE_BACKUP: 'DELETE_BACKUP',

  // System Settings
  READ_SETTINGS: 'READ_SETTINGS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',

  // Student Promotion Management
  CREATE_PROMOTION: 'CREATE_PROMOTION',
  READ_PROMOTION: 'READ_PROMOTION',
  DELETE_PROMOTION: 'DELETE_PROMOTION',

  // Graduation Ceremony Management
  CREATE_GRADUATION: 'CREATE_GRADUATION',
  READ_GRADUATION: 'READ_GRADUATION',

  // Alumni Management (Admin)
  CREATE_ALUMNI: 'CREATE_ALUMNI',
  READ_ALUMNI: 'READ_ALUMNI',
  UPDATE_ALUMNI: 'UPDATE_ALUMNI',
  DELETE_ALUMNI: 'DELETE_ALUMNI',
  EXPORT_ALUMNI: 'EXPORT_ALUMNI',

  // Alumni Portal (for graduated students)
  READ_ALUMNI_PORTAL: 'READ_ALUMNI_PORTAL',
  UPDATE_ALUMNI_PORTAL: 'UPDATE_ALUMNI_PORTAL',
} as const;
