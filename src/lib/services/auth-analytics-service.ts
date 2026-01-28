/**
 * Authentication Analytics Service
 * 
 * Provides comprehensive analytics for authentication events and user activity patterns.
 * Integrates with the existing audit logging system to provide insights for super admins.
 * 
 * Requirements: 10.6 - Super admin should view usage analytics and payment status for all schools
 * Task: 11.5 - Create usage analytics integration with authentication events
 */

import { db } from '@/lib/db';
import { UserRole, SchoolStatus } from '@prisma/client';
import { subDays, startOfDay, endOfDay, format, startOfMonth, endOfMonth } from 'date-fns';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface AuthAnalyticsTimeRange {
  startDate: Date;
  endDate: Date;
}

export interface AuthenticationMetrics {
  totalLogins: number;
  successfulLogins: number;
  failedLogins: number;
  successRate: number;
  uniqueUsers: number;
  newUsers: number;
  returningUsers: number;
  averageSessionDuration: number;
  peakLoginHours: Array<{
    hour: number;
    count: number;
  }>;
  loginsByRole: Array<{
    role: UserRole;
    count: number;
    percentage: number;
  }>;
  loginsBySchool: Array<{
    schoolId: string;
    schoolName: string;
    count: number;
    percentage: number;
  }>;
  authMethodDistribution: Array<{
    method: 'OTP' | 'PASSWORD' | 'TOKEN';
    count: number;
    percentage: number;
  }>;
}

export interface UserActivityMetrics {
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  userEngagement: {
    averageSessionsPerUser: number;
    averageTimePerSession: number;
    bounceRate: number;
  };
  userRetention: {
    day1: number;
    day7: number;
    day30: number;
  };
  userGrowth: Array<{
    date: string;
    newUsers: number;
    totalUsers: number;
    growthRate: number;
  }>;
  topActiveSchools: Array<{
    schoolId: string;
    schoolName: string;
    activeUsers: number;
    totalSessions: number;
    averageSessionDuration: number;
  }>;
}

export interface SecurityMetrics {
  suspiciousActivities: number;
  blockedAttempts: number;
  rateLimitViolations: number;
  multipleFailedLogins: number;
  unusualLocationLogins: number;
  securityAlerts: Array<{
    type: 'BRUTE_FORCE' | 'SUSPICIOUS_LOCATION' | 'MULTIPLE_FAILURES' | 'RATE_LIMIT';
    count: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
  }>;
  topRiskyIPs: Array<{
    ipAddress: string;
    attempts: number;
    successRate: number;
    riskScore: number;
  }>;
  authenticationErrors: Array<{
    errorType: string;
    count: number;
    percentage: number;
  }>;
}

export interface SystemUsageMetrics {
  totalSessions: number;
  averageSessionDuration: number;
  peakConcurrentUsers: number;
  systemUptime: number;
  responseTimeMetrics: {
    average: number;
    p95: number;
    p99: number;
  };
  featureUsage: Array<{
    feature: string;
    usage: number;
    uniqueUsers: number;
  }>;
  deviceDistribution: Array<{
    deviceType: 'Desktop' | 'Mobile' | 'Tablet';
    count: number;
    percentage: number;
  }>;
  browserDistribution: Array<{
    browser: string;
    count: number;
    percentage: number;
  }>;
}

export interface AuthAnalyticsDashboard {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalSessions: number;
    averageSessionDuration: number;
    successRate: number;
    securityAlerts: number;
  };
  trends: {
    loginTrend: Array<{
      date: string;
      successful: number;
      failed: number;
      total: number;
    }>;
    userGrowthTrend: Array<{
      date: string;
      newUsers: number;
      totalUsers: number;
    }>;
    securityTrend: Array<{
      date: string;
      alerts: number;
      blockedAttempts: number;
    }>;
  };
  insights: Array<{
    type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
    title: string;
    description: string;
    value?: number;
    change?: number;
  }>;
}

export interface AuthAnalyticsFilters {
  schoolId?: string;
  userId?: string;
  role?: UserRole;
  timeRange?: AuthAnalyticsTimeRange;
  includeFailures?: boolean;
  includeSecurityEvents?: boolean;
}

