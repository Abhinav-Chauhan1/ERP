import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { billingService } from '@/lib/services/billing-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

const processPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  description: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  receipt: z.string().optional(),
  notes: z.record(z.string()).optional(),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 50, // Lower limit for payment operations
};

/**
 * GET /api/super-admin/billing/payments
 * Get payment history with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let paymentHistory;
    if (schoolId) {
      paymentHistory = await billingService.getPaymentHistory(schoolId);
    } else {
      // This would need to be implemented in billing service
      paymentHistory = await billingService.getAllPayments();
    }

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'PAYMENT',
      metadata: {
        filters: { schoolId, status, startDate, endDate, limit, offset },
      },
    });

    return NextResponse.json(paymentHistory);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/super-admin/billing/payments
 * Process a new payment
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = processPaymentSchema.parse(body);

    const paymentResult = await billingService.processPayment(validatedData);

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.CREATE,
      resource: 'PAYMENT',
      resourceId: paymentResult.id,
      changes: validatedData,
    });

    return NextResponse.json(paymentResult, { status: 201 });
  } catch (error) {
    console.error('Error processing payment:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}