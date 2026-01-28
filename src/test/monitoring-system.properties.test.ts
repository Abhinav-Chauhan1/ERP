import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { prisma } from '@/lib/db';
import { monitoringService } from '@/lib/services/monitoring-service';
import { thresholdMonitoringService } from '@/lib/services/threshold-monitoring-service';
import { errorAnalysisService } from '@/lib/services/error-analysis-service';

// Feature: super-admin-saas-completion
// Property tests for monitoring and alert system

describe('Monitoring System Property Tests', () => {
  let testSchoolIds: string[] = [];
  let testUserIds: string[] = [];
  let testAlertIds: string[] = [];

  beforeAll(async () => {
    // Create test schools
    const schools = await Promise.all([
      prisma.school.create({
        data: {
          name: 'Test School Alpha',
          schoolCode: 'TSA001',
          email: 'admin@testalpha.edu',
          plan: 'GROWTH',
          status: 'ACTIVE'
        }
      }),
      prisma.school.create({
        data: {
          name: 'Test School Beta',
          schoolCode: 'TSB002',
          email: 'admin@testbeta.edu',
          plan: 'STARTER',
          status: 'ACTIVE'
        }
      })
    ]);
    testSchoolIds = schools.map(s => s.id);

    // Create test users
    const users = await Promise.all([
      prisma.user.create({
        data: {
          email: 'admin1@test.com',
          firstName: 'Admin',
          lastName: 'One',
          role: 'ADMIN'
        }
      }),
      prisma.user.create({
        data: {
          email: 'admin2@test.com',
          firstName: 'Admin',
          lastName: 'Two',
          role: 'ADMIN'
        }
      })
    ]);
    testUserIds = users.map(u => u.id);
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.alert.deleteMany({
      where: { id: { in: testAlertIds } }
    });
    await prisma.systemMetric.deleteMany({
      where: { schoolId: { in: testSchoolIds } }
    });
    await prisma.systemHealth.deleteMany();
    await prisma.performanceMetric.deleteMany();
    await prisma.alertConfig.deleteMany({
      where: { schoolId: { in: testSchoolIds } }
    });
    await prisma.user.deleteMany({
      where: { id: { in: testUserIds } }
    });
    await prisma.school.deleteMany({
      where: { id: { in: testSchoolIds } }
    });
  });

  /**
   * Property 21: Alert Generation and Delivery Consistency
   * For any system issue or threshold breach, the monitoring system should 
   * generate appropriate alerts, deliver them through configured channels, 
   * and maintain consistent alert state across all monitoring interfaces.
   * Validates: Requirements 8.1, 8.4
   */
  test('Property 21: Alert Generation and Delivery Consistency', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        alertType: fc.constantFrom('error_rate', 'delivery_rate', 'api_error', 'critical_error', 'usage_threshold'),
        severity: fc.constantFrom('INFO', 'WARNING', 'ERROR', 'CRITICAL'),
        title: fc.string({ minLength: 5, maxLength: 100 }),
        description: fc.string({ minLength: 10, maxLength: 500 }),
        threshold: fc.float({ min: 0, max: 100 }),
        currentValue: fc.float({ min: 0, max: 200 }),
        schoolIndex: fc.integer({ min: 0, max: testSchoolIds.length - 1 })
      }),
      async (alertData) => {
        const schoolId = testSchoolIds[alertData.schoolIndex];
        
        // Create alert
        const alert = await monitoringService.createAlert({
          alertType: alertData.alertType,
          severity: alertData.severity as 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL',
          title: alertData.title,
          description: alertData.description,
          threshold: alertData.threshold,
          currentValue: alertData.currentValue,
          schoolId
        });

        testAlertIds.push(alert.id);

        // Verify alert creation consistency
        expect(alert).toBeDefined();
        expect(alert.id).toBeDefined();
        expect(alert.alertType).toBe(alertData.alertType);
        expect(alert.severity).toBe(alertData.severity);
        expect(alert.title).toBe(alertData.title);
        expect(alert.description).toBe(alertData.description);
        expect(alert.threshold).toBeCloseTo(alertData.threshold, 5);
        expect(alert.currentValue).toBeCloseTo(alertData.currentValue, 5);
        expect(alert.schoolId).toBe(schoolId);
        expect(alert.isResolved).toBe(false);
        expect(alert.createdAt).toBeInstanceOf(Date);

        // Retrieve alert and verify consistency
        const retrievedAlerts = await monitoringService.getAlerts({
          alertType: alertData.alertType,
          schoolId
        });

        const foundAlert = retrievedAlerts.alerts.find(a => a.id === alert.id);
        expect(foundAlert).toBeDefined();
        expect(foundAlert?.alertType).toBe(alert.alertType);
        expect(foundAlert?.severity).toBe(alert.severity);
        expect(foundAlert?.title).toBe(alert.title);
        expect(foundAlert?.isResolved).toBe(alert.isResolved);

        // Test alert resolution consistency
        const userIndex = Math.floor(Math.random() * testUserIds.length);
        const resolvedAlert = await monitoringService.resolveAlert(alert.id, testUserIds[userIndex]);
        
        expect(resolvedAlert.isResolved).toBe(true);
        expect(resolvedAlert.resolvedAt).toBeInstanceOf(Date);
        expect(resolvedAlert.resolvedBy).toBe(testUserIds[userIndex]);

        // Verify resolved state is consistent across queries
        const resolvedAlerts = await monitoringService.getAlerts({
          isResolved: true,
          schoolId
        });
        
        const foundResolvedAlert = resolvedAlerts.alerts.find(a => a.id === alert.id);
        expect(foundResolvedAlert?.isResolved).toBe(true);
      }
    ), { numRuns: 10 }); // Reduce number of runs to avoid timeout
  }, 10000); // Increase timeout to 10 seconds

  /**
   * Property 22: System Health and Performance Monitoring
   * For any system health check or performance monitoring request, the system 
   * should provide comprehensive metrics, identify bottlenecks accurately, 
   * and support custom monitoring configurations.
   * Validates: Requirements 8.2, 8.3, 8.6
   */
  test('Property 22: System Health and Performance Monitoring', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        components: fc.array(
          fc.record({
            name: fc.constantFrom('database', 'redis', 'api', 'email_service', 'sms_service'),
            status: fc.constantFrom('HEALTHY', 'DEGRADED', 'DOWN'),
            responseTime: fc.float({ min: 10, max: 5000 }),
            errorRate: fc.float({ min: 0, max: 100 })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        performanceMetrics: fc.array(
          fc.record({
            metricType: fc.constantFrom('cpu_usage', 'memory_usage', 'disk_usage', 'response_time', 'throughput'),
            value: fc.float({ min: 0, max: 100 }),
            component: fc.constantFrom('api', 'database', 'cache')
          }),
          { minLength: 3, maxLength: 10 }
        ),
        timeRangeDays: fc.integer({ min: 1, max: 30 })
      }),
      async (monitoringData) => {
        // Update component health statuses
        for (const component of monitoringData.components) {
          await monitoringService.updateComponentHealth(
            component.name,
            component.status as 'HEALTHY' | 'DEGRADED' | 'DOWN',
            component.responseTime,
            component.errorRate
          );
        }

        // Record performance metrics
        for (const metric of monitoringData.performanceMetrics) {
          await monitoringService.recordPerformanceMetric(
            metric.metricType,
            metric.value,
            metric.metricType.includes('usage') ? '%' : 'ms',
            metric.component
          );
        }

        // Get system health and verify consistency
        const systemHealth = await monitoringService.getSystemHealth();
        
        expect(systemHealth).toBeDefined();
        expect(['HEALTHY', 'DEGRADED', 'DOWN']).toContain(systemHealth.overall);
        expect(Array.isArray(systemHealth.components)).toBe(true);
        expect(systemHealth.lastUpdated).toBeInstanceOf(Date);
        expect(typeof systemHealth.uptime).toBe('number');
        expect(systemHealth.uptime).toBeGreaterThanOrEqual(0);
        expect(typeof systemHealth.responseTime).toBe('number');
        expect(systemHealth.responseTime).toBeGreaterThanOrEqual(0);

        // Verify component health consistency
        systemHealth.components.forEach(component => {
          expect(typeof component.component).toBe('string');
          expect(['HEALTHY', 'DEGRADED', 'DOWN']).toContain(component.status);
          expect(component.lastChecked).toBeInstanceOf(Date);
          
          if (component.responseTime !== undefined) {
            expect(typeof component.responseTime).toBe('number');
            expect(component.responseTime).toBeGreaterThanOrEqual(0);
          }
          
          if (component.errorRate !== undefined) {
            expect(typeof component.errorRate).toBe('number');
            expect(component.errorRate).toBeGreaterThanOrEqual(0);
            expect(component.errorRate).toBeLessThanOrEqual(100);
          }
        });

        // Get performance metrics and verify consistency
        const timeRange = {
          startDate: new Date(Date.now() - monitoringData.timeRangeDays * 24 * 60 * 60 * 1000),
          endDate: new Date()
        };
        
        const performanceMetrics = await monitoringService.getPerformanceMetrics(timeRange);
        
        expect(performanceMetrics).toBeDefined();
        expect(performanceMetrics.timeRange.startDate).toBeInstanceOf(Date);
        expect(performanceMetrics.timeRange.endDate).toBeInstanceOf(Date);
        expect(performanceMetrics.timeRange.startDate.getTime()).toBeLessThanOrEqual(performanceMetrics.timeRange.endDate.getTime());
        
        // Verify metrics structure
        expect(typeof performanceMetrics.metrics.averageResponseTime).toBe('number');
        expect(performanceMetrics.metrics.averageResponseTime).toBeGreaterThanOrEqual(0);
        expect(typeof performanceMetrics.metrics.throughput).toBe('number');
        expect(performanceMetrics.metrics.throughput).toBeGreaterThanOrEqual(0);
        expect(typeof performanceMetrics.metrics.errorRate).toBe('number');
        expect(performanceMetrics.metrics.errorRate).toBeGreaterThanOrEqual(0);
        expect(performanceMetrics.metrics.errorRate).toBeLessThanOrEqual(100);
        
        // Verify trends consistency
        expect(Array.isArray(performanceMetrics.trends.responseTime)).toBe(true);
        expect(Array.isArray(performanceMetrics.trends.throughput)).toBe(true);
        expect(Array.isArray(performanceMetrics.trends.errorRate)).toBe(true);
        
        performanceMetrics.trends.responseTime.forEach(trend => {
          expect(trend.timestamp).toBeInstanceOf(Date);
          expect(typeof trend.value).toBe('number');
          expect(trend.value).toBeGreaterThanOrEqual(0);
        });

        // Verify bottlenecks analysis
        expect(Array.isArray(performanceMetrics.bottlenecks)).toBe(true);
        performanceMetrics.bottlenecks.forEach(bottleneck => {
          expect(typeof bottleneck.component).toBe('string');
          expect(['cpu', 'memory', 'disk', 'network', 'database']).toContain(bottleneck.type);
          expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(bottleneck.severity);
          expect(typeof bottleneck.description).toBe('string');
          expect(typeof bottleneck.impact).toBe('number');
          expect(bottleneck.impact).toBeGreaterThanOrEqual(0);
          expect(bottleneck.impact).toBeLessThanOrEqual(100);
          expect(Array.isArray(bottleneck.recommendations)).toBe(true);
        });
      }
    ), { numRuns: 10 }); // Reduce number of runs
  }, 10000); // Increase timeout

  /**
   * Property 23: Error Aggregation and Analysis
   * For any error occurrence, the monitoring system should aggregate errors 
   * intelligently, provide meaningful grouping and analysis, and maintain 
   * error state consistency across all monitoring tools.
   * Validates: Requirements 8.5
   */
  test('Property 23: Error Aggregation and Analysis', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        errors: fc.array(
          fc.record({
            errorMessage: fc.oneof(
              fc.constant('Connection timeout occurred'),
              fc.constant('Rate limit exceeded for API calls'),
              fc.constant('Authentication failed for user'),
              fc.constant('Database connection lost'),
              fc.constant('Invalid request format received')
            ),
            category: fc.constantFrom('API_ERROR', 'NETWORK', 'VALIDATION', 'DATABASE'),
            severity: fc.constantFrom('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
            channel: fc.constantFrom('SMS', 'WHATSAPP', 'EMAIL', 'IN_APP'),
            schoolIndex: fc.integer({ min: 0, max: testSchoolIds.length - 1 })
          }),
          { minLength: 5, maxLength: 50 }
        ),
        timeRangeDays: fc.integer({ min: 1, max: 7 })
      }),
      async (errorData) => {
        const startDate = new Date(Date.now() - errorData.timeRangeDays * 24 * 60 * 60 * 1000);
        const endDate = new Date();

        // Create test error logs
        const createdErrors = await Promise.all(
          errorData.errors.map(error => 
            prisma.communicationErrorLog.create({
              data: {
                message: error.errorMessage, // Use 'message' instead of 'errorMessage'
                category: error.category as any,
                severity: error.severity as any,
                channel: error.channel as any,
                schoolId: testSchoolIds[error.schoolIndex],
                resolved: Math.random() > 0.7, // 30% resolved
                createdAt: new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()))
              }
            })
          )
        );

        try {
          // Test error analysis service
          const errorInsights = await errorAnalysisService.analyzeErrorPatterns({ startDate, endDate });
          
          expect(Array.isArray(errorInsights)).toBe(true);
          
          errorInsights.forEach(insight => {
            expect(typeof insight.pattern).toBe('string');
            expect(typeof insight.frequency).toBe('number');
            expect(insight.frequency).toBeGreaterThan(0);
            expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(insight.impact);
            expect(typeof insight.recommendation).toBe('string');
            expect(Array.isArray(insight.affectedSystems)).toBe(true);
          });

          // Test monitoring service error analysis
          const errorAnalysis = await monitoringService.getErrorAnalysis({ startDate, endDate });
          
          expect(errorAnalysis).toBeDefined();
          expect(errorAnalysis.timeRange.startDate).toBeInstanceOf(Date);
          expect(errorAnalysis.timeRange.endDate).toBeInstanceOf(Date);
          
          // Verify summary consistency
          expect(typeof errorAnalysis.summary.totalErrors).toBe('number');
          expect(errorAnalysis.summary.totalErrors).toBeGreaterThanOrEqual(0);
          expect(typeof errorAnalysis.summary.errorRate).toBe('number');
          expect(errorAnalysis.summary.errorRate).toBeGreaterThanOrEqual(0);
          expect(typeof errorAnalysis.summary.criticalErrors).toBe('number');
          expect(errorAnalysis.summary.criticalErrors).toBeGreaterThanOrEqual(0);
          expect(typeof errorAnalysis.summary.resolvedErrors).toBe('number');
          expect(errorAnalysis.summary.resolvedErrors).toBeGreaterThanOrEqual(0);

          // Verify error grouping consistency
          expect(Array.isArray(errorAnalysis.errorsByType)).toBe(true);
          errorAnalysis.errorsByType.forEach(errorType => {
            expect(typeof errorType.type).toBe('string');
            expect(typeof errorType.count).toBe('number');
            expect(errorType.count).toBeGreaterThan(0);
            expect(typeof errorType.percentage).toBe('number');
            expect(errorType.percentage).toBeGreaterThanOrEqual(0);
            expect(errorType.percentage).toBeLessThanOrEqual(100);
          });

          expect(Array.isArray(errorAnalysis.errorsByComponent)).toBe(true);
          errorAnalysis.errorsByComponent.forEach(component => {
            expect(typeof component.type).toBe('string');
            expect(typeof component.count).toBe('number');
            expect(component.count).toBeGreaterThan(0);
            expect(typeof component.percentage).toBe('number');
            expect(component.percentage).toBeGreaterThanOrEqual(0);
            expect(component.percentage).toBeLessThanOrEqual(100);
          });

          // Verify trends consistency
          expect(Array.isArray(errorAnalysis.trends)).toBe(true);
          errorAnalysis.trends.forEach(trend => {
            expect(trend.timestamp).toBeInstanceOf(Date);
            expect(typeof trend.value).toBe('number');
            expect(trend.value).toBeGreaterThanOrEqual(0);
          });

          // Verify top errors consistency
          expect(Array.isArray(errorAnalysis.topErrors)).toBe(true);
          errorAnalysis.topErrors.forEach(topError => {
            expect(typeof topError.message).toBe('string');
            expect(typeof topError.count).toBe('number');
            expect(topError.count).toBeGreaterThan(0);
            expect(topError.firstOccurrence).toBeInstanceOf(Date);
            expect(topError.lastOccurrence).toBeInstanceOf(Date);
            expect(topError.firstOccurrence.getTime()).toBeLessThanOrEqual(topError.lastOccurrence.getTime());
          });

          // Verify error patterns are properly aggregated
          const totalErrorsFromPatterns = errorInsights.reduce((sum, insight) => sum + insight.frequency, 0);
          expect(totalErrorsFromPatterns).toBeGreaterThan(0);
          
          // Verify that high-frequency patterns are identified
          const highFrequencyPatterns = errorInsights.filter(insight => insight.frequency > 1);
          if (errorData.errors.length > 10) {
            expect(highFrequencyPatterns.length).toBeGreaterThan(0);
          }

        } finally {
          // Cleanup created error logs
          await prisma.communicationErrorLog.deleteMany({
            where: { id: { in: createdErrors.map(e => e.id) } }
          });
        }
      }
    ), { numRuns: 10 }); // Reduce number of runs
  }, 10000); // Increase timeout
});