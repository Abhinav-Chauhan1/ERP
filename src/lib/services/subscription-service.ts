import { prisma } from '@/lib/db';
import { 
  EnhancedSubscription, 
  SubscriptionPlan, 
  SubscriptionStatus,
  InvoiceStatus,
  PaymentStatus
} from '@prisma/client';
import { billingService } from './billing-service';

export interface SubscriptionUpgradeData {
  subscriptionId: string;
  newPlanId: string;
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
  effectiveDate?: Date;
}

export interface SubscriptionDowngradeData {
  subscriptionId: string;
  newPlanId: string;
  effectiveDate?: Date;
  applyAtPeriodEnd?: boolean;
}

export interface TrialConversionData {
  subscriptionId: string;
  planId?: string;
  paymentMethodId?: string;
}

export interface RenewalResult {
  subscription: EnhancedSubscription;
  invoice?: any;
  renewed: boolean;
  reason?: string;
}

export interface ProrationCalculation {
  currentPlanAmount: number;
  newPlanAmount: number;
  unusedAmount: number;
  prorationAmount: number;
  effectiveDate: Date;
  nextBillingDate: Date;
}

export class SubscriptionService {
  /**
   * Upgrade a subscription to a higher-tier plan with proration
   */
  async upgradeSubscription(data: SubscriptionUpgradeData): Promise<EnhancedSubscription> {
    try {
      const subscription = await prisma.enhancedSubscription.findUnique({
        where: { id: data.subscriptionId },
        include: { plan: true, school: true }
      });

      if (!subscription) {
        throw new Error(`Subscription not found: ${data.subscriptionId}`);
      }

      const newPlan = await prisma.subscriptionPlan.findUnique({
        where: { id: data.newPlanId }
      });

      if (!newPlan) {
        throw new Error(`Plan not found: ${data.newPlanId}`);
      }

      // Validate upgrade (new plan should be higher tier)
      if (newPlan.amount <= subscription.plan.amount) {
        throw new Error('Upgrade requires a higher-tier plan');
      }

      // Calculate proration
      const proration = this.calculateProration(
        subscription,
        newPlan,
        data.effectiveDate || new Date()
      );

      // Create proration invoice if needed
      let prorationInvoice = null;
      if (proration.prorationAmount > 0 && data.prorationBehavior !== 'none') {
        prorationInvoice = await this.createProrationInvoice(
          subscription,
          newPlan,
          proration
        );
      }

      // Update subscription with new plan
      const updatedSubscription = await prisma.enhancedSubscription.update({
        where: { id: data.subscriptionId },
        data: {
          planId: data.newPlanId,
          metadata: {
            ...subscription.metadata as Record<string, any>,
            lastUpgrade: new Date().toISOString(),
            previousPlanId: subscription.planId,
            prorationAmount: proration.prorationAmount,
          }
        },
        include: { plan: true, school: true }
      });

      // Update external subscription if exists
      if (subscription.razorpaySubscriptionId) {
        await this.updateExternalSubscription(subscription.razorpaySubscriptionId, newPlan);
      }

      return updatedSubscription;
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      throw new Error(`Failed to upgrade subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Downgrade a subscription to a lower-tier plan
   */
  async downgradeSubscription(data: SubscriptionDowngradeData): Promise<EnhancedSubscription> {
    try {
      const subscription = await prisma.enhancedSubscription.findUnique({
        where: { id: data.subscriptionId },
        include: { plan: true, school: true }
      });

      if (!subscription) {
        throw new Error(`Subscription not found: ${data.subscriptionId}`);
      }

      const newPlan = await prisma.subscriptionPlan.findUnique({
        where: { id: data.newPlanId }
      });

      if (!newPlan) {
        throw new Error(`Plan not found: ${data.newPlanId}`);
      }

      // Validate downgrade (new plan should be lower tier)
      if (newPlan.amount >= subscription.plan.amount) {
        throw new Error('Downgrade requires a lower-tier plan');
      }

      const updateData: any = {
        metadata: {
          ...subscription.metadata as Record<string, any>,
          lastDowngrade: new Date().toISOString(),
          previousPlanId: subscription.planId,
        }
      };

      // Apply downgrade immediately or at period end
      if (data.applyAtPeriodEnd) {
        updateData.metadata.pendingDowngrade = {
          planId: data.newPlanId,
          effectiveDate: subscription.currentPeriodEnd.toISOString(),
        };
      } else {
        updateData.planId = data.newPlanId;
        
        // Calculate credit for unused portion
        const credit = this.calculateDowngradeCredit(subscription, newPlan, data.effectiveDate || new Date());
        if (credit > 0) {
          updateData.metadata.creditAmount = credit;
        }
      }

      const updatedSubscription = await prisma.enhancedSubscription.update({
        where: { id: data.subscriptionId },
        data: updateData,
        include: { plan: true, school: true }
      });

      // Update external subscription if exists and not applying at period end
      if (subscription.razorpaySubscriptionId && !data.applyAtPeriodEnd) {
        await this.updateExternalSubscription(subscription.razorpaySubscriptionId, newPlan);
      }

      return updatedSubscription;
    } catch (error) {
      console.error('Error downgrading subscription:', error);
      throw new Error(`Failed to downgrade subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle automatic renewal for subscriptions
   */
  async processAutomaticRenewal(subscriptionId: string): Promise<RenewalResult> {
    try {
      const subscription = await prisma.enhancedSubscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true, school: true }
      });

      if (!subscription) {
        throw new Error(`Subscription not found: ${subscriptionId}`);
      }

      // Check if subscription is eligible for renewal
      if (subscription.status === SubscriptionStatus.CANCELED) {
        return {
          subscription,
          renewed: false,
          reason: 'Subscription is cancelled'
        };
      }

      if (subscription.cancelAtPeriodEnd) {
        // Cancel the subscription instead of renewing
        const cancelledSubscription = await this.cancelSubscriptionInternal(subscriptionId);
        return {
          subscription: cancelledSubscription,
          renewed: false,
          reason: 'Subscription set to cancel at period end'
        };
      }

      // Calculate new period dates
      const newPeriodStart = subscription.currentPeriodEnd;
      const newPeriodEnd = new Date(newPeriodStart);
      
      if (subscription.plan.interval === 'month') {
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
      } else if (subscription.plan.interval === 'year') {
        newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
      }

      // Create renewal invoice
      const renewalInvoice = await billingService.generateInvoice(subscriptionId);

      // Update subscription period
      const renewedSubscription = await prisma.enhancedSubscription.update({
        where: { id: subscriptionId },
        data: {
          currentPeriodStart: newPeriodStart,
          currentPeriodEnd: newPeriodEnd,
          status: SubscriptionStatus.ACTIVE,
          metadata: {
            ...subscription.metadata as Record<string, any>,
            lastRenewal: new Date().toISOString(),
            renewalCount: ((subscription.metadata as any)?.renewalCount || 0) + 1,
          }
        },
        include: { plan: true, school: true }
      });

      return {
        subscription: renewedSubscription,
        invoice: renewalInvoice,
        renewed: true
      };
    } catch (error) {
      console.error('Error processing automatic renewal:', error);
      
      // Mark subscription as past due if renewal fails
      const subscription = await prisma.enhancedSubscription.update({
        where: { id: subscriptionId },
        data: { status: SubscriptionStatus.PAST_DUE },
        include: { plan: true, school: true }
      });

      return {
        subscription,
        renewed: false,
        reason: `Renewal failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Handle subscription expiration
   */
  async processExpiration(subscriptionId: string): Promise<EnhancedSubscription> {
    try {
      const subscription = await prisma.enhancedSubscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true, school: true }
      });

      if (!subscription) {
        throw new Error(`Subscription not found: ${subscriptionId}`);
      }

      // Check if subscription has expired
      const now = new Date();
      if (subscription.currentPeriodEnd > now) {
        throw new Error('Subscription has not expired yet');
      }

      // Update subscription status to expired/cancelled
      const expiredSubscription = await prisma.enhancedSubscription.update({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.CANCELED,
          metadata: {
            ...subscription.metadata as Record<string, any>,
            expiredAt: now.toISOString(),
            expirationReason: 'Automatic expiration due to non-payment or end of term',
          }
        },
        include: { plan: true, school: true }
      });

      return expiredSubscription;
    } catch (error) {
      console.error('Error processing expiration:', error);
      throw new Error(`Failed to process expiration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert trial subscription to paid subscription
   */
  async convertTrialToPaid(data: TrialConversionData): Promise<EnhancedSubscription> {
    try {
      const subscription = await prisma.enhancedSubscription.findUnique({
        where: { id: data.subscriptionId },
        include: { plan: true, school: true }
      });

      if (!subscription) {
        throw new Error(`Subscription not found: ${data.subscriptionId}`);
      }

      // Check if subscription is in trial
      if (!subscription.trialEnd || subscription.trialEnd < new Date()) {
        throw new Error('Subscription is not in trial period');
      }

      const updateData: any = {
        trialEnd: null,
        status: SubscriptionStatus.ACTIVE,
        metadata: {
          ...subscription.metadata as Record<string, any>,
          trialConvertedAt: new Date().toISOString(),
          originalTrialEnd: subscription.trialEnd.toISOString(),
        }
      };

      // Update plan if specified
      if (data.planId && data.planId !== subscription.planId) {
        const newPlan = await prisma.subscriptionPlan.findUnique({
          where: { id: data.planId }
        });

        if (!newPlan) {
          throw new Error(`Plan not found: ${data.planId}`);
        }

        updateData.planId = data.planId;
        updateData.metadata.trialConversionPlanChange = {
          fromPlan: subscription.planId,
          toPlan: data.planId,
        };
      }

      const convertedSubscription = await prisma.enhancedSubscription.update({
        where: { id: data.subscriptionId },
        data: updateData,
        include: { plan: true, school: true }
      });

      // Generate first paid invoice
      await billingService.generateInvoice(data.subscriptionId);

      return convertedSubscription;
    } catch (error) {
      console.error('Error converting trial to paid:', error);
      throw new Error(`Failed to convert trial: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check and process trial expiration
   */
  async processTrialExpiration(subscriptionId: string): Promise<EnhancedSubscription> {
    try {
      const subscription = await prisma.enhancedSubscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true, school: true }
      });

      if (!subscription) {
        throw new Error(`Subscription not found: ${subscriptionId}`);
      }

      // Check if trial has expired
      if (!subscription.trialEnd || subscription.trialEnd > new Date()) {
        throw new Error('Trial has not expired yet');
      }

      // Update subscription status based on payment method availability
      const hasPaymentMethod = subscription.school.razorpayCustomerId;
      
      const expiredSubscription = await prisma.enhancedSubscription.update({
        where: { id: subscriptionId },
        data: {
          status: hasPaymentMethod ? SubscriptionStatus.PAST_DUE : SubscriptionStatus.INCOMPLETE,
          metadata: {
            ...subscription.metadata as Record<string, any>,
            trialExpiredAt: new Date().toISOString(),
            trialExpirationAction: hasPaymentMethod ? 'moved_to_past_due' : 'marked_incomplete',
          }
        },
        include: { plan: true, school: true }
      });

      return expiredSubscription;
    } catch (error) {
      console.error('Error processing trial expiration:', error);
      throw new Error(`Failed to process trial expiration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get subscription with lifecycle information
   */
  async getSubscriptionWithLifecycle(subscriptionId: string) {
    const subscription = await prisma.enhancedSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: true,
        school: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!subscription) {
      throw new Error(`Subscription not found: ${subscriptionId}`);
    }

    // Calculate lifecycle information
    const now = new Date();
    const isInTrial = subscription.trialEnd && subscription.trialEnd > now;
    const daysUntilExpiry = Math.ceil((subscription.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const trialDaysRemaining = isInTrial ? Math.ceil((subscription.trialEnd!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    return {
      ...subscription,
      lifecycle: {
        isInTrial,
        trialDaysRemaining,
        daysUntilExpiry,
        isExpired: subscription.currentPeriodEnd < now,
        canUpgrade: subscription.status === SubscriptionStatus.ACTIVE,
        canDowngrade: subscription.status === SubscriptionStatus.ACTIVE,
        canCancel: subscription.status === SubscriptionStatus.ACTIVE && !subscription.cancelAtPeriodEnd,
        nextAction: this.determineNextAction(subscription, now),
      }
    };
  }

  // Private helper methods

  private calculateProration(
    subscription: EnhancedSubscription & { plan: SubscriptionPlan },
    newPlan: SubscriptionPlan,
    effectiveDate: Date
  ): ProrationCalculation {
    const currentPeriodStart = subscription.currentPeriodStart;
    const currentPeriodEnd = subscription.currentPeriodEnd;
    const totalPeriodDays = Math.ceil((currentPeriodEnd.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
    const usedDays = Math.ceil((effectiveDate.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = totalPeriodDays - usedDays;

    const unusedAmount = Math.round((subscription.plan.amount * remainingDays) / totalPeriodDays);
    const newPeriodAmount = Math.round((newPlan.amount * remainingDays) / totalPeriodDays);
    const prorationAmount = Math.max(0, newPeriodAmount - unusedAmount);

    return {
      currentPlanAmount: subscription.plan.amount,
      newPlanAmount: newPlan.amount,
      unusedAmount,
      prorationAmount,
      effectiveDate,
      nextBillingDate: currentPeriodEnd,
    };
  }

  private calculateDowngradeCredit(
    subscription: EnhancedSubscription & { plan: SubscriptionPlan },
    newPlan: SubscriptionPlan,
    effectiveDate: Date
  ): number {
    const currentPeriodStart = subscription.currentPeriodStart;
    const currentPeriodEnd = subscription.currentPeriodEnd;
    const totalPeriodDays = Math.ceil((currentPeriodEnd.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
    const usedDays = Math.ceil((effectiveDate.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = totalPeriodDays - usedDays;

    const currentUnusedAmount = Math.round((subscription.plan.amount * remainingDays) / totalPeriodDays);
    const newPeriodAmount = Math.round((newPlan.amount * remainingDays) / totalPeriodDays);
    
    return Math.max(0, currentUnusedAmount - newPeriodAmount);
  }

  private async createProrationInvoice(
    subscription: EnhancedSubscription & { plan: SubscriptionPlan },
    newPlan: SubscriptionPlan,
    proration: ProrationCalculation
  ) {
    return await prisma.invoice.create({
      data: {
        subscriptionId: subscription.id,
        amount: proration.prorationAmount,
        currency: newPlan.currency,
        status: InvoiceStatus.OPEN,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        metadata: {
          type: 'proration',
          previousPlan: subscription.plan.name,
          newPlan: newPlan.name,
          prorationDetails: JSON.parse(JSON.stringify(proration)),
        } as any,
      },
    });
  }

  private async updateExternalSubscription(externalId: string, newPlan: SubscriptionPlan) {
    // This would integrate with external payment provider (Razorpay, Stripe, etc.)
    // For now, we'll just log the action
    console.log(`Updating external subscription ${externalId} to plan ${newPlan.id}`);
  }

  private async cancelSubscriptionInternal(subscriptionId: string): Promise<EnhancedSubscription> {
    return await prisma.enhancedSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.CANCELED,
        cancelAtPeriodEnd: false,
        metadata: {
          cancelledAt: new Date().toISOString(),
          cancellationReason: 'Automatic cancellation at period end',
        }
      },
      include: { plan: true, school: true }
    });
  }

  private determineNextAction(subscription: EnhancedSubscription, now: Date): string {
    if (subscription.trialEnd && subscription.trialEnd > now) {
      return 'trial_active';
    }
    
    if (subscription.trialEnd && subscription.trialEnd <= now && subscription.status === SubscriptionStatus.INCOMPLETE) {
      return 'trial_expired_needs_payment';
    }
    
    if (subscription.cancelAtPeriodEnd) {
      return 'will_cancel_at_period_end';
    }
    
    if (subscription.currentPeriodEnd <= now && subscription.status === SubscriptionStatus.ACTIVE) {
      return 'needs_renewal';
    }
    
    if (subscription.status === SubscriptionStatus.PAST_DUE) {
      return 'payment_failed_retry_needed';
    }
    
    return 'active';
  }

  /**
   * Cancel subscription with graceful handling
   */
  async cancelSubscription(
    subscriptionId: string, 
    options: {
      immediate?: boolean;
      reason?: string;
      refundUnused?: boolean;
      retainData?: boolean;
      retentionPeriodDays?: number;
    } = {}
  ): Promise<EnhancedSubscription> {
    try {
      const subscription = await prisma.enhancedSubscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true, school: true }
      });

      if (!subscription) {
        throw new Error(`Subscription not found: ${subscriptionId}`);
      }

      if (subscription.status === SubscriptionStatus.CANCELED) {
        throw new Error('Subscription is already cancelled');
      }

      const now = new Date();
      const cancelData: any = {
        metadata: {
          ...subscription.metadata as Record<string, any>,
          cancellationReason: options.reason || 'User requested cancellation',
          cancelledAt: now.toISOString(),
          retainData: options.retainData !== false, // Default to true
        }
      };

      if (options.immediate) {
        // Cancel immediately
        cancelData.status = SubscriptionStatus.CANCELED;
        cancelData.currentPeriodEnd = now;
        
        // Calculate refund if requested
        if (options.refundUnused) {
          const refundAmount = this.calculateCancellationRefund(subscription, now);
          if (refundAmount > 0) {
            cancelData.metadata.refundAmount = refundAmount;
            cancelData.metadata.refundStatus = 'pending';
          }
        }
      } else {
        // Cancel at period end
        cancelData.cancelAtPeriodEnd = true;
        cancelData.metadata.willCancelAt = subscription.currentPeriodEnd.toISOString();
      }

      // Set data retention policy
      if (options.retainData !== false) {
        const retentionDays = options.retentionPeriodDays || 90; // Default 90 days
        const dataRetentionEnd = new Date(now.getTime() + retentionDays * 24 * 60 * 60 * 1000);
        cancelData.metadata.dataRetentionEnd = dataRetentionEnd.toISOString();
      }

      const cancelledSubscription = await prisma.enhancedSubscription.update({
        where: { id: subscriptionId },
        data: cancelData,
        include: { plan: true, school: true }
      });

      // Cancel external subscription if exists
      if (subscription.razorpaySubscriptionId) {
        await this.cancelExternalSubscription(
          subscription.razorpaySubscriptionId, 
          options.immediate ?? false
        );
      }

      // Schedule data retention enforcement
      if (options.retainData !== false) {
        await this.scheduleDataRetentionEnforcement(subscriptionId, cancelledSubscription.metadata as any);
      }

      return cancelledSubscription;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw new Error(`Failed to cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enforce data retention policies
   */
  async enforceDataRetentionPolicy(subscriptionId: string): Promise<void> {
    try {
      const subscription = await prisma.enhancedSubscription.findUnique({
        where: { id: subscriptionId },
        include: { school: true }
      });

      if (!subscription) {
        throw new Error(`Subscription not found: ${subscriptionId}`);
      }

      const metadata = subscription.metadata as any;
      if (!metadata?.dataRetentionEnd) {
        throw new Error('No data retention policy found for subscription');
      }

      const retentionEndDate = new Date(metadata.dataRetentionEnd);
      const now = new Date();

      if (retentionEndDate > now) {
        throw new Error('Data retention period has not expired yet');
      }

      // Mark data for deletion (actual deletion would be handled by a separate process)
      await prisma.enhancedSubscription.update({
        where: { id: subscriptionId },
        data: {
          metadata: {
            ...metadata,
            dataRetentionEnforced: true,
            dataRetentionEnforcedAt: now.toISOString(),
            dataScheduledForDeletion: true,
          }
        }
      });

      // In a real implementation, you would:
      // 1. Archive critical data
      // 2. Anonymize personal data
      // 3. Delete non-essential data
      // 4. Update school status to reflect data retention enforcement
      
      console.log(`Data retention policy enforced for subscription ${subscriptionId}`);
    } catch (error) {
      console.error('Error enforcing data retention policy:', error);
      throw new Error(`Failed to enforce data retention policy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create custom pricing request with approval workflow
   */
  async createCustomPricingRequest(data: {
    schoolId: string;
    requestedPlanId: string;
    customAmount: number;
    customFeatures?: Record<string, any>;
    justification: string;
    requestedBy: string;
    validUntil?: Date;
  }) {
    try {
      const school = await prisma.school.findUnique({
        where: { id: data.schoolId }
      });

      if (!school) {
        throw new Error(`School not found: ${data.schoolId}`);
      }

      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: data.requestedPlanId }
      });

      if (!plan) {
        throw new Error(`Plan not found: ${data.requestedPlanId}`);
      }

      // Create custom pricing request (this would be a new model in a real implementation)
      const customPricingRequest = {
        id: `cpr_${Date.now()}`,
        schoolId: data.schoolId,
        planId: data.requestedPlanId,
        standardAmount: plan.amount,
        customAmount: data.customAmount,
        customFeatures: data.customFeatures || {},
        justification: data.justification,
        requestedBy: data.requestedBy,
        status: 'pending_approval',
        validUntil: data.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date(),
        approvalWorkflow: {
          requiredApprovals: ['billing_manager', 'sales_director'],
          currentStep: 'billing_manager',
          approvals: [],
          rejections: [],
        }
      };

      // In a real implementation, this would be stored in a database table
      // For now, we'll store it in the school's metadata
      await prisma.school.update({
        where: { id: data.schoolId },
        data: {
          // Assuming there's a metadata field on School model
          // metadata: {
          //   customPricingRequests: [customPricingRequest]
          // }
        }
      });

      return customPricingRequest;
    } catch (error) {
      console.error('Error creating custom pricing request:', error);
      throw new Error(`Failed to create custom pricing request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Approve custom pricing request
   */
  async approveCustomPricing(
    requestId: string,
    approvedBy: string,
    approverRole: string,
    notes?: string
  ) {
    try {
      // In a real implementation, you would:
      // 1. Fetch the custom pricing request from database
      // 2. Validate approver permissions
      // 3. Update approval workflow
      // 4. If all approvals received, create custom subscription plan
      // 5. Notify relevant parties

      const approval = {
        approvedBy,
        approverRole,
        approvedAt: new Date(),
        notes: notes || '',
      };

      // Mock implementation - in reality this would update the database
      console.log(`Custom pricing request ${requestId} approved by ${approvedBy} (${approverRole})`);
      
      return {
        requestId,
        status: 'approved',
        approval,
        nextStep: 'create_custom_plan'
      };
    } catch (error) {
      console.error('Error approving custom pricing:', error);
      throw new Error(`Failed to approve custom pricing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reject custom pricing request
   */
  async rejectCustomPricing(
    requestId: string,
    rejectedBy: string,
    rejectorRole: string,
    reason: string
  ) {
    try {
      const rejection = {
        rejectedBy,
        rejectorRole,
        rejectedAt: new Date(),
        reason,
      };

      // Mock implementation - in reality this would update the database
      console.log(`Custom pricing request ${requestId} rejected by ${rejectedBy} (${rejectorRole}): ${reason}`);
      
      return {
        requestId,
        status: 'rejected',
        rejection,
      };
    } catch (error) {
      console.error('Error rejecting custom pricing:', error);
      throw new Error(`Failed to reject custom pricing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create custom subscription plan from approved pricing
   */
  async createCustomSubscriptionPlan(
    requestId: string,
    customPricingData: {
      schoolId: string;
      basePlanId: string;
      customAmount: number;
      customFeatures: Record<string, any>;
      validUntil: Date;
    }
  ): Promise<SubscriptionPlan> {
    try {
      const basePlan = await prisma.subscriptionPlan.findUnique({
        where: { id: customPricingData.basePlanId }
      });

      if (!basePlan) {
        throw new Error(`Base plan not found: ${customPricingData.basePlanId}`);
      }

      // Create custom plan
      const customPlan = await prisma.subscriptionPlan.create({
        data: {
          name: `${basePlan.name} (Custom - ${customPricingData.schoolId})`,
          description: `Custom pricing plan based on ${basePlan.name}`,
          amount: customPricingData.customAmount,
          currency: basePlan.currency,
          interval: basePlan.interval,
          features: {
            ...basePlan.features as Record<string, any>,
            ...customPricingData.customFeatures,
            isCustomPlan: true,
            basePlanId: customPricingData.basePlanId,
            validUntil: customPricingData.validUntil.toISOString(),
            customPricingRequestId: requestId,
          },
          isActive: true,
        }
      });

      return customPlan;
    } catch (error) {
      console.error('Error creating custom subscription plan:', error);
      throw new Error(`Failed to create custom subscription plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods for cancellation and data retention

  private calculateCancellationRefund(
    subscription: EnhancedSubscription & { plan: SubscriptionPlan },
    cancellationDate: Date
  ): number {
    const currentPeriodStart = subscription.currentPeriodStart;
    const currentPeriodEnd = subscription.currentPeriodEnd;
    const totalPeriodDays = Math.ceil((currentPeriodEnd.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
    const usedDays = Math.ceil((cancellationDate.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, totalPeriodDays - usedDays);

    return Math.round((subscription.plan.amount * remainingDays) / totalPeriodDays);
  }

  private async cancelExternalSubscription(externalId: string, immediate: boolean) {
    // This would integrate with external payment provider
    console.log(`Cancelling external subscription ${externalId}, immediate: ${immediate}`);
  }

  private async scheduleDataRetentionEnforcement(subscriptionId: string, metadata: any) {
    // This would schedule a job to enforce data retention
    console.log(`Scheduled data retention enforcement for subscription ${subscriptionId} at ${metadata.dataRetentionEnd}`);
  }
}

export const subscriptionService = new SubscriptionService();