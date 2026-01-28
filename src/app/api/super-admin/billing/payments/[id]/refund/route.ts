import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { billingService } from '@/lib/services/billing-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

const refundSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().optional(),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 20, // Very restrictive for refund operations
};

/**
 * POST /api/super-admin/billing/payments/[id]/refund
 * Process a refund for a payment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = refundSchema.parse(body);

    const refundResult = await billingService.processRefund(params.id, validatedData.amount);

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      resource: 'PAYMENT',
      resourceId: params.id,
      changes: {
        action: 'refund',
        amount: validatedData.amount,
        reason: validatedData.reason,
      },
    });

    return NextResponse.json(refundResult);
  } catch (error) {
    console.error('Error processing refund:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}