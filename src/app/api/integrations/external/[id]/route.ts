import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { configurationService } from '@/lib/services/configuration-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

const updateIntegrationSchema = z.object({
  name: z.string().min(1).optional(),
  config: z.record(z.any()).optional(),
  isEnabled: z.boolean().optional(),
  description: z.string().optional(),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 50,
};

/**
 * GET /api/integrations/external/[id]
 * Get a specific external integration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integration = await configurationService.getExternalIntegrationById(params.id);
    
    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'EXTERNAL_INTEGRATION',
      resourceId: params.id,
    });

    return NextResponse.json(integration);
  } catch (error) {
    console.error('Error fetching external integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/integrations/external/[id]
 * Update an external integration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateIntegrationSchema.parse(body);

    const integration = await configurationService.updateExternalIntegration(
      params.id,
      validatedData
    );

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      resource: 'EXTERNAL_INTEGRATION',
      resourceId: params.id,
      changes: validatedData,
    });

    return NextResponse.json(integration);
  } catch (error) {
    console.error('Error updating external integration:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/integrations/external/[id]
 * Delete an external integration
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await configurationService.deleteExternalIntegration(params.id);

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.DELETE,
      resource: 'EXTERNAL_INTEGRATION',
      resourceId: params.id,
    });

    return NextResponse.json({ message: 'Integration deleted successfully' });
  } catch (error) {
    console.error('Error deleting external integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}