/**
 * Permission Audit Logging Service
 * Logs all permission checks and denials for compliance and security monitoring
 * Validates: Requirements 20.4
 */

import { PrismaClient, AuditAction } from '@prisma/client';

const prisma = new PrismaClient();

export interface PermissionAuditEntry {
  userId: string;
  resource: string;
  action: string;
  granted: boolean;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Log a permission check event
 * Records both successful permission grants and denials
 * 
 * @param entry - The permission audit entry to log
 * @returns Promise<void>
 */
export async function logPermissionCheck(entry: PermissionAuditEntry): Promise<void> {
  try {
    const {
      userId,
      resource,
      action,
      granted,
      ipAddress = 'unknown',
      userAgent = 'unknown',
      metadata = {},
    } = entry;

    // Verify user exists before creating audit log
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      // User doesn't exist in database, skip audit logging
      console.warn(`Skipping audit log for non-existent user: ${userId}`);
      return;
    }

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.READ, // Permission checks are READ operations
        resource: `PERMISSION_CHECK`,
        resourceId: `${resource}:${action}`,
        changes: {
          resource,
          action,
          granted,
          ...metadata,
        },
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging should not break the application
    console.error('Error logging permission check:', error);
  }
}

/**
 * Log a permission denial event
 * Records when a user is denied access to a resource
 * 
 * @param entry - The permission audit entry to log
 * @returns Promise<void>
 */
export async function logPermissionDenial(entry: PermissionAuditEntry): Promise<void> {
  try {
    const {
      userId,
      resource,
      action,
      ipAddress = 'unknown',
      userAgent = 'unknown',
      metadata = {},
    } = entry;

    // Verify user exists before creating audit log
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      // User doesn't exist in database, skip audit logging
      console.warn(`Skipping audit log for non-existent user: ${userId}`);
      return;
    }

    // Create audit log entry for denial
    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.READ, // Permission checks are READ operations
        resource: `PERMISSION_DENIED`,
        resourceId: `${resource}:${action}`,
        changes: {
          resource,
          action,
          granted: false,
          reason: 'Permission denied',
          ...metadata,
        },
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging should not break the application
    console.error('Error logging permission denial:', error);
  }
}

/**
 * Get permission audit logs for a user
 * Retrieves all permission check logs for a specific user
 * 
 * @param userId - The user ID to get logs for
 * @param limit - Maximum number of logs to retrieve (default: 100)
 * @returns Promise<AuditLog[]>
 */
export async function getPermissionAuditLogs(userId: string, limit: number = 100) {
  try {
    return await prisma.auditLog.findMany({
      where: {
        userId,
        OR: [
          { resource: 'PERMISSION_CHECK' },
          { resource: 'PERMISSION_DENIED' },
        ],
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error retrieving permission audit logs:', error);
    return [];
  }
}

/**
 * Get permission audit logs for a resource
 * Retrieves all permission check logs for a specific resource
 * 
 * @param resource - The resource to get logs for
 * @param limit - Maximum number of logs to retrieve (default: 100)
 * @returns Promise<AuditLog[]>
 */
export async function getResourcePermissionAuditLogs(resource: string, limit: number = 100) {
  try {
    return await prisma.auditLog.findMany({
      where: {
        OR: [
          { resource: 'PERMISSION_CHECK' },
          { resource: 'PERMISSION_DENIED' },
        ],
        changes: {
          path: ['resource'],
          equals: resource,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error retrieving resource permission audit logs:', error);
    return [];
  }
}

/**
 * Get permission denial statistics
 * Provides insights into permission denials for security monitoring
 * 
 * @param startDate - Start date for the statistics (optional)
 * @param endDate - End date for the statistics (optional)
 * @returns Promise<object>
 */
export async function getPermissionDenialStats(startDate?: Date, endDate?: Date) {
  try {
    const whereClause: any = {
      resource: 'PERMISSION_DENIED',
    };

    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) whereClause.timestamp.gte = startDate;
      if (endDate) whereClause.timestamp.lte = endDate;
    }

    const denials = await prisma.auditLog.findMany({
      where: whereClause,
      select: {
        userId: true,
        changes: true,
        timestamp: true,
      },
    });

    // Aggregate statistics
    const stats = {
      totalDenials: denials.length,
      denialsByUser: {} as Record<string, number>,
      denialsByResource: {} as Record<string, number>,
      denialsByAction: {} as Record<string, number>,
    };

    denials.forEach((denial) => {
      const changes = denial.changes as any;
      
      // Count by user
      stats.denialsByUser[denial.userId] = (stats.denialsByUser[denial.userId] || 0) + 1;
      
      // Count by resource
      if (changes?.resource) {
        stats.denialsByResource[changes.resource] = 
          (stats.denialsByResource[changes.resource] || 0) + 1;
      }
      
      // Count by action
      if (changes?.action) {
        stats.denialsByAction[changes.action] = 
          (stats.denialsByAction[changes.action] || 0) + 1;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting permission denial statistics:', error);
    return {
      totalDenials: 0,
      denialsByUser: {},
      denialsByResource: {},
      denialsByAction: {},
    };
  }
}
