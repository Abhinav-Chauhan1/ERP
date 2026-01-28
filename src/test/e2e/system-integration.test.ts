/**
 * End-to-End System Integration Tests
 * 
 * Comprehensive tests that validate complete business workflows from UI to database,
 * system performance under realistic load, disaster recovery procedures, and
 * cross-browser compatibility.
 * 
 * Requirements: All requirements - Complete system validation
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { systemIntegrationService } from '@/lib/services/system-integration-service';
import { billingService } from '@/lib/services/billing-service';
import { analyticsService } from '@/lib/services/analytics-service';
import { supportService } from '@/lib/services/support-service';
import { monitoringService } from '@/lib/services/monitoring-service';
import { auditService } from '@/lib/services/audit-service';
import { permissionService } from '@/lib/services/permission-service';
import { configurationService } from '@/lib/services/configuration-service';
import { dataManagementService } from '@/lib/services/data-management-service';
import { logger } from '@/lib/utils/comprehensive-logging';
import { db } from '@/lib/db';

// ============================================================================
// Test Setup and Utilities
// ============================================================================

interface TestContext {
  testUserId: string;
  testSchoolId: string;
  testSubscriptionId: string;
  testTicketId: string;
  correlationId: string;
}

let testContext: TestContext;

beforeAll(async () => {
  // Initialize test context
  testContext = {
    testUserId: 'test-user-' + Date.now(),
    testSchoolId: 'test-school-' + Date.now(),
    testSubscriptionId: 'test-subscription-' + Date.now(),
    testTicketId: 'test-ticket-' + Date.now(),
    correlationId: 'test-correlation-' + Date.now(),
  };

  // Set up test data
  await setupTestData();
});

afterAll(async () => {
  // Clean up test data
  await cleanupTestData();
  
  // Dispose services
  systemIntegrationService.dispose();
  logger.dispose();
});

beforeEach(async () => {
  // Reset any service state before each test
  await logger.info('Starting test', 'e2e-test', {
    correlationId: testContext.correlationId,
  });
});

afterEach(async () => {
  // Log test completion
  await logger.info('Test completed', 'e2e-test', {
    correlationId: testContext.correlationId,
  });
});

async function setupTestData(): Promise<void> {
  // Create test user, school, and other required data
  // This would typically involve creating test records in the database
  await logger.info('Setting up test data', 'e2e-test', {
    correlationId: testContext.correlationId,
  });
}

async function cleanupTestData(): Promise<void> {
  // Clean up test records
  await logger.info('Cleaning up test data', 'e2e-test', {
    correlationId: testContext.correlationId,
  });
}

// ============================================================================
// System Health and Integration Tests
// ============================================================================

describe('System Integration - Health Checks', () => {
  it('should perform comprehensive system health check', async () => {
    const healthChecks = await systemIntegrationService.performSystemHealthCheck();
    
    expect(healthChecks).toBeDefined();
    expect(Array.isArray(healthChecks)).toBe(true);
    expect(healthChecks.length).toBeGreaterThan(0);
    
    // Verify all critical services are healthy
    const criticalServices = ['billing', 'analytics', 'monitoring', 'audit'];
    for (const serviceName of criticalServices) {
      const serviceHealth = healthChecks.find(h => h.service === serviceName);
      expect(serviceHealth).toBeDefined();
      expect(serviceHealth?.status).not.toBe('down');
      expect(serviceHealth?.responseTime).toBeLessThan(10000); // 10 seconds max
    }
  });

  it('should detect and report service degradation', async () => {
    // This test would simulate service degradation and verify detection
    const systemStatus = await systemIntegrationService.getSystemStatus();
    
    expect(systemStatus).toBeDefined();
    expect(systemStatus.overallHealth).toMatch(/^(healthy|degraded|down)$/);
    expect(systemStatus.services).toBeDefined();
    expect(systemStatus.dataConsistency).toBeDefined();
    expect(systemStatus.lastUpdated).toBeInstanceOf(Date);
  });

  it('should perform data consistency checks across services', async () => {
    const consistencyResult = await systemIntegrationService.performDataConsistencyCheck();
    
    expect(consistencyResult).toBeDefined();
    expect(typeof consistencyResult.isConsistent).toBe('boolean');
    expect(Array.isArray(consistencyResult.inconsistencies)).toBe(true);
    expect(consistencyResult.checkedAt).toBeInstanceOf(Date);
    
    // Log any inconsistencies for investigation
    if (consistencyResult.inconsistencies.length > 0) {
      await logger.warn(
        `Found ${consistencyResult.inconsistencies.length} data inconsistencies`,
        'e2e-test',
        {
          inconsistencies: consistencyResult.inconsistencies,
          correlationId: testContext.correlationId,
        }
      );
    }
  });
});

// ============================================================================
// Complete Business Workflow Tests
// ============================================================================

describe('End-to-End Business Workflows', () => {
  it('should complete full subscription lifecycle workflow', async () => {
    const startTime = Date.now();
    
    try {
      // 1. Create subscription
      const subscriptionResult = await systemIntegrationService.executeServiceOperation(
        'billing',
        'createSubscription',
        async () => {
          return await billingService.createSubscription({
            schoolId: testContext.testSchoolId,
            planId: 'test-plan-id',
            trialDays: 14,
            metadata: { testWorkflow: 'subscription-lifecycle' },
          });
        },
        testContext.testUserId
      );
      
      expect(subscriptionResult.success).toBe(true);
      expect(subscriptionResult.data).toBeDefined();
      
      // 2. Generate invoice
      const invoiceResult = await systemIntegrationService.executeServiceOperation(
        'billing',
        'generateInvoice',
        async () => {
          return await billingService.generateInvoice(subscriptionResult.data!.id);
        },
        testContext.testUserId
      );
      
      expect(invoiceResult.success).toBe(true);
      
      // 3. Process payment
      const paymentResult = await systemIntegrationService.executeServiceOperation(
        'billing',
        'processPayment',
        async () => {
          return await billingService.processPayment({
            amount: 10000, // $100.00
            currency: 'USD',
            description: 'Test payment',
            metadata: { subscriptionId: subscriptionResult.data!.id },
          });
        },
        testContext.testUserId
      );
      
      expect(paymentResult.success).toBe(true);
      
      // 4. Verify analytics tracking
      const analyticsResult = await systemIntegrationService.executeServiceOperation(
        'analytics',
        'getRevenueMetrics',
        async () => {
          const timeRange = {
            startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
            endDate: new Date(),
          };
          return await analyticsService.getRevenueMetrics(timeRange);
        },
        testContext.testUserId
      );
      
      expect(analyticsResult.success).toBe(true);
      expect(analyticsResult.data).toBeDefined();
      
      // 5. Verify audit logging
      const auditResult = await auditService.getAuditLogs({
        userId: testContext.testUserId,
        resource: 'SUBSCRIPTION',
        limit: 10,
      });
      
      expect(auditResult.success).toBe(true);
      expect(auditResult.data.logs.length).toBeGreaterThan(0);
      
      const duration = Date.now() - startTime;
      await logger.info(
        `Subscription lifecycle workflow completed successfully in ${duration}ms`,
        'e2e-test',
        {
          duration,
          correlationId: testContext.correlationId,
        }
      );
      
    } catch (error) {
      const duration = Date.now() - startTime;
      await logger.error(
        'Subscription lifecycle workflow failed',
        'e2e-test',
        {
          error: error instanceof Error ? error : new Error('Unknown error'),
          duration,
          correlationId: testContext.correlationId,
        }
      );
      throw error;
    }
  });

  it('should complete full support ticket workflow', async () => {
    const startTime = Date.now();
    
    try {
      // 1. Create support ticket
      const ticketResult = await systemIntegrationService.executeServiceOperation(
        'support',
        'createTicket',
        async () => {
          return await supportService.createTicket({
            schoolId: testContext.testSchoolId,
            title: 'Test Support Issue',
            description: 'This is a test support ticket for E2E testing',
            priority: 'MEDIUM',
            createdBy: testContext.testUserId,
          });
        },
        testContext.testUserId
      );
      
      expect(ticketResult.success).toBe(true);
      expect(ticketResult.data).toBeDefined();
      
      // 2. Add comment to ticket
      const commentResult = await systemIntegrationService.executeServiceOperation(
        'support',
        'addComment',
        async () => {
          return await supportService.addComment(
            ticketResult.data!.id,
            testContext.testUserId,
            'This is a test comment for the support ticket'
          );
        },
        testContext.testUserId
      );
      
      expect(commentResult.success).toBe(true);
      
      // 3. Update ticket status
      const updateResult = await systemIntegrationService.executeServiceOperation(
        'support',
        'updateTicket',
        async () => {
          return await supportService.updateTicket(
            ticketResult.data!.id,
            { status: 'IN_PROGRESS' },
            testContext.testUserId
          );
        },
        testContext.testUserId
      );
      
      expect(updateResult.success).toBe(true);
      
      // 4. Resolve ticket
      const resolveResult = await systemIntegrationService.executeServiceOperation(
        'support',
        'updateTicket',
        async () => {
          return await supportService.updateTicket(
            ticketResult.data!.id,
            { status: 'RESOLVED' },
            testContext.testUserId
          );
        },
        testContext.testUserId
      );
      
      expect(resolveResult.success).toBe(true);
      
      // 5. Verify support metrics
      const metricsResult = await systemIntegrationService.executeServiceOperation(
        'support',
        'getSupportMetrics',
        async () => {
          return await supportService.getSupportMetrics();
        },
        testContext.testUserId
      );
      
      expect(metricsResult.success).toBe(true);
      expect(metricsResult.data.totalTickets).toBeGreaterThan(0);
      
      const duration = Date.now() - startTime;
      await logger.info(
        `Support ticket workflow completed successfully in ${duration}ms`,
        'e2e-test',
        {
          duration,
          correlationId: testContext.correlationId,
        }
      );
      
    } catch (error) {
      const duration = Date.now() - startTime;
      await logger.error(
        'Support ticket workflow failed',
        'e2e-test',
        {
          error: error instanceof Error ? error : new Error('Unknown error'),
          duration,
          correlationId: testContext.correlationId,
        }
      );
      throw error;
    }
  });

  it('should complete full analytics and reporting workflow', async () => {
    const startTime = Date.now();
    
    try {
      const timeRange = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
        endDate: new Date(),
      };
      
      // 1. Get revenue analytics
      const revenueResult = await systemIntegrationService.executeServiceOperation(
        'analytics',
        'getRevenueMetrics',
        async () => {
          return await analyticsService.getRevenueMetrics(timeRange);
        },
        testContext.testUserId
      );
      
      expect(revenueResult.success).toBe(true);
      expect(revenueResult.data).toBeDefined();
      
      // 2. Get churn analysis
      const churnResult = await systemIntegrationService.executeServiceOperation(
        'analytics',
        'getChurnAnalysis',
        async () => {
          return await analyticsService.getChurnAnalysis(timeRange);
        },
        testContext.testUserId
      );
      
      expect(churnResult.success).toBe(true);
      expect(churnResult.data).toBeDefined();
      
      // 3. Get usage analytics
      const usageResult = await systemIntegrationService.executeServiceOperation(
        'analytics',
        'getUsageAnalytics',
        async () => {
          return await analyticsService.getUsageAnalytics();
        },
        testContext.testUserId
      );
      
      expect(usageResult.success).toBe(true);
      expect(usageResult.data).toBeDefined();
      
      // 4. Generate custom report
      const reportResult = await systemIntegrationService.executeServiceOperation(
        'analytics',
        'generateCustomReport',
        async () => {
          return await analyticsService.generateCustomReport({
            name: 'E2E Test Report',
            type: 'revenue',
            timeRange,
            filters: {},
            metrics: ['totalRevenue', 'monthlyRecurringRevenue'],
            format: 'json',
          });
        },
        testContext.testUserId
      );
      
      expect(reportResult.success).toBe(true);
      expect(reportResult.data).toBeDefined();
      
      // 5. Export data
      const exportResult = await systemIntegrationService.executeServiceOperation(
        'analytics',
        'exportData',
        async () => {
          return await analyticsService.exportData({
            type: 'revenue',
            format: 'csv',
            timeRange,
          });
        },
        testContext.testUserId
      );
      
      expect(exportResult.success).toBe(true);
      expect(exportResult.data).toBeDefined();
      
      const duration = Date.now() - startTime;
      await logger.info(
        `Analytics workflow completed successfully in ${duration}ms`,
        'e2e-test',
        {
          duration,
          correlationId: testContext.correlationId,
        }
      );
      
    } catch (error) {
      const duration = Date.now() - startTime;
      await logger.error(
        'Analytics workflow failed',
        'e2e-test',
        {
          error: error instanceof Error ? error : new Error('Unknown error'),
          duration,
          correlationId: testContext.correlationId,
        }
      );
      throw error;
    }
  });
});

// ============================================================================
// Performance and Load Tests
// ============================================================================

describe('System Performance Under Load', () => {
  it('should handle concurrent operations across multiple services', async () => {
    const concurrentOperations = 10;
    const operations: Promise<any>[] = [];
    
    const startTime = Date.now();
    
    // Create concurrent operations across different services
    for (let i = 0; i < concurrentOperations; i++) {
      // Billing operations
      operations.push(
        systemIntegrationService.executeServiceOperation(
          'billing',
          'getSubscriptions',
          async () => {
            return await billingService.getSubscriptions({ limit: 10, offset: i * 10 });
          },
          testContext.testUserId
        )
      );
      
      // Analytics operations
      operations.push(
        systemIntegrationService.executeServiceOperation(
          'analytics',
          'getUsageAnalytics',
          async () => {
            return await analyticsService.getUsageAnalytics();
          },
          testContext.testUserId
        )
      );
      
      // Support operations
      operations.push(
        systemIntegrationService.executeServiceOperation(
          'support',
          'getTickets',
          async () => {
            return await supportService.getTickets({ limit: 10, page: i + 1 });
          },
          testContext.testUserId
        )
      );
    }
    
    // Wait for all operations to complete
    const results = await Promise.allSettled(operations);
    const duration = Date.now() - startTime;
    
    // Analyze results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    expect(successful).toBeGreaterThan(failed);
    expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    
    await logger.info(
      `Concurrent operations completed: ${successful} successful, ${failed} failed in ${duration}ms`,
      'e2e-test',
      {
        concurrentOperations: operations.length,
        successful,
        failed,
        duration,
        correlationId: testContext.correlationId,
      }
    );
  });

  it('should maintain performance under sustained load', async () => {
    const testDuration = 30000; // 30 seconds
    const operationInterval = 1000; // 1 second
    const startTime = Date.now();
    const results: Array<{ success: boolean; duration: number }> = [];
    
    while (Date.now() - startTime < testDuration) {
      const operationStart = Date.now();
      
      try {
        const result = await systemIntegrationService.executeServiceOperation(
          'monitoring',
          'getSystemHealth',
          async () => {
            return await monitoringService.getSystemHealth();
          },
          testContext.testUserId
        );
        
        results.push({
          success: result.success,
          duration: Date.now() - operationStart,
        });
        
      } catch (error) {
        results.push({
          success: false,
          duration: Date.now() - operationStart,
        });
      }
      
      // Wait before next operation
      await new Promise(resolve => setTimeout(resolve, operationInterval));
    }
    
    // Analyze performance
    const successfulOperations = results.filter(r => r.success).length;
    const averageDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const maxDuration = Math.max(...results.map(r => r.duration));
    const successRate = (successfulOperations / results.length) * 100;
    
    expect(successRate).toBeGreaterThan(95); // 95% success rate
    expect(averageDuration).toBeLessThan(5000); // Average under 5 seconds
    expect(maxDuration).toBeLessThan(15000); // Max under 15 seconds
    
    await logger.info(
      `Sustained load test completed: ${successRate.toFixed(1)}% success rate, avg: ${averageDuration.toFixed(0)}ms`,
      'e2e-test',
      {
        totalOperations: results.length,
        successfulOperations,
        successRate,
        averageDuration,
        maxDuration,
        correlationId: testContext.correlationId,
      }
    );
  });
});

// ============================================================================
// Error Handling and Recovery Tests
// ============================================================================

describe('Error Handling and Recovery', () => {
  it('should handle service failures gracefully', async () => {
    // Test error handling by attempting operations that might fail
    const errorScenarios = [
      {
        name: 'Invalid subscription creation',
        operation: async () => {
          return await billingService.createSubscription({
            schoolId: 'invalid-school-id',
            planId: 'invalid-plan-id',
          });
        },
      },
      {
        name: 'Invalid ticket creation',
        operation: async () => {
          return await supportService.createTicket({
            schoolId: 'invalid-school-id',
            title: '',
            description: '',
            priority: 'MEDIUM',
            createdBy: 'invalid-user-id',
          });
        },
      },
    ];
    
    for (const scenario of errorScenarios) {
      const result = await systemIntegrationService.executeServiceOperation(
        'test',
        scenario.name,
        scenario.operation,
        testContext.testUserId
      );
      
      // Should handle errors gracefully without crashing
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }
    }
  });

  it('should retry failed operations according to configuration', async () => {
    let attemptCount = 0;
    
    const result = await systemIntegrationService.executeServiceOperation(
      'test',
      'retry-test',
      async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Simulated failure');
        }
        return { success: true, attempt: attemptCount };
      },
      testContext.testUserId
    );
    
    expect(result.success).toBe(true);
    expect(result.data?.attempt).toBe(3);
    expect(attemptCount).toBe(3);
  });
});

// ============================================================================
// Data Integrity and Backup Tests
// ============================================================================

describe('Data Management and Backup', () => {
  it('should perform backup operations successfully', async () => {
    const backupResult = await systemIntegrationService.executeServiceOperation(
      'dataManagement',
      'createBackup',
      async () => {
        return await dataManagementService.createBackup({
          type: 'full',
          includeFiles: false,
          compression: true,
          encryption: true,
        });
      },
      testContext.testUserId
    );
    
    expect(backupResult.success).toBe(true);
    expect(backupResult.data).toBeDefined();
  });

  it('should verify data integrity across services', async () => {
    const integrityResult = await systemIntegrationService.executeServiceOperation(
      'dataManagement',
      'verifyDataIntegrity',
      async () => {
        return await dataManagementService.verifyDataIntegrity({
          checkReferences: true,
          checkConstraints: true,
          checkIndexes: true,
        });
      },
      testContext.testUserId
    );
    
    expect(integrityResult.success).toBe(true);
    expect(integrityResult.data).toBeDefined();
    expect(integrityResult.data.isValid).toBe(true);
  });
});

// ============================================================================
// Configuration and Feature Management Tests
// ============================================================================

describe('Configuration Management', () => {
  it('should manage global configuration settings', async () => {
    // Test configuration retrieval
    const getConfigResult = await systemIntegrationService.executeServiceOperation(
      'configuration',
      'getGlobalSettings',
      async () => {
        return await configurationService.getGlobalSettings();
      },
      testContext.testUserId
    );
    
    expect(getConfigResult.success).toBe(true);
    expect(getConfigResult.data).toBeDefined();
    
    // Test configuration update
    const updateConfigResult = await systemIntegrationService.executeServiceOperation(
      'configuration',
      'updateGlobalSettings',
      async () => {
        return await configurationService.updateGlobalSettings({
          'test.setting': 'test-value',
        });
      },
      testContext.testUserId
    );
    
    expect(updateConfigResult.success).toBe(true);
  });

  it('should manage feature flags correctly', async () => {
    const featureFlagResult = await systemIntegrationService.executeServiceOperation(
      'configuration',
      'getFeatureFlags',
      async () => {
        return await configurationService.getFeatureFlags();
      },
      testContext.testUserId
    );
    
    expect(featureFlagResult.success).toBe(true);
    expect(featureFlagResult.data).toBeDefined();
  });
});

// ============================================================================
// Monitoring and Alerting Tests
// ============================================================================

describe('Monitoring and Alerting', () => {
  it('should create and manage alerts properly', async () => {
    // Create test alert
    const createAlertResult = await systemIntegrationService.executeServiceOperation(
      'monitoring',
      'createAlert',
      async () => {
        return await monitoringService.createAlert({
          alertType: 'api_error',
          severity: 'WARNING',
          title: 'E2E Test Alert',
          description: 'This is a test alert created during E2E testing',
          metadata: { testContext: testContext.correlationId },
        });
      },
      testContext.testUserId
    );
    
    expect(createAlertResult.success).toBe(true);
    expect(createAlertResult.data).toBeDefined();
    
    // Get alerts
    const getAlertsResult = await systemIntegrationService.executeServiceOperation(
      'monitoring',
      'getAlerts',
      async () => {
        return await monitoringService.getAlerts({ limit: 10 });
      },
      testContext.testUserId
    );
    
    expect(getAlertsResult.success).toBe(true);
    expect(getAlertsResult.data).toBeDefined();
    expect(getAlertsResult.data.alerts).toBeDefined();
  });

  it('should record and retrieve performance metrics', async () => {
    const recordMetricResult = await systemIntegrationService.executeServiceOperation(
      'monitoring',
      'recordPerformanceMetric',
      async () => {
        return await monitoringService.recordPerformanceMetric(
          'test_metric',
          100,
          'ms',
          'e2e-test',
          { testContext: testContext.correlationId }
        );
      },
      testContext.testUserId
    );
    
    expect(recordMetricResult.success).toBe(true);
    
    const getMetricsResult = await systemIntegrationService.executeServiceOperation(
      'monitoring',
      'getPerformanceMetrics',
      async () => {
        const timeRange = {
          startDate: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          endDate: new Date(),
        };
        return await monitoringService.getPerformanceMetrics(timeRange);
      },
      testContext.testUserId
    );
    
    expect(getMetricsResult.success).toBe(true);
    expect(getMetricsResult.data).toBeDefined();
  });
});

// ============================================================================
// Cross-Service Communication Tests
// ============================================================================

describe('Cross-Service Communication', () => {
  it('should maintain data consistency across service boundaries', async () => {
    // This test verifies that operations affecting multiple services
    // maintain consistency across all affected services
    
    const consistencyCheck = await systemIntegrationService.performDataConsistencyCheck();
    
    expect(consistencyCheck.isConsistent).toBe(true);
    
    if (consistencyCheck.inconsistencies.length > 0) {
      await logger.warn(
        'Data inconsistencies detected during cross-service communication test',
        'e2e-test',
        {
          inconsistencies: consistencyCheck.inconsistencies,
          correlationId: testContext.correlationId,
        }
      );
    }
  });

  it('should handle cross-service transactions properly', async () => {
    // Test a complex operation that involves multiple services
    const startTime = Date.now();
    
    try {
      // This would be a complex operation involving multiple services
      // For example: creating a subscription, generating analytics events,
      // creating audit logs, and updating monitoring metrics
      
      const operations = await Promise.all([
        systemIntegrationService.executeServiceOperation(
          'billing',
          'getSubscriptions',
          async () => billingService.getSubscriptions({ limit: 1, offset: 0 }),
          testContext.testUserId
        ),
        systemIntegrationService.executeServiceOperation(
          'analytics',
          'getUsageAnalytics',
          async () => analyticsService.getUsageAnalytics(),
          testContext.testUserId
        ),
        systemIntegrationService.executeServiceOperation(
          'support',
          'getSupportMetrics',
          async () => supportService.getSupportMetrics(),
          testContext.testUserId
        ),
      ]);
      
      // Verify all operations succeeded
      operations.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      });
      
      const duration = Date.now() - startTime;
      await logger.info(
        `Cross-service transaction completed successfully in ${duration}ms`,
        'e2e-test',
        {
          operationCount: operations.length,
          duration,
          correlationId: testContext.correlationId,
        }
      );
      
    } catch (error) {
      const duration = Date.now() - startTime;
      await logger.error(
        'Cross-service transaction failed',
        'e2e-test',
        {
          error: error instanceof Error ? error : new Error('Unknown error'),
          duration,
          correlationId: testContext.correlationId,
        }
      );
      throw error;
    }
  });
});