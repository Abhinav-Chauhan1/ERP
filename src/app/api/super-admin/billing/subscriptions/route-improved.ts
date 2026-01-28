import { NextRequest } from 'next/server';
import { createSuperAdminRoute } from '@/lib/middleware/compose';
import { validateQuery, sanitizeRequest } from '@/lib/middleware/validation';
import { paginatedResponse, createdResponse } from '@/lib/utils/api-response';
import { billingService } from '@/lib/services/billing-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { 
  createSubscriptionSchema, 
  subscriptionQuerySchema
} from '@/lib/schemas/billing-schemas';

/**
 * GET /api/super-admin/billing/subscriptions
 * Get all subscriptions with filtering and pagination
 */
export const GET = createSuperAdminRoute(async (context) => {
  // Validate and parse query parameters
  const { searchParams } = new URL(context.request.url);
  const queryParams = validateQuery(subscriptionQuerySchema)(searchParams);
  const sanitizedParams = sanitizeRequest(queryParams);

  // Get subscriptions with pagination
  const result = await billingService.getSubscriptions(sanitizedParams);

  // Log audit event
  await logAuditEvent({
    userId: context.user.id,
    action: AuditAction.READ,
    resource: 'SUBSCRIPTION',
    metadata: {
      filters: sanitizedParams,
      ...context.metadata,
    },
  });

  // Return paginated response
  return paginatedResponse(
    result.data,
    result.total,
    sanitizedParams.limit,
    sanitizedParams.offset
  );
});

/**
 * POST /api/super-admin/billing/subscriptions
 * Create a new subscription
 */
export const POST = createSuperAdminRoute(async (context) => {
  // Parse and validate request body
  const body = await context.request.json();
  const validatedData = createSubscriptionSchema.parse(body);
  const sanitizedData = sanitizeRequest(validatedData);

  // Create subscription
  const subscription = await billingService.createSubscription(sanitizedData);

  // Log audit event
  await logAuditEvent({
    userId: context.user.id,
    action: AuditAction.CREATE,
    resource: 'SUBSCRIPTION',
    resourceId: subscription.id,
    changes: sanitizedData,
    metadata: context.metadata,
  });

  return createdResponse(subscription);
});