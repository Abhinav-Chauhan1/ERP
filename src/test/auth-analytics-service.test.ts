/**
 * Unit Tests for Authentication Analytics Service
 * 
 * Tests the authentication analytics service functionality including:
 * - Authentication metrics calculation
 * - User activity tracking
 * - Security metrics monitoring
 * - Dashboard data generation
 * 
 * Requirements: 10.6 - Super admin should view usage analytics and payment status for all schools
 * Task: 11.5 - Create usage analytics integration with authentication events
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authAnalyticsService } from '@/lib/services/auth-analytics-service';
import { db } from '@/lib/db';
import { subDays } from 'date-fns';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    auditLog: {
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    authSession: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    user: {
      count: vi.fn(),
    },
    school: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    analyticsEvent: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('AuthAnalyticsService', () => {
  const mockTimeRange = {
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAuthenticationMetrics', () => {
    it('should calculate basic authentication metrics correctly', async () => {
      // Mock audit log data
      const mockAuditLogs = [
        {
          id: '1',
          action: 'LOGIN_SUCCESS',
          userId: 'user1',
          schoolId: 'school1',
          createdAt: new Date(),
          user: { id: 'user1', name: 'User 1', role: 'STUDENT', createdAt: new Date() },
          school: { id: 'school1', name: 'School 1' },
          details: { metadata: { authMethod: 'OTP' } },
        },
        {
          id: '2',
          action: 'LOGIN_FAILURE',
          userId: 'user2',
          schoolId: 'school1',
          createdAt: new Date(),
          user: { id: 'user2', name: 'User 2', role: 'TEACHER', createdAt: new Date() },
          school: { id: 'school1', name: 'School 1' },
          details: { metadata: { authMethod: 'PASSWORD' } },
        },
        {
          id: '3',
          action: 'AUTH_SUCCESS',
          userId: 'user3',
          schoolId: 'school2',
          createdAt: new Date(),
          user: { id: 'user3', name: 'User 3', role: 'PARENT', createdAt: new Date() },
          school: { id: 'school2', name: 'School 2' },
          details: { metadata: { authMethod: 'TOKEN' } },
        },
      ];

      (db.auditLog.findMany as any).mockResolvedValue(mockAuditLogs);
      (db.auditLog.groupBy as any).mockResolvedValue([
        { userId: 'user1', _min: { createdAt: subDays(new Date(), 10) } },
        { userId: 'user2', _min: { createdAt: subDays(new Date(), 5) } },
        { userId: 'user3', _min: { createdAt: subDays(new Date(), 20) } },
      ]);
      (db.authSession.findMany as any).mockResolvedValue([
        {
          id: 'session1',
          userId: 'user1',
          createdAt: new Date(),
          lastAccessAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes later
        },
      ]);

      const result = await authAnalyticsService.getAuthenticationMetrics(mockTimeRange);

      expect(result.totalLogins).toBe(3);
      expect(result.successfulLogins).toBe(2);
      expect(result.failedLogins).toBe(1);
      expect(result.successRate).toBeCloseTo(66.67, 1);
      expect(result.uniqueUsers).toBe(3);
      expect(result.loginsByRole).toHaveLength(3);
      expect(result.loginsBySchool).toHaveLength(2);
      expect(result.authMethodDistribution).toHaveLength(3);
    });

    it('should handle empty data gracefully', async () => {
      (db.auditLog.findMany as any).mockResolvedValue([]);
      (db.auditLog.groupBy as any).mockResolvedValue([]);
      (db.authSession.findMany as any).mockResolvedValue([]);

      const result = await authAnalyticsService.getAuthenticationMetrics(mockTimeRange);

      expect(result.totalLogins).toBe(0);
      expect(result.successfulLogins).toBe(0);
      expect(result.failedLogins).toBe(0);
      expect(result.successRate).toBe(0);
      expect(result.uniqueUsers).toBe(0);
      expect(result.newUsers).toBe(0);
      expect(result.returningUsers).toBe(0);
    });

    it('should apply filters correctly', async () => {
      const filters = { schoolId: 'school1', userId: 'user1' };
      
      (db.auditLog.findMany as any).mockResolvedValue([]);
      (db.auditLog.groupBy as any).mockResolvedValue([]);
      (db.authSession.findMany as any).mockResolvedValue([]);

      await authAnalyticsService.getAuthenticationMetrics(mockTimeRange, filters);

      expect(db.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: 'school1',
            userId: 'user1',
          }),
        })
      );
    });
  });

  describe('getUserActivityMetrics', () => {
    it('should calculate user activity metrics correctly', async () => {
      const mockSessions = [
        {
          id: 'session1',
          userId: 'user1',
          createdAt: new Date(),
          lastAccessAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
          user: { id: 'user1', role: 'STUDENT', createdAt: new Date() },
        },
        {
          id: 'session2',
          userId: 'user2',
          createdAt: new Date(),
          lastAccessAt: new Date(Date.now() + 60 * 60 * 1000), // 60 minutes
          user: { id: 'user2', role: 'TEACHER', createdAt: new Date() },
        },
      ];

      (db.authSession.findMany as any).mockResolvedValue(mockSessions);
      (db.auditLog.findMany as any).mockResolvedValue([]);
      (db.user.count as any).mockResolvedValue(100);
      (db.school.findMany as any).mockResolvedValue([]);
      (db.auditLog.groupBy as any).mockResolvedValue([]);

      const result = await authAnalyticsService.getUserActivityMetrics(mockTimeRange);

      expect(result.userEngagement.averageSessionsPerUser).toBe(1); // 2 sessions / 2 unique users
      expect(result.userEngagement.averageTimePerSession).toBe(45); // (30 + 60) / 2
      expect(result.userEngagement.bounceRate).toBe(0); // No sessions < 1 minute
    });

    it('should calculate bounce rate correctly', async () => {
      const mockSessions = [
        {
          id: 'session1',
          userId: 'user1',
          createdAt: new Date(),
          lastAccessAt: new Date(Date.now() + 30 * 1000), // 30 seconds (bounce)
          user: { id: 'user1', role: 'STUDENT', createdAt: new Date() },
        },
        {
          id: 'session2',
          userId: 'user2',
          createdAt: new Date(),
          lastAccessAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
          user: { id: 'user2', role: 'TEACHER', createdAt: new Date() },
        },
      ];

      (db.authSession.findMany as any).mockResolvedValue(mockSessions);
      (db.auditLog.findMany as any).mockResolvedValue([]);
      (db.user.count as any).mockResolvedValue(100);
      (db.school.findMany as any).mockResolvedValue([]);
      (db.auditLog.groupBy as any).mockResolvedValue([]);

      const result = await authAnalyticsService.getUserActivityMetrics(mockTimeRange);

      expect(result.userEngagement.bounceRate).toBe(50); // 1 out of 2 sessions bounced
    });
  });

  describe('getSecurityMetrics', () => {
    it('should calculate security metrics correctly', async () => {
      const mockSecurityEvents = [
        {
          id: '1',
          action: 'SUSPICIOUS_ACTIVITY',
          ipAddress: '192.168.1.1',
          createdAt: new Date(),
        },
        {
          id: '2',
          action: 'RATE_LIMIT_EXCEEDED',
          ipAddress: '192.168.1.2',
          createdAt: new Date(),
        },
        {
          id: '3',
          action: 'LOGIN_FAILURE',
          ipAddress: '192.168.1.1',
          userId: 'user1',
          createdAt: new Date(),
        },
        {
          id: '4',
          action: 'LOGIN_FAILURE',
          ipAddress: '192.168.1.1',
          userId: 'user1',
          createdAt: new Date(),
        },
        {
          id: '5',
          action: 'LOGIN_FAILURE',
          ipAddress: '192.168.1.1',
          userId: 'user1',
          createdAt: new Date(),
        },
      ];

      (db.auditLog.findMany as any).mockResolvedValue(mockSecurityEvents);

      const result = await authAnalyticsService.getSecurityMetrics(mockTimeRange);

      expect(result.suspiciousActivities).toBe(1);
      expect(result.rateLimitViolations).toBe(1);
      expect(result.multipleFailedLogins).toBe(1); // user1 has 3 failures
      expect(result.securityAlerts).toHaveLength(2); // BRUTE_FORCE and RATE_LIMIT alerts
      expect(result.topRiskyIPs).toHaveLength(2);
      
      // Check that the IP with more failures has higher risk score
      const riskyIP = result.topRiskyIPs.find(ip => ip.ipAddress === '192.168.1.1');
      expect(riskyIP?.riskScore).toBeGreaterThan(90); // High risk due to multiple failures
    });

    it('should generate appropriate security alerts', async () => {
      const mockSecurityEvents = [
        { id: '1', action: 'BRUTE_FORCE_ATTEMPT', createdAt: new Date() },
        { id: '2', action: 'BRUTE_FORCE_ATTEMPT', createdAt: new Date() },
        { id: '3', action: 'RATE_LIMIT_EXCEEDED', createdAt: new Date() },
      ];

      (db.auditLog.findMany as any).mockResolvedValue(mockSecurityEvents);

      const result = await authAnalyticsService.getSecurityMetrics(mockTimeRange);

      expect(result.securityAlerts).toHaveLength(2);
      
      const bruteForceAlert = result.securityAlerts.find(alert => alert.type === 'BRUTE_FORCE');
      expect(bruteForceAlert?.count).toBe(2);
      expect(bruteForceAlert?.severity).toBe('HIGH');

      const rateLimitAlert = result.securityAlerts.find(alert => alert.type === 'RATE_LIMIT');
      expect(rateLimitAlert?.count).toBe(1);
      expect(rateLimitAlert?.severity).toBe('MEDIUM');
    });
  });

  describe('getAuthAnalyticsDashboard', () => {
    it('should generate comprehensive dashboard data', async () => {
      // Mock all required data
      (db.auditLog.findMany as any).mockResolvedValue([
        {
          id: '1',
          action: 'LOGIN_SUCCESS',
          userId: 'user1',
          createdAt: new Date(),
          user: { id: 'user1', name: 'User 1', role: 'STUDENT', createdAt: new Date() },
          details: { metadata: { authMethod: 'OTP' } },
        },
      ]);
      (db.auditLog.groupBy as any).mockResolvedValue([]);
      (db.auditLog.count as any).mockResolvedValue(1);
      (db.authSession.findMany as any).mockResolvedValue([
        {
          id: 'session1',
          userId: 'user1',
          createdAt: new Date(),
          lastAccessAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      ]);
      (db.user.count as any).mockResolvedValue(100);
      (db.school.findMany as any).mockResolvedValue([]);
      (db.analyticsEvent.findMany as any).mockResolvedValue([]);

      const result = await authAnalyticsService.getAuthAnalyticsDashboard(mockTimeRange);

      expect(result.overview).toBeDefined();
      expect(result.overview.totalUsers).toBe(1);
      expect(result.overview.successRate).toBe(100);
      expect(result.trends).toBeDefined();
      expect(result.trends.loginTrend).toBeDefined();
      expect(result.trends.userGrowthTrend).toBeDefined();
      expect(result.trends.securityTrend).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
    });

    it('should generate appropriate insights based on data', async () => {
      // Mock data with low success rate
      (db.auditLog.findMany as any).mockResolvedValue([
        { id: '1', action: 'LOGIN_SUCCESS', userId: 'user1', createdAt: new Date(), user: { id: 'user1', role: 'STUDENT', createdAt: new Date() } },
        { id: '2', action: 'LOGIN_FAILURE', userId: 'user2', createdAt: new Date(), user: { id: 'user2', role: 'STUDENT', createdAt: new Date() } },
        { id: '3', action: 'LOGIN_FAILURE', userId: 'user3', createdAt: new Date(), user: { id: 'user3', role: 'STUDENT', createdAt: new Date() } },
        { id: '4', action: 'SUSPICIOUS_ACTIVITY', userId: 'user4', createdAt: new Date(), user: { id: 'user4', role: 'STUDENT', createdAt: new Date() } },
      ]);
      (db.auditLog.groupBy as any).mockResolvedValue([]);
      (db.authSession.findMany as any).mockResolvedValue([]);
      (db.user.count as any).mockResolvedValue(100);
      (db.school.findMany as any).mockResolvedValue([]);
      (db.analyticsEvent.findMany as any).mockResolvedValue([]);

      const result = await authAnalyticsService.getAuthAnalyticsDashboard(mockTimeRange);

      // Should generate warning insight for low success rate
      const warningInsight = result.insights.find(insight => insight.type === 'WARNING');
      expect(warningInsight).toBeDefined();
      expect(warningInsight?.title).toContain('Low Authentication Success Rate');

      // Should generate error insight for security alerts
      const errorInsight = result.insights.find(insight => insight.type === 'ERROR');
      expect(errorInsight).toBeDefined();
      expect(errorInsight?.title).toContain('Security Alerts Detected');
    });
  });

  describe('trackAuthenticationEvent', () => {
    it('should track authentication events correctly', async () => {
      (db.analyticsEvent.create as any).mockResolvedValue({
        id: 'event1',
        eventType: 'AUTH_LOGIN_SUCCESS',
        userId: 'user1',
        schoolId: 'school1',
      });

      await authAnalyticsService.trackAuthenticationEvent(
        'LOGIN_SUCCESS',
        'user1',
        'school1',
        { ipAddress: '192.168.1.1', userAgent: 'Test Browser' }
      );

      expect(db.analyticsEvent.create).toHaveBeenCalledWith({
        data: {
          eventType: 'AUTH_LOGIN_SUCCESS',
          userId: 'user1',
          schoolId: 'school1',
          properties: expect.objectContaining({
            timestamp: expect.any(Date),
            ipAddress: '192.168.1.1',
            userAgent: 'Test Browser',
          }),
        },
      });
    });

    it('should handle tracking errors gracefully', async () => {
      (db.analyticsEvent.create as any).mockRejectedValue(new Error('Database error'));

      // Should not throw error
      await expect(
        authAnalyticsService.trackAuthenticationEvent('LOGIN_SUCCESS', 'user1', 'school1')
      ).resolves.toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      (db.auditLog.findMany as any).mockRejectedValue(new Error('Database connection failed'));

      await expect(
        authAnalyticsService.getAuthenticationMetrics(mockTimeRange)
      ).rejects.toThrow('Failed to get authentication metrics');
    });

    it('should handle partial data failures', async () => {
      // Mock successful auth metrics but failed security metrics
      (db.auditLog.findMany as any)
        .mockResolvedValueOnce([]) // For auth metrics
        .mockRejectedValueOnce(new Error('Security data unavailable')); // For security metrics
      
      (db.auditLog.groupBy as any).mockResolvedValue([]);
      (db.authSession.findMany as any).mockResolvedValue([]);

      const authResult = await authAnalyticsService.getAuthenticationMetrics(mockTimeRange);
      expect(authResult).toBeDefined();

      await expect(
        authAnalyticsService.getSecurityMetrics(mockTimeRange)
      ).rejects.toThrow('Failed to get security metrics');
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      // Mock large dataset
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: `event${i}`,
        action: i % 2 === 0 ? 'LOGIN_SUCCESS' : 'LOGIN_FAILURE',
        userId: `user${i % 100}`,
        schoolId: `school${i % 10}`,
        createdAt: new Date(),
        user: { id: `user${i % 100}`, role: 'STUDENT', createdAt: new Date() },
        details: { metadata: { authMethod: 'OTP' } },
      }));

      (db.auditLog.findMany as any).mockResolvedValue(largeDataset);
      (db.auditLog.groupBy as any).mockResolvedValue([]);
      (db.authSession.findMany as any).mockResolvedValue([]);

      const startTime = Date.now();
      const result = await authAnalyticsService.getAuthenticationMetrics(mockTimeRange);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(result.totalLogins).toBe(10000);
      expect(result.successfulLogins).toBe(5000);
      expect(result.failedLogins).toBe(5000);
      expect(result.successRate).toBe(50);
      
      // Should complete within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});