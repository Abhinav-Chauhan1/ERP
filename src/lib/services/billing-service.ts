import Razorpay from 'razorpay';
import { prisma } from '@/lib/db';
import { 
  EnhancedSubscription, 
  SubscriptionPlan, 
  Invoice, 
  Payment, 
  SubscriptionStatus, 
  InvoiceStatus, 
  PaymentStatus,
  Prisma
} from '@prisma/client';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

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

    // Validate pagination
    const limit = Math.min(filters.limit || BillingService.DEFAULT_LIMIT, BillingService.MAX_LIMIT);
    const offset = Math.max(filters.offset || 0, 0);

    if (filters.limit && (filters.limit <= 0 || filters.limit > BillingService.MAX_LIMIT)) {
      errors.push(`Limit must be between 1 and ${BillingService.MAX_LIMIT}`);
    }

    if (filters.offset && filters.offset < 0) {
      errors.push('Offset must be non-negative');
    }

    // Validate sort parameters
    const sortBy = BillingService.ALLOWED_SORT_FIELDS.includes(filters.sortBy as any) 
      ? filters.sortBy as typeof BillingService.ALLOWED_SORT_FIELDS[number]
      : 'createdAt';

    const sortOrder = ['asc', 'desc'].includes(filters.sortOrder || 'desc') 
      ? filters.sortOrder as 'asc' | 'desc' 
      : 'desc';

    // Validate status if provided
    if (filters.status && !Object.values(SubscriptionStatus).includes(filters.status as SubscriptionStatus)) {
      errors.push(`Invalid status: ${filters.status}. Valid values: ${Object.values(SubscriptionStatus).join(', ')}`);
    }

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(', ')}`);
    }

    return {
      ...filters,
      limit,
      offset,
      sortBy,
      sortOrder
    };
  }

  /**
   * Create a new subscription with Razorpay integration
   */
  async createSubscription(data: SubscriptionData): Promise<EnhancedSubscription> {
    try {
      // Get the subscription plan
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: data.planId }
      });

      if (!plan) {
        throw new Error(`Subscription plan not found: ${data.planId}`);
      }

      // Get the school
      const school = await prisma.school.findUnique({
        where: { id: data.schoolId }
      });

      if (!school) {
        throw new Error(`School not found: ${data.schoolId}`);
      }

      // Create Razorpay subscription plan if not exists
      let razorpayPlanId = plan.razorpayPlanId;
      
      if (!razorpayPlanId) {
        const razorpayPlan = await razorpay.plans.create({
          period: plan.interval === 'month' ? 'monthly' : 'yearly',
          interval: 1,
          item: {
            name: plan.name,
            amount: plan.amount,
            currency: plan.currency.toUpperCase(),
            description: plan.description || `${plan.name} subscription plan`
          },
          notes: {
            planId: data.planId,
            schoolId: data.schoolId
          }
        });
        
        razorpayPlanId = razorpayPlan.id;
        
        // Update plan with Razorpay plan ID
        await prisma.subscriptionPlan.update({
          where: { id: data.planId },
          data: { razorpayPlanId }
        });
      }

      // Create Razorpay customer if not exists
      let razorpayCustomerId = school.razorpayCustomerId;
      
      if (!razorpayCustomerId) {
        const customer = await razorpay.customers.create({
          name: school.name,
          email: school.email || `${school.schoolCode}@school.com`,
          contact: school.phone || '',
          notes: {
            schoolId: data.schoolId,
            schoolCode: school.schoolCode
          }
        });
        
        razorpayCustomerId = customer.id;
        
        // Update school with Razorpay customer ID
        await prisma.school.update({
          where: { id: data.schoolId },
          data: { razorpayCustomerId }
        });
      }

      // Create Razorpay subscription
      const subscriptionParams: any = {
        plan_id: razorpayPlanId,
        customer_id: razorpayCustomerId,
        quantity: 1,
        notes: {
          schoolId: data.schoolId,
          planId: data.planId,
          ...data.metadata
        }
      };

      if (data.trialDays && data.trialDays > 0) {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + data.trialDays);
        subscriptionParams.start_at = Math.floor(trialEnd.getTime() / 1000);
      }

      const razorpaySubscription = await razorpay.subscriptions.create(subscriptionParams);

      // Calculate period dates
      const currentPeriodStart = new Date();
      const currentPeriodEnd = new Date();
      if (plan.interval === 'month') {
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      } else {
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      }

      // Create local subscription record
      const subscription = await prisma.enhancedSubscription.create({
        data: {
          schoolId: data.schoolId,
          planId: data.planId,
          razorpaySubscriptionId: razorpaySubscription.id,
          status: this.mapRazorpayStatusToLocal(razorpaySubscription.status),
          currentPeriodStart,
          currentPeriodEnd,
          trialEnd: data.trialDays ? new Date(Date.now() + data.trialDays * 24 * 60 * 60 * 1000) : null,
          metadata: data.metadata || {},
        },
        include: {
          plan: true,
          school: true
        }
      });

      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error(`Failed to create subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

      if (!subscription.razorpaySubscriptionId) {
        throw new Error(`Razorpay subscription ID not found for subscription: ${subscriptionId}`);
      }

      const updateParams: any = {};

      // Handle plan change
      if (changes.planId) {
        const newPlan = await prisma.subscriptionPlan.findUnique({
          where: { id: changes.planId }
        });

        if (!newPlan) {
          throw new Error(`Invalid plan: ${changes.planId}`);
        }

        // For Razorpay, we need to cancel current subscription and create new one
        // This is a simplified approach - in production, you might want to handle this differently
        await razorpay.subscriptions.cancel(subscription.razorpaySubscriptionId, {
          cancel_at_cycle_end: 1
        });

        updateParams.planId = changes.planId;
      }

      // Handle cancellation
      if (changes.cancelAtPeriodEnd !== undefined) {
        if (changes.cancelAtPeriodEnd) {
          await razorpay.subscriptions.cancel(subscription.razorpaySubscriptionId, {
            cancel_at_cycle_end: 1
          });
        }
        updateParams.cancelAtPeriodEnd = changes.cancelAtPeriodEnd;
      }

      // Handle metadata
      if (changes.metadata) {
        updateParams.metadata = {
          ...subscription.metadata as Record<string, string>,
          ...changes.metadata
        };
      }

      // Update local subscription record
      const updatedSubscription = await prisma.enhancedSubscription.update({
        where: { id: subscriptionId },
        data: updateParams,
        include: {
          plan: true,
          school: true
        }
      });

      return updatedSubscription;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error(`Failed to update subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process a payment using Razorpay
   */
  async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
    try {
      const order = await razorpay.orders.create({
        amount: paymentData.amount,
        currency: paymentData.currency || 'INR',
        receipt: paymentData.receipt || `receipt_${Date.now()}`,
        notes: paymentData.notes || {}
      });

      return {
        id: order.id,
        status: order.status,
        amount: order.amount,
        currency: order.currency,
        orderId: order.id,
        receipt: order.receipt,
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      throw new Error(`Failed to process payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate an invoice for a subscription
   */
  async generateInvoice(subscriptionId: string): Promise<Invoice> {
    try {
      const subscription = await prisma.enhancedSubscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true, school: true }
      });

      if (!subscription) {
        throw new Error(`Subscription not found: ${subscriptionId}`);
      }

      // For Razorpay, we create invoices manually or use their invoice API
      const invoiceData = {
        type: 'invoice',
        description: `Invoice for ${subscription.plan.name} subscription`,
        partial_payment: false,
        customer: {
          name: subscription.school.name,
          email: subscription.school.email || `${subscription.school.schoolCode}@school.com`,
          contact: subscription.school.phone || ''
        },
        line_items: [{
          name: subscription.plan.name,
          description: subscription.plan.description || `${subscription.plan.name} subscription`,
          amount: subscription.plan.amount,
          currency: subscription.plan.currency.toUpperCase(),
          quantity: 1
        }],
        sms_notify: 1,
        email_notify: 1,
        expire_by: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days from now
        notes: {
          subscriptionId: subscription.id,
          schoolId: subscription.schoolId,
          planId: subscription.planId
        }
      };

      const razorpayInvoice = await razorpay.invoices.create(invoiceData);

      // Create local invoice record
      const invoice = await prisma.invoice.create({
        data: {
          subscriptionId: subscription.id,
          razorpayInvoiceId: razorpayInvoice.id,
          amount: subscription.plan.amount,
          currency: subscription.plan.currency,
          status: this.mapRazorpayInvoiceStatusToLocal(razorpayInvoice.status),
          dueDate: new Date(razorpayInvoice.expire_by * 1000),
          metadata: {
            razorpayInvoiceNumber: razorpayInvoice.invoice_number,
            razorpayShortUrl: razorpayInvoice.short_url,
          },
        },
      });

      return invoice;
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw new Error(`Failed to generate invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle Razorpay webhooks
   */
  async handleWebhook(webhookData: { event: string; payload: { payment?: { entity: any }; subscription?: { entity: any }; invoice?: { entity: any } } }): Promise<void> {
    try {
      switch (webhookData.event) {
        case 'payment.captured':
          if (webhookData.payload.payment) {
            await this.handlePaymentCaptured(webhookData.payload.payment.entity);
          }
          break;
        case 'payment.failed':
          if (webhookData.payload.payment) {
            await this.handlePaymentFailed(webhookData.payload.payment.entity);
          }
          break;
        case 'subscription.charged':
          if (webhookData.payload.subscription) {
            await this.handleSubscriptionCharged(webhookData.payload.subscription.entity);
          }
          break;
        case 'subscription.cancelled':
          if (webhookData.payload.subscription) {
            await this.handleSubscriptionCancelled(webhookData.payload.subscription.entity);
          }
          break;
        case 'invoice.paid':
          if (webhookData.payload.invoice) {
            await this.handleInvoicePaid(webhookData.payload.invoice.entity);
          }
          break;
        default:
          console.log(`Unhandled webhook event type: ${webhookData.event}`);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw new Error(`Failed to handle webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get payment history for a school
   */
  async getPaymentHistory(schoolId: string): Promise<PaymentHistory[]> {
    try {
      const payments = await prisma.payment.findMany({
        where: {
          subscription: {
            schoolId: schoolId
          }
        },
        include: {
          subscription: {
            include: {
              plan: true,
              school: {
                select: {
                  name: true,
                  schoolCode: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
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
        // Now we have access to subscription and plan data without additional queries
        subscription: payment.subscription,
      }));
    } catch (error) {
      console.error('Error getting payment history:', error);
      throw new Error(`Failed to get payment history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process a refund
   */
  async processRefund(paymentId: string, amount?: number): Promise<RefundResult> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId }
      });

      if (!payment) {
        throw new Error(`Payment not found: ${paymentId}`);
      }

      if (!payment.razorpayPaymentId) {
        throw new Error(`Razorpay payment ID not found for payment: ${paymentId}`);
      }

      const refundParams: any = {
        payment_id: payment.razorpayPaymentId,
      };

      if (amount) {
        refundParams.amount = amount;
      }

      const refund = await razorpay.payments.refund(payment.razorpayPaymentId, refundParams);

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
        reason: refund.notes?.reason || undefined,
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      throw new Error(`Failed to process refund: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods

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
      case 'halted':
        return SubscriptionStatus.PAUSED;
      default:
        return SubscriptionStatus.INCOMPLETE;
    }
  }

  private mapRazorpayInvoiceStatusToLocal(razorpayStatus: string | null): InvoiceStatus {
    switch (razorpayStatus) {
      case 'draft':
        return InvoiceStatus.DRAFT;
      case 'issued':
        return InvoiceStatus.OPEN;
      case 'paid':
        return InvoiceStatus.PAID;
      case 'cancelled':
        return InvoiceStatus.VOID;
      case 'expired':
        return InvoiceStatus.UNCOLLECTIBLE;
      default:
        return InvoiceStatus.DRAFT;
    }
  }

  private async handlePaymentCaptured(payment: any): Promise<void> {
    const subscription = await prisma.enhancedSubscription.findFirst({
      where: { 
        OR: [
          { razorpaySubscriptionId: payment.subscription_id },
          { school: { razorpayCustomerId: payment.customer_id } }
        ]
      }
    });

    if (subscription) {
      // Create payment record
      await prisma.payment.create({
        data: {
          subscriptionId: subscription.id,
          razorpayPaymentId: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: PaymentStatus.COMPLETED,
          paymentMethod: payment.method,
          processedAt: new Date(),
        }
      });

      // Update related invoice if exists
      await prisma.invoice.updateMany({
        where: { 
          subscriptionId: subscription.id,
          status: InvoiceStatus.OPEN
        },
        data: {
          status: InvoiceStatus.PAID,
          paidAt: new Date(),
        }
      });
    }
  }

  private async handlePaymentFailed(payment: any): Promise<void> {
    const subscription = await prisma.enhancedSubscription.findFirst({
      where: { 
        OR: [
          { razorpaySubscriptionId: payment.subscription_id },
          { school: { razorpayCustomerId: payment.customer_id } }
        ]
      }
    });

    if (subscription) {
      // Create failed payment record
      await prisma.payment.create({
        data: {
          subscriptionId: subscription.id,
          razorpayPaymentId: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: PaymentStatus.FAILED,
          paymentMethod: payment.method,
          failureReason: payment.error_description || 'Payment failed',
        }
      });
    }
  }

  private async handleSubscriptionCharged(subscription: any): Promise<void> {
    await prisma.enhancedSubscription.updateMany({
      where: { razorpaySubscriptionId: subscription.id },
      data: {
        status: this.mapRazorpayStatusToLocal(subscription.status),
      }
    });
  }

  private async handleSubscriptionCancelled(subscription: any): Promise<void> {
    await prisma.enhancedSubscription.updateMany({
      where: { razorpaySubscriptionId: subscription.id },
      data: {
        status: SubscriptionStatus.CANCELED,
      }
    });
  }

  private async handleInvoicePaid(invoice: any): Promise<void> {
    await prisma.invoice.updateMany({
      where: { razorpayInvoiceId: invoice.id },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
      }
    });
  }

  // Additional methods for super admin
  async getAllPayments(): Promise<Payment[]> {
    try {
      return await prisma.payment.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Error getting all payments:', error);
      throw new Error('Failed to get payments');
    }
  }

  async getSubscription(id: string): Promise<EnhancedSubscription | null> {
    try {
      return await prisma.enhancedSubscription.findUnique({
        where: { id },
        include: {
          plan: true,
          school: true
        }
      });
    } catch (error) {
      console.error('Error getting subscription:', error);
      throw new Error('Failed to get subscription');
    }
  }
}

export const billingService = new BillingService();