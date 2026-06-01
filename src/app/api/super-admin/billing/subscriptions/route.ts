import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware/super-admin-auth';
import { validateRequest, validateQuery, sanitizeRequest } from '@/lib/middleware/validation';
import { handleApiError, paginatedResponse, createdResponse } from '@/lib/utils/api-response';
import { getRequestMetadata } from '@/lib/utils/request-helpers';
import { rateLimit } from '@/lib/middleware/rate-limit';
import { billingService } from '@/lib/services/billing-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { db } from '@/lib/db';
import { addDays, addMonths } from 'date-fns';
import { AuditAction } from '@prisma/client';
import {
  createSubscriptionSchema,
  subscriptionQuerySchema,
  CreateSubscriptionData,
  SubscriptionQueryParams
} from '@/lib/schemas/billing-schemas';

// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
};

/**
 * GET /api/super-admin/billing/subscriptions
 * Get all subscriptions with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    // Check authentication and authorization
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) return authResult;
    
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { user } = authResult;

    // Validate and parse query parameters
    const { searchParams } = new URL(request.url);
    
    // Convert string parameters to appropriate types
    const rawParams = {
      schoolId: searchParams.get('schoolId') || undefined,
      status: searchParams.get('status') || undefined,
      planId: searchParams.get('planId') || undefined,
      search: searchParams.get('search') || undefined,
      limit: Math.min(Math.max(parseInt(searchParams.get('limit') ?? '10', 10) || 10, 1), 500),
      offset: Math.max(parseInt(searchParams.get('offset') ?? '0', 10) || 0, 0),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc'
    };
    
    const queryParams = subscriptionQuerySchema.parse(rawParams);

    // Sanitize input
    const sanitizedParams = sanitizeRequest(queryParams);

    // Get subscriptions with pagination
    const result = await billingService.getSubscriptions(sanitizedParams);

    // Get request metadata for audit logging
    const metadata = getRequestMetadata(request);

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      action: AuditAction.READ,
      resource: 'SUBSCRIPTION',
      metadata: {
        filters: sanitizedParams,
        ...metadata,
      },
    });

    // Return paginated response
    return paginatedResponse(
      result.data,
      result.total,
      sanitizedParams.limit,
      sanitizedParams.offset
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/super-admin/billing/subscriptions
 * Create a new subscription
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    // Check authentication and authorization
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) return authResult;
    
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { user } = authResult;

    // Validate and parse request body
    const validatedData = await validateRequest(createSubscriptionSchema)(request);
    
    // Sanitize input data
    const sanitizedData = sanitizeRequest(validatedData);

    // Look up plan
    const plan = await db.subscriptionPlan.findUnique({ where: { id: sanitizedData.planId } });
    if (!plan) {
      return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 });
    }

    const now = new Date();
    const trialDays = sanitizedData.trialDays ?? 0;
    const periodStart = trialDays > 0 ? addDays(now, trialDays) : now;
    const periodEnd = addMonths(periodStart, 1);

    // Create subscription and update school plan atomically
    const [subscription] = await Promise.all([
      db.enhancedSubscription.create({
        data: {
          schoolId: sanitizedData.schoolId,
          planId: sanitizedData.planId,
          status: trialDays > 0 ? 'TRIALING' : 'ACTIVE',
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          trialEnd: trialDays > 0 ? periodStart : null,
        },
      }),
      db.school.update({
        where: { id: sanitizedData.schoolId },
        data: { plan: plan.name as any },
      }),
    ]);

    // Get request metadata for audit logging
    const metadata = getRequestMetadata(request);

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      action: AuditAction.CREATE,
      resource: 'SUBSCRIPTION',
      resourceId: subscription.id,
      changes: sanitizedData,
      metadata,
    });

    return createdResponse(subscription);
  } catch (error) {
    return handleApiError(error);
  }
}