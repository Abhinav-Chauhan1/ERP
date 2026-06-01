import { prisma } from '@/lib/db';
import {
  EnhancedSubscription,
  Invoice,
  Payment,
  SubscriptionStatus,
  InvoiceStatus,
  PaymentStatus,
  Prisma,
  PlanType
} from '@prisma/client';
import { createCashfreeOrder, refundCashfreePayment } from '@/lib/utils/payment-gateway';
import { calcMonthlyBill, PLAN_LIMITS, type PlanType as PlanTypeConfig } from '@/lib/config/plan-features';

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
  metadata?: Record<string, string>;
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

export interface SubscriptionFilters {
  schoolId?: string;
  status?: string;
  planId?: string;
  limit: number;
  offset: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ValidatedSubscriptionFilters {
  schoolId?: string;
  status?: string;
  planId?: string;
  limit: number;
  offset: number;
  search?: string;
  sortBy: 'createdAt' | 'updatedAt' | 'status' | 'currentPeriodStart' | 'currentPeriodEnd';
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedSubscriptions {
  data: EnhancedSubscription[];
  total: number;
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

export interface SubscriptionCheckoutResult {
  paymentSessionId: string;
  cfOrderId: string;
}

/**
 * Query Builder for subscription queries
 */
class SubscriptionQueryBuilder {
  private where: Prisma.EnhancedSubscriptionWhereInput = {};
  private include: Prisma.EnhancedSubscriptionInclude = {};
  private orderBy: Prisma.EnhancedSubscriptionOrderByWithRelationInput = {};
  private pagination: { take?: number; skip?: number } = {};

  filterBySchool(schoolId?: string): this {
    if (schoolId) {
      this.where.schoolId = schoolId;
    }
    return this;
  }

  filterByStatus(status?: string): this {
    if (status && Object.values(SubscriptionStatus).includes(status as SubscriptionStatus)) {
      this.where.status = status as SubscriptionStatus;
    }
    return this;
  }

  filterByPlan(planId?: string): this {
    if (planId) {
      this.where.planId = planId;
    }
    return this;
  }

  search(searchTerm?: string): this {
    if (searchTerm) {
      this.where.OR = [
        { school: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { school: { schoolCode: { contains: searchTerm, mode: 'insensitive' } } },
        { plan: { name: { contains: searchTerm, mode: 'insensitive' } } }
      ];
    }
    return this;
  }

  includeRelations(): this {
    this.include = {
      plan: {
        select: {
          id: true,
          name: true,
          amount: true,
          currency: true,
          interval: true,
          features: true
        }
      },
      school: {
        select: {
          id: true,
          name: true,
          schoolCode: true,
          email: true,
          status: true
        }
      },
      payments: {
        select: {
          id: true,
          amount: true,
          status: true,
          processedAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    };
    return this;
  }

  sort(sortBy: string = 'createdAt', sortOrder: 'asc' | 'desc' = 'desc'): this {
    this.orderBy = { [sortBy]: sortOrder };
    return this;
  }

  paginate(limit: number, offset: number): this {
    this.pagination = { take: limit, skip: offset };
    return this;
  }

  build() {
    return {
      where: this.where,
      include: this.include,
      orderBy: this.orderBy,
      ...this.pagination
    };
  }
}

export class BillingService {
  private static readonly ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'status', 'currentPeriodStart', 'currentPeriodEnd'] as const;
  private static readonly MAX_LIMIT = 1000;
  private static readonly DEFAULT_LIMIT = 50;

  /**
   * Get subscriptions with filtering and pagination
   */
  async getSubscriptions(filters: SubscriptionFilters): Promise<PaginatedSubscriptions> {
    try {
      const validatedFilters = this.validateSubscriptionFilters(filters);
      const queryBuilder = new SubscriptionQueryBuilder()
        .filterBySchool(validatedFilters.schoolId)
        .filterByStatus(validatedFilters.status)
        .filterByPlan(validatedFilters.planId)
        .search(validatedFilters.search)
        .includeRelations()
        .sort(validatedFilters.sortBy, validatedFilters.sortOrder)
        .paginate(validatedFilters.limit, validatedFilters.offset);

      const query = queryBuilder.build();

      const [subscriptions, total] = await Promise.all([
        prisma.enhancedSubscription.findMany(query),
        prisma.enhancedSubscription.count({ where: query.where })
      ]);

      return { data: subscriptions, total };
    } catch (error) {
      console.error('Error getting subscriptions:', error);
      throw new Error(`Failed to get subscriptions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate subscription filters
   */
  private validateSubscriptionFilters(filters: SubscriptionFilters): ValidatedSubscriptionFilters {
    const errors: string[] = [];

    const limit = Math.min(filters.limit || BillingService.DEFAULT_LIMIT, BillingService.MAX_LIMIT);
    const offset = Math.max(filters.offset || 0, 0);

    if (filters.limit && (filters.limit <= 0 || filters.limit > BillingService.MAX_LIMIT)) {
      errors.push(`Limit must be between 1 and ${BillingService.MAX_LIMIT}`);
    }

    if (filters.offset && filters.offset < 0) {
      errors.push('Offset must be non-negative');
    }

    const sortBy = BillingService.ALLOWED_SORT_FIELDS.includes(filters.sortBy as any)
      ? filters.sortBy as typeof BillingService.ALLOWED_SORT_FIELDS[number]
      : 'createdAt';

    const sortOrder = ['asc', 'desc'].includes(filters.sortOrder || 'desc')
      ? filters.sortOrder as 'asc' | 'desc'
      : 'desc';

    if (filters.status && !Object.values(SubscriptionStatus).includes(filters.status as SubscriptionStatus)) {
      errors.push(`Invalid status: ${filters.status}. Valid values: ${Object.values(SubscriptionStatus).join(', ')}`);
    }

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(', ')}`);
    }

    return { ...filters, limit, offset, sortBy, sortOrder };
  }

  /**
   * Create a subscription checkout session via Cashfree
   */
  async createSubscriptionCheckout(
    schoolId: string,
    planId: string,
    studentCount: number
  ): Promise<SubscriptionCheckoutResult> {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error(`Subscription plan not found: ${planId}`);

    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new Error(`School not found: ${schoolId}`);

    const amount = calcMonthlyBill(plan.name as PlanTypeConfig, studentCount);
    const orderId = `SUB-${schoolId.slice(-8)}-${Date.now()}`;
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000';

    // Mark any existing active subscription as cancel-at-period-end before a new checkout
    await prisma.enhancedSubscription.updateMany({
      where: { schoolId, status: SubscriptionStatus.ACTIVE, cancelAtPeriodEnd: false },
      data: { cancelAtPeriodEnd: true },
    });

    // Cashfree requires a 10-digit phone (no spaces, no country code prefix)
    const rawPhone = (school.phone || '').replace(/\D/g, ''); // strip all non-digits
    const customerPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : '9999999999';

    const { cfOrderId, paymentSessionId } = await createCashfreeOrder({
      orderId,
      amount,
      currency: 'INR',
      customerName: school.name,
      customerEmail: school.email || `${school.schoolCode}@school.com`,
      customerPhone,
      returnUrl: `${baseUrl}/admin/settings/billing/success?cfOrderId=${orderId}&planId=${planId}`,
      notifyUrl: `${baseUrl}/api/subscription/webhook`,
    });

    // Record a pending Payment for this checkout
    await prisma.payment.create({
      data: {
        subscriptionId: await this.getOrCreatePendingSubscriptionId(schoolId, planId, studentCount),
        amount,
        currency: 'INR',
        status: PaymentStatus.PENDING,
        cfPaymentId: null,
        paymentSessionId: cfOrderId, // store cfOrderId here for webhook lookup
      }
    });

    return { paymentSessionId, cfOrderId };
  }

  private async getOrCreatePendingSubscriptionId(
    schoolId: string,
    planId: string,
    studentCount: number
  ): Promise<string> {
    // Reuse an existing incomplete/past-due sub for the SAME plan; otherwise create fresh
    const existing = await prisma.enhancedSubscription.findFirst({
      where: { schoolId, planId, status: { in: [SubscriptionStatus.INCOMPLETE, SubscriptionStatus.PAST_DUE] } },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      await prisma.enhancedSubscription.update({
        where: { id: existing.id },
        data: { studentCount },
      });
      return existing.id;
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const sub = await prisma.enhancedSubscription.create({
      data: {
        schoolId,
        planId,
        status: SubscriptionStatus.INCOMPLETE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        studentCount,
        metadata: {},
      }
    });
    return sub.id;
  }

  /**
   * Activate a subscription after successful Cashfree payment
   */
  async activateSubscriptionFromPayment(cfOrderId: string, cfPaymentId: string): Promise<void> {
    // Find pending Payment by cfOrderId stored in paymentSessionId field
    const payment = await prisma.payment.findFirst({
      where: { paymentSessionId: cfOrderId },
      include: {
        subscription: {
          include: { plan: true, school: { select: { id: true, _count: { select: { students: true } } } } }
        }
      }
    });

    if (!payment) {
      throw new Error(`No pending payment found for cfOrderId: ${cfOrderId}`);
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    const liveStudentCount = payment.subscription.school._count.students;

    await Promise.all([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          cfPaymentId,
          processedAt: now,
        }
      }),
      prisma.enhancedSubscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cfOrderRef: cfOrderId,
          studentCount: liveStudentCount,
        }
      }),
      prisma.school.update({
        where: { id: payment.subscription.schoolId },
        data: { plan: payment.subscription.plan.name as PlanType }
      }),
    ]);

    // Generate a paid invoice for this subscription cycle
    await this.generateInvoice(payment.subscriptionId, payment.amount);
  }

  /**
   * Update an existing subscription
   */
  async updateSubscription(subscriptionId: string, changes: SubscriptionUpdate): Promise<EnhancedSubscription> {
    try {
      const subscription = await prisma.enhancedSubscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true, school: true }
      });

      if (!subscription) {
        throw new Error(`Subscription not found: ${subscriptionId}`);
      }

      const updateParams: any = {};

      if (changes.planId) {
        const newPlan = await prisma.subscriptionPlan.findUnique({ where: { id: changes.planId } });
        if (!newPlan) throw new Error(`Invalid plan: ${changes.planId}`);
        updateParams.planId = changes.planId;
      }

      if (changes.cancelAtPeriodEnd !== undefined) {
        updateParams.cancelAtPeriodEnd = changes.cancelAtPeriodEnd;
      }

      if (changes.metadata) {
        updateParams.metadata = {
          ...subscription.metadata as Record<string, string>,
          ...changes.metadata
        };
      }

      const updatedSubscription = await prisma.enhancedSubscription.update({
        where: { id: subscriptionId },
        data: updateParams,
        include: { plan: true, school: true }
      });

      return updatedSubscription;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error(`Failed to update subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate an invoice record for a subscription cycle.
   * Pass the actual payment amount (INR) — the plan.amount field is deprecated.
   */
  async generateInvoice(subscriptionId: string, amount: number): Promise<Invoice> {
    const subscription = await prisma.enhancedSubscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true, school: true }
    });

    if (!subscription) {
      throw new Error(`Subscription not found: ${subscriptionId}`);
    }

    // Build a human-readable sequential invoice number
    const year = new Date().getFullYear();
    const existingCount = await prisma.invoice.count({
      where: { subscriptionId: { not: undefined } }
    });
    const invoiceNumber = `INV-${year}-${String(existingCount + 1).padStart(4, '0')}`;

    return prisma.invoice.create({
      data: {
        subscriptionId: subscription.id,
        invoiceNumber,
        amount,
        currency: 'INR',
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
        dueDate: new Date(),
        metadata: {
          schoolName: subscription.school.name,
          planName: subscription.plan.name,
          studentCount: subscription.studentCount,
        },
      },
    });
  }

  /**
   * Get payment history for a school
   */
  async getPaymentHistory(schoolId: string): Promise<PaymentHistory[]> {
    try {
      const payments = await prisma.payment.findMany({
        where: { subscription: { schoolId } },
        include: {
          subscription: {
            include: {
              plan: true,
              school: { select: { name: true, schoolCode: true } }
            }
          }
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
        subscription: payment.subscription,
      }));
    } catch (error) {
      console.error('Error getting payment history:', error);
      throw new Error(`Failed to get payment history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process a refund via Cashfree
   */
  async processRefund(paymentId: string, amount?: number): Promise<RefundResult> {
    try {
      const payment = await prisma.payment.findUnique({ where: { id: paymentId } });

      if (!payment) throw new Error(`Payment not found: ${paymentId}`);
      if (!payment.cfPaymentId) throw new Error(`Cashfree payment ID not found for payment: ${paymentId}`);
      if (!payment.paymentSessionId) throw new Error(`Order ID not found for payment: ${paymentId}`);

      const { refundId, status } = await refundCashfreePayment(
        payment.paymentSessionId,
        payment.cfPaymentId,
        amount ?? payment.amount,
      );

      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: amount && amount < payment.amount ? PaymentStatus.PARTIAL : PaymentStatus.REFUNDED,
        }
      });

      return { id: refundId, amount: amount || payment.amount, status };
    } catch (error) {
      console.error('Error processing refund:', error);
      throw new Error(`Failed to process refund: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllPayments(): Promise<Payment[]> {
    try {
      return await prisma.payment.findMany({ orderBy: { createdAt: 'desc' } });
    } catch (error) {
      console.error('Error getting all payments:', error);
      throw new Error('Failed to get payments');
    }
  }

  async getSubscription(id: string): Promise<EnhancedSubscription | null> {
    try {
      return await prisma.enhancedSubscription.findUnique({
        where: { id },
        include: { plan: true, school: true }
      });
    } catch (error) {
      console.error('Error getting subscription:', error);
      throw new Error('Failed to get subscription');
    }
  }
}

export const billingService = new BillingService();
