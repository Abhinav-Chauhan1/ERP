import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { configurationService } from '@/lib/services/configuration-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

const integrationConfigSchema = z.object({
  provider: z.enum(['stripe', 'datadog', 'newrelic', 'pingdom', 'uptimerobot', 'slack', 'discord', 'email']),
  name: z.string().min(1),
  config: z.record(z.any()),
  isEnabled: z.boolean().default(true),
  description: z.string().optional(),
});

const updateIntegrationSchema = integrationConfigSchema.partial();

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 50, // Restrictive for integration management
};

/**
 * GET /api/integrations/external
 * Get all external integrations
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');
    const isEnabled = searchParams.get('isEnabled');

    const integrations = await configurationService.getExternalIntegrations({
      provider: provider || undefined,
      isEnabled: isEnabled === 'true' ? true : isEnabled === 'false' ? false : undefined,
    });

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'EXTERNAL_INTEGRATION',
      metadata: {
        filters: { provider, isEnabled },
        resultCount: integrations.length,
      },
    });

    return NextResponse.json(integrations);
  } catch (error) {
    console.error('Error fetching external integrations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/integrations/external
 * Create a new external integration
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = integrationConfigSchema.parse(body);

    // Validate provider-specific configuration
    const validationResult = await validateProviderConfig(validatedData.provider, validatedData.config);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: 'Invalid provider configuration', details: validationResult.errors },
        { status: 400 }
      );
    }

    const integration = await configurationService.createExternalIntegration(validatedData);

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.CREATE,
      resource: 'EXTERNAL_INTEGRATION',
      resourceId: integration.id,
      changes: {
        provider: validatedData.provider,
        name: validatedData.name,
        isEnabled: validatedData.isEnabled,
      },
    });

    return NextResponse.json(integration, { status: 201 });
  } catch (error) {
    console.error('Error creating external integration:', error);
    
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
 * Validate provider-specific configuration
 */
async function validateProviderConfig(
  provider: string,
  config: Record<string, any>
): Promise<{ isValid: boolean; errors?: string[] }> {
  const errors: string[] = [];

  switch (provider) {
    case 'stripe':
      if (!config.apiKey) errors.push('Stripe API key is required');
      if (!config.webhookSecret) errors.push('Stripe webhook secret is required');
      break;

    case 'datadog':
      if (!config.apiKey) errors.push('DataDog API key is required');
      if (!config.appKey) errors.push('DataDog application key is required');
      break;

    case 'newrelic':
      if (!config.apiKey) errors.push('New Relic API key is required');
      if (!config.accountId) errors.push('New Relic account ID is required');
      break;

    case 'pingdom':
      if (!config.apiKey) errors.push('Pingdom API key is required');
      if (!config.email) errors.push('Pingdom email is required');
      break;

    case 'uptimerobot':
      if (!config.apiKey) errors.push('UptimeRobot API key is required');
      break;

    case 'slack':
      if (!config.webhookUrl && !config.botToken) {
        errors.push('Slack webhook URL or bot token is required');
      }
      break;

    case 'discord':
      if (!config.webhookUrl) errors.push('Discord webhook URL is required');
      break;

    case 'email':
      if (!config.smtpHost) errors.push('SMTP host is required');
      if (!config.smtpPort) errors.push('SMTP port is required');
      if (!config.username) errors.push('SMTP username is required');
      if (!config.password) errors.push('SMTP password is required');
      break;

    default:
      errors.push(`Unsupported provider: ${provider}`);
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}