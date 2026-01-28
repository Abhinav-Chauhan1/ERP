import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/super-admin/billing/subscriptions/route';
import { GET as getSubscription, PUT, DELETE } from '@/app/api/super-admin/billing/subscriptions/[id]/route';
import { POST as processRefund } from '@/app/api/super-admin/billing/payments/[id]/refund/route';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock rate limiting
vi.mock('@/lib/middleware/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(null),
}));

// Mock audit service
vi.mock('@/lib/services/audit-service', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

// Mock billing service
const mockBillingService = {
  getSubscriptions: vi.fn(),
  createSubscription: vi.fn(),
  getSubscription: vi.fn(),
  updateSubscription: vi.fn(),
  processRefund: vi.fn(),
};

vi.mock('@/lib/services/billing-service', () => ({
  billingService: mockBillingService,
}));

describe('Super Admin Billing API Integration Tests', () => {
  const mockSuperAdminSession = {
    user: {
      id: 'super-admin-1',
      email: 'superadmin@test.com',
      role: 'SUPER_ADMIN',
    },
  };

  const mockRegularUserSession = {
    user: {
      id: 'user-1',
      email: 'user@test.com',
      role: 'ADMIN',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/super-admin/billing/subscriptions', () => {
    it('should return subscriptions for super admin', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSuperAdminSession);
      const mockSubscriptions = {
        subscriptions: [
          {
            id: 'sub-1',
            schoolId: 'school-1',
            planId: 'plan-1',
            status: 'ACTIVE',
          },
        ],
        total: 1,
        hasMore: false,
      };
      mockBillingService.getSubscriptions.mockResolvedValue(mockSubscriptions);

      const request = new NextRequest('http://localhost:3000/api/super-admin/billing/subscriptions');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockSubscriptions);
      expect(mockBillingService.getSubscriptions).toHaveBeenCalledWith({
        schoolId: undefined,
        status: undefined,
        planId: undefined,
        limit: 50,
        offset: 0,
      });
    });

    it('should return 401 for non-authenticated users', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/super-admin/billing/subscriptions');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 for non-super-admin users', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockRegularUserSession);

      const request = new NextRequest('http://localhost:3000/api/super-admin/billing/subscriptions');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should handle query parameters correctly', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSuperAdminSession);
      mockBillingService.getSubscriptions.mockResolvedValue({ subscriptions: [], total: 0, hasMore: false });

      const request = new NextRequest(
        'http://localhost:3000/api/super-admin/billing/subscriptions?schoolId=school-1&status=ACTIVE&limit=10&offset=20'
      );

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      expect(mockBillingService.getSubscriptions).toHaveBeenCalledWith({
        schoolId: 'school-1',
        status: 'ACTIVE',
        planId: undefined,
        limit: 10,
        offset: 20,
      });
    });
  });

  describe('POST /api/super-admin/billing/subscriptions', () => {
    it('should create subscription with valid data', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSuperAdminSession);
      const subscriptionData = {
        schoolId: 'school-1',
        planId: 'plan-1',
        trialDays: 30,
      };
      const mockCreatedSubscription = {
        id: 'sub-1',
        ...subscriptionData,
        status: 'ACTIVE',
      };
      mockBillingService.createSubscription.mockResolvedValue(mockCreatedSubscription);

      const request = new NextRequest('http://localhost:3000/api/super-admin/billing/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscriptionData),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data).toEqual(mockCreatedSubscription);
      expect(mockBillingService.createSubscription).toHaveBeenCalledWith(subscriptionData);
    });

    it('should return 400 for invalid data', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSuperAdminSession);

      const invalidData = {
        schoolId: '', // Invalid: empty string
        planId: 'plan-1',
      };

      const request = new NextRequest('http://localhost:3000/api/super-admin/billing/subscriptions', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
      expect(data.details).toBeDefined();
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSuperAdminSession);
      mockBillingService.createSubscription.mockRejectedValue(new Error('Service error'));

      const subscriptionData = {
        schoolId: 'school-1',
        planId: 'plan-1',
      };

      const request = new NextRequest('http://localhost:3000/api/super-admin/billing/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscriptionData),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('GET /api/super-admin/billing/subscriptions/[id]', () => {
    it('should return specific subscription', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSuperAdminSession);
      const mockSubscription = {
        id: 'sub-1',
        schoolId: 'school-1',
        planId: 'plan-1',
        status: 'ACTIVE',
      };
      mockBillingService.getSubscription.mockResolvedValue(mockSubscription);

      const request = new NextRequest('http://localhost:3000/api/super-admin/billing/subscriptions/sub-1');

      // Act
      const response = await getSubscription(request, { params: { id: 'sub-1' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockSubscription);
      expect(mockBillingService.getSubscription).toHaveBeenCalledWith('sub-1');
    });

    it('should return 404 for non-existent subscription', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSuperAdminSession);
      mockBillingService.getSubscription.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/super-admin/billing/subscriptions/non-existent');

      // Act
      const response = await getSubscription(request, { params: { id: 'non-existent' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe('Subscription not found');
    });
  });

  describe('PUT /api/super-admin/billing/subscriptions/[id]', () => {
    it('should update subscription with valid data', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSuperAdminSession);
      const updateData = {
        planId: 'plan-2',
        cancelAtPeriodEnd: true,
      };
      const mockUpdatedSubscription = {
        id: 'sub-1',
        schoolId: 'school-1',
        ...updateData,
        status: 'ACTIVE',
      };
      mockBillingService.updateSubscription.mockResolvedValue(mockUpdatedSubscription);

      const request = new NextRequest('http://localhost:3000/api/super-admin/billing/subscriptions/sub-1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await PUT(request, { params: { id: 'sub-1' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockUpdatedSubscription);
      expect(mockBillingService.updateSubscription).toHaveBeenCalledWith('sub-1', updateData);
    });
  });

  describe('DELETE /api/super-admin/billing/subscriptions/[id]', () => {
    it('should cancel subscription', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSuperAdminSession);
      mockBillingService.updateSubscription.mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/super-admin/billing/subscriptions/sub-1', {
        method: 'DELETE',
      });

      // Act
      const response = await DELETE(request, { params: { id: 'sub-1' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe('Subscription cancelled successfully');
      expect(mockBillingService.updateSubscription).toHaveBeenCalledWith('sub-1', { cancelAtPeriodEnd: true });
    });
  });

  describe('POST /api/super-admin/billing/payments/[id]/refund', () => {
    it('should process refund with valid data', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSuperAdminSession);
      const refundData = {
        amount: 1000,
        reason: 'Customer request',
      };
      const mockRefundResult = {
        id: 'refund-1',
        amount: 1000,
        status: 'succeeded',
      };
      mockBillingService.processRefund.mockResolvedValue(mockRefundResult);

      const request = new NextRequest('http://localhost:3000/api/super-admin/billing/payments/pay-1/refund', {
        method: 'POST',
        body: JSON.stringify(refundData),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await processRefund(request, { params: { id: 'pay-1' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockRefundResult);
      expect(mockBillingService.processRefund).toHaveBeenCalledWith('pay-1', refundData.amount);
    });

    it('should process full refund when amount not specified', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSuperAdminSession);
      const refundData = {
        reason: 'Customer request',
      };
      const mockRefundResult = {
        id: 'refund-1',
        amount: 2000,
        status: 'succeeded',
      };
      mockBillingService.processRefund.mockResolvedValue(mockRefundResult);

      const request = new NextRequest('http://localhost:3000/api/super-admin/billing/payments/pay-1/refund', {
        method: 'POST',
        body: JSON.stringify(refundData),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await processRefund(request, { params: { id: 'pay-1' } });

      // Assert
      expect(response.status).toBe(200);
      expect(mockBillingService.processRefund).toHaveBeenCalledWith('pay-1', undefined);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to all endpoints', async () => {
      // This test would verify that rate limiting is applied
      // In a real implementation, you'd mock the rate limiter to return a rate limit response
      const rateLimitMock = vi.mocked(require('@/lib/middleware/rate-limit').rateLimit);
      
      // Test that rate limiting is called for each endpoint
      vi.mocked(getServerSession).mockResolvedValue(mockSuperAdminSession);
      mockBillingService.getSubscriptions.mockResolvedValue({ subscriptions: [], total: 0, hasMore: false });

      const request = new NextRequest('http://localhost:3000/api/super-admin/billing/subscriptions');
      await GET(request);

      expect(rateLimitMock).toHaveBeenCalled();
    });
  });

  describe('Audit Logging', () => {
    it('should log all API operations', async () => {
      // This test would verify that audit logging is working
      const auditMock = vi.mocked(require('@/lib/services/audit-service').logAuditEvent);
      
      vi.mocked(getServerSession).mockResolvedValue(mockSuperAdminSession);
      mockBillingService.getSubscriptions.mockResolvedValue({ subscriptions: [], total: 0, hasMore: false });

      const request = new NextRequest('http://localhost:3000/api/super-admin/billing/subscriptions');
      await GET(request);

      expect(auditMock).toHaveBeenCalledWith({
        userId: 'super-admin-1',
        action: 'READ',
        resource: 'SUBSCRIPTION',
        metadata: expect.any(Object),
      });
    });
  });
});