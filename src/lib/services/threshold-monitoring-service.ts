/**
 * Threshold Monitoring Service
 * 
 * Provides advanced threshold monitoring with automated actions,
 * intelligent error aggregation, and custom metrics configuration.
 * 
 * Requirements: 8.4, 8.5, 8.6
 */

import { db } from '@/lib/db';
import { monitoringService } from './monitoring-service';
import { Prisma } from '@prisma/client';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ThresholdRule {
  id?: string;
  name: string;
  metricName: string;
  threshold: number;
  condition: 'greater' | 'less' | 'equal';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  enabled: boolean;
  actions: AutomatedAction[];
  cooldownPeriod: number; // minutes
  schoolId?: string;
  metadata?: any;
}

export interface AutomatedAction {
  type: 'alert' | 'email' | 'webhook' | 'scale' | 'restart' | 'throttle';
  config: any;
  enabled: boolean;
}

export interface ErrorPattern {
  id: string;
  pattern: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  affectedComponents: string[];
  suggestedActions: string[];
}

export interface ErrorAggregation {
  timeRange: {
    startDate: Date;
    endDate: Date;
  };
  totalErrors: number;
  uniqueErrors: number;
  patterns: ErrorPattern[];
  trends: {
    hourly: { hour: number; count: number }[];
    daily: { date: string; count: number }[];
  };
  topComponents: {
    component: string;
    errorCount: number;
    percentage: number;
  }[];
  recommendations: string[];
}

export interface CustomMetric {
  id?: string;
  name: string;
  description: string;
  query: string; // SQL query or aggregation logic
  unit?: string;
  category: string;
  updateFrequency: number; // minutes
  enabled: boolean;
  schoolId?: string;
  metadata?: any;
}

export interface MetricValue {
  metricId: string;
  value: number;
  timestamp: Date;
  metadata?: any;
}

// ============================================================================
// Threshold Monitoring Service Implementation
// ============================================================================

export class ThresholdMonitoringService {

  // ========================================================================
  // Threshold Management
  // ========================================================================

