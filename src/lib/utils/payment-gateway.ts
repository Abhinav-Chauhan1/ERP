/**
 * Payment Gateway Integration Utility
 * Handles Razorpay payment processing, order creation, and signature verification
 * Requirements: 1.3
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

/**
 * Interface for payment order creation
 */
export interface CreatePaymentOrderParams {
  amount: number; // Amount in INR
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

/**
 * Interface for payment order response
 */
export interface PaymentOrder {
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
}

/**
 * Interface for payment verification
 */
export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

/**
 * Create a payment order in Razorpay
 * This generates an order ID that will be used for payment processing
 * 
 * @param params - Payment order parameters
 * @returns Payment order details
 */
export async function createPaymentOrder(
  params: CreatePaymentOrderParams
): Promise<PaymentOrder> {
  try {
    // Convert amount to paise (Razorpay expects amount in smallest currency unit)
    const amountInPaise = Math.round(params.amount * 100);
    
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: params.currency || 'INR',
      receipt: params.receipt,
      notes: params.notes || {},
      payment_capture: true, // Auto capture payment
    });
    
    return order as PaymentOrder;
  } catch (error) {
    console.error('Error creating payment order:', error);
    throw new Error('Failed to create payment order');
  }
}

/**
 * Verify payment signature from Razorpay
 * This ensures the payment callback is authentic and not tampered with
 * 
 * @param params - Payment verification parameters
 * @returns Boolean indicating if signature is valid
 */
export function verifyPaymentSignature(params: VerifyPaymentParams): boolean {
  try {
    const { orderId, paymentId, signature } = params;
    
    // Generate expected signature
    const text = `${orderId}|${paymentId}`;
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex');
    
    // Compare signatures
    return generatedSignature === signature;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
}

/**
 * Verify webhook signature from Razorpay
 * This ensures webhook callbacks are authentic
 * 
 * @param body - Webhook request body
 * @param signature - Signature from webhook header
 * @returns Boolean indicating if webhook is valid
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Fetch payment details from Razorpay
 * 
 * @param paymentId - Razorpay payment ID
 * @returns Payment details
 */
export async function fetchPaymentDetails(paymentId: string) {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw new Error('Failed to fetch payment details');
  }
}

/**
 * Fetch order details from Razorpay
 * 
 * @param orderId - Razorpay order ID
 * @returns Order details
 */
export async function fetchOrderDetails(orderId: string) {
  try {
    const order = await razorpay.orders.fetch(orderId);
    return order;
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw new Error('Failed to fetch order details');
  }
}

/**
 * Refund a payment
 * 
 * @param paymentId - Razorpay payment ID
 * @param amount - Amount to refund in INR (optional, full refund if not specified)
 * @returns Refund details
 */
export async function refundPayment(
  paymentId: string,
  amount?: number
) {
  try {
    const refundData: any = {
      payment_id: paymentId,
    };
    
    if (amount) {
      // Convert to paise
      refundData.amount = Math.round(amount * 100);
    }
    
    const refund = await razorpay.payments.refund(paymentId, refundData);
    return refund;
  } catch (error) {
    console.error('Error processing refund:', error);
    throw new Error('Failed to process refund');
  }
}

/**
 * Get Razorpay public key for client-side integration
 * 
 * @returns Razorpay key ID
 */
export function getRazorpayKeyId(): string {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
}
