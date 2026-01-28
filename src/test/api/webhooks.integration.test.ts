import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as stripeWebhook, GET as stripeHealth } from '@/app/api/webhooks/stripe/route';
import { POST as monitoringWebhook, GET as monitoringHealth } from '@/app/api/webhooks/monitoring/route';
import crypto from 'crypto';

// Mock dependencies
const mockBillingService = {
  handleWebhook: vi.fn(),
};

const mockMonitoringService = {
  createAlert: vi.fn(),
};

vi.mock('@/lib/services/billing-service', () => ({
  billingService: mockBillingService,
}));

vi.mock('@/lib/services/monitoring-service', () => ({
  monitoringService: mockMonitoringService,
}));

vi.mock('@/lib/services/audit-service', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

// Mock environment variables
const STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
const MONITORING_WEBHOOK_SECRET = 'monitoring_test_secret';

vi.mock('process', () => ({
  env: {
    STRIPE_WEBHOOK_SECRET,
    MONITORING_WEBHOOK_SECRET,
  },
}));

describe('Webhook API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Stripe Webhook', () => {
    function createStripeSignature(payload: string, secret: string): string {
      const timestamp = Math.floor(Date.now() / 1000);
      const signedPayload = `${timestamp}.${payload}`;
      const signature = crypto.createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
      return `t=${timestamp},v1=${signature}`;
    }

    describe('POST /api/webhooks/stripe', () => {
      it('should process valid Stripe webhook', async () => {
        // Arrange
        const webhookPayload = JSON.stringify({
          id: 'evt_test_webhook',
          type: 'payment.captured',
          data: {
            payment: {
              entity: {
                id: 'pay_test_payment',
                amount: 2000,
                currency: 'usd',
                status: 'succeeded',
              },
            },
          },
        });

        const signature = createStripeSignature(webhookPayload, STRIPE_WEBHOOK_SECRET);
        mockBillingService.handleWebhook.mockResolvedValue(undefined);

        const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
          method: 'POST',
          body: webhookPayload,
          headers: {
            'stripe-signature': signature,
            'content-type': 'application/json',
          },
        });

        // Act
        const response = await stripeWebhook(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(mockBillingService.handleWebhook).toHaveBeenCalledWith({
          event: 'payment.captured',
          payload: {
            payment: {
              entity: {
                id: 'pay_test_payment',
                amount: 2000,
                currency: 'usd',
                status: 'succeeded',
              },
            },
          },
        });
      });

      it('should reject webhook with invalid signature', async () => {
        // Arrange
        const webhookPayload = JSON.stringify({
          id: 'evt_test_webhook',
          type: 'payment.captured',
          data: {},
        });

        const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
          method: 'POST',
          body: webhookPayload,
          headers: {
            'stripe-signature': 'invalid_signature',
            'content-type': 'application/json',
          },
        });

        // Act
        const response = await stripeWebhook(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid signature');
        expect(mockBillingService.handleWebhook).not.toHaveBeenCalled();
      });

      it('should reject webhook without signature header', async () => {
        // Arrange
        const webhookPayload = JSON.stringify({
          id: 'evt_test_webhook',
          type: 'payment.captured',
          data: {},
        });

        const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
          method: 'POST',
          body: webhookPayload,
          headers: {
            'content-type': 'application/json',
          },
        });

        // Act
        const response = await stripeWebhook(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing signature header');
      });

      it('should handle malformed JSON payload', async () => {
        // Arrange
        const invalidPayload = 'invalid json';
        const signature = createStripeSignature(invalidPayload, STRIPE_WEBHOOK_SECRET);

        const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
          method: 'POST',
          body: invalidPayload,
          headers: {
            'stripe-signature': signature,
            'content-type': 'application/json',
          },
        });

        // Act
        const response = await stripeWebhook(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid JSON');
      });

      it('should handle service errors gracefully', async () => {
        // Arrange
        const webhookPayload = JSON.stringify({
          id: 'evt_test_webhook',
          type: 'payment.captured',
          data: {},
        });

        const signature = createStripeSignature(webhookPayload, STRIPE_WEBHOOK_SECRET);
        mockBillingService.handleWebhook.mockRejectedValue(new Error('Service error'));

        const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
          method: 'POST',
          body: webhookPayload,
          headers: {
            'stripe-signature': signature,
            'content-type': 'application/json',
          },
        });

        // Act
        const response = await stripeWebhook(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(500);
        expect(data.error).toBe('Webhook processing failed');
      });

      it('should reject old timestamps', async () => {
        // Arrange
        const webhookPayload = JSON.stringify({
          id: 'evt_test_webhook',
          type: 'payment.captured',
          data: {},
        });

        // Create signature with old timestamp (more than 5 minutes ago)
        const oldTimestamp = Math.floor(Date.now() / 1000) - 400; // 6 minutes ago
        const signedPayload = `${oldTimestamp}.${webhookPayload}`;
        const signature = crypto.createHmac('sha256', STRIPE_WEBHOOK_SECRET).update(signedPayload, 'utf8').digest('hex');
        const stripeSignature = `t=${oldTimestamp},v1=${signature}`;

        const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
          method: 'POST',
          body: webhookPayload,
          headers: {
            'stripe-signature': stripeSignature,
            'content-type': 'application/json',
          },
        });

        // Act
        const response = await stripeWebhook(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid signature');
      });
    });

    describe('GET /api/webhooks/stripe', () => {
      it('should return health check status', async () => {
        // Arrange
        const request = new NextRequest('http://localhost:3000/api/webhooks/stripe');

        // Act
        const response = await stripeHealth();
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.status).toBe('ok');
        expect(data.service).toBe('stripe-webhook');
        expect(data.timestamp).toBeDefined();
      });
    });
  });

  describe('Monitoring Webhook', () => {
    function createMonitoringSignature(payload: string, secret: string): string {
      return 'sha256=' + crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
    }

    describe('POST /api/webhooks/monitoring', () => {
      it('should process DataDog webhook', async () => {
        // Arrange
        const webhookPayload = JSON.stringify({
          id: 'alert_123',
          title: 'High CPU Usage',
          body: 'CPU usage is above 90%',
          priority: 'high',
          tags: ['env:production', 'service:api'],
          url: 'https://app.datadoghq.com/alerts/123',
          date: Date.now() / 1000,
        });

        const signature = createMonitoringSignature(webhookPayload, MONITORING_WEBHOOK_SECRET);
        mockMonitoringService.createAlert.mockResolvedValue({ id: 'alert-1' });

        const request = new NextRequest('http://localhost:3000/api/webhooks/monitoring', {
          method: 'POST',
          body: webhookPayload,
          headers: {
            'x-signature': signature,
            'x-provider': 'datadog',
            'content-type': 'application/json',
          },
        });

        // Act
        const response = await monitoringWebhook(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(mockMonitoringService.createAlert).toHaveBeenCalledWith({
          alertType: 'DATADOG_ALERT',
          severity: 'HIGH',
          title: 'High CPU Usage',
          description: 'CPU usage is above 90%',
          metadata: {
            alertId: 'alert_123',
            tags: ['env:production', 'service:api'],
            url: 'https://app.datadoghq.com/alerts/123',
            timestamp: expect.any(Number),
          },
        });
      });

      it('should process New Relic webhook', async () => {
        // Arrange
        const webhookPayload = JSON.stringify({
          incident_id: 'incident_123',
          condition_name: 'Response Time Alert',
          policy_name: 'Production Policy',
          severity: 'critical',
          details: 'Response time exceeded threshold',
          incident_url: 'https://alerts.newrelic.com/incidents/123',
          timestamp: Date.now(),
        });

        const signature = createMonitoringSignature(webhookPayload, MONITORING_WEBHOOK_SECRET);
        mockMonitoringService.createAlert.mockResolvedValue({ id: 'alert-2' });

        const request = new NextRequest('http://localhost:3000/api/webhooks/monitoring', {
          method: 'POST',
          body: webhookPayload,
          headers: {
            'x-signature': signature,
            'x-provider': 'newrelic',
            'content-type': 'application/json',
          },
        });

        // Act
        const response = await monitoringWebhook(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(mockMonitoringService.createAlert).toHaveBeenCalledWith({
          alertType: 'NEWRELIC_ALERT',
          severity: 'CRITICAL',
          title: 'Response Time Alert',
          description: 'Response time exceeded threshold',
          metadata: {
            incidentId: 'incident_123',
            policyName: 'Production Policy',
            url: 'https://alerts.newrelic.com/incidents/123',
            timestamp: expect.any(Number),
          },
        });
      });

      it('should process Pingdom webhook', async () => {
        // Arrange
        const webhookPayload = JSON.stringify({
          check_id: 'check_123',
          check_name: 'API Health Check',
          current_state: 'DOWN',
          description: 'API is not responding',
          state_changed_timestamp: Date.now() / 1000,
        });

        const signature = createMonitoringSignature(webhookPayload, MONITORING_WEBHOOK_SECRET);
        mockMonitoringService.createAlert.mockResolvedValue({ id: 'alert-3' });

        const request = new NextRequest('http://localhost:3000/api/webhooks/monitoring', {
          method: 'POST',
          body: webhookPayload,
          headers: {
            'x-signature': signature,
            'x-provider': 'pingdom',
            'content-type': 'application/json',
          },
        });

        // Act
        const response = await monitoringWebhook(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(mockMonitoringService.createAlert).toHaveBeenCalledWith({
          alertType: 'PINGDOM_ALERT',
          severity: 'HIGH',
          title: 'API Health Check - DOWN',
          description: 'API is not responding',
          metadata: {
            checkId: 'check_123',
            checkName: 'API Health Check',
            state: 'DOWN',
            timestamp: expect.any(Number),
          },
        });
      });

      it('should process UptimeRobot webhook', async () => {
        // Arrange
        const webhookPayload = JSON.stringify({
          monitor_id: 'monitor_123',
          monitor_friendly_name: 'Website Monitor',
          alert_type: 1, // 1 = down, 2 = up
          alert_details: 'Website is down',
          alert_datetime: '2024-02-15 10:30:00',
        });

        const signature = createMonitoringSignature(webhookPayload, MONITORING_WEBHOOK_SECRET);
        mockMonitoringService.createAlert.mockResolvedValue({ id: 'alert-4' });

        const request = new NextRequest('http://localhost:3000/api/webhooks/monitoring', {
          method: 'POST',
          body: webhookPayload,
          headers: {
            'x-signature': signature,
            'x-provider': 'uptimerobot',
            'content-type': 'application/json',
          },
        });

        // Act
        const response = await monitoringWebhook(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(mockMonitoringService.createAlert).toHaveBeenCalledWith({
          alertType: 'UPTIMEROBOT_ALERT',
          severity: 'HIGH',
          title: 'Website Monitor - DOWN',
          description: 'Website is down',
          metadata: {
            monitorId: 'monitor_123',
            monitorName: 'Website Monitor',
            alertType: 1,
            timestamp: '2024-02-15 10:30:00',
          },
        });
      });

      it('should process generic monitoring webhook', async () => {
        // Arrange
        const webhookPayload = JSON.stringify({
          title: 'Custom Alert',
          message: 'Something went wrong',
          timestamp: new Date().toISOString(),
        });

        const signature = createMonitoringSignature(webhookPayload, MONITORING_WEBHOOK_SECRET);
        mockMonitoringService.createAlert.mockResolvedValue({ id: 'alert-5' });

        const request = new NextRequest('http://localhost:3000/api/webhooks/monitoring', {
          method: 'POST',
          body: webhookPayload,
          headers: {
            'x-signature': signature,
            'x-provider': 'custom',
            'content-type': 'application/json',
          },
        });

        // Act
        const response = await monitoringWebhook(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(mockMonitoringService.createAlert).toHaveBeenCalledWith({
          alertType: 'CUSTOM_ALERT',
          severity: 'MEDIUM',
          title: 'Custom Alert',
          description: 'Something went wrong',
          metadata: {
            provider: 'custom',
            originalEvent: expect.any(Object),
            timestamp: expect.any(String),
          },
        });
      });

      it('should reject webhook with invalid signature', async () => {
        // Arrange
        const webhookPayload = JSON.stringify({
          title: 'Test Alert',
        });

        const request = new NextRequest('http://localhost:3000/api/webhooks/monitoring', {
          method: 'POST',
          body: webhookPayload,
          headers: {
            'x-signature': 'invalid_signature',
            'x-provider': 'datadog',
            'content-type': 'application/json',
          },
        });

        // Act
        const response = await monitoringWebhook(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid signature');
        expect(mockMonitoringService.createAlert).not.toHaveBeenCalled();
      });
    });

    describe('GET /api/webhooks/monitoring', () => {
      it('should return health check status', async () => {
        // Arrange
        const request = new NextRequest('http://localhost:3000/api/webhooks/monitoring');

        // Act
        const response = await monitoringHealth();
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.status).toBe('ok');
        expect(data.service).toBe('monitoring-webhook');
        expect(data.timestamp).toBeDefined();
        expect(data.supportedProviders).toEqual(['datadog', 'newrelic', 'pingdom', 'uptimerobot']);
      });
    });
  });

  describe('Security Tests', () => {
    it('should handle replay attacks', async () => {
      // Arrange
      const webhookPayload = JSON.stringify({
        id: 'evt_test_webhook',
        type: 'payment.captured',
        data: {},
      });

      const signature = createStripeSignature(webhookPayload, STRIPE_WEBHOOK_SECRET);

      const request1 = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: webhookPayload,
        headers: {
          'stripe-signature': signature,
          'content-type': 'application/json',
        },
      });

      const request2 = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: webhookPayload,
        headers: {
          'stripe-signature': signature,
          'content-type': 'application/json',
        },
      });

      // Act
      const response1 = await stripeWebhook(request1);
      const response2 = await stripeWebhook(request2);

      // Assert
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200); // Same signature should still work (idempotency)
    });

    it('should handle timing attacks', async () => {
      // Arrange
      const webhookPayload = JSON.stringify({
        id: 'evt_test_webhook',
        type: 'payment.captured',
        data: {},
      });

      const validSignature = createStripeSignature(webhookPayload, STRIPE_WEBHOOK_SECRET);
      const invalidSignature = 'invalid_signature';

      const validRequest = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: webhookPayload,
        headers: {
          'stripe-signature': validSignature,
          'content-type': 'application/json',
        },
      });

      const invalidRequest = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: webhookPayload,
        headers: {
          'stripe-signature': invalidSignature,
          'content-type': 'application/json',
        },
      });

      // Act & Assert
      const startValid = Date.now();
      const validResponse = await stripeWebhook(validRequest);
      const endValid = Date.now();

      const startInvalid = Date.now();
      const invalidResponse = await stripeWebhook(invalidRequest);
      const endInvalid = Date.now();

      // Both should complete in similar time (no timing attack vulnerability)
      const validTime = endValid - startValid;
      const invalidTime = endInvalid - startInvalid;
      const timeDifference = Math.abs(validTime - invalidTime);

      expect(validResponse.status).toBe(200);
      expect(invalidResponse.status).toBe(400);
      expect(timeDifference).toBeLessThan(100); // Should be within 100ms
    });
  });

  function createStripeSignature(payload: string, secret: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payload}`;
    const signature = crypto.createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
    return `t=${timestamp},v1=${signature}`;
  }
});