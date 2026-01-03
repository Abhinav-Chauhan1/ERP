/**
 * Monitoring Actions
 * 
 * Server actions for the monitoring dashboard including:
 * - Real-time message delivery metrics
 * - Error rate monitoring
 * - API usage tracking
 * - Alert configuration
 * 
 * Requirements: 14.4, 14.5
 */

'use server';

import { auth } from '@/auth';
import {
  getErrorLogs,
  getErrorStatistics,
  resolveError,
  ErrorCategory,
  ErrorSeverity,
  type ErrorLogsResult,
  type ErrorStatistics,
} from '@/lib/services/error-logging-service';
import {
  getMessageLogs,
  getMessageStatsByChannel,
  getDeliveryRate,
  type MessageLogsResult,
} from '@/lib/services/message-logging-service';
import { CommunicationChannel } from '@prisma/client';
import { db } from '@/lib/db';

// ============================================================================
// Types
// ============================================================================

/**
 * Real-time metrics for monitoring dashboard
 */
export interface RealTimeMetrics {
  // Message metrics
  messagesLast24Hours: number;
  messagesLastHour: number;
  activeChannels: CommunicationChannel[];
  
  // Error metrics
  errorsLast24Hours: number;
  errorsLastHour: number;
  errorRate: number; // Percentage
  criticalErrors: number;
  
  // Delivery metrics
  deliveryRateLast24Hours: number;
  averageDeliveryTime: number; // In seconds
  
  // API metrics
  apiCallsLast24Hours: number;
  apiCallsLastHour: number;
  apiErrorRate: number; // Percentage
}

/**
 * Channel health status
 */
export interface ChannelHealth {
  channel: CommunicationChannel;
  status: 'healthy' | 'degraded' | 'down';
  deliveryRate: number;
  errorRate: number;
  lastMessageAt?: Date;
  lastErrorAt?: Date;
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  id: string;
  name: string;
  type: 'error_rate' | 'delivery_rate' | 'api_error' | 'critical_error';
  threshold: number;
  enabled: boolean;
  notifyAdmins: boolean;
  notifyEmail: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Authentication Helper
// ============================================================================

async function requireAdmin() {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error('Unauthorized: Please sign in');
  }
  
  if (session.user.role !== 'ADMIN') {
    throw new Error('Forbidden: Admin access required');
  }
  
  return session.user;
}

// ============================================================================
// Real-Time Metrics
// ============================================================================

/**
 * Get real-time metrics for monitoring dashboard
 * Requirement: 14.4, 14.5
 * 
 * @returns Real-time metrics
 */
export async function getRealTimeMetrics(): Promise<RealTimeMetrics> {
  try {
    await requireAdmin();

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    // Get message counts
    const messagesLast24Hours = await db.messageLog.count({
      where: {
        createdAt: {
          gte: last24Hours,
        },
      },
    });

    const messagesLastHour = await db.messageLog.count({
      where: {
        createdAt: {
          gte: lastHour,
        },
      },
    });

    // Get active channels (channels with messages in last 24 hours)
    const activeChannelsData = await db.messageLog.groupBy({
      by: ['channel'],
      where: {
        createdAt: {
          gte: last24Hours,
        },
      },
    });
    const activeChannels = activeChannelsData.map(item => item.channel);

    // Get error counts
    const errorsLast24Hours = await db.communicationErrorLog.count({
      where: {
        createdAt: {
          gte: last24Hours,
        },
      },
    });

    const errorsLastHour = await db.communicationErrorLog.count({
      where: {
        createdAt: {
          gte: lastHour,
        },
      },
    });

    // Calculate error rate
    const errorRate = messagesLast24Hours > 0 
      ? (errorsLast24Hours / messagesLast24Hours) * 100 
      : 0;

    // Get critical errors
    const criticalErrors = await db.communicationErrorLog.count({
      where: {
        severity: 'CRITICAL',
        resolved: false,
      },
    });

    // Get delivery rate for last 24 hours
    const deliveredMessages = await db.messageLog.count({
      where: {
        createdAt: {
          gte: last24Hours,
        },
        status: {
          in: ['DELIVERED', 'READ'],
        },
      },
    });

    const deliveryRateLast24Hours = messagesLast24Hours > 0
      ? (deliveredMessages / messagesLast24Hours) * 100
      : 0;

    // Calculate average delivery time
    const deliveredMessagesWithTime = await db.messageLog.findMany({
      where: {
        createdAt: {
          gte: last24Hours,
        },
        deliveredAt: {
          not: null,
        },
      },
      select: {
        createdAt: true,
        deliveredAt: true,
      },
    });

    let averageDeliveryTime = 0;
    if (deliveredMessagesWithTime.length > 0) {
      const totalDeliveryTime = deliveredMessagesWithTime.reduce((sum, msg) => {
        const deliveryTime = msg.deliveredAt!.getTime() - msg.createdAt.getTime();
        return sum + deliveryTime;
      }, 0);
      averageDeliveryTime = totalDeliveryTime / deliveredMessagesWithTime.length / 1000; // Convert to seconds
    }

    // Get API call counts (from error logs with API_ERROR category)
    const apiCallsLast24Hours = messagesLast24Hours; // Approximate: each message = 1 API call
    const apiCallsLastHour = messagesLastHour;

    // Get API error rate
    const apiErrors = await db.communicationErrorLog.count({
      where: {
        createdAt: {
          gte: last24Hours,
        },
        category: 'API_ERROR',
      },
    });

    const apiErrorRate = apiCallsLast24Hours > 0
      ? (apiErrors / apiCallsLast24Hours) * 100
      : 0;

    return {
      messagesLast24Hours,
      messagesLastHour,
      activeChannels,
      errorsLast24Hours,
      errorsLastHour,
      errorRate,
      criticalErrors,
      deliveryRateLast24Hours,
      averageDeliveryTime,
      apiCallsLast24Hours,
      apiCallsLastHour,
      apiErrorRate,
    };
  } catch (error: any) {
    console.error('Error getting real-time metrics:', error);
    throw new Error(`Failed to get real-time metrics: ${error.message}`);
  }
}

