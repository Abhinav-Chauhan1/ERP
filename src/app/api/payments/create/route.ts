/**
 * Payment Order Creation API Route
 * Creates a Razorpay order for payment processing
 * Requirements: 1.3, 10.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';
import { createPaymentOrder } from '@/lib/utils/payment-gateway';
import { paymentGatewayOrderSchema } from '@/lib/schemaValidation/parent-fee-schemas';
import { verifyCsrfToken } from '@/lib/utils/csrf';
import { rateLimitMiddleware, RateLimitPresets } from '@/lib/utils/rate-limit';
import { z } from 'zod';

/**
 * Helper function to get current parent
 */
async function getCurrentParent() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  // CRITICAL: Get school context first
  const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
  const schoolId = await getRequiredSchoolId();

  const dbUser = await db.user.findFirst({
    where: {
      id: clerkUser.id,    }
  });

  if (!dbUser || dbUser.role !== UserRole.PARENT) {
    return null;
  }

  const parent = await db.parent.findFirst({
    where: {
      userId: dbUser.id,    }
  });

  return parent;
}

/**
 * Helper function to verify parent-child relationship
 */
async function verifyParentChildRelationship(
  parentId: string,
  childId: string
): Promise<boolean> {
  const relationship = await db.studentParent.findFirst({
    where: { parentId, studentId: childId }
  });
  return !!relationship;
}

/**
 * POST /api/payments/create
 * Create a payment order for fee payment
 */
export async function POST(req: NextRequest) {
  try {
    // Get current parent
    const parent = await getCurrentParent();

    if (!parent) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting check
    const rateLimitResult = await rateLimitMiddleware(parent.id, RateLimitPresets.PAYMENT);

    if (rateLimitResult.exceeded) {
      const resetInSeconds = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
      return NextResponse.json(
        {
          success: false,
          message: `Too many requests. Please try again in ${resetInSeconds} seconds.`,
          retryAfter: resetInSeconds
        },
        {
          status: 429,
          headers: {
            'Retry-After': resetInSeconds.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          }
        }
      );
    }

    // Parse and validate request body
    const body = await req.json();

    // Verify CSRF token
    const csrfToken = body.csrf_token || req.headers.get('x-csrf-token');
    const isCsrfValid = await verifyCsrfToken(csrfToken);

    if (!isCsrfValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    const validated = paymentGatewayOrderSchema.parse(body);

    // Verify parent-child relationship
    const hasAccess = await verifyParentChildRelationship(
      parent.id,
      validated.childId
    );

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // CRITICAL: Get school context
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Verify fee structure exists and is active - CRITICAL: Filter by school
    const feeStructure = await db.feeStructure.findFirst({
      where: { 
        id: validated.feeStructureId,
        schoolId, // CRITICAL: Ensure fee structure belongs to current school
      },
      include: {
        items: {
          include: {
            feeType: true
          }
        },
        academicYear: true
      }
    });

    if (!feeStructure || !feeStructure.isActive) {
      return NextResponse.json(
        { success: false, message: 'Invalid fee structure' },
        { status: 400 }
      );
    }

    // Verify fee type IDs are valid
    const validFeeTypeIds = feeStructure.items.map(item => item.feeTypeId);
    const invalidFeeTypes = validated.feeTypeIds.filter(
      id => !validFeeTypeIds.includes(id)
    );

    if (invalidFeeTypes.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid fee types selected' },
        { status: 400 }
      );
    }

    // Get student details for receipt - CRITICAL: Filter by school
    const student = await db.student.findFirst({
      where: { 
        id: validated.childId,
        schoolId, // CRITICAL: Ensure student belongs to current school
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      );
    }

    // Generate receipt number
    const receiptNumber = `RCP-${Date.now()}-${validated.childId.slice(-6)}`;

    // Create payment order in Razorpay
    const order = await createPaymentOrder({
      amount: validated.amount,
      currency: validated.currency,
      receipt: receiptNumber,
      notes: {
        studentId: validated.childId,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        feeStructureId: validated.feeStructureId,
        feeStructureName: feeStructure.name,
        academicYear: feeStructure.academicYear.name,
        parentId: parent.id,
      }
    });

    // Return order details to client
    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      },
      message: 'Payment order created successfully'
    });

  } catch (error) {
    console.error('Error creating payment order:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid request data', errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
