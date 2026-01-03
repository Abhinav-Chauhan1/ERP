/**
 * WhatsApp Webhook Handler Tests
 * 
 * Tests for the WhatsApp webhook API route that handles delivery status updates
 * and incoming messages.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '../route';
import * as messageLoggingService from '@/lib/services/message-logging-service';
import { MessageLogStatus, CommunicationChannel } from '@prisma/client';
import crypto from 'crypto';

// Mock the message logging service
vi.mock('@/lib/services/message-logging-service', () => ({
  updateMessageStatus: vi.fn(),
  logMessage: vi.fn(),
}));

describe('WhatsApp Webhook Handler', () => {
  const APP_SECRET = 'test-app-secret-123';
  const VERIFY_TOKEN = 'test-verify-token-456';

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up environment variables for tests
    process.env.NODE_ENV = 'test';
    process.env.WHATSAPP_APP_SECRET = APP_SECRET;
    process.env.WHATSAPP_VERIFY_TOKEN = VERIFY_TOKEN;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Helper function to create a valid signature for webhook payload
   */
  function createSignature(payload: string, secret: string): string {
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return `sha256=${signature}`;
  }

  describe('GET /api/webhooks/whatsapp - Webhook Verification', () => {
    it('should verify webhook with valid token and challenge', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=test-challenge-123`
      );

      const response = await GET(request);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(text).toBe('test-challenge-123');
    });

    it('should reject verification with invalid token', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong-token&hub.challenge=test-challenge-123'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Verification failed');
    });

    it('should reject verification with invalid mode', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/webhooks/whatsapp?hub.mode=invalid&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=test-challenge-123`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Verification failed');
    });

    it('should reject verification with missing parameters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Verification failed');
    });

    it('should return 500 if WHATSAPP_VERIFY_TOKEN not configured', async () => {
      delete process.env.WHATSAPP_VERIFY_TOKEN;

      const request = new NextRequest(
        'http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=test&hub.challenge=test'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('not configured');
    });
  });

  describe('POST /api/webhooks/whatsapp - Status Updates', () => {
    it('should process valid DELIVERED status webhook', async () => {
      const mockUpdateMessageStatus = vi.mocked(messageLoggingService.updateMessageStatus);
      mockUpdateMessageStatus.mockResolvedValue({} as any);

      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry-123',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15551234567',
                    phone_number_id: 'phone-123',
                  },
                  statuses: [
                    {
                      id: 'wamid.123',
                      status: 'delivered',
                      timestamp: '1705315800',
                      recipient_id: '919876543210',
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const payloadString = JSON.stringify(payload);
      const signature = createSignature(payloadString, APP_SECRET);

      const request = new NextRequest('http://localhost:3000/api/webhooks/whatsapp', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': signature,
          'content-type': 'application/json',
        },
        body: payloadString,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(mockUpdateMessageStatus).toHaveBeenCalledWith({
        messageId: 'wamid.123',
        status: MessageLogStatus.DELIVERED,
        deliveredAt: new Date(1705315800 * 1000),
      });
    });

    it('should process valid SENT status webhook', async () => {
      const mockUpdateMessageStatus = vi.mocked(messageLoggingService.updateMessageStatus);
      mockUpdateMessageStatus.mockResolvedValue({} as any);

      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry-456',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15551234567',
                    phone_number_id: 'phone-123',
                  },
                  statuses: [
                    {
                      id: 'wamid.456',
                      status: 'sent',
                      timestamp: '1705315900',
                      recipient_id: '919876543210',
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const payloadString = JSON.stringify(payload);
      const signature = createSignature(payloadString, APP_SECRET);

      const request = new NextRequest('http://localhost:3000/api/webhooks/whatsapp', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': signature,
        },
        body: payloadString,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(mockUpdateMessageStatus).toHaveBeenCalledWith({
        messageId: 'wamid.456',
        status: MessageLogStatus.SENT,
      });
    });

    it('should process valid READ status webhook', async () => {
      const mockUpdateMessageStatus = vi.mocked(messageLoggingService.updateMessageStatus);
      mockUpdateMessageStatus.mockResolvedValue({} as any);

      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry-789',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15551234567',
                    phone_number_id: 'phone-123',
                  },
                  statuses: [
                    {
                      id: 'wamid.789',
                      status: 'read',
                      timestamp: '1705316000',
                      recipient_id: '919876543210',
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const payloadString = JSON.stringify(payload);
      const signature = createSignature(payloadString, APP_SECRET);

      const request = new NextRequest('http://localhost:3000/api/webhooks/whatsapp', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': signature,
        },
        body: payloadString,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(mockUpdateMessageStatus).toHaveBeenCalledWith({
        messageId: 'wamid.789',
        status: MessageLogStatus.READ,
        readAt: new Date(1705316000 * 1000),
      });
    });

    it('should process valid FAILED status webhook with error', async () => {
      const mockUpdateMessageStatus = vi.mocked(messageLoggingService.updateMessageStatus);
      mockUpdateMessageStatus.mockResolvedValue({} as any);

      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry-error',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15551234567',
                    phone_number_id: 'phone-123',
                  },
                  statuses: [
                    {
                      id: 'wamid.error',
                      status: 'failed',
                      timestamp: '1705316100',
                      recipient_id: '919876543210',
                      errors: [
                        {
                          code: 131026,
                          title: 'Message undeliverable',
                        },
                      ],
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const payloadString = JSON.stringify(payload);
      const signature = createSignature(payloadString, APP_SECRET);

      const request = new NextRequest('http://localhost:3000/api/webhooks/whatsapp', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': signature,
        },
        body: payloadString,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(mockUpdateMessageStatus).toHaveBeenCalledWith({
        messageId: 'wamid.error',
        status: MessageLogStatus.FAILED,
        failedAt: new Date(1705316100 * 1000),
        errorCode: '131026',
        errorMessage: 'Message undeliverable',
      });
    });

    it('should reject webhook with invalid signature', async () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [],
      };

      const payloadString = JSON.stringify(payload);
      const invalidSignature = 'sha256=invalid-signature';

      const request = new NextRequest('http://localhost:3000/api/webhooks/whatsapp', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': invalidSignature,
        },
        body: payloadString,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid signature');
    });

    it('should reject webhook with missing signature', async () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [],
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/whatsapp', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Missing signature header');
    });

    it('should reject webhook with invalid JSON payload', async () => {
      const invalidPayload = 'invalid json';
      const signature = createSignature(invalidPayload, APP_SECRET);

      const request = new NextRequest('http://localhost:3000/api/webhooks/whatsapp', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': signature,
        },
        body: invalidPayload,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid payload format');
    });

    it('should reject webhook with invalid payload structure', async () => {
      const payload = {
        // Missing required fields
        invalid: 'structure',
      };

      const payloadString = JSON.stringify(payload);
      const signature = createSignature(payloadString, APP_SECRET);

      const request = new NextRequest('http://localhost:3000/api/webhooks/whatsapp', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': signature,
        },
        body: payloadString,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid payload structure');
    });

    it('should handle message not found gracefully', async () => {
      const mockUpdateMessageStatus = vi.mocked(messageLoggingService.updateMessageStatus);
      mockUpdateMessageStatus.mockRejectedValue(
        new Error('Message log not found for messageId: wamid.999')
      );

      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry-999',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15551234567',
                    phone_number_id: 'phone-123',
                  },
                  statuses: [
                    {
                      id: 'wamid.999',
                      status: 'delivered',
                      timestamp: '1705315800',
                      recipient_id: '919876543210',
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const payloadString = JSON.stringify(payload);
      const signature = createSignature(payloadString, APP_SECRET);

      const request = new NextRequest('http://localhost:3000/api/webhooks/whatsapp', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': signature,
        },
        body: payloadString,
      });

      const response = await POST(request);
      const data = await response.json();

      // Should still return 200 to acknowledge receipt
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 500 if WHATSAPP_APP_SECRET not configured', async () => {
      delete process.env.WHATSAPP_APP_SECRET;

      const payload = {
        object: 'whatsapp_business_account',
        entry: [],
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/whatsapp', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': 'sha256=test',
        },
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('not configured');
    });
  });

  describe('POST /api/webhooks/whatsapp - Incoming Messages', () => {
    it('should log incoming text message', async () => {
      const mockLogMessage = vi.mocked(messageLoggingService.logMessage);
      mockLogMessage.mockResolvedValue({} as any);

      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry-msg',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15551234567',
                    phone_number_id: 'phone-123',
                  },
                  messages: [
                    {
                      from: '919876543210',
                      id: 'wamid.incoming.123',
                      timestamp: '1705315800',
                      type: 'text',
                      text: {
                        body: 'Hello, this is a test message',
                      },
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const payloadString = JSON.stringify(payload);
      const signature = createSignature(payloadString, APP_SECRET);

      const request = new NextRequest('http://localhost:3000/api/webhooks/whatsapp', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': signature,
        },
        body: payloadString,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(mockLogMessage).toHaveBeenCalledWith({
        channel: CommunicationChannel.WHATSAPP,
        recipient: '919876543210',
        body: 'Hello, this is a test message',
        messageId: 'wamid.incoming.123',
        metadata: expect.objectContaining({
          type: 'text',
          direction: 'incoming',
          phoneNumberId: 'phone-123',
          displayPhoneNumber: '15551234567',
        }),
      });
    });

    it('should log incoming button response', async () => {
      const mockLogMessage = vi.mocked(messageLoggingService.logMessage);
      mockLogMessage.mockResolvedValue({} as any);

      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry-button',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15551234567',
                    phone_number_id: 'phone-123',
                  },
                  messages: [
                    {
                      from: '919876543210',
                      id: 'wamid.button.456',
                      timestamp: '1705315900',
                      type: 'button',
                      button: {
                        text: 'Confirm',
                        payload: 'confirm_attendance',
                      },
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const payloadString = JSON.stringify(payload);
      const signature = createSignature(payloadString, APP_SECRET);

      const request = new NextRequest('http://localhost:3000/api/webhooks/whatsapp', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': signature,
        },
        body: payloadString,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(mockLogMessage).toHaveBeenCalledWith({
        channel: CommunicationChannel.WHATSAPP,
        recipient: '919876543210',
        body: 'Confirm',
        messageId: 'wamid.button.456',
        metadata: expect.objectContaining({
          type: 'button',
          direction: 'incoming',
          buttonPayload: 'confirm_attendance',
        }),
      });
    });

    it('should handle multiple status updates and messages in one webhook', async () => {
      const mockUpdateMessageStatus = vi.mocked(messageLoggingService.updateMessageStatus);
      const mockLogMessage = vi.mocked(messageLoggingService.logMessage);
      mockUpdateMessageStatus.mockResolvedValue({} as any);
      mockLogMessage.mockResolvedValue({} as any);

      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry-multi',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15551234567',
                    phone_number_id: 'phone-123',
                  },
                  statuses: [
                    {
                      id: 'wamid.status1',
                      status: 'delivered',
                      timestamp: '1705315800',
                      recipient_id: '919876543210',
                    },
                    {
                      id: 'wamid.status2',
                      status: 'read',
                      timestamp: '1705315900',
                      recipient_id: '919876543211',
                    },
                  ],
                  messages: [
                    {
                      from: '919876543212',
                      id: 'wamid.msg1',
                      timestamp: '1705316000',
                      type: 'text',
                      text: {
                        body: 'Message 1',
                      },
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const payloadString = JSON.stringify(payload);
      const signature = createSignature(payloadString, APP_SECRET);

      const request = new NextRequest('http://localhost:3000/api/webhooks/whatsapp', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': signature,
        },
        body: payloadString,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Should process both status updates
      expect(mockUpdateMessageStatus).toHaveBeenCalledTimes(2);
      
      // Should log the incoming message
      expect(mockLogMessage).toHaveBeenCalledTimes(1);
    });
  });
});

