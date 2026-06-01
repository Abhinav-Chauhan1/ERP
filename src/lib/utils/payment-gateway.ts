import { Cashfree, CFEnvironment, CreateOrderRequest } from 'cashfree-pg';
import crypto from 'crypto';

let cashfreeInstance: Cashfree | null = null;

function getCashfreeEnv(): CFEnvironment {
  return process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production'
    ? CFEnvironment.PRODUCTION
    : CFEnvironment.SANDBOX;
}

// Platform-level instance (for SaaS subscription billing)
function getCashfreeInstance(): Cashfree {
  if (!cashfreeInstance) {
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    if (!appId || !secretKey) {
      throw new Error('Cashfree credentials not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY.');
    }

    cashfreeInstance = new Cashfree(getCashfreeEnv(), appId, secretKey);
  }

  return cashfreeInstance;
}

// Per-school instance (for school fee payments)
export function getSchoolCashfreeInstance(appId: string, secretKey: string): Cashfree {
  return new Cashfree(getCashfreeEnv(), appId, secretKey);
}

export interface CreateCashfreeOrderParams {
  orderId: string;
  amount: number; // Amount in INR (rupees, not paise)
  currency?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
  notifyUrl: string;
  tags?: Record<string, string>;
}

export interface CashfreeOrderResult {
  cfOrderId: string;
  paymentSessionId: string;
}

export async function createCashfreeOrder(
  params: CreateCashfreeOrderParams,
  cashfree?: Cashfree
): Promise<CashfreeOrderResult> {
  cashfree = cashfree ?? getCashfreeInstance();

  const customerId = `cust_${params.orderId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  const request: CreateOrderRequest = {
    order_id: params.orderId,
    order_amount: params.amount,
    order_currency: params.currency || 'INR',
    customer_details: {
      customer_id: customerId,
      customer_name: params.customerName,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone,
    },
    order_meta: {
      return_url: params.returnUrl,
      notify_url: params.notifyUrl,
    },
    ...(params.tags ? { order_tags: params.tags } : {}),
  };

  const response = await cashfree.PGCreateOrder(request);
  const order = response.data;

  if (!order.payment_session_id || !order.order_id) {
    throw new Error('Cashfree order creation failed: missing payment_session_id or order_id');
  }

  return {
    cfOrderId: order.order_id,
    paymentSessionId: order.payment_session_id,
  };
}

export interface CashfreePaymentVerifyResult {
  success: boolean;
  amount: number;
  cfPaymentId: string;
  status: string;
}

export async function verifyCashfreePayment(
  cfOrderId: string,
  cashfree?: Cashfree
): Promise<CashfreePaymentVerifyResult> {
  cashfree = cashfree ?? getCashfreeInstance();

  const orderResponse = await cashfree.PGFetchOrder(cfOrderId);
  const order = orderResponse.data;

  if (order.order_status !== 'PAID') {
    return {
      success: false,
      amount: order.order_amount || 0,
      cfPaymentId: '',
      status: order.order_status || 'UNKNOWN',
    };
  }

  // Fetch payment details to get cf_payment_id
  const paymentsResponse = await cashfree.PGOrderFetchPayments(cfOrderId);
  const payments = paymentsResponse.data;
  const successfulPayment = payments.find(p => p.payment_status === 'SUCCESS');

  return {
    success: true,
    amount: order.order_amount || 0,
    cfPaymentId: successfulPayment?.cf_payment_id || '',
    status: 'PAID',
  };
}

export function verifyCashfreeWebhook(
  rawBody: string,
  signature: string,
  timestamp: string,
  secret?: string
): boolean {
  try {
    // Cashfree signs webhooks with the same Secret Key used for API calls
    const resolvedSecret = secret ?? process.env.CASHFREE_SECRET_KEY ?? '';
    const signedPayload = timestamp + rawBody;
    const expectedSignature = crypto
      .createHmac('sha256', resolvedSecret)
      .update(signedPayload)
      .digest('base64');
    return expectedSignature === signature;
  } catch {
    return false;
  }
}

export interface CashfreeRefundResult {
  refundId: string;
  status: string;
}

export async function refundCashfreePayment(
  cfOrderId: string,
  cfPaymentId: string,
  amount?: number,
  refundNote?: string
): Promise<CashfreeRefundResult> {
  const cashfree = getCashfreeInstance();

  const refundId = `refund_${Date.now()}`;
  const response = await cashfree.PGOrderCreateRefund(cfOrderId, {
    refund_amount: amount || 0,
    refund_id: refundId,
    refund_note: refundNote || 'Refund requested',
  });
  const refund = response.data;

  return {
    refundId: refund.cf_refund_id || refundId,
    status: refund.refund_status || 'PENDING',
  };
}