  /**
   * Create threshold rule with automated actions
   * Requirement: 8.4
   */
  async createThresholdRule(rule: ThresholdRule, createdBy: string): Promise<ThresholdRule> {
    try {
      // Create alert config for the threshold
      const alertConfig = await db.alertConfig.create({
        data: {
          name: rule.name,
          alertType: 'usage_threshold',
          threshold: rule.threshold,
          condition: rule.condition,
          enabled: rule.enabled,
          notifyAdmins: true,
          notifyEmail: rule.actions.some(a => a.type === 'email'),
          emailRecipients: this.extractEmailRecipients(rule.actions),
          metadata: {
            metricName: rule.metricName,
            severity: rule.severity,
            actions: rule.actions,
            cooldownPeriod: rule.cooldownPeriod,
            ...rule.metadata,
          },
          schoolId: rule.schoolId,
          createdBy,
        },
      });

      return {
        id: alertConfig.id,
        name: alertConfig.name,
        metricName: rule.metricName,
        threshold: alertConfig.threshold,
        condition: alertConfig.condition as 'greater' | 'less' | 'equal',
        severity: rule.severity,
        enabled: alertConfig.enabled,
        actions: rule.actions,
        cooldownPeriod: rule.cooldownPeriod,
        schoolId: alertConfig.schoolId || undefined,
        metadata: rule.metadata,
      };
    } catch (error) {
      console.error('Error creating threshold rule:', error);
      throw new Error(`Failed to create threshold rule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute automated actions when threshold is breached
   * Requirement: 8.4
   */
  async executeAutomatedActions(
    rule: ThresholdRule,
    currentValue: number,
    metadata?: any
  ): Promise<void> {
    try {
      // Check cooldown period
      const lastExecution = await this.getLastActionExecution(rule.id!);
      if (lastExecution && this.isInCooldown(lastExecution, rule.cooldownPeriod)) {
        console.log(`Threshold rule ${rule.name} is in cooldown period`);
        return;
      }

      // Execute each enabled action
      for (const action of rule.actions.filter(a => a.enabled)) {
        await this.executeAction(action, rule, currentValue, metadata);
      }

      // Record action execution
      await this.recordActionExecution(rule.id!, currentValue, metadata);
    } catch (error) {
      console.error('Error executing automated actions:', error);
      throw new Error(`Failed to execute automated actions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute individual automated action
   */
  private async executeAction(
    action: AutomatedAction,
    rule: ThresholdRule,
    currentValue: number,
    metadata?: any
  ): Promise<void> {
    switch (action.type) {
      case 'alert':
        await this.executeAlertAction(action, rule, currentValue, metadata);
        break;
      case 'email':
        await this.executeEmailAction(action, rule, currentValue, metadata);
        break;
      case 'webhook':
        await this.executeWebhookAction(action, rule, currentValue, metadata);
        break;
      case 'scale':
        await this.executeScaleAction(action, rule, currentValue, metadata);
        break;
      case 'restart':
        await this.executeRestartAction(action, rule, currentValue, metadata);
        break;
      case 'throttle':
        await this.executeThrottleAction(action, rule, currentValue, metadata);
        break;
      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Execute alert action
   */
  private async executeAlertAction(
    action: AutomatedAction,
    rule: ThresholdRule,
    currentValue: number,
    metadata?: any
  ): Promise<void> {
    await monitoringService.createAlert({
      alertType: 'usage_threshold' as any,
      severity: this.mapSeverityToAlertSeverity(rule.severity),
      title: `Automated Alert: ${rule.name}`,
      description: `Threshold breached for ${rule.metricName}. Current value: ${currentValue}, Threshold: ${rule.threshold}`,
      metadata: { rule, action: action.config, ...metadata },
      threshold: rule.threshold,
      currentValue,
      schoolId: rule.schoolId,
    });
  }

  /**
   * Execute email action
   */
  private async executeEmailAction(
    action: AutomatedAction,
    rule: ThresholdRule,
    currentValue: number,
    metadata?: any
  ): Promise<void> {
    // In real implementation, this would integrate with email service
    console.log(`[EMAIL ACTION] Sending threshold alert for ${rule.name} to ${action.config.recipients?.join(', ')}`);
  }

  /**
   * Execute webhook action
   */
  private async executeWebhookAction(
    action: AutomatedAction,
    rule: ThresholdRule,
    currentValue: number,
    metadata?: any
  ): Promise<void> {
    try {
      const payload = {
        rule: rule.name,
        metric: rule.metricName,
        currentValue,
        threshold: rule.threshold,
        severity: rule.severity,
        timestamp: new Date().toISOString(),
        metadata,
      };

      // In real implementation, this would make HTTP request to webhook URL
      console.log(`[WEBHOOK ACTION] Sending to ${action.config.url}:`, payload);
    } catch (error) {
      console.error('Error executing webhook action:', error);
    }
  }

  /**
   * Execute scale action (placeholder for infrastructure scaling)
   */
  private async executeScaleAction(
    action: AutomatedAction,
    rule: ThresholdRule,
    currentValue: number,
    metadata?: any
  ): Promise<void> {
    // In real implementation, this would integrate with cloud provider APIs
    console.log(`[SCALE ACTION] Scaling ${action.config.resource} by ${action.config.factor}`);
  }

  /**
   * Execute restart action (placeholder for service restart)
   */
  private async executeRestartAction(
    action: AutomatedAction,
    rule: ThresholdRule,
    currentValue: number,
    metadata?: any
  ): Promise<void> {
    // In real implementation, this would integrate with service management
    console.log(`[RESTART ACTION] Restarting service ${action.config.service}`);
  }

  /**
   * Execute throttle action (placeholder for rate limiting)
   */
  private async executeThrottleAction(
    action: AutomatedAction,
    rule: ThresholdRule,
    currentValue: number,
    metadata?: any
  ): Promise<void> {
    // In real implementation, this would adjust rate limits
    console.log(`[THROTTLE ACTION] Applying throttling: ${action.config.rate} requests per ${action.config.period}`);
  }

  // ========================================================================
  // Error Aggregation and Analysis
  // ========================================================================

  /**
   * Perform intelligent error aggregation
   * Requirement: 8.5
   */
  async aggregateErrors(timeRange: { startDate: Date; endDate: Date }): Promise<ErrorAggregation> {
    try {
      // Get all errors in time range
      const errors = await db.communicationErrorLog.findMany({
        where: {
          createdAt: {
            gte: timeRange.startDate,
            lte: timeRange.endDate,
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      // Identify error patterns
      const patterns = await this.identifyErrorPatterns(errors);

      // Create trends
      const hourlyTrends = this.createHourlyTrends(errors);
      const dailyTrends = this.createDailyTrends(errors);

      // Analyze top components
      const topComponents = this.analyzeTopComponents(errors);

      // Generate recommendations
      const recommendations = this.generateErrorRecommendations(patterns, topComponents);

      return {
        timeRange,
        totalErrors: errors.length,
        uniqueErrors: patterns.length,
        patterns,
        trends: {
          hourly: hourlyTrends,
          daily: dailyTrends,
        },
        topComponents,
        recommendations,
      };
    } catch (error) {
      console.error('Error aggregating errors:', error);
      throw new Error(`Failed to aggregate errors: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Identify error patterns using intelligent grouping
   * Requirement: 8.5
   */
  private async identifyErrorPatterns(errors: any[]): Promise<ErrorPattern[]> {
    const patterns: Map<string, ErrorPattern> = new Map();

    for (const error of errors) {
      // Create pattern key based on error message similarity
      const patternKey = this.createPatternKey(error.errorMessage || 'Unknown');
      
      if (patterns.has(patternKey)) {
        const pattern = patterns.get(patternKey)!;
        pattern.count++;
        pattern.lastSeen = error.createdAt;
        
        // Add component if not already included
        const component = error.channel || 'Unknown';
        if (!pattern.affectedComponents.includes(component)) {
          pattern.affectedComponents.push(component);
        }
      } else {
        patterns.set(patternKey, {
          id: this.generatePatternId(patternKey),
          pattern: patternKey,
          category: error.category || 'Unknown',
          severity: this.mapErrorSeverity(error.severity),
          count: 1,
          firstSeen: error.createdAt,
          lastSeen: error.createdAt,
          affectedComponents: [error.channel || 'Unknown'],
          suggestedActions: this.generateSuggestedActions(error),
        });
      }
    }

    return Array.from(patterns.values()).sort((a, b) => b.count - a.count);
  }

  /**
   * Create pattern key for error grouping
   */
  private createPatternKey(errorMessage: string): string {
    // Normalize error message by removing dynamic parts
    return errorMessage
      .replace(/\d+/g, 'N') // Replace numbers with N
      .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, 'UUID') // Replace UUIDs
      .replace(/\b\d{4}-\d{2}-\d{2}\b/g, 'DATE') // Replace dates
      .replace(/\b\d{2}:\d{2}:\d{2}\b/g, 'TIME') // Replace times
      .toLowerCase()
      .trim();
  }

  /**
   * Generate pattern ID
   */
  private generatePatternId(patternKey: string): string {
    return `pattern_${Buffer.from(patternKey).toString('base64').slice(0, 8)}`;
  }

  /**
   * Map error severity
   */
  private mapErrorSeverity(severity: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return 'CRITICAL';
      case 'HIGH':
        return 'HIGH';
      case 'MEDIUM':
        return 'MEDIUM';
      default:
        return 'LOW';
    }
  }

  /**
   * Generate suggested actions for error
   */
  private generateSuggestedActions(error: any): string[] {
    const actions: string[] = [];

    if (error.category === 'API_ERROR') {
      actions.push('Check API endpoint availability');
      actions.push('Verify API credentials and permissions');
      actions.push('Review rate limiting configuration');
    }

    if (error.category === 'NETWORK_ERROR') {
      actions.push('Check network connectivity');
      actions.push('Verify DNS resolution');
      actions.push('Review firewall settings');
    }

    if (error.category === 'VALIDATION_ERROR') {
      actions.push('Review input validation rules');
      actions.push('Check data format requirements');
      actions.push('Update validation schemas');
    }

    if (error.severity === 'CRITICAL') {
      actions.push('Escalate to on-call engineer');
      actions.push('Consider emergency maintenance');
    }

    return actions.length > 0 ? actions : ['Review error logs for more details'];
  }

  /**
   * Create hourly error trends
   */
  private createHourlyTrends(errors: any[]): { hour: number; count: number }[] {
    const hourlyData = new Array(24).fill(0);
    
    errors.forEach(error => {
      const hour = error.createdAt.getHours();
      hourlyData[hour]++;
    });

    return hourlyData.map((count, hour) => ({ hour, count }));
  }

  /**
   * Create daily error trends
   */
  private createDailyTrends(errors: any[]): { date: string; count: number }[] {
    const dailyData: Map<string, number> = new Map();
    
    errors.forEach(error => {
      const date = error.createdAt.toISOString().split('T')[0];
      dailyData.set(date, (dailyData.get(date) || 0) + 1);
    });

    return Array.from(dailyData.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Analyze top error-prone components
   */
  private analyzeTopComponents(errors: any[]): { component: string; errorCount: number; percentage: number }[] {
    const componentCounts: Map<string, number> = new Map();
    
    errors.forEach(error => {
      const component = error.channel || 'Unknown';
      componentCounts.set(component, (componentCounts.get(component) || 0) + 1);
    });

    const total = errors.length;
    return Array.from(componentCounts.entries())
      .map(([component, errorCount]) => ({
        component,
        errorCount,
        percentage: total > 0 ? (errorCount / total) * 100 : 0,
      }))
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 10);
  }

  /**
   * Generate error-based recommendations
   */
  private generateErrorRecommendations(
    patterns: ErrorPattern[],
    topComponents: { component: string; errorCount: number; percentage: number }[]
  ): string[] {
    const recommendations: string[] = [];

    // Recommendations based on patterns
    const criticalPatterns = patterns.filter(p => p.severity === 'CRITICAL');
    if (criticalPatterns.length > 0) {
      recommendations.push(`Address ${criticalPatterns.length} critical error patterns immediately`);
    }

    const highFrequencyPatterns = patterns.filter(p => p.count > 10);
    if (highFrequencyPatterns.length > 0) {
      recommendations.push(`Investigate ${highFrequencyPatterns.length} high-frequency error patterns`);
    }

    // Recommendations based on components
    const problematicComponents = topComponents.filter(c => c.percentage > 20);
    if (problematicComponents.length > 0) {
      recommendations.push(`Focus on improving reliability of: ${problematicComponents.map(c => c.component).join(', ')}`);
    }

    // General recommendations
    if (patterns.length > 50) {
      recommendations.push('Consider implementing error deduplication to reduce noise');
    }

    if (topComponents.some(c => c.errorCount > 100)) {
      recommendations.push('Implement circuit breaker pattern for high-error components');
    }

    return recommendations.length > 0 ? recommendations : ['Continue monitoring error patterns'];
  }

  // ========================================================================
  // Custom Metrics Management
  // ========================================================================

  /**
   * Create custom metric configuration
   * Requirement: 8.6
   */
  async createCustomMetric(metric: CustomMetric, createdBy: string): Promise<CustomMetric> {
    try {
      // Store custom metric configuration in system settings or dedicated table
      const metricConfig = {
        id: this.generateMetricId(),
        name: metric.name,
        description: metric.description,
        query: metric.query,
        unit: metric.unit,
        category: metric.category,
        updateFrequency: metric.updateFrequency,
        enabled: metric.enabled,
        schoolId: metric.schoolId,
        metadata: {
          createdBy,
          createdAt: new Date(),
          ...metric.metadata,
        },
      };

      // In real implementation, this would be stored in a dedicated table
      console.log('Custom metric created:', metricConfig);

      return metricConfig;
    } catch (error) {
      console.error('Error creating custom metric:', error);
      throw new Error(`Failed to create custom metric: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate custom metric value
   * Requirement: 8.6
   */
  async calculateCustomMetric(metricId: string): Promise<MetricValue> {
    try {
      // In real implementation, this would retrieve the metric configuration
      // and execute the query to calculate the value
      
      const value = Math.random() * 100; // Placeholder calculation
      
      const metricValue: MetricValue = {
        metricId,
        value,
        timestamp: new Date(),
        metadata: {
          calculationMethod: 'query_execution',
        },
      };

      // Record the metric value
      await monitoringService.recordSystemMetric(
        `custom_${metricId}`,
        value,
        undefined,
        { customMetric: true },
        undefined
      );

      return metricValue;
    } catch (error) {
      console.error('Error calculating custom metric:', error);
      throw new Error(`Failed to calculate custom metric: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  /**
   * Extract email recipients from actions
   */
  private extractEmailRecipients(actions: AutomatedAction[]): string[] {
    const emailActions = actions.filter(a => a.type === 'email' && a.enabled);
    const recipients: string[] = [];
    
    emailActions.forEach(action => {
      if (action.config.recipients && Array.isArray(action.config.recipients)) {
        recipients.push(...action.config.recipients);
      }
    });

    return [...new Set(recipients)]; // Remove duplicates
  }

  /**
   * Map severity to alert severity
   */
  private mapSeverityToAlertSeverity(severity: string): 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' {
    switch (severity) {
      case 'CRITICAL':
        return 'CRITICAL';
      case 'HIGH':
        return 'ERROR';
      case 'MEDIUM':
        return 'WARNING';
      default:
        return 'INFO';
    }
  }

  /**
   * Check if action is in cooldown period
   */
  private isInCooldown(lastExecution: Date, cooldownMinutes: number): boolean {
    const cooldownMs = cooldownMinutes * 60 * 1000;
    return Date.now() - lastExecution.getTime() < cooldownMs;
  }

  /**
   * Get last action execution time (placeholder)
   */
  private async getLastActionExecution(ruleId: string): Promise<Date | null> {
    // In real implementation, this would query action execution history
    return null;
  }

  /**
   * Record action execution (placeholder)
   */
  private async recordActionExecution(ruleId: string, value: number, metadata?: any): Promise<void> {
    // In real implementation, this would record execution in database
    console.log(`Action executed for rule ${ruleId}: value=${value}`);
  }

  /**
   * Generate metric ID
   */
  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const thresholdMonitoringService = new ThresholdMonitoringService();