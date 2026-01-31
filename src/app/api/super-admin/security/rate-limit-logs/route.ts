import { NextRequest, NextResponse } from 'next/server';
import { rateLimitLogger } from '@/lib/services/rate-limit-logger';
import { superAdminAuth } from '@/lib/middleware/super-admin-auth';

/**
 * Get rate limiting logs
 * Requirements: 14.5
 */
export async function GET(request: NextRequest) {
  try {
    // Verify super admin authentication
    const authResult = await superAdminAuth(request);
    if (authResult) {
      return authResult; // Return the error response
    }

    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get('identifier') || undefined;
    const action = searchParams.get('action') || undefined;
    const type = searchParams.get('type') || undefined;
    const startDate = searchParams.get('startDate') ? 
      new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? 
      new Date(searchParams.get('endDate')!) : undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await rateLimitLogger.getLogs({
      identifier,
      action,
      type,
      startDate,
      endDate,
      limit,
      offset
    });

    return NextResponse.json({
      success: true,
      logs: result.logs,
      total: result.total,
      hasMore: result.hasMore
    });

  } catch (error) {
    console.error('Failed to get rate limit logs:', error);
    return NextResponse.json(
      { error: 'Failed to get rate limit logs' },
      { status: 500 }
    );
  }
}

/**
 * Export rate limiting logs
 * Requirements: 14.5
 */
export async function POST(request: NextRequest) {
  try {
    // Verify super admin authentication
    const authResult = await superAdminAuth(request);
    if (authResult) {
      return authResult; // Return the error response
    }

    const body = await request.json();
    const { format = 'json', ...filters } = body;

    const result = await rateLimitLogger.exportLogs(filters, format);

    return new NextResponse(result.data, {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
      },
    });

  } catch (error) {
    console.error('Failed to export rate limit logs:', error);
    return NextResponse.json(
      { error: 'Failed to export rate limit logs' },
      { status: 500 }
    );
  }
}