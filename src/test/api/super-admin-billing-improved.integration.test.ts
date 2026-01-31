import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/services/billing-service', () => ({
  billingService: {
    getSubscriptions: vi.fn(),
    createSubscription: vi.fn(),
  }
}));

vi.mock('@/lib/services/audit-service', () => ({
  logAuditEvent: vi.fn(),
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/middleware/rate-limit', () => ({
  rateLimit: vi.fn(),
}));

describe('Super Admin Billing Subscriptions API - Improved', () => {
  const mockUser = {
    id: 'super-admin-1',
    email: 'superadmin@test.com',
    role: 'SUPER_ADMIN',
  };

  const mockSession = {
    user: mockUser,
  };

  beforeAll(() => {
    // Setup mocks
    const { getServerSession } = require('next-auth');
    const { rateLimit } = require('@/lib/middleware/rate-limit');
    
    getServerSession.mockResolvedValue(mockSession);
    rateLimit.mockResolvedValue(null); // No rate limiting
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe('Middleware Integration', () => {
    it('should properly compose middleware functions', async () => {
      const { requireSuperAdmin } = await import('@/lib/middleware/super-admin-auth');
      const { validateQuery } = await import('@/lib/middleware/validation');
      const { handleApiError } = await import('@/lib/utils/api-response');

      expect(requireSuperAdmin).toBeDefined();
      expect(validateQuery).toBeDefined();
      expect(handleApiError).toBeDefined();
    });

    it('should validate query parameters correctly', async () => {
      const { validateQuery } = await import('@/lib/middleware/validation');
      const { subscriptionQuerySchema } = await import('@/lib/schemas/billing-schemas');

      const searchParams = new URLSearchParams({
        limit: '10',
        offset: '0',
        status: 'ACTIVE',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      const result = validateQuery(subscriptionQuerySchema)(searchParams);

      expect(result).toMatchObject({
        limit: 10,
        offset: 0,
        status: 'ACTIVE',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
    });

    it('should sanitize input data', async () => {
      const { sanitizeRequest } = await import('@/lib/middleware/validation');

      const input = {
        schoolId: 'school-1<script>alert("xss")</script>',
        planId: 'plan-1',
        metadata: {
          note: 'Test note<script>alert("xss")</script>',
        },
      };

      const sanitized = sanitizeRequest(input);

      expect(sanitized).toEqual({
        schoolId: 'school-1',
        planId: 'plan-1',
        metadata: {
          note: 'Test note',
        },
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors with proper structure', async () => {
      const { handleApiError, ApiError } = await import('@/lib/utils/api-response');

      const error = new ApiError('Test error', 400, 'TEST_ERROR', { field: 'value' });
      const response = handleApiError(error);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Test error',
        code: 'TEST_ERROR',
        details: { field: 'value' }
      });
    });

    it('should handle validation errors', async () => {
      const { handleApiError } = await import('@/lib/utils/api-response');
      const { z } = await import('zod');

      const schema = z.object({
        required: z.string()
      });

      try {
        schema.parse({});
      } catch (error) {
        const response = handleApiError(error);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Validation error');
        expect(data.code).toBe('VALIDATION_ERROR');
        expect(data.details).toBeDefined();
      }
    });
  });

  describe('Response Helpers', () => {
    it('should create paginated responses correctly', async () => {
      const { paginatedResponse } = await import('@/lib/utils/api-response');

      const data = [{ id: '1' }, { id: '2' }];
      const response = paginatedResponse(data, 10, 5, 0);
      const result = await response.json();

      expect(result).toEqual({
        data,
        pagination: {
          total: 10,
          limit: 5,
          offset: 0,
          hasMore: true,
          page: 1,
          totalPages: 2
        }
      });
    });

    it('should create created responses correctly', async () => {
      const { createdResponse } = await import('@/lib/utils/api-response');

      const data = { id: 'new-item' };
      const response = createdResponse(data);

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result).toEqual(data);
    });
  });

  describe('Schema Validation', () => {
    it('should validate subscription creation data', async () => {
      const { createSubscriptionSchema } = await import('@/lib/schemas/billing-schemas');

      const validData = {
        schoolId: 'school-1',
        planId: 'plan-1',
        trialDays: 14,
        metadata: { source: 'admin' }
      };

      const result = createSubscriptionSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject invalid subscription data', async () => {
      const { createSubscriptionSchema } = await import('@/lib/schemas/billing-schemas');

      const invalidData = {
        schoolId: '', // Empty string should fail
        planId: 'plan-1',
        trialDays: 400 // Exceeds maximum
      };

      expect(() => createSubscriptionSchema.parse(invalidData)).toThrow();
    });

    it('should validate query parameters with transformations', async () => {
      const { subscriptionQuerySchema } = await import('@/lib/schemas/billing-schemas');

      const queryData = {
        limit: '25',
        offset: '10',
        status: 'ACTIVE',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      const result = subscriptionQuerySchema.parse(queryData);

      expect(result).toEqual({
        limit: 25,
        offset: 10,
        status: 'ACTIVE',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
    });
  });

  describe('Request Helpers', () => {
    it('should extract client IP correctly', async () => {
      const { getClientIP } = await import('@/lib/utils/request-helpers');

      const request = new NextRequest('http://localhost:3000/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
          'x-real-ip': '192.168.1.2'
        }
      });

      const ip = getClientIP(request);
      expect(ip).toBe('192.168.1.1'); // Should get first IP from x-forwarded-for
    });

    it('should extract user agent correctly', async () => {
      const { getUserAgent } = await import('@/lib/utils/request-helpers');

      const request = new NextRequest('http://localhost:3000/test', {
        headers: {
          'user-agent': 'Mozilla/5.0 Test Browser'
        }
      });

      const userAgent = getUserAgent(request);
      expect(userAgent).toBe('Mozilla/5.0 Test Browser');
    });

    it('should get request metadata', async () => {
      const { getRequestMetadata } = await import('@/lib/utils/request-helpers');

      const request = new NextRequest('http://localhost:3000/test', {
        method: 'POST',
        headers: {
          'user-agent': 'Test Browser',
          'x-forwarded-for': '192.168.1.1'
        }
      });

      const metadata = getRequestMetadata(request);

      expect(metadata).toMatchObject({
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser',
        method: 'POST',
        url: 'http://localhost:3000/test',
        timestamp: expect.any(Date)
      });
    });
  });
});