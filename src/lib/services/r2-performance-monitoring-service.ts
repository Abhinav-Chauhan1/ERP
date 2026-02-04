/**
 * R2 Performance Monitoring Service
 * 
 * This service provides comprehensive performance monitoring and metrics
 * collection for R2 storage operations. It tracks upload/download times,
 * error rates, throughput, and other performance indicators.
 * 
 * Requirements: 10.4 - Performance monitoring and metrics collection
 */

import { monitoringService } from './monitoring-service';

/**
 * R2 operation types
 */
export type R2OperationType = 
  | 'upload' 
  | 'download' 
  | 'delete' 
  | 'list' 
  | 'metadata' 
  | 'presigned_url'
  | 'chunked_upload'
  | 'format_conversion';

/**
 * Performance metric data
 */
export interface R2PerformanceMetric {
  operation: R2OperationType;
  duration: number; // milliseconds
  fileSize?: number; // bytes
  schoolId?: string;
  success: boolean;
  errorType?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Performance statistics
 */
export interface R2PerformanceStats {
  operation: R2OperationType;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageDuration: number;
  medianDuration: number;
  p95Duration: number;
  p99Duration: number;
  errorRate: number;
  throughput: number; // operations per second
  averageFileSize?: number;
  totalDataTransferred?: number;
}

/**
 * Performance alert thresholds
 */
export interface R2PerformanceThresholds {
  maxAverageResponseTime: number; // milliseconds
  maxErrorRate: number; // percentage
  minThroughput: number; // operations per second
  maxP95ResponseTime: number; // milliseconds
}

/**
 * Performance monitoring configuration
 */
export interface R2MonitoringConfig {
  enableMetrics: boolean;
  enableAlerts: boolean;
  metricsRetentionDays: number;
  alertThresholds: R2PerformanceThresholds;
  samplingRate: number; // 0.0 to 1.0
}

/**
 * R2 Performance Monitoring Service Class
 * 
 * Provides comprehensive performance monitoring for R2 operations
 */
export class R2PerformanceMonitoringService {
  private metrics: R2PerformanceMetric[] = [];
  private config: R2MonitoringConfig = {
    enableMetrics: true,
    enableAlerts: true,
    metricsRetentionDays: 7,
    alertThresholds: {
      maxAverageResponseTime: 5000, // 5 seconds
      maxErrorRate: 5, // 5%
      minThroughput: 1, // 1 operation per second
      maxP95ResponseTime: 10000, // 10 seconds
    },
    samplingRate: 1.0, // Monitor all operations
  };

  constructor(config?: Partial<R2MonitoringConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Clean up old metrics periodically
    setInterval(() => this.cleanupOldMetrics(), 60 * 60 * 1000); // Every hour
  }

  /**
   * Record performance metric for R2 operation
   * 
   * @param metric - Performance metric data
   */
  async recordMetric(metric: R2PerformanceMetric): Promise<void> {
    if (!this.config.enableMetrics) return;

    // Apply sampling rate
    if (Math.random() > this.config.samplingRate) return;

    try {
      // Store metric locally
      this.metrics.push(metric);

      // Record in monitoring service
      await monitoringService.recordPerformanceMetric(
        `r2_${metric.operation}`,
        metric.duration,
        'milliseconds',
        'r2_storage',
        {
          fileSize: metric.fileSize,
          schoolId: metric.schoolId,
          success: metric.success,
          errorType: metric.errorType,
          ...metric.metadata,
        }
      );

      // Check for performance alerts
      if (this.config.enableAlerts) {
        await this.checkPerformanceAlerts(metric);
      }
    } catch (error) {
      console.error('Error recording R2 performance metric:', error);
    }
  }

  /**
   * Get performance statistics for operation type
   * 
   * @param operation - Operation type
   * @param timeRangeHours - Time range in hours (default: 24)
   * @param schoolId - Optional school filter
   * @returns Performance statistics
   */
  getPerformanceStats(
    operation: R2OperationType,
    timeRangeHours: number = 24,
    schoolId?: string
  ): R2PerformanceStats {
    const cutoffTime = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);
    
