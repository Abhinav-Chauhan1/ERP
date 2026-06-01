import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { billingService } from '@/lib/services/billing-service';
import { rateLimit } from '@/lib/middleware/rate-limit';
import { z } from 'zod';
import { requireSchoolAccess } from '@/lib/auth/tenant';

const checkoutSchema = z.object({
  planId: z.string().min(1, "Plan ID is required"),
  studentCount: z.number().int().positive("Student count must be a positive integer"),
});

const rateLimitConfig = { windowMs: 60 * 1000, max: 5 };

/**
 * POST /api/subscription/checkout
 * Create a Cashfree order for school subscription payment.
 * Called by school admins selecting/upgrading a plan.
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) {
      return NextResponse.json({ success: false, message: 'School context required' }, { status: 403 });
    }

    const body = await req.json();
    const validated = checkoutSchema.parse(body);

    const result = await billingService.createSubscriptionCheckout(
      schoolId,
      validated.planId,
      validated.studentCount
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error creating subscription checkout:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid request data', errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to create subscription checkout' },
      { status: 500 }
    );
  }
}
