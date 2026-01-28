/**
 * Performance and Load Testing
 * 
 * Comprehensive performance tests that validate system behavior under
 * realistic and stress conditions, including load testing, stress testing,
 * and performance regression detection.
 * 
 * Requirements: All requirements - Performance validation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { systemIntegrationService } from '@/lib/services/system-integration-service';
import { billingService } from '@/lib/services/billing-service';
import { analyticsService } from '@/lib/services/analytics-service';
import { supportService } from '@/lib/services/support-service';
import { monitoringService } from '@/lib/services/monitoring-service';
import { logger } from '@/lib/utils/comprehensive-logging';

// ============================================================================
// Performance Testing Utilities
// ============================================================================

interface PerformanceMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  throughput: number; // operations per second
  errorRate: number; // percentage
  duration: number; // total test duration in ms
}

interface LoadTestConfig {
  concurrentUsers: number;
  operationsPerUser: number;
  rampUpTime: number; // ms
  testDuration: number; // ms
  operationDelay: number; // ms between operations
}

class PerformanceTestRunner {
  private results: Array<{ success: boolean; responseTime: number; timestamp: number }> = [];
  
  async runLoadTest(
    testName: string,
    config: LoadTestConfig,
    operationFn: () => Promise<any>
  ): Promise<PerformanceMetrics> {
    await logger.info(`Starting load test: ${testName}`, 'performance-test', {
      config,
    });
    
    const startTime = Date.now();
    const promises: Promise<void>[] = [];
    
    // Create concurrent users
    for (let user = 0; user < config.concurrentUsers; user++) {
      const userPromise = this.simulateUser(
        user,
        config,
        operationFn,
        startTime
      );
      promises.push(userPromise);
      
      // Ramp up delay
      if (config.rampUpTime > 0) {
        await this.delay(config.rampUpTime / config.concurrentUsers);
      }
    }
    
    // Wait for all users to complete
    await Promise.allSettled(promises);
    
    const endTime = Date.now();
    const metrics = this.calculateMetrics(startTime, endTime);
    
    await logger.info(`Load test completed: ${testName}`, 'performance-test', {
      metrics,
    });
    
    return metrics;
  }
  
  private async simulateUser(
    userId: number,
    config: LoadTestConfig,
    operationFn: () => Promise<any>,
    testStartTime: number
  ): Promise<void> {
    const userStartTime = Date.now();
    
    for (let op = 0; op < config.operationsPerUser; op++) {
      // Check if test duration exceeded
      if (Date.now() - testStartTime > config.testDuration) {
        break;
      }
      
      const operationStartTime = Date.now();
      
      try {
        await operationFn();
        
        this.results.push({
          success: true,
          responseTime: Date.now() - operationStartTime,
          timestamp: operationStartTime,
        });
        
      } catch (error) {
        this.results.push({
          success: false,
          responseTime: Date.now() - operationStartTime,
          timestamp: operationStartTime,
        });
      }
      
      // Delay between operations
      if (config.operationDelay > 0) {
        await this.delay(config.operationDelay);
      }
    }
  }
  
  private calculateMetrics(startTime: number, endTime: number): PerformanceMetrics {
    const duration = endTime - startTime;
    const totalOperations = this.results.length;
    const successfulOperations = this.results.filter(r => r.success).length;
    const failedOperations = totalOperations - successfulOperations;
    
    const responseTimes = this.results.map(r => r.responseTime).sort((a, b) => a - b);
    
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length || 0;
    const medianResponseTime = responseTimes[Math.floor(responseTimes.length / 2)] || 0;
    const p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)] || 0;
    const p99ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.99)] || 0;
    const minResponseTime = responseTimes[0] || 0;
    const maxResponseTime = responseTimes[responseTimes.length - 1] || 0;
    
    const throughput = totalOperations / (duration / 1000); // ops per second
    const errorRate = (failedOperations / totalOperations) * 100;
    
    return {
      totalOperations,
      successfulOperations,
      failedOperations,
      averageResponseTime,
      medianResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      minResponseTime,
      maxResponseTime,
      throughput,
      errorRate,
      duration,
    };
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  reset(): void {
    this.results = [];
  }
}

// ============================================================================
// Performance Test Suite
// ============================================================================

describe('Performance and Load Testing', () => {
  let testRunner: PerformanceTestRunner;
  
  beforeAll(async () => {
    testRunner = new PerformanceTestRunner();
    await logger.info('Starting performance test suite', 'performance-test');
  });
  
  afterAll(async () => {
    await logger.info('Performance test suite completed', 'performance-test');
  });
  
  // ========================================================================
  // Billing Service Performance Tests
  // ========================================================================
  
  describe('Billing Service Performance', () => {
    it('should handle subscription queries under load', async () => {
      testRunner.reset();
      
      const config: LoadTestConfig = {
        concurrentUsers: 10,
        operationsPerUser: 20,
        rampUpTime: 5000, // 5 seconds
        testDuration: 60000, // 1 minute
        operationDelay: 1000, // 1 second between operations
      };
      
      const metrics = await testRunner.runLoadTest(
        'Billing - Subscription Queries',
        config,
        async () => {
          return await billingService.getSubscriptions({
            limit: 10,
            offset: Math.floor(Math.random() * 100),
          });
        }
      );
      
      // Performance assertions
      expect(metrics.errorRate).toBeLessThan(5); // Less than 5% error rate
      expect(metrics.averageResponseTime).toBeLessThan(2000); // Average under 2 seconds
      expect(metrics.p95ResponseTime).toBeLessThan(5000); // 95th percentile under 5 seconds
      expect(metrics.throughput).toBeGreaterThan(1); // At least 1 operation per second
      
      // Log detailed metrics
      await logger.info('Billing subscription query performance', 'performance-test', {
        metrics,
      });
    });
    
    it('should handle subscription creation under moderate load', async () => {
      testRunner.reset();
      
      const config: LoadTestConfig = {
        concurrentUsers: 5,
        operationsPerUser: 5,
        rampUpTime: 2000,
        testDuration: 30000,
        operationDelay: 2000,
      };
      
      const metrics = await testRunner.runLoadTest(
        'Billing - Subscription Creation',
        config,
        async () => {
          // Note: In a real test, you'd use test data that gets cleaned up
          return await billingService.createSubscription({
            schoolId: `test-school-${Date.now()}-${Math.random()}`,
            planId: 'test-plan-id',
            trialDays: 14,
          });
        }
      );
      
      // More lenient assertions for write operations
      expect(metrics.errorRate).toBeLessThan(10); // Less than 10% error rate
      expect(metrics.averageResponseTime).toBeLessThan(5000); // Average under 5 seconds
      expect(metrics.p95ResponseTime).toBeLessThan(10000); // 95th percentile under 10 seconds
      
      await logger.info('Billing subscription creation performance', 'performance-test', {
        metrics,
      });
    });
  });
  
  // ========================================================================
  // Analytics Service Performance Tests
  // ========================================================================
  
  describe('Analytics Service Performance', () => {
    it('should handle revenue metrics queries under load', async () => {
      testRunner.reset();
      
      const config: LoadTestConfig = {
        concurrentUsers: 15,
        operationsPerUser: 10,
        rampUpTime: 3000,
        testDuration: 45000,
        operationDelay: 1500,
      };
      
      const metrics = await testRunner.runLoadTest(
        'Analytics - Revenue Metrics',
        config,
        async () => {
          const timeRange = {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            endDate: new Date(),
          };
          return await analyticsService.getRevenueMetrics(timeRange);
        }
      );
      
      expect(metrics.errorRate).toBeLessThan(3); // Less than 3% error rate
      expect(metrics.averageResponseTime).toBeLessThan(3000); // Average under 3 seconds
      expect(metrics.p95ResponseTime).toBeLessThan(8000); // 95th percentile under 8 seconds
      expect(metrics.throughput).toBeGreaterThan(2); // At least 2 operations per second
      
      await logger.info('Analytics revenue metrics performance', 'performance-test', {
        metrics,
      });
    });
    
    it('should handle usage analytics queries efficiently', async () => {
      testRunner.reset();
      
      const config: LoadTestConfig = {
        concurrentUsers: 20,
        operationsPerUser: 15,
        rampUpTime: 4000,
        testDuration: 60000,
        operationDelay: 800,
      };
      
      const metrics = await testRunner.runLoadTest(
        'Analytics - Usage Analytics',
        config,
        async () => {
          return await analyticsService.getUsageAnalytics();
        }
      );
      
      expect(metrics.errorRate).toBeLessThan(5);
      expect(metrics.averageResponseTime).toBeLessThan(2500);
      expect(metrics.p95ResponseTime).toBeLessThan(6000);
      expect(metrics.throughput).toBeGreaterThan(3);
      
      await logger.info('Analytics usage analytics performance', 'performance-test', {
        metrics,
      });
    });
  });
  
  // ========================================================================
  // Support Service Performance Tests
  // ========================================================================
  
  describe('Support Service Performance', () => {
    it('should handle ticket queries under high load', async () => {
      testRunner.reset();
      
      const config: LoadTestConfig = {
        concurrentUsers: 25,
        operationsPerUser: 20,
        rampUpTime: 5000,
        testDuration: 90000, // 1.5 minutes
        operationDelay: 500,
      };
      
      const metrics = await testRunner.runLoadTest(
        'Support - Ticket Queries',
        config,
        async () => {
          return await supportService.getTickets({
            limit: 20,
            page: Math.floor(Math.random() * 10) + 1,
          });
        }
      );
      
      expect(metrics.errorRate).toBeLessThan(5);
      expect(metrics.averageResponseTime).toBeLessThan(1500);
      expect(metrics.p95ResponseTime).toBeLessThan(4000);
      expect(metrics.throughput).toBeGreaterThan(5);
      
      await logger.info('Support ticket query performance', 'performance-test', {
        metrics,
      });
    });
    
    it('should handle support metrics calculation efficiently', async () => {
      testRunner.reset();
      
      const config: LoadTestConfig = {
        concurrentUsers: 10,
        operationsPerUser: 10,
        rampUpTime: 2000,
        testDuration: 30000,
        operationDelay: 1000,
      };
      
      const metrics = await testRunner.runLoadTest(
        'Support - Metrics Calculation',
        config,
        async () => {
          return await supportService.getSupportMetrics();
        }
      );
      
      expect(metrics.errorRate).toBeLessThan(5);
      expect(metrics.averageResponseTime).toBeLessThan(3000);
      expect(metrics.p95ResponseTime).toBeLessThan(7000);
      
      await logger.info('Support metrics calculation performance', 'performance-test', {
        metrics,
      });
    });
  });
  
  // ========================================================================
  // Monitoring Service Performance Tests
  // ========================================================================
  
  describe('Monitoring Service Performance', () => {
    it('should handle system health checks efficiently', async () => {
      testRunner.reset();
      
      const config: LoadTestConfig = {
        concurrentUsers: 30,
        operationsPerUser: 25,
        rampUpTime: 3000,
        testDuration: 60000,
        operationDelay: 200, // Very frequent health checks
      };
      
      const metrics = await testRunner.runLoadTest(
        'Monitoring - System Health',
        config,
        async () => {
          return await monitoringService.getSystemHealth();
        }
      );
      
      expect(metrics.errorRate).toBeLessThan(2); // Very low error rate for health checks
      expect(metrics.averageResponseTime).toBeLessThan(1000); // Fast response for health checks
      expect(metrics.p95ResponseTime).toBeLessThan(2500);
      expect(metrics.throughput).toBeGreaterThan(10); // High throughput for health checks
      
      await logger.info('Monitoring system health performance', 'performance-test', {
        metrics,
      });
    });
    
    it('should handle performance metrics recording under load', async () => {
      testRunner.reset();
      
      const config: LoadTestConfig = {
        concurrentUsers: 20,
        operationsPerUser: 30,
        rampUpTime: 2000,
        testDuration: 45000,
        operationDelay: 100, // High frequency metric recording
      };
      
      const metrics = await testRunner.runLoadTest(
        'Monitoring - Metric Recording',
        config,
        async () => {
          return await monitoringService.recordPerformanceMetric(
            'test_metric',
            Math.random() * 1000,
            'ms',
            'performance-test',
            { timestamp: Date.now() }
          );
        }
      );
      
      expect(metrics.errorRate).toBeLessThan(5);
      expect(metrics.averageResponseTime).toBeLessThan(500); // Fast metric recording
      expect(metrics.p95ResponseTime).toBeLessThan(1500);
      expect(metrics.throughput).toBeGreaterThan(15);
      
      await logger.info('Monitoring metric recording performance', 'performance-test', {
        metrics,
      });
    });
  });
  
  // ========================================================================
  // System Integration Performance Tests
  // ========================================================================
  
  describe('System Integration Performance', () => {
    it('should handle cross-service operations under load', async () => {
      testRunner.reset();
      
      const config: LoadTestConfig = {
        concurrentUsers: 15,
        operationsPerUser: 10,
        rampUpTime: 5000,
        testDuration: 60000,
        operationDelay: 2000,
      };
      
      const metrics = await testRunner.runLoadTest(
        'System Integration - Cross-Service Operations',
        config,
        async () => {
          // Simulate a complex operation involving multiple services
          const operations = await Promise.all([
            billingService.getSubscriptions({ limit: 5, offset: 0 }),
            analyticsService.getUsageAnalytics(),
            supportService.getSupportMetrics(),
            monitoringService.getSystemHealth(),
          ]);
          
          return operations;
        }
      );
      
      expect(metrics.errorRate).toBeLessThan(10); // Higher tolerance for complex operations
      expect(metrics.averageResponseTime).toBeLessThan(8000); // 8 seconds for complex operations
      expect(metrics.p95ResponseTime).toBeLessThan(15000); // 15 seconds for 95th percentile
      expect(metrics.throughput).toBeGreaterThan(0.5); // At least 0.5 operations per second
      
      await logger.info('System integration cross-service performance', 'performance-test', {
        metrics,
      });
    });
    
    it('should maintain performance during system health monitoring', async () => {
      testRunner.reset();
      
      const config: LoadTestConfig = {
        concurrentUsers: 5,
        operationsPerUser: 20,
        rampUpTime: 1000,
        testDuration: 60000,
        operationDelay: 3000,
      };
      
      const metrics = await testRunner.runLoadTest(
        'System Integration - Health Monitoring',
        config,
        async () => {
          return await systemIntegrationService.performSystemHealthCheck();
        }
      );
      
      expect(metrics.errorRate).toBeLessThan(5);
      expect(metrics.averageResponseTime).toBeLessThan(10000); // 10 seconds for full health check
      expect(metrics.p95ResponseTime).toBeLessThan(20000); // 20 seconds for 95th percentile
      
      await logger.info('System integration health monitoring performance', 'performance-test', {
        metrics,
      });
    });
  });
  
  // ========================================================================
  // Stress Testing
  // ========================================================================
  
  describe('Stress Testing', () => {
    it('should handle extreme load gracefully', async () => {
      testRunner.reset();
      
      // Extreme load configuration
      const config: LoadTestConfig = {
        concurrentUsers: 50,
        operationsPerUser: 50,
        rampUpTime: 10000, // 10 seconds ramp up
        testDuration: 120000, // 2 minutes
        operationDelay: 100, // Very frequent operations
      };
      
      const metrics = await testRunner.runLoadTest(
        'Stress Test - Extreme Load',
        config,
        async () => {
          // Mix of different operations to simulate real usage
          const operations = [
            () => billingService.getSubscriptions({ limit: 10, offset: 0 }),
            () => analyticsService.getUsageAnalytics(),
            () => supportService.getTickets({ limit: 10 }),
            () => monitoringService.getSystemHealth(),
          ];
          
          const randomOperation = operations[Math.floor(Math.random() * operations.length)];
          return await randomOperation();
        }
      );
      
      // More lenient assertions for stress testing
      expect(metrics.errorRate).toBeLessThan(20); // Up to 20% error rate acceptable under extreme load
      expect(metrics.averageResponseTime).toBeLessThan(15000); // 15 seconds average
      expect(metrics.throughput).toBeGreaterThan(5); // At least 5 operations per second
      
      await logger.warn('Stress test completed - check for any degradation', 'performance-test', {
        metrics,
        testType: 'stress',
      });
      
      // Verify system recovery after stress test
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      const healthCheck = await systemIntegrationService.performSystemHealthCheck();
      const healthyServices = healthCheck.filter(h => h.status === 'healthy').length;
      const totalServices = healthCheck.length;
      
      expect(healthyServices / totalServices).toBeGreaterThan(0.8); // At least 80% of services should be healthy after stress test
    });
  });
  
  // ========================================================================
  // Memory and Resource Usage Tests
  // ========================================================================
  
  describe('Resource Usage Testing', () => {
    it('should not have significant memory leaks during sustained operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Run sustained operations
      const config: LoadTestConfig = {
        concurrentUsers: 10,
        operationsPerUser: 100,
        rampUpTime: 2000,
        testDuration: 180000, // 3 minutes
        operationDelay: 500,
      };
      
      const metrics = await testRunner.runLoadTest(
        'Resource Usage - Memory Leak Test',
        config,
        async () => {
          return await monitoringService.getSystemHealth();
        }
      );
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.heapUsed) * 100;
      
      await logger.info('Memory usage analysis', 'performance-test', {
        initialMemory: initialMemory.heapUsed,
        finalMemory: finalMemory.heapUsed,
        memoryIncrease,
        memoryIncreasePercent,
        totalOperations: metrics.totalOperations,
      });
      
      // Memory increase should be reasonable (less than 50% increase)
      expect(memoryIncreasePercent).toBeLessThan(50);
      
      // Performance should still be acceptable
      expect(metrics.errorRate).toBeLessThan(10);
      expect(metrics.averageResponseTime).toBeLessThan(5000);
    });
  });
});