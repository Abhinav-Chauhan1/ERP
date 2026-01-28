import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { emergencyAccessService } from '@/lib/services/emergency-access-service';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

const emergencyDisableSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  disableUntil: z.string().transform(str => new Date(str)).optional(),
  notifyUsers: z.boolean().default(false),
  revokeActiveSessions: z.boolean().default(true),
  preventNewLogins: z.boolean().default(true),
  confirmationCode: z.string().min(1, 'Confirmation code is required'),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Very restrictive for emergency actions
};

/**
 * POST /api/super-admin/emergency/users/[id]/disable
 * Emergency disable user account with immediate effect
 * Requirements: 10.7 - Super admin should have emergency access to disable any school or user account
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = emergencyDisableSchema.parse(body);

    // Verify confirmation code (simple check - in production, use more secure method)
    const expectedCode = `DISABLE-${id.slice(-6).toUpperCase()}`;
    if (validatedData.confirmationCode !== expectedCode) {
      return NextResponse.json(
        { 
          error: 'Invalid confirmation code',
          expectedFormat: 'DISABLE-XXXXXX (last 6 characters of user ID in uppercase)'
        },
        { status: 400 }
      );
    }

    const result = await emergencyAccessService.emergencyDisableUser(
      id,
      {
        reason: validatedData.reason,
        disableUntil: validatedData.disableUntil,
        notifyUsers: validatedData.notifyUsers,
        revokeActiveSessions: validatedData.revokeActiveSessions,
        preventNewLogins: validatedData.preventNewLogins,
      },
      session.user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        affectedUsers: result.affectedUsers,
        invalidatedSessions: result.invalidatedSessions,
        timestamp: new Date().toISOString(),
        performedBy: session.user.name || session.user.email,
      }
    });

  } catch (error) {
    console.error('Emergency disable user error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/super-admin/emergency/users/[id]/disable
 * Emergency enable user account (reverse emergency disable)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { reason } = z.object({
      reason: z.string().min(10, 'Reason must be at least 10 characters')
    }).parse(body);

    const result = await emergencyAccessService.emergencyEnableUser(
      id,
      reason,
      session.user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        affectedUsers: result.affectedUsers,
        timestamp: new Date().toISOString(),
        performedBy: session.user.name || session.user.email,
      }
    });

  } catch (error) {
    console.error('Emergency enable user error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}