/**
 * Get channel health status
 * Requirement: 14.4, 14.5
 * 
 * @returns Array of channel health statuses
 */
export async function getChannelHealth(): Promise<ChannelHealth[]> {
  try {
    await requireAdmin();

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const channels: CommunicationChannel[] = ['SMS', 'WHATSAPP', 'EMAIL', 'IN_APP'];
    const healthStatuses: ChannelHealth[] = [];

    for (const channel of channels) {
      // Get message count for this channel
      const messageCount = await db.messageLog.count({
        where: {
          channel,
          createdAt: {
            gte: last24Hours,
          },
        },
      });

      // Get delivery rate
      const deliveredCount = await db.messageLog.count({
        where: {
          channel,
          createdAt: {
            gte: last24Hours,
          },
          status: {
            in: ['DELIVERED', 'READ'],
          },
        },
      });

      const deliveryRate = messageCount > 0 ? (deliveredCount / messageCount) * 100 : 0;

      // Get error count
      const errorCount = await db.communicationErrorLog.count({
        where: {
          channel,
          createdAt: {
            gte: last24Hours,
          },
        },
      });

      const errorRate = messageCount > 0 ? (errorCount / messageCount) * 100 : 0;

      // Get last message time
      const lastMessage = await db.messageLog.findFirst({
        where: { channel },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });

      // Get last error time
      const lastError = await db.communicationErrorLog.findFirst({
        where: { channel },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });

      // Determine health status
      let status: 'healthy' | 'degraded' | 'down' = 'healthy';
      
      if (deliveryRate < 50 || errorRate > 50) {
        status = 'down';
      } else if (deliveryRate < 80 || errorRate > 20) {
        status = 'degraded';
      }

      healthStatuses.push({
        channel,
        status,
        deliveryRate,
        errorRate,
        lastMessageAt: lastMessage?.createdAt,
        lastErrorAt: lastError?.createdAt,
      });
    }

    return healthStatuses;
  } catch (error: any) {
    console.error('Error getting channel health:', error);
    throw new Error(`Failed to get channel health: ${error.message}`);
  }
}

// ============================================================================
// Error Monitoring
// ============================================================================

/**
 * Get error logs with filtering
 * Requirement: 14.1, 14.4
 * 
 * @param params - Filter parameters
 * @returns Error logs result
 */
