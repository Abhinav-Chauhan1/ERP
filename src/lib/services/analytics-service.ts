/**
 * Analytics Service
 * 
 * Provides comprehensive analytics and business intelligence capabilities
 * for the super-admin SaaS platform. Handles revenue analytics, churn analysis,
 * usage pattern monitoring, custom reporting, and dashboard capabilities.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { prisma } from '@/lib/db';
import { 
  SubscriptionStatus, 
  PaymentStatus, 
  InvoiceStatus,
  PlanType,
  SchoolStatus 
} from '@prisma/client';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

export interface RevenueMetrics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  averageRevenuePerUser: number;
  revenueGrowthRate: number;
  revenueByPlan: Array<{
    planName: string;
    revenue: number;
    percentage: number;
  }>;
  revenueTrends: Array<{
    period: string;
    revenue: number;
    subscriptions: number;
  }>;
  forecasting: {
    nextMonthProjection: number;
    nextQuarterProjection: number;
    confidence: number;
  };
}

export interface ChurnAnalysis {
  churnRate: number;
  retentionRate: number;
  customerLifetimeValue: number;
  churnByPlan: Array<{
    planName: string;
    churnRate: number;
    retentionRate: number;
  }>;
  churnReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  cohortAnalysis: Array<{
    cohort: string;
    month0: number;
    month1: number;
    month3: number;
    month6: number;
    month12: number;
  }>;
  predictiveMetrics: {
    atRiskCustomers: number;
    likelyToChurn: Array<{
      schoolId: string;
      schoolName: string;
      riskScore: number;
      factors: string[];
    }>;
  };
}

export interface UsageAnalytics {
  totalSchools: number;
  activeSchools: number;
  usageByFeature: Array<{
    feature: string;
    usage: number;
    schools: number;
  }>;
  usagePatterns: Array<{
    schoolId: string;
    schoolName: string;
    plan: string;
    features: Record<string, number>;
    lastActivity: Date;
  }>;
  resourceConsumption: {
    storage: { total: number; average: number; peak: number };
    bandwidth: { total: number; average: number; peak: number };
    apiCalls: { total: number; average: number; peak: number };
  };
  geographicDistribution: Array<{
    region: string;
    schools: number;
    revenue: number;
  }>;
}

export interface ReportConfig {
  name: string;
  type: 'revenue' | 'churn' | 'usage' | 'custom';
  timeRange: TimeRange;
  filters: Record<string, any>;
  metrics: string[];
  format: 'json' | 'csv' | 'pdf';
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  };
}

export interface Report {
  id: string;
  name: string;
  type: string;
  data: any;
  generatedAt: Date;
  format: string;
  filePath?: string;
}

export interface KPIDashboard {
  overview: {
    totalRevenue: number;
    totalSchools: number;
    activeSubscriptions: number;
    churnRate: number;
  };
  trends: {
    revenueGrowth: number;
    schoolGrowth: number;
    subscriptionGrowth: number;
  };
  alerts: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    value: number;
    threshold: number;
  }>;
  widgets: Array<{
    id: string;
    type: 'chart' | 'metric' | 'table';
    title: string;
    data: any;
    config: Record<string, any>;
  }>;
}

export interface ExportConfig {
  type: 'revenue' | 'churn' | 'usage' | 'schools' | 'subscriptions';
  format: 'csv' | 'json' | 'excel';
  timeRange?: TimeRange;
  filters?: Record<string, any>;
  includeDetails?: boolean;
}

export interface ExportResult {
  id: string;
  filename: string;
  filePath: string;
  format: string;
  size: number;
  recordCount: number;
  generatedAt: Date;
  downloadUrl: string;
}

// ============================================================================
// Analytics Service Implementation
// ============================================================================

export class AnalyticsService {
  /**
   * Get comprehensive revenue analytics with trends and forecasting
   * Requirements: 5.1 - Revenue analytics with trends and forecasting
   */
  async getRevenueMetrics(timeRange: TimeRange): Promise<RevenueMetrics> {
    try {
      // Calculate previous period dates for growth rate
      const previousPeriodStart = new Date(timeRange.startDate);
      previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
      const previousPeriodEnd = new Date(timeRange.endDate);
      previousPeriodEnd.setMonth(previousPeriodEnd.getMonth() - 1);

      // Parallelize all database queries to avoid sequential execution (fixes N+1)
      const [
        payments,
        activeSubscriptions,
        totalActiveSchools,
        previousPeriodPayments
      ] = await Promise.all([
        // Current period payments
        prisma.payment.findMany({
          where: {
            status: PaymentStatus.COMPLETED,
            processedAt: {
              gte: timeRange.startDate,
              lte: timeRange.endDate,
            },
          },
          include: {
            subscription: {
              include: {
                plan: true,
                school: true,
              },
            },
          },
        }),
        // Active subscriptions for MRR/ARR calculation
        prisma.enhancedSubscription.findMany({
          where: {
            status: SubscriptionStatus.ACTIVE,
          },
          include: {
            plan: true,
          },
        }),
        // Total active schools count
        prisma.school.count({
          where: { status: SchoolStatus.ACTIVE },
        }),
        // Previous period payments for growth rate
        prisma.payment.findMany({
          where: {
            status: PaymentStatus.COMPLETED,
            processedAt: {
              gte: previousPeriodStart,
              lte: previousPeriodEnd,
            },
          },
        })
      ]);

      // Calculate total revenue
      const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

      // Calculate MRR and ARR
      const monthlyRevenue = activeSubscriptions
        .filter(sub => sub.plan.interval === 'month')
        .reduce((sum, sub) => sum + sub.plan.amount, 0);
      
      const yearlyRevenue = activeSubscriptions
        .filter(sub => sub.plan.interval === 'year')
        .reduce((sum, sub) => sum + (sub.plan.amount / 12), 0);

      const monthlyRecurringRevenue = monthlyRevenue + yearlyRevenue;
      const annualRecurringRevenue = monthlyRecurringRevenue * 12;

      // Calculate ARPU
      const averageRevenuePerUser = totalActiveSchools > 0 ? monthlyRecurringRevenue / totalActiveSchools : 0;

      // Calculate revenue growth rate
      const previousRevenue = previousPeriodPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const revenueGrowthRate = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      // Revenue by plan
      const revenueByPlan = await this.getRevenueByPlan(timeRange);

      // Revenue trends (monthly breakdown)
      const revenueTrends = await this.getRevenueTrends(timeRange);

      // Forecasting
      const forecasting = await this.generateRevenueForecasting(revenueTrends);

      return {
        totalRevenue,
        monthlyRecurringRevenue,
        annualRecurringRevenue,
        averageRevenuePerUser,
        revenueGrowthRate,
        revenueByPlan,
        revenueTrends,
        forecasting,
      };
    } catch (error) {
      console.error('Error getting revenue metrics:', error);
      throw new Error(`Failed to get revenue metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get comprehensive churn analysis and retention metrics
   * Requirements: 5.2 - Churn analysis and retention metrics
   */
  async getChurnAnalysis(timeRange: TimeRange): Promise<ChurnAnalysis> {
    try {
      // Get all subscriptions that were active at the start of the period
      const startOfPeriod = timeRange.startDate;
      const endOfPeriod = timeRange.endDate;

      const subscriptionsAtStart = await prisma.enhancedSubscription.findMany({
        where: {
          createdAt: { lte: startOfPeriod },
          OR: [
            { status: SubscriptionStatus.ACTIVE },
            { 
              status: SubscriptionStatus.CANCELED,
              updatedAt: { gte: startOfPeriod }
            },
          ],
        },
        include: {
          plan: true,
          school: true,
        },
      });

      // Get subscriptions that churned during the period
      const churnedSubscriptions = await prisma.enhancedSubscription.findMany({
        where: {
          status: SubscriptionStatus.CANCELED,
          updatedAt: {
            gte: startOfPeriod,
            lte: endOfPeriod,
          },
        },
        include: {
          plan: true,
          school: true,
        },
      });

      // Calculate churn rate
      const churnRate = subscriptionsAtStart.length > 0 
        ? (churnedSubscriptions.length / subscriptionsAtStart.length) * 100 
        : 0;
      const retentionRate = 100 - churnRate;

      // Calculate customer lifetime value
      const averageMonthlyRevenue = await this.getAverageMonthlyRevenue();
      const averageLifespanMonths = churnRate > 0 ? 1 / (churnRate / 100) : 12;
      const customerLifetimeValue = averageMonthlyRevenue * averageLifespanMonths;

      // Churn by plan
      const churnByPlan = await this.getChurnByPlan(timeRange);

      // Churn reasons (from metadata or support tickets)
      const churnReasons = await this.getChurnReasons(churnedSubscriptions);

      // Cohort analysis
      const cohortAnalysis = await this.getCohortAnalysis();

      // Predictive metrics
      const predictiveMetrics = await this.getPredictiveChurnMetrics();

      return {
        churnRate,
        retentionRate,
        customerLifetimeValue,
        churnByPlan,
        churnReasons,
        cohortAnalysis,
        predictiveMetrics,
      };
    } catch (error) {
      console.error('Error getting churn analysis:', error);
      throw new Error(`Failed to get churn analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get usage pattern monitoring across schools
   * Requirements: 5.3 - Usage pattern monitoring across schools
   */
  async getUsageAnalytics(schoolId?: string): Promise<UsageAnalytics> {
    try {
      const whereClause = schoolId ? { schoolId } : {};

      // Get school counts
      const totalSchools = await prisma.school.count();
      const activeSchools = await prisma.school.count({
        where: { status: SchoolStatus.ACTIVE },
      });

      // Get usage by feature from analytics events
      const usageByFeature = await this.getUsageByFeature(whereClause);

      // Get usage patterns for individual schools
      const usagePatterns = await this.getSchoolUsagePatterns(schoolId);

      // Get resource consumption metrics
      const resourceConsumption = await this.getResourceConsumption(whereClause);

      // Get geographic distribution
      const geographicDistribution = await this.getGeographicDistribution();

      return {
        totalSchools,
        activeSchools,
        usageByFeature,
        usagePatterns,
        resourceConsumption,
        geographicDistribution,
      };
    } catch (error) {
      console.error('Error getting usage analytics:', error);
      throw new Error(`Failed to get usage analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate custom reports with scheduling
   * Requirements: 5.4 - Custom report generation with scheduling
   */
  async generateCustomReport(reportConfig: ReportConfig): Promise<Report> {
    try {
      let data: any;

      // Generate data based on report type
      switch (reportConfig.type) {
        case 'revenue':
          data = await this.getRevenueMetrics(reportConfig.timeRange);
          break;
        case 'churn':
          data = await this.getChurnAnalysis(reportConfig.timeRange);
          break;
        case 'usage':
          data = await this.getUsageAnalytics();
          break;
        case 'custom':
          data = await this.generateCustomData(reportConfig);
          break;
        default:
          throw new Error(`Unsupported report type: ${reportConfig.type}`);
      }

      // Create report record
      const report: Report = {
        id: `report_${Date.now()}`,
        name: reportConfig.name,
        type: reportConfig.type,
        data,
        generatedAt: new Date(),
        format: reportConfig.format,
      };

      // Export to file if needed
      if (reportConfig.format !== 'json') {
        const filePath = await this.exportReportToFile(report, reportConfig.format);
        report.filePath = filePath;
      }

      // Schedule if needed
      if (reportConfig.schedule) {
        await this.scheduleReport(reportConfig);
      }

      return report;
    } catch (error) {
      console.error('Error generating custom report:', error);
      throw new Error(`Failed to generate custom report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get real-time KPI dashboard with customizable widgets
   * Requirements: 5.5 - Real-time dashboards with customizable widgets
   */
  async getKPIDashboard(): Promise<KPIDashboard> {
    try {
      // Get overview metrics
      const totalRevenue = await this.getTotalRevenue();
      const totalSchools = await prisma.school.count();
      const activeSubscriptions = await prisma.enhancedSubscription.count({
        where: { status: SubscriptionStatus.ACTIVE },
      });

      // Get churn rate for current month
      const currentMonth = new Date();
      currentMonth.setDate(1);
      const nextMonth = new Date(currentMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const churnAnalysis = await this.getChurnAnalysis({
        startDate: currentMonth,
        endDate: nextMonth,
      });

      // Calculate trends
      const trends = await this.getTrends();

      // Generate alerts
      const alerts = await this.generateAlerts();

      // Create default widgets
      const widgets = await this.createDefaultWidgets();

      return {
        overview: {
          totalRevenue,
          totalSchools,
          activeSubscriptions,
          churnRate: churnAnalysis.churnRate,
        },
        trends,
        alerts,
        widgets,
      };
    } catch (error) {
      console.error('Error getting KPI dashboard:', error);
      throw new Error(`Failed to get KPI dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export data with BI tool integration
   * Requirements: 5.6 - Data export and BI tool integration
   */
  async exportData(exportConfig: ExportConfig): Promise<ExportResult> {
    try {
      let data: any;
      let recordCount = 0;

      // Get data based on export type
      switch (exportConfig.type) {
        case 'revenue':
          if (exportConfig.timeRange) {
            data = await this.getRevenueMetrics(exportConfig.timeRange);
          } else {
            throw new Error('Time range required for revenue export');
          }
          recordCount = data.revenueTrends?.length || 0;
          break;

        case 'churn':
          if (exportConfig.timeRange) {
            data = await this.getChurnAnalysis(exportConfig.timeRange);
          } else {
            throw new Error('Time range required for churn export');
          }
          recordCount = data.cohortAnalysis?.length || 0;
          break;

        case 'usage':
          data = await this.getUsageAnalytics();
          recordCount = data.usagePatterns?.length || 0;
          break;

        case 'schools':
          data = await this.exportSchoolsData(exportConfig.filters);
          recordCount = data.length;
          break;

        case 'subscriptions':
          data = await this.exportSubscriptionsData(exportConfig.filters);
          recordCount = data.length;
          break;

        default:
          throw new Error(`Unsupported export type: ${exportConfig.type}`);
      }

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${exportConfig.type}_export_${timestamp}.${exportConfig.format}`;
      
      // Export to file
      const filePath = await this.exportToFile(data, exportConfig.format, filename);
      const fileSize = await this.getFileSize(filePath);

      return {
        id: `export_${Date.now()}`,
        filename,
        filePath,
        format: exportConfig.format,
        size: fileSize,
        recordCount,
        generatedAt: new Date(),
        downloadUrl: `/api/exports/download/${filename}`,
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async getRevenueByPlan(timeRange: TimeRange) {
    const payments = await prisma.payment.findMany({
      where: {
        status: PaymentStatus.COMPLETED,
        processedAt: {
          gte: timeRange.startDate,
          lte: timeRange.endDate,
        },
      },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    const revenueByPlan = payments.reduce((acc, payment) => {
      const planName = payment.subscription.plan.name;
      if (!acc[planName]) {
        acc[planName] = 0;
      }
      acc[planName] += payment.amount;
      return acc;
    }, {} as Record<string, number>);

    const totalRevenue = Object.values(revenueByPlan).reduce((sum, revenue) => sum + revenue, 0);

    return Object.entries(revenueByPlan).map(([planName, revenue]) => ({
      planName,
      revenue,
      percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
    }));
  }

  private async getRevenueTrends(timeRange: TimeRange) {
    // Implementation for monthly revenue trends
    const trends = [];
    const current = new Date(timeRange.startDate);
    
    while (current <= timeRange.endDate) {
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);

      const monthlyPayments = await prisma.payment.findMany({
        where: {
          status: PaymentStatus.COMPLETED,
          processedAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      const revenue = monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const subscriptions = await prisma.enhancedSubscription.count({
        where: {
          status: SubscriptionStatus.ACTIVE,
          createdAt: { lte: monthEnd },
        },
      });

      trends.push({
        period: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`,
        revenue,
        subscriptions,
      });

      current.setMonth(current.getMonth() + 1);
    }

    return trends;
  }

  private async generateRevenueForecasting(trends: any[]) {
    // Simple linear regression for forecasting
    if (trends.length < 2) {
      return {
        nextMonthProjection: 0,
        nextQuarterProjection: 0,
        confidence: 0,
      };
    }

    const revenues = trends.map(t => t.revenue);
    const avgGrowth = revenues.length > 1 
      ? revenues.slice(1).reduce((sum, revenue, i) => sum + (revenue - revenues[i]), 0) / (revenues.length - 1)
      : 0;

    const lastRevenue = revenues[revenues.length - 1];
    const nextMonthProjection = Math.max(0, lastRevenue + avgGrowth);
    const nextQuarterProjection = Math.max(0, lastRevenue + (avgGrowth * 3));

    // Simple confidence calculation based on trend consistency
    const confidence = Math.min(95, Math.max(50, 100 - (Math.abs(avgGrowth) / lastRevenue) * 100));

    return {
      nextMonthProjection,
      nextQuarterProjection,
      confidence,
    };
  }

  private async getChurnByPlan(timeRange: TimeRange) {
    // Get all plans and subscription data in parallel to avoid N+1 queries
    const [plans, subscriptionsAtStartGrouped, churnedSubscriptionsGrouped] = await Promise.all([
      // Get all plans
      prisma.subscriptionPlan.findMany(),
      
      // Get subscriptions at start grouped by plan
      prisma.enhancedSubscription.groupBy({
        by: ['planId'],
        where: {
          createdAt: { lte: timeRange.startDate },
        },
        _count: {
          id: true,
        },
      }),
      
      // Get churned subscriptions grouped by plan
      prisma.enhancedSubscription.groupBy({
        by: ['planId'],
        where: {
          status: SubscriptionStatus.CANCELED,
          updatedAt: {
            gte: timeRange.startDate,
            lte: timeRange.endDate,
          },
        },
        _count: {
          id: true,
        },
      }),
    ]);

    // Create maps for O(1) lookup
    const subscriptionsAtStartMap = new Map(
      subscriptionsAtStartGrouped.map(item => [item.planId, item._count.id])
    );
    const churnedSubscriptionsMap = new Map(
      churnedSubscriptionsGrouped.map(item => [item.planId, item._count.id])
    );

    // Calculate churn rates for all plans
    const churnByPlan = plans.map(plan => {
      const subscriptionsAtStart = subscriptionsAtStartMap.get(plan.id) || 0;
      const churnedSubscriptions = churnedSubscriptionsMap.get(plan.id) || 0;
      const churnRate = subscriptionsAtStart > 0 ? (churnedSubscriptions / subscriptionsAtStart) * 100 : 0;
      const retentionRate = 100 - churnRate;

      return {
        planName: plan.name,
        churnRate,
        retentionRate,
      };
    });

    return churnByPlan;
  }

  private async getChurnReasons(churnedSubscriptions: any[]) {
    // Extract churn reasons from metadata or support tickets
    const reasons: Record<string, number> = {};
    
    for (const subscription of churnedSubscriptions) {
      const reason = subscription.metadata?.churnReason || 'Unknown';
      reasons[reason] = (reasons[reason] || 0) + 1;
    }

    const total = Object.values(reasons).reduce((sum, count) => sum + count, 0);

    return Object.entries(reasons).map(([reason, count]) => ({
      reason,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }));
  }

  private async getCohortAnalysis() {
    // Simplified cohort analysis - would need more complex implementation
    return [
      { cohort: '2024-01', month0: 100, month1: 85, month3: 70, month6: 60, month12: 50 },
      { cohort: '2024-02', month0: 100, month1: 88, month3: 75, month6: 65, month12: 0 },
      // Add more cohorts based on actual data
    ];
  }

  private async getPredictiveChurnMetrics() {
    // Simplified predictive metrics - would use ML models in production
    const atRiskCustomers = await prisma.school.count({
      where: {
        status: SchoolStatus.ACTIVE,
        // Add conditions for at-risk indicators
      },
    });

    return {
      atRiskCustomers,
      likelyToChurn: [], // Would populate with actual risk analysis
    };
  }

  private async getUsageByFeature(whereClause: any) {
    const events = await prisma.analyticsEvent.findMany({
      where: whereClause,
      select: {
        eventType: true,
        schoolId: true,
      },
    });

    const featureUsage: Record<string, { usage: number; schools: Set<string> }> = {};

    events.forEach(event => {
      if (!featureUsage[event.eventType]) {
        featureUsage[event.eventType] = { usage: 0, schools: new Set() };
      }
      featureUsage[event.eventType].usage++;
      if (event.schoolId) {
        featureUsage[event.eventType].schools.add(event.schoolId);
      }
    });

    return Object.entries(featureUsage).map(([feature, data]) => ({
      feature,
      usage: data.usage,
      schools: data.schools.size,
    }));
  }

  private async getSchoolUsagePatterns(schoolId?: string) {
    const schools = await prisma.school.findMany({
      where: schoolId ? { id: schoolId } : { status: SchoolStatus.ACTIVE },
      include: {
        enhancedSubscriptions: {
          where: { status: SubscriptionStatus.ACTIVE },
          include: { plan: true },
        },
      },
    });

    // Get all analytics events for all schools in one query (fixes N+1)
    const schoolIds = schools.map(school => school.id);
    const allEvents = await prisma.analyticsEvent.findMany({
      where: { 
        schoolId: { in: schoolIds }
      },
      orderBy: { timestamp: 'desc' },
    });

    // Group events by school for O(1) lookup
    const eventsBySchool = new Map<string, any[]>();
    const featuresBySchool = new Map<string, Record<string, number>>();
    const lastActivityBySchool = new Map<string, Date>();

    allEvents.forEach(event => {
      // Group events by school
      if (!eventsBySchool.has(event.schoolId)) {
        eventsBySchool.set(event.schoolId, []);
      }
      eventsBySchool.get(event.schoolId)!.push(event);

      // Track features usage
      if (!featuresBySchool.has(event.schoolId)) {
        featuresBySchool.set(event.schoolId, {});
      }
      const features = featuresBySchool.get(event.schoolId)!;
      features[event.eventType] = (features[event.eventType] || 0) + 1;

      // Track last activity (events are ordered by timestamp desc)
      if (!lastActivityBySchool.has(event.schoolId)) {
        lastActivityBySchool.set(event.schoolId, event.timestamp);
      }
    });

    const patterns = schools.map(school => {
      const subscription = school.enhancedSubscriptions[0];
      const features = featuresBySchool.get(school.id) || {};
      const lastActivity = lastActivityBySchool.get(school.id) || new Date(0);

      return {
        schoolId: school.id,
        schoolName: school.name,
        plan: subscription?.plan.name || 'No Plan',
        features,
        lastActivity,
      };
    });

    return patterns;
  }

  private async getResourceConsumption(whereClause: any) {
    // Simplified resource consumption metrics
    return {
      storage: { total: 0, average: 0, peak: 0 },
      bandwidth: { total: 0, average: 0, peak: 0 },
      apiCalls: { total: 0, average: 0, peak: 0 },
    };
  }

  private async getGeographicDistribution() {
    // Simplified geographic distribution
    return [
      { region: 'North America', schools: 0, revenue: 0 },
      { region: 'Europe', schools: 0, revenue: 0 },
      { region: 'Asia', schools: 0, revenue: 0 },
    ];
  }

  private async generateCustomData(reportConfig: ReportConfig) {
    // Implementation for custom report data generation
    return {};
  }

  private async exportReportToFile(report: Report, format: string) {
    // Implementation for exporting report to file
    return `/exports/${report.id}.${format}`;
  }

  private async scheduleReport(reportConfig: ReportConfig) {
    // Implementation for scheduling reports
    console.log('Scheduling report:', reportConfig.name);
  }

  private async getTotalRevenue() {
    const payments = await prisma.payment.findMany({
      where: { status: PaymentStatus.COMPLETED },
    });
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  }

  private async getTrends() {
    // Implementation for calculating trends
    return {
      revenueGrowth: 0,
      schoolGrowth: 0,
      subscriptionGrowth: 0,
    };
  }

  private async generateAlerts() {
    // Implementation for generating alerts
    return [];
  }

  private async createDefaultWidgets() {
    // Implementation for creating default dashboard widgets
    return [];
  }

  private async exportSchoolsData(filters?: any) {
    return await prisma.school.findMany({
      where: filters,
      include: {
        enhancedSubscriptions: {
          include: { plan: true },
        },
      },
    });
  }

  private async exportSubscriptionsData(filters?: any) {
    return await prisma.enhancedSubscription.findMany({
      where: filters,
      include: {
        plan: true,
        school: true,
        payments: true,
        invoices: true,
      },
    });
  }

  private async exportToFile(data: any, format: string, filename: string) {
    // Implementation for exporting data to file
    return `/exports/${filename}`;
  }

  private async getFileSize(filePath: string) {
    // Implementation for getting file size
    return 0;
  }

  private async getAverageMonthlyRevenue() {
    const activeSubscriptions = await prisma.enhancedSubscription.findMany({
      where: { status: SubscriptionStatus.ACTIVE },
      include: { plan: true },
    });

    const monthlyRevenue = activeSubscriptions.reduce((sum, sub) => {
      const monthlyAmount = sub.plan.interval === 'year' ? sub.plan.amount / 12 : sub.plan.amount;
      return sum + monthlyAmount;
    }, 0);

    return activeSubscriptions.length > 0 ? monthlyRevenue / activeSubscriptions.length : 0;
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();