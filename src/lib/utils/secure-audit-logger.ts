/**
 * Secure audit logging utility with integrity checks
 */

import crypto from 'crypto';
import { db } from '@/lib/db';

interface AuditLogData {
  userId?: string | null;
  action: string;
  resource: string;
  resourceId: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  schoolId?: string;
}

/**
 * Generate secure checksum for audit log integrity
 */
function generateSecureChecksum(data: AuditLogData, timestamp: Date): string {
  const secret = process.env.AUDIT_LOG_SECRET || 'default-secret-change-in-production';
  const payload = JSON.stringify({
    ...data,
    timestamp: timestamp.toISOString(),
  });
  
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Create secure audit log entry with integrity validation
 */
export async function createSecureAuditLog(data: AuditLogData): Promise<void> {
  try {
    const timestamp = new Date();
    const checksum = generateSecureChecksum(data, timestamp);
    
    // SECURITY: Validate required fields
    if (!data.action || !data.resource || !data.resourceId) {
      throw new Error('Missing required audit log fields');
    }
    
    // SECURITY: Sanitize changes data to prevent injection
    const sanitizedChanges = data.changes ? JSON.parse(JSON.stringify(data.changes)) : null;
    
    await db.auditLog.create({
      data: {
        ...data,
        changes: sanitizedChanges,
        timestamp,
        checksum,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });
  } catch (error) {
    console.error('Failed to create secure audit log:', error);
    // Don't throw - audit logging should not break application flow
  }
}

/**
 * Verify audit log integrity
 */
export async function verifyAuditLogIntegrity(auditLogId: string): Promise<boolean> {
  try {
    const auditLog = await db.auditLog.findUnique({
      where: { id: auditLogId },
    });
    
    if (!auditLog) {
      return false;
    }
    
    const expectedChecksum = generateSecureChecksum(
      {
        userId: auditLog.userId,
        action: auditLog.action,
        resource: auditLog.resource,
        resourceId: auditLog.resourceId,
        changes: auditLog.changes,
        ipAddress: auditLog.ipAddress,
        userAgent: auditLog.userAgent,
        schoolId: auditLog.schoolId,
      },
      auditLog.timestamp || auditLog.createdAt
    );
    
    return auditLog.checksum === expectedChecksum;
  } catch (error) {
    console.error('Failed to verify audit log integrity:', error);
    return false;
  }
}