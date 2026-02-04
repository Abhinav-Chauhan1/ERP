import Razorpay from 'razorpay';
import { prisma } from '@/lib/db';
import { 
  EnhancedSubscription, 
  SubscriptionPlan, 
  Invoice, 
  Payment, 
  SubscriptionStatus, 
  InvoiceStatus, 
  PaymentStatus 
} from '@prisma/client';

// Types
export interface SubscriptionData {
  schoolId: string;
  planId: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}

export interface PaymentData {
  amount: number;
  currency?: string;
  description?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface PaymentResult {
  id: string;
  status: string;
  amount: number;
  currency: string;
  orderId?: string;
  receipt?: string;
}

export interface RefundResult {
  id: string;
  amount: number;
  status: string;
  reason?: string;
}

export interface SubscriptionUpdate {
  planId?: string;
  cancelAtPeriodEnd?: boolean;
  metadata?: Record<string, string>;
}

export interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  processedAt: Date | null;
  paymentMethod: string | null;
  failureReason: string | null;
  createdAt: Date;
}

// Error classes for better error handling
export class BillingError extends Error {
  constructor(message: string, public code: string, public statusCode: number = 500) {
    super(message);
    this.name = 'BillingError';
  }
}

export class ValidationError extends BillingError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class NotFoundError extends BillingError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', 404);
  }
}

// Payment Gateway Adapter Pattern
interface PaymentGateway {
  createCustomer(data: any): Promise<any>;
  createPlan(data: any): Promise<any>;
  createSubscription(data: any): Promise<any>;
  updateSubscription(id: string, data: any): Promise<any>;
  createOrder(data: any): Promise<any>;
  processRefund(paymentId: string, amount?: number): Promise<any>;
}

class RazorpayAdapter implements PaymentGateway {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }

  async createCustomer(data: { name: string; email: string; contact: string; notes: Record<string, string> }) {
    return this.razorpay.customers.create(data);
  }

  async createPlan(data: { period: 'daily' | 'weekly' | 'monthly' | 'yearly'; interval: number; item: any; notes: Record<string, string> }) {
    return this.razorpay.plans.create(data);
  }

  async createSubscription(data: any) {
    return this.razorpay.subscriptions.create(data);
  }

  async updateSubscription(id: string, data: any) {
    return this.razorpay.subscriptions.update(id, data);
  }

  async createOrder(data: any) {
    return this.razorpay.orders.create(data);
  }

  async processRefund(paymentId: string, amount?: number) {
    const refundData: any = { payment_id: paymentId };
    if (amount) refundData.amount = amount;
    return this.razorpay.payments.refund(paymentId, refundData);
  }
}

// Repository Pattern for Database Operations
class SubscriptionRepository {
  async findById(id: string) {
    return prisma.enhancedSubscription.findUnique({
      where: { id },
      include: { plan: true, school: true }
    });
  }

  async create(data: any) {
    return prisma.enhancedSubscription.create({
      data,
      include: { plan: true, school: true }
    });
  }

  async update(id: string, data: any) {
    return prisma.enhancedSubscription.update({
      where: { id },
      data,
      include: { plan: true, school: true }
    });
  }

  async findByRazorpayId(razorpaySubscriptionId: string) {
    return prisma.enhancedSubscription.findFirst({
      where: { razorpaySubscriptionId }
    });
  }
}

class SchoolRepository {
  async findById(id: string) {
    return prisma.school.findUnique({ where: { id } });
  }

  async updateRazorpayCustomerId(id: string, razorpayCustomerId: string) {
    return prisma.school.update({
      where: { id },
      data: { razorpayCustomerId }
    });
  }
}

class PlanRepository {
  async findById(id: string) {
    return prisma.subscriptionPlan.findUnique({ where: { id } });
  }

  async updateRazorpayPlanId(id: string, razorpayPlanId: string) {
    return prisma.subscriptionPlan.update({
      where: { id },
      data: { razorpayPlanId }
    });
  }
}

// Main Service Class
export class BillingService {
  private paymentGateway: PaymentGateway;
  private subscriptionRepo: SubscriptionRepository;
  private schoolRepo: SchoolRepository;
  private planRepo: PlanRepository;

