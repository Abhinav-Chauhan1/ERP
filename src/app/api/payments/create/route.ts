/**
 * Payment Order Creation API Route
 * Creates a Cashfree order for payment processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createCashfreeOrder, getSchoolCashfreeInstance } from '@/lib/utils/payment-gateway';
import { paymentGatewayOrderSchema } from '@/lib/schemaValidation/parent-fee-schemas';
import { verifyCsrfToken } from '@/lib/utils/csrf';
import { rateLimitMiddleware, RateLimitPresets } from '@/lib/utils/rate-limit';
import {
  getCurrentParent,
  getActiveFeeDiscount,
  calculateNetPayable,
  getFeeAmountsForClass,
} from '@/lib/utils/payment-helpers';
import { getSchoolCashfreeCredentials } from '@/lib/actions/paymentConfigActions';
import { z } from 'zod';
import { formatFullName } from "@/lib/utils";

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
 * Create a Cashfree order for fee payment
 */
export async function POST(req: NextRequest) {
  try {
    const parent = await getCurrentParent();

    if (!parent) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    const body = await req.json();

    const csrfToken = body.csrf_token || req.headers.get('x-csrf-token');
    const isCsrfValid = await verifyCsrfToken(csrfToken);

    if (!isCsrfValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    const validated = paymentGatewayOrderSchema.parse(body);

    const hasAccess = await verifyParentChildRelationship(parent.id, validated.childId);

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const feeStructure = await db.feeStructure.findFirst({
      where: {
        id: validated.feeStructureId,
        schoolId,
      },
      include: {
        items: { include: { feeType: true } },
        academicYear: true
      }
    });

    if (!feeStructure || !feeStructure.isActive) {
      return NextResponse.json(
        { success: false, message: 'Invalid fee structure' },
        { status: 400 }
      );
    }

    const validFeeTypeIds = feeStructure.items.map(item => item.feeTypeId);
    const invalidFeeTypes = validated.feeTypeIds.filter(id => !validFeeTypeIds.includes(id));

    if (invalidFeeTypes.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid fee types selected' },
        { status: 400 }
      );
    }

    const student = await db.student.findFirst({
      where: { id: validated.childId, schoolId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        enrollments: {
          orderBy: { enrollDate: 'desc' },
          take: 1,
          select: { classId: true },
        },
      }
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      );
    }

    // Recompute the gross total for the selected fee types using class-specific,
    // frequency-annualized amounts, then validate the client-submitted amount
    // against the student's discounted net balance, so a tampered/incorrect
    // amount is rejected.
    const classId = student.enrollments[0]?.classId;
    const amountMap = await getFeeAmountsForClass(validated.feeTypeIds, classId, schoolId);

    const grossSelected = validated.feeTypeIds.reduce(
      (sum, feeTypeId) => sum + (amountMap.get(feeTypeId) ?? 0),
      0
    );

    const discount = await getActiveFeeDiscount(validated.childId, validated.feeStructureId, schoolId);
    const netPayableForSelection = calculateNetPayable(grossSelected, discount);

    const completedPayments = await db.feePayment.aggregate({
      where: {
        studentId: validated.childId,
        feeStructureId: validated.feeStructureId,
        schoolId,
        status: 'COMPLETED',
      },
      _sum: { paidAmount: true },
    });
    const remainingNetBalance = netPayableForSelection - (completedPayments._sum.paidAmount ?? 0);

    if (validated.amount > remainingNetBalance + 0.01) {
      return NextResponse.json(
        {
          success: false,
          message: `Payment amount exceeds outstanding balance of ₹${Math.max(remainingNetBalance, 0).toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    // Fetch school's own Cashfree credentials
    const schoolCreds = await getSchoolCashfreeCredentials(schoolId);
    if (!schoolCreds) {
      return NextResponse.json(
        { success: false, message: 'Online payments are not configured for this school. Please contact the school administrator.' },
        { status: 400 }
      );
    }

    const schoolCashfree = getSchoolCashfreeInstance(schoolCreds.appId, schoolCreds.secretKey);

    const orderId = `FEE-${Date.now()}-${validated.childId.slice(-6)}`;
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000';
    const returnUrl =
      `${baseUrl}/parent/fees/payment/success` +
      `?cfOrderId=${orderId}` +
      `&childId=${validated.childId}` +
      `&feeStructureId=${validated.feeStructureId}`;

    const { cfOrderId, paymentSessionId } = await createCashfreeOrder(
      {
        orderId,
        amount: validated.amount,
        currency: validated.currency || 'INR',
        customerName: `${formatFullName(student.user.firstName, student.user.lastName)}`,
        customerEmail: student.user.email || `${validated.childId}@student.school`,
        customerPhone: student.user.phone || '9999999999',
        returnUrl,
        notifyUrl: `${baseUrl}/api/payments/webhook`,
        tags: {
          studentId: validated.childId,
          feeStructureId: validated.feeStructureId,
          schoolId,
        },
      },
      schoolCashfree
    );

    return NextResponse.json({
      success: true,
      data: {
        cfOrderId,
        paymentSessionId,
        amount: validated.amount,
        currency: validated.currency || 'INR',
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