    const relevantMetrics = this.metrics.filter(metric => 
      metric.operation === operation &&
      metric.timestamp >= cutoffTime &&
      (!schoolId || metric.schoolId === schoolId)
    );

    if (relevantMetrics.length === 0) {
      return {
        operation,
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageDuration: 0,
        medianDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
        errorRate: 0,
        throughput: 0,
      };
    }

    const successfulMetrics = relevantMetrics.filter(m => m.success);
    const failedMetrics = relevantMetrics.filter(m => !m.success);
    
    const durations = relevantMetrics.map(m => m.duration).sort((a, b) => a - b);
    const fileSizes = relevantMetrics
      .filter(m => m.fileSize !== undefined)
      .map(m => m.fileSize!);

    const totalOperations = relevantMetrics.length;
    const successfulOperations = successfulMetrics.length;
    const failedOperations = failedMetrics.length;
    
    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const medianDuration = durations[Math.floor(durations.length / 2)];
    const p95Duration = durations[Math.floor(durations.length * 0.95)];
    const p99Duration = durations[Math.floor(durations.length * 0.99)];
    
    const errorRate = (failedOperations / totalOperations) * 100;
    const throughput = totalOperations / timeRangeHours / 3600; // operations per second
    
    const averageFileSize = fileSizes.length > 0 
      ? fileSizes.reduce((sum, size) => sum + size, 0) / fileSizes.length 
      : undefined;
    
    const totalDataTransferred = fileSizes.length > 0 
      ? fileSizes.reduce((sum, size) => sum + size, 0) 
      : undefined;

    return {
      operation,
      totalOperations,
      successfulOperations,
      failedOperations,
      averageDuration,
      medianDuration,
      p95Duration,
      p99Duration,
      errorRate,
      throughput,
      averageFileSize,
      totalDataTransferred,
    };
  }

  /**
   * Get comprehensive performance report
   * 
   * @param timeRangeHours - Time range in hours
   * @param schoolId - Optional school filter
   * @returns Performance report for all operations
   */
  getPerformanceReport(timeRangeHours: number = 24, schoolId?: string): {
    summary: {
      totalOperations: number;
      overallErrorRate: number;
      averageResponseTime: number;
      totalDataTransferred: number;
    };
    operationStats: R2PerformanceStats[];
    alerts: string[];
  } {
    const operations: R2OperationType[] = [
      'upload', 'download', 'delete', 'list', 'metadata', 
      'presigned_url', 'chunked_upload', 'format_conversion'
    ];

    const operationStats = operations.map(op => 
      this.getPerformanceStats(op, timeRangeHours, schoolId)
    );

    const totalOperations = operationStats.reduce((sum, stats) => sum + stats.totalOperations, 0);
    const totalFailedOperations = operationStats.reduce((sum, stats) => sum + stats.failedOperations, 0);
    const overallErrorRate = totalOperations > 0 ? (totalFailedOperations / totalOperations) * 100 : 0;
    
    const weightedAverageResponseTime = operationStats.reduce((sum, stats) => 
      sum + (stats.averageDuration * stats.totalOperations), 0
    ) / (totalOperations || 1);

    const totalDataTransferred = operationStats.reduce((sum, stats) => 
      sum + (stats.totalDataTransferred || 0), 0
    );

    const alerts = this.generatePerformanceAlerts(operationStats);

    return {
      summary: {
        totalOperations,
        overallErrorRate,
        averageResponseTime: weightedAverageResponseTime,
        totalDataTransferred,
      },
      operationStats,
      alerts,
    };
  }

