/**
 * BI Integration Service
 * 
 * Provides data export and business intelligence tool integration.
 * Handles data transformation, export formats, API endpoints for BI tools,
 * and automated data synchronization.
 * 
 * Requirements: 5.6 - Data export and BI tool integration
 */

import { prisma } from '@/lib/db';
import { analyticsService } from './analytics-service';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface BIConnection {
  id: string;
  name: string;
  type: 'tableau' | 'powerbi' | 'looker' | 'metabase' | 'grafana' | 'custom';
  config: BIConnectionConfig;
  isActive: boolean;
  lastSync?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BIConnectionConfig {
  // Tableau config
  tableau?: {
    serverUrl: string;
    username: string;
    password: string;
    siteId?: string;
    projectId?: string;
  };

  // Power BI config
  powerbi?: {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    workspaceId: string;
  };

  // Looker config
  looker?: {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
  };

  // Custom API config
  custom?: {
    endpoint: string;
    method: 'POST' | 'PUT' | 'PATCH';
    headers: Record<string, string>;
    authentication: {
      type: 'bearer' | 'basic' | 'apikey';
      credentials: Record<string, string>;
    };
  };
}

export interface DataExportJob {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'custom';
  dataSource: string;
  format: 'csv' | 'json' | 'parquet' | 'avro' | 'sql';
  destination: 'file' | 'api' | 's3' | 'gcs' | 'azure';
  schedule?: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    time?: string;
    timezone: string;
  };
  filters: Record<string, any>;
  transformations: DataTransformation[];
  status: 'active' | 'paused' | 'error';
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataTransformation {
  id: string;
  type: 'filter' | 'aggregate' | 'join' | 'pivot' | 'custom';
  config: Record<string, any>;
  order: number;
}

export interface ExportResult {
  jobId: string;
  executionId: string;
  status: 'success' | 'failed' | 'partial';
  recordCount: number;
  fileSize?: number;
  filePath?: string;
  downloadUrl?: string;
  error?: string;
  startedAt: Date;
  completedAt: Date;
  metadata: Record<string, any>;
}

export interface DataSchema {
  tableName: string;
  columns: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'json';
    nullable: boolean;
    description?: string;
  }>;
  relationships?: Array<{
    type: 'one-to-one' | 'one-to-many' | 'many-to-many' | 'many-to-one';
    targetTable: string;
    foreignKey: string;
    targetKey: string;
  }>;
}

export interface BIDataset {
  name: string;
  description: string;
  tables: DataSchema[];
  refreshFrequency: string;
  lastRefresh: Date;
  size: number;
  recordCount: number;
}

// ============================================================================
// BI Integration Service Implementation
// ============================================================================

export class BIIntegrationService {
  private readonly exportsDir = path.join(process.cwd(), 'storage', 'exports');
  private exportJobs = new Map<string, DataExportJob>();
  private biConnections = new Map<string, BIConnection>();

  constructor() {
    this.ensureExportsDirectory();
    this.loadConfiguration();
  }

