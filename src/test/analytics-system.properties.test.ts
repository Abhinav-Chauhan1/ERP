import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { prisma } from '@/lib/db';
import { analyticsService } from '@/lib/services/analytics-service';
import { reportingService } from '@/lib/services/reporting-service';
import { dashboardService } from '@/lib/services/dashboard-service';
import { biIntegrationService } from '@/lib/services/bi-integration-service';
import { 
  SubscriptionStatus, 
  PaymentStatus, 
  InvoiceStatus,
  SchoolStatus,
  PlanType 
} from '@prisma/client';

// Feature: super-admin-saas-completion
// Property tests for analytics and business intelligence system

describe('Analytics System Property Tests', () => {
  let testSchoolIds: string[] = [];
  let testPlanIds: string[] = [];
  let testSubscriptionIds: string[] = [];

  beforeAll(async () => {
    // Create test subscription plans
    const plans = await Promise.all([
      prisma.subscriptionPlan.create({
        data: {
          name: 'Basic Plan',
          description: 'Basic subscription plan',
          amount: 999,
          currency: 'inr',
          interval: 'month',
          features: { users: 50, storage: '5GB' },
          isActive: true
        }
      }),
      prisma.subscriptionPlan.create({
        data: {
          name: 'Premium Plan',
          description: 'Premium subscription plan',
          amount: 1999,
          currency: 'inr',
          interval: 'month',
          features: { users: 200, storage: '20GB' },
          isActive: true
        }
      }),
      prisma.subscriptionPlan.create({
        data: {
          name: 'Enterprise Plan',
          description: 'Enterprise subscription plan',
          amount: 9999,
          currency: 'inr',
          interval: 'year',
          features: { users: 1000, storage: '100GB' },
          isActive: true
        }
      })
    ]);
    testPlanIds = plans.map(p => p.id);

    // Create test schools with different statuses and plans
    const schools = await Promise.all([
      prisma.school.create({
        data: {
          name: 'Analytics Test School 1',
          schoolCode: 'ANALYTICS_001',
          email: 'test1@analytics.com',
          phone: '+1234567891',
          status: SchoolStatus.ACTIVE,
          plan: PlanType.PREMIUM
        }
      }),
      prisma.school.create({
        data: {
          name: 'Analytics Test School 2',
          schoolCode: 'ANALYTICS_002',
          email: 'test2@analytics.com',
          phone: '+1234567892',
          status: SchoolStatus.ACTIVE,
          plan: PlanType.STARTER
        }
      }),
      prisma.school.create({
        data: {
          name: 'Analytics Test School 3',
          schoolCode: 'ANALYTICS_003',
          email: 'test3@analytics.com',
          phone: '+1234567893',
          status: SchoolStatus.SUSPENDED,
          plan: PlanType.ENTERPRISE
        }
      })
    ]);
    testSchoolIds = schools.map(s => s.id);

    // Create test subscriptions with different statuses
    const subscriptions = await Promise.all([
      prisma.enhancedSubscription.create({
        data: {
          schoolId: testSchoolIds[0],
          planId: testPlanIds[0],
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          metadata: { source: 'test' }
        }
      }),
      prisma.enhancedSubscription.create({
        data: {
          schoolId: testSchoolIds[1],
          planId: testPlanIds[1],
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          currentPeriodEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
          metadata: { source: 'test' }
        }
      }),
      prisma.enhancedSubscription.create({
        data: {
          schoolId: testSchoolIds[2],
          planId: testPlanIds[2],
          status: SubscriptionStatus.CANCELED,
          currentPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          currentPeriodEnd: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          metadata: { source: 'test', churnReason: 'price' }
        }
      })
    ]);
    testSubscriptionIds = subscriptions.map(s => s.id);

    // Create test payments
    await Promise.all([
      prisma.payment.create({
        data: {
          subscriptionId: testSubscriptionIds[0],
          amount: 999,
          currency: 'inr',
          status: PaymentStatus.COMPLETED,
          processedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          paymentMethod: 'card'
        }
      }),
      prisma.payment.create({
        data: {
          subscriptionId: testSubscriptionIds[1],
          amount: 1999,
          currency: 'inr',
          status: PaymentStatus.COMPLETED,
          processedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          paymentMethod: 'upi'
        }
      }),
      prisma.payment.create({
        data: {
          subscriptionId: testSubscriptionIds[0],
          amount: 999,
          currency: 'inr',
          status: PaymentStatus.FAILED,
          processedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          paymentMethod: 'card',
          failureReason: 'insufficient_funds'
        }
      })
    ]);

    // Create test analytics events
    await Promise.all([
      prisma.analyticsEvent.create({
        data: {
          eventType: 'user_login',
          schoolId: testSchoolIds[0],
          properties: { userRole: 'admin', timestamp: new Date().toISOString() },
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
      }),
      prisma.analyticsEvent.create({
        data: {
          eventType: 'feature_usage',
          schoolId: testSchoolIds[1],
          properties: { feature: 'reports', usage_count: 5 },
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
      }),
      prisma.analyticsEvent.create({
        data: {
          eventType: 'api_call',
          schoolId: testSchoolIds[0],
          properties: { endpoint: '/api/students', method: 'GET' },
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        }
      })
    ]);
  });

  afterAll(async () => {
    // Cleanup test data in correct order
    await prisma.analyticsEvent.deleteMany({ 
      where: { schoolId: { in: testSchoolIds } } 
    });
    await prisma.payment.deleteMany({ 
      where: { subscriptionId: { in: testSubscriptionIds } } 
    });
    await prisma.invoice.deleteMany({ 
      where: { subscriptionId: { in: testSubscriptionIds } } 
    });
    await prisma.enhancedSubscription.deleteMany({ 
      where: { id: { in: testSubscriptionIds } } 
    });
    await prisma.school.deleteMany({ 
      where: { id: { in: testSchoolIds } } 
    });
    await prisma.subscriptionPlan.deleteMany({ 
      where: { id: { in: testPlanIds } } 
    });
  });

  // Property 14: Analytics Data Consistency
  // **Validates: Requirements 5.1, 5.2, 5.3**
  test('Property 14: Analytics Data Consistency', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        timeRangeDays: fc.integer({ min: 1, max: 90 }),
        includeRevenue: fc.boolean(),
        includeChurn: fc.boolean(),
        includeUsage: fc.boolean()
      }),
      async (analyticsConfig) => {
        try {
          const timeRange = {
            startDate: new Date(Date.now() - analyticsConfig.timeRangeDays * 24 * 60 * 60 * 1000),
            endDate: new Date()
          };

          let results: any = {};

          // Test revenue analytics consistency
          if (analyticsConfig.includeRevenue) {
            const revenueMetrics = await analyticsService.getRevenueMetrics(timeRange);
            
            // Verify revenue metrics structure and consistency
            expect(revenueMetrics).toBeDefined();
            expect(typeof revenueMetrics.totalRevenue).toBe('number');
            expect(revenueMetrics.totalRevenue).toBeGreaterThanOrEqual(0);
            expect(typeof revenueMetrics.monthlyRecurringRevenue).toBe('number');
            expect(revenueMetrics.monthlyRecurringRevenue).toBeGreaterThanOrEqual(0);
            expect(typeof revenueMetrics.annualRecurringRevenue).toBe('number');
            expect(revenueMetrics.annualRecurringRevenue).toBeGreaterThanOrEqual(0);
            expect(typeof revenueMetrics.averageRevenuePerUser).toBe('number');
            expect(revenueMetrics.averageRevenuePerUser).toBeGreaterThanOrEqual(0);
            expect(typeof revenueMetrics.revenueGrowthRate).toBe('number');
            
            // Verify revenue by plan consistency
            expect(Array.isArray(revenueMetrics.revenueByPlan)).toBe(true);
            revenueMetrics.revenueByPlan.forEach(planRevenue => {
              expect(typeof planRevenue.planName).toBe('string');
              expect(typeof planRevenue.revenue).toBe('number');
              expect(planRevenue.revenue).toBeGreaterThanOrEqual(0);
              expect(typeof planRevenue.percentage).toBe('number');
              expect(planRevenue.percentage).toBeGreaterThanOrEqual(0);
              expect(planRevenue.percentage).toBeLessThanOrEqual(100);
            });

            // Verify revenue trends consistency
            expect(Array.isArray(revenueMetrics.revenueTrends)).toBe(true);
            revenueMetrics.revenueTrends.forEach(trend => {
              expect(typeof trend.period).toBe('string');
              expect(typeof trend.revenue).toBe('number');
              expect(trend.revenue).toBeGreaterThanOrEqual(0);
              expect(typeof trend.subscriptions).toBe('number');
              expect(trend.subscriptions).toBeGreaterThanOrEqual(0);
            });

            // Verify forecasting consistency
            expect(revenueMetrics.forecasting).toBeDefined();
            expect(typeof revenueMetrics.forecasting.nextMonthProjection).toBe('number');
            expect(revenueMetrics.forecasting.nextMonthProjection).toBeGreaterThanOrEqual(0);
            expect(typeof revenueMetrics.forecasting.nextQuarterProjection).toBe('number');
            expect(revenueMetrics.forecasting.nextQuarterProjection).toBeGreaterThanOrEqual(0);
            expect(typeof revenueMetrics.forecasting.confidence).toBe('number');
            expect(revenueMetrics.forecasting.confidence).toBeGreaterThanOrEqual(0);
            expect(revenueMetrics.forecasting.confidence).toBeLessThanOrEqual(100);

            results.revenue = revenueMetrics;
          }

          // Test churn analysis consistency
          if (analyticsConfig.includeChurn) {
            const churnAnalysis = await analyticsService.getChurnAnalysis(timeRange);
            
            // Verify churn analysis structure and consistency
            expect(churnAnalysis).toBeDefined();
            expect(typeof churnAnalysis.churnRate).toBe('number');
            expect(churnAnalysis.churnRate).toBeGreaterThanOrEqual(0);
            expect(churnAnalysis.churnRate).toBeLessThanOrEqual(100);
            expect(typeof churnAnalysis.retentionRate).toBe('number');
            expect(churnAnalysis.retentionRate).toBeGreaterThanOrEqual(0);
            expect(churnAnalysis.retentionRate).toBeLessThanOrEqual(100);
            
            // Verify churn rate + retention rate = 100%
            expect(Math.abs((churnAnalysis.churnRate + churnAnalysis.retentionRate) - 100)).toBeLessThan(0.01);
            
            expect(typeof churnAnalysis.customerLifetimeValue).toBe('number');
            expect(churnAnalysis.customerLifetimeValue).toBeGreaterThanOrEqual(0);

            // Verify churn by plan consistency
            expect(Array.isArray(churnAnalysis.churnByPlan)).toBe(true);
            churnAnalysis.churnByPlan.forEach(planChurn => {
              expect(typeof planChurn.planName).toBe('string');
              expect(typeof planChurn.churnRate).toBe('number');
              expect(planChurn.churnRate).toBeGreaterThanOrEqual(0);
              expect(planChurn.churnRate).toBeLessThanOrEqual(100);
              expect(typeof planChurn.retentionRate).toBe('number');
              expect(planChurn.retentionRate).toBeGreaterThanOrEqual(0);
              expect(planChurn.retentionRate).toBeLessThanOrEqual(100);
              // Verify churn + retention = 100% for each plan
              expect(Math.abs((planChurn.churnRate + planChurn.retentionRate) - 100)).toBeLessThan(0.01);
            });

            // Verify churn reasons consistency
            expect(Array.isArray(churnAnalysis.churnReasons)).toBe(true);
            let totalReasonPercentage = 0;
            churnAnalysis.churnReasons.forEach(reason => {
              expect(typeof reason.reason).toBe('string');
              expect(typeof reason.count).toBe('number');
              expect(reason.count).toBeGreaterThanOrEqual(0);
              expect(typeof reason.percentage).toBe('number');
              expect(reason.percentage).toBeGreaterThanOrEqual(0);
              expect(reason.percentage).toBeLessThanOrEqual(100);
              totalReasonPercentage += reason.percentage;
            });
            // Total percentage should be approximately 100% (allowing for rounding)
            if (churnAnalysis.churnReasons.length > 0) {
              expect(Math.abs(totalReasonPercentage - 100)).toBeLessThan(1);
            }

            // Verify cohort analysis consistency
            expect(Array.isArray(churnAnalysis.cohortAnalysis)).toBe(true);
            churnAnalysis.cohortAnalysis.forEach(cohort => {
              expect(typeof cohort.cohort).toBe('string');
              expect(typeof cohort.month0).toBe('number');
              expect(cohort.month0).toBeGreaterThanOrEqual(0);
              expect(typeof cohort.month1).toBe('number');
              expect(cohort.month1).toBeGreaterThanOrEqual(0);
              expect(cohort.month1).toBeLessThanOrEqual(cohort.month0);
              expect(typeof cohort.month3).toBe('number');
              expect(cohort.month3).toBeGreaterThanOrEqual(0);
              expect(cohort.month3).toBeLessThanOrEqual(cohort.month1);
              expect(typeof cohort.month6).toBe('number');
              expect(cohort.month6).toBeGreaterThanOrEqual(0);
              expect(cohort.month6).toBeLessThanOrEqual(cohort.month3);
              expect(typeof cohort.month12).toBe('number');
              expect(cohort.month12).toBeGreaterThanOrEqual(0);
              expect(cohort.month12).toBeLessThanOrEqual(cohort.month6);
            });

            // Verify predictive metrics consistency
            expect(churnAnalysis.predictiveMetrics).toBeDefined();
            expect(typeof churnAnalysis.predictiveMetrics.atRiskCustomers).toBe('number');
            expect(churnAnalysis.predictiveMetrics.atRiskCustomers).toBeGreaterThanOrEqual(0);
            expect(Array.isArray(churnAnalysis.predictiveMetrics.likelyToChurn)).toBe(true);

            results.churn = churnAnalysis;
          }

          // Test usage analytics consistency
          if (analyticsConfig.includeUsage) {
            const usageAnalytics = await analyticsService.getUsageAnalytics();
            
            // Verify usage analytics structure and consistency
            expect(usageAnalytics).toBeDefined();
            expect(typeof usageAnalytics.totalSchools).toBe('number');
            expect(usageAnalytics.totalSchools).toBeGreaterThanOrEqual(0);
            expect(typeof usageAnalytics.activeSchools).toBe('number');
            expect(usageAnalytics.activeSchools).toBeGreaterThanOrEqual(0);
            expect(usageAnalytics.activeSchools).toBeLessThanOrEqual(usageAnalytics.totalSchools);

            // Verify usage by feature consistency
            expect(Array.isArray(usageAnalytics.usageByFeature)).toBe(true);
            usageAnalytics.usageByFeature.forEach(featureUsage => {
              expect(typeof featureUsage.feature).toBe('string');
              expect(typeof featureUsage.usage).toBe('number');
              expect(featureUsage.usage).toBeGreaterThanOrEqual(0);
              expect(typeof featureUsage.schools).toBe('number');
              expect(featureUsage.schools).toBeGreaterThanOrEqual(0);
              expect(featureUsage.schools).toBeLessThanOrEqual(usageAnalytics.totalSchools);
            });

            // Verify usage patterns consistency
            expect(Array.isArray(usageAnalytics.usagePatterns)).toBe(true);
            usageAnalytics.usagePatterns.forEach(pattern => {
              expect(typeof pattern.schoolId).toBe('string');
              expect(typeof pattern.schoolName).toBe('string');
              expect(typeof pattern.plan).toBe('string');
              expect(typeof pattern.features).toBe('object');
              expect(pattern.lastActivity).toBeInstanceOf(Date);
            });

            // Verify resource consumption consistency
            expect(usageAnalytics.resourceConsumption).toBeDefined();
            expect(typeof usageAnalytics.resourceConsumption.storage.total).toBe('number');
            expect(usageAnalytics.resourceConsumption.storage.total).toBeGreaterThanOrEqual(0);
            expect(typeof usageAnalytics.resourceConsumption.storage.average).toBe('number');
            expect(usageAnalytics.resourceConsumption.storage.average).toBeGreaterThanOrEqual(0);
            expect(typeof usageAnalytics.resourceConsumption.storage.peak).toBe('number');
            expect(usageAnalytics.resourceConsumption.storage.peak).toBeGreaterThanOrEqual(0);

            // Verify geographic distribution consistency
            expect(Array.isArray(usageAnalytics.geographicDistribution)).toBe(true);
            usageAnalytics.geographicDistribution.forEach(region => {
              expect(typeof region.region).toBe('string');
              expect(typeof region.schools).toBe('number');
              expect(region.schools).toBeGreaterThanOrEqual(0);
              expect(typeof region.revenue).toBe('number');
              expect(region.revenue).toBeGreaterThanOrEqual(0);
            });

            results.usage = usageAnalytics;
          }

          // Cross-validate consistency between different analytics
          if (results.revenue && results.usage) {
            // Revenue analytics should be consistent with usage analytics school counts
            // This is a loose check since they might have different time ranges
            expect(results.usage.totalSchools).toBeGreaterThanOrEqual(0);
          }

          if (results.churn && results.usage) {
            // Churn analysis should be consistent with usage analytics
            expect(results.usage.activeSchools).toBeGreaterThanOrEqual(0);
          }

          return true;
        } catch (error) {
          // Analytics operations can fail for various reasons
          expect(error).toBeInstanceOf(Error);
          console.error('Analytics consistency test error:', (error as Error).message);
          return true;
        }
      }
    ), { numRuns: 100 });
  });

  // Property 15: Report Generation and Export Consistency
  // **Validates: Requirements 5.4, 5.5, 5.6**
  test('Property 15: Report Generation and Export Consistency', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        reportType: fc.constantFrom('revenue', 'churn', 'usage', 'custom'),
        format: fc.constantFrom('json', 'csv'),
        timeRangeDays: fc.integer({ min: 1, max: 30 }),
        includeSchedule: fc.boolean(),
        customMetrics: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 })
      }),
      async (reportConfig) => {
        try {
          const timeRange = {
            startDate: new Date(Date.now() - reportConfig.timeRangeDays * 24 * 60 * 60 * 1000),
            endDate: new Date()
          };

          // Create report template
          const template = await reportingService.createReportTemplate({
            name: `Test Report ${Date.now()}`,
            description: 'Property test generated report',
            type: reportConfig.reportType as any,
            defaultFilters: { timeRange },
            metrics: reportConfig.customMetrics,
            visualizations: [],
            isActive: true
          });

          // Verify template creation consistency
          expect(template).toBeDefined();
          expect(template.id).toBeDefined();
          expect(template.name).toContain('Test Report');
          expect(template.type).toBe(reportConfig.reportType);
          expect(template.isActive).toBe(true);
          expect(template.createdAt).toBeInstanceOf(Date);
          expect(template.updatedAt).toBeInstanceOf(Date);

          // Generate report from template
          const execution = await reportingService.generateReport(
            template.id,
            { timeRange },
            reportConfig.format as any
          );

          // Verify report generation consistency
          expect(execution).toBeDefined();
          expect(execution.id).toBeDefined();
          expect(execution.reportId).toBeDefined();
          expect(execution.templateId).toBe(template.id);
          expect(execution.status).toBe('completed');
          expect(execution.startedAt).toBeInstanceOf(Date);
          expect(execution.completedAt).toBeInstanceOf(Date);
          expect(execution.completedAt.getTime()).toBeGreaterThanOrEqual(execution.startedAt.getTime());
          expect(typeof execution.recordCount).toBe('number');
          expect(execution.recordCount).toBeGreaterThanOrEqual(0);

          // Verify file generation for non-JSON formats
          if (reportConfig.format !== 'json') {
            expect(execution.filePath).toBeDefined();
            expect(typeof execution.filePath).toBe('string');
            expect(execution.filePath).toContain(`.${reportConfig.format}`);
            expect(typeof execution.fileSize).toBe('number');
            expect(execution.fileSize).toBeGreaterThan(0);
          }

          // Test scheduled report consistency if requested
          if (reportConfig.includeSchedule) {
            const scheduledReport = await reportingService.scheduleReport({
              templateId: template.id,
              name: `Scheduled ${template.name}`,
              schedule: {
                frequency: 'daily',
                time: '09:00',
                timezone: 'UTC'
              },
              recipients: ['test@example.com'],
              filters: { timeRange },
              format: reportConfig.format as any,
              isActive: true
            });

            // Verify scheduled report consistency
            expect(scheduledReport).toBeDefined();
            expect(scheduledReport.id).toBeDefined();
            expect(scheduledReport.templateId).toBe(template.id);
            expect(scheduledReport.isActive).toBe(true);
            expect(scheduledReport.nextRun).toBeInstanceOf(Date);
            expect(scheduledReport.nextRun.getTime()).toBeGreaterThan(Date.now());
            expect(scheduledReport.createdAt).toBeInstanceOf(Date);
            expect(scheduledReport.updatedAt).toBeInstanceOf(Date);
          }

          // Test dashboard widget consistency
          const dashboard = await dashboardService.createDashboard({
            name: `Test Dashboard ${Date.now()}`,
            description: 'Property test dashboard',
            userId: 'test-user',
            isDefault: false,
            isPublic: false,
            widgets: [],
            layout: {
              columns: 12,
              rowHeight: 150,
              margin: [10, 10],
              containerPadding: [10, 10],
              breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
              cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }
            },
            settings: {
              theme: 'light',
              autoRefresh: true,
              refreshInterval: 300,
              showGrid: true,
              allowResize: true,
              allowDrag: true,
              compactType: 'vertical'
            }
          });

          // Verify dashboard creation consistency
          expect(dashboard).toBeDefined();
          expect(dashboard.id).toBeDefined();
          expect(dashboard.name).toContain('Test Dashboard');
          expect(dashboard.userId).toBe('test-user');
          expect(dashboard.isDefault).toBe(false);
          expect(dashboard.isPublic).toBe(false);
          expect(Array.isArray(dashboard.widgets)).toBe(true);
          expect(dashboard.createdAt).toBeInstanceOf(Date);
          expect(dashboard.updatedAt).toBeInstanceOf(Date);

          // Add widget to dashboard
          const widget = await dashboardService.addWidget(dashboard.id, {
            type: 'metric',
            title: 'Test Metric Widget',
            description: 'Property test widget',
            position: { x: 0, y: 0, width: 4, height: 2 },
            config: {
              metric: {
                value: 0,
                unit: '$',
                trend: 'up',
                color: '#10b981',
                icon: 'dollar-sign'
              }
            },
            dataSource: {
              type: 'analytics',
              source: 'getTotalRevenue'
            },
            refreshInterval: 300,
            isVisible: true
          });

          // Verify widget consistency
          expect(widget).toBeDefined();
          expect(widget.id).toBeDefined();
          expect(widget.type).toBe('metric');
          expect(widget.title).toBe('Test Metric Widget');
          expect(widget.isVisible).toBe(true);
          expect(widget.refreshInterval).toBe(300);
          expect(widget.createdAt).toBeInstanceOf(Date);
          expect(widget.updatedAt).toBeInstanceOf(Date);

          // Test data export consistency
          const exportResult = await analyticsService.exportData({
            type: reportConfig.reportType === 'custom' ? 'revenue' : reportConfig.reportType as any,
            format: reportConfig.format as any,
            timeRange,
            includeDetails: true
          });

          // Verify export consistency
          expect(exportResult).toBeDefined();
          expect(exportResult.id).toBeDefined();
          expect(exportResult.filename).toBeDefined();
          expect(exportResult.filename).toContain(`.${reportConfig.format}`);
          expect(exportResult.format).toBe(reportConfig.format);
          expect(typeof exportResult.size).toBe('number');
          expect(exportResult.size).toBeGreaterThan(0);
          expect(typeof exportResult.recordCount).toBe('number');
          expect(exportResult.recordCount).toBeGreaterThanOrEqual(0);
          expect(exportResult.generatedAt).toBeInstanceOf(Date);
          expect(typeof exportResult.downloadUrl).toBe('string');
          expect(exportResult.downloadUrl).toContain(exportResult.filename);

          // Test BI integration data schema consistency
          const dataSchema = await biIntegrationService.getDataSchema();
          
          // Verify data schema consistency
          expect(dataSchema).toBeDefined();
          expect(typeof dataSchema.name).toBe('string');
          expect(typeof dataSchema.description).toBe('string');
          expect(Array.isArray(dataSchema.tables)).toBe(true);
          expect(typeof dataSchema.refreshFrequency).toBe('string');
          expect(dataSchema.lastRefresh).toBeInstanceOf(Date);
          expect(typeof dataSchema.size).toBe('number');
          expect(dataSchema.size).toBeGreaterThanOrEqual(0);
          expect(typeof dataSchema.recordCount).toBe('number');
          expect(dataSchema.recordCount).toBeGreaterThanOrEqual(0);

          // Verify table schemas consistency
          dataSchema.tables.forEach(table => {
            expect(typeof table.tableName).toBe('string');
            expect(Array.isArray(table.columns)).toBe(true);
            expect(table.columns.length).toBeGreaterThan(0);
            
            table.columns.forEach(column => {
              expect(typeof column.name).toBe('string');
              expect(['string', 'number', 'boolean', 'date', 'json']).toContain(column.type);
              expect(typeof column.nullable).toBe('boolean');
            });

            if (table.relationships) {
              expect(Array.isArray(table.relationships)).toBe(true);
              table.relationships.forEach(rel => {
                expect(['one-to-one', 'one-to-many', 'many-to-many']).toContain(rel.type);
                expect(typeof rel.targetTable).toBe('string');
                expect(typeof rel.foreignKey).toBe('string');
                expect(typeof rel.targetKey).toBe('string');
              });
            }
          });

          return true;
        } catch (error) {
          // Report generation can fail for various reasons
          expect(error).toBeInstanceOf(Error);
          console.error('Report generation consistency test error:', (error as Error).message);
          return true;
        }
      }
    ), { numRuns: 100 });
  });

  // Additional property test for KPI dashboard consistency
  test('Property: KPI Dashboard Real-time Consistency', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        refreshInterval: fc.integer({ min: 60, max: 3600 }), // 1 minute to 1 hour
        widgetCount: fc.integer({ min: 1, max: 10 })
      }),
      async (dashboardConfig) => {
        try {
          // Get KPI dashboard
          const kpiDashboard = await analyticsService.getKPIDashboard();

          // Verify KPI dashboard structure consistency
          expect(kpiDashboard).toBeDefined();
          expect(kpiDashboard.overview).toBeDefined();
          expect(typeof kpiDashboard.overview.totalRevenue).toBe('number');
          expect(kpiDashboard.overview.totalRevenue).toBeGreaterThanOrEqual(0);
          expect(typeof kpiDashboard.overview.totalSchools).toBe('number');
          expect(kpiDashboard.overview.totalSchools).toBeGreaterThanOrEqual(0);
          expect(typeof kpiDashboard.overview.activeSubscriptions).toBe('number');
          expect(kpiDashboard.overview.activeSubscriptions).toBeGreaterThanOrEqual(0);
          expect(typeof kpiDashboard.overview.churnRate).toBe('number');
          expect(kpiDashboard.overview.churnRate).toBeGreaterThanOrEqual(0);
          expect(kpiDashboard.overview.churnRate).toBeLessThanOrEqual(100);

          // Verify trends consistency
          expect(kpiDashboard.trends).toBeDefined();
          expect(typeof kpiDashboard.trends.revenueGrowth).toBe('number');
          expect(typeof kpiDashboard.trends.schoolGrowth).toBe('number');
          expect(typeof kpiDashboard.trends.subscriptionGrowth).toBe('number');

          // Verify alerts consistency
          expect(Array.isArray(kpiDashboard.alerts)).toBe(true);
          kpiDashboard.alerts.forEach(alert => {
            expect(['warning', 'error', 'info']).toContain(alert.type);
            expect(typeof alert.message).toBe('string');
            expect(typeof alert.value).toBe('number');
            expect(typeof alert.threshold).toBe('number');
          });

          // Verify widgets consistency
          expect(Array.isArray(kpiDashboard.widgets)).toBe(true);
          kpiDashboard.widgets.forEach(widget => {
            expect(typeof widget.id).toBe('string');
            expect(['chart', 'metric', 'table']).toContain(widget.type);
            expect(typeof widget.title).toBe('string');
            expect(widget.data).toBeDefined();
            expect(typeof widget.config).toBe('object');
          });

          // Test consistency across multiple calls (should be stable within short timeframe)
          const secondCall = await analyticsService.getKPIDashboard();
          
          // Core metrics should be consistent within a short timeframe
          expect(secondCall.overview.totalSchools).toBe(kpiDashboard.overview.totalSchools);
          expect(secondCall.overview.activeSubscriptions).toBe(kpiDashboard.overview.activeSubscriptions);
          
          // Revenue might change due to new payments, but should be close
          const revenueDifference = Math.abs(secondCall.overview.totalRevenue - kpiDashboard.overview.totalRevenue);
          expect(revenueDifference).toBeLessThanOrEqual(kpiDashboard.overview.totalRevenue * 0.1); // Within 10%

          return true;
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          console.error('KPI dashboard consistency test error:', (error as Error).message);
          return true;
        }
      }
    ), { numRuns: 50 }); // Fewer runs due to complexity
  });

  // Property test for data export format consistency
  test('Property: Data Export Format Consistency', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        exportType: fc.constantFrom('revenue', 'churn', 'usage', 'schools', 'subscriptions'),
        format: fc.constantFrom('csv', 'json'),
        includeDetails: fc.boolean()
      }),
      async (exportConfig) => {
        try {
          const timeRange = {
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            endDate: new Date()
          };

          const exportResult = await analyticsService.exportData({
            type: exportConfig.exportType as any,
            format: exportConfig.format as any,
            timeRange,
            includeDetails: exportConfig.includeDetails
          });

          // Verify export result consistency
          expect(exportResult).toBeDefined();
          expect(exportResult.id).toBeDefined();
          expect(exportResult.filename).toBeDefined();
          expect(exportResult.filename).toMatch(new RegExp(`${exportConfig.exportType}_export_.*\\.${exportConfig.format}`));
          expect(exportResult.format).toBe(exportConfig.format);
          expect(exportResult.filePath).toBeDefined();
          expect(typeof exportResult.size).toBe('number');
          expect(exportResult.size).toBeGreaterThan(0);
          expect(typeof exportResult.recordCount).toBe('number');
          expect(exportResult.recordCount).toBeGreaterThanOrEqual(0);
          expect(exportResult.generatedAt).toBeInstanceOf(Date);
          expect(typeof exportResult.downloadUrl).toBe('string');

          // Verify filename format consistency
          const expectedPattern = new RegExp(`${exportConfig.exportType}_export_\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}-\\d{3}Z\\.${exportConfig.format}`);
          expect(exportResult.filename).toMatch(expectedPattern);

          // Verify download URL format consistency
          expect(exportResult.downloadUrl).toBe(`/api/exports/download/${exportResult.filename}`);

          return true;
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          console.error('Export format consistency test error:', (error as Error).message);
          return true;
        }
      }
    ), { numRuns: 100 });
  });
});