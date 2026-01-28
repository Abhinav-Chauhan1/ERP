import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { monitoringService } from '@/lib/services/monitoring-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import crypto from 'crypto';

const MONITORING_WEBHOOK_SECRET = process.env.MONITORING_WEBHOOK_SECRET;

/**
 * Verify webhook signature for monitoring services
 */
function verifyMonitoringSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
    
    const providedSignature = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error verifying monitoring signature:', error);
    return false;
  }
}

/**
 * POST /api/webhooks/monitoring
 * Handle monitoring service webhooks (DataDog, New Relic, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    if (!MONITORING_WEBHOOK_SECRET) {
      console.error('MONITORING_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('x-signature') || headersList.get('x-hub-signature-256');
    const provider = headersList.get('x-provider') || 'unknown';

    if (!signature) {
      console.error('Missing monitoring webhook signature header');
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 400 }
      );
    }

    // Verify the webhook signature
    const isValid = verifyMonitoringSignature(body, signature, MONITORING_WEBHOOK_SECRET);
    
    if (!isValid) {
      console.error('Invalid monitoring webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Parse the webhook event
    let event;
    try {
      event = JSON.parse(body);
    } catch (error) {
      console.error('Error parsing monitoring webhook body:', error);
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    console.log(`Received monitoring webhook from ${provider}:`, event.type || event.event_type);

    // Process the monitoring event
    await processMonitoringEvent(event, provider);

    // Log the webhook event
    await logAuditEvent({
      userId: 'system',
      action: AuditAction.CREATE,
      resource: 'MONITORING_WEBHOOK',
      resourceId: event.id || event.event_id || 'unknown',
      changes: {
        provider,
        eventType: event.type || event.event_type,
        severity: event.severity || event.priority,
        processed: true,
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing monitoring webhook:', error);

    try {
      await logAuditEvent({
        userId: 'system',
        action: AuditAction.CREATE,
        resource: 'MONITORING_WEBHOOK',
        changes: {
          provider: 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error',
          processed: false,
        },
      });
    } catch (auditError) {
      console.error('Error logging monitoring webhook failure:', auditError);
    }

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Process monitoring events from external services
 */
async function processMonitoringEvent(event: any, provider: string): Promise<void> {
  try {
    switch (provider.toLowerCase()) {
      case 'datadog':
        await processDataDogEvent(event);
        break;
      case 'newrelic':
        await processNewRelicEvent(event);
        break;
      case 'pingdom':
        await processPingdomEvent(event);
        break;
      case 'uptimerobot':
        await processUptimeRobotEvent(event);
        break;
      default:
        await processGenericMonitoringEvent(event, provider);
    }
  } catch (error) {
    console.error(`Error processing ${provider} monitoring event:`, error);
    throw error;
  }
}

/**
 * Process DataDog webhook events
 */
async function processDataDogEvent(event: any): Promise<void> {
  const alertConfig = {
    alertType: 'DATADOG_ALERT',
    severity: mapDataDogSeverity(event.priority),
    title: event.title || 'DataDog Alert',
    description: event.body || 'Alert from DataDog monitoring',
    metadata: {
      alertId: event.id,
      tags: event.tags,
      url: event.url,
      timestamp: event.date,
    },
  };

  await monitoringService.createAlert(alertConfig);
}

/**
 * Process New Relic webhook events
 */
async function processNewRelicEvent(event: any): Promise<void> {
  const alertConfig = {
    alertType: 'NEWRELIC_ALERT',
    severity: mapNewRelicSeverity(event.severity),
    title: event.condition_name || 'New Relic Alert',
    description: event.details || 'Alert from New Relic monitoring',
    metadata: {
      incidentId: event.incident_id,
      policyName: event.policy_name,
      url: event.incident_url,
      timestamp: event.timestamp,
    },
  };

  await monitoringService.createAlert(alertConfig);
}

/**
 * Process Pingdom webhook events
 */
async function processPingdomEvent(event: any): Promise<void> {
  const alertConfig = {
    alertType: 'PINGDOM_ALERT',
    severity: event.current_state === 'DOWN' ? 'HIGH' : 'MEDIUM',
    title: `${event.check_name} - ${event.current_state}`,
    description: event.description || 'Alert from Pingdom monitoring',
    metadata: {
      checkId: event.check_id,
      checkName: event.check_name,
      state: event.current_state,
      timestamp: event.state_changed_timestamp,
    },
  };

  await monitoringService.createAlert(alertConfig);
}

/**
 * Process UptimeRobot webhook events
 */
async function processUptimeRobotEvent(event: any): Promise<void> {
  const alertConfig = {
    alertType: 'UPTIMEROBOT_ALERT',
    severity: event.alert_type === 1 ? 'HIGH' : 'MEDIUM', // 1 = down, 2 = up
    title: `${event.monitor_friendly_name} - ${event.alert_type === 1 ? 'DOWN' : 'UP'}`,
    description: event.alert_details || 'Alert from UptimeRobot monitoring',
    metadata: {
      monitorId: event.monitor_id,
      monitorName: event.monitor_friendly_name,
      alertType: event.alert_type,
      timestamp: event.alert_datetime,
    },
  };

  await monitoringService.createAlert(alertConfig);
}

/**
 * Process generic monitoring events
 */
async function processGenericMonitoringEvent(event: any, provider: string): Promise<void> {
  const alertConfig = {
    alertType: `${provider.toUpperCase()}_ALERT`,
    severity: 'MEDIUM',
    title: event.title || event.name || `${provider} Alert`,
    description: event.description || event.message || `Alert from ${provider} monitoring`,
    metadata: {
      provider,
      originalEvent: event,
      timestamp: event.timestamp || new Date().toISOString(),
    },
  };

  await monitoringService.createAlert(alertConfig);
}

/**
 * Map DataDog severity to our severity levels
 */
function mapDataDogSeverity(priority: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  switch (priority?.toLowerCase()) {
    case 'p1':
    case 'critical':
      return 'CRITICAL';
    case 'p2':
    case 'high':
      return 'HIGH';
    case 'p3':
    case 'medium':
      return 'MEDIUM';
    case 'p4':
    case 'low':
      return 'LOW';
    default:
      return 'MEDIUM';
  }
}

/**
 * Map New Relic severity to our severity levels
 */
function mapNewRelicSeverity(severity: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return 'CRITICAL';
    case 'warning':
      return 'HIGH';
    case 'info':
      return 'MEDIUM';
    default:
      return 'MEDIUM';
  }
}

/**
 * GET /api/webhooks/monitoring
 * Health check for monitoring webhook endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'monitoring-webhook',
    timestamp: new Date().toISOString(),
    supportedProviders: ['datadog', 'newrelic', 'pingdom', 'uptimerobot'],
  });
}