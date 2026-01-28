/**
 * Comprehensive Logging and Monitoring Integration
 * 
 * Provides centralized logging, monitoring, and observability for the entire
 * super-admin SaaS platform. Integrates with all services to provide
 * comprehensive visibility into system operations.
 */

import { monitoringService } from '@/lib/services/monitoring-service';
import { logAuditEvent, AuditContext } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  service: string;
  operation?: string;
  userId?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
  error?: Error;
  duration?: number;
}

export interface PerformanceMetric {
  operation: string;
  service: string;
  duration: number;
  success: boolean;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ErrorContext {
  service: string;
  operation: string;
  error: Error;
  userId?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

export interface LoggingConfig {
  enableConsoleLogging: boolean;
  enableFileLogging: boolean;
  enableMonitoringIntegration: boolean;
  enableAuditIntegration: boolean;
  logLevel: LogLevel;
  performanceThresholds: {
    warning: number; // ms
    error: number; // ms
  };
  errorReporting: {
    enabled: boolean;
    criticalErrorThreshold: number;
  };
}

// ============================================================================
// Comprehensive Logger
// ============================================================================

export class ComprehensiveLogger {
  private config: LoggingConfig;
  private logBuffer: LogEntry[] = [];
  private performanceBuffer: PerformanceMetric[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: Partial<LoggingConfig> = {}) {
    this.config = {
      enableConsoleLogging: process.env.NODE_ENV === 'development',
      enableFileLogging: process.env.NODE_ENV === 'production',
      enableMonitoringIntegration: true,
      enableAuditIntegration: true,
      logLevel: (process.env.LOG_LEVEL as LogLevel) || 'info',
      performanceThresholds: {
        warning: 1000, // 1 second
        error: 5000, // 5 seconds
      },
      errorReporting: {
        enabled: true,
        criticalErrorThreshold: 5, // 5 critical errors in 5 minutes
      },
      ...config,
    };

    this.startPeriodicFlush();
  }

  /**
   * Log a message with specified level
   */
  async log(
    level: LogLevel,
    message: string,
    service: string,
    options: {
      operation?: string;
      userId?: string;
      correlationId?: string;
      metadata?: Record<string, any>;
      error?: Error;
      duration?: number;
    } = {}
  ): Promise<void> {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      service,
      ...options,
    };

    // Add to buffer
    this.logBuffer.push(logEntry);

    // Console logging
    if (this.config.enableConsoleLogging) {
      this.logToConsole(logEntry);
    }

    // Immediate processing for critical errors
    if (level === 'critical' || level === 'error') {
      await this.processErrorLog(logEntry);
    }

    // Performance monitoring
    if (options.duration !== undefined) {
      await this.recordPerformanceMetric({
        operation: options.operation || 'unknown',
        service,
        duration: options.duration,
        success: level !== 'error' && level !== 'critical',
        timestamp: new Date(),
        metadata: options.metadata,
      });
    }

    // Flush buffer if it's getting large
    if (this.logBuffer.length > 100) {
      await this.flushLogs();
    }
  }

  /**
   * Log debug message
   */
  async debug(
    message: string,
    service: string,
    options?: Omit<Parameters<typeof this.log>[3], 'level'>
  ): Promise<void> {
    await this.log('debug', message, service, options);
  }

  /**
   * Log info message
   */
  async info(
    message: string,
    service: string,
    options?: Omit<Parameters<typeof this.log>[3], 'level'>
  ): Promise<void> {
    await this.log('info', message, service, options);
  }

  /**
   * Log warning message
   */
  async warn(
    message: string,
    service: string,
    options?: Omit<Parameters<typeof this.log>[3], 'level'>
  ): Promise<void> {
    await this.log('warn', message, service, options);
  }

  /**
   * Log error message
   */
  async error(
    message: string,
    service: string,
    options?: Omit<Parameters<typeof this.log>[3], 'level'>
  ): Promise<void> {
    await this.log('error', message, service, options);
  }

  /**
   * Log critical message
   */
  async critical(
    message: string,
    service: string,
    options?: Omit<Parameters<typeof this.log>[3], 'level'>
  ): Promise<void> {
    await this.log('critical', message, service, options);
  }

  /**
   * Log operation start
   */
  async logOperationStart(
    operation: string,
    service: string,
    userId?: string,
    correlationId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.info(`Operation started: ${operation}`, service, {
      operation,
      userId,
      correlationId,
      metadata: { ...metadata, operationPhase: 'start' },
    });
  }

  /**
   * Log operation completion
   */
  async logOperationComplete(
    operation: string,
    service: string,
    duration: number,
    userId?: string,
    correlationId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const level = this.getPerformanceLogLevel(duration);
    
    await this.log(level, `Operation completed: ${operation} (${duration}ms)`, service, {
      operation,
      userId,
      correlationId,
      duration,
      metadata: { ...metadata, operationPhase: 'complete' },
    });
  }

  /**
   * Log operation failure
   */
  async logOperationFailure(
    operation: string,
    service: string,
    error: Error,
    duration: number,
    userId?: string,
    correlationId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.error(`Operation failed: ${operation} - ${error.message}`, service, {
      operation,
      userId,
      correlationId,
      duration,
      error,
      metadata: { ...metadata, operationPhase: 'failure' },
    });
  }

  /**
   * Record performance metric
   */
  private async recordPerformanceMetric(metric: PerformanceMetric): Promise<void> {
    this.performanceBuffer.push(metric);

    // Send to monitoring service if enabled
    if (this.config.enableMonitoringIntegration) {
      try {
        await monitoringService.recordPerformanceMetric(
          'operation_duration',
          metric.duration,
          'ms',
          metric.service,
          {
            operation: metric.operation,
            success: metric.success,
            ...metric.metadata,
          }
        );
      } catch (error) {
        console.error('Failed to record performance metric:', error);
      }
    }

    // Check performance thresholds
    if (metric.duration > this.config.performanceThresholds.error) {
      await this.createPerformanceAlert(metric, 'ERROR');
    } else if (metric.duration > this.config.performanceThresholds.warning) {
      await this.createPerformanceAlert(metric, 'WARNING');
    }
  }

  /**
   * Process error logs for monitoring and alerting
   */
  private async processErrorLog(logEntry: LogEntry): Promise<void> {
    try {
      // Create monitoring alert for errors
      if (this.config.enableMonitoringIntegration) {
        await monitoringService.createAlert({
          alertType: logEntry.level === 'critical' ? 'critical_error' : 'api_error',
          severity: logEntry.level === 'critical' ? 'CRITICAL' : 'ERROR',
          title: `${logEntry.service} Error: ${logEntry.operation || 'Unknown Operation'}`,
          description: logEntry.message,
          metadata: {
            service: logEntry.service,
            operation: logEntry.operation,
            userId: logEntry.userId,
            correlationId: logEntry.correlationId,
            error: logEntry.error?.stack,
            ...logEntry.metadata,
          },
        });
      }

      // Log to audit service if enabled
      if (this.config.enableAuditIntegration && logEntry.userId) {
        const auditContext: AuditContext = {
          userId: logEntry.userId,
          action: 'CREATE' as AuditAction,
          resource: 'ERROR_LOG',
          resourceId: logEntry.correlationId,
          metadata: {
            level: logEntry.level,
            service: logEntry.service,
            operation: logEntry.operation,
            message: logEntry.message,
            error: logEntry.error?.message,
            ...logEntry.metadata,
          },
        };

        await logAuditEvent(auditContext);
      }

    } catch (error) {
      console.error('Failed to process error log:', error);
    }
  }

  /**
   * Create performance alert
   */
  private async createPerformanceAlert(
    metric: PerformanceMetric,
    severity: 'WARNING' | 'ERROR'
  ): Promise<void> {
    try {
      if (this.config.enableMonitoringIntegration) {
        await monitoringService.createAlert({
          alertType: 'performance',
          severity,
          title: `Slow Operation: ${metric.service}.${metric.operation}`,
          description: `Operation took ${metric.duration}ms, exceeding ${severity.toLowerCase()} threshold`,
          threshold: severity === 'ERROR' 
            ? this.config.performanceThresholds.error 
            : this.config.performanceThresholds.warning,
          currentValue: metric.duration,
          metadata: {
            service: metric.service,
            operation: metric.operation,
            success: metric.success,
            ...metric.metadata,
          },
        });
      }
    } catch (error) {
      console.error('Failed to create performance alert:', error);
    }
  }

  /**
   * Determine if log should be processed based on level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'critical'];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const logLevelIndex = levels.indexOf(level);
    
    return logLevelIndex >= currentLevelIndex;
  }

  /**
   * Get appropriate log level based on performance duration
   */
  private getPerformanceLogLevel(duration: number): LogLevel {
    if (duration > this.config.performanceThresholds.error) {
      return 'error';
    } else if (duration > this.config.performanceThresholds.warning) {
      return 'warn';
    } else {
      return 'info';
    }
  }

  /**
   * Log to console with appropriate formatting
   */
  private logToConsole(logEntry: LogEntry): void {
    const timestamp = logEntry.timestamp.toISOString();
    const level = logEntry.level.toUpperCase().padEnd(8);
    const service = logEntry.service.padEnd(15);
    const operation = logEntry.operation ? `[${logEntry.operation}]` : '';
    const correlationId = logEntry.correlationId ? `{${logEntry.correlationId}}` : '';
    
    const message = `${timestamp} ${level} ${service} ${operation} ${correlationId} ${logEntry.message}`;
    
    switch (logEntry.level) {
      case 'debug':
        console.debug(message, logEntry.metadata);
        break;
      case 'info':
        console.info(message, logEntry.metadata);
        break;
      case 'warn':
        console.warn(message, logEntry.metadata);
        break;
      case 'error':
      case 'critical':
        console.error(message, logEntry.error, logEntry.metadata);
        break;
    }
  }

  /**
   * Start periodic log flushing
   */
  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(async () => {
      await this.flushLogs();
    }, 30000); // Flush every 30 seconds
  }

