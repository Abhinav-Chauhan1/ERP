/**
 * System Integration Service
 * 
 * Provides comprehensive system integration capabilities that wire all services
 * together with proper error handling, cross-service communication, and data consistency.
 * This service acts as the orchestration layer for the super-admin SaaS platform.
 * 
 * Requirements: All requirements - System-wide integration
 */

import { billingService } from './billing-service';
import { analyticsService } from './analytics-service';
import { auditService, logAuditEvent, AuditContext } from './audit-service';
import { monitoringService } from './monitoring-service';
import { supportService } from './support-service';
import { permissionService } from './permission-service';
import { configurationService } from './configuration-service';
import { dataManagementService } from './data-management-service';
import { AuditAction } from '@prisma/client';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface SystemHealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastChecked: Date;
  error?: string;
}

export interface SystemIntegrationConfig {
  enableCrossServiceLogging: boolean;
  enableDataConsistencyChecks: boolean;
  enablePerformanceMonitoring: boolean;
  healthCheckInterval: number;
  errorRetryAttempts: number;
  errorRetryDelay: number;
}

export interface CrossServiceEvent {
  eventType: string;
  sourceService: string;
  targetService?: string;
  data: Record<string, any>;
  timestamp: Date;
  correlationId: string;
}

export interface DataConsistencyResult {
  isConsistent: boolean;
  inconsistencies: Array<{
    service: string;
    resource: string;
    issue: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  checkedAt: Date;
}

export interface ServiceOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  service: string;
  operation: string;
  duration: number;
  correlationId: string;
}

// ============================================================================
// System Integration Service
// ============================================================================

export class SystemIntegrationService {
  private config: SystemIntegrationConfig;
  private healthCheckTimer?: NodeJS.Timeout;
  private serviceRegistry = new Map<string, any>();

  constructor(config: Partial<SystemIntegrationConfig> = {}) {
    this.config = {
      enableCrossServiceLogging: true,
      enableDataConsistencyChecks: true,
      enablePerformanceMonitoring: true,
      healthCheckInterval: 60000, // 1 minute
      errorRetryAttempts: 3,
      errorRetryDelay: 1000,
      ...config,
    };

    this.initializeServices();
    this.startHealthChecks();
  }

  /**
   * Initialize and register all services
   */
  private initializeServices(): void {
    this.serviceRegistry.set('billing', billingService);
    this.serviceRegistry.set('analytics', analyticsService);
    this.serviceRegistry.set('audit', auditService);
    this.serviceRegistry.set('monitoring', monitoringService);
    this.serviceRegistry.set('support', supportService);
    this.serviceRegistry.set('permission', permissionService);
    this.serviceRegistry.set('configuration', configurationService);
    this.serviceRegistry.set('dataManagement', dataManagementService);
  }