  /**
   * Create a new BI connection
   */
  async createBIConnection(connection: Omit<BIConnection, 'id' | 'createdAt' | 'updatedAt'>): Promise<BIConnection> {
    try {
      const newConnection: BIConnection = {
        ...connection,
        id: `bi_conn_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Test connection
      await this.testBIConnection(newConnection);

      this.biConnections.set(newConnection.id, newConnection);
      await this.saveBIConnections();

      return newConnection;
    } catch (error) {
      console.error('Error creating BI connection:', error);
      throw new Error(`Failed to create BI connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new data export job
   */
  async createExportJob(job: Omit<DataExportJob, 'id' | 'createdAt' | 'updatedAt' | 'nextRun'>): Promise<DataExportJob> {
    try {
      const nextRun = job.schedule ? this.calculateNextRun(job.schedule) : undefined;

      const newJob: DataExportJob = {
        ...job,
        id: `export_job_${Date.now()}`,
        nextRun,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.exportJobs.set(newJob.id, newJob);
      await this.saveExportJobs();

      return newJob;
    } catch (error) {
      console.error('Error creating export job:', error);
      throw new Error(`Failed to create export job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute a data export job
   */
  async executeExportJob(jobId: string): Promise<ExportResult> {
    try {
      const job = this.exportJobs.get(jobId);
      if (!job) {
        throw new Error(`Export job not found: ${jobId}`);
      }

      const executionId = `exec_${Date.now()}`;
      const startedAt = new Date();

      try {
        // Extract data based on data source
        const data = await this.extractData(job);

        // Apply transformations
        const transformedData = await this.applyTransformations(data, job.transformations);

        // Export data in specified format
        const exportResult = await this.exportData(transformedData, job, executionId);

        // Update job last run time
        job.lastRun = new Date();
        if (job.schedule) {
          job.nextRun = this.calculateNextRun(job.schedule);
        }
        await this.saveExportJobs();

        return {
          jobId,
          executionId,
          status: 'success',
          recordCount: Array.isArray(transformedData) ? transformedData.length : 1,
          filePath: exportResult.filePath,
          fileSize: exportResult.fileSize,
          downloadUrl: exportResult.downloadUrl,
          startedAt,
          completedAt: new Date(),
          metadata: exportResult.metadata,
        };

      } catch (error) {
        return {
          jobId,
          executionId,
          status: 'failed',
          recordCount: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
          startedAt,
          completedAt: new Date(),
          metadata: {},
        };
      }
    } catch (error) {
      console.error('Error executing export job:', error);
      throw new Error(`Failed to execute export job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get data schema for BI tools
   */
  async getDataSchema(): Promise<BIDataset> {
    try {
      const tables: DataSchema[] = [
        {
          tableName: 'schools',
          columns: [
            { name: 'id', type: 'string', nullable: false, description: 'Unique school identifier' },
            { name: 'name', type: 'string', nullable: false, description: 'School name' },
            { name: 'schoolCode', type: 'string', nullable: false, description: 'Unique school code' },
            { name: 'status', type: 'string', nullable: false, description: 'School status (ACTIVE, SUSPENDED, etc.)' },
            { name: 'plan', type: 'string', nullable: false, description: 'Subscription plan type' },
            { name: 'createdAt', type: 'date', nullable: false, description: 'School registration date' },
            { name: 'updatedAt', type: 'date', nullable: false, description: 'Last update date' },
          ],
        },
        {
          tableName: 'subscriptions',
          columns: [
            { name: 'id', type: 'string', nullable: false, description: 'Unique subscription identifier' },
            { name: 'schoolId', type: 'string', nullable: false, description: 'Associated school ID' },
            { name: 'planId', type: 'string', nullable: false, description: 'Subscription plan ID' },
            { name: 'status', type: 'string', nullable: false, description: 'Subscription status' },
            { name: 'currentPeriodStart', type: 'date', nullable: false, description: 'Current billing period start' },
            { name: 'currentPeriodEnd', type: 'date', nullable: false, description: 'Current billing period end' },
            { name: 'createdAt', type: 'date', nullable: false, description: 'Subscription creation date' },
          ],
          relationships: [
            {
              type: 'many-to-one',
              targetTable: 'schools',
              foreignKey: 'schoolId',
              targetKey: 'id',
            },
            {
              type: 'many-to-one',
              targetTable: 'subscription_plans',
              foreignKey: 'planId',
              targetKey: 'id',
            },
          ],
        },
        {
          tableName: 'payments',
          columns: [
            { name: 'id', type: 'string', nullable: false, description: 'Unique payment identifier' },
            { name: 'subscriptionId', type: 'string', nullable: false, description: 'Associated subscription ID' },
            { name: 'amount', type: 'number', nullable: false, description: 'Payment amount in cents' },
            { name: 'currency', type: 'string', nullable: false, description: 'Payment currency' },
            { name: 'status', type: 'string', nullable: false, description: 'Payment status' },
            { name: 'processedAt', type: 'date', nullable: true, description: 'Payment processing date' },
            { name: 'createdAt', type: 'date', nullable: false, description: 'Payment creation date' },
          ],
          relationships: [
            {
              type: 'many-to-one',
              targetTable: 'subscriptions',
              foreignKey: 'subscriptionId',
              targetKey: 'id',
            },
          ],
        },
        {
          tableName: 'analytics_events',
          columns: [
            { name: 'id', type: 'string', nullable: false, description: 'Unique event identifier' },
            { name: 'eventType', type: 'string', nullable: false, description: 'Type of analytics event' },
            { name: 'schoolId', type: 'string', nullable: true, description: 'Associated school ID' },
            { name: 'userId', type: 'string', nullable: true, description: 'Associated user ID' },
            { name: 'properties', type: 'json', nullable: false, description: 'Event properties and metadata' },
            { name: 'timestamp', type: 'date', nullable: false, description: 'Event timestamp' },
          ],
          relationships: [
            {
              type: 'many-to-one',
              targetTable: 'schools',
              foreignKey: 'schoolId',
              targetKey: 'id',
            },
          ],
        },
      ];

      // Calculate dataset statistics
      const totalSchools = await prisma.school.count();
      const totalSubscriptions = await prisma.enhancedSubscription.count();
      const totalPayments = await prisma.payment.count();
      const totalEvents = await prisma.analyticsEvent.count();

      const recordCount = totalSchools + totalSubscriptions + totalPayments + totalEvents;

      return {
        name: 'SaaS Analytics Dataset',
        description: 'Comprehensive dataset for SaaS platform analytics and business intelligence',
        tables,
        refreshFrequency: 'hourly',
        lastRefresh: new Date(),
        size: recordCount * 1024, // Rough estimate
        recordCount,
      };
    } catch (error) {
      console.error('Error getting data schema:', error);
      throw new Error(`Failed to get data schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sync data with BI tool
   */
  async syncWithBITool(connectionId: string, dataTypes: string[] = ['all']): Promise<void> {
    try {
      const connection = this.biConnections.get(connectionId);
      if (!connection) {
        throw new Error(`BI connection not found: ${connectionId}`);
      }

      // Extract data based on requested types
      const data = await this.extractDataForBI(dataTypes);

      // Send data to BI tool
      await this.sendDataToBITool(connection, data);

      // Update last sync time
      connection.lastSync = new Date();
      await this.saveBIConnections();

    } catch (error) {
      console.error('Error syncing with BI tool:', error);
      throw new Error(`Failed to sync with BI tool: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate API endpoint for BI tool access
   */
  generateBIApiEndpoint(dataType: string, format: 'json' | 'csv' = 'json'): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/api/bi/data/${dataType}?format=${format}`;
  }

  /**
   * Get available data sources for export
   */
  getAvailableDataSources(): Array<{ id: string; name: string; description: string; tables: string[] }> {
    return [
      {
        id: 'schools',
        name: 'Schools Data',
        description: 'Complete school information including subscriptions and usage',
        tables: ['schools', 'subscriptions', 'subscription_plans'],
      },
      {
        id: 'revenue',
        name: 'Revenue Analytics',
        description: 'Payment data, revenue metrics, and financial analytics',
        tables: ['payments', 'invoices', 'subscriptions'],
      },
      {
        id: 'usage',
        name: 'Usage Analytics',
        description: 'User activity, feature usage, and engagement metrics',
        tables: ['analytics_events', 'users', 'schools'],
      },
      {
        id: 'churn',
        name: 'Churn Analysis',
        description: 'Customer lifecycle, retention, and churn data',
        tables: ['subscriptions', 'schools', 'payments'],
      },
      {
        id: 'complete',
        name: 'Complete Dataset',
        description: 'All available data for comprehensive analysis',
        tables: ['schools', 'subscriptions', 'payments', 'analytics_events', 'users'],
      },
    ];
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async ensureExportsDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.exportsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating exports directory:', error);
    }
  }

  private async loadConfiguration(): Promise<void> {
    // Load saved export jobs and BI connections
    try {
      const jobsData = await fs.readFile(path.join(this.exportsDir, 'jobs.json'), 'utf-8');
      const jobs: DataExportJob[] = JSON.parse(jobsData);
      jobs.forEach(job => this.exportJobs.set(job.id, job));
    } catch (error) {
      // File doesn't exist or is invalid, start with empty jobs
    }

    try {
      const connectionsData = await fs.readFile(path.join(this.exportsDir, 'connections.json'), 'utf-8');
      const connections: BIConnection[] = JSON.parse(connectionsData);
      connections.forEach(conn => this.biConnections.set(conn.id, conn));
    } catch (error) {
      // File doesn't exist or is invalid, start with empty connections
    }
  }

  private async testBIConnection(connection: BIConnection): Promise<void> {
    // Implementation would test actual connection to BI tool
    console.log(`Testing connection to ${connection.type}:`, connection.name);
  }

  private calculateNextRun(schedule: DataExportJob['schedule']): Date {
    if (!schedule) return new Date();

    const now = new Date();
    const nextRun = new Date(now);

    switch (schedule.frequency) {
      case 'hourly':
        nextRun.setHours(nextRun.getHours() + 1);
        break;
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
    }

    if (schedule.time) {
      const [hours, minutes] = schedule.time.split(':').map(Number);
      nextRun.setHours(hours, minutes, 0, 0);
    }

    return nextRun;
  }

  private async extractData(job: DataExportJob): Promise<any> {
    switch (job.dataSource) {
      case 'schools':
        return await prisma.school.findMany({
          where: job.filters,
          include: {
            enhancedSubscriptions: {
              include: { plan: true },
            },
          },
        });

      case 'subscriptions':
        return await prisma.enhancedSubscription.findMany({
          where: job.filters,
          include: {
            plan: true,
            school: true,
            payments: true,
          },
        });

      case 'payments':
        return await prisma.payment.findMany({
          where: job.filters,
          include: {
            subscription: {
              include: { school: true, plan: true },
            },
          },
        });

      case 'analytics_events':
        return await prisma.analyticsEvent.findMany({
          where: job.filters,
          include: {
            school: true,
            user: true,
          },
        });

      case 'revenue_metrics':
        const timeRange = job.filters.timeRange || {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        };
        return await analyticsService.getRevenueMetrics(timeRange);

      case 'churn_analysis':
        const churnTimeRange = job.filters.timeRange || {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        };
        return await analyticsService.getChurnAnalysis(churnTimeRange);

      default:
        throw new Error(`Unknown data source: ${job.dataSource}`);
    }
  }

  private async applyTransformations(data: any, transformations: DataTransformation[]): Promise<any> {
    let transformedData = data;

    for (const transformation of transformations.sort((a, b) => a.order - b.order)) {
      switch (transformation.type) {
        case 'filter':
          if (Array.isArray(transformedData)) {
            transformedData = transformedData.filter(item => 
              this.evaluateFilter(item, transformation.config)
            );
          }
          break;

        case 'aggregate':
          if (Array.isArray(transformedData)) {
            transformedData = this.aggregateData(transformedData, transformation.config);
          }
          break;

        case 'pivot':
          if (Array.isArray(transformedData)) {
            transformedData = this.pivotData(transformedData, transformation.config);
          }
          break;

        // Add more transformation types as needed
      }
    }

    return transformedData;
  }

  private evaluateFilter(item: any, filterConfig: any): boolean {
    // Simple filter evaluation - would be more sophisticated in production
    for (const [key, value] of Object.entries(filterConfig)) {
      if (item[key] !== value) {
        return false;
      }
    }
    return true;
  }

  private aggregateData(data: any[], aggregateConfig: any): any {
    // Simple aggregation - would be more sophisticated in production
    const groupBy = aggregateConfig.groupBy;
    const aggregateField = aggregateConfig.field;
    const aggregateFunction = aggregateConfig.function || 'sum';

    const groups: Record<string, any[]> = {};
    
    data.forEach(item => {
      const groupKey = item[groupBy];
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    return Object.entries(groups).map(([key, items]) => {
      let aggregatedValue;
      
      switch (aggregateFunction) {
        case 'sum':
          aggregatedValue = items.reduce((sum, item) => sum + (item[aggregateField] || 0), 0);
          break;
        case 'avg':
          aggregatedValue = items.reduce((sum, item) => sum + (item[aggregateField] || 0), 0) / items.length;
          break;
        case 'count':
          aggregatedValue = items.length;
          break;
        default:
          aggregatedValue = items.length;
      }

      return {
        [groupBy]: key,
        [aggregateField]: aggregatedValue,
        count: items.length,
      };
    });
  }

  private pivotData(data: any[], pivotConfig: any): any {
    // Simple pivot implementation - would be more sophisticated in production
    return data;
  }

  private async exportData(data: any, job: DataExportJob, executionId: string): Promise<{
    filePath: string;
    fileSize: number;
    downloadUrl: string;
    metadata: Record<string, any>;
  }> {
    const filename = `${job.name}_${executionId}.${job.format}`;
    const filePath = path.join(this.exportsDir, filename);

    let content: string;
    let metadata: Record<string, any> = {};

    switch (job.format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        break;
      case 'csv':
        content = this.convertToCSV(data);
        break;
      case 'sql':
        content = this.convertToSQL(data, job.dataSource);
        break;
      default:
        throw new Error(`Unsupported format: ${job.format}`);
    }

    await fs.writeFile(filePath, content);
    const stats = await fs.stat(filePath);

    return {
      filePath,
      fileSize: stats.size,
      downloadUrl: `/api/exports/download/${filename}`,
      metadata: {
        recordCount: Array.isArray(data) ? data.length : 1,
        format: job.format,
        ...metadata,
      },
    };
  }

  private convertToCSV(data: any): string {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  private convertToSQL(data: any, tableName: string): string {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    let sql = `-- Data export for ${tableName}\n`;
    sql += `-- Generated at ${new Date().toISOString()}\n\n`;

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) {
          return 'NULL';
        }
        return typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value;
      });
      
      sql += `INSERT INTO ${tableName} (${headers.join(', ')}) VALUES (${values.join(', ')});\n`;
    });

    return sql;
  }

  private async extractDataForBI(dataTypes: string[]): Promise<Record<string, any>> {
    const data: Record<string, any> = {};

    if (dataTypes.includes('all') || dataTypes.includes('schools')) {
      data.schools = await prisma.school.findMany({
        include: {
          enhancedSubscriptions: {
            include: { plan: true },
          },
        },
      });
    }

    if (dataTypes.includes('all') || dataTypes.includes('subscriptions')) {
      data.subscriptions = await prisma.enhancedSubscription.findMany({
        include: {
          plan: true,
          school: true,
        },
      });
    }

    if (dataTypes.includes('all') || dataTypes.includes('payments')) {
      data.payments = await prisma.payment.findMany({
        include: {
          subscription: {
            include: { school: true, plan: true },
          },
        },
      });
    }

    if (dataTypes.includes('all') || dataTypes.includes('analytics')) {
      data.analytics_events = await prisma.analyticsEvent.findMany({
        include: {
          school: true,
          user: true,
        },
      });
    }

    return data;
  }

  private async sendDataToBITool(connection: BIConnection, data: Record<string, any>): Promise<void> {
    // Implementation would send data to specific BI tool
    console.log(`Sending data to ${connection.type}:`, Object.keys(data));
  }

  private async saveExportJobs(): Promise<void> {
    const jobs = Array.from(this.exportJobs.values());
    await fs.writeFile(
      path.join(this.exportsDir, 'jobs.json'),
      JSON.stringify(jobs, null, 2)
    );
  }

  private async saveBIConnections(): Promise<void> {
    const connections = Array.from(this.biConnections.values());
    await fs.writeFile(
      path.join(this.exportsDir, 'connections.json'),
      JSON.stringify(connections, null, 2)
    );
  }
}

// Export singleton instance
export const biIntegrationService = new BIIntegrationService();