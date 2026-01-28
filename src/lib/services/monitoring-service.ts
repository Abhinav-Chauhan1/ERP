/**
 * Monitoring Service
 * 
 * Provides comprehensive system monitoring, alerting, and performance tracking
 * for the super-admin SaaS platform. This service handles real-time alerts,
 * system health monitoring, performance metrics, and threshold monitoring.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type SystemHealthStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN';
export type ComponentStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN';
export type AlertSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
export type AlertType = 'error_rate' | 'delivery_rate' | 'api_error' | 'critical_error' | 'usage_threshold' | 'performance' | 'system_health';
export type ThresholdCondition = 'greater' | 'less' | 'equal';
export type ThresholdStatusType = 'OK' | 'WARNING' | 'CRITICAL';
export type BottleneckType = 'cpu' | 'memory' | 'disk' | 'network' | 'database';
export type BottleneckSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type MetricType = 'response_time' | 'throughput' | 'error_rate' | 'cpu_usage' | 'memory_usage' | 'disk_usage';

export interface SystemHealth {
  overall: SystemHealthStatus;
  components: ComponentHealth[];
  lastUpdated: Date;
  uptime: number; // in seconds
  responseTime: number; // average response time in ms
}

export interface ComponentHealth {
  component: string;
  status: ComponentStatus;
  responseTime?: number;
  errorRate?: number;
  lastChecked: Date;
  metadata?: Record<string, unknown>;
}

export interface AlertConfig {
  id?: string;
  name: string;
  alertType: AlertType;
  threshold: number;
  condition: ThresholdCondition;
  enabled: boolean;
  notifyAdmins: boolean;
  notifyEmail: boolean;
  emailRecipients?: string[];
  metadata?: Record<string, unknown>;
  schoolId?: string;
}

export interface Alert {
  id: string;
  alertType: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  metadata?: Record<string, unknown>;
  threshold?: number;
  currentValue?: number;
  schoolId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceMetricData {
  id: string;
  metricType: MetricType;
  value: number;
  timestamp: Date;
  component?: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorLogData {
  id: string;
  category: string;
  channel: string;
  severity: BottleneckSeverity;
  errorMessage: string;
  resolved: boolean;
  createdAt: Date;
}

export interface PerformanceMetrics {
  timeRange: TimeRange;
  metrics: {
    averageResponseTime: number;
    throughput: number; // requests per second
    errorRate: number; // percentage
    cpuUsage: number; // percentage
    memoryUsage: number; // percentage
    diskUsage: number; // percentage
  };
  trends: {
    responseTime: TimeSeriesData[];
    throughput: TimeSeriesData[];
    errorRate: TimeSeriesData[];
  };
  bottlenecks: Bottleneck[];
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
}

export interface Bottleneck {
  component: string;
  type: BottleneckType;
  severity: BottleneckSeverity;
  description: string;
  impact: number; // percentage impact on performance
  recommendations: string[];
}

export interface ThresholdStatus {
  id: string;
  name: string;
  currentValue: number;
  threshold: number;
  status: ThresholdStatusType;
  lastChecked: Date;
  metadata?: Record<string, unknown>;
}

export interface ErrorAnalysis {
  timeRange: TimeRange;
  summary: {
    totalErrors: number;
    errorRate: number;
    criticalErrors: number;
    resolvedErrors: number;
  };
  errorsByType: ErrorGroup[];
  errorsByComponent: ErrorGroup[];
  trends: TimeSeriesData[];
  topErrors: TopError[];
}

export interface ErrorGroup {
  type: string;
  count: number;
  percentage: number;
}

export interface TopError {
  message: string;
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
}

export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

export interface CreateAlertConfig {
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  threshold?: number;
  currentValue?: number;
  schoolId?: string;
}

export interface AlertFilters {
  alertType?: string;
  severity?: string;
  isResolved?: boolean;
  schoolId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AlertResult {
  alerts: Alert[];
  total: number;
}

export interface MetricFilters {
  metricName?: string;
  schoolId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface MonitoringConfig {
  alertDelivery: {
    retryAttempts: number;
    retryDelay: number;
  };
  performance: {
    metricsRetentionDays: number;
    aggregationInterval: number;
  };
  thresholds: {
    checkInterval: number;
    defaultSeverity: BottleneckSeverity;
  };
  cache: {
    ttl: number; // milliseconds
    maxSize: number;
  };
}

// Result type for better error handling
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Validation schemas
export const AlertConfigSchema = z.object({
  name: z.string().min(1).max(100),
  alertType: z.enum(['error_rate', 'delivery_rate', 'api_error', 'critical_error', 'usage_threshold', 'performance', 'system_health']),
  threshold: z.number().positive(),
  condition: z.enum(['greater', 'less', 'equal']),
  enabled: z.boolean(),
  notifyAdmins: z.boolean(),
  notifyEmail: z.boolean(),
  emailRecipients: z.array(z.string().email()).optional(),
  metadata: z.record(z.unknown()).optional(),
  schoolId: z.string().optional(),
});

export const TimeRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date",
});

// ============================================================================
// Strategy Pattern for Alert Delivery
// ============================================================================

interface AlertDeliveryStrategy {
  deliver(alert: Alert, config: AlertConfig): Promise<void>;
}

class AdminNotificationStrategy implements AlertDeliveryStrategy {
  async deliver(alert: Alert, config: AlertConfig): Promise<void> {
    console.log(`[ADMIN ALERT] ${alert.severity}: ${alert.title} - ${alert.description}`);
  }
}

class EmailNotificationStrategy implements AlertDeliveryStrategy {
  async deliver(alert: Alert, config: AlertConfig): Promise<void> {
    if (config.emailRecipients && config.emailRecipients.length > 0) {
      console.log(`[EMAIL ALERT] Sending to ${config.emailRecipients.join(', ')}: ${alert.title}`);
      // In real implementation, integrate with email service
    }
  }
}

class AlertDeliveryManager {
  private strategies = new Map<string, AlertDeliveryStrategy>();
  
  constructor() {
    this.strategies.set('admin', new AdminNotificationStrategy());
    this.strategies.set('email', new EmailNotificationStrategy());
  }
  
  async deliverAlert(alert: Alert, config: AlertConfig): Promise<void> {
    try {
      if (config.notifyAdmins) {
        await this.strategies.get('admin')?.deliver(alert, config);
      }
      if (config.notifyEmail) {
        await this.strategies.get('email')?.deliver(alert, config);
      }
    } catch (error) {
      console.error('Error delivering alert:', error);
      // Don't throw to avoid breaking alert creation
    }
  }
}

// ============================================================================
// Query Builder for Database Operations
// ============================================================================

class MetricQueryBuilder {
  private where: Prisma.PerformanceMetricWhereInput = {};
  
  withTimeRange(startDate?: Date, endDate?: Date): this {
    if (startDate || endDate) {
      this.where.timestamp = {};
      if (startDate) this.where.timestamp.gte = startDate;
      if (endDate) this.where.timestamp.lte = endDate;
    }
    return this;
  }
  
  withMetricType(metricType?: string): this {
    if (metricType) this.where.metricType = metricType;
    return this;
  }
  
  withComponent(component?: string): this {
    if (component) this.where.component = component;
    return this;
  }
  
  build(): Prisma.PerformanceMetricWhereInput {
    return this.where;
  }
}

class AlertQueryBuilder {
  private where: Prisma.AlertWhereInput = {};
  
  withAlertType(alertType?: string): this {
    if (alertType) this.where.alertType = alertType;
    return this;
  }
  
  withSeverity(severity?: string): this {
    if (severity) this.where.severity = severity;
    return this;
  }
  
  withResolutionStatus(isResolved?: boolean): this {
    if (isResolved !== undefined) this.where.isResolved = isResolved;
    return this;
  }
  
  withSchool(schoolId?: string): this {
    if (schoolId) this.where.schoolId = schoolId;
    return this;
  }
  
  withTimeRange(startDate?: Date, endDate?: Date): this {
    if (startDate || endDate) {
      this.where.createdAt = {};
      if (startDate) this.where.createdAt.gte = startDate;
      if (endDate) this.where.createdAt.lte = endDate;
    }
    return this;
  }
  
  build(): Prisma.AlertWhereInput {
    return this.where;
  }
}

// ============================================================================
// Factory Pattern for Metric Processors
// ============================================================================

abstract class MetricProcessor {
  abstract process(metrics: PerformanceMetricData[]): {
    average: number;
    trends: TimeSeriesData[];
  };
  
  protected calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }
}

class ResponseTimeProcessor extends MetricProcessor {
  process(metrics: PerformanceMetricData[]) {
    const values = metrics.map(m => m.value);
    return {
      average: this.calculateAverage(values),
      trends: metrics.map(m => ({ timestamp: m.timestamp, value: m.value }))
    };
  }
}

class ThroughputProcessor extends MetricProcessor {
  process(metrics: PerformanceMetricData[]) {
    const values = metrics.map(m => m.value);
    return {
      average: this.calculateAverage(values),
      trends: metrics.map(m => ({ timestamp: m.timestamp, value: m.value }))
    };
  }
}

class ErrorRateProcessor extends MetricProcessor {
  process(metrics: PerformanceMetricData[]) {
    const values = metrics.map(m => m.value);
    return {
      average: this.calculateAverage(values),
      trends: metrics.map(m => ({ timestamp: m.timestamp, value: m.value }))
    };
  }
}

class MetricProcessorFactory {
  static create(type: MetricType): MetricProcessor {
    switch (type) {
      case 'response_time':
        return new ResponseTimeProcessor();
      case 'throughput':
        return new ThroughputProcessor();
      case 'error_rate':
        return new ErrorRateProcessor();
      default:
        return new ResponseTimeProcessor(); // Default fallback
    }
  }
}

// ============================================================================
// Cache Implementation
// ============================================================================

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly maxSize: number;
  private readonly ttl: number;
  
  constructor(maxSize: number = 1000, ttl: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  set<T>(key: string, data: T, customTtl?: number): void {
    // Cleanup if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      expiry: Date.now() + (customTtl || this.ttl)
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
}

// ============================================================================
// Focused Service Classes
// ============================================================================

export class AlertService {
  private deliveryManager = new AlertDeliveryManager();
  
  async createAlert(config: CreateAlertConfig): Promise<Result<Alert>> {
    try {
      const alert = await db.alert.create({
        data: {
          alertType: config.alertType,
          severity: config.severity,
          title: config.title,
          description: config.description,
          metadata: config.metadata,
          threshold: config.threshold,
          currentValue: config.currentValue,
          schoolId: config.schoolId,
        },
      });

      // Trigger alert delivery
      await this.deliverAlert(alert);

      return { success: true, data: alert };
    } catch (error) {
      console.error('Error creating alert:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  async getAlerts(filters: AlertFilters = {}): Promise<Result<AlertResult>> {
    try {
      const where = new AlertQueryBuilder()
        .withAlertType(filters.alertType)
        .withSeverity(filters.severity)
        .withResolutionStatus(filters.isResolved)
        .withSchool(filters.schoolId)
        .withTimeRange(filters.startDate, filters.endDate)
        .build();

      const [alerts, total] = await Promise.all([
        db.alert.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: filters.limit || 50,
          skip: filters.offset || 0,
          include: {
            resolver: {
              select: { id: true, name: true, email: true },
            },
            school: {
              select: { id: true, name: true },
            },
          },
        }),
        db.alert.count({ where }),
      ]);

      return { success: true, data: { alerts, total } };
    } catch (error) {
      console.error('Error getting alerts:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  async resolveAlert(alertId: string, resolvedBy: string): Promise<Result<Alert>> {
    try {
      const alert = await db.alert.update({
        where: { id: alertId },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
          resolvedBy,
        },
      });

      return { success: true, data: alert };
    } catch (error) {
      console.error('Error resolving alert:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  private async deliverAlert(alert: Alert): Promise<void> {
    try {
      const configs = await db.alertConfig.findMany({
        where: {
          alertType: alert.alertType,
          enabled: true,
        },
      });

      for (const config of configs) {
        if (alert.threshold && alert.currentValue && config.threshold) {
          const meetsThreshold = this.checkThreshold(
            alert.currentValue,
            config.threshold,
            config.condition
          );
          
          if (!meetsThreshold) continue;
        }

        await this.deliveryManager.deliverAlert(alert, config);
      }
    } catch (error) {
      console.error('Error delivering alert:', error);
    }
  }

  private checkThreshold(value: number, threshold: number, condition: string): boolean {
    switch (condition) {
      case 'greater':
        return value > threshold;
      case 'less':
        return value < threshold;
      case 'equal':
        return value === threshold;
      default:
        return false;
    }
  }
}

export class PerformanceService {
  private cache = new MemoryCache();
  
  async getMetrics(timeRange: TimeRange): Promise<Result<PerformanceMetrics>> {
    try {
      const cacheKey = `metrics_${timeRange.startDate.getTime()}_${timeRange.endDate.getTime()}`;
      const cached = this.cache.get<PerformanceMetrics>(cacheKey);
      
      if (cached) {
        return { success: true, data: cached };
      }

      const metrics = await this.fetchMetricsData(timeRange);
      const aggregatedMetrics = this.aggregateMetrics(metrics);
      const trends = this.buildTrendData(metrics);
      const bottlenecks = this.identifyBottlenecks(metrics);

      const result: PerformanceMetrics = {
        timeRange,
        metrics: aggregatedMetrics,
        trends,
        bottlenecks,
      };

      this.cache.set(cacheKey, result);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  async recordMetric(
    metricType: string,
    value: number,
    unit?: string,
    component?: string,
    metadata?: Record<string, unknown>
  ): Promise<Result<void>> {
    try {
      await db.performanceMetric.create({
        data: {
          metricType,
          value,
          unit,
          component,
          metadata,
        },
      });

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error recording performance metric:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  private async fetchMetricsData(timeRange: TimeRange): Promise<PerformanceMetricData[]> {
    const where = new MetricQueryBuilder()
      .withTimeRange(timeRange.startDate, timeRange.endDate)
      .build();

    return await db.performanceMetric.findMany({
      where,
      orderBy: { timestamp: 'asc' },
    }) as PerformanceMetricData[];
  }

  private aggregateMetrics(metrics: PerformanceMetricData[]) {
    const metricsByType = this.groupMetricsByType(metrics);
    
    return {
      averageResponseTime: this.processMetricType(metricsByType, 'response_time'),
      throughput: this.processMetricType(metricsByType, 'throughput'),
      errorRate: this.processMetricType(metricsByType, 'error_rate'),
      cpuUsage: this.processMetricType(metricsByType, 'cpu_usage'),
      memoryUsage: this.processMetricType(metricsByType, 'memory_usage'),
      diskUsage: this.processMetricType(metricsByType, 'disk_usage'),
    };
  }

  private buildTrendData(metrics: PerformanceMetricData[]) {
    const metricsByType = this.groupMetricsByType(metrics);
    
    return {
      responseTime: this.createTrends(metricsByType, 'response_time'),
      throughput: this.createTrends(metricsByType, 'throughput'),
      errorRate: this.createTrends(metricsByType, 'error_rate'),
    };
  }

  private groupMetricsByType(metrics: PerformanceMetricData[]): Map<MetricType, PerformanceMetricData[]> {
    const grouped = new Map<MetricType, PerformanceMetricData[]>();
    
    for (const metric of metrics) {
      if (!grouped.has(metric.metricType)) {
        grouped.set(metric.metricType, []);
      }
      grouped.get(metric.metricType)!.push(metric);
    }
    
    return grouped;
  }

  private processMetricType(metricsByType: Map<MetricType, PerformanceMetricData[]>, type: MetricType): number {
    const metrics = metricsByType.get(type) || [];
    const processor = MetricProcessorFactory.create(type);
    return processor.process(metrics).average;
  }

  private createTrends(metricsByType: Map<MetricType, PerformanceMetricData[]>, type: MetricType): TimeSeriesData[] {
    const metrics = metricsByType.get(type) || [];
    const processor = MetricProcessorFactory.create(type);
    return processor.process(metrics).trends;
  }

  private identifyBottlenecks(metrics: PerformanceMetricData[]): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];
    const metricsByType = this.groupMetricsByType(metrics);

    // Analyze CPU usage
    const cpuMetrics = metricsByType.get('cpu_usage') || [];
    if (cpuMetrics.length > 0) {
      const avgCpuUsage = this.processMetricType(metricsByType, 'cpu_usage');
      
      if (avgCpuUsage > 80) {
        bottlenecks.push({
          component: 'CPU',
          type: 'cpu',
          severity: avgCpuUsage > 95 ? 'CRITICAL' : avgCpuUsage > 90 ? 'HIGH' : 'MEDIUM',
          description: `High CPU usage detected: ${avgCpuUsage.toFixed(1)}%`,
          impact: Math.min((avgCpuUsage - 80) * 2, 100),
          recommendations: [
            'Consider scaling up server resources',
            'Optimize CPU-intensive operations',
            'Implement caching to reduce computational load',
          ],
        });
      }
    }

    // Analyze memory usage
    const memoryMetrics = metricsByType.get('memory_usage') || [];
    if (memoryMetrics.length > 0) {
      const avgMemoryUsage = this.processMetricType(metricsByType, 'memory_usage');
      
      if (avgMemoryUsage > 85) {
        bottlenecks.push({
          component: 'Memory',
          type: 'memory',
          severity: avgMemoryUsage > 95 ? 'CRITICAL' : avgMemoryUsage > 90 ? 'HIGH' : 'MEDIUM',
          description: `High memory usage detected: ${avgMemoryUsage.toFixed(1)}%`,
          impact: Math.min((avgMemoryUsage - 85) * 3, 100),
          recommendations: [
            'Increase server memory',
            'Optimize memory-intensive operations',
            'Implement memory cleanup routines',
          ],
        });
      }
    }

    // Analyze response time
    const responseTimeMetrics = metricsByType.get('response_time') || [];
    if (responseTimeMetrics.length > 0) {
      const avgResponseTime = this.processMetricType(metricsByType, 'response_time');
      
      if (avgResponseTime > 1000) { // > 1 second
        bottlenecks.push({
          component: 'API',
          type: 'network',
          severity: avgResponseTime > 5000 ? 'CRITICAL' : avgResponseTime > 3000 ? 'HIGH' : 'MEDIUM',
          description: `Slow API response time detected: ${avgResponseTime.toFixed(0)}ms`,
          impact: Math.min((avgResponseTime - 1000) / 50, 100),
          recommendations: [
            'Optimize database queries',
            'Implement response caching',
            'Review API endpoint performance',
          ],
        });
      }
    }

    return bottlenecks;
  }
}

export class ThresholdService {
  async monitorThresholds(): Promise<Result<ThresholdStatus[]>> {
    try {
      const thresholdStatuses: ThresholdStatus[] = [];

      const configs = await db.alertConfig.findMany({
        where: {
          alertType: 'usage_threshold',
          enabled: true,
        },
      });

      for (const config of configs) {
        let currentValue = 0;
        let status: ThresholdStatusType = 'OK';

        if (config.metadata?.metricType) {
          const latestMetric = await db.systemMetric.findFirst({
            where: {
              metricName: config.metadata.metricType as string,
              schoolId: config.schoolId,
            },
            orderBy: { timestamp: 'desc' },
          });

          currentValue = latestMetric?.value || 0;
        }

        const thresholdMet = this.checkThreshold(currentValue, config.threshold, config.condition);
        
        if (thresholdMet) {
          status = 'CRITICAL';
        } else if (currentValue >= config.threshold * 0.8) {
          status = 'WARNING';
        }

        thresholdStatuses.push({
          id: config.id,
          name: config.name,
          currentValue,
          threshold: config.threshold,
          status,
          lastChecked: new Date(),
          metadata: config.metadata,
        });
      }

      return { success: true, data: thresholdStatuses };
    } catch (error) {
      console.error('Error monitoring usage thresholds:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  private checkThreshold(value: number, threshold: number, condition: string): boolean {
    switch (condition) {
      case 'greater':
        return value > threshold;
      case 'less':
        return value < threshold;
      case 'equal':
        return value === threshold;
      default:
        return false;
    }
  }
}

// ============================================================================
// Main Monitoring Service
// ============================================================================

export class MonitoringService {
  private cache = new MemoryCache();
  private config: MonitoringConfig;
  
  constructor(
    private alertService: AlertService,
    private performanceService: PerformanceService,
    private thresholdService: ThresholdService,
    config?: Partial<MonitoringConfig>
  ) {
    this.config = {
      alertDelivery: {
        retryAttempts: 3,
        retryDelay: 1000,
      },
      performance: {
        metricsRetentionDays: 30,
        aggregationInterval: 300, // 5 minutes
      },
      thresholds: {
        checkInterval: 60000, // 1 minute
        defaultSeverity: 'MEDIUM',
      },
      cache: {
        ttl: 5 * 60 * 1000, // 5 minutes
        maxSize: 1000,
      },
      ...config,
    };
  }
  
  // ========================================================================
  // System Health Monitoring
  // ========================================================================

  async getSystemHealth(): Promise<Result<SystemHealth>> {
    try {
      const cacheKey = 'system_health';
      const cached = this.cache.get<SystemHealth>(cacheKey);
      
      if (cached) {
        return { success: true, data: cached };
      }

      const components = await db.systemHealth.findMany({
        orderBy: { lastChecked: 'desc' },
      });

      const healthyComponents = components.filter(c => c.status === 'HEALTHY').length;
      const degradedComponents = components.filter(c => c.status === 'DEGRADED').length;
      const downComponents = components.filter(c => c.status === 'DOWN').length;

      let overall: SystemHealthStatus = 'HEALTHY';
      if (downComponents > 0) {
        overall = 'DOWN';
      } else if (degradedComponents > 0) {
        overall = 'DEGRADED';
      }

      const avgResponseTime = components.reduce((sum, c) => sum + (c.responseTime || 0), 0) / components.length || 0;
      const uptime = Date.now() - new Date().setHours(0, 0, 0, 0);

      const health: SystemHealth = {
        overall,
        components: components.map(c => ({
          component: c.component,
          status: c.status as ComponentStatus,
          responseTime: c.responseTime || undefined,
          errorRate: c.errorRate || undefined,
          lastChecked: c.lastChecked,
          metadata: c.metadata as Record<string, unknown>,
        })),
        lastUpdated: new Date(),
        uptime: Math.floor(uptime / 1000),
        responseTime: avgResponseTime,
      };

      this.cache.set(cacheKey, health);
      return { success: true, data: health };
    } catch (error) {
      console.error('Error getting system health:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  async updateComponentHealth(
    component: string,
    status: ComponentStatus,
    responseTime?: number,
    errorRate?: number,
    metadata?: Record<string, unknown>
  ): Promise<Result<void>> {
    try {
      await db.systemHealth.upsert({
        where: { component },
        update: {
          status,
          responseTime,
          errorRate,
          lastChecked: new Date(),
          metadata,
        },
        create: {
          component,
          status,
          responseTime,
          errorRate,
          lastChecked: new Date(),
          metadata,
        },
      });

      // Clear cache to force refresh
      this.cache.delete('system_health');
      
      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error updating component health:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  // ========================================================================
  // Error Analysis
  // ========================================================================

  async getErrorAnalysis(timeRange: TimeRange): Promise<Result<ErrorAnalysis>> {
    try {
      const validatedTimeRange = TimeRangeSchema.parse(timeRange);
      
      const errors = await db.communicationErrorLog.findMany({
        where: {
          createdAt: {
            gte: validatedTimeRange.startDate,
            lte: validatedTimeRange.endDate,
          },
        },
        orderBy: { createdAt: 'asc' },
      }) as ErrorLogData[];

      const totalErrors = errors.length;
      const criticalErrors = errors.filter(e => e.severity === 'CRITICAL').length;
      const resolvedErrors = errors.filter(e => e.resolved).length;
      const errorRate = totalErrors > 0 ? (totalErrors / (totalErrors + 1000)) * 100 : 0;

      const errorsByType = this.groupErrorsByField(errors, 'category');
      const errorsByComponent = this.groupErrorsByField(errors, 'channel');
      const trends = this.createErrorTimeSeries(errors, validatedTimeRange);
      const topErrors = this.getTopErrors(errors);

      const analysis: ErrorAnalysis = {
        timeRange: validatedTimeRange,
        summary: {
          totalErrors,
          errorRate,
          criticalErrors,
          resolvedErrors,
        },
        errorsByType,
        errorsByComponent,
        trends,
        topErrors,
      };

      return { success: true, data: analysis };
    } catch (error) {
      console.error('Error getting error analysis:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  private groupErrorsByField(errors: ErrorLogData[], field: keyof ErrorLogData): ErrorGroup[] {
    const groups = errors.reduce((acc, error) => {
      const key = String(error[field]) || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = errors.length;
    return Object.entries(groups).map(([type, count]) => ({
      type,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }));
  }

  private createErrorTimeSeries(errors: ErrorLogData[], timeRange: TimeRange): TimeSeriesData[] {
    const timeSeries: TimeSeriesData[] = [];
    const startTime = timeRange.startDate.getTime();
    const endTime = timeRange.endDate.getTime();
    const interval = (endTime - startTime) / 24;

    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(startTime + (i * interval));
      const nextTimestamp = new Date(startTime + ((i + 1) * interval));
      
      const errorsInInterval = errors.filter(e => 
        e.createdAt >= timestamp && e.createdAt < nextTimestamp
      ).length;

      timeSeries.push({
        timestamp,
        value: errorsInInterval,
      });
    }

    return timeSeries;
  }

  private getTopErrors(errors: ErrorLogData[]): TopError[] {
    const errorGroups = errors.reduce((acc, error) => {
      const key = error.errorMessage || 'Unknown error';
      if (!acc[key]) {
        acc[key] = {
          message: key,
          count: 0,
          firstOccurrence: error.createdAt,
          lastOccurrence: error.createdAt,
        };
      }
      acc[key].count++;
      if (error.createdAt < acc[key].firstOccurrence) {
        acc[key].firstOccurrence = error.createdAt;
      }
      if (error.createdAt > acc[key].lastOccurrence) {
        acc[key].lastOccurrence = error.createdAt;
      }
      return acc;
    }, {} as Record<string, TopError>);

    return Object.values(errorGroups)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // ========================================================================
  // Alert Configuration Management
  // ========================================================================

  async createAlertConfig(config: unknown, createdBy: string): Promise<Result<AlertConfig>> {
    try {
      const validatedConfig = AlertConfigSchema.parse(config);
      
      const alertConfig = await db.alertConfig.create({
        data: {
          name: validatedConfig.name,
          alertType: validatedConfig.alertType,
          threshold: validatedConfig.threshold,
          condition: validatedConfig.condition,
          enabled: validatedConfig.enabled,
          notifyAdmins: validatedConfig.notifyAdmins,
          notifyEmail: validatedConfig.notifyEmail,
          emailRecipients: validatedConfig.emailRecipients || [],
          metadata: validatedConfig.metadata,
          schoolId: validatedConfig.schoolId,
          createdBy,
        },
      });

      return { success: true, data: alertConfig };
    } catch (error) {
      console.error('Error creating alert config:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  async updateAlertConfig(id: string, updates: Partial<AlertConfig>): Promise<Result<AlertConfig>> {
    try {
      const alertConfig = await db.alertConfig.update({
        where: { id },
        data: {
          ...(updates.name && { name: updates.name }),
          ...(updates.threshold !== undefined && { threshold: updates.threshold }),
          ...(updates.condition && { condition: updates.condition }),
          ...(updates.enabled !== undefined && { enabled: updates.enabled }),
          ...(updates.notifyAdmins !== undefined && { notifyAdmins: updates.notifyAdmins }),
          ...(updates.notifyEmail !== undefined && { notifyEmail: updates.notifyEmail }),
          ...(updates.emailRecipients && { emailRecipients: updates.emailRecipients }),
          ...(updates.metadata && { metadata: updates.metadata }),
        },
      });

      return { success: true, data: alertConfig };
    } catch (error) {
      console.error('Error updating alert config:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  async getAlertConfigs(filters: {
    alertType?: string;
    enabled?: boolean;
    schoolId?: string;
  } = {}): Promise<Result<AlertConfig[]>> {
    try {
      const where: Prisma.AlertConfigWhereInput = {};
      
      if (filters.alertType) where.alertType = filters.alertType;
      if (filters.enabled !== undefined) where.enabled = filters.enabled;
      if (filters.schoolId) where.schoolId = filters.schoolId;

      const configs = await db.alertConfig.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return { success: true, data: configs };
    } catch (error) {
      console.error('Error getting alert configs:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  // ========================================================================
  // System Metrics
  // ========================================================================

  async recordSystemMetric(
    metricName: string,
    value: number,
    unit?: string,
    tags?: Record<string, unknown>,
    schoolId?: string
  ): Promise<Result<void>> {
    try {
      await db.systemMetric.create({
        data: {
          metricName,
          value,
          unit,
          tags,
          schoolId,
        },
      });

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error recording system metric:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  async getSystemMetrics(filters: MetricFilters = {}): Promise<Result<any[]>> {
    try {
      const where: Prisma.SystemMetricWhereInput = {};
      
      if (filters.metricName) where.metricName = filters.metricName;
      if (filters.schoolId) where.schoolId = filters.schoolId;
      if (filters.startDate || filters.endDate) {
        where.timestamp = {};
        if (filters.startDate) where.timestamp.gte = filters.startDate;
        if (filters.endDate) where.timestamp.lte = filters.endDate;
      }

      const metrics = await db.systemMetric.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: filters.limit || 100,
      });

      return { success: true, data: metrics };
    } catch (error) {
      console.error('Error getting system metrics:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  // ========================================================================
  // Delegation Methods
  // ========================================================================

  async createAlert(config: CreateAlertConfig): Promise<Result<Alert>> {
    return this.alertService.createAlert(config);
  }

  async getAlerts(filters: AlertFilters = {}): Promise<Result<AlertResult>> {
    return this.alertService.getAlerts(filters);
  }

  async resolveAlert(alertId: string, resolvedBy: string): Promise<Result<Alert>> {
    return this.alertService.resolveAlert(alertId, resolvedBy);
  }

  async getPerformanceMetrics(timeRange: TimeRange): Promise<Result<PerformanceMetrics>> {
    return this.performanceService.getMetrics(timeRange);
  }

  async recordPerformanceMetric(
    metricType: string,
    value: number,
    unit?: string,
    component?: string,
    metadata?: Record<string, unknown>
  ): Promise<Result<void>> {
    return this.performanceService.recordMetric(metricType, value, unit, component, metadata);
  }

  async monitorUsageThresholds(): Promise<Result<ThresholdStatus[]>> {
    return this.thresholdService.monitorThresholds();
  }
}

// ============================================================================
// Factory and Singleton
// ============================================================================

export function createMonitoringService(config?: Partial<MonitoringConfig>): MonitoringService {
  const alertService = new AlertService();
  const performanceService = new PerformanceService();
  const thresholdService = new ThresholdService();
  
  return new MonitoringService(alertService, performanceService, thresholdService, config);
}

// Export singleton instance
export const monitoringService = createMonitoringService();