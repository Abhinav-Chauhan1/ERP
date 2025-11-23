/**
 * Permission Audit Logs API Endpoint
 * Provides access to permission check and denial logs for administrators
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { hasPermission } from '@/lib/utils/permissions';
import { PermissionAction } from '@prisma/client';
import {
  getPermissionAuditLogs,
  getResourcePermissionAuditLogs,
  getPermissionDenialStats,
} from '@/lib/services/permission-audit';

/**
 * GET /api/permissions/audit-logs
 * Retrieve permission audit logs
 * Query parameters:
 * - userId: Filter by user ID
 * - resource: Filter by resource
 * - limit: Maximum number of logs to retrieve (default: 100)
 * - stats: If 'true', return denial statistics instead of logs
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to view audit logs
    const canViewAuditLogs = await hasPermission(
      clerkUserId,
      'AUDIT_LOG',
      PermissionAction.READ,
      {
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          source: 'api',
          endpoint: '/api/permissions/audit-logs',
        },
      }
    );

    if (!canViewAuditLogs) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to view audit logs' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const resource = searchParams.get('resource');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const stats = searchParams.get('stats') === 'true';

    // Return statistics if requested
    if (stats) {
      const startDate = searchParams.get('startDate') 
        ? new Date(searchParams.get('startDate')!) 
        : undefined;
      const endDate = searchParams.get('endDate') 
        ? new Date(searchParams.get('endDate')!) 
        : undefined;

      const statistics = await getPermissionDenialStats(startDate, endDate);
      
      return NextResponse.json({
        success: true,
        stats: statistics,
      });
    }

    // Retrieve logs based on filters
    let logs;
    if (userId) {
      logs = await getPermissionAuditLogs(userId, limit);
    } else if (resource) {
      logs = await getResourcePermissionAuditLogs(resource, limit);
    } else {
      // If no filter specified, return user's own logs
      logs = await getPermissionAuditLogs(clerkUserId, limit);
    }

    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (error) {
    console.error('Error retrieving permission audit logs:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
