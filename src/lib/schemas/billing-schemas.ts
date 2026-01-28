import { z } from 'zod';

/**
 * Schema for creating a new subscription
 */
export const createSubscriptionSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  planId: z.string().min(1, 'Plan ID is required'),
  trialDays: z.number().min(0).max(365).optional(),
  metadata: z.record(z.string()).optional(),
});

/**
 * Schema for updating an existing subscription
 */
export const updateSubscriptionSchema = z.object({
  planId: z.string().min(1).optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  metadata: z.record(z.string()).optional(),
});

/**
 * Schema for subscription query parameters
 */
export const subscriptionQuerySchema = z.object({
  schoolId: z.string().optional(),
  status: z.enum(['ACTIVE', 'CANCELED', 'PAST_DUE', 'UNPAID', 'TRIALING']).optional(),
  planId: z.string().optional(),
  limit: z.string().optional().transform((val) => {
    const num = parseInt(val || '50');
    return isNaN(num) ? 50 : Math.min(Math.max(num, 1), 100);
  }),
  offset: z.string().optional().transform((val) => {
    const num = parseInt(val || '0');
    return isNaN(num) ? 0 : Math.max(num, 0);
  }),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'status', 'planId']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Schema for payment query parameters
 */
export const paymentQuerySchema = z.object({
  subscriptionId: z.string().optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIAL']).optional(),
  paymentMethod: z.string().optional(),
  limit: z.string().optional().transform((val) => {
    const num = parseInt(val || '50');
    return isNaN(num) ? 50 : Math.min(Math.max(num, 1), 100);
  }),
  offset: z.string().optional().transform((val) => {
    const num = parseInt(val || '0');
    return isNaN(num) ? 0 : Math.max(num, 0);
  }),
  startDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  sortBy: z.enum(['createdAt', 'processedAt', 'amount', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Schema for refund requests
 */
export const refundRequestSchema = z.object({
  amount: z.number().min(1, 'Refund amount must be greater than 0'),
  reason: z.string().min(1, 'Refund reason is required').max(500, 'Reason too long'),
  metadata: z.record(z.string()).optional(),
});

/**
 * Schema for subscription plan creation
 */
export const createPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required').max(100, 'Plan name too long'),
  description: z.string().optional(),
  amount: z.number().min(0, 'Amount must be non-negative'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('inr'),
  interval: z.enum(['day', 'week', 'month', 'year']),
  intervalCount: z.number().min(1).max(365).optional().default(1),
  features: z.record(z.any()),
  isActive: z.boolean().optional().default(true),
});

/**
 * Schema for subscription plan updates
 */
export const updatePlanSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  features: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Type exports for better TypeScript integration
 */
export type CreateSubscriptionData = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionData = z.infer<typeof updateSubscriptionSchema>;
export type SubscriptionQueryParams = z.infer<typeof subscriptionQuerySchema>;
export type PaymentQueryParams = z.infer<typeof paymentQuerySchema>;
export type RefundRequestData = z.infer<typeof refundRequestSchema>;
export type CreatePlanData = z.infer<typeof createPlanSchema>;
export type UpdatePlanData = z.infer<typeof updatePlanSchema>;