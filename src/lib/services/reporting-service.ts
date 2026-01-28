/**
 * Reporting Service
 * 
 * Provides custom report generation with scheduling capabilities.
 * Handles report templates, data aggregation, export formats,
 * and automated report delivery.
 * 
 * Requirements: 5.4 - Custom report generation with scheduling
 */

import { prisma } from '@/lib/db';
import { analyticsService } from './analytics-service';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'revenue' | 'churn' | 'usage' | 'schools' | 'custom';
  defaultFilters: Record<string, any>;
  metrics: string[];
  visualizations: ReportVisualization[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportVisualization {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'graph';
  title: string;
  config: {
    chartType?: 'line' | 'bar' | 'pie' | 'area';
    xAxis?: string;
    yAxis?: string;
    groupBy?: string;
    aggregation?: 'sum' | 'avg' | 'count' | 'max' | 'min';
  };
  position: { x: number; y: number; width: number; height: number };
}

export interface ScheduledReport {
  id: string;
  templateId: string;
  name: string;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    time: string; // HH:MM format
    timezone: string;
  };
  recipients: string[];
  filters: Record<string, any>;
  format: 'pdf' | 'csv' | 'excel' | 'json';
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportExecution {
  id: string;
  reportId: string;
  templateId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  filePath?: string;
  fileSize?: number;
  recordCount?: number;
  error?: string;
  metadata: Record<string, any>;
}

export interface ReportData {
  metadata: {
    reportId: string;
    templateName: string;
    generatedAt: Date;
    timeRange: { startDate: Date; endDate: Date };
    filters: Record<string, any>;
  };
  sections: ReportSection[];
  summary: Record<string, any>;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'metrics' | 'chart' | 'table' | 'text';
  data: any;
  visualization?: ReportVisualization;
}

// ============================================================================
// Reporting Service Implementation
// ============================================================================

export class ReportingService {
  private readonly reportsDir = path.join(process.cwd(), 'storage', 'reports');

  constructor() {
    this.ensureReportsDirectory();
  }

  /**
   * Create a new report template
   */
  async createReportTemplate(template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportTemplate> {
    try {
      const newTemplate: ReportTemplate = {
        ...template,
        id: `template_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store template in database (would need to add ReportTemplate model to schema)
      // For now, store in memory or file system
      await this.saveTemplate(newTemplate);

      return newTemplate;
    } catch (error) {
      console.error('Error creating report template:', error);
      throw new Error(`Failed to create report template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Schedule a report for automatic generation
   */
  async scheduleReport(scheduledReport: Omit<ScheduledReport, 'id' | 'createdAt' | 'updatedAt' | 'nextRun'>): Promise<ScheduledReport> {
    try {
      const nextRun = this.calculateNextRun(scheduledReport.schedule);
      
      const newScheduledReport: ScheduledReport = {
        ...scheduledReport,
        id: `scheduled_${Date.now()}`,
        nextRun,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store scheduled report
      await this.saveScheduledReport(newScheduledReport);

      return newScheduledReport;
    } catch (error) {
      console.error('Error scheduling report:', error);
      throw new Error(`Failed to schedule report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a report based on template and filters
   */
  async generateReport(templateId: string, filters: Record<string, any> = {}, format: 'pdf' | 'csv' | 'excel' | 'json' = 'json'): Promise<ReportExecution> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      const execution: ReportExecution = {
        id: `exec_${Date.now()}`,
        reportId: `report_${Date.now()}`,
        templateId,
        status: 'running',
        startedAt: new Date(),
        metadata: { template: template.name, filters },
      };

      try {
        // Generate report data
        const reportData = await this.generateReportData(template, filters);

        // Export to specified format
        const filePath = await this.exportReport(reportData, format, execution.reportId);
        const fileSize = await this.getFileSize(filePath);

        execution.status = 'completed';
        execution.completedAt = new Date();
        execution.filePath = filePath;
        execution.fileSize = fileSize;
        execution.recordCount = this.calculateRecordCount(reportData);

      } catch (error) {
        execution.status = 'failed';
        execution.completedAt = new Date();
        execution.error = error instanceof Error ? error.message : 'Unknown error';
      }

      // Save execution record
      await this.saveExecution(execution);

      return execution;
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all report templates
   */
  async getReportTemplates(): Promise<ReportTemplate[]> {
    try {
      // Load templates from storage
      return await this.loadTemplates();
    } catch (error) {
      console.error('Error getting report templates:', error);
      throw new Error(`Failed to get report templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get scheduled reports
   */
  async getScheduledReports(): Promise<ScheduledReport[]> {
    try {
      return await this.loadScheduledReports();
    } catch (error) {
      console.error('Error getting scheduled reports:', error);
      throw new Error(`Failed to get scheduled reports: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get report execution history
   */
  async getReportExecutions(templateId?: string): Promise<ReportExecution[]> {
    try {
      const executions = await this.loadExecutions();
      return templateId ? executions.filter(e => e.templateId === templateId) : executions;
    } catch (error) {
      console.error('Error getting report executions:', error);
      throw new Error(`Failed to get report executions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Run scheduled reports that are due
   */
  async runScheduledReports(): Promise<void> {
    try {
      const scheduledReports = await this.getScheduledReports();
      const dueReports = scheduledReports.filter(report => 
        report.isActive && report.nextRun <= new Date()
      );

      for (const report of dueReports) {
        try {
          await this.generateReport(report.templateId, report.filters, report.format);
          
          // Update next run time
          report.lastRun = new Date();
          report.nextRun = this.calculateNextRun(report.schedule);
          await this.saveScheduledReport(report);

          // Send to recipients if specified
          if (report.recipients.length > 0) {
            await this.sendReportToRecipients(report);
          }
        } catch (error) {
          console.error(`Error running scheduled report ${report.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error running scheduled reports:', error);
      throw new Error(`Failed to run scheduled reports: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async ensureReportsDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating reports directory:', error);
    }
  }

  private async generateReportData(template: ReportTemplate, filters: Record<string, any>): Promise<ReportData> {
    const timeRange = filters.timeRange || {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(),
    };

    const sections: ReportSection[] = [];
    let summary: Record<string, any> = {};

    // Generate data based on template type
    switch (template.type) {
      case 'revenue':
        const revenueMetrics = await analyticsService.getRevenueMetrics(timeRange);
        sections.push({
          id: 'revenue_overview',
          title: 'Revenue Overview',
          type: 'metrics',
          data: {
            totalRevenue: revenueMetrics.totalRevenue,
            monthlyRecurringRevenue: revenueMetrics.monthlyRecurringRevenue,
            annualRecurringRevenue: revenueMetrics.annualRecurringRevenue,
            averageRevenuePerUser: revenueMetrics.averageRevenuePerUser,
            revenueGrowthRate: revenueMetrics.revenueGrowthRate,
          },
        });

        sections.push({
          id: 'revenue_trends',
          title: 'Revenue Trends',
          type: 'chart',
          data: revenueMetrics.revenueTrends,
          visualization: {
            id: 'revenue_chart',
            type: 'chart',
            title: 'Monthly Revenue Trends',
            config: {
              chartType: 'line',
              xAxis: 'period',
              yAxis: 'revenue',
            },
            position: { x: 0, y: 0, width: 12, height: 6 },
          },
        });

        summary = {
          totalRevenue: revenueMetrics.totalRevenue,
          growthRate: revenueMetrics.revenueGrowthRate,
        };
        break;

      case 'churn':
        const churnAnalysis = await analyticsService.getChurnAnalysis(timeRange);
        sections.push({
          id: 'churn_overview',
          title: 'Churn Analysis',
          type: 'metrics',
          data: {
            churnRate: churnAnalysis.churnRate,
            retentionRate: churnAnalysis.retentionRate,
            customerLifetimeValue: churnAnalysis.customerLifetimeValue,
          },
        });

        sections.push({
          id: 'churn_by_plan',
          title: 'Churn by Plan',
          type: 'table',
          data: churnAnalysis.churnByPlan,
        });

        summary = {
          churnRate: churnAnalysis.churnRate,
          retentionRate: churnAnalysis.retentionRate,
        };
        break;

      case 'usage':
        const usageAnalytics = await analyticsService.getUsageAnalytics();
        sections.push({
          id: 'usage_overview',
          title: 'Usage Overview',
          type: 'metrics',
          data: {
            totalSchools: usageAnalytics.totalSchools,
            activeSchools: usageAnalytics.activeSchools,
          },
        });

        sections.push({
          id: 'usage_by_feature',
          title: 'Usage by Feature',
          type: 'chart',
          data: usageAnalytics.usageByFeature,
          visualization: {
            id: 'usage_chart',
            type: 'chart',
            title: 'Feature Usage',
            config: {
              chartType: 'bar',
              xAxis: 'feature',
              yAxis: 'usage',
            },
            position: { x: 0, y: 0, width: 12, height: 6 },
          },
        });

        summary = {
          totalSchools: usageAnalytics.totalSchools,
          activeSchools: usageAnalytics.activeSchools,
        };
        break;

      case 'schools':
        const schoolsData = await this.getSchoolsReportData(filters);
        sections.push({
          id: 'schools_overview',
          title: 'Schools Overview',
          type: 'table',
          data: schoolsData,
        });

        summary = {
          totalSchools: schoolsData.length,
        };
        break;

      case 'custom':
        // Handle custom report generation based on template configuration
        const customData = await this.generateCustomReportData(template, filters);
        sections.push(...customData.sections);
        summary = customData.summary;
        break;
    }

    return {
      metadata: {
        reportId: `report_${Date.now()}`,
        templateName: template.name,
        generatedAt: new Date(),
        timeRange,
        filters,
      },
      sections,
      summary,
    };
  }

  private async exportReport(reportData: ReportData, format: string, reportId: string): Promise<string> {
    const filename = `${reportId}.${format}`;
    const filePath = path.join(this.reportsDir, filename);

    switch (format) {
      case 'json':
        await fs.writeFile(filePath, JSON.stringify(reportData, null, 2));
        break;
      case 'csv':
        const csvData = this.convertToCSV(reportData);
        await fs.writeFile(filePath, csvData);
        break;
      case 'pdf':
        // Would integrate with PDF generation library
        await fs.writeFile(filePath, 'PDF content placeholder');
        break;
      case 'excel':
        // Would integrate with Excel generation library
        await fs.writeFile(filePath, 'Excel content placeholder');
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    return filePath;
  }

  private convertToCSV(reportData: ReportData): string {
    // Simple CSV conversion - would be more sophisticated in production
    let csv = 'Section,Title,Data\n';
    
    reportData.sections.forEach(section => {
      if (section.type === 'table' && Array.isArray(section.data)) {
        section.data.forEach((row: any) => {
          const values = Object.values(row).map(v => `"${v}"`).join(',');
          csv += `${section.title},"${section.title}",${values}\n`;
        });
      } else if (section.type === 'metrics') {
        Object.entries(section.data).forEach(([key, value]) => {
          csv += `${section.title},"${key}","${value}"\n`;
        });
      }
    });

    return csv;
  }

  private calculateNextRun(schedule: ScheduledReport['schedule']): Date {
    const now = new Date();
    const nextRun = new Date(now);

    switch (schedule.frequency) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        const daysUntilNext = (7 + (schedule.dayOfWeek || 0) - nextRun.getDay()) % 7;
        nextRun.setDate(nextRun.getDate() + (daysUntilNext || 7));
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        if (schedule.dayOfMonth) {
          nextRun.setDate(schedule.dayOfMonth);
        }
        break;
      case 'quarterly':
        nextRun.setMonth(nextRun.getMonth() + 3);
        break;
    }

    // Set time
    const [hours, minutes] = schedule.time.split(':').map(Number);
    nextRun.setHours(hours, minutes, 0, 0);

    return nextRun;
  }

  private calculateRecordCount(reportData: ReportData): number {
    return reportData.sections.reduce((count, section) => {
      if (Array.isArray(section.data)) {
        return count + section.data.length;
      }
      return count + 1;
    }, 0);
  }

  private async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  private async getSchoolsReportData(filters: Record<string, any>) {
    return await prisma.school.findMany({
      where: filters,
      include: {
        enhancedSubscriptions: {
          include: { plan: true },
        },
      },
    });
  }

  private async generateCustomReportData(template: ReportTemplate, filters: Record<string, any>) {
    // Custom report generation logic
    return {
      sections: [],
      summary: {},
    };
  }

  private async sendReportToRecipients(report: ScheduledReport): Promise<void> {
    // Implementation for sending reports to recipients via email
    console.log(`Sending report ${report.name} to recipients:`, report.recipients);
  }

  // Storage methods (would be replaced with database operations)
  private async saveTemplate(template: ReportTemplate): Promise<void> {
    const filePath = path.join(this.reportsDir, 'templates.json');
    const templates = await this.loadTemplates();
    templates.push(template);
    await fs.writeFile(filePath, JSON.stringify(templates, null, 2));
  }

  private async loadTemplates(): Promise<ReportTemplate[]> {
    try {
      const filePath = path.join(this.reportsDir, 'templates.json');
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  private async getTemplate(templateId: string): Promise<ReportTemplate | null> {
    const templates = await this.loadTemplates();
    return templates.find(t => t.id === templateId) || null;
  }

  private async saveScheduledReport(report: ScheduledReport): Promise<void> {
    const filePath = path.join(this.reportsDir, 'scheduled.json');
    const reports = await this.loadScheduledReports();
    const existingIndex = reports.findIndex(r => r.id === report.id);
    
    if (existingIndex >= 0) {
      reports[existingIndex] = report;
    } else {
      reports.push(report);
    }
    
    await fs.writeFile(filePath, JSON.stringify(reports, null, 2));
  }

  private async loadScheduledReports(): Promise<ScheduledReport[]> {
    try {
      const filePath = path.join(this.reportsDir, 'scheduled.json');
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  private async saveExecution(execution: ReportExecution): Promise<void> {
    const filePath = path.join(this.reportsDir, 'executions.json');
    const executions = await this.loadExecutions();
    executions.push(execution);
    await fs.writeFile(filePath, JSON.stringify(executions, null, 2));
  }

  private async loadExecutions(): Promise<ReportExecution[]> {
    try {
      const filePath = path.join(this.reportsDir, 'executions.json');
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }
}

// Export singleton instance
export const reportingService = new ReportingService();