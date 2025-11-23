/**
 * Payment Verification API Route
 * Verifies Razorpay payment signature and updates payment status
 * Requirements: 1.3, 10.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { UserRole, PaymentStatus, PaymentMethod } from '@prisma/client';
import { verifyPaymentSignature } from '@/lib/utils/payment-gateway';
import { verifyPaymentSchema } from '@/lib/schemaValidation/parent-fee-schemas';
import { verifyCsrfToken } from '@/lib/utils/csrf';
import { rateLimitMiddleware, RateLimitPresets } from '@/lib/utils/rate-limit';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

/**
 * Helper function to get current parent
 */
async function getCurrentParent() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    return null;
  }
  
  const dbUser = await db.user.findUnique({
    where: {
      clerkId: clerkUser.id
    }
  });
  
  if (!dbUser || dbUser.role !== UserRole.PARENT) {
    return null;
  }
  
  const parent = await db.parent.findUnique({
    where: {
      userId: dbUser.id
    }
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
 * POST /api/payments/verify
 * Verify payment signature and update payment status
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
    
    const validated = verifyPaymentSchema.parse(body);

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

    // Verify payment signature
    const isValidSignature = verifyPaymentSignature({
      orderId: validated.orderId,
      paymentId: validated.paymentId,
      signature: validated.signature,
    });

    if (!isValidSignature) {
      return NextResponse.json(
        { success: false, message: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Check if payment already exists with this transaction ID
    const existingPayment = await db.feePayment.findFirst({
      where: {
        transactionId: validated.paymentId
      }
    });

    let payment;

    if (existingPayment) {
      // Update existing payment if not already completed
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
          transactionId: validated.paymentId,
          remarks: `Online payment verified. Order ID: ${validated.orderId}`,
        }
      });
    } else {
      // Create new payment record
      const receiptNumber = `RCP-${Date.now()}-${validated.childId.slice(-6)}`;

      payment = await db.feePayment.create({
        data: {
          studentId: validated.childId,
          feeStructureId: validated.feeStructureId,
          amount: validated.amount,
          paidAmount: validated.amount,
          balance: 0,
          paymentDate: new Date(),
          paymentMethod: PaymentMethod.ONLINE_PAYMENT,
          transactionId: validated.paymentId,
          receiptNumber,
          status: PaymentStatus.COMPLETED,
          remarks: `Online payment verified. Order ID: ${validated.orderId}`,
        }
      });
    }

    // Revalidate fee pages
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