  /**
   * Monitor operation with automatic metric recording
   * 
   * @param operation - Operation type
   * @param schoolId - School identifier
   * @param fileSize - Optional file size
   * @param metadata - Optional metadata
   * @returns Monitoring wrapper function
   */
  monitorOperation<T>(
    operation: R2OperationType,
    schoolId?: string,
    fileSize?: number,
    metadata?: Record<string, unknown>
  ) {
    return async (operationFn: () => Promise<T>): Promise<T> => {
      const startTime = Date.now();
      let success = false;
      let errorType: string | undefined;

      try {
        const result = await operationFn();
        success = true;
        return result;
      } catch (error) {
        success = false;
        errorType = error instanceof Error ? error.constructor.name : 'UnknownError';
        throw error;
      } finally {
        const duration = Date.now() - startTime;
        
        await this.recordMetric({
          operation,
          duration,
          fileSize,
          schoolId,
          success,
          errorType,
          timestamp: new Date(),
          metadata,
        });
      }
    };
  }

  /**
   * Get real-time performance metrics
   * 
   * @param operation - Operation type
   * @param windowMinutes - Time window in minutes
   * @returns Real-time metrics
   */
  getRealTimeMetrics(operation: R2OperationType, windowMinutes: number = 5): {
    currentThroughput: number;
    currentErrorRate: number;
    currentAverageResponseTime: number;
    recentErrors: Array<{ timestamp: Date; error: string }>;
  } {
    const cutoffTime = new Date(Date.now() - windowMinutes * 60 * 1000);
    
    const recentMetrics = this.metrics.filter(metric => 
      metric.operation === operation && metric.timestamp >= cutoffTime
    );

    const totalOperations = recentMetrics.length;
    const failedOperations = recentMetrics.filter(m => !m.success).length;
    const currentErrorRate = totalOperations > 0 ? (failedOperations / totalOperations) * 100 : 0;
    
    const currentThroughput = totalOperations / (windowMinutes * 60); // operations per second
    
    const currentAverageResponseTime = totalOperations > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations 
      : 0;

    const recentErrors = recentMetrics
      .filter(m => !m.success && m.errorType)
      .map(m => ({
        timestamp: m.timestamp,
        error: m.errorType!,
      }))
      .slice(-10); // Last 10 errors

    return {
      currentThroughput,
      currentErrorRate,
      currentAverageResponseTime,
      recentErrors,
    };
  }

  /**
   * Check for performance alerts
   * 
   * @param metric - Latest performance metric
   */
  private async checkPerformanceAlerts(metric: R2PerformanceMetric): Promise<void> {
    const stats = this.getPerformanceStats(metric.operation, 1); // Last hour
    const thresholds = this.config.alertThresholds;

    // Check average response time
    if (stats.averageDuration > thresholds.maxAverageResponseTime) {
      await monitoringService.createAlert({
        alertType: 'performance',
        severity: 'WARNING',
        title: `High R2 ${metric.operation} Response Time`,
        description: `Average response time (${stats.averageDuration.toFixed(0)}ms) exceeds threshold (${thresholds.maxAverageResponseTime}ms)`,
        threshold: thresholds.maxAverageResponseTime,
        currentValue: stats.averageDuration,
        schoolId: metric.schoolId,
        metadata: {
          operation: metric.operation,
          p95Duration: stats.p95Duration,
          totalOperations: stats.totalOperations,
        },
      });
    }

    // Check error rate
    if (stats.errorRate > thresholds.maxErrorRate) {
      await monitoringService.createAlert({
        alertType: 'error_rate',
        severity: stats.errorRate > 10 ? 'CRITICAL' : 'WARNING',
        title: `High R2 ${metric.operation} Error Rate`,
        description: `Error rate (${stats.errorRate.toFixed(1)}%) exceeds threshold (${thresholds.maxErrorRate}%)`,
        threshold: thresholds.maxErrorRate,
        currentValue: stats.errorRate,
        schoolId: metric.schoolId,
        metadata: {
          operation: metric.operation,
          failedOperations: stats.failedOperations,
          totalOperations: stats.totalOperations,
        },
      });
    }

    // Check throughput
    if (stats.throughput < thresholds.minThroughput && stats.totalOperations > 10) {
      await monitoringService.createAlert({
        alertType: 'performance',
        severity: 'WARNING',
        title: `Low R2 ${metric.operation} Throughput`,
        description: `Throughput (${stats.throughput.toFixed(2)} ops/sec) below threshold (${thresholds.minThroughput} ops/sec)`,
        threshold: thresholds.minThroughput,
        currentValue: stats.throughput,
        schoolId: metric.schoolId,
        metadata: {
          operation: metric.operation,
          totalOperations: stats.totalOperations,
        },
      });
    }

    // Check P95 response time
    if (stats.p95Duration > thresholds.maxP95ResponseTime) {
      await monitoringService.createAlert({
        alertType: 'performance',
        severity: 'WARNING',
        title: `High R2 ${metric.operation} P95 Response Time`,
        description: `P95 response time (${stats.p95Duration.toFixed(0)}ms) exceeds threshold (${thresholds.maxP95ResponseTime}ms)`,
        threshold: thresholds.maxP95ResponseTime,
        currentValue: stats.p95Duration,
        schoolId: metric.schoolId,
        metadata: {
          operation: metric.operation,
          averageDuration: stats.averageDuration,
          totalOperations: stats.totalOperations,
        },
      });
    }
  }