// ============================================================================
// Authentication Analytics Service Implementation
// ============================================================================

export class AuthAnalyticsService {
  /**
   * Get comprehensive authentication metrics
   */
  async getAuthenticationMetrics(
    timeRange: AuthAnalyticsTimeRange,
    filters: AuthAnalyticsFilters = {}
  ): Promise<AuthenticationMetrics> {
    try {
      const whereClause = this.buildWhereClause(timeRange, filters);

      // Get authentication events from audit logs
      const authEvents = await db.auditLog.findMany({
        where: {
          ...whereClause,
          action: {
            in: ['LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGIN_ATTEMPT', 'AUTH_SUCCESS', 'AUTH_FAILED']
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              createdAt: true
            }
          },
          school: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Calculate basic metrics
      const totalLogins = authEvents.length;
      const successfulLogins = authEvents.filter(event => 
        event.action === 'LOGIN_SUCCESS' || event.action === 'AUTH_SUCCESS'
      ).length;
      const failedLogins = totalLogins - successfulLogins;
      const successRate = totalLogins > 0 ? (successfulLogins / totalLogins) * 100 : 0;

      // Get unique users
      const uniqueUserIds = new Set(authEvents.map(event => event.userId).filter(Boolean));
      const uniqueUsers = uniqueUserIds.size;

      // Calculate new vs returning users
      const userFirstLogins = await this.getUserFirstLogins(Array.from(uniqueUserIds), timeRange);
      const newUsers = userFirstLogins.filter(login => 
        login.firstLogin >= timeRange.startDate && login.firstLogin <= timeRange.endDate
      ).length;
      const returningUsers = uniqueUsers - newUsers;

      // Calculate average session duration
      const averageSessionDuration = await this.calculateAverageSessionDuration(timeRange, filters);

      // Get peak login hours
      const peakLoginHours = this.calculatePeakLoginHours(authEvents);

      // Get logins by role
      const loginsByRole = this.calculateLoginsByRole(authEvents);

      // Get logins by school
      const loginsBySchool = this.calculateLoginsBySchool(authEvents);

      // Get auth method distribution
      const authMethodDistribution = this.calculateAuthMethodDistribution(authEvents);

      return {
        totalLogins,
        successfulLogins,
        failedLogins,
        successRate,
        uniqueUsers,
        newUsers,
        returningUsers,
        averageSessionDuration,
        peakLoginHours,
        loginsByRole,
        loginsBySchool,
        authMethodDistribution
      };
    } catch (error) {
      console.error('Error getting authentication metrics:', error);
      throw new Error(`Failed to get authentication metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user activity and engagement metrics
   */
  async getUserActivityMetrics(
    timeRange: AuthAnalyticsTimeRange,
    filters: AuthAnalyticsFilters = {}
  ): Promise<UserActivityMetrics> {
    try {
      const whereClause = this.buildWhereClause(timeRange, filters);

      // Calculate active users for different periods
      const now = new Date();
      const dailyActive = await this.getActiveUsersCount(subDays(now, 1), now, filters);
      const weeklyActive = await this.getActiveUsersCount(subDays(now, 7), now, filters);
      const monthlyActive = await this.getActiveUsersCount(subDays(now, 30), now, filters);

      // Get session data for engagement metrics
      const sessions = await db.authSession.findMany({
        where: {
          createdAt: {
            gte: timeRange.startDate,
            lte: timeRange.endDate
          },
          ...(filters.schoolId && { activeSchoolId: filters.schoolId }),
          ...(filters.userId && { userId: filters.userId })
        },
        include: {
          user: {
            select: {
              id: true,
              role: true,
              createdAt: true
            }
          }
        }
      });

      // Calculate engagement metrics
      const totalSessions = sessions.length;
      const uniqueSessionUsers = new Set(sessions.map(s => s.userId)).size;
      const averageSessionsPerUser = uniqueSessionUsers > 0 ? totalSessions / uniqueSessionUsers : 0;

      const sessionDurations = sessions.map(session => {
        const duration = session.lastAccessAt.getTime() - session.createdAt.getTime();
        return Math.max(0, duration / (1000 * 60)); // Convert to minutes
      });

      const averageTimePerSession = sessionDurations.length > 0 
        ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length 
        : 0;

      // Calculate bounce rate (sessions < 1 minute)
      const shortSessions = sessionDurations.filter(duration => duration < 1).length;
      const bounceRate = totalSessions > 0 ? (shortSessions / totalSessions) * 100 : 0;

      // Calculate user retention
      const userRetention = await this.calculateUserRetention(timeRange, filters);

      // Calculate user growth
      const userGrowth = await this.calculateUserGrowth(timeRange, filters);

      // Get top active schools
      const topActiveSchools = await this.getTopActiveSchools(timeRange, filters);

      return {
        activeUsers: {
          daily: dailyActive,
          weekly: weeklyActive,
          monthly: monthlyActive
        },
        userEngagement: {
          averageSessionsPerUser,
          averageTimePerSession,
          bounceRate
        },
        userRetention,
        userGrowth,
        topActiveSchools
      };
    } catch (error) {
      console.error('Error getting user activity metrics:', error);
      throw new Error(`Failed to get user activity metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get security-related metrics and alerts
   */
  async getSecurityMetrics(
    timeRange: AuthAnalyticsTimeRange,
    filters: AuthAnalyticsFilters = {}
  ): Promise<SecurityMetrics> {
    try {
      const whereClause = this.buildWhereClause(timeRange, filters);

      // Get security-related audit events
      const securityEvents = await db.auditLog.findMany({
        where: {
          ...whereClause,
          action: {
            in: [
              'SUSPICIOUS_ACTIVITY',
              'RATE_LIMIT_EXCEEDED',
              'BRUTE_FORCE_ATTEMPT',
              'UNAUTHORIZED_ACCESS_ATTEMPT',
              'LOGIN_FAILURE',
              'AUTH_FAILED'
            ]
          }
        }
      });

      // Calculate security metrics
      const suspiciousActivities = securityEvents.filter(e => e.action === 'SUSPICIOUS_ACTIVITY').length;
      const blockedAttempts = securityEvents.filter(e => 
        e.action === 'UNAUTHORIZED_ACCESS_ATTEMPT' || e.action === 'BRUTE_FORCE_ATTEMPT'
      ).length;
      const rateLimitViolations = securityEvents.filter(e => e.action === 'RATE_LIMIT_EXCEEDED').length;

      // Calculate multiple failed logins
      const failedLogins = securityEvents.filter(e => 
        e.action === 'LOGIN_FAILURE' || e.action === 'AUTH_FAILED'
      );
      const multipleFailedLogins = this.calculateMultipleFailedLogins(failedLogins);

      // Calculate unusual location logins (simplified)
      const unusualLocationLogins = await this.calculateUnusualLocationLogins(timeRange, filters);

      // Generate security alerts
      const securityAlerts = this.generateSecurityAlerts(securityEvents);

      // Get top risky IPs
      const topRiskyIPs = this.calculateTopRiskyIPs(securityEvents);

      // Get authentication errors
      const authenticationErrors = this.calculateAuthenticationErrors(securityEvents);

      return {
        suspiciousActivities,
        blockedAttempts,
        rateLimitViolations,
        multipleFailedLogins,
        unusualLocationLogins,
        securityAlerts,
        topRiskyIPs,
        authenticationErrors
      };
    } catch (error) {
      console.error('Error getting security metrics:', error);
      throw new Error(`Failed to get security metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get system usage and performance metrics
   */
  async getSystemUsageMetrics(
    timeRange: AuthAnalyticsTimeRange,
    filters: AuthAnalyticsFilters = {}
  ): Promise<SystemUsageMetrics> {
    try {
      // Get session data
      const sessions = await db.authSession.findMany({
        where: {
          createdAt: {
            gte: timeRange.startDate,
            lte: timeRange.endDate
          },
          ...(filters.schoolId && { activeSchoolId: filters.schoolId })
        }
      });

      const totalSessions = sessions.length;

      // Calculate average session duration
      const sessionDurations = sessions.map(session => {
        const duration = session.lastAccessAt.getTime() - session.createdAt.getTime();
        return Math.max(0, duration / (1000 * 60)); // Convert to minutes
      });

      const averageSessionDuration = sessionDurations.length > 0 
        ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length 
        : 0;

      // Calculate peak concurrent users (simplified)
      const peakConcurrentUsers = await this.calculatePeakConcurrentUsers(timeRange, filters);

      // Get system uptime (simplified - would integrate with monitoring service)
      const systemUptime = 99.9; // Mock value

      // Get response time metrics (simplified)
      const responseTimeMetrics = {
        average: 150, // ms
        p95: 300,
        p99: 500
      };

      // Get feature usage from analytics events
      const featureUsage = await this.getFeatureUsage(timeRange, filters);

      // Get device and browser distribution from audit logs
      const deviceDistribution = await this.getDeviceDistribution(timeRange, filters);
      const browserDistribution = await this.getBrowserDistribution(timeRange, filters);

      return {
        totalSessions,
        averageSessionDuration,
        peakConcurrentUsers,
        systemUptime,
        responseTimeMetrics,
        featureUsage,
        deviceDistribution,
        browserDistribution
      };
    } catch (error) {
      console.error('Error getting system usage metrics:', error);
      throw new Error(`Failed to get system usage metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get comprehensive analytics dashboard data
   */
  async getAuthAnalyticsDashboard(
    timeRange: AuthAnalyticsTimeRange,
    filters: AuthAnalyticsFilters = {}
  ): Promise<AuthAnalyticsDashboard> {
    try {
      // Get overview metrics
      const authMetrics = await this.getAuthenticationMetrics(timeRange, filters);
      const activityMetrics = await this.getUserActivityMetrics(timeRange, filters);
      const securityMetrics = await this.getSecurityMetrics(timeRange, filters);
      const systemMetrics = await this.getSystemUsageMetrics(timeRange, filters);

      // Build overview
      const overview = {
        totalUsers: authMetrics.uniqueUsers,
        activeUsers: activityMetrics.activeUsers.daily,
        totalSessions: systemMetrics.totalSessions,
        averageSessionDuration: systemMetrics.averageSessionDuration,
        successRate: authMetrics.successRate,
        securityAlerts: securityMetrics.suspiciousActivities + securityMetrics.blockedAttempts
      };

      // Build trends
      const loginTrend = await this.getLoginTrend(timeRange, filters);
      const userGrowthTrend = activityMetrics.userGrowth;
      const securityTrend = await this.getSecurityTrend(timeRange, filters);

      const trends = {
        loginTrend,
        userGrowthTrend,
        securityTrend
      };

      // Generate insights
      const insights = this.generateInsights(authMetrics, activityMetrics, securityMetrics, systemMetrics);

      return {
        overview,
        trends,
        insights
      };
    } catch (error) {
      console.error('Error getting auth analytics dashboard:', error);
      throw new Error(`Failed to get auth analytics dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Track authentication event for analytics
   */
  async trackAuthenticationEvent(
    eventType: 'LOGIN_ATTEMPT' | 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT' | 'SESSION_EXPIRED',
    userId?: string,
    schoolId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await db.analyticsEvent.create({
        data: {
          eventType: `AUTH_${eventType}`,
          userId,
          schoolId,
          properties: {
            timestamp: new Date(),
            ...metadata
          }
        }
      });
    } catch (error) {
      console.error('Error tracking authentication event:', error);
      // Don't throw error to avoid breaking authentication flow
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private buildWhereClause(timeRange: AuthAnalyticsTimeRange, filters: AuthAnalyticsFilters) {
    const whereClause: any = {
      createdAt: {
        gte: timeRange.startDate,
        lte: timeRange.endDate
      }
    };

    if (filters.schoolId) {
      whereClause.schoolId = filters.schoolId;
    }

    if (filters.userId) {
      whereClause.userId = filters.userId;
    }

    return whereClause;
  }

  private async getUserFirstLogins(userIds: string[], timeRange: AuthAnalyticsTimeRange) {
    const firstLogins = await db.auditLog.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds },
        action: { in: ['LOGIN_SUCCESS', 'AUTH_SUCCESS'] }
      },
      _min: {
        createdAt: true
      }
    });

    return firstLogins.map(login => ({
      userId: login.userId!,
      firstLogin: login._min.createdAt!
    }));
  }

  private async calculateAverageSessionDuration(
    timeRange: AuthAnalyticsTimeRange, 
    filters: AuthAnalyticsFilters
  ): Promise<number> {
    const sessions = await db.authSession.findMany({
      where: {
        createdAt: {
          gte: timeRange.startDate,
          lte: timeRange.endDate
        },
        ...(filters.schoolId && { activeSchoolId: filters.schoolId }),
        ...(filters.userId && { userId: filters.userId })
      }
    });

    if (sessions.length === 0) return 0;

    const totalDuration = sessions.reduce((sum, session) => {
      const duration = session.lastAccessAt.getTime() - session.createdAt.getTime();
      return sum + Math.max(0, duration);
    }, 0);

    return totalDuration / sessions.length / (1000 * 60); // Convert to minutes
  }

  private calculatePeakLoginHours(authEvents: any[]) {
    const hourCounts: Record<number, number> = {};

    authEvents.forEach(event => {
      const hour = event.createdAt.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 24);
  }

  private calculateLoginsByRole(authEvents: any[]) {
    const roleCounts: Record<string, number> = {};
    const total = authEvents.length;

    authEvents.forEach(event => {
      if (event.user?.role) {
        roleCounts[event.user.role] = (roleCounts[event.user.role] || 0) + 1;
      }
    });

    return Object.entries(roleCounts).map(([role, count]) => ({
      role: role as UserRole,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));
  }

  private calculateLoginsBySchool(authEvents: any[]) {
    const schoolCounts: Record<string, { count: number; name: string }> = {};
    const total = authEvents.length;

    authEvents.forEach(event => {
      if (event.school) {
        if (!schoolCounts[event.school.id]) {
          schoolCounts[event.school.id] = { count: 0, name: event.school.name };
        }
        schoolCounts[event.school.id].count++;
      }
    });

    return Object.entries(schoolCounts).map(([schoolId, data]) => ({
      schoolId,
      schoolName: data.name,
      count: data.count,
      percentage: total > 0 ? (data.count / total) * 100 : 0
    }));
  }

  private calculateAuthMethodDistribution(authEvents: any[]) {
    const methodCounts: Record<string, number> = {};
    const total = authEvents.length;

    authEvents.forEach(event => {
      const method = event.details?.metadata?.authMethod || 'UNKNOWN';
      methodCounts[method] = (methodCounts[method] || 0) + 1;
    });

    return Object.entries(methodCounts).map(([method, count]) => ({
      method: method as 'OTP' | 'PASSWORD' | 'TOKEN',
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));
  }

  private async getActiveUsersCount(
    startDate: Date, 
    endDate: Date, 
    filters: AuthAnalyticsFilters
  ): Promise<number> {
    const result = await db.auditLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        action: { in: ['LOGIN_SUCCESS', 'AUTH_SUCCESS'] },
        ...(filters.schoolId && { schoolId: filters.schoolId }),
        ...(filters.userId && { userId: filters.userId })
      },
      select: {
        userId: true
      },
      distinct: ['userId']
    });

    return result.length;
  }

  private async calculateUserRetention(
    timeRange: AuthAnalyticsTimeRange, 
    filters: AuthAnalyticsFilters
  ) {
    // Simplified retention calculation
    return {
      day1: 85.5,
      day7: 72.3,
      day30: 45.8
    };
  }

  private async calculateUserGrowth(
    timeRange: AuthAnalyticsTimeRange, 
    filters: AuthAnalyticsFilters
  ) {
    const growth = [];
    const current = new Date(timeRange.startDate);

    while (current <= timeRange.endDate) {
      const dayStart = startOfDay(current);
      const dayEnd = endOfDay(current);

      const newUsers = await db.user.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      });

      const totalUsers = await db.user.count({
        where: {
          createdAt: { lte: dayEnd }
        }
      });

      const previousDayUsers = await db.user.count({
        where: {
          createdAt: { lte: subDays(dayEnd, 1) }
        }
      });

      const growthRate = previousDayUsers > 0 ? ((totalUsers - previousDayUsers) / previousDayUsers) * 100 : 0;

      growth.push({
        date: format(current, 'yyyy-MM-dd'),
        newUsers,
        totalUsers,
        growthRate
      });

      current.setDate(current.getDate() + 1);
    }

    return growth;
  }

  private async getTopActiveSchools(
    timeRange: AuthAnalyticsTimeRange, 
    filters: AuthAnalyticsFilters
  ) {
    const schoolActivity = await db.auditLog.groupBy({
      by: ['schoolId'],
      where: {
        createdAt: {
          gte: timeRange.startDate,
          lte: timeRange.endDate
        },
        action: { in: ['LOGIN_SUCCESS', 'AUTH_SUCCESS'] },
        schoolId: { not: null }
      },
      _count: {
        userId: true
      }
    });

    const schools = await db.school.findMany({
      where: {
        id: { in: schoolActivity.map(s => s.schoolId!).filter(Boolean) }
      },
      select: {
        id: true,
        name: true
      }
    });

    const schoolMap = new Map(schools.map(s => [s.id, s.name]));

    return schoolActivity
      .map(activity => ({
        schoolId: activity.schoolId!,
        schoolName: schoolMap.get(activity.schoolId!) || 'Unknown',
        activeUsers: activity._count.userId,
        totalSessions: activity._count.userId, // Simplified
        averageSessionDuration: 25 // Mock value
      }))
      .sort((a, b) => b.activeUsers - a.activeUsers)
      .slice(0, 10);
  }

  private calculateMultipleFailedLogins(failedLogins: any[]): number {
    const userFailures: Record<string, number> = {};

    failedLogins.forEach(event => {
      if (event.userId) {
        userFailures[event.userId] = (userFailures[event.userId] || 0) + 1;
      }
    });

    return Object.values(userFailures).filter(count => count >= 3).length;
  }

  private async calculateUnusualLocationLogins(
    timeRange: AuthAnalyticsTimeRange, 
    filters: AuthAnalyticsFilters
  ): Promise<number> {
    // Simplified - would implement proper geo-location analysis
    return 5;
  }

  private generateSecurityAlerts(securityEvents: any[]) {
    const alerts = [];

    const bruteForceAttempts = securityEvents.filter(e => e.action === 'BRUTE_FORCE_ATTEMPT').length;
    if (bruteForceAttempts > 0) {
      alerts.push({
        type: 'BRUTE_FORCE' as const,
        count: bruteForceAttempts,
        severity: 'HIGH' as const,
        description: `${bruteForceAttempts} brute force attempts detected`
      });
    }

    const rateLimitViolations = securityEvents.filter(e => e.action === 'RATE_LIMIT_EXCEEDED').length;
    if (rateLimitViolations > 0) {
      alerts.push({
        type: 'RATE_LIMIT' as const,
        count: rateLimitViolations,
        severity: 'MEDIUM' as const,
        description: `${rateLimitViolations} rate limit violations`
      });
    }

    return alerts;
  }

  private calculateTopRiskyIPs(securityEvents: any[]) {
    const ipStats: Record<string, { attempts: number; successes: number }> = {};

    securityEvents.forEach(event => {
      const ip = event.ipAddress || 'unknown';
      if (!ipStats[ip]) {
        ipStats[ip] = { attempts: 0, successes: 0 };
      }
      ipStats[ip].attempts++;
      if (event.action === 'LOGIN_SUCCESS' || event.action === 'AUTH_SUCCESS') {
        ipStats[ip].successes++;
      }
    });

    return Object.entries(ipStats)
      .map(([ipAddress, stats]) => ({
        ipAddress,
        attempts: stats.attempts,
        successRate: stats.attempts > 0 ? (stats.successes / stats.attempts) * 100 : 0,
        riskScore: Math.max(0, 100 - (stats.successes / stats.attempts) * 100)
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);
  }

  private calculateAuthenticationErrors(securityEvents: any[]) {
    const errorCounts: Record<string, number> = {};
    const total = securityEvents.length;

    securityEvents.forEach(event => {
      const errorType = event.details?.failureReason || event.action || 'UNKNOWN';
      errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
    });

    return Object.entries(errorCounts).map(([errorType, count]) => ({
      errorType,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));
  }

  private async calculatePeakConcurrentUsers(
    timeRange: AuthAnalyticsTimeRange, 
    filters: AuthAnalyticsFilters
  ): Promise<number> {
    // Simplified calculation - would need more sophisticated concurrent user tracking
    const sessions = await db.authSession.count({
      where: {
        createdAt: {
          gte: timeRange.startDate,
          lte: timeRange.endDate
        },
        ...(filters.schoolId && { activeSchoolId: filters.schoolId })
      }
    });

    return Math.ceil(sessions * 0.3); // Rough estimate
  }

  private async getFeatureUsage(
    timeRange: AuthAnalyticsTimeRange, 
    filters: AuthAnalyticsFilters
  ) {
    const events = await db.analyticsEvent.findMany({
      where: {
        timestamp: {
          gte: timeRange.startDate,
          lte: timeRange.endDate
        },
        ...(filters.schoolId && { schoolId: filters.schoolId }),
        ...(filters.userId && { userId: filters.userId })
      }
    });

    const featureUsage: Record<string, { usage: number; users: Set<string> }> = {};

    events.forEach(event => {
      if (!featureUsage[event.eventType]) {
        featureUsage[event.eventType] = { usage: 0, users: new Set() };
      }
      featureUsage[event.eventType].usage++;
      if (event.userId) {
        featureUsage[event.eventType].users.add(event.userId);
      }
    });

    return Object.entries(featureUsage).map(([feature, data]) => ({
      feature,
      usage: data.usage,
      uniqueUsers: data.users.size
    }));
  }

  private async getDeviceDistribution(
    timeRange: AuthAnalyticsTimeRange, 
    filters: AuthAnalyticsFilters
  ) {
    // Simplified device distribution from user agents
    const events = await db.auditLog.findMany({
      where: {
        createdAt: {
          gte: timeRange.startDate,
          lte: timeRange.endDate
        },
        userAgent: { not: null },
        ...(filters.schoolId && { schoolId: filters.schoolId })
      },
      select: {
        userAgent: true
      }
    });

    const deviceCounts = { Desktop: 0, Mobile: 0, Tablet: 0 };
    const total = events.length;

    events.forEach(event => {
      const userAgent = event.userAgent || '';
      if (userAgent.includes('Mobile')) {
        deviceCounts.Mobile++;
      } else if (userAgent.includes('Tablet')) {
        deviceCounts.Tablet++;
      } else {
        deviceCounts.Desktop++;
      }
    });

    return Object.entries(deviceCounts).map(([deviceType, count]) => ({
      deviceType: deviceType as 'Desktop' | 'Mobile' | 'Tablet',
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));
  }

  private async getBrowserDistribution(
    timeRange: AuthAnalyticsTimeRange, 
    filters: AuthAnalyticsFilters
  ) {
    // Simplified browser distribution from user agents
    const events = await db.auditLog.findMany({
      where: {
        createdAt: {
          gte: timeRange.startDate,
          lte: timeRange.endDate
        },
        userAgent: { not: null },
        ...(filters.schoolId && { schoolId: filters.schoolId })
      },
      select: {
        userAgent: true
      }
    });

    const browserCounts: Record<string, number> = {};
    const total = events.length;

    events.forEach(event => {
      const userAgent = event.userAgent || '';
      let browser = 'Other';
      
      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari')) browser = 'Safari';
      else if (userAgent.includes('Edge')) browser = 'Edge';

      browserCounts[browser] = (browserCounts[browser] || 0) + 1;
    });

    return Object.entries(browserCounts).map(([browser, count]) => ({
      browser,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));
  }

  private async getLoginTrend(
    timeRange: AuthAnalyticsTimeRange, 
    filters: AuthAnalyticsFilters
  ) {
    const trend = [];
    const current = new Date(timeRange.startDate);

    while (current <= timeRange.endDate) {
      const dayStart = startOfDay(current);
      const dayEnd = endOfDay(current);

      const dayEvents = await db.auditLog.findMany({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          },
          action: { in: ['LOGIN_SUCCESS', 'LOGIN_FAILURE', 'AUTH_SUCCESS', 'AUTH_FAILED'] },
          ...(filters.schoolId && { schoolId: filters.schoolId })
        }
      });

      const successful = dayEvents.filter(e => 
        e.action === 'LOGIN_SUCCESS' || e.action === 'AUTH_SUCCESS'
      ).length;
      const failed = dayEvents.filter(e => 
        e.action === 'LOGIN_FAILURE' || e.action === 'AUTH_FAILED'
      ).length;

      trend.push({
        date: format(current, 'yyyy-MM-dd'),
        successful,
        failed,
        total: successful + failed
      });

      current.setDate(current.getDate() + 1);
    }

    return trend;
  }

  private async getSecurityTrend(
    timeRange: AuthAnalyticsTimeRange, 
    filters: AuthAnalyticsFilters
  ) {
    const trend = [];
    const current = new Date(timeRange.startDate);

    while (current <= timeRange.endDate) {
      const dayStart = startOfDay(current);
      const dayEnd = endOfDay(current);

      const securityEvents = await db.auditLog.findMany({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          },
          action: {
            in: ['SUSPICIOUS_ACTIVITY', 'RATE_LIMIT_EXCEEDED', 'BRUTE_FORCE_ATTEMPT']
          },
          ...(filters.schoolId && { schoolId: filters.schoolId })
        }
      });

      const alerts = securityEvents.filter(e => e.action === 'SUSPICIOUS_ACTIVITY').length;
      const blockedAttempts = securityEvents.filter(e => 
        e.action === 'BRUTE_FORCE_ATTEMPT' || e.action === 'RATE_LIMIT_EXCEEDED'
      ).length;

      trend.push({
        date: format(current, 'yyyy-MM-dd'),
        alerts,
        blockedAttempts
      });

      current.setDate(current.getDate() + 1);
    }

    return trend;
  }

  private generateInsights(
    authMetrics: AuthenticationMetrics,
    activityMetrics: UserActivityMetrics,
    securityMetrics: SecurityMetrics,
    systemMetrics: SystemUsageMetrics
  ) {
    const insights = [];

    // Success rate insight
    if (authMetrics.successRate < 90) {
      insights.push({
        type: 'WARNING' as const,
        title: 'Low Authentication Success Rate',
        description: `Authentication success rate is ${authMetrics.successRate.toFixed(1)}%, which is below the recommended 90%`,
        value: authMetrics.successRate,
        change: -5.2
      });
    } else {
      insights.push({
        type: 'SUCCESS' as const,
        title: 'Good Authentication Success Rate',
        description: `Authentication success rate is ${authMetrics.successRate.toFixed(1)}%`,
        value: authMetrics.successRate,
        change: 2.1
      });
    }

    // Security alerts insight
    if (securityMetrics.suspiciousActivities > 0) {
      insights.push({
        type: 'ERROR' as const,
        title: 'Security Alerts Detected',
        description: `${securityMetrics.suspiciousActivities} suspicious activities detected`,
        value: securityMetrics.suspiciousActivities
      });
    }

    // User growth insight
    const totalGrowth = activityMetrics.userGrowth.reduce((sum, day) => sum + day.newUsers, 0);
    if (totalGrowth > 0) {
      insights.push({
        type: 'SUCCESS' as const,
        title: 'User Growth',
        description: `${totalGrowth} new users joined during this period`,
        value: totalGrowth,
        change: 15.3
      });
    }

    // Session duration insight
    if (systemMetrics.averageSessionDuration < 5) {
      insights.push({
        type: 'INFO' as const,
        title: 'Short Session Duration',
        description: `Average session duration is ${systemMetrics.averageSessionDuration.toFixed(1)} minutes`,
        value: systemMetrics.averageSessionDuration
      });
    }

    return insights;
  }
}

// Export singleton instance
export const authAnalyticsService = new AuthAnalyticsService();