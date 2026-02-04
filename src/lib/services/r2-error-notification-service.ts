/**
 * R2 Error Notification Service
 * 
 * This service provides comprehensive error notification system for
 * administrators when critical R2 storage errors occur.
 * 
 * Requirements: 10.5 - Error notification system for administrators
 */

import { monitoringService } from './monitoring-service';
import { db } from '@/lib/db';

export type ErrorSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ErrorCategory = 
  | 'CONFIGURATION'
  | 'AUTHENTICATION'
  | 'VALIDATION'
  | 'RATE_LIMIT'
  | 'NETWORK'
  | 'API_ERROR'
  | 'DATABASE'
  | 'UNKNOWN';

export interface R2ErrorNotification {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  title: string;
  description: string;
  schoolId?: string;
  userId?: string;
  operation?: string;
  errorDetails: {
    message: string;
    stack?: string;
    code?: string;
    statusCode?: number;
    metadata?: Record<string, unknown>;
  };
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export class R2ErrorNotificationService {
  private notifications = new Map<string, R2ErrorNotification>();

  async reportError(
    error: Error,
    context?: {
      schoolId?: string;
      userId?: string;
      operation?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<string | null> {
    try {
      const { category, severity } = this.categorizeError(error, context);
      const notification = await this.createNotification(error, category, severity, context);
      
      // Send to monitoring service
      await monitoringService.createAlert({
        alertType: 'critical_error',
        severity: severity === 'CRITICAL' ? 'CRITICAL' : 'ERROR',
        title: notification.title,
        description: notification.description,
        schoolId: context?.schoolId,
        metadata: {
          category,
          operation: context?.operation,
          errorCode: (error as any).code,
          statusCode: (error as any).statusCode,
        },
      });

      return notification.id;
    } catch (notificationError) {
      console.error('Error in error notification service:', notificationError);
      return null;
    }
  }

  async reportQuotaExceeded(
    schoolId: string,
    currentUsage: number,
    quota: number,
    operation: string
  ): Promise<void> {
    const error = new Error(
      `Storage quota exceeded for school ${schoolId}: ` +
      `${(currentUsage / 1024 / 1024).toFixed(1)}MB used of ` +
      `${(quota / 1024 / 1024).toFixed(1)}MB limit`
    );

    await this.reportError(error, {
      schoolId,
      operation,
      metadata: {
        currentUsage,
        quota,
        utilizationPercentage: (currentUsage / quota) * 100,
      },
    });
  }

  async reportPerformanceDegradation(
    operation: string,
    metrics: {
      averageResponseTime: number;
      errorRate: number;
      throughput: number;
    },
    schoolId?: string
  ): Promise<void> {
    const error = new Error(
      `Performance degradation detected for ${operation}: ` +
      `avg response time ${metrics.averageResponseTime.toFixed(0)}ms, ` +
      `error rate ${metrics.errorRate.toFixed(1)}%, ` +
      `throughput ${metrics.throughput.toFixed(2)} ops/sec`
    );

    await this.reportError(error, {
      schoolId,
      operation,
      metadata: metrics,
    });
  }

  getActiveNotifications(filters?: {
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    schoolId?: string;
    resolved?: boolean;
  }): R2ErrorNotification[] {
    let notifications = Array.from(this.notifications.values());

    if (filters) {
      if (filters.category) {
        notifications = notifications.filter(n => n.category === filters.category);
      }
      if (filters.severity) {
        notifications = notifications.filter(n => n.severity === filters.severity);
      }
      if (filters.schoolId) {
        notifications = notifications.filter(n => n.schoolId === filters.schoolId);
      }
      if (filters.resolved !== undefined) {
        notifications = notifications.filter(n => n.resolved === filters.resolved);
      }
    }

    return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async resolveNotification(notificationId: string, resolvedBy: string): Promise<boolean> {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    notification.resolved = true;
    notification.resolvedAt = new Date();
    notification.resolvedBy = resolvedBy;

    return true;
  }

  private categorizeError(
    error: Error,
    context?: Record<string, unknown>
  ): { category: ErrorCategory; severity: ErrorSeverity } {
    const message = error.message.toLowerCase();
    const statusCode = (error as any).statusCode;

    // Rate limit errors
    if (message.includes('quota') || message.includes('limit') || statusCode === 507 || statusCode === 429) {
      return { category: 'RATE_LIMIT', severity: 'HIGH' };
    }

    // Authentication errors
    if (message.includes('unauthorized') || message.includes('access denied') || 
        statusCode === 401 || statusCode === 403) {
      return { category: 'AUTHENTICATION', severity: 'CRITICAL' };
    }

    // Network errors
    if (message.includes('network') || message.includes('timeout') || 
        statusCode === 408 || statusCode === 502 || statusCode === 503) {
      return { category: 'NETWORK', severity: 'MEDIUM' };
    }

    // Configuration errors
    if (message.includes('configuration') || message.includes('config') || 
        statusCode === 400) {
      return { category: 'CONFIGURATION', severity: 'HIGH' };
    }

    // API errors
    if (statusCode >= 400 && statusCode < 500) {
      return { category: 'API_ERROR', severity: 'MEDIUM' };
    }

    // Database errors
    if (message.includes('database') || message.includes('db')) {
      return { category: 'DATABASE', severity: 'HIGH' };
    }
    // Default to unknown error
    return { category: 'UNKNOWN', severity: 'MEDIUM' };
  }

  private async createNotification(
    error: Error,
    category: ErrorCategory,
    severity: ErrorSeverity,
    context?: Record<string, unknown>
  ): Promise<R2ErrorNotification> {
    const id = `r2_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const notification: R2ErrorNotification = {
      id,
      category,
      severity,
      title: this.generateTitle(category, severity),
      description: this.generateDescription(error, category, context),
      schoolId: context?.schoolId as string,
      userId: context?.userId as string,
      operation: context?.operation as string,
      errorDetails: {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
        statusCode: (error as any).statusCode,
        metadata: context?.metadata as Record<string, unknown>,
      },
      timestamp: new Date(),
      resolved: false,
    };

    this.notifications.set(id, notification);

    // Store in database (only if schoolId is available)
    if (context?.schoolId) {
      try {
        await db.communicationErrorLog.create({
          data: {
            id,
            category: category,
            channel: null, // R2_STORAGE is not a valid CommunicationChannel
            severity: severity,
            message: error.message,
            resolved: false,
            school: { connect: { id: context.schoolId as string } },
          },
        });
      } catch (dbError) {
        console.error('Error storing notification in database:', dbError);
      }
    }

    return notification;
  }

  private generateTitle(category: ErrorCategory, severity: ErrorSeverity): string {
    const categoryTitles: Record<ErrorCategory, string> = {
      CONFIGURATION: 'R2 Configuration Error',
      AUTHENTICATION: 'R2 Authentication Error',
      VALIDATION: 'R2 Validation Error',
      RATE_LIMIT: 'R2 Rate Limit Error',
      NETWORK: 'R2 Network Error',
      API_ERROR: 'R2 API Error',
      DATABASE: 'R2 Database Error',
      UNKNOWN: 'R2 Unknown Error',
    };

    return `[${severity}] ${categoryTitles[category]}`;
  }

  private generateDescription(
    error: Error,
    category: ErrorCategory,
    context?: Record<string, unknown>
  ): string {
    let description = error.message;

    if (context?.schoolId) {
      description += ` (School: ${context.schoolId})`;
    }

    if (context?.operation) {
      description += ` (Operation: ${context.operation})`;
    }

    return description;
  }
}

// Export singleton instance
export const r2ErrorNotificationService = new R2ErrorNotificationService();