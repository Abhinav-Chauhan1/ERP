/**
 * Permission Check API Endpoint
 * Provides an API for checking user permissions from client components
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/utils/permissions';
import { PermissionAction } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
    const clerkUserId = session?.user?.id;

    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { userId, resource, action } = body;

    // Validate input
    if (!userId || !resource || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, resource, action' },
        { status: 400 }
      );
    }

    // Security check: users can only check their own permissions
    // Admins can check any user's permissions
    if (userId !== clerkUserId) {
      // Check if the requesting user is an admin
      const userRole = session?.user?.role;
      if (userRole !== 'ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Cannot check permissions for other users' },
          { status: 403 }
        );
      }
    }

    // Extract audit context from request
    const ipAddress = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check permission with audit context
    const hasPermissionResult = await hasPermission(
      userId,
      resource,
      action as PermissionAction,
      {
        ipAddress,
        userAgent,
        metadata: {
          source: 'api',
          endpoint: '/api/permissions/check',
        },
      }
    );

    return NextResponse.json({
      success: true,
      hasPermission: hasPermissionResult,
      resource,
      action,
    });
  } catch (error) {
    console.error('Error in permission check API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
