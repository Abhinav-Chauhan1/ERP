/**
 * Integration Tests for Authentication Analytics API
 * 
 * Tests the authentication analytics API endpoints including:
 * - GET /api/super-admin/analytics/authentication
 * - GET /api/super-admin/analytics/authentication/events
 * - POST /api/super-admin/analytics/authentication (custom reports)
 * 
 * Requirements: 10.6 - Super admin should view usage analytics and payment status for all schools
 * Task: 11.5 - Create usage analytics integration with authentication events
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getAuthAnalytics, POST as postAuthAnalytics } from '@/app/api/super-admin/analytics/authentication/route';
import { GET as getAuthEvents, POST as postAuthEvents } from '@/app/api/super-admin/analytics/authentication/events/route';

// Mock dependencies
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/services/auth-analytics-service', () => ({
  authAnalyticsService: {
    getAuthAnalyticsDashboard: vi.fn(),
    getAuthenticationMetrics: vi.fn(),
    getUserActivityMetrics: vi.fn(),
    getSecurityMetrics: vi.fn(),
    getSystemUsageMetrics: vi.fn(),
    trackAuthenticationEvent: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({
  db: {
    auditLog: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/services/audit-service', () => ({
  logAuditEvent: vi.fn(),
}));

vi.mock('@/lib/middleware/rate-limit', () => ({
  rateLimit: vi.fn(),
}));

import { auth } from '@/auth';
import { authAnalyticsService } from '@/lib/services/auth-analytics-service';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/services/audit-service';
import { rateLimit } from '@/lib/middleware/rate-limit';

describe('Authentication Analytics API Integration Tests', () => {
  const mockSuperAdminSession = {
    user: {
      id: 'super-admin-1',
      name: 'Super Admin',
      email: 'admin@example.com',
      role: 'SUPER_ADMIN',
    },
  };

  const mockNonSuperAdminSession = {
    user: {
      id: 'user-1',
      name: 'Regular User',
      email: 'user@example.com',
      role: 'TEACHER',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (rateLimit as any).mockResolvedValue(null); // No rate limiting by default
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/super-admin/analytics/authentication', () => {
    it('should return overview analytics for super admin', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);
      
      const mockDashboardData = {
        overview: {
          totalUsers: 150,
          activeUsers: 45,
          totalSessions: 320,
          averageSessionDuration: 25.5,
          successRate: 94.2,
          securityAlerts: 2,
        },
        trends: {
          loginTrend: [
            { date: '2024-01-01', successful: 50, failed: 3, total: 53 },
            { date: '2024-01-02', successful: 48, failed: 2, total: 50 },
          ],
          userGrowthTrend: [
            { date: '2024-01-01', newUsers: 5, totalUsers: 145 },
            { date: '2024-01-02', newUsers: 3, totalUsers: 148 },
          ],
          securityTrend: [
            { date: '2024-01-01', alerts: 1, blockedAttempts: 2 },
            { date: '2024-01-02', alerts: 0, blockedAttempts: 1 },
          ],
        },
        insights: [
          {
            type: 'SUCCESS',
            title: 'Good Authentication Success Rate',
            description: 'Authentication success rate is 94.2%',
            value: 94.2,
            change: 2.1,
          },
        ],
      };

      (authAnalyticsService.getAuthAnalyticsDashboard as any).mockResolvedValue(mockDashboardData);

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/authentication?timeRange=30d&type=overview');
      const response = await getAuthAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockDashboardData);
      expect(data.metadata.timeRange.label).toBe('30d');
      expect(data.metadata.type).toBe('overview');
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'super-admin-1',
          action: 'READ',
          resource: 'AUTHENTICATION_ANALYTICS',
          resourceId: 'overview',
        })
      );
    });

    it('should return detailed analytics when type=detailed', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);
      
      const mockAuthMetrics = {
        totalLogins: 500,
        successfulLogins: 470,
        failedLogins: 30,
        successRate: 94.0,
        uniqueUsers: 150,
        newUsers: 25,
        returningUsers: 125,
        averageSessionDuration: 28.5,
        peakLoginHours: [{ hour: 9, count: 45 }, { hour: 14, count: 38 }],
        loginsByRole: [
          { role: 'STUDENT', count: 300, percentage: 60 },
          { role: 'TEACHER', count: 150, percentage: 30 },
          { role: 'PARENT', count: 50, percentage: 10 },
        ],
        loginsBySchool: [
          { schoolId: 'school1', schoolName: 'School A', count: 250, percentage: 50 },
          { schoolId: 'school2', schoolName: 'School B', count: 250, percentage: 50 },
        ],
        authMethodDistribution: [
          { method: 'OTP', count: 300, percentage: 60 },
          { method: 'PASSWORD', count: 150, percentage: 30 },
          { method: 'TOKEN', count: 50, percentage: 10 },
        ],
      };

      const mockActivityMetrics = {
        activeUsers: { daily: 45, weekly: 120, monthly: 150 },
        userEngagement: {
          averageSessionsPerUser: 2.1,
          averageTimePerSession: 28.5,
          bounceRate: 15.2,
        },
        userRetention: { day1: 85.5, day7: 72.3, day30: 45.8 },
        userGrowth: [
          { date: '2024-01-01', newUsers: 5, totalUsers: 145, growthRate: 3.6 },
        ],
        topActiveSchools: [
          {
            schoolId: 'school1',
            schoolName: 'School A',
            activeUsers: 75,
            totalSessions: 160,
            averageSessionDuration: 30.2,
          },
        ],
      };

      const mockSystemMetrics = {
        totalSessions: 320,
        averageSessionDuration: 28.5,
        peakConcurrentUsers: 85,
        systemUptime: 99.9,
        responseTimeMetrics: { average: 150, p95: 300, p99: 500 },
        featureUsage: [
          { feature: 'dashboard', usage: 450, uniqueUsers: 120 },
          { feature: 'reports', usage: 230, uniqueUsers: 85 },
        ],
        deviceDistribution: [
          { deviceType: 'Desktop', count: 200, percentage: 62.5 },
          { deviceType: 'Mobile', count: 100, percentage: 31.25 },
          { deviceType: 'Tablet', count: 20, percentage: 6.25 },
        ],
        browserDistribution: [
          { browser: 'Chrome', count: 180, percentage: 56.25 },
          { browser: 'Firefox', count: 80, percentage: 25 },
          { browser: 'Safari', count: 60, percentage: 18.75 },
        ],
      };

      (authAnalyticsService.getAuthenticationMetrics as any).mockResolvedValue(mockAuthMetrics);
      (authAnalyticsService.getUserActivityMetrics as any).mockResolvedValue(mockActivityMetrics);
      (authAnalyticsService.getSystemUsageMetrics as any).mockResolvedValue(mockSystemMetrics);

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/authentication?timeRange=30d&type=detailed');
      const response = await getAuthAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.authentication).toEqual(mockAuthMetrics);
      expect(data.data.activity).toEqual(mockActivityMetrics);
      expect(data.data.system).toEqual(mockSystemMetrics);
    });

    it('should return security analytics when type=security', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);
      
      const mockSecurityMetrics = {
        suspiciousActivities: 5,
        blockedAttempts: 12,
        rateLimitViolations: 8,
        multipleFailedLogins: 3,
        unusualLocationLogins: 2,
        securityAlerts: [
          {
            type: 'BRUTE_FORCE',
            count: 3,
            severity: 'HIGH',
            description: '3 brute force attempts detected',
          },
          {
            type: 'RATE_LIMIT',
            count: 8,
            severity: 'MEDIUM',
            description: '8 rate limit violations',
          },
        ],
        topRiskyIPs: [
          {
            ipAddress: '192.168.1.100',
            attempts: 25,
            successRate: 12.0,
            riskScore: 88.0,
          },
          {
            ipAddress: '10.0.0.50',
            attempts: 15,
            successRate: 33.3,
            riskScore: 66.7,
          },
        ],
        authenticationErrors: [
          { errorType: 'INVALID_CREDENTIALS', count: 20, percentage: 66.7 },
          { errorType: 'OTP_EXPIRED', count: 8, percentage: 26.7 },
          { errorType: 'ACCOUNT_LOCKED', count: 2, percentage: 6.7 },
        ],
      };

      (authAnalyticsService.getSecurityMetrics as any).mockResolvedValue(mockSecurityMetrics);

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/authentication?timeRange=7d&type=security');
      const response = await getAuthAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockSecurityMetrics);
      expect(data.metadata.timeRange.label).toBe('7d');
    });

    it('should apply school filter when provided', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);
      (authAnalyticsService.getAuthAnalyticsDashboard as any).mockResolvedValue({
        overview: { totalUsers: 50 },
        trends: { loginTrend: [], userGrowthTrend: [], securityTrend: [] },
        insights: [],
      });

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/authentication?schoolId=school123&type=overview');
      await getAuthAnalytics(request);

      expect(authAnalyticsService.getAuthAnalyticsDashboard).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ schoolId: 'school123' })
      );
    });

    it('should reject non-super-admin users', async () => {
      (auth as any).mockResolvedValue(mockNonSuperAdminSession);

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/authentication');
      const response = await getAuthAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });

    it('should reject unauthenticated requests', async () => {
      (auth as any).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/authentication');
      const response = await getAuthAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });

    it('should handle invalid analytics type', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/authentication?type=invalid');
      const response = await getAuthAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid analytics type');
    });

    it('should handle service errors gracefully', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);
      (authAnalyticsService.getAuthAnalyticsDashboard as any).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/authentication');
      const response = await getAuthAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to fetch authentication analytics');
    });

    it('should respect rate limiting', async () => {
      const rateLimitResponse = new Response('Rate limit exceeded', { status: 429 });
      (rateLimit as any).mockResolvedValue(rateLimitResponse);

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/authentication');
      const response = await getAuthAnalytics(request);

      expect(response.status).toBe(429);
    });
  });

  describe('POST /api/super-admin/analytics/authentication', () => {
    it('should generate custom authentication analytics report', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);
      
      const mockReportData = {
        authentication: { totalLogins: 500, successRate: 94.0 },
        activity: { activeUsers: { daily: 45 } },
        security: { suspiciousActivities: 2 },
        system: { totalSessions: 320 },
      };

      (authAnalyticsService.getAuthenticationMetrics as any).mockResolvedValue(mockReportData.authentication);
      (authAnalyticsService.getUserActivityMetrics as any).mockResolvedValue(mockReportData.activity);
      (authAnalyticsService.getSecurityMetrics as any).mockResolvedValue(mockReportData.security);
      (authAnalyticsService.getSystemUsageMetrics as any).mockResolvedValue(mockReportData.system);

      const requestBody = {
        reportName: 'Monthly Auth Report',
        timeRange: {
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-31T23:59:59.999Z',
        },
        filters: { schoolId: 'school123' },
        metrics: ['authentication', 'security'],
        format: 'json',
      };

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/authentication', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await postAuthAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.reportName).toBe('Monthly Auth Report');
      expect(data.data.metrics.authentication).toEqual(mockReportData.authentication);
      expect(data.data.filters.schoolId).toBe('school123');
      expect(data.metadata.format).toBe('json');
      
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'super-admin-1',
          action: 'CREATE',
          resource: 'AUTHENTICATION_ANALYTICS_REPORT',
          resourceId: 'Monthly Auth Report',
        })
      );
    });

    it('should validate required fields', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);

      const invalidRequestBody = {
        // Missing reportName and timeRange
        filters: {},
        format: 'json',
      };

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/authentication', {
        method: 'POST',
        body: JSON.stringify(invalidRequestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await postAuthAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    it('should validate time range', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);

      const invalidRequestBody = {
        reportName: 'Test Report',
        timeRange: {
          startDate: '2024-01-31T00:00:00.000Z',
          endDate: '2024-01-01T00:00:00.000Z', // End before start
        },
      };

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/authentication', {
        method: 'POST',
        body: JSON.stringify(invalidRequestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await postAuthAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid time range');
    });
  });

  describe('GET /api/super-admin/analytics/authentication/events', () => {
    it('should return real-time authentication events', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);
      
      const mockEvents = [
        {
          id: 'event1',
          action: 'LOGIN_SUCCESS',
          userId: 'user1',
          schoolId: 'school1',
          createdAt: new Date('2024-01-15T10:30:00Z'),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          details: { duration: 150 },
          user: {
            id: 'user1',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'STUDENT',
          },
          school: {
            id: 'school1',
            name: 'Test School',
            schoolCode: 'TS001',
          },
        },
        {
          id: 'event2',
          action: 'LOGIN_FAILURE',
          userId: 'user2',
          schoolId: 'school1',
          createdAt: new Date('2024-01-15T10:25:00Z'),
          ipAddress: '192.168.1.2',
          userAgent: 'Mozilla/5.0...',
          details: { failureReason: 'INVALID_CREDENTIALS' },
          user: {
            id: 'user2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: 'TEACHER',
          },
          school: {
            id: 'school1',
            name: 'Test School',
            schoolCode: 'TS001',
          },
        },
      ];

      (db.auditLog.count as any).mockResolvedValue(150);
      (db.auditLog.findMany as any).mockResolvedValue(mockEvents);

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/authentication/events?limit=50&eventType=all');
      const response = await getAuthEvents(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.events).toHaveLength(2);
      expect(data.data.events[0].action).toBe('LOGIN_SUCCESS');
      expect(data.data.events[0].result).toBe('SUCCESS');
      expect(data.data.events[0].severity).toBe('LOW');
      expect(data.data.events[1].action).toBe('LOGIN_FAILURE');
      expect(data.data.events[1].result).toBe('FAILURE');
      expect(data.data.summary.totalEvents).toBe(150);
      expect(data.data.summary.successfulEvents).toBe(1);
      expect(data.data.summary.failedEvents).toBe(1);
      expect(data.data.pagination.total).toBe(150);
      expect(data.data.pagination.hasMore).toBe(true);
    });

    it('should filter events by type', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);
      (db.auditLog.count as any).mockResolvedValue(25);
      (db.auditLog.findMany as any).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/authentication/events?eventType=security');
      await getAuthEvents(request);

      expect(db.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: {
              in: [
                'SUSPICIOUS_ACTIVITY',
                'RATE_LIMIT_EXCEEDED',
                'BRUTE_FORCE_ATTEMPT',
                'UNAUTHORIZED_ACCESS_ATTEMPT',
                'MULTIPLE_FAILED_LOGINS',
              ],
            },
          }),
        })
      );
    });

    it('should apply filters correctly', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);
      (db.auditLog.count as any).mockResolvedValue(10);
      (db.auditLog.findMany as any).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/super-admin/analytics/authentication/events?schoolId=school123&userId=user456&ipAddress=192.168.1.1'
      );
      await getAuthEvents(request);

      expect(db.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: 'school123',
            userId: 'user456',
            ipAddress: '192.168.1.1',
          }),
        })
      );
    });

    it('should respect pagination parameters', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);
      (db.auditLog.count as any).mockResolvedValue(500);
      (db.auditLog.findMany as any).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/authentication/events?limit=25&offset=100');
      await getAuthEvents(request);

      expect(db.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 25,
          skip: 100,
        })
      );
    });

    it('should enforce maximum limit', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);
      (db.auditLog.count as any).mockResolvedValue(1000);
      (db.auditLog.findMany as any).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/authentication/events?limit=500'); // Over max
      await getAuthEvents(request);

      expect(db.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 200, // Should be capped at 200
        })
      );
    });
  });

  describe('POST /api/super-admin/analytics/authentication/events', () => {
    it('should manually track authentication event', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);
      
      const mockAuditEntry = {
        id: 'audit123',
        createdAt: new Date(),
      };

      (db.auditLog.create as any).mockResolvedValue(mockAuditEntry);

      const requestBody = {
        eventType: 'LOGIN_SUCCESS',
        userId: 'user123',
        schoolId: 'school456',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Test Browser',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/authentication/events', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await postAuthEvents(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.eventId).toBe('audit123');
      expect(data.data.eventType).toBe('LOGIN_SUCCESS');
      
      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user123',
          schoolId: 'school456',
          action: 'LOGIN_SUCCESS',
          details: expect.objectContaining({
            manuallyCreated: true,
            createdBy: 'super-admin-1',
          }),
        }),
      });

      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'super-admin-1',
          action: 'CREATE',
          resource: 'AUTHENTICATION_EVENT',
          resourceId: 'audit123',
        })
      );
    });

    it('should validate event type', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);

      const requestBody = {
        eventType: 'INVALID_EVENT_TYPE',
        userId: 'user123',
      };

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/authentication/events', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await postAuthEvents(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid eventType');
    });

    it('should require eventType field', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);

      const requestBody = {
        userId: 'user123',
        // Missing eventType
      };

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/authentication/events', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await postAuthEvents(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required field: eventType');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);
      (db.auditLog.findMany as any).mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/authentication/events');
      const response = await getAuthEvents(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to fetch authentication events');
    });

    it('should handle malformed JSON in POST requests', async () => {
      (auth as any).mockResolvedValue(mockSuperAdminSession);

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/authentication', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await postAuthAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});