import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { authAnalyticsService } from '@/lib/services/auth-analytics-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { rateLimit } from '@/lib/middleware/rate-limit';
import { subDays } from 'date-fns';

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
};

/**
 * GET /api/super-admin/analytics/authentication
 * Get comprehensive authentication analytics for super admins
 * 
 * Query Parameters:
 * - timeRange: '7d' | '30d' | '90d' | '1y' (default: '30d')
 * - schoolId: string (optional) - filter by specific school
 * - userId: string (optional) - filter by specific user
 * - type: 'overview' | 'detailed' | 'security' | 'activity' (default: 'overview')
 * 
 * Requirements: 10.6 - Super admin should view usage analytics and payment status for all schools
 * Task: 11.5 - Create usage analytics integration with authentication events
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    // Verify super admin authentication
    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const timeRangeParam = searchParams.get('timeRange') || '30d';
    const schoolId = searchParams.get('schoolId') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const type = searchParams.get('type') || 'overview';

    // Calculate time range
    const now = new Date();
    let startDate: Date;
    
    switch (timeRangeParam) {
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      case '90d':
        startDate = subDays(now, 90);
        break;
      case '1y':
        startDate = subDays(now, 365);
        break;
      default:
        startDate = subDays(now, 30);
    }

    const timeRange = { startDate, endDate: now };
    const filters = { schoolId, userId };

    let analyticsData;

    // Get analytics data based on type
    switch (type) {
      case 'overview':
        analyticsData = await authAnalyticsService.getAuthAnalyticsDashboard(timeRange, filters);
        break;
      
      case 'detailed':
        const [authMetrics, activityMetrics, systemMetrics] = await Promise.all([
          authAnalyticsService.getAuthenticationMetrics(timeRange, filters),
          authAnalyticsService.getUserActivityMetrics(timeRange, filters),
          authAnalyticsService.getSystemUsageMetrics(timeRange, filters)
        ]);
        analyticsData = {
          authentication: authMetrics,
          activity: activityMetrics,
          system: systemMetrics
        };
        break;
      
      case 'security':
        analyticsData = await authAnalyticsService.getSecurityMetrics(timeRange, filters);
        break;
      
      case 'activity':
        analyticsData = await authAnalyticsService.getUserActivityMetrics(timeRange, filters);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid analytics type. Must be one of: overview, detailed, security, activity' },
          { status: 400 }
        );
    }

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'AUTHENTICATION_ANALYTICS',
      resourceId: type,
      metadata: {
        timeRange: timeRangeParam,
        schoolId,
        userId,
        type,
        dataPoints: Object.keys(analyticsData).length
      }
    });

    return NextResponse.json({
      success: true,
      data: analyticsData,
      metadata: {
        timeRange: {
          start: startDate.toISOString(),
          end: now.toISOString(),
          label: timeRangeParam
        },
        filters: {
          schoolId,
          userId
        },
        type,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching authentication analytics:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch authentication analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/super-admin/analytics/authentication
 * Generate custom authentication analytics report
 * 
 * Body:
 * {
 *   "reportName": string,
 *   "timeRange": { "startDate": string, "endDate": string },
 *   "filters": { "schoolId"?: string, "userId"?: string, "role"?: string },
 *   "metrics": string[],
 *   "format": "json" | "csv" | "pdf"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    // Verify super admin authentication
    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      reportName,
      timeRange: customTimeRange,
      filters = {},
      metrics = [],
      format = 'json'
    } = body;

    // Validate required fields
    if (!reportName || !customTimeRange?.startDate || !customTimeRange?.endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: reportName, timeRange.startDate, timeRange.endDate' },
        { status: 400 }
      );
    }

    // Parse time range
    const timeRange = {
      startDate: new Date(customTimeRange.startDate),
      endDate: new Date(customTimeRange.endDate)
    };

    // Validate time range
    if (timeRange.startDate >= timeRange.endDate) {
      return NextResponse.json(
        { error: 'Invalid time range: startDate must be before endDate' },
        { status: 400 }
      );
    }

    // Generate comprehensive report data
    const [authMetrics, activityMetrics, securityMetrics, systemMetrics] = await Promise.all([
      authAnalyticsService.getAuthenticationMetrics(timeRange, filters),
      authAnalyticsService.getUserActivityMetrics(timeRange, filters),
      authAnalyticsService.getSecurityMetrics(timeRange, filters),
      authAnalyticsService.getSystemUsageMetrics(timeRange, filters)
    ]);

    const reportData = {
      reportName,
      generatedAt: new Date().toISOString(),
      generatedBy: {
        userId: session.user.id,
        userName: session.user.name || 'Unknown',
        userEmail: session.user.email || 'Unknown'
      },
      timeRange,
      filters,
      metrics: {
        authentication: authMetrics,
        activity: activityMetrics,
        security: securityMetrics,
        system: systemMetrics
      },
      summary: {
        totalDataPoints: Object.keys(authMetrics).length + Object.keys(activityMetrics).length + 
                        Object.keys(securityMetrics).length + Object.keys(systemMetrics).length,
        timeRangeDays: Math.ceil((timeRange.endDate.getTime() - timeRange.startDate.getTime()) / (1000 * 60 * 60 * 24)),
        filtersApplied: Object.keys(filters).length
      }
    };

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.CREATE,
      resource: 'AUTHENTICATION_ANALYTICS_REPORT',
      resourceId: reportName,
      metadata: {
        reportName,
        timeRange,
        filters,
        format,
        dataPoints: reportData.summary.totalDataPoints
      }
    });

    // Return report data (file generation would be handled separately)
    return NextResponse.json({
      success: true,
      data: reportData,
      metadata: {
        reportId: `auth_analytics_${Date.now()}`,
        format,
        size: JSON.stringify(reportData).length,
        downloadUrl: format !== 'json' ? `/api/super-admin/analytics/authentication/download/${reportName}` : undefined
      }
    });

  } catch (error) {
    console.error('Error generating authentication analytics report:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate authentication analytics report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}