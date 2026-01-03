/**
 * Message Analytics Actions
 * 
 * Server actions for fetching message analytics data including
 * message counts, costs, and delivery statistics.
 * 
 * Requirements: 15.2, 15.4, 15.5
 */

'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { CommunicationChannel, MessageLogStatus } from '@prisma/client';
import {
  getMessageStatsByChannel,
  getDeliveryRate,
  getMessageLogs
} from '@/lib/services/message-logging-service';
import {
  compareChannelCosts,
  calculateCostSavings,
  getAllChannelPricing
} from '@/lib/services/cost-calculation-service';

// ============================================================================
// Types
// ============================================================================

export interface MessageAnalyticsParams {
  startDate?: Date;
  endDate?: Date;
  channel?: CommunicationChannel;
}

export interface ChannelStats {
  channel: CommunicationChannel;
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  totalCost: number;
  deliveryRate: number;
}

export interface CostComparison {
  channel: CommunicationChannel;
  costPerMessage: number;
  totalCost: number;
  currency: string;
}

export interface AnalyticsSummary {
  totalMessages: number;
  totalCost: number;
  averageCostPerMessage: number;
  deliveryRate: number;
  channelBreakdown: ChannelStats[];
  costComparison: CostComparison[];
  dateRange: {
    start: Date;
    end: Date;
  };
}

export interface TimeSeriesData {
  date: string;
  [key: string]: string | number; // channel names as keys with message counts
}

export interface ExportData {
  logs: Array<{
    date: string;
    channel: string;
    recipient: string;
    status: string;
    cost: number;
    messageId?: string;
  }>;
  summary: AnalyticsSummary;
}

// ============================================================================
// Authorization
// ============================================================================

/**
 * Check if user is authorized to view analytics
 */
async function checkAuthorization(): Promise<void> {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error('Unauthorized: Please sign in');
  }

  // Only admins can view message analytics
  if (session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required');
  }
}

// ============================================================================
// Analytics Actions
// ============================================================================

/**
 * Get message analytics summary
 * Requirement: 15.2
 * 
 * @param params - Analytics parameters
 * @returns Analytics summary
 */
export async function getMessageAnalytics(
  params: MessageAnalyticsParams = {}
): Promise<AnalyticsSummary> {
  try {
    await checkAuthorization();

    const { startDate, endDate, channel } = params;

    // Get stats by channel
    const channelStats = await getMessageStatsByChannel(startDate, endDate);

    // Filter by channel if specified
    const filteredStats = channel
      ? channelStats.filter(stat => stat.channel === channel)
      : channelStats;

    // Calculate delivery rates for each channel
    const statsWithDeliveryRate = await Promise.all(
      filteredStats.map(async (stat) => {
        const deliveryRate = await getDeliveryRate(
          stat.channel,
          startDate,
          endDate
        );
        return {
          ...stat,
          deliveryRate
        };
      })
    );

    // Calculate totals
    const totalMessages = statsWithDeliveryRate.reduce(
      (sum, stat) => sum + stat.total,
      0
    );
    const totalCost = statsWithDeliveryRate.reduce(
      (sum, stat) => sum + stat.totalCost,
      0
    );
    const averageCostPerMessage = totalMessages > 0 
      ? totalCost / totalMessages 
      : 0;

    // Calculate overall delivery rate
    const totalDelivered = statsWithDeliveryRate.reduce(
      (sum, stat) => sum + stat.delivered,
      0
    );
    const overallDeliveryRate = totalMessages > 0
      ? (totalDelivered / totalMessages) * 100
      : 0;

    // Get cost comparison
    const costComparison = compareChannelCosts(160, 1);

    return {
      totalMessages,
      totalCost,
      averageCostPerMessage,
      deliveryRate: overallDeliveryRate,
      channelBreakdown: statsWithDeliveryRate,
      costComparison,
      dateRange: {
        start: startDate || new Date(0),
        end: endDate || new Date()
      }
    };
  } catch (error: any) {
    console.error('Error getting message analytics:', error);
    throw new Error(`Failed to get analytics: ${error.message}`);
  }
}

/**
 * Get time series data for charts
 * Requirement: 15.2
 * 
 * @param params - Analytics parameters
 * @returns Time series data grouped by date
 */