  /**
   * Flush buffered logs
   */
  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0 && this.performanceBuffer.length === 0) {
      return;
    }

    try {
      // Process log buffer
      if (this.config.enableFileLogging && this.logBuffer.length > 0) {
        await this.writeLogsToFile(this.logBuffer);
      }

      // Process performance buffer
      if (this.performanceBuffer.length > 0) {
        await this.processPerformanceMetrics(this.performanceBuffer);
      }

      // Clear buffers
      this.logBuffer = [];
      this.performanceBuffer = [];

    } catch (error) {
      console.error('Failed to flush logs:', error);
    }
  }

  /**
   * Write logs to file (placeholder implementation)
   */
  private async writeLogsToFile(logs: LogEntry[]): Promise<void> {
    // In a real implementation, this would write to log files
    // For now, we'll just log that we would write to files
    console.log(`Would write ${logs.length} log entries to file`);
  }

  /**
   * Process performance metrics for analysis
   */
  private async processPerformanceMetrics(metrics: PerformanceMetric[]): Promise<void> {
    // Calculate aggregated metrics
    const serviceMetrics = new Map<string, { total: number; count: number; errors: number }>();
    
    for (const metric of metrics) {
      const key = `${metric.service}.${metric.operation}`;
      const existing = serviceMetrics.get(key) || { total: 0, count: 0, errors: 0 };
      
      existing.total += metric.duration;
      existing.count += 1;
      if (!metric.success) {
        existing.errors += 1;
      }
      
      serviceMetrics.set(key, existing);
    }

    // Log aggregated metrics
    for (const [key, stats] of serviceMetrics) {
      const avgDuration = stats.total / stats.count;
      const errorRate = (stats.errors / stats.count) * 100;
      
      await this.info(
        `Performance summary: ${key} - avg: ${avgDuration.toFixed(2)}ms, errors: ${errorRate.toFixed(1)}%`,
        'performance-monitor',
        {
          operation: 'performance-summary',
          metadata: {
            operationKey: key,
            averageDuration: avgDuration,
            errorRate,
            totalOperations: stats.count,
          },
        }
      );
    }
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
    
    // Final flush
    this.flushLogs().catch(error => {
      console.error('Failed to flush logs during disposal:', error);
    });
  }
}

// ============================================================================
// Decorator for Automatic Operation Logging
// ============================================================================

export function logOperation(service: string, operation?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const operationName = operation || propertyName;

    descriptor.value = async function (...args: any[]) {
      const correlationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const startTime = Date.now();

      await logger.logOperationStart(operationName, service, undefined, correlationId);

      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - startTime;
        
        await logger.logOperationComplete(operationName, service, duration, undefined, correlationId);
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        await logger.logOperationFailure(
          operationName,
          service,
          error instanceof Error ? error : new Error('Unknown error'),
          duration,
          undefined,
          correlationId
        );
        
        throw error;
      }
    };

    return descriptor;
  };
}

// ============================================================================
// Factory and Singleton
// ============================================================================

export function createLogger(config?: Partial<LoggingConfig>): ComprehensiveLogger {
  return new ComprehensiveLogger(config);
}

// Export singleton instance
export const logger = createLogger();