  constructor() {
    this.paymentGateway = new RazorpayAdapter();
    this.subscriptionRepo = new SubscriptionRepository();
    this.schoolRepo = new SchoolRepository();
    this.planRepo = new PlanRepository();
  }

  /**
   * Create a new subscription
   */
  async createSubscription(data: SubscriptionData): Promise<EnhancedSubscription> {
    try {
      // Validate input
      await this.validateSubscriptionData(data);

      // Get plan and school
      const [plan, school] = await Promise.all([
        this.planRepo.findById(data.planId),
        this.schoolRepo.findById(data.schoolId)
      ]);

      if (!plan) throw new NotFoundError('Subscription plan', data.planId);
      if (!school) throw new NotFoundError('School', data.schoolId);

      // Ensure payment gateway resources exist
      const [razorpayPlanId, razorpayCustomerId] = await Promise.all([
        this.ensureRazorpayPlan(plan),
        this.ensureRazorpayCustomer(school)
      ]);

      // Create subscription in payment gateway
      const razorpaySubscription = await this.createRazorpaySubscription({
        planId: razorpayPlanId,
        customerId: razorpayCustomerId,
        trialDays: data.trialDays,
        metadata: data.metadata
      });

      // Create local subscription record
      const subscription = await this.subscriptionRepo.create({
        schoolId: data.schoolId,
        planId: data.planId,
        razorpaySubscriptionId: razorpaySubscription.id,
        status: this.mapRazorpayStatusToLocal(razorpaySubscription.status),
        ...this.calculatePeriodDates(plan, data.trialDays),
        metadata: data.metadata || {},
      });

      return subscription;
    } catch (error) {
      throw this.handleError(error, 'Failed to create subscription');
    }
  }

  /**
   * Update an existing subscription
   */
  async updateSubscription(subscriptionId: string, changes: SubscriptionUpdate): Promise<EnhancedSubscription> {
    try {
      const subscription = await this.subscriptionRepo.findById(subscriptionId);
      if (!subscription) throw new NotFoundError('Subscription', subscriptionId);

      // Update in payment gateway if needed
      if (changes.planId || changes.cancelAtPeriodEnd) {
        await this.updateRazorpaySubscription(subscription.razorpaySubscriptionId!, changes);
      }

      // Update local record
      const updateData: any = {};
      if (changes.planId) updateData.planId = changes.planId;
      if (changes.cancelAtPeriodEnd !== undefined) updateData.cancelAtPeriodEnd = changes.cancelAtPeriodEnd;
      if (changes.metadata) updateData.metadata = { ...subscription.metadata as object, ...changes.metadata };

      return this.subscriptionRepo.update(subscriptionId, updateData);
    } catch (error) {
      throw this.handleError(error, 'Failed to update subscription');
    }
  }

  /**
   * Process a payment
   */
  async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
    try {
      const order = await this.paymentGateway.createOrder({
        amount: paymentData.amount,
        currency: paymentData.currency || 'INR',
        receipt: paymentData.receipt,
        notes: paymentData.notes || {}
      });

      return {
        id: order.id,
        status: order.status,
        amount: order.amount,
        currency: order.currency,
        orderId: order.id,
        receipt: order.receipt
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to process payment');
    }
  }

