import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { rateLimit } from '@/lib/middleware/rate-limit';
import { subHours, subDays } from 'date-fns';

const rateLimitConfig = {
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200, // Higher limit for real-time events
};

/**
 * GET /api/super-admin/analytics/authentication/events
 * Get real-time authentication events for monitoring
 * 
 * Query Parameters:
 * - limit: number (default: 50, max: 200)
 * - offset: number (default: 0)
 * - timeRange: '1h' | '6h' | '24h' | '7d' (default: '24h')
 * - eventType: 'all' | 'success' | 'failure' | 'security' (default: 'all')
 * - schoolId: string (optional)
 * - userId: string (optional)
 * - ipAddress: string (optional)
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');
    const timeRangeParam = searchParams.get('timeRange') || '24h';
    const eventType = searchParams.get('eventType') || 'all';
    const schoolId = searchParams.get('schoolId') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const ipAddress = searchParams.get('ipAddress') || undefined;

    // Calculate time range
    const now = new Date();
    let startDate: Date;
    
    switch (timeRangeParam) {
      case '1h':
        startDate = subHours(now, 1);
        break;
      case '6h':
        startDate = subHours(now, 6);
        break;
      case '24h':
        startDate = subHours(now, 24);
        break;
      case '7d':
        startDate = subDays(now, 7);
        break;
      default:
        startDate = subHours(now, 24);
    }

    // Build where clause
    const whereClause: any = {
      createdAt: {
        gte: startDate,
        lte: now
      }
    };

    // Filter by event type
    switch (eventType) {
      case 'success':
        whereClause.action = {
          in: ['LOGIN_SUCCESS', 'AUTH_SUCCESS', 'SESSION_CREATED']
        };
        break;
      case 'failure':
        whereClause.action = {
          in: ['LOGIN_FAILURE', 'AUTH_FAILED', 'UNAUTHORIZED_ACCESS_ATTEMPT']
        };
        break;
      case 'security':
        whereClause.action = {
          in: [
            'SUSPICIOUS_ACTIVITY',
            'RATE_LIMIT_EXCEEDED',
            'BRUTE_FORCE_ATTEMPT',
            'UNAUTHORIZED_ACCESS_ATTEMPT',
            'MULTIPLE_FAILED_LOGINS'
          ]
        };
        break;
      case 'all':
      default:
        whereClause.action = {
          in: [
            'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGIN_ATTEMPT',
            'AUTH_SUCCESS', 'AUTH_FAILED',
            'SESSION_CREATED', 'SESSION_EXPIRED', 'SESSION_INVALIDATED',
            'SCHOOL_CONTEXT_SWITCH',
            'SUSPICIOUS_ACTIVITY', 'RATE_LIMIT_EXCEEDED', 'BRUTE_FORCE_ATTEMPT',
            'UNAUTHORIZED_ACCESS_ATTEMPT',
            'OTP_GENERATED', 'OTP_VERIFIED', 'OTP_FAILED', 'OTP_EXPIRED'
          ]
        };
        break;
    }

    // Apply additional filters
    if (schoolId) {
      whereClause.schoolId = schoolId;
    }

    if (userId) {
      whereClause.userId = userId;
    }

    if (ipAddress) {
      whereClause.ipAddress = ipAddress;
    }

    // Get total count for pagination
    const totalCount = await db.auditLog.count({ where: whereClause });

    // Get events with user and school information
    const events = await db.auditLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        school: {
          select: {
            id: true,
            name: true,
            schoolCode: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Transform events for frontend consumption
    const transformedEvents = events.map(event => ({
      id: event.id,
      timestamp: event.createdAt,
      action: event.action,
      result: getEventResult(event.action),
      severity: getEventSeverity(event.action),
      user: event.user ? {
        id: event.user.id,
        name: event.user.name,
        email: event.user.email,
        role: event.user.role
      } : null,
      school: event.school ? {
        id: event.school.id,
        name: event.school.name,
        schoolCode: event.school.schoolCode
      } : null,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      details: event.details,
      metadata: {
        duration: event.details?.duration,
        authMethod: event.details?.metadata?.authMethod,
        failureReason: event.details?.failureReason,
        riskScore: event.details?.riskScore,
        deviceInfo: event.details?.metadata?.deviceInfo,
        geoLocation: event.details?.metadata?.geoLocation
      }
    }));

    // Calculate summary statistics
    const summary = {
      totalEvents: totalCount,
      eventsInRange: events.length,
      successfulEvents: events.filter(e => getEventResult(e.action) === 'SUCCESS').length,
      failedEvents: events.filter(e => getEventResult(e.action) === 'FAILURE').length,
      securityEvents: events.filter(e => getEventSeverity(e.action) === 'HIGH' || getEventSeverity(e.action) === 'CRITICAL').length,
      uniqueUsers: new Set(events.map(e => e.userId).filter(Boolean)).size,
      uniqueSchools: new Set(events.map(e => e.schoolId).filter(Boolean)).size,
      uniqueIPs: new Set(events.map(e => e.ipAddress).filter(Boolean)).size
    };

    // Log audit event (only for security-related queries)
    if (eventType === 'security' || ipAddress) {
      await logAuditEvent({
        userId: session.user.id,
        action: AuditAction.READ,
        resource: 'AUTHENTICATION_EVENTS',
        resourceId: eventType,
        metadata: {
          timeRange: timeRangeParam,
          eventType,
          schoolId,
          userId,
          ipAddress,
          eventsReturned: events.length
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        events: transformedEvents,
        summary,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
          nextOffset: offset + limit < totalCount ? offset + limit : null
        },
        filters: {
          timeRange: timeRangeParam,
          eventType,
          schoolId,
          userId,
          ipAddress
        },
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching authentication events:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch authentication events',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/super-admin/analytics/authentication/events
 * Manually track authentication event (for testing or external integrations)
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
      eventType,
      userId,
      schoolId,
      metadata = {}
    } = body;

    // Validate required fields
    if (!eventType) {
      return NextResponse.json(
        { error: 'Missing required field: eventType' },
        { status: 400 }
      );
    }

    // Validate event type
    const validEventTypes = [
      'LOGIN_ATTEMPT', 'LOGIN_SUCCESS', 'LOGIN_FAILURE',
      'AUTH_SUCCESS', 'AUTH_FAILED',
      'SESSION_CREATED', 'SESSION_EXPIRED',
      'OTP_GENERATED', 'OTP_VERIFIED', 'OTP_FAILED',
      'SUSPICIOUS_ACTIVITY'
    ];

    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid eventType. Must be one of: ${validEventTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Create audit log entry
    const auditEntry = await db.auditLog.create({
      data: {
        userId: userId || null,
        schoolId: schoolId || null,
        action: eventType,
        details: {
          manuallyCreated: true,
          createdBy: session.user.id,
          createdAt: new Date().toISOString(),
          ...metadata
        },
        ipAddress: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
        userAgent: request.headers.get('user-agent') || 'API'
      }
    });

    // Log audit event for the manual creation
    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.CREATE,
      resource: 'AUTHENTICATION_EVENT',
      resourceId: auditEntry.id,
      metadata: {
        eventType,
        targetUserId: userId,
        targetSchoolId: schoolId,
        manuallyCreated: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        eventId: auditEntry.id,
        eventType,
        createdAt: auditEntry.createdAt,
        message: 'Authentication event tracked successfully'
      }
    });

  } catch (error) {
    console.error('Error tracking authentication event:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to track authentication event',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper functions

function getEventResult(action: string): 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO' {
  const successActions = [
    'LOGIN_SUCCESS', 'AUTH_SUCCESS', 'SESSION_CREATED', 
    'OTP_GENERATED', 'OTP_VERIFIED', 'SCHOOL_CONTEXT_SWITCH'
  ];
  
  const failureActions = [
    'LOGIN_FAILURE', 'AUTH_FAILED', 'UNAUTHORIZED_ACCESS_ATTEMPT',
    'OTP_FAILED', 'OTP_EXPIRED'
  ];
  
  const warningActions = [
    'SUSPICIOUS_ACTIVITY', 'RATE_LIMIT_EXCEEDED', 'BRUTE_FORCE_ATTEMPT'
  ];

  if (successActions.includes(action)) return 'SUCCESS';
  if (failureActions.includes(action)) return 'FAILURE';
  if (warningActions.includes(action)) return 'WARNING';
  return 'INFO';
}

function getEventSeverity(action: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const criticalActions = ['BRUTE_FORCE_ATTEMPT', 'SUSPICIOUS_ACTIVITY'];
  const highActions = ['UNAUTHORIZED_ACCESS_ATTEMPT', 'RATE_LIMIT_EXCEEDED'];
  const mediumActions = ['LOGIN_FAILURE', 'AUTH_FAILED', 'OTP_FAILED'];
  
  if (criticalActions.includes(action)) return 'CRITICAL';
  if (highActions.includes(action)) return 'HIGH';
  if (mediumActions.includes(action)) return 'MEDIUM';
  return 'LOW';
}