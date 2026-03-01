/**
 * Dashboard Service
 * 
 * Provides real-time dashboards with customizable widgets.
 * Handles widget configuration, data aggregation, real-time updates,
 * and dashboard personalization.
 * 
 * Requirements: 5.5 - Real-time dashboards with customizable widgets
 */

import { prisma } from '@/lib/db';
import { analyticsService } from './analytics-service';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'progress' | 'alert' | 'custom';
  title: string;
  description?: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: WidgetConfig;
  dataSource: DataSourceConfig;
  refreshInterval: number; // in seconds
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetConfig {
  // Metric widget config
  metric?: {
    value: number;
    unit?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: number;
    color?: string;
    icon?: string;
  };

  // Chart widget config
  chart?: {
    type: 'line' | 'bar' | 'pie' | 'area' | 'donut' | 'scatter';
    xAxis: string;
    yAxis: string;
    groupBy?: string;
    aggregation?: 'sum' | 'avg' | 'count' | 'max' | 'min';
    colors?: string[];
    showLegend?: boolean;
    showGrid?: boolean;
  };

  // Table widget config
  table?: {
    columns: Array<{
      key: string;
      title: string;
      type: 'text' | 'number' | 'date' | 'currency' | 'percentage';
      sortable?: boolean;
      filterable?: boolean;
    }>;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };

  // Progress widget config
  progress?: {
    current: number;
    target: number;
    unit?: string;
    color?: string;
    showPercentage?: boolean;
  };

  // Alert widget config
  alert?: {
    threshold: number;
    condition: 'greater' | 'less' | 'equal';
    severity: 'info' | 'warning' | 'error' | 'success';
    message: string;
  };
}

export interface DataSourceConfig {
  type: 'analytics' | 'database' | 'api' | 'custom';
  source: string; // analytics method name, table name, API endpoint, etc.
  filters?: Record<string, any>;
  timeRange?: {
    startDate: Date;
    endDate: Date;
  };
  query?: string; // for database queries
  parameters?: Record<string, any>;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  userId: string;
  isDefault: boolean;
  isPublic: boolean;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  settings: DashboardSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardLayout {
  columns: number;
  rowHeight: number;
  margin: [number, number];
  containerPadding: [number, number];
  breakpoints: Record<string, number>;
  cols: Record<string, number>;
}

export interface DashboardSettings {
  theme: 'light' | 'dark' | 'auto';
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
  showGrid: boolean;
  allowResize: boolean;
  allowDrag: boolean;
  compactType: 'vertical' | 'horizontal' | null;
}

export interface WidgetData {
  widgetId: string;
  data: any;
  lastUpdated: Date;
  error?: string;
  loading: boolean;
}

export interface DashboardSnapshot {
  dashboardId: string;
  widgets: WidgetData[];
  generatedAt: Date;
}

// ============================================================================
// Dashboard Service Implementation
// ============================================================================

export class DashboardService {
  private widgetDataCache = new Map<string, WidgetData>();
  private refreshIntervals = new Map<string, NodeJS.Timeout>();