export async function getErrorLogsAction(params: {
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  channel?: CommunicationChannel;
  resolved?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<ErrorLogsResult> {
  try {
    await requireAdmin();
    return await getErrorLogs(params);
  } catch (error: any) {
    console.error('Error getting error logs:', error);
    throw new Error(`Failed to get error logs: ${error.message}`);
  }
}

/**
 * Get error statistics
 * Requirement: 14.1, 14.5
 * 
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Error statistics
 */
export async function getErrorStatisticsAction(
  startDate?: Date,
  endDate?: Date
): Promise<ErrorStatistics> {
  try {
    await requireAdmin();
    return await getErrorStatistics(startDate, endDate);
  } catch (error: any) {
    console.error('Error getting error statistics:', error);
    throw new Error(`Failed to get error statistics: ${error.message}`);
  }
}

/**
 * Resolve an error
 * 
 * @param errorId - Error log ID
 * @returns Success status
 */
export async function resolveErrorAction(errorId: string): Promise<{ success: boolean }> {
  try {
    const user = await requireAdmin();
    await resolveError(errorId, user.id);
    return { success: true };
  } catch (error: any) {
    console.error('Error resolving error:', error);
    throw new Error(`Failed to resolve error: ${error.message}`);
  }
}

// ============================================================================
// Message Monitoring
// ============================================================================

/**
 * Get recent message logs
 * Requirement: 14.4
 * 
 * @param params - Filter parameters
 * @returns Message logs result
 */
export async function getRecentMessages(params: {
  channel?: CommunicationChannel;
  limit?: number;
}): Promise<MessageLogsResult> {
  try {
    await requireAdmin();
    
    return await getMessageLogs({
      channel: params.channel,
      limit: params.limit || 50,
      offset: 0,
    });
  } catch (error: any) {
    console.error('Error getting recent messages:', error);
    throw new Error(`Failed to get recent messages: ${error.message}`);
  }
}

/**
 * Get message statistics by channel
 * Requirement: 14.4, 14.5
 * 
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Message statistics by channel
 */
export async function getMessageStatsByChannelAction(
  startDate?: Date,
  endDate?: Date
): Promise<Array<{
  channel: CommunicationChannel;
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  totalCost: number;
}>> {
  try {
    await requireAdmin();
    return await getMessageStatsByChannel(startDate, endDate);
  } catch (error: any) {
    console.error('Error getting message stats:', error);
    throw new Error(`Failed to get message stats: ${error.message}`);
  }
}

// ============================================================================
// Time Series Data
// ============================================================================

/**
 * Get error time series data
 * Requirement: 14.5
 * 
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Time series data for errors
 */
export async function getErrorTimeSeriesData(
  startDate: Date,
  endDate: Date
): Promise<Array<{
  date: string;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}>> {
  try {
    await requireAdmin();

    // Get all errors in date range
    const errors = await db.communicationErrorLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        severity: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date
    const dataByDate = new Map<string, {
      total: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
    }>();

    errors.forEach(error => {
      const dateKey = error.createdAt.toISOString().split('T')[0];
      
      if (!dataByDate.has(dateKey)) {
        dataByDate.set(dateKey, {
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        });
      }

      const data = dataByDate.get(dateKey)!;
      data.total++;

      switch (error.severity) {
        case 'CRITICAL':
          data.critical++;
          break;
        case 'HIGH':
          data.high++;
          break;
        case 'MEDIUM':
          data.medium++;
          break;
        case 'LOW':
          data.low++;
          break;
      }
    });

    // Convert to array
    return Array.from(dataByDate.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
  } catch (error: any) {
    console.error('Error getting error time series data:', error);
    throw new Error(`Failed to get error time series data: ${error.message}`);
  }
}

/**
 * Get message time series data
 * Requirement: 14.5
 * 
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Time series data for messages
 */
export async function getMessageTimeSeriesData(
  startDate: Date,
  endDate: Date
): Promise<Array<{
  date: string;
  SMS: number;
  WHATSAPP: number;
  EMAIL: number;
  IN_APP: number;
}>> {
  try {
    await requireAdmin();

    // Get all messages in date range
    const messages = await db.messageLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        channel: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date
    const dataByDate = new Map<string, {
      SMS: number;
      WHATSAPP: number;
      EMAIL: number;
      IN_APP: number;
    }>();

    messages.forEach(message => {
      const dateKey = message.createdAt.toISOString().split('T')[0];
      
      if (!dataByDate.has(dateKey)) {
        dataByDate.set(dateKey, {
          SMS: 0,
          WHATSAPP: 0,
          EMAIL: 0,
          IN_APP: 0,
        });
      }

      const data = dataByDate.get(dateKey)!;
      data[message.channel]++;
    });

    // Convert to array
    return Array.from(dataByDate.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
  } catch (error: any) {
    console.error('Error getting message time series data:', error);
    throw new Error(`Failed to get message time series data: ${error.message}`);
  }
}
