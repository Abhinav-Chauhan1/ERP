import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getRevenue } from '@/app/api/super-admin/analytics/revenue/route';
import { GET as getChurn } from '@/app/api/super-admin/analytics/churn/route';
import { GET as getUsage } from '@/app/api/super-admin/analytics/usage/route';
import { GET as getDashboard } from '@/app/api/super-admin/analytics/dashboard/route';
import { POST as generateReport } from '@/app/api/super-admin/analytics/reports/route';
import { POST as exportData } from '@/app/api/super-admin/analytics/export/route';
import { getServerSession } from 'next-auth';

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/middleware/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/services/audit-service', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

const mockAnalyticsService = {
  getRevenueMetrics: vi.fn(),
  getChurnAnalysis: vi.fn(),
  getUsageAnalytics: vi.fn(),
  getKPIDashboard: vi.fn(),
  generateCustomReport: vi.fn(),
  exportData: vi.fn(),
};

vi.mock('@/lib/services/analytics-service', () => ({
  analyticsService: mockAnalyticsService,
}));

describe('Super Admin Analytics API Integration Tests', () => {
  const mockSuperAdminSession = {
    user: {
      id: 'super-admin-1',
      email: 'superadmin@test.com',
      role: 'SUPER_ADMIN',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/super-admin/analytics/revenue', () => {
    it('should return revenue metrics with valid time range', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSuperAdminSession);
      const mockRevenueMetrics = {
        totalRevenue: 100000,
        monthlyRecurringRevenue: 10000,
        annualRecurringRevenue: 120000,
        averageRevenuePerUser: 500,
        revenueGrowthRate: 15.5,
        revenueByPlan: [
          { planName: 'Basic', revenue: 30000, percentage: 30 },
          { planName: 'Premium', revenue: 70000, percentage: 70 },
        ],
        revenueTrends: [
          { period: '2024-01', revenue: 8000, subscriptions: 16 },
          { period: '2024-02', revenue: 10000, subscriptions: 20 },
        ],
        forecasting: {
          nextMonthProjection: 11000,
          nextQuarterProjection: 33000,
          confidence: 85,
        },
      };
      mockAnalyticsService.getRevenueMetrics.mockResolvedValue(mockRevenueMetrics);

      const request = new NextRequest(
        'http://localhost:3000/api/super-admin/analytics/revenue?startDate=2024-01-01&endDate=2024-02-29'
      );

      // Act
      const response = await getRevenue(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockRevenueMetrics);
      expect(mockAnalyticsService.getRevenueMetrics).toHaveBeenCalledWith({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-02-29'),
      });
    });

    it('should return 400 when time range is missing', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSuperAdminSession);

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/revenue');

      // Act
      const response = await getRevenue(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('startDate and endDate are required');
    });

    it('should return 400 for invalid date format', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSuperAdminSession);

      const request = new NextRequest(
        'http://localhost:3000/api/super-admin/analytics/revenue?startDate=invalid-date&endDate=2024-02-29'
      );

      // Act
      const response = await getRevenue(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
    });
  });

  describe('GET /api/super-admin/analytics/churn', () => {
    it('should return churn analysis with valid time range', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSuperAdminSession);
      const mockChurnAnalysis = {
        churnRate: 5.2,
        retentionRate: 94.8,
        customerLifetimeValue: 2400,
        churnByPlan: [
          { planName: 'Basic', churnRate: 8.0, retentionRate: 92.0 },
          { planName: 'Premium', churnRate: 3.5, retentionRate: 96.5 },
        ],
        churnReasons: [
          { reason: 'Price', count: 15, percentage: 45.5 },
          { reason: 'Features', count: 10, percentage: 30.3 },
          { reason: 'Support', count: 8, percentage: 24.2 },
        ],
        cohortAnalysis: [
          { cohort: '2024-01', month0: 100, month1: 85, month3: 70, month6: 60, month12: 50 },
          { cohort: '2024-02', month0: 100, month1: 88, month3: 75, month6: 65, month12: 0 },
        ],
        predictiveMetrics: {
          atRiskCustomers: 12,
          likelyToChurn: [
            {
              schoolId: 'school-1',
              schoolName: 'Test School',
              riskScore: 0.85,
              factors: ['low_usage', 'payment_issues'],
            },
          ],
        },
      };
      mockAnalyticsService.getChurnAnalysis.mockResolvedValue(mockChurnAnalysis);

      const request = new NextRequest(
        'http://localhost:3000/api/super-admin/analytics/churn?startDate=2024-01-01&endDate=2024-02-29'
      );

      // Act
      const response = await getChurn(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockChurnAnalysis);
      expect(mockAnalyticsService.getChurnAnalysis).toHaveBeenCalledWith({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-02-29'),
      });
    });
  });

  describe('GET /api/super-admin/analytics/usage', () => {
    it('should return usage analytics for all schools', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSuperAdminSession);
      const mockUsageAnalytics = {
        totalSchools: 150,
        activeSchools: 142,
        usageByFeature: [
          { feature: 'student_management', usage: 1250, schools: 140 },
          { feature: 'attendance', usage: 980, schools: 135 },
          { feature: 'grades', usage: 750, schools: 120 },
        ],
        usagePatterns: [
          {
            schoolId: 'school-1',
            schoolName: 'Test School 1',
            plan: 'Premium',
            features: { student_management: 45, attendance: 32, grades: 28 },
            lastActivity: new Date('2024-02-15'),
          },
        ],
        resourceConsumption: {
          storage: { total: 1024000, average: 6827, peak: 15000 },
          bandwidth: { total: 5120000, average: 34133, peak: 75000 },
          apiCalls: { total: 2500000, average: 16667, peak: 50000 },
        },
        geographicDistribution: [
          { region: 'North America', schools: 85, revenue: 425000 },
          { region: 'Europe', schools: 45, revenue: 225000 },
          { region: 'Asia', schools: 20, revenue: 100000 },
        ],
      };
      mockAnalyticsService.getUsageAnalytics.mockResolvedValue(mockUsageAnalytics);

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/usage');

      // Act
      const response = await getUsage(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockUsageAnalytics);
      expect(mockAnalyticsService.getUsageAnalytics).toHaveBeenCalledWith(undefined);
    });

    it('should return usage analytics for specific school', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSuperAdminSession);
      const mockUsageAnalytics = {
        totalSchools: 1,
        activeSchools: 1,
        usageByFeature: [
          { feature: 'student_management', usage: 45, schools: 1 },
        ],
        usagePatterns: [],
        resourceConsumption: {
          storage: { total: 5000, average: 5000, peak: 5000 },
          bandwidth: { total: 25000, average: 25000, peak: 25000 },
          apiCalls: { total: 1500, average: 1500, peak: 1500 },
        },
        geographicDistribution: [],
      };
      mockAnalyticsService.getUsageAnalytics.mockResolvedValue(mockUsageAnalytics);

      const request = new NextRequest(
        'http://localhost:3000/api/super-admin/analytics/usage?schoolId=school-1'
      );

      // Act
      const response = await getUsage(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockUsageAnalytics);
      expect(mockAnalyticsService.getUsageAnalytics).toHaveBeenCalledWith('school-1');
    });
  });

  describe('GET /api/super-admin/analytics/dashboard', () => {
    it('should return KPI dashboard data', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSuperAdminSession);
      const mockKPIDashboard = {
        overview: {
          totalRevenue: 750000,
          totalSchools: 150,
          activeSubscriptions: 142,
          churnRate: 5.2,
        },
        trends: {
          revenueGrowth: 15.5,
          schoolGrowth: 8.2,
          subscriptionGrowth: 12.1,
        },
        alerts: [
          {
            type: 'warning',
            message: 'High churn rate detected in Basic plan',
            value: 8.0,
            threshold: 5.0,
          },
        ],
        widgets: [
          {
            id: 'revenue-chart',
            type: 'chart',
            title: 'Monthly Revenue',
            data: { /* chart data */ },
            config: { chartType: 'line' },
          },
        ],
      };
      mockAnalyticsService.getKPIDashboard.mockResolvedValue(mockKPIDashboard);

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/dashboard');

      // Act
      const response = await getDashboard(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockKPIDashboard);
      expect(mockAnalyticsService.getKPIDashboard).toHaveBeenCalled();
    });
  });

  describe('POST /api/super-admin/analytics/reports', () => {
    it('should generate custom report with valid configuration', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSuperAdminSession);
      const reportConfig = {
        name: 'Monthly Revenue Report',
        type: 'revenue' as const,
        timeRange: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        metrics: ['totalRevenue', 'monthlyRecurringRevenue'],
        format: 'json' as const,
      };
      const mockReport = {
        id: 'report-1',
        name: 'Monthly Revenue Report',
        type: 'revenue',
        data: { /* report data */ },
        generatedAt: new Date(),
        format: 'json',
      };
      mockAnalyticsService.generateCustomReport.mockResolvedValue(mockReport);

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/reports', {
        method: 'POST',
        body: JSON.stringify(reportConfig),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await generateReport(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data).toEqual(mockReport);
      expect(mockAnalyticsService.generateCustomReport).toHaveBeenCalledWith({
        ...reportConfig,
        timeRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
      });
    });

    it('should return 400 for invalid report configuration', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSuperAdminSession);

      const invalidConfig = {
        name: '', // Invalid: empty name
        type: 'invalid-type',
        timeRange: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        metrics: [],
        format: 'json',
      };

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/reports', {
        method: 'POST',
        body: JSON.stringify(invalidConfig),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await generateReport(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
    });
  });

  describe('POST /api/super-admin/analytics/export', () => {
    it('should export data with valid configuration', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSuperAdminSession);
      const exportConfig = {
        type: 'revenue' as const,
        format: 'csv' as const,
        timeRange: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        includeDetails: true,
      };
      const mockExportResult = {
        id: 'export-1',
        filename: 'revenue_export_2024-02-15.csv',
        filePath: '/exports/revenue_export_2024-02-15.csv',
        format: 'csv',
        size: 1024,
        recordCount: 50,
        generatedAt: new Date(),
        downloadUrl: '/api/exports/download/revenue_export_2024-02-15.csv',
      };
      mockAnalyticsService.exportData.mockResolvedValue(mockExportResult);

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/export', {
        method: 'POST',
        body: JSON.stringify(exportConfig),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await exportData(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data).toEqual(mockExportResult);
      expect(mockAnalyticsService.exportData).toHaveBeenCalledWith({
        ...exportConfig,
        timeRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
      });
    });

    it('should export data without time range for certain types', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSuperAdminSession);
      const exportConfig = {
        type: 'schools' as const,
        format: 'json' as const,
      };
      const mockExportResult = {
        id: 'export-2',
        filename: 'schools_export_2024-02-15.json',
        filePath: '/exports/schools_export_2024-02-15.json',
        format: 'json',
        size: 2048,
        recordCount: 150,
        generatedAt: new Date(),
        downloadUrl: '/api/exports/download/schools_export_2024-02-15.json',
      };
      mockAnalyticsService.exportData.mockResolvedValue(mockExportResult);

      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/export', {
        method: 'POST',
        body: JSON.stringify(exportConfig),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await exportData(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data).toEqual(mockExportResult);
      expect(mockAnalyticsService.exportData).toHaveBeenCalledWith(exportConfig);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSuperAdminSession);
      mockAnalyticsService.getRevenueMetrics.mockRejectedValue(new Error('Service unavailable'));

      const request = new NextRequest(
        'http://localhost:3000/api/super-admin/analytics/revenue?startDate=2024-01-01&endDate=2024-02-29'
      );

      // Act
      const response = await getRevenue(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Performance', () => {
    it('should handle large data sets efficiently', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(mockSuperAdminSession);
      const largeDataSet = {
        totalSchools: 10000,
        activeSchools: 9500,
        usageByFeature: Array.from({ length: 100 }, (_, i) => ({
          feature: `feature_${i}`,
          usage: Math.floor(Math.random() * 10000),
          schools: Math.floor(Math.random() * 9500),
        })),
        usagePatterns: Array.from({ length: 1000 }, (_, i) => ({
          schoolId: `school-${i}`,
          schoolName: `School ${i}`,
          plan: 'Premium',
          features: {},
          lastActivity: new Date(),
        })),
        resourceConsumption: {
          storage: { total: 10240000, average: 1024, peak: 50000 },
          bandwidth: { total: 51200000, average: 5120, peak: 100000 },
          apiCalls: { total: 25000000, average: 2500, peak: 75000 },
        },
        geographicDistribution: [],
      };
      mockAnalyticsService.getUsageAnalytics.mockResolvedValue(largeDataSet);

      const startTime = Date.now();
      const request = new NextRequest('http://localhost:3000/api/super-admin/analytics/usage');

      // Act
      const response = await getUsage(request);
      const endTime = Date.now();

      // Assert
      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});