import { db } from "@/lib/db";
import { logAuditEvent } from "./audit-service";

/**
 * Rate Limit Logger Service
 * Comprehensive logging for all rate limiting events
 * Requirements: 14.5
 */

export interface RateLimitLogEntry {
  identifier: string;
  action: string;
  type: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface RateLimitLogFilter {
  identifier?: string;
  action?: string;
  type?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

class RateLimitLogger {
  /**
   * Log rate limiting event
   * Requirements: 14.5
   */
  async logEvent(
    identifier: string,
    action: string,
    type: string,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const timestamp = new Date();
      
      // Log to rate limit log table
      await db.rateLimitLog.create({
        data: {
          identifier,
          action,
          type,
          details: {
            ...details,
            ipAddress,
            userAgent,
            timestamp: timestamp.toISOString()
          },
          createdAt: timestamp
        }
      });

      // Log to audit system for critical events
      if (this.isCriticalEvent(action)) {
        await logAuditEvent({
          userId: null, // Rate limiting is identifier-based
          action: 'CREATE',
          resource: 'rate_limit_event',
          changes: {
            identifier,
            action,
            type,
            details,
            ipAddress,
            userAgent,
            severity: this.getEventSeverity(action),
            timestamp
          }
        });
      }

      // Console logging for development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[RateLimit] ${action} - ${identifier}`, {
          type,
          details,
          ipAddress,
          timestamp
        });
      }

    } catch (error) {
      console.error('Failed to log rate limit event:', error);
      // Don't throw to avoid breaking rate limiting flow
    }
  }

  /**
   * Log OTP rate limit events
   */
  async logOTPEvent(
    identifier: string,
    action: 'RATE_LIMIT_HIT' | 'OTP_GENERATED' | 'OTP_BLOCKED',
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent(identifier, action, 'OTP_GENERATION', details);
  }

  /**
   * Log login failure events
   */
  async logLoginFailureEvent(
    identifier: string,
    action: 'LOGIN_FAILURE' | 'EXPONENTIAL_BACKOFF' | 'LOGIN_BLOCKED',
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent(identifier, action, 'LOGIN_ATTEMPTS', details, ipAddress, userAgent);
  }

  /**
   * Log suspicious activity events
   */
  async logSuspiciousActivityEvent(
    identifier: string,
    action: 'SUSPICIOUS_PATTERN_DETECTED' | 'ACTIVITY_BLOCKED' | 'PATTERN_ANALYSIS',
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent(identifier, action, 'SUSPICIOUS_ACTIVITY', details, ipAddress, userAgent);
  }

  /**
   * Log identifier blocking events
   */
  async logBlockingEvent(
    identifier: string,
    action: 'IDENTIFIER_BLOCKED' | 'IDENTIFIER_UNBLOCKED' | 'BLOCK_EXTENDED',
    details: Record<string, any> = {},
    adminUserId?: string
  ): Promise<void> {
    await this.logEvent(identifier, action, 'IDENTIFIER_BLOCKING', {
      ...details,
      adminUserId
    });
  }

  /**
   * Log system maintenance events
   */
  async logMaintenanceEvent(
    action: 'CLEANUP_STARTED' | 'CLEANUP_COMPLETED' | 'EXPIRED_BLOCKS_REMOVED',
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent('SYSTEM', action, 'MAINTENANCE', details);
  }

  /**
   * Get rate limit logs with filtering
   */
  async getLogs(filter: RateLimitLogFilter = {}): Promise<{
    logs: RateLimitLogEntry[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const {
        identifier,
        action,
        type,
        startDate,
        endDate,
        limit = 50,
        offset = 0
      } = filter;

      const whereClause: any = {};

      if (identifier) {
        whereClause.identifier = { contains: identifier, mode: 'insensitive' };
      }

      if (action) {
        whereClause.action = action;
      }

      if (type) {
        whereClause.type = type;
      }

      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt.gte = startDate;
        if (endDate) whereClause.createdAt.lte = endDate;
      }

      const [logs, total] = await Promise.all([
        db.rateLimitLog.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        }),
        db.rateLimitLog.count({ where: whereClause })
      ]);

      return {
        logs: logs.map(log => ({
          identifier: log.identifier,
          action: log.action,
          type: log.type,
          details: log.details as Record<string, any> || {},
          ipAddress: (log.details as any)?.ipAddress,
          userAgent: (log.details as any)?.userAgent,
          timestamp: log.createdAt
        })),
        total,
        hasMore: offset + limit < total
      };

    } catch (error) {
      console.error('Failed to get rate limit logs:', error);
      throw error;
    }
  }

  /**
   * Get rate limiting statistics
   */
  async getStatistics(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<{
    totalEvents: number;
    eventsByAction: Array<{ action: string; count: number }>;
    eventsByType: Array<{ type: string; count: number }>;
    topIdentifiers: Array<{ identifier: string; count: number }>;
    timeline: Array<{ timestamp: Date; count: number }>;
  }> {
    try {
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case 'hour':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const [
        totalEvents,
        eventsByAction,
        eventsByType,
        topIdentifiers
      ] = await Promise.all([
        // Total events
        db.rateLimitLog.count({
          where: { createdAt: { gte: startDate } }
        }),

        // Events by action
        db.rateLimitLog.groupBy({
          by: ['action'],
          where: { createdAt: { gte: startDate } },
          _count: { action: true },
          orderBy: { _count: { action: 'desc' } },
          take: 10
        }),

        // Events by type
        db.rateLimitLog.groupBy({
          by: ['type'],
          where: { createdAt: { gte: startDate } },
          _count: { type: true },
          orderBy: { _count: { type: 'desc' } }
        }),

        // Top identifiers
        db.rateLimitLog.groupBy({
          by: ['identifier'],
          where: { 
            createdAt: { gte: startDate },
            identifier: { not: 'SYSTEM' }
          },
          _count: { identifier: true },
          orderBy: { _count: { identifier: 'desc' } },
          take: 10
        })
      ]);

      // Generate timeline data
      const timeline = await this.generateTimeline(startDate, now, timeRange);

      return {
        totalEvents,
        eventsByAction: eventsByAction.map(item => ({
          action: item.action,
          count: item._count.action
        })),
        eventsByType: eventsByType.map(item => ({
          type: item.type,
          count: item._count.type
        })),
        topIdentifiers: topIdentifiers.map(item => ({
          identifier: item.identifier,
          count: item._count.identifier
        })),
        timeline
      };

    } catch (error) {
      console.error('Failed to get rate limit statistics:', error);
      throw error;
    }
  }

  /**
   * Export rate limit logs
   */
  async exportLogs(
    filter: RateLimitLogFilter = {},
    format: 'json' | 'csv' = 'json'
  ): Promise<{
    data: string;
    filename: string;
    contentType: string;
  }> {
    try {
      const { logs } = await this.getLogs({ ...filter, limit: 10000 });
      const timestamp = new Date().toISOString().split('T')[0];

      if (format === 'csv') {
        const headers = [
          'Timestamp', 'Identifier', 'Action', 'Type', 'IP Address', 'User Agent', 'Details'
        ];
        
        const csvRows = logs.map(log => [
          log.timestamp.toISOString(),
          log.identifier,
          log.action,
          log.type,
          log.ipAddress || '',
          log.userAgent || '',
          JSON.stringify(log.details)
        ]);

        const csvContent = [
          headers.join(','),
          ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
        ].join('\n');

        return {
          data: csvContent,
          filename: `rate-limit-logs-${timestamp}.csv`,
          contentType: 'text/csv'
        };
      } else {
        return {
          data: JSON.stringify(logs, null, 2),
          filename: `rate-limit-logs-${timestamp}.json`,
          contentType: 'application/json'
        };
      }

    } catch (error) {
      console.error('Failed to export rate limit logs:', error);
      throw error;
    }
  }

  // Private helper methods

  /**
   * Check if event is critical and should be logged to audit system
   */
  private isCriticalEvent(action: string): boolean {
    const criticalEvents = [
      'IDENTIFIER_BLOCKED',
      'SUSPICIOUS_PATTERN_DETECTED',
      'ACTIVITY_BLOCKED',
      'IDENTIFIER_UNBLOCKED'
    ];
    return criticalEvents.includes(action);
  }

  /**
   * Get event severity level
   */
  private getEventSeverity(action: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    switch (action) {
      case 'IDENTIFIER_BLOCKED':
      case 'SUSPICIOUS_PATTERN_DETECTED':
        return 'CRITICAL';
      case 'ACTIVITY_BLOCKED':
      case 'LOGIN_BLOCKED':
        return 'HIGH';
      case 'EXPONENTIAL_BACKOFF':
      case 'RATE_LIMIT_HIT':
        return 'MEDIUM';
      default:
        return 'LOW';
    }
  }

  /**
   * Generate timeline data for statistics
   */
  private async generateTimeline(
    startDate: Date,
    endDate: Date,
    timeRange: string
  ): Promise<Array<{ timestamp: Date; count: number }>> {
    try {
      let intervalMinutes: number;
      let intervals: number;

      switch (timeRange) {
        case 'hour':
          intervalMinutes = 5; // 5-minute intervals
          intervals = 12;
          break;
        case 'day':
          intervalMinutes = 60; // 1-hour intervals
          intervals = 24;
          break;
        case 'week':
          intervalMinutes = 24 * 60; // 1-day intervals
          intervals = 7;
          break;
        case 'month':
          intervalMinutes = 24 * 60; // 1-day intervals
          intervals = 30;
          break;
        default:
          intervalMinutes = 60;
          intervals = 24;
      }

      const timeline: Array<{ timestamp: Date; count: number }> = [];
      const intervalMs = intervalMinutes * 60 * 1000;

      for (let i = 0; i < intervals; i++) {
        const intervalStart = new Date(startDate.getTime() + i * intervalMs);
        const intervalEnd = new Date(intervalStart.getTime() + intervalMs);

        const count = await db.rateLimitLog.count({
          where: {
            createdAt: {
              gte: intervalStart,
              lt: intervalEnd
            }
          }
        });

        timeline.push({
          timestamp: intervalStart,
          count
        });
      }

      return timeline;

    } catch (error) {
      console.error('Failed to generate timeline:', error);
      return [];
    }
  }
}

export const rateLimitLogger = new RateLimitLogger();