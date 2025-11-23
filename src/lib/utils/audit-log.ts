/**
 * Audit Logging Service
 * 
 * Provides comprehensive audit logging for all system actions.
 * Logs user actions, authentication events, and data changes.
 * 
 * Requirements: 6.2
 */

import { db as prisma } from '@/lib/db';
import { AuditAction } from '@prisma/client';
import { headers } from 'next/headers';

export interface AuditLogEntry {
  userId: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditFilters {
  userId?: string;
  action?: AuditAction;
  resource?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Get IP address and user agent from request headers
 */
async function getRequestMetadata(): Promise<{ ipAddress: string; userAgent: string }> {
  const headersList = await headers();
  
  // Try to get real IP from various headers (for proxies/load balancers)
  const ipAddress = 
    headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
    headersList.get('x-real-ip') ||
    headersList.get('cf-connecting-ip') || // Cloudflare
    'unknown';
  
  const userAgent = headersList.get('user-agent') || 'unknown';
  
  return { ipAddress, userAgent };
}

/**
 * Log an audit entry
 * 
 * @param entry - The audit log entry to create
 * @returns Promise<void>
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const metadata = await getRequestMetadata();
    
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        changes: entry.changes || undefined,
        ipAddress: entry.ipAddress || metadata.ipAddress,
        userAgent: entry.userAgent || metadata.userAgent,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging should not break the main flow
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Log a CREATE action
 */
export async function logCreate(
  userId: string,
  resource: string,
  resourceId: string,
  data?: Record<string, any>
): Promise<void> {
  await logAudit({
    userId,
    action: AuditAction.CREATE,
    resource,
    resourceId,
    changes: data ? { created: data } : undefined,
  });
}

/**
 * Log a READ action
 */
export async function logRead(
  userId: string,
  resource: string,
  resourceId?: string
): Promise<void> {
  await logAudit({
    userId,
    action: AuditAction.READ,
    resource,
    resourceId,
  });
}

/**
 * Log an UPDATE action
 */
export async function logUpdate(
  userId: string,
  resource: string,
  resourceId: string,
  changes: { before: Record<string, any>; after: Record<string, any> }
): Promise<void> {
  await logAudit({
    userId,
    action: AuditAction.UPDATE,
    resource,
    resourceId,
    changes,
  });
}

/**
 * Log a DELETE action
 */
export async function logDelete(
  userId: string,
  resource: string,
  resourceId: string,
  data?: Record<string, any>
): Promise<void> {
  await logAudit({
    userId,
    action: AuditAction.DELETE,
    resource,
    resourceId,
    changes: data ? { deleted: data } : undefined,
  });
}

/**
 * Log a LOGIN action
 */
export async function logLogin(userId: string): Promise<void> {
  await logAudit({
    userId,
    action: AuditAction.LOGIN,
    resource: 'authentication',
  });
}

/**
 * Log a LOGOUT action
 */
export async function logLogout(userId: string): Promise<void> {
  await logAudit({
    userId,
    action: AuditAction.LOGOUT,
    resource: 'authentication',
  });
}

/**
 * Log an EXPORT action
 */
export async function logExport(
  userId: string,
  resource: string,
  format: string,
  filters?: Record<string, any>
): Promise<void> {
  await logAudit({
    userId,
    action: AuditAction.EXPORT,
    resource,
    changes: { format, filters },
  });
}

/**
 * Log an IMPORT action
 */
export async function logImport(
  userId: string,
  resource: string,
  recordCount: number,
  summary?: Record<string, any>
): Promise<void> {
  await logAudit({
    userId,
    action: AuditAction.IMPORT,
    resource,
    changes: { recordCount, summary },
  });
}

/**
 * Query audit logs with filters
 * 
 * @param filters - Filters to apply to the query
 * @returns Promise with audit log entries
 */
export async function queryAuditLogs(filters: AuditFilters) {
  const where: any = {};
  
  if (filters.userId) {
    where.userId = filters.userId;
  }
  
  if (filters.action) {
    where.action = filters.action;
  }
  
  if (filters.resource) {
    where.resource = filters.resource;
  }
  
  if (filters.resourceId) {
    where.resourceId = filters.resourceId;
  }
  
  if (filters.startDate || filters.endDate) {
    where.timestamp = {};
    if (filters.startDate) {
      where.timestamp.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.timestamp.lte = filters.endDate;
    }
  }
  
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
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
      orderBy: {
        timestamp: 'desc',
      },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.auditLog.count({ where }),
  ]);
  
  return {
    logs,
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0,
  };
}

/**
 * Get audit log statistics
 */
export async function getAuditStats(userId?: string, startDate?: Date, endDate?: Date) {
  const where: any = {};
  
  if (userId) {
    where.userId = userId;
  }
  
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) {
      where.timestamp.gte = startDate;
    }
    if (endDate) {
      where.timestamp.lte = endDate;
    }
  }
  
  const [totalLogs, actionCounts, resourceCounts] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: true,
    }),
    prisma.auditLog.groupBy({
      by: ['resource'],
      where,
      _count: true,
      orderBy: {
        _count: {
          resource: 'desc',
        },
      },
      take: 10,
    }),
  ]);
  
  return {
    totalLogs,
    actionCounts: actionCounts.map(item => ({
      action: item.action,
      count: item._count,
    })),
    topResources: resourceCounts.map(item => ({
      resource: item.resource,
      count: item._count,
    })),
  };
}

/**
 * Delete old audit logs (for cleanup/archival)
 * 
 * @param olderThan - Delete logs older than this date
 * @returns Number of deleted records
 */
export async function deleteOldAuditLogs(olderThan: Date): Promise<number> {
  const result = await prisma.auditLog.deleteMany({
    where: {
      timestamp: {
        lt: olderThan,
      },
    },
  });
  
  return result.count;
}