  /**
   * Create a new dashboard
   */
  async createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dashboard> {
    try {
      const newDashboard: Dashboard = {
        ...dashboard,
        id: `dashboard_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save dashboard (would use database in production)
      await this.saveDashboard(newDashboard);

      return newDashboard;
    } catch (error) {
      console.error('Error creating dashboard:', error);
      throw new Error(`Failed to create dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get dashboard by ID
   */
  async getDashboard(dashboardId: string): Promise<Dashboard | null> {
    try {
      return await this.loadDashboard(dashboardId);
    } catch (error) {
      console.error('Error getting dashboard:', error);
      throw new Error(`Failed to get dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update dashboard configuration
   */
  async updateDashboard(dashboardId: string, updates: Partial<Dashboard>): Promise<Dashboard> {
    try {
      const dashboard = await this.getDashboard(dashboardId);
      if (!dashboard) {
        throw new Error(`Dashboard not found: ${dashboardId}`);
      }

      const updatedDashboard: Dashboard = {
        ...dashboard,
        ...updates,
        updatedAt: new Date(),
      };

      await this.saveDashboard(updatedDashboard);

      // Restart refresh intervals if widgets changed
      if (updates.widgets) {
        this.stopWidgetRefresh(dashboardId);
        this.startWidgetRefresh(updatedDashboard);
      }

      return updatedDashboard;
    } catch (error) {
      console.error('Error updating dashboard:', error);
      throw new Error(`Failed to update dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add widget to dashboard
   */
  async addWidget(dashboardId: string, widget: Omit<DashboardWidget, 'id' | 'createdAt' | 'updatedAt'>): Promise<DashboardWidget> {
    try {
      const dashboard = await this.getDashboard(dashboardId);
      if (!dashboard) {
        throw new Error(`Dashboard not found: ${dashboardId}`);
      }

      const newWidget: DashboardWidget = {
        ...widget,
        id: `widget_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      dashboard.widgets.push(newWidget);
      await this.saveDashboard(dashboard);

      // Start refresh for the new widget
      this.startWidgetRefresh(dashboard, newWidget.id);

      return newWidget;
    } catch (error) {
      console.error('Error adding widget:', error);
      throw new Error(`Failed to add widget: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update widget configuration
   */
  async updateWidget(dashboardId: string, widgetId: string, updates: Partial<DashboardWidget>): Promise<DashboardWidget> {
    try {
      const dashboard = await this.getDashboard(dashboardId);
      if (!dashboard) {
        throw new Error(`Dashboard not found: ${dashboardId}`);
      }

      const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
      if (widgetIndex === -1) {
        throw new Error(`Widget not found: ${widgetId}`);
      }

      dashboard.widgets[widgetIndex] = {
        ...dashboard.widgets[widgetIndex],
        ...updates,
        updatedAt: new Date(),
      };

      await this.saveDashboard(dashboard);

      // Restart refresh if refresh interval changed
      if (updates.refreshInterval) {
        this.stopWidgetRefresh(dashboardId, widgetId);
        this.startWidgetRefresh(dashboard, widgetId);
      }

      return dashboard.widgets[widgetIndex];
    } catch (error) {
      console.error('Error updating widget:', error);
      throw new Error(`Failed to update widget: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove widget from dashboard
   */
  async removeWidget(dashboardId: string, widgetId: string): Promise<void> {
    try {
      const dashboard = await this.getDashboard(dashboardId);
      if (!dashboard) {
        throw new Error(`Dashboard not found: ${dashboardId}`);
      }

      dashboard.widgets = dashboard.widgets.filter(w => w.id !== widgetId);
      await this.saveDashboard(dashboard);

      // Stop refresh for the removed widget
      this.stopWidgetRefresh(dashboardId, widgetId);

      // Clear cached data
      this.widgetDataCache.delete(`${dashboardId}_${widgetId}`);
    } catch (error) {
      console.error('Error removing widget:', error);
      throw new Error(`Failed to remove widget: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get real-time widget data
   */
  async getWidgetData(dashboardId: string, widgetId: string, forceRefresh = false): Promise<WidgetData> {
    try {
      const cacheKey = `${dashboardId}_${widgetId}`;
      
      // Return cached data if available and not forcing refresh
      if (!forceRefresh && this.widgetDataCache.has(cacheKey)) {
        const cachedData = this.widgetDataCache.get(cacheKey)!;
        return cachedData;
      }

      const dashboard = await this.getDashboard(dashboardId);
      if (!dashboard) {
        throw new Error(`Dashboard not found: ${dashboardId}`);
      }

      const widget = dashboard.widgets.find(w => w.id === widgetId);
      if (!widget) {
        throw new Error(`Widget not found: ${widgetId}`);
      }

      // Generate widget data
      const widgetData = await this.generateWidgetData(widget);

      // Cache the data
      this.widgetDataCache.set(cacheKey, widgetData);

      return widgetData;
    } catch (error) {
      console.error('Error getting widget data:', error);
      const errorData: WidgetData = {
        widgetId,
        data: null,
        lastUpdated: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false,
      };
      return errorData;
    }
  }

  /**
   * Get complete dashboard snapshot with all widget data
   */
  async getDashboardSnapshot(dashboardId: string): Promise<DashboardSnapshot> {
    try {
      const dashboard = await this.getDashboard(dashboardId);
      if (!dashboard) {
        throw new Error(`Dashboard not found: ${dashboardId}`);
      }

      const widgets: WidgetData[] = [];

      for (const widget of dashboard.widgets) {
        if (widget.isVisible) {
          const widgetData = await this.getWidgetData(dashboardId, widget.id);
          widgets.push(widgetData);
        }
      }

      return {
        dashboardId,
        widgets,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error getting dashboard snapshot:', error);
      throw new Error(`Failed to get dashboard snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Start real-time refresh for dashboard widgets
   */
  startDashboardRefresh(dashboardId: string): void {
    this.getDashboard(dashboardId).then(dashboard => {
      if (dashboard) {
        this.startWidgetRefresh(dashboard);
      }
    });
  }

  /**
   * Stop real-time refresh for dashboard widgets
   */
  stopDashboardRefresh(dashboardId: string): void {
    this.stopWidgetRefresh(dashboardId);
  }

  /**
   * Get available widget templates
   */
  getWidgetTemplates(): Array<Omit<DashboardWidget, 'id' | 'position' | 'createdAt' | 'updatedAt'>> {
    return [
      {
        type: 'metric',
        title: 'Total Revenue',
        description: 'Total revenue across all subscriptions',
        config: {
          metric: {
            value: 0,
            unit: '$',
            trend: 'up',
            color: '#10b981',
            icon: 'dollar-sign',
          },
        },
        dataSource: {
          type: 'analytics',
          source: 'getTotalRevenue',
        },
        refreshInterval: 300, // 5 minutes
        isVisible: true,
      },
      {
        type: 'chart',
        title: 'Revenue Trends',
        description: 'Monthly revenue trends over time',
        config: {
          chart: {
            type: 'line',
            xAxis: 'period',
            yAxis: 'revenue',
            colors: ['#3b82f6'],
            showLegend: true,
            showGrid: true,
          },
        },
        dataSource: {
          type: 'analytics',
          source: 'getRevenueMetrics',
          timeRange: {
            startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
            endDate: new Date(),
          },
        },
        refreshInterval: 600, // 10 minutes
        isVisible: true,
      },
      {
        type: 'table',
        title: 'Recent Schools',
        description: 'Recently registered schools',
        config: {
          table: {
            columns: [
              { key: 'name', title: 'School Name', type: 'text', sortable: true },
              { key: 'plan', title: 'Plan', type: 'text' },
              { key: 'createdAt', title: 'Registered', type: 'date', sortable: true },
              { key: 'status', title: 'Status', type: 'text' },
            ],
            pageSize: 10,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          },
        },
        dataSource: {
          type: 'database',
          source: 'school',
          filters: { status: 'ACTIVE' },
        },
        refreshInterval: 900, // 15 minutes
        isVisible: true,
      },
      {
        type: 'progress',
        title: 'Monthly Target',
        description: 'Progress towards monthly revenue target',
        config: {
          progress: {
            current: 0,
            target: 100000,
            unit: '$',
            color: '#14b8a6',
            showPercentage: true,
          },
        },
        dataSource: {
          type: 'analytics',
          source: 'getMonthlyRevenue',
        },
        refreshInterval: 1800, // 30 minutes
        isVisible: true,
      },
    ];
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async generateWidgetData(widget: DashboardWidget): Promise<WidgetData> {
    try {
      let data: any;

      switch (widget.dataSource.type) {
        case 'analytics':
          data = await this.getAnalyticsData(widget.dataSource);
          break;
        case 'database':
          data = await this.getDatabaseData(widget.dataSource);
          break;
        case 'api':
          data = await this.getApiData(widget.dataSource);
          break;
        case 'custom':
          data = await this.getCustomData(widget.dataSource);
          break;
        default:
          throw new Error(`Unsupported data source type: ${widget.dataSource.type}`);
      }

      // Process data based on widget type
      const processedData = this.processWidgetData(widget, data);

      return {
        widgetId: widget.id,
        data: processedData,
        lastUpdated: new Date(),
        loading: false,
      };
    } catch (error) {
      return {
        widgetId: widget.id,
        data: null,
        lastUpdated: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false,
      };
    }
  }

  private async getAnalyticsData(dataSource: DataSourceConfig): Promise<any> {
    const timeRange = dataSource.timeRange || {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(),
    };

    switch (dataSource.source) {
      case 'getRevenueMetrics':
        return await analyticsService.getRevenueMetrics(timeRange);
      case 'getChurnAnalysis':
        return await analyticsService.getChurnAnalysis(timeRange);
      case 'getUsageAnalytics':
        return await analyticsService.getUsageAnalytics();
      case 'getKPIDashboard':
        return await analyticsService.getKPIDashboard();
      case 'getTotalRevenue':
        const revenueMetrics = await analyticsService.getRevenueMetrics(timeRange);
        return revenueMetrics.totalRevenue;
      case 'getMonthlyRevenue':
        const monthlyMetrics = await analyticsService.getRevenueMetrics(timeRange);
        return monthlyMetrics.monthlyRecurringRevenue;
      default:
        throw new Error(`Unknown analytics source: ${dataSource.source}`);
    }
  }

  private async getDatabaseData(dataSource: DataSourceConfig): Promise<any> {
    switch (dataSource.source) {
      case 'school':
        return await prisma.school.findMany({
          where: dataSource.filters,
          include: {
            enhancedSubscriptions: {
              include: { plan: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });
      case 'subscription':
        return await prisma.enhancedSubscription.findMany({
          where: dataSource.filters,
          include: {
            plan: true,
            school: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });
      default:
        throw new Error(`Unknown database source: ${dataSource.source}`);
    }
  }

  private async getApiData(dataSource: DataSourceConfig): Promise<any> {
    // Implementation for external API data fetching
    throw new Error('API data source not implemented');
  }

  private async getCustomData(dataSource: DataSourceConfig): Promise<any> {
    // Implementation for custom data sources
    throw new Error('Custom data source not implemented');
  }

  private processWidgetData(widget: DashboardWidget, rawData: any): any {
    switch (widget.type) {
      case 'metric':
        if (typeof rawData === 'number') {
          return {
            ...widget.config.metric,
            value: rawData,
          };
        }
        return rawData;

      case 'chart':
        if (rawData.revenueTrends) {
          return rawData.revenueTrends;
        }
        return rawData;

      case 'table':
        if (Array.isArray(rawData)) {
          return rawData.map(item => ({
            ...item,
            plan: item.enhancedSubscriptions?.[0]?.plan?.name || 'No Plan',
          }));
        }
        return rawData;

      case 'progress':
        if (typeof rawData === 'number') {
          return {
            ...widget.config.progress,
            current: rawData,
          };
        }
        return rawData;

      default:
        return rawData;
    }
  }

  private startWidgetRefresh(dashboard: Dashboard, specificWidgetId?: string): void {
    const widgets = specificWidgetId 
      ? dashboard.widgets.filter(w => w.id === specificWidgetId)
      : dashboard.widgets;

    for (const widget of widgets) {
      if (widget.isVisible && widget.refreshInterval > 0) {
        const intervalKey = `${dashboard.id}_${widget.id}`;
        
        // Clear existing interval
        if (this.refreshIntervals.has(intervalKey)) {
          clearInterval(this.refreshIntervals.get(intervalKey)!);
        }

        // Set new interval
        const interval = setInterval(async () => {
          try {
            await this.getWidgetData(dashboard.id, widget.id, true);
          } catch (error) {
            console.error(`Error refreshing widget ${widget.id}:`, error);
          }
        }, widget.refreshInterval * 1000);

        this.refreshIntervals.set(intervalKey, interval);
      }
    }
  }

  private stopWidgetRefresh(dashboardId: string, specificWidgetId?: string): void {
    if (specificWidgetId) {
      const intervalKey = `${dashboardId}_${specificWidgetId}`;
      if (this.refreshIntervals.has(intervalKey)) {
        clearInterval(this.refreshIntervals.get(intervalKey)!);
        this.refreshIntervals.delete(intervalKey);
      }
    } else {
      // Stop all intervals for this dashboard
      for (const [key, interval] of this.refreshIntervals.entries()) {
        if (key.startsWith(`${dashboardId}_`)) {
          clearInterval(interval);
          this.refreshIntervals.delete(key);
        }
      }
    }
  }

  // Storage methods (would be replaced with database operations)
  private async saveDashboard(dashboard: Dashboard): Promise<void> {
    // Implementation for saving dashboard to database
    console.log('Saving dashboard:', dashboard.name);
  }

  private async loadDashboard(dashboardId: string): Promise<Dashboard | null> {
    // Implementation for loading dashboard from database
    return null;
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();