export async function getMessageTimeSeriesData(
  params: MessageAnalyticsParams = {}
): Promise<TimeSeriesData[]> {
  try {
    await checkAuthorization();

    const { startDate, endDate, channel } = params;

    // Build where clause
    const where: any = {};
    if (channel) {
      where.channel = channel;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    // Get all logs
    const logs = await db.messageLog.findMany({
      where,
      select: {
        channel: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Group by date and channel
    const dataByDate = new Map<string, Record<string, number>>();

    for (const log of logs) {
      const dateKey = log.createdAt.toISOString().split('T')[0];
      
      if (!dataByDate.has(dateKey)) {
        dataByDate.set(dateKey, {
          SMS: 0,
          WHATSAPP: 0,
          EMAIL: 0,
          IN_APP: 0
        });
      }

      const dayData = dataByDate.get(dateKey)!;
      dayData[log.channel] = (dayData[log.channel] || 0) + 1;
    }

    // Convert to array format
    return Array.from(dataByDate.entries()).map(([date, channels]) => ({
      date,
      ...channels
    }));
  } catch (error: any) {
    console.error('Error getting time series data:', error);
    throw new Error(`Failed to get time series data: ${error.message}`);
  }
}

/**
 * Get cost comparison data
 * Requirement: 15.4
 * 
 * @param messageLength - Length of message for SMS calculation
 * @param recipientCount - Number of recipients
 * @returns Cost comparison across channels
 */
export async function getCostComparisonData(
  messageLength: number = 160,
  recipientCount: number = 1
): Promise<CostComparison[]> {
  try {
    await checkAuthorization();

    return compareChannelCosts(messageLength, recipientCount);
  } catch (error: any) {
    console.error('Error getting cost comparison:', error);
    throw new Error(`Failed to get cost comparison: ${error.message}`);
  }
}

/**
 * Get cost savings analysis
 * Requirement: 15.4
 * 
 * @param fromChannel - Original channel
 * @param toChannel - New channel
 * @param messageCount - Number of messages
 * @returns Cost savings data
 */
export async function getCostSavingsAnalysis(
  fromChannel: CommunicationChannel,
  toChannel: CommunicationChannel,
  messageCount: number
): Promise<{
  savings: number;
  savingsPercentage: number;
  fromCost: number;
  toCost: number;
  currency: string;
}> {
  try {
    await checkAuthorization();

    return calculateCostSavings(fromChannel, toChannel, messageCount);
  } catch (error: any) {
    console.error('Error calculating cost savings:', error);
    throw new Error(`Failed to calculate cost savings: ${error.message}`);
  }
}

/**
 * Get channel pricing information
 * 
 * @returns All channel pricing configurations
 */
export async function getChannelPricingInfo() {
  try {
    await checkAuthorization();

    return getAllChannelPricing();
  } catch (error: any) {
    console.error('Error getting channel pricing:', error);
    throw new Error(`Failed to get channel pricing: ${error.message}`);
  }
}

/**
 * Export analytics data
 * Requirement: 15.5
 * 
 * @param params - Analytics parameters
 * @returns Export data with logs and summary
 */
export async function exportAnalyticsData(
  params: MessageAnalyticsParams = {}
): Promise<ExportData> {
  try {
    await checkAuthorization();

    const { startDate, endDate, channel } = params;

    // Get message logs
    const logsResult = await getMessageLogs({
      channel,
      startDate,
      endDate,
      limit: 10000 // Large limit for export
    });

    // Get summary
    const summary = await getMessageAnalytics(params);

    // Format logs for export
    const formattedLogs = logsResult.logs.map(log => ({
      date: log.createdAt.toISOString(),
      channel: log.channel,
      recipient: log.recipient,
      status: log.status,
      cost: log.estimatedCost || 0,
      messageId: log.messageId
    }));

    return {
      logs: formattedLogs,
      summary
    };
  } catch (error: any) {
    console.error('Error exporting analytics data:', error);
    throw new Error(`Failed to export data: ${error.message}`);
  }
}

/**
 * Get delivery statistics by status
 * 
 * @param params - Analytics parameters
 * @returns Statistics grouped by status
 */
export async function getDeliveryStatistics(
  params: MessageAnalyticsParams = {}
): Promise<Array<{
  status: MessageLogStatus;
  count: number;
  percentage: number;
}>> {
  try {
    await checkAuthorization();

    const { startDate, endDate, channel } = params;

    // Build where clause
    const where: any = {};
    if (channel) {
      where.channel = channel;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    // Get total count
    const total = await db.messageLog.count({ where });

    if (total === 0) {
      return [];
    }

    // Get counts by status
    const statusCounts = await db.messageLog.groupBy({
      by: ['status'],
      where,
      _count: {
        status: true
      }
    });

    return statusCounts.map(item => ({
      status: item.status,
      count: item._count.status,
      percentage: (item._count.status / total) * 100
    }));
  } catch (error: any) {
    console.error('Error getting delivery statistics:', error);
    throw new Error(`Failed to get delivery statistics: ${error.message}`);
  }
}