  /**
   * Generate performance alerts from statistics
   * 
   * @param operationStats - Operation statistics
   * @returns Array of alert messages
   */
  private generatePerformanceAlerts(operationStats: R2PerformanceStats[]): string[] {
    const alerts: string[] = [];
    const thresholds = this.config.alertThresholds;

    for (const stats of operationStats) {
      if (stats.totalOperations === 0) continue;

      if (stats.averageDuration > thresholds.maxAverageResponseTime) {
        alerts.push(
          `${stats.operation}: High average response time (${stats.averageDuration.toFixed(0)}ms)`
        );
      }

      if (stats.errorRate > thresholds.maxErrorRate) {
        alerts.push(
          `${stats.operation}: High error rate (${stats.errorRate.toFixed(1)}%)`
        );
      }

      if (stats.throughput < thresholds.minThroughput && stats.totalOperations > 10) {
        alerts.push(
          `${stats.operation}: Low throughput (${stats.throughput.toFixed(2)} ops/sec)`
        );
      }

      if (stats.p95Duration > thresholds.maxP95ResponseTime) {
        alerts.push(
          `${stats.operation}: High P95 response time (${stats.p95Duration.toFixed(0)}ms)`
        );
      }
    }

    return alerts;
  }

  /**
   * Clean up old metrics based on retention policy
   */
  private cleanupOldMetrics(): void {
    const cutoffTime = new Date(Date.now() - this.config.metricsRetentionDays * 24 * 60 * 60 * 1000);
    const initialCount = this.metrics.length;
    
    this.metrics = this.metrics.filter(metric => metric.timestamp >= cutoffTime);
    
    const removedCount = initialCount - this.metrics.length;
    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} old R2 performance metrics`);
    }
  }

  /**
   * Export metrics for external analysis
   * 
   * @param timeRangeHours - Time range in hours
   * @param format - Export format
   * @returns Exported metrics data
   */
  exportMetrics(timeRangeHours: number = 24, format: 'json' | 'csv' = 'json'): string {
    const cutoffTime = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);
    const relevantMetrics = this.metrics.filter(metric => metric.timestamp >= cutoffTime);

    if (format === 'csv') {
      const headers = [
        'timestamp', 'operation', 'duration', 'fileSize', 'schoolId', 
        'success', 'errorType'
      ];
      
      const rows = relevantMetrics.map(metric => [
        metric.timestamp.toISOString(),
        metric.operation,
        metric.duration.toString(),
        metric.fileSize?.toString() || '',
        metric.schoolId || '',
        metric.success.toString(),
        metric.errorType || '',
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify(relevantMetrics, null, 2);
  }

  /**
   * Get current configuration
   * 
   * @returns Current monitoring configuration
   */
  getConfig(): R2MonitoringConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * 
   * @param newConfig - New configuration values
   */
  updateConfig(newConfig: Partial<R2MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const r2PerformanceMonitoringService = new R2PerformanceMonitoringService();