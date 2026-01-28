import { NextRequest, NextResponse } from 'next/server';
import { rateLimitingService } from '@/lib/services/rate-limiting-service';
import { superAdminAuth } from '@/lib/middleware/super-admin-auth';

/**
 * Unblock identifier
 * Requirements: 14.4
 */
export async function POST(request: NextRequest) {
  try {
    // Verify super admin authentication
    const authResult = await superAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { identifier } = await request.json();

    if (!identifier) {
      return NextResponse.json(
        { error: 'Identifier is required' },
        { status: 400 }
      );
    }

    const success = await rateLimitingService.unblockIdentifier(
      identifier,
      authResult.user.id
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Identifier unblocked successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to unblock identifier or identifier not found' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Failed to unblock identifier:', error);
    return NextResponse.json(
      { error: 'Failed to unblock identifier' },
      { status: 500 }
    );
  }
}