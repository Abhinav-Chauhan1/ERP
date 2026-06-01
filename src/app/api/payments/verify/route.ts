/**
 * Payment Verification API Route
 * Verifies Cashfree payment status and updates fee payment record
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import { verifyCashfreePayment, getSchoolCashfreeInstance } from '@/lib/utils/payment-gateway';
import { verifyPaymentSchema } from '@/lib/schemaValidation/parent-fee-schemas';
import { verifyCsrfToken } from '@/lib/utils/csrf';
import { rateLimitMiddleware, RateLimitPresets } from '@/lib/utils/rate-limit';
import { getCurrentParent } from '@/lib/utils/payment-helpers';
import { getSchoolCashfreeCredentials } from '@/lib/actions/paymentConfigActions';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

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
 * POST /api/payments/verify
 * Verify Cashfree payment status and record the fee payment
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

    const validated = verifyPaymentSchema.parse(body);

    const hasAccess = await verifyParentChildRelationship(parent.id, validated.childId);

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Use school's own Cashfree credentials for verification
    const schoolCreds = await getSchoolCashfreeCredentials(schoolId);
    if (!schoolCreds) {
      return NextResponse.json(
        { success: false, message: 'Payment gateway not configured for this school' },
        { status: 400 }
      );
    }
    const schoolCashfree = getSchoolCashfreeInstance(schoolCreds.appId, schoolCreds.secretKey);

    // CRITICAL: Verify payment via Cashfree server-to-server — never trust client-submitted status
    const verifyResult = await verifyCashfreePayment(validated.cfOrderId, schoolCashfree);

    if (!verifyResult.success) {
      return NextResponse.json(
        { success: false, message: `Payment not completed. Status: ${verifyResult.status}` },
        { status: 400 }
      );
    }

    // Idempotency: check if payment already recorded for this cfOrderId
    const existingPayment = await db.feePayment.findFirst({
      where: {
        transactionId: verifyResult.cfPaymentId,
        schoolId,
      }
    });

    let payment;

    if (existingPayment) {
      if (existingPayment.status === PaymentStatus.COMPLETED) {
        return NextResponse.json({
          success: true,
          data: {
            paymentId: existingPayment.id,
            receiptNumber: existingPayment.receiptNumber,
            status: existingPayment.status,
            amount: existingPayment.amount,
          },
          message: 'Payment already verified'
        });
      }

      payment = await db.feePayment.update({
        where: { id: existingPayment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          transactionId: verifyResult.cfPaymentId,
          remarks: `Online payment verified. Cashfree order: ${validated.cfOrderId}`,
        }
      });
    } else {
      const receiptNumber = `RCP-${Date.now()}-${validated.childId.slice(-6)}`;
      const verifiedAmount = verifyResult.amount; // Cashfree returns rupees directly

      payment = await db.feePayment.create({
        data: {
          studentId: validated.childId,
          feeStructureId: validated.feeStructureId,
          schoolId,
          amount: verifiedAmount,
          paidAmount: verifiedAmount,
          balance: 0,
          paymentDate: new Date(),
          paymentMethod: PaymentMethod.ONLINE_PAYMENT,
          transactionId: verifyResult.cfPaymentId,
          receiptNumber,
          status: PaymentStatus.COMPLETED,
          remarks: `Online payment verified. Cashfree order: ${validated.cfOrderId}`,
        }
      });
    }

    revalidatePath('/parent/fees');
    revalidatePath('/parent/fees/overview');
    revalidatePath('/parent/fees/history');

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        receiptNumber: payment.receiptNumber,
        status: payment.status,
        amount: payment.amount,
        paidAmount: payment.paidAmount,
        paymentDate: payment.paymentDate,
      },
      message: 'Payment verified successfully'
    });

  } catch (error) {
    console.error('Error verifying payment:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid request data', errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
