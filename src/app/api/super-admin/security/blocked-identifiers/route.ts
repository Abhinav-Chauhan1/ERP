import { NextRequest, NextResponse } from 'next/server';
import { rateLimitingService } from '@/lib/services/rate-limiting-service';
import { superAdminAuth } from '@/lib/middleware/super-admin-auth';

/**
 * Get blocked identifiers
 * Requirements: 14.4
 */
export async function GET(request: NextRequest) {
  try {
    // Verify super admin authentication
    const authResult = await superAdminAuth(request);
    if (authResult) {
      return authResult; // Return the error response
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await rateLimitingService.getBlockedIdentifiers(limit, offset);

    return NextResponse.json({
      success: true,
      identifiers: result.identifiers,
      total: result.total,
      hasMore: result.hasMore
    });

  } catch (error) {
    console.error('Failed to get blocked identifiers:', error);
    return NextResponse.json(
      { error: 'Failed to get blocked identifiers' },
      { status: 500 }
    );
  }
}