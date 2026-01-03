/**
 * MSG91 Webhook Handler Tests
 * 
 * Tests for the MSG91 webhook API route that handles delivery status updates.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '../route';
import * as messageLoggingService from '@/lib/services/message-logging-service';
import { MessageLogStatus } from '@prisma/client';

// Mock the message logging service
vi.mock('@/lib/services/message-logging-service', () => ({
  updateMessageStatus: vi.fn(),
}));

describe('MSG91 Webhook Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up environment variables for tests
    process.env.NODE_ENV = 'test';
    process.env.MSG91_WEBHOOK_TOKEN = 'test-token-123';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/webhooks/msg91', () => {
    it('should process valid DELIVERED status webhook', async () => {
      const mockUpdateMessageStatus = vi.mocked(messageLoggingService.updateMessageStatus);
      mockUpdateMessageStatus.mockResolvedValue({} as any);

      const payload = {
        request_id: 'msg-123',
        status: 'DELIVERED',
        mobile: '919876543210',
        description: 'Message delivered successfully',
        timestamp: '2024-01-15T10:30:00Z',
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/msg91?token=test-token-123', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.request_id).toBe('msg-123');

      expect(mockUpdateMessageStatus).toHaveBeenCalledWith({
        messageId: 'msg-123',
        status: MessageLogStatus.DELIVERED,
        deliveredAt: new Date('2024-01-15T10:30:00Z'),
      });
    });

    it('should process valid SENT status webhook', async () => {
      const mockUpdateMessageStatus = vi.mocked(messageLoggingService.updateMessageStatus);
      mockUpdateMessageStatus.mockResolvedValue({} as any);

      const payload = {
        request_id: 'msg-456',
        status: 'SENT',
        mobile: '919876543210',
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/msg91?token=test-token-123', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(mockUpdateMessageStatus).toHaveBeenCalledWith({
        messageId: 'msg-456',
        status: MessageLogStatus.SENT,
      });
    });

    it('should process valid FAILED status webhook', async () => {
      const mockUpdateMessageStatus = vi.mocked(messageLoggingService.updateMessageStatus);
      mockUpdateMessageStatus.mockResolvedValue({} as any);

      const payload = {
        request_id: 'msg-789',
        status: 'FAILED',
        mobile: '919876543210',
        description: 'Invalid number',
        timestamp: '2024-01-15T10:35:00Z',
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/msg91?token=test-token-123', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(mockUpdateMessageStatus).toHaveBeenCalledWith({
        messageId: 'msg-789',
        status: MessageLogStatus.FAILED,
        failedAt: new Date('2024-01-15T10:35:00Z'),
        errorMessage: 'Invalid number',
        errorCode: 'FAILED',
      });
    });

    it('should reject webhook with invalid authentication token', async () => {
      const payload = {
        request_id: 'msg-123',
        status: 'DELIVERED',
        mobile: '919876543210',
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/msg91?token=wrong-token', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject webhook with missing authentication token', async () => {
      const payload = {
        request_id: 'msg-123',
        status: 'DELIVERED',
        mobile: '919876543210',
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/msg91', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject webhook with invalid JSON payload', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhooks/msg91?token=test-token-123', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid payload format');
    });

    it('should reject webhook with missing required fields', async () => {
      const payload = {
        mobile: '919876543210',
        // Missing request_id and status
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/msg91?token=test-token-123', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    it('should handle message not found gracefully', async () => {
      const mockUpdateMessageStatus = vi.mocked(messageLoggingService.updateMessageStatus);
      mockUpdateMessageStatus.mockRejectedValue(
        new Error('Message log not found for messageId: msg-999')
      );

      const payload = {
        request_id: 'msg-999',
        status: 'DELIVERED',
        mobile: '919876543210',
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/msg91?token=test-token-123', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('message not found');
    });

    it('should return 500 for database errors', async () => {
      const mockUpdateMessageStatus = vi.mocked(messageLoggingService.updateMessageStatus);
      mockUpdateMessageStatus.mockRejectedValue(
        new Error('Database connection failed')
      );

      const payload = {
        request_id: 'msg-123',
        status: 'DELIVERED',
        mobile: '919876543210',
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/msg91?token=test-token-123', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to process webhook');
    });

    it('should map REJECTED status to FAILED', async () => {
      const mockUpdateMessageStatus = vi.mocked(messageLoggingService.updateMessageStatus);
      mockUpdateMessageStatus.mockResolvedValue({} as any);

      const payload = {
        request_id: 'msg-rejected',
        status: 'REJECTED',
        mobile: '919876543210',
        description: 'Message rejected by carrier',
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/msg91?token=test-token-123', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(mockUpdateMessageStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          status: MessageLogStatus.FAILED,
        })
      );
    });

    it('should map UNDELIVERED status to FAILED', async () => {
      const mockUpdateMessageStatus = vi.mocked(messageLoggingService.updateMessageStatus);
      mockUpdateMessageStatus.mockResolvedValue({} as any);

      const payload = {
        request_id: 'msg-undelivered',
        status: 'UNDELIVERED',
        mobile: '919876543210',
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/msg91?token=test-token-123', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(mockUpdateMessageStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          status: MessageLogStatus.FAILED,
        })
      );
    });

    it('should handle unknown status gracefully', async () => {
      const mockUpdateMessageStatus = vi.mocked(messageLoggingService.updateMessageStatus);
      mockUpdateMessageStatus.mockResolvedValue({} as any);

      const payload = {
        request_id: 'msg-unknown',
        status: 'UNKNOWN_STATUS',
        mobile: '919876543210',
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/msg91?token=test-token-123', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(mockUpdateMessageStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          status: MessageLogStatus.QUEUED, // Default fallback
        })
      );
    });
  });

  describe('GET /api/webhooks/msg91', () => {
    it('should verify webhook endpoint with valid token', async () => {
      process.env.MSG91_WEBHOOK_VERIFY_TOKEN = 'verify-123';

      const request = new NextRequest(
        'http://localhost:3000/api/webhooks/msg91?verify_token=verify-123'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('verified');
    });

    it('should return active status without verify token', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhooks/msg91');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('active');
    });
  });
});
