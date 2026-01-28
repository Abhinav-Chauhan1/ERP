/**
 * Property-Based Tests for Authentication Analytics System
 * 
 * Tests universal properties that should hold across all valid executions
 * of the authentication analytics system.
 * 
 * **Feature: unified-auth-multitenant-refactor, Property 1: Authentication Event Tracking Consistency**
 * **Validates: Requirements 10.6**
 * 
 * Requirements: 10.6 - Super admin should view usage analytics and payment status for all schools
 * Task: 11.5 - Create usage analytics integration with authentication events
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { authAnalyticsService } from '@/lib/services/auth-analytics-service';
import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';
import { subDays, addDays } from 'date-fns';

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

describe('Authentication Analytics System - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Generators for test data
  const userRoleArb = fc.constantFrom('STUDENT', 'TEACHER', 'PARENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN');
  const authActionArb = fc.constantFrom('LOGIN_SUCCESS', 'LOGIN_FAILURE', 'AUTH_SUCCESS', 'AUTH_FAILED');
  const authMethodArb = fc.constantFrom('OTP', 'PASSWORD', 'TOKEN');
  
  const auditLogArb = fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }),
    action: authActionArb,
    userId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
    schoolId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
    createdAt: fc.date({ min: subDays(new Date(), 365), max: new Date() }),
    ipAddress: fc.option(fc.ipV4(), { nil: null }),
    userAgent: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: null }),
    user: fc.option(fc.record({
      id: fc.string({ minLength: 1, maxLength: 50 }),
      name: fc.string({ minLength: 1, maxLength: 100 }),
      role: userRoleArb,
      createdAt: fc.date({ min: subDays(new Date(), 365), max: new Date() }),
    }), { nil: null }),
    school: fc.option(fc.record({
      id: fc.string({ minLength: 1, maxLength: 50 }),
      name: fc.string({ minLength: 1, maxLength: 100 }),
      schoolCode: fc.string({ minLength: 3, maxLength: 10 }),
    }), { nil: null }),
    details: fc.option(fc.record({
      metadata: fc.option(fc.record({
        authMethod: authMethodArb,
        duration: fc.option(fc.integer({ min: 0, max: 10000 }), { nil: undefined }),
        failureReason: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
      }), { nil: undefined }),
    }), { nil: null }),
  });

  const authSessionArb = fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }),
    userId: fc.string({ minLength: 1, maxLength: 50 }),
    createdAt: fc.date({ min: subDays(new Date(), 30), max: new Date() }),
    lastAccessAt: fc.date({ min: subDays(new Date(), 30), max: addDays(new Date(), 1) }),
    user: fc.option(fc.record({
      id: fc.string({ minLength: 1, maxLength: 50 }),
      role: userRoleArb,
      createdAt: fc.date({ min: subDays(new Date(), 365), max: new Date() }),
    }), { nil: null }),
  });

  const timeRangeArb = fc.record({
    startDate: fc.date({ min: subDays(new Date(), 365), max: subDays(new Date(), 1) }),
    endDate: fc.date({ min: subDays(new Date(), 1), max: new Date() }),
  }).filter(({ startDate, endDate }) => startDate < endDate);

  /**
   * **Feature: unified-auth-multitenant-refactor, Property 1: Authentication Metrics Consistency**
   * **Validates: Requirements 10.6**
   * 
   * For any set of authentication events, the calculated metrics should be mathematically consistent:
   * - Total logins = Successful logins + Failed logins
   * - Success rate = (Successful logins / Total logins) * 100
   * - Unique users count should never exceed total logins
   * - Percentages in distributions should sum to approximately 100%
   */
  it('Property 1: Authentication metrics should be mathematically consistent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(auditLogArb, { minLength: 1, maxLength: 100 }),
        timeRangeArb,
        async (auditLogs, timeRange) => {
          // Setup mocks
          (db.auditLog.findMany as any).mockResolvedValue(auditLogs);
          (db.auditLog.groupBy as any).mockResolvedValue(
            auditLogs
              .filter(log => log.userId)
              .map(log => ({ userId: log.userId, _min: { createdAt: log.createdAt } }))
          );
          (db.authSession.findMany as any).mockResolvedValue([]);

          const metrics = await authAnalyticsService.getAuthenticationMetrics(timeRange);

          // Property: Total logins = Successful + Failed
          expect(metrics.totalLogins).toBe(metrics.successfulLogins + metrics.failedLogins);

          // Property: Success rate calculation
          if (metrics.totalLogins > 0) {
            const expectedSuccessRate = (metrics.successfulLogins / metrics.totalLogins) * 100;
            expect(Math.abs(metrics.successRate - expectedSuccessRate)).toBeLessThan(0.01);
          } else {
            expect(metrics.successRate).toBe(0);
          }

          // Property: Unique users should not exceed total logins
          expect(metrics.uniqueUsers).toBeLessThanOrEqual(metrics.totalLogins);

          // Property: New users + Returning users should equal unique users
          expect(metrics.newUsers + metrics.returningUsers).toBe(metrics.uniqueUsers);

          // Property: Role distribution percentages should sum to ~100%
          if (metrics.loginsByRole.length > 0) {
            const totalPercentage = metrics.loginsByRole.reduce((sum, role) => sum + role.percentage, 0);
            expect(Math.abs(totalPercentage - 100)).toBeLessThan(0.1);
          }

          // Property: School distribution percentages should sum to ~100%
          if (metrics.loginsBySchool.length > 0) {
            const totalPercentage = metrics.loginsBySchool.reduce((sum, school) => sum + school.percentage, 0);
            expect(Math.abs(totalPercentage - 100)).toBeLessThan(0.1);
          }

          // Property: Auth method distribution percentages should sum to ~100%
          if (metrics.authMethodDistribution.length > 0) {
            const totalPercentage = metrics.authMethodDistribution.reduce((sum, method) => sum + method.percentage, 0);
            expect(Math.abs(totalPercentage - 100)).toBeLessThan(0.1);
          }

          // Property: All counts should be non-negative
          expect(metrics.totalLogins).toBeGreaterThanOrEqual(0);
          expect(metrics.successfulLogins).toBeGreaterThanOrEqual(0);
          expect(metrics.failedLogins).toBeGreaterThanOrEqual(0);
          expect(metrics.uniqueUsers).toBeGreaterThanOrEqual(0);
          expect(metrics.newUsers).toBeGreaterThanOrEqual(0);
          expect(metrics.returningUsers).toBeGreaterThanOrEqual(0);
          expect(metrics.averageSessionDuration).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: unified-auth-multitenant-refactor, Property 2: User Activity Metrics Consistency**
   * **Validates: Requirements 10.6**
   * 
   * For any set of user sessions, the activity metrics should be logically consistent:
   * - Average sessions per user = Total sessions / Unique users
   * - Bounce rate should be between 0 and 100%
   * - Active user counts should follow logical hierarchy (daily ≤ weekly ≤ monthly)
   */
  it('Property 2: User activity metrics should be logically consistent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(authSessionArb, { minLength: 1, maxLength: 100 }),
        timeRangeArb,
        async (sessions, timeRange) => {
          // Setup mocks
          (db.authSession.findMany as any).mockResolvedValue(sessions);
          (db.auditLog.findMany as any).mockResolvedValue([]);
          (db.user.count as any).mockResolvedValue(100);
          (db.school.findMany as any).mockResolvedValue([]);
          (db.auditLog.groupBy as any).mockResolvedValue([]);

          const metrics = await authAnalyticsService.getUserActivityMetrics(timeRange);

          // Property: Average sessions per user calculation
          const uniqueUsers = new Set(sessions.map(s => s.userId)).size;
          if (uniqueUsers > 0) {
            const expectedAvgSessions = sessions.length / uniqueUsers;
            expect(Math.abs(metrics.userEngagement.averageSessionsPerUser - expectedAvgSessions)).toBeLessThan(0.01);
          }

          // Property: Bounce rate should be between 0 and 100%
          expect(metrics.userEngagement.bounceRate).toBeGreaterThanOrEqual(0);
          expect(metrics.userEngagement.bounceRate).toBeLessThanOrEqual(100);

          // Property: Average time per session should be non-negative
          expect(metrics.userEngagement.averageTimePerSession).toBeGreaterThanOrEqual(0);

          // Property: Active user hierarchy (daily ≤ weekly ≤ monthly)
          expect(metrics.activeUsers.daily).toBeLessThanOrEqual(metrics.activeUsers.weekly);
          expect(metrics.activeUsers.weekly).toBeLessThanOrEqual(metrics.activeUsers.monthly);

          // Property: All active user counts should be non-negative
          expect(metrics.activeUsers.daily).toBeGreaterThanOrEqual(0);
          expect(metrics.activeUsers.weekly).toBeGreaterThanOrEqual(0);
          expect(metrics.activeUsers.monthly).toBeGreaterThanOrEqual(0);

          // Property: Retention rates should be between 0 and 100%
          expect(metrics.userRetention.day1).toBeGreaterThanOrEqual(0);
          expect(metrics.userRetention.day1).toBeLessThanOrEqual(100);
          expect(metrics.userRetention.day7).toBeGreaterThanOrEqual(0);
          expect(metrics.userRetention.day7).toBeLessThanOrEqual(100);
          expect(metrics.userRetention.day30).toBeGreaterThanOrEqual(0);
          expect(metrics.userRetention.day30).toBeLessThanOrEqual(100);

          // Property: User growth data should have consistent totals
          for (let i = 1; i < metrics.userGrowth.length; i++) {
            const prev = metrics.userGrowth[i - 1];
            const curr = metrics.userGrowth[i];
            expect(curr.totalUsers).toBeGreaterThanOrEqual(prev.totalUsers);
            expect(curr.totalUsers - prev.totalUsers).toBe(curr.newUsers);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: unified-auth-multitenant-refactor, Property 3: Security Metrics Accuracy**
   * **Validates: Requirements 10.6**
   * 
   * For any set of security events, the security metrics should accurately reflect the data:
   * - Risk scores should be between 0 and 100
   * - Security alert counts should match event counts
   * - Error percentages should sum to 100%
   */
  it('Property 3: Security metrics should accurately reflect security events', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(auditLogArb.map(log => ({
          ...log,
          action: fc.sample(fc.constantFrom(
            'SUSPICIOUS_ACTIVITY',
            'RATE_LIMIT_EXCEEDED',
            'BRUTE_FORCE_ATTEMPT',
            'UNAUTHORIZED_ACCESS_ATTEMPT',
            'LOGIN_FAILURE',
            'AUTH_FAILED'
          ), 1)[0]
        })), { minLength: 1, maxLength: 100 }),
        timeRangeArb,
        async (securityEvents, timeRange) => {
          // Setup mocks
          (db.auditLog.findMany as any).mockResolvedValue(securityEvents);

          const metrics = await authAnalyticsService.getSecurityMetrics(timeRange);

          // Property: All security counts should be non-negative
          expect(metrics.suspiciousActivities).toBeGreaterThanOrEqual(0);
          expect(metrics.blockedAttempts).toBeGreaterThanOrEqual(0);
          expect(metrics.rateLimitViolations).toBeGreaterThanOrEqual(0);
          expect(metrics.multipleFailedLogins).toBeGreaterThanOrEqual(0);
          expect(metrics.unusualLocationLogins).toBeGreaterThanOrEqual(0);

          // Property: Security alert counts should match filtered events
          const suspiciousCount = securityEvents.filter(e => e.action === 'SUSPICIOUS_ACTIVITY').length;
          expect(metrics.suspiciousActivities).toBe(suspiciousCount);

          const rateLimitCount = securityEvents.filter(e => e.action === 'RATE_LIMIT_EXCEEDED').length;
          expect(metrics.rateLimitViolations).toBe(rateLimitCount);

          // Property: Risk scores should be between 0 and 100
          metrics.topRiskyIPs.forEach(ip => {
            expect(ip.riskScore).toBeGreaterThanOrEqual(0);
            expect(ip.riskScore).toBeLessThanOrEqual(100);
            expect(ip.attempts).toBeGreaterThan(0);
            expect(ip.successRate).toBeGreaterThanOrEqual(0);
            expect(ip.successRate).toBeLessThanOrEqual(100);
          });

          // Property: Authentication error percentages should sum to ~100%
          if (metrics.authenticationErrors.length > 0) {
            const totalPercentage = metrics.authenticationErrors.reduce((sum, error) => sum + error.percentage, 0);
            expect(Math.abs(totalPercentage - 100)).toBeLessThan(0.1);
          }

          // Property: Security alert severities should be valid
          metrics.securityAlerts.forEach(alert => {
            expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(alert.severity);
            expect(alert.count).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: unified-auth-multitenant-refactor, Property 4: Time Range Filtering Accuracy**
   * **Validates: Requirements 10.6**
   * 
   * For any time range filter, only events within that range should be included in metrics:
   * - All returned events should fall within the specified time range
   * - Metrics should be consistent with the filtered data
   */
  it('Property 4: Time range filtering should be accurate and consistent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(auditLogArb, { minLength: 10, maxLength: 100 }),
        timeRangeArb,
        async (allEvents, timeRange) => {
          // Filter events that should be within the time range
          const eventsInRange = allEvents.filter(event => 
            event.createdAt >= timeRange.startDate && event.createdAt <= timeRange.endDate
          );

          // Setup mocks to return only events in range
          (db.auditLog.findMany as any).mockResolvedValue(eventsInRange);
          (db.auditLog.groupBy as any).mockResolvedValue(
            eventsInRange
              .filter(log => log.userId)
              .map(log => ({ userId: log.userId, _min: { createdAt: log.createdAt } }))
          );
          (db.authSession.findMany as any).mockResolvedValue([]);

          const metrics = await authAnalyticsService.getAuthenticationMetrics(timeRange);

          // Property: Total logins should match filtered events count
          expect(metrics.totalLogins).toBe(eventsInRange.length);

          // Property: Successful logins should match filtered successful events
          const successfulEvents = eventsInRange.filter(e => 
            e.action === 'LOGIN_SUCCESS' || e.action === 'AUTH_SUCCESS'
          );
          expect(metrics.successfulLogins).toBe(successfulEvents.length);

          // Property: Failed logins should match filtered failed events
          const failedEvents = eventsInRange.filter(e => 
            e.action === 'LOGIN_FAILURE' || e.action === 'AUTH_FAILED'
          );
          expect(metrics.failedLogins).toBe(failedEvents.length);

          // Property: Unique users should match unique user IDs in filtered events
          const uniqueUserIds = new Set(eventsInRange.map(e => e.userId).filter(Boolean));
          expect(metrics.uniqueUsers).toBe(uniqueUserIds.size);

          // Property: Role distribution should only include roles from filtered events
          const rolesInEvents = new Set(eventsInRange.map(e => e.user?.role).filter(Boolean));
          metrics.loginsByRole.forEach(roleData => {
            expect(rolesInEvents.has(roleData.role as UserRole)).toBe(true);
          });

          // Property: School distribution should only include schools from filtered events
          const schoolsInEvents = new Set(eventsInRange.map(e => e.schoolId).filter(Boolean));
          metrics.loginsBySchool.forEach(schoolData => {
            expect(schoolsInEvents.has(schoolData.schoolId)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: unified-auth-multitenant-refactor, Property 5: Dashboard Data Completeness**
   * **Validates: Requirements 10.6**
   * 
   * For any valid input, the dashboard should return complete and well-formed data:
   * - All required fields should be present
   * - Data types should be correct
   * - Nested structures should be properly formed
   */
  it('Property 5: Dashboard data should be complete and well-formed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(auditLogArb, { minLength: 1, maxLength: 50 }),
        fc.array(authSessionArb, { minLength: 1, maxLength: 50 }),
        timeRangeArb,
        async (auditLogs, sessions, timeRange) => {
          // Setup mocks
          (db.auditLog.findMany as any).mockResolvedValue(auditLogs);
          (db.auditLog.groupBy as any).mockResolvedValue([]);
          (db.auditLog.count as any).mockResolvedValue(auditLogs.length);
          (db.authSession.findMany as any).mockResolvedValue(sessions);
          (db.user.count as any).mockResolvedValue(100);
          (db.school.findMany as any).mockResolvedValue([]);
          (db.analyticsEvent.findMany as any).mockResolvedValue([]);

          const dashboard = await authAnalyticsService.getAuthAnalyticsDashboard(timeRange);

          // Property: Overview should have all required fields
          expect(dashboard.overview).toBeDefined();
          expect(typeof dashboard.overview.totalUsers).toBe('number');
          expect(typeof dashboard.overview.activeUsers).toBe('number');
          expect(typeof dashboard.overview.totalSessions).toBe('number');
          expect(typeof dashboard.overview.averageSessionDuration).toBe('number');
          expect(typeof dashboard.overview.successRate).toBe('number');
          expect(typeof dashboard.overview.securityAlerts).toBe('number');

          // Property: All overview values should be non-negative
          expect(dashboard.overview.totalUsers).toBeGreaterThanOrEqual(0);
          expect(dashboard.overview.activeUsers).toBeGreaterThanOrEqual(0);
          expect(dashboard.overview.totalSessions).toBeGreaterThanOrEqual(0);
          expect(dashboard.overview.averageSessionDuration).toBeGreaterThanOrEqual(0);
          expect(dashboard.overview.successRate).toBeGreaterThanOrEqual(0);
          expect(dashboard.overview.successRate).toBeLessThanOrEqual(100);
          expect(dashboard.overview.securityAlerts).toBeGreaterThanOrEqual(0);

          // Property: Trends should have all required arrays
          expect(dashboard.trends).toBeDefined();
          expect(Array.isArray(dashboard.trends.loginTrend)).toBe(true);
          expect(Array.isArray(dashboard.trends.userGrowthTrend)).toBe(true);
          expect(Array.isArray(dashboard.trends.securityTrend)).toBe(true);

          // Property: Login trend data should be well-formed
          dashboard.trends.loginTrend.forEach(trend => {
            expect(typeof trend.date).toBe('string');
            expect(typeof trend.successful).toBe('number');
            expect(typeof trend.failed).toBe('number');
            expect(typeof trend.total).toBe('number');
            expect(trend.successful).toBeGreaterThanOrEqual(0);
            expect(trend.failed).toBeGreaterThanOrEqual(0);
            expect(trend.total).toBe(trend.successful + trend.failed);
          });

          // Property: User growth trend data should be well-formed
          dashboard.trends.userGrowthTrend.forEach(trend => {
            expect(typeof trend.date).toBe('string');
            expect(typeof trend.newUsers).toBe('number');
            expect(typeof trend.totalUsers).toBe('number');
            expect(typeof trend.growthRate).toBe('number');
            expect(trend.newUsers).toBeGreaterThanOrEqual(0);
            expect(trend.totalUsers).toBeGreaterThanOrEqual(0);
          });

          // Property: Security trend data should be well-formed
          dashboard.trends.securityTrend.forEach(trend => {
            expect(typeof trend.date).toBe('string');
            expect(typeof trend.alerts).toBe('number');
            expect(typeof trend.blockedAttempts).toBe('number');
            expect(trend.alerts).toBeGreaterThanOrEqual(0);
            expect(trend.blockedAttempts).toBeGreaterThanOrEqual(0);
          });

          // Property: Insights should be well-formed
          expect(Array.isArray(dashboard.insights)).toBe(true);
          dashboard.insights.forEach(insight => {
            expect(['INFO', 'WARNING', 'SUCCESS', 'ERROR']).toContain(insight.type);
            expect(typeof insight.title).toBe('string');
            expect(typeof insight.description).toBe('string');
            expect(insight.title.length).toBeGreaterThan(0);
            expect(insight.description.length).toBeGreaterThan(0);
            
            if (insight.value !== undefined) {
              expect(typeof insight.value).toBe('number');
              expect(insight.value).toBeGreaterThanOrEqual(0);
            }
            
            if (insight.change !== undefined) {
              expect(typeof insight.change).toBe('number');
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: unified-auth-multitenant-refactor, Property 6: Filter Application Consistency**
   * **Validates: Requirements 10.6**
   * 
   * For any combination of filters, the results should be consistent:
   * - School filter should only return data for that school
   * - User filter should only return data for that user
   * - Combined filters should respect all constraints
   */
  it('Property 6: Filters should be applied consistently across all metrics', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(auditLogArb, { minLength: 10, maxLength: 50 }),
        timeRangeArb,
        fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }), // schoolId filter
        fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }), // userId filter
        async (allEvents, timeRange, schoolIdFilter, userIdFilter) => {
          // Apply filters to events
          let filteredEvents = allEvents;
          
          if (schoolIdFilter) {
            filteredEvents = filteredEvents.filter(e => e.schoolId === schoolIdFilter);
          }
          
          if (userIdFilter) {
            filteredEvents = filteredEvents.filter(e => e.userId === userIdFilter);
          }

          // Setup mocks
          (db.auditLog.findMany as any).mockResolvedValue(filteredEvents);
          (db.auditLog.groupBy as any).mockResolvedValue(
            filteredEvents
              .filter(log => log.userId)
              .map(log => ({ userId: log.userId, _min: { createdAt: log.createdAt } }))
          );
          (db.authSession.findMany as any).mockResolvedValue([]);

          const filters = { schoolId: schoolIdFilter, userId: userIdFilter };
          const metrics = await authAnalyticsService.getAuthenticationMetrics(timeRange, filters);

          // Property: Total logins should match filtered events
          expect(metrics.totalLogins).toBe(filteredEvents.length);

          // Property: If school filter is applied, all school data should be for that school
          if (schoolIdFilter) {
            metrics.loginsBySchool.forEach(schoolData => {
              expect(schoolData.schoolId).toBe(schoolIdFilter);
            });
          }

          // Property: If user filter is applied, unique users should be at most 1
          if (userIdFilter && filteredEvents.length > 0) {
            expect(metrics.uniqueUsers).toBeLessThanOrEqual(1);
          }

          // Property: Role distribution should only include roles from filtered events
          const rolesInFilteredEvents = new Set(
            filteredEvents.map(e => e.user?.role).filter(Boolean)
          );
          metrics.loginsByRole.forEach(roleData => {
            expect(rolesInFilteredEvents.has(roleData.role as UserRole)).toBe(true);
          });

          // Property: School distribution should only include schools from filtered events
          const schoolsInFilteredEvents = new Set(
            filteredEvents.map(e => e.schoolId).filter(Boolean)
          );
          metrics.loginsBySchool.forEach(schoolData => {
            expect(schoolsInFilteredEvents.has(schoolData.schoolId)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});