  /**
   * Start periodic health checks for all services
   */
  private startHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      await this.performSystemHealthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * Stop health checks
   */
  public stopHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }

  /**
   * Perform comprehensive system health check
   */
  async performSystemHealthCheck(): Promise<SystemHealthCheck[]> {
    const healthChecks: SystemHealthCheck[] = [];

    for (const [serviceName, service] of this.serviceRegistry) {
      const startTime = Date.now();
      let status: 'healthy' | 'degraded' | 'down' = 'healthy';
      let error: string | undefined;

      try {
        // Perform service-specific health check
        await this.checkServiceHealth(serviceName, service);
        
        const responseTime = Date.now() - startTime;
        
        // Determine status based on response time
        if (responseTime > 5000) {
          status = 'degraded';
        } else if (responseTime > 10000) {
          status = 'down';
        }

        healthChecks.push({
          service: serviceName,
          status,
          responseTime,
          lastChecked: new Date(),
          error,
        });

        // Update monitoring service with health status
        if (this.config.enablePerformanceMonitoring) {
          await monitoringService.updateComponentHealth(
            serviceName,
            status === 'healthy' ? 'HEALTHY' : status === 'degraded' ? 'DEGRADED' : 'DOWN',
            responseTime,
            undefined,
            { lastHealthCheck: new Date().toISOString() }
          );
        }

      } catch (err) {
        status = 'down';
        error = err instanceof Error ? err.message : 'Unknown error';

        healthChecks.push({
          service: serviceName,
          status,
          responseTime: Date.now() - startTime,
          lastChecked: new Date(),
          error,
        });

        // Log health check failure
        if (this.config.enableCrossServiceLogging) {
          await this.logCrossServiceEvent({
            eventType: 'HEALTH_CHECK_FAILED',
            sourceService: 'system-integration',
            targetService: serviceName,
            data: { error, responseTime: Date.now() - startTime },
            timestamp: new Date(),
            correlationId: this.generateCorrelationId(),
          });
        }
      }
    }

    return healthChecks;
  }

  /**
   * Check health of individual service
   */
  private async checkServiceHealth(serviceName: string, service: any): Promise<void> {
    switch (serviceName) {
      case 'billing':
        // Test billing service by getting subscription plans
        await service.getSubscriptions({ limit: 1, offset: 0 });
        break;
      case 'analytics':
        // Test analytics service by getting basic metrics
        const timeRange = {
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
          endDate: new Date(),
        };
        await service.getRevenueMetrics(timeRange);
        break;
      case 'monitoring':
        // Test monitoring service by getting system health
        await service.getSystemHealth();
        break;
      case 'support':
        // Test support service by getting tickets
        await service.getTickets({ limit: 1 });
        break;
      case 'permission':
        // Test permission service by getting permissions
        await service.getAllPermissions();
        break;
      case 'configuration':
        // Test configuration service by getting settings
        await service.getGlobalSettings();
        break;
      case 'dataManagement':
        // Test data management service by checking backup status
        await service.getBackupStatus();
        break;
      default:
        // Generic health check - just verify service exists
        if (!service) {
          throw new Error(`Service ${serviceName} is not available`);
        }
    }
  }

  /**
   * Execute operation with cross-service error handling and monitoring
   */
  async executeServiceOperation<T>(
    serviceName: string,
    operation: string,
    operationFn: () => Promise<T>,
    userId?: string
  ): Promise<ServiceOperationResult<T>> {
    const correlationId = this.generateCorrelationId();
    const startTime = Date.now();

    try {
      // Log operation start
      if (this.config.enableCrossServiceLogging && userId) {
        await this.logCrossServiceEvent({
          eventType: 'OPERATION_STARTED',
          sourceService: 'system-integration',
          targetService: serviceName,
          data: { operation, userId },
          timestamp: new Date(),
          correlationId,
        });
      }

      // Execute operation with retry logic
      const result = await this.executeWithRetry(operationFn);
      const duration = Date.now() - startTime;

      // Log successful operation
      if (this.config.enableCrossServiceLogging && userId) {
        await this.logCrossServiceEvent({
          eventType: 'OPERATION_COMPLETED',
          sourceService: 'system-integration',
          targetService: serviceName,
          data: { operation, userId, duration },
          timestamp: new Date(),
          correlationId,
        });
      }

      // Record performance metrics
      if (this.config.enablePerformanceMonitoring) {
        await monitoringService.recordPerformanceMetric(
          'operation_duration',
          duration,
          'ms',
          serviceName,
          { operation, correlationId }
        );
      }

      return {
        success: true,
        data: result,
        service: serviceName,
        operation,
        duration,
        correlationId,
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log operation failure
      if (this.config.enableCrossServiceLogging && userId) {
        await this.logCrossServiceEvent({
          eventType: 'OPERATION_FAILED',
          sourceService: 'system-integration',
          targetService: serviceName,
          data: { operation, userId, error: errorMessage, duration },
          timestamp: new Date(),
          correlationId,
        });
      }

      // Create alert for critical failures
      if (duration > 10000 || errorMessage.includes('critical')) {
        await monitoringService.createAlert({
          alertType: 'api_error',
          severity: 'ERROR',
          title: `Service Operation Failed: ${serviceName}.${operation}`,
          description: `Operation failed with error: ${errorMessage}`,
          metadata: { serviceName, operation, duration, correlationId },
        });
      }

      return {
        success: false,
        error: errorMessage,
        service: serviceName,
        operation,
        duration,
        correlationId,
      };
    }
  }

  /**
   * Execute function with retry logic
   */
  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.errorRetryAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < this.config.errorRetryAttempts) {
          await this.delay(this.config.errorRetryDelay * attempt);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Perform data consistency checks across services
   */
  async performDataConsistencyCheck(): Promise<DataConsistencyResult> {
    if (!this.config.enableDataConsistencyChecks) {
      return {
        isConsistent: true,
        inconsistencies: [],
        checkedAt: new Date(),
      };
    }

    const inconsistencies: DataConsistencyResult['inconsistencies'] = [];

    try {
      // Check billing-analytics consistency
      await this.checkBillingAnalyticsConsistency(inconsistencies);

      // Check audit-permission consistency
      await this.checkAuditPermissionConsistency(inconsistencies);

      // Check support-analytics consistency
      await this.checkSupportAnalyticsConsistency(inconsistencies);

      return {
        isConsistent: inconsistencies.length === 0,
        inconsistencies,
        checkedAt: new Date(),
      };

    } catch (error) {
      inconsistencies.push({
        service: 'system-integration',
        resource: 'data-consistency-check',
        issue: `Failed to perform consistency check: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'critical',
      });

      return {
        isConsistent: false,
        inconsistencies,
        checkedAt: new Date(),
      };
    }
  }

  /**
   * Check consistency between billing and analytics data
   */
  private async checkBillingAnalyticsConsistency(
    inconsistencies: DataConsistencyResult['inconsistencies']
  ): Promise<void> {
    try {
      // Get billing data
      const billingData = await billingService.getSubscriptions({ limit: 100, offset: 0 });
      
      // Get analytics data
      const timeRange = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
        endDate: new Date(),
      };
      const analyticsData = await analyticsService.getRevenueMetrics(timeRange);

      // Check if subscription counts match
      const activeSubscriptions = billingData.data.filter(sub => sub.status === 'ACTIVE').length;
      
      // This is a simplified check - in production, you'd have more sophisticated validation
      if (Math.abs(activeSubscriptions - analyticsData.revenueTrends.length) > 10) {
        inconsistencies.push({
          service: 'billing-analytics',
          resource: 'subscription-count',
          issue: `Subscription count mismatch: billing=${activeSubscriptions}, analytics=${analyticsData.revenueTrends.length}`,
          severity: 'medium',
        });
      }

    } catch (error) {
      inconsistencies.push({
        service: 'billing-analytics',
        resource: 'consistency-check',
        issue: `Failed to check billing-analytics consistency: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high',
      });
    }
  }

  /**
   * Check consistency between audit and permission data
   */
  private async checkAuditPermissionConsistency(
    inconsistencies: DataConsistencyResult['inconsistencies']
  ): Promise<void> {
    try {
      // Get recent audit logs
      const auditResult = await auditService.getAuditLogs({ limit: 100 });
      if (!auditResult.success) {
        throw new Error(auditResult.error);
      }

      // Get all permissions
      const permissions = await permissionService.getAllPermissions();

      // Check if audit logs reference valid permissions
      const permissionIds = new Set(permissions.map(p => p.id));
      const invalidPermissionRefs = auditResult.data.logs.filter(log => 
        log.resource === 'PERMISSION' && 
        log.resourceId && 
        !permissionIds.has(log.resourceId)
      );

      if (invalidPermissionRefs.length > 0) {
        inconsistencies.push({
          service: 'audit-permission',
          resource: 'permission-references',
          issue: `Found ${invalidPermissionRefs.length} audit logs referencing invalid permissions`,
          severity: 'low',
        });
      }

    } catch (error) {
      inconsistencies.push({
        service: 'audit-permission',
        resource: 'consistency-check',
        issue: `Failed to check audit-permission consistency: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high',
      });
    }
  }

  /**
   * Check consistency between support and analytics data
   */
  private async checkSupportAnalyticsConsistency(
    inconsistencies: DataConsistencyResult['inconsistencies']
  ): Promise<void> {
    try {
      // Get support metrics
      const supportMetrics = await supportService.getSupportMetrics();

      // Get analytics data for support
      const usageAnalytics = await analyticsService.getUsageAnalytics();

      // Simple consistency check - in production, you'd have more sophisticated validation
      if (supportMetrics.totalTickets > usageAnalytics.totalSchools * 100) {
        inconsistencies.push({
          service: 'support-analytics',
          resource: 'ticket-count',
          issue: `Unusually high ticket count relative to school count: ${supportMetrics.totalTickets} tickets for ${usageAnalytics.totalSchools} schools`,
          severity: 'low',
        });
      }

    } catch (error) {
      inconsistencies.push({
        service: 'support-analytics',
        resource: 'consistency-check',
        issue: `Failed to check support-analytics consistency: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high',
      });
    }
  }

  /**
   * Log cross-service events for monitoring and debugging
   */
  private async logCrossServiceEvent(event: CrossServiceEvent): Promise<void> {
    try {
      const auditContext: AuditContext = {
        userId: 'system',
        action: 'CREATE' as AuditAction,
        resource: 'CROSS_SERVICE_EVENT',
        resourceId: event.correlationId,
        metadata: {
          eventType: event.eventType,
          sourceService: event.sourceService,
          targetService: event.targetService,
          data: event.data,
        },
      };

      await logAuditEvent(auditContext);

    } catch (error) {
      // Don't throw on logging errors to avoid cascading failures
      console.error('Failed to log cross-service event:', error);
    }
  }

  /**
   * Generate correlation ID for tracking operations across services
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get system integration status
   */
  async getSystemStatus(): Promise<{
    overallHealth: 'healthy' | 'degraded' | 'down';
    services: SystemHealthCheck[];
    dataConsistency: DataConsistencyResult;
    lastUpdated: Date;
  }> {
    const services = await this.performSystemHealthCheck();
    const dataConsistency = await this.performDataConsistencyCheck();

    // Determine overall health
    let overallHealth: 'healthy' | 'degraded' | 'down' = 'healthy';
    const downServices = services.filter(s => s.status === 'down').length;
    const degradedServices = services.filter(s => s.status === 'degraded').length;

    if (downServices > 0) {
      overallHealth = 'down';
    } else if (degradedServices > 0 || !dataConsistency.isConsistent) {
      overallHealth = 'degraded';
    }

    return {
      overallHealth,
      services,
      dataConsistency,
      lastUpdated: new Date(),
    };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.stopHealthChecks();
    this.serviceRegistry.clear();
  }
}

// ============================================================================
// Factory and Singleton
// ============================================================================

export function createSystemIntegrationService(
  config?: Partial<SystemIntegrationConfig>
): SystemIntegrationService {
  return new SystemIntegrationService(config);
}

// Export singleton instance
export const systemIntegrationService = createSystemIntegrationService();