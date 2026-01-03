/**
 * Calendar Performance Monitor
 * 
 * Monitors and logs performance metrics for calendar operations.
 * Helps identify bottlenecks and optimization opportunities.
 * 
 * Performance Requirements: Task 23
 */

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class CalendarPerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics: number = 1000; // Keep last 1000 metrics
  private enabled: boolean = process.env.NODE_ENV === 'development';

  /**
   * Start timing an operation
   */
  startTimer(operation: string): (metadata?: Record<string, any>) => void {
    if (!this.enabled) {
      return () => { }; // No-op in production
    }

    const startTime = performance.now();
    const startTimestamp = new Date();

    return (metadata?: Record<string, any>) => {
      const duration = performance.now() - startTime;
      this.recordMetric({
        operation,
        duration,
        timestamp: startTimestamp,
        metadata
      });
    };
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only the last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log slow operations (> 1 second)
    if (metric.duration > 1000) {
      console.warn(
        `[Calendar Performance] Slow operation detected: ${metric.operation} took ${metric.duration.toFixed(2)}ms`,
        metric.metadata
      );
    }
  }

  /**
   * Get performance statistics
   */
  getStatistics(operation?: string): {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    p50Duration: number;
    p95Duration: number;
    p99Duration: number;
  } {
    const filteredMetrics = operation
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics;

    if (filteredMetrics.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p50Duration: 0,
        p95Duration: 0,
        p99Duration: 0
      };
    }

    const durations = filteredMetrics.map(m => m.duration).sort((a, b) => a - b);
    const sum = durations.reduce((acc, d) => acc + d, 0);

    return {
      count: filteredMetrics.length,
      avgDuration: sum / filteredMetrics.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p50Duration: durations[Math.floor(durations.length * 0.5)],
      p95Duration: durations[Math.floor(durations.length * 0.95)],
      p99Duration: durations[Math.floor(durations.length * 0.99)]
    };
  }

  /**
   * Get all recorded operations
   */
  getOperations(): string[] {
    return Array.from(new Set(this.metrics.map(m => m.operation)));
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Get recent slow operations
   */
  getSlowOperations(threshold: number = 1000, limit: number = 10): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.duration > threshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const operations = this.getOperations();
    let report = '=== Calendar Performance Report ===\n\n';

    operations.forEach(operation => {
      const stats = this.getStatistics(operation);
      report += `Operation: ${operation}\n`;
      report += `  Count: ${stats.count}\n`;
      report += `  Avg: ${stats.avgDuration.toFixed(2)}ms\n`;
      report += `  Min: ${stats.minDuration.toFixed(2)}ms\n`;
      report += `  Max: ${stats.maxDuration.toFixed(2)}ms\n`;
      report += `  P50: ${stats.p50Duration.toFixed(2)}ms\n`;
      report += `  P95: ${stats.p95Duration.toFixed(2)}ms\n`;
      report += `  P99: ${stats.p99Duration.toFixed(2)}ms\n\n`;
    });

    const slowOps = this.getSlowOperations();
    if (slowOps.length > 0) {
      report += '=== Recent Slow Operations ===\n\n';
      slowOps.forEach(op => {
        report += `${op.operation}: ${op.duration.toFixed(2)}ms at ${op.timestamp.toISOString()}\n`;
        if (op.metadata) {
          report += `  Metadata: ${JSON.stringify(op.metadata)}\n`;
        }
      });
    }

    return report;
  }
}

// Singleton instance
export const calendarPerformanceMonitor = new CalendarPerformanceMonitor();

/**
 * Decorator for monitoring async function performance
 */
export function monitorPerformance(operation: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const endTimer = calendarPerformanceMonitor.startTimer(operation);
      try {
        const result = await originalMethod.apply(this, args);
        endTimer({ success: true });
        return result;
      } catch (error) {
        endTimer({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Wrapper function for monitoring performance
 */
export async function withPerformanceMonitoring<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const endTimer = calendarPerformanceMonitor.startTimer(operation);
  try {
    const result = await fn();
    endTimer({ ...metadata, success: true });
    return result;
  } catch (error) {
    endTimer({
      ...metadata,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Performance thresholds for calendar operations
 */
export const PERFORMANCE_THRESHOLDS = {
  // Database queries
  QUERY_EVENTS: 500, // 500ms
  QUERY_CATEGORIES: 100, // 100ms
  QUERY_PREFERENCES: 100, // 100ms

  // Service operations
  CREATE_EVENT: 1000, // 1s
  UPDATE_EVENT: 1000, // 1s
  DELETE_EVENT: 500, // 500ms

  // Recurring event operations
  GENERATE_INSTANCES: 2000, // 2s

  // API endpoints
  API_GET_EVENTS: 1000, // 1s
  API_POST_EVENT: 1500, // 1.5s

  // UI rendering
  RENDER_CALENDAR: 500, // 500ms
  RENDER_EVENT_LIST: 300, // 300ms
} as const;

/**
 * Check if operation exceeded threshold
 */
export function checkPerformanceThreshold(
  operation: keyof typeof PERFORMANCE_THRESHOLDS,
  duration: number
): boolean {
  const threshold = PERFORMANCE_THRESHOLDS[operation];
  if (duration > threshold) {
    console.warn(
      `[Calendar Performance] Operation "${operation}" exceeded threshold: ${duration.toFixed(2)}ms > ${threshold}ms`
    );
    return false;
  }
  return true;
}
