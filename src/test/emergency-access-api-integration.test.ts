import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as disableUserPOST, DELETE as enableUserDELETE } from '@/app/api/super-admin/emergency/users/[id]/disable/route';
import { POST as disableSchoolPOST, DELETE as enableSchoolDELETE } from '@/app/api/super-admin/emergency/schools/[id]/disable/route';
import { GET as getHistory } from '@/app/api/super-admin/emergency/history/route';
import { GET as getStats } from '@/app/api/super-admin/emergency/stats/route';
import { GET as getStatus } from '@/app/api/super-admin/emergency/status/route';

// Mock dependencies
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/services/emergency-access-service', () => ({
  emergencyAccessService: {
    emergencyDisableUser: vi.fn(),
    emergencyEnableUser: vi.fn(),
    emergencyDisableSchool: vi.fn(),
    emergencyEnableSchool: vi.fn(),
    getEmergencyAccessHistory: vi.fn(),
    getEmergencyAccessStats: vi.fn(),
    isEmergencyDisabled: vi.fn(),
  },
}));

vi.mock('@/lib/middleware/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(null),
}));

import { auth } from '@/auth';
import { emergencyAccessService } from '@/lib/services/emergency-access-service';

describe('Emergency Access API Integration Tests', () => {
  const mockSuperAdminSession = {
    user: {
      id: 'super-admin-123',
      name: 'Super Admin',
      email: 'admin@example.com',
      role: 'SUPER_ADMIN',
    },
  };

  const mockRegularUserSession = {
    user: {
      id: 'user-123',
      name: 'Regular User',
      email: 'user@example.com',
      role: 'STUDENT',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/super-admin/emergency/users/[id]/disable', () => {
    it('should successfully disable user with valid request', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);
      (emergencyAccessService.emergencyDisableUser as any).mockResolvedValue({
        success: true,
        message: 'User Test User has been emergency disabled',
        affectedUsers: 1,
        invalidatedSessions: 3,
      });

      const request = new NextRequest('http://localhost/api/super-admin/emergency/users/user123/disable', {
        method: 'POST',
        body: JSON.stringify({
          reason: 'Security breach - immediate action required for user safety',
          confirmationCode: 'DISABLE-USER123',
          revokeActiveSessions: true,
          preventNewLogins: true,
          notifyUsers: false,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const params = Promise.resolve({ id: 'user123' });
      const response = await disableUserPOST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('User Test User has been emergency disabled');
      expect(data.data.affectedUsers).toBe(1);
      expect(data.data.invalidatedSessions).toBe(3);
      expect(data.data.performedBy).toBe('Super Admin');

      expect(emergencyAccessService.emergencyDisableUser).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          reason: 'Security breach - immediate action required for user safety',
          revokeActiveSessions: true,
          preventNewLogins: true,
          notifyUsers: false,
        }),
        'super-admin-123'
      );
    });

    it('should reject request with invalid confirmation code', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);

      const request = new NextRequest('http://localhost/api/super-admin/emergency/users/user123/disable', {
        method: 'POST',
        body: JSON.stringify({
          reason: 'Security breach - immediate action required for user safety',
          confirmationCode: 'WRONG-CODE',
          revokeActiveSessions: true,
          preventNewLogins: true,
          notifyUsers: false,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const params = Promise.resolve({ id: 'user123' });
      const response = await disableUserPOST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid confirmation code');
      expect(data.expectedFormat).toContain('DISABLE-');
      expect(emergencyAccessService.emergencyDisableUser).not.toHaveBeenCalled();
    });

    it('should reject unauthorized requests', async () => {
      (auth as any).mockResolvedValue(mockRegularUserSession);

      const request = new NextRequest('http://localhost/api/super-admin/emergency/users/user123/disable', {
        method: 'POST',
        body: JSON.stringify({
          reason: 'Security breach',
          confirmationCode: 'DISABLE-USER123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const params = Promise.resolve({ id: 'user123' });
      const response = await disableUserPOST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(emergencyAccessService.emergencyDisableUser).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);

      const request = new NextRequest('http://localhost/api/super-admin/emergency/users/user123/disable', {
        method: 'POST',
        body: JSON.stringify({
          reason: 'Short', // Too short
          confirmationCode: 'DISABLE-USER123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const params = Promise.resolve({ id: 'user123' });
      const response = await disableUserPOST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
      expect(data.details).toBeDefined();
      expect(emergencyAccessService.emergencyDisableUser).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);
      (emergencyAccessService.emergencyDisableUser as any).mockResolvedValue({
        success: false,
        message: 'Cannot emergency disable super admin users',
        error: 'SUPER_ADMIN_PROTECTION',
      });

      const request = new NextRequest('http://localhost/api/super-admin/emergency/users/user123/disable', {
        method: 'POST',
        body: JSON.stringify({
          reason: 'Security breach - immediate action required for user safety',
          confirmationCode: 'DISABLE-USER123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const params = Promise.resolve({ id: 'user123' });
      const response = await disableUserPOST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Cannot emergency disable super admin users');
    });
  });

  describe('DELETE /api/super-admin/emergency/users/[id]/disable', () => {
    it('should successfully enable user', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);
      (emergencyAccessService.emergencyEnableUser as any).mockResolvedValue({
        success: true,
        message: 'User Test User has been emergency enabled',
        affectedUsers: 1,
      });

      const request = new NextRequest('http://localhost/api/super-admin/emergency/users/user123/disable', {
        method: 'DELETE',
        body: JSON.stringify({
          reason: 'Issue resolved - re-enabling account after investigation',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const params = Promise.resolve({ id: 'user123' });
      const response = await enableUserDELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('User Test User has been emergency enabled');
      expect(data.data.affectedUsers).toBe(1);

      expect(emergencyAccessService.emergencyEnableUser).toHaveBeenCalledWith(
        'user123',
        'Issue resolved - re-enabling account after investigation',
        'super-admin-123'
      );
    });
  });

  describe('POST /api/super-admin/emergency/schools/[id]/disable', () => {
    it('should successfully disable school with valid request', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);
      (emergencyAccessService.emergencyDisableSchool as any).mockResolvedValue({
        success: true,
        message: 'School Test School has been emergency disabled',
        affectedUsers: 25,
        invalidatedSessions: 50,
      });

      const request = new NextRequest('http://localhost/api/super-admin/emergency/schools/school123/disable', {
        method: 'POST',
        body: JSON.stringify({
          reason: 'Policy violation - immediate suspension required for compliance',
          confirmationCode: 'SCHOOL-OOL123',
          revokeActiveSessions: true,
          preventNewLogins: true,
          notifyUsers: false,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const params = Promise.resolve({ id: 'school123' });
      const response = await disableSchoolPOST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('School Test School has been emergency disabled');
      expect(data.data.affectedUsers).toBe(25);
      expect(data.data.invalidatedSessions).toBe(50);

      expect(emergencyAccessService.emergencyDisableSchool).toHaveBeenCalledWith(
        'school123',
        expect.objectContaining({
          reason: 'Policy violation - immediate suspension required for compliance',
          revokeActiveSessions: true,
          preventNewLogins: true,
          notifyUsers: false,
        }),
        'super-admin-123'
      );
    });

    it('should reject request with invalid school confirmation code', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);

      const request = new NextRequest('http://localhost/api/super-admin/emergency/schools/school123/disable', {
        method: 'POST',
        body: JSON.stringify({
          reason: 'Policy violation - immediate suspension required for compliance',
          confirmationCode: 'WRONG-CODE',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const params = Promise.resolve({ id: 'school123' });
      const response = await disableSchoolPOST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid confirmation code');
      expect(data.expectedFormat).toContain('SCHOOL-');
      expect(emergencyAccessService.emergencyDisableSchool).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/super-admin/emergency/history', () => {
    it('should return emergency access history with filters', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);
      (emergencyAccessService.getEmergencyAccessHistory as any).mockResolvedValue({
        history: [
          {
            id: 'emergency-1',
            targetType: 'USER',
            targetId: 'user-123',
            targetName: 'Test User',
            action: 'DISABLE',
            reason: 'Security breach',
            performedBy: 'super-admin-123',
            performedByName: 'Super Admin',
            performedAt: new Date('2024-01-01T10:00:00Z'),
            affectedUsers: 1,
            invalidatedSessions: 2,
            isReversed: false,
          },
        ],
        total: 1,
        hasMore: false,
      });

      const request = new NextRequest('http://localhost/api/super-admin/emergency/history?targetType=USER&limit=10');
      const response = await getHistory(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.history).toHaveLength(1);
      expect(data.data.total).toBe(1);
      expect(data.data.hasMore).toBe(false);
      expect(data.data.pagination).toBeDefined();

      expect(emergencyAccessService.getEmergencyAccessHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          targetType: 'USER',
          limit: 10,
          offset: 0,
        })
      );
    });

    it('should handle invalid query parameters', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);

      const request = new NextRequest('http://localhost/api/super-admin/emergency/history?targetType=INVALID&limit=abc');
      const response = await getHistory(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
      expect(data.details).toBeDefined();
    });
  });

  describe('GET /api/super-admin/emergency/stats', () => {
    it('should return emergency access statistics', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);
      (emergencyAccessService.getEmergencyAccessStats as any).mockResolvedValue({
        totalEmergencyActions: 25,
        activeDisabledAccounts: 5,
        recentActions: 3,
        topReasons: [
          { reason: 'Security breach', count: 8 },
          { reason: 'Policy violation', count: 5 },
        ],
      });

      const request = new NextRequest('http://localhost/api/super-admin/emergency/stats');
      const response = await getStats(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.totalEmergencyActions).toBe(25);
      expect(data.data.activeDisabledAccounts).toBe(5);
      expect(data.data.recentActions).toBe(3);
      expect(data.data.topReasons).toHaveLength(2);
      expect(data.data.generatedAt).toBeDefined();
    });
  });

  describe('GET /api/super-admin/emergency/status', () => {
    it('should return emergency disabled status', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);
      (emergencyAccessService.isEmergencyDisabled as any).mockResolvedValue({
        isDisabled: true,
        reason: 'Security breach',
        disabledAt: new Date('2024-01-01T10:00:00Z'),
        disabledUntil: new Date('2024-01-02T10:00:00Z'),
        performedBy: 'Super Admin',
      });

      const request = new NextRequest('http://localhost/api/super-admin/emergency/status?targetType=USER&targetId=user123');
      const response = await getStatus(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.targetType).toBe('USER');
      expect(data.data.targetId).toBe('user123');
      expect(data.data.isDisabled).toBe(true);
      expect(data.data.reason).toBe('Security breach');
      expect(data.data.performedBy).toBe('Super Admin');
      expect(data.data.checkedAt).toBeDefined();
      expect(data.data.checkedBy).toBe('Super Admin');

      expect(emergencyAccessService.isEmergencyDisabled).toHaveBeenCalledWith('USER', 'user123');
    });

    it('should return active status for non-disabled account', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);
      (emergencyAccessService.isEmergencyDisabled as any).mockResolvedValue({
        isDisabled: false,
      });

      const request = new NextRequest('http://localhost/api/super-admin/emergency/status?targetType=SCHOOL&targetId=school123');
      const response = await getStatus(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.isDisabled).toBe(false);
      expect(data.data.reason).toBeUndefined();
    });

    it('should handle missing query parameters', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);

      const request = new NextRequest('http://localhost/api/super-admin/emergency/status');
      const response = await getStatus(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
      expect(data.details).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to emergency endpoints', async () => {
      const { rateLimit } = await import('@/lib/middleware/rate-limit');
      
      // Mock rate limit exceeded
      (rateLimit as any).mockResolvedValue(
        new Response('Rate limit exceeded', { status: 429 })
      );

      const request = new NextRequest('http://localhost/api/super-admin/emergency/users/user123/disable', {
        method: 'POST',
        body: JSON.stringify({
          reason: 'Security breach',
          confirmationCode: 'DISABLE-USER123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const params = Promise.resolve({ id: 'user123' });
      const response = await disableUserPOST(request, { params });

      expect(response.status).toBe(429);
      expect(rateLimit).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 5, // Very restrictive for emergency actions
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle service exceptions gracefully', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);
      (emergencyAccessService.emergencyDisableUser as any).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost/api/super-admin/emergency/users/user123/disable', {
        method: 'POST',
        body: JSON.stringify({
          reason: 'Security breach - immediate action required for user safety',
          confirmationCode: 'DISABLE-USER123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const params = Promise.resolve({ id: 'user123' });
      const response = await disableUserPOST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle malformed JSON requests', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);

      const request = new NextRequest('http://localhost/api/super-admin/emergency/users/user123/disable', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const params = Promise.resolve({ id: 'user123' });
      const response = await disableUserPOST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});