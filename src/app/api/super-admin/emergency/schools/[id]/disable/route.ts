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
  max: 3, // Very restrictive for school emergency actions
};

/**
 * POST /api/super-admin/emergency/schools/[id]/disable
 * Emergency disable school account with immediate effect
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
    const expectedCode = `SCHOOL-${id.slice(-6).toUpperCase()}`;
    if (validatedData.confirmationCode !== expectedCode) {
      return NextResponse.json(
        { 
          error: 'Invalid confirmation code',
          expectedFormat: 'SCHOOL-XXXXXX (last 6 characters of school ID in uppercase)'
        },
        { status: 400 }
      );
    }

    const result = await emergencyAccessService.emergencyDisableSchool(
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
    console.error('Emergency disable school error:', error);
    
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
 * DELETE /api/super-admin/emergency/schools/[id]/disable
 * Emergency enable school account (reverse emergency disable)
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

    const result = await emergencyAccessService.emergencyEnableSchool(
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
    console.error('Emergency enable school error:', error);
    
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