  /**
   * Get payment history for a school
   */
  async getPaymentHistory(schoolId: string): Promise<PaymentHistory[]> {
    try {
      const payments = await prisma.payment.findMany({
        where: {
          subscription: { schoolId }
        },
        orderBy: { createdAt: 'desc' }
      });

      return payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        processedAt: payment.processedAt,
        paymentMethod: payment.paymentMethod,
        failureReason: payment.failureReason,
        createdAt: payment.createdAt,
      }));
    } catch (error) {
      throw this.handleError(error, 'Failed to get payment history');
    }
  }

  /**
   * Process a refund
   */
  async processRefund(paymentId: string, amount?: number): Promise<RefundResult> {
    try {
      const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
      if (!payment) throw new NotFoundError('Payment', paymentId);
      if (!payment.razorpayPaymentId) throw new ValidationError('Razorpay payment ID not found');

      const refund = await this.paymentGateway.processRefund(payment.razorpayPaymentId, amount);

      // Update payment status
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: amount && amount < payment.amount ? PaymentStatus.PARTIAL : PaymentStatus.REFUNDED,
        }
      });

      return {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
        reason: refund.notes?.reason
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to process refund');
    }
  }

  // Private helper methods

  private async validateSubscriptionData(data: SubscriptionData): Promise<void> {
    if (!data.schoolId) throw new ValidationError('School ID is required');
    if (!data.planId) throw new ValidationError('Plan ID is required');
    if (data.trialDays && data.trialDays < 0) throw new ValidationError('Trial days must be positive');
  }

  private async ensureRazorpayPlan(plan: any): Promise<string> {
    if (plan.razorpayPlanId) return plan.razorpayPlanId;

    const razorpayPlan = await this.paymentGateway.createPlan({
      period: plan.interval === 'month' ? 'monthly' : 'yearly',
      interval: 1,
      item: {
        name: plan.name,
        amount: plan.amount,
        currency: plan.currency.toUpperCase(),
        description: plan.description || `${plan.name} subscription plan`
      },
      notes: { planId: plan.id }
    });

    await this.planRepo.updateRazorpayPlanId(plan.id, razorpayPlan.id);
    return razorpayPlan.id;
  }

  private async ensureRazorpayCustomer(school: any): Promise<string> {
    if (school.razorpayCustomerId) return school.razorpayCustomerId;

    const customer = await this.paymentGateway.createCustomer({
      name: school.name,
      email: school.email || `${school.schoolCode}@school.com`,
      contact: school.phone || '',
      notes: {
        schoolId: school.id,
        schoolCode: school.schoolCode
      }
    });

    await this.schoolRepo.updateRazorpayCustomerId(school.id, customer.id);
    return customer.id;
  }

  private async createRazorpaySubscription(data: {
    planId: string;
    customerId: string;
    trialDays?: number;
    metadata?: Record<string, string>;
  }) {
    const subscriptionParams: any = {
      plan_id: data.planId,
      customer_id: data.customerId,
      quantity: 1,
      notes: data.metadata || {}
    };

    if (data.trialDays && data.trialDays > 0) {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + data.trialDays);
      subscriptionParams.start_at = Math.floor(trialEnd.getTime() / 1000);
    }

    return this.paymentGateway.createSubscription(subscriptionParams);
  }

  private async updateRazorpaySubscription(razorpaySubscriptionId: string, changes: SubscriptionUpdate) {
    const updateData: any = {};
    
    if (changes.cancelAtPeriodEnd !== undefined) {
      updateData.cancel_at_cycle_end = changes.cancelAtPeriodEnd ? 1 : 0;
    }

    if (Object.keys(updateData).length > 0) {
      await this.paymentGateway.updateSubscription(razorpaySubscriptionId, updateData);
    }
  }

  private calculatePeriodDates(plan: any, trialDays?: number) {
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    
    if (plan.interval === 'month') {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    } else {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    }

    return {
      currentPeriodStart,
      currentPeriodEnd,
      trialEnd: trialDays ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000) : null,
    };
  }

  private mapRazorpayStatusToLocal(razorpayStatus: string): SubscriptionStatus {
    switch (razorpayStatus) {
      case 'created':
      case 'authenticated':
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'past_due':
        return SubscriptionStatus.PAST_DUE;
      case 'cancelled':
        return SubscriptionStatus.CANCELED;
      case 'completed':
        return SubscriptionStatus.ACTIVE;
      case 'expired':
        return SubscriptionStatus.CANCELED;
      default:
        return SubscriptionStatus.INCOMPLETE;
    }
  }

  private handleError(error: any, defaultMessage: string): never {
    if (error instanceof BillingError) {
      throw error;
    }

    console.error(`${defaultMessage}:`, error);
    
    if (error.error?.code) {
      // Razorpay specific error
      throw new BillingError(
        error.error.description || defaultMessage,
        error.error.code,
        error.statusCode || 500
      );
    }

    throw new BillingError(
      defaultMessage,
      'UNKNOWN_ERROR',
      500
    );
  }
}

export const billingService = new BillingService();