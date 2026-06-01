/**
 * Payment Webhook API Route
 * Handles Cashfree webhook callbacks for fee payment status updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import { verifyCashfreeWebhook } from '@/lib/utils/payment-gateway';
import { decryptCredential } from '@/lib/utils/encrypt-credentials';
import { revalidatePath } from 'next/cache';

interface CashfreeWebhookPayload {
  type: string;
  data: {
    order: {
      order_id: string;
      order_amount: number;
      order_currency: string;
      order_tags?: Record<string, string>;
    };
    payment: {
      cf_payment_id: string;
      payment_status: string;
      payment_amount: number;
      payment_method?: string;
      payment_message?: string;
      bank_reference?: string;
    };
    refund?: {
      cf_refund_id: string;
      refund_id: string;
      refund_amount: number;
      refund_status: string;
    };
  };
}

export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'fee-payment-webhook' });
}

/**
 * POST /api/payments/webhook
 * Handle Cashfree webhook callbacks for school fee payments
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-webhook-signature');
    const timestamp = req.headers.get('x-webhook-timestamp');

    if (!signature || !timestamp) {
      console.error('Webhook signature or timestamp missing');
      return NextResponse.json(
        { success: false, message: 'Signature or timestamp missing' },
        { status: 400 }
      );
    }

    // Parse payload first (untrusted) to extract schoolId for credential lookup
    let payload: CashfreeWebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
    }

    const schoolId = payload.data?.order?.order_tags?.schoolId;
    if (!schoolId) {
      console.error('[webhook] Missing schoolId in order_tags');
      return NextResponse.json(
        { success: false, message: 'Missing schoolId in order tags' },
        { status: 400 }
      );
    }

    // Look up this school's webhook secret for signature verification
    const settings = await db.schoolSettings.findUnique({
      where: { schoolId },
      select: { cashfreeWebhookEncrypted: true },
    });

    if (!settings?.cashfreeWebhookEncrypted) {
      console.error(`[webhook] No Cashfree webhook secret configured for school: ${schoolId}`);
      return NextResponse.json(
        { success: false, message: 'Payment gateway not configured for this school' },
        { status: 400 }
      );
    }

    const webhookSecret = decryptCredential(settings.cashfreeWebhookEncrypted);
    const isValid = verifyCashfreeWebhook(body, signature, timestamp, webhookSecret);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { success: false, message: 'Invalid signature' },
        { status: 400 }
      );
    }
    const eventType = payload.type;
    const { order, payment, refund } = payload.data;

    console.log(`Processing webhook event: ${eventType} for order: ${order?.order_id}`);

    switch (eventType) {
      case 'PAYMENT_SUCCESS_WEBHOOK':
        await handlePaymentSuccess(order, payment);
        break;

      case 'PAYMENT_FAILED_WEBHOOK':
      case 'PAYMENT_USER_DROPPED_WEBHOOK':
        await handlePaymentFailure(order, payment);
        break;

      case 'REFUND_SUCCESS_WEBHOOK':
        if (refund) await handleRefund(payment, refund);
        break;

      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    return NextResponse.json({ success: true, message: 'Webhook processed successfully' });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { success: false, message: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(
  order: CashfreeWebhookPayload['data']['order'],
  payment: CashfreeWebhookPayload['data']['payment']
) {
  const cfPaymentId = payment.cf_payment_id;
  const orderId = order.order_id;
  // Cashfree amount is in INR (rupees)
  const amount = payment.payment_amount;

  const existingPayment = await db.feePayment.findFirst({
    where: { transactionId: cfPaymentId }
  });

  if (existingPayment) {
    if (existingPayment.status !== PaymentStatus.COMPLETED) {
      await db.feePayment.update({
        where: { id: existingPayment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          remarks: `Payment captured via webhook. Order: ${orderId}`,
        }
      });
    }
  } else {
    // Extract studentId and feeStructureId from order_id pattern: FEE-{timestamp}-{childIdSlice}
    // The full student/fee info is embedded in order tags if present
    const tags = order.order_tags || {};
    const studentId = tags.studentId;
    const feeStructureId = tags.feeStructureId;

    if (!studentId || !feeStructureId) {
      console.error('[webhook] Missing required order tags (studentId/feeStructureId)', { tags });
      throw new Error('Missing required order tags: studentId and feeStructureId are required');
    }

    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { schoolId: true }
    });

    if (!student) {
      console.error(`Student not found for payment: ${studentId}`);
      throw new Error('Student not found for payment processing');
    }

    const receiptNumber = `RCP-${Date.now()}-${studentId.slice(-6)}`;

    await db.feePayment.create({
      data: {
        studentId,
        feeStructureId,
        schoolId: student.schoolId,
        amount,
        paidAmount: amount,
        balance: 0,
        paymentDate: new Date(),
        paymentMethod: PaymentMethod.ONLINE_PAYMENT,
        transactionId: cfPaymentId,
        receiptNumber,
        status: PaymentStatus.COMPLETED,
        remarks: `Payment captured via webhook. Order: ${orderId}`,
      }
    });
  }

  revalidatePath('/parent/fees');
  revalidatePath('/parent/fees/overview');
  revalidatePath('/parent/fees/history');
}

async function handlePaymentFailure(
  order: CashfreeWebhookPayload['data']['order'],
  payment: CashfreeWebhookPayload['data']['payment']
) {
  const cfPaymentId = payment.cf_payment_id;
  const errorDescription = payment.payment_message || 'Payment failed';

  const existingPayment = await db.feePayment.findFirst({
    where: { transactionId: cfPaymentId }
  });

  if (existingPayment) {
    await db.feePayment.update({
      where: { id: existingPayment.id },
      data: {
        status: PaymentStatus.FAILED,
        remarks: `Payment failed: ${errorDescription}. Order: ${order.order_id}`,
      }
    });
  }

  revalidatePath('/parent/fees');
  revalidatePath('/parent/fees/overview');
  revalidatePath('/parent/fees/history');
}

async function handleRefund(
  payment: CashfreeWebhookPayload['data']['payment'],
  refund: NonNullable<CashfreeWebhookPayload['data']['refund']>
) {
  const cfPaymentId = payment.cf_payment_id;
  const refundedAmount = refund.refund_amount;

  const existingPayment = await db.feePayment.findFirst({
    where: { transactionId: cfPaymentId }
  });

  if (existingPayment) {
    await db.feePayment.update({
      where: { id: existingPayment.id },
      data: {
        status: PaymentStatus.REFUNDED,
        remarks: `Payment refunded: ₹${refundedAmount}`,
      }
    });
  }

  revalidatePath('/parent/fees');
  revalidatePath('/parent/fees/overview');
  revalidatePath('/parent/fees/history');
}
