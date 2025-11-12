/**
 * Payment Webhook API Route
 * Handles Razorpay webhook callbacks for payment status updates
 * Requirements: 1.3, 10.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import { verifyWebhookSignature } from '@/lib/utils/payment-gateway';
import { revalidatePath } from 'next/cache';

/**
 * Webhook event types from Razorpay
 */
type WebhookEvent = 
  | 'payment.authorized'
  | 'payment.captured'
  | 'payment.failed'
  | 'order.paid'
  | 'refund.created'
  | 'refund.processed';

/**
 * Webhook payload structure
 */
interface WebhookPayload {
  entity: string;
  account_id: string;
  event: WebhookEvent;
  contains: string[];
  payload: {
    payment: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        invoice_id: string | null;
        international: boolean;
        method: string;
        amount_refunded: number;
        refund_status: string | null;
        captured: boolean;
        description: string | null;
        card_id: string | null;
        bank: string | null;
        wallet: string | null;
        vpa: string | null;
        email: string;
        contact: string;
        notes: Record<string, string>;
        fee: number;
        tax: number;
        error_code: string | null;
        error_description: string | null;
        error_source: string | null;
        error_step: string | null;
        error_reason: string | null;
        created_at: number;
      };
    };
    order?: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        amount_paid: number;
        amount_due: number;
        currency: string;
        receipt: string;
        status: string;
        attempts: number;
        notes: Record<string, string>;
        created_at: number;
      };
    };
  };
  created_at: number;
}

/**
 * POST /api/payments/webhook
 * Handle Razorpay webhook callbacks
 */
export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('Webhook signature missing');
      return NextResponse.json(
        { success: false, message: 'Signature missing' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(body, signature);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { success: false, message: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Parse webhook payload
    const payload: WebhookPayload = JSON.parse(body);
    const event = payload.event;
    const paymentEntity = payload.payload.payment?.entity;

    if (!paymentEntity) {
      console.error('Payment entity missing in webhook payload');
      return NextResponse.json(
        { success: false, message: 'Invalid payload' },
        { status: 400 }
      );
    }

    console.log(`Processing webhook event: ${event} for payment: ${paymentEntity.id}`);

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
      case 'order.paid':
        await handlePaymentSuccess(paymentEntity);
        break;

      case 'payment.failed':
        await handlePaymentFailure(paymentEntity);
        break;

      case 'refund.created':
      case 'refund.processed':
        await handleRefund(paymentEntity);
        break;

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { success: false, message: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentEntity: any) {
  try {
    const paymentId = paymentEntity.id;
    const orderId = paymentEntity.order_id;
    const amount = paymentEntity.amount / 100; // Convert from paise to INR
    const notes = paymentEntity.notes || {};

    // Check if payment already exists
    const existingPayment = await db.feePayment.findFirst({
      where: {
        transactionId: paymentId
      }
    });

    if (existingPayment) {
      // Update existing payment
      if (existingPayment.status !== PaymentStatus.COMPLETED) {
        await db.feePayment.update({
          where: { id: existingPayment.id },
          data: {
            status: PaymentStatus.COMPLETED,
            remarks: `Payment captured via webhook. Order ID: ${orderId}`,
          }
        });

        console.log(`Updated existing payment: ${existingPayment.id}`);
      }
    } else {
      // Create new payment record if notes contain required information
      if (notes.studentId && notes.feeStructureId) {
        const receiptNumber = `RCP-${Date.now()}-${notes.studentId.slice(-6)}`;

        await db.feePayment.create({
          data: {
            studentId: notes.studentId,
            feeStructureId: notes.feeStructureId,
            amount: amount,
            paidAmount: amount,
            balance: 0,
            paymentDate: new Date(paymentEntity.created_at * 1000),
            paymentMethod: PaymentMethod.ONLINE_PAYMENT,
            transactionId: paymentId,
            receiptNumber,
            status: PaymentStatus.COMPLETED,
            remarks: `Payment captured via webhook. Order ID: ${orderId}`,
          }
        });

        console.log(`Created new payment record for student: ${notes.studentId}`);
      }
    }

    // Revalidate fee pages
    revalidatePath('/parent/fees');
    revalidatePath('/parent/fees/overview');
    revalidatePath('/parent/fees/history');

  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(paymentEntity: any) {
  try {
    const paymentId = paymentEntity.id;
    const orderId = paymentEntity.order_id;
    const errorDescription = paymentEntity.error_description || 'Payment failed';

    // Check if payment exists
    const existingPayment = await db.feePayment.findFirst({
      where: {
        transactionId: paymentId
      }
    });

    if (existingPayment) {
      // Update payment status to failed
      await db.feePayment.update({
        where: { id: existingPayment.id },
        data: {
          status: PaymentStatus.FAILED,
          remarks: `Payment failed: ${errorDescription}. Order ID: ${orderId}`,
        }
      });

      console.log(`Updated payment to failed: ${existingPayment.id}`);
    }

    // Revalidate fee pages
    revalidatePath('/parent/fees');
    revalidatePath('/parent/fees/overview');
    revalidatePath('/parent/fees/history');

  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

/**
 * Handle refund
 */
async function handleRefund(paymentEntity: any) {
  try {
    const paymentId = paymentEntity.id;
    const refundedAmount = paymentEntity.amount_refunded / 100; // Convert from paise to INR

    // Find payment by transaction ID
    const existingPayment = await db.feePayment.findFirst({
      where: {
        transactionId: paymentId
      }
    });

    if (existingPayment) {
      // Update payment status to refunded
      await db.feePayment.update({
        where: { id: existingPayment.id },
        data: {
          status: PaymentStatus.REFUNDED,
          remarks: `Payment refunded: ₹${refundedAmount}`,
        }
      });

      console.log(`Updated payment to refunded: ${existingPayment.id}`);
    }

    // Revalidate fee pages
    revalidatePath('/parent/fees');
    revalidatePath('/parent/fees/overview');
    revalidatePath('/parent/fees/history');

  } catch (error) {
    console.error('Error handling refund:', error);
    throw error;
  }
}
