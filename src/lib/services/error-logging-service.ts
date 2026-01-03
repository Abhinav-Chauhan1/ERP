/**
 * Error Logging Service
 * 
 * This service handles comprehensive error logging for the communication system.
 * It categorizes errors, logs them to the database, and triggers admin alerts
 * for critical issues.
 * 
 * Requirements: 14.1, 14.2, 14.5
 */

import { db } from '@/lib/db';
import { CommunicationChannel } from '@prisma/client';

// ============================================================================
// Types
// ============================================================================

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'LOW',           // Minor issues, no immediate action needed
  MEDIUM = 'MEDIUM',     // Issues that should be addressed soon
  HIGH = 'HIGH',         // Critical issues requiring immediate attention
  CRITICAL = 'CRITICAL'  // System-breaking issues
}

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  CONFIGURATION = 'CONFIGURATION',     // Configuration errors (missing env vars, invalid settings)
  AUTHENTICATION = 'AUTHENTICATION',   // Authentication/authorization errors
  VALIDATION = 'VALIDATION',           // Input validation errors
  RATE_LIMIT = 'RATE_LIMIT',          // Rate limiting errors
  NETWORK = 'NETWORK',                 // Network/connectivity errors
  API_ERROR = 'API_ERROR',             // External API errors
  DATABASE = 'DATABASE',               // Database errors
  UNKNOWN = 'UNKNOWN'                  // Unclassified errors
}

/**
 * Parameters for logging an error
 */
export interface LogErrorParams {
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  channel?: CommunicationChannel;
  errorCode?: string;
  errorDetails?: string;
  recipient?: string;
  userId?: string;
  messageId?: string;
  metadata?: Record<string, any>;
  stackTrace?: string;
}

/**
 * Error log entry
 */
export interface ErrorLogEntry {
  id: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  channel?: CommunicationChannel;
  errorCode?: string;
  errorDetails?: string;
  recipient?: string;
  userId?: string;
  messageId?: string;
  metadata?: Record<string, any>;
  stackTrace?: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Parameters for querying error logs
 */
export interface GetErrorLogsParams {
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  channel?: CommunicationChannel;
  resolved?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Error logs query result
 */
export interface ErrorLogsResult {
  logs: ErrorLogEntry[];
  total: number;
  hasMore: boolean;
}

/**
 * Error statistics
 */
export interface ErrorStatistics {
  totalErrors: number;
  errorsByCategory: Array<{
    category: ErrorCategory;
    count: number;
    percentage: number;
  }>;
  errorsBySeverity: Array<{
    severity: ErrorSeverity;
    count: number;
    percentage: number;
  }>;
  errorsByChannel: Array<{
    channel: CommunicationChannel;
    count: number;
    percentage: number;
  }>;
  unresolvedErrors: number;
  errorRate: number; // Errors per hour
}

// ============================================================================
// Error Categorization
// ============================================================================

/**
 * Categorize error based on error code and message
 * Requirement: 14.1
 * 
 * @param errorCode - Error code from provider
 * @param errorMessage - Error message
 * @returns Error category
 */
export function categorizeError(errorCode?: string, errorMessage?: string): ErrorCategory {
  if (!errorCode && !errorMessage) {
    return ErrorCategory.UNKNOWN;
  }

  const message = (errorMessage || '').toLowerCase();
  const code = errorCode || '';

  // Configuration errors
  if (
    code === '102' || // MSG91: Invalid auth key
    code === '103' || // MSG91: Invalid sender ID
    message.includes('not configured') ||
    message.includes('missing environment') ||
    message.includes('invalid configuration')
  ) {
    return ErrorCategory.CONFIGURATION;
  }

  // Authentication errors
  if (
    message.includes('authentication') ||
    message.includes('unauthorized') ||
    message.includes('invalid token') ||
    message.includes('access denied')
  ) {
    return ErrorCategory.AUTHENTICATION;
  }

  // Validation errors
  if (
    code === '104' || // MSG91: Invalid phone number
    code === '131026' || // WhatsApp: Invalid number
    message.includes('invalid phone') ||
    message.includes('invalid number') ||
    message.includes('validation failed') ||
    message.includes('invalid format')
  ) {
    return ErrorCategory.VALIDATION;
  }

  // Rate limit errors
  if (
    code === '133016' || // WhatsApp: Rate limit
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('quota exceeded')
  ) {
    return ErrorCategory.RATE_LIMIT;
  }

  // Network errors
  if (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('connection') ||
    message.includes('econnrefused') ||
    message.includes('enotfound')
  ) {
    return ErrorCategory.NETWORK;
  }

  // API errors
  if (
    code === '105' || // MSG91: Insufficient balance
    code === '106' || // MSG91: Invalid route
    code === '107' || // MSG91: DLT template not found
    code === '131047' || // WhatsApp: Re-engagement required
    code === '131051' || // WhatsApp: Unsupported message type
    code === '135000' || // WhatsApp: Generic error
    message.includes('api error') ||
    message.includes('service unavailable')
  ) {
    return ErrorCategory.API_ERROR;
  }

  // Database errors
  if (
    message.includes('database') ||
    message.includes('prisma') ||
    message.includes('query failed')
  ) {
    return ErrorCategory.DATABASE;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * Determine error severity based on category and error details
 * Requirement: 14.1
 * 
 * @param category - Error category
 * @param errorCode - Error code
 * @param errorMessage - Error message
 * @returns Error severity
 */
export function determineErrorSeverity(
  category: ErrorCategory,
  errorCode?: string,
  errorMessage?: string
): ErrorSeverity {
  // Critical errors that break the system
  if (
    category === ErrorCategory.CONFIGURATION ||
    category === ErrorCategory.DATABASE ||
    errorCode === '102' || // Invalid auth key
    errorCode === '103'    // Invalid sender ID
  ) {
    return ErrorSeverity.CRITICAL;
  }

  // High priority errors
  if (
    category === ErrorCategory.AUTHENTICATION ||
    errorCode === '105' || // Insufficient balance
    errorCode === '107'    // DLT template not found
  ) {
    return ErrorSeverity.HIGH;
  }

  // Medium priority errors
  if (
    category === ErrorCategory.RATE_LIMIT ||
    category === ErrorCategory.API_ERROR ||
    category === ErrorCategory.NETWORK
  ) {
    return ErrorSeverity.MEDIUM;
  }

  // Low priority errors
  if (category === ErrorCategory.VALIDATION) {
    return ErrorSeverity.LOW;
  }

  return ErrorSeverity.MEDIUM;
}

// ============================================================================
// Core Logging Functions
// ============================================================================

/**
 * Log an error to the database
 * Requirement: 14.1
 * 
 * Creates an error log entry and triggers admin alerts for critical errors.
 * 
 * @param params - Error logging parameters
 * @returns Created error log entry
 */
export async function logError(params: LogErrorParams): Promise<ErrorLogEntry> {
  try {
    const {
      message,
      category,
      severity,
      channel,
      errorCode,
      errorDetails,
      recipient,
      userId,
      messageId,
      metadata,
      stackTrace
    } = params;

    // Create error log entry
    const errorLog = await db.communicationErrorLog.create({
      data: {
        message,
        category,
        severity,
        channel: channel || null,
        errorCode: errorCode || null,
        errorDetails: errorDetails || null,
        recipient: recipient || null,
        userId: userId || null,
        messageId: messageId || null,
        metadata: metadata as any,
        stackTrace: stackTrace || null,
        resolved: false,
      },
    });

    // Trigger admin alert for high severity errors
    if (severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL) {
      await triggerAdminAlert({
        type: category,
        severity,
        message,
        errorCode,
        errorDetails,
        channel,
      });
    }

    return mapPrismaErrorLogToEntry(errorLog);
  } catch (error: any) {
    // If logging fails, at least log to console
    console.error('Failed to log error to database:', error);
    console.error('Original error:', params);

    // Return a minimal error log entry
    return {
      id: 'error',
      message: params.message,
      category: params.category,
      severity: params.severity,
      resolved: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

/**
 * Log an error with automatic categorization
 * Requirement: 14.1
 * 
 * Convenience function that automatically categorizes and determines severity.
 * 
 * @param error - Error object or message
 * @param context - Additional context
 * @returns Created error log entry
 */
export async function logErrorAuto(
  error: Error | string,
  context?: {
    channel?: CommunicationChannel;
    errorCode?: string;
    recipient?: string;
    userId?: string;
    messageId?: string;
    metadata?: Record<string, any>;
  }
): Promise<ErrorLogEntry> {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const stackTrace = typeof error === 'string' ? undefined : error.stack;
  const errorCode = context?.errorCode;

  // Automatically categorize and determine severity
  const category = categorizeError(errorCode, errorMessage);
  const severity = determineErrorSeverity(category, errorCode, errorMessage);

  return logError({
    message: errorMessage,
    category,
    severity,
    channel: context?.channel,
    errorCode,
    errorDetails: typeof error === 'string' ? undefined : error.toString(),
    recipient: context?.recipient,
    userId: context?.userId,
    messageId: context?.messageId,
    metadata: context?.metadata,
    stackTrace,
  });
}

/**
 * Get error logs with filtering
 * Requirement: 14.1
 * 
 * @param params - Filter parameters
 * @returns Error logs result with pagination
 */
export async function getErrorLogs(
  params: GetErrorLogsParams = {}
): Promise<ErrorLogsResult> {
  try {
    const {
      category,
      severity,
      channel,
      resolved,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = params;

    // Build where clause
    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (severity) {
      where.severity = severity;
    }

    if (channel) {
      where.channel = channel;
    }

    if (resolved !== undefined) {
      where.resolved = resolved;
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
    const total = await db.communicationErrorLog.count({ where });

    // Get logs with pagination
    const logs = await db.communicationErrorLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Map to ErrorLogEntry type
    const mappedLogs = logs.map(mapPrismaErrorLogToEntry);

    return {
      logs: mappedLogs,
      total,
      hasMore: offset + logs.length < total,
    };
  } catch (error: any) {
    console.error('Error getting error logs:', error);
    throw new Error(`Failed to get error logs: ${error.message}`);
  }
}

/**
 * Get error statistics
 * Requirement: 14.1, 14.5
 * 
 * @param startDate - Start date for statistics
 * @param endDate - End date for statistics
 * @returns Error statistics
 */
export async function getErrorStatistics(
  startDate?: Date,
  endDate?: Date
): Promise<ErrorStatistics> {
  try {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    // Get all error logs
    const logs = await db.communicationErrorLog.findMany({
      where,
      select: {
        category: true,
        severity: true,
        channel: true,
        resolved: true,
        createdAt: true,
      },
    });

    const totalErrors = logs.length;

    // Calculate errors by category
    const categoryMap = new Map<ErrorCategory, number>();
    logs.forEach(log => {
      categoryMap.set(log.category as ErrorCategory, (categoryMap.get(log.category as ErrorCategory) || 0) + 1);
    });

    const errorsByCategory = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
      percentage: totalErrors > 0 ? (count / totalErrors) * 100 : 0,
    }));

    // Calculate errors by severity
    const severityMap = new Map<ErrorSeverity, number>();
    logs.forEach(log => {
      severityMap.set(log.severity as ErrorSeverity, (severityMap.get(log.severity as ErrorSeverity) || 0) + 1);
    });

    const errorsBySeverity = Array.from(severityMap.entries()).map(([severity, count]) => ({
      severity,
      count,
      percentage: totalErrors > 0 ? (count / totalErrors) * 100 : 0,
    }));

    // Calculate errors by channel
    const channelMap = new Map<CommunicationChannel, number>();
    logs.forEach(log => {
      if (log.channel) {
        channelMap.set(log.channel, (channelMap.get(log.channel) || 0) + 1);
      }
    });

    const errorsByChannel = Array.from(channelMap.entries()).map(([channel, count]) => ({
      channel,
      count,
      percentage: totalErrors > 0 ? (count / totalErrors) * 100 : 0,
    }));

    // Calculate unresolved errors
    const unresolvedErrors = logs.filter(log => !log.resolved).length;

    // Calculate error rate (errors per hour)
    let errorRate = 0;
    if (startDate && endDate) {
      const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      errorRate = hours > 0 ? totalErrors / hours : 0;
    }

    return {
      totalErrors,
      errorsByCategory,
      errorsBySeverity,
      errorsByChannel,
      unresolvedErrors,
      errorRate,
    };
  } catch (error: any) {
    console.error('Error getting error statistics:', error);
    throw new Error(`Failed to get error statistics: ${error.message}`);
  }
}

/**
 * Mark an error as resolved
 * 
 * @param errorId - Error log ID
 * @param resolvedBy - User ID who resolved the error
 * @returns Updated error log entry
 */
export async function resolveError(
  errorId: string,
  resolvedBy: string
): Promise<ErrorLogEntry> {
  try {
    const errorLog = await db.communicationErrorLog.update({
      where: { id: errorId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy,
      },
    });

    return mapPrismaErrorLogToEntry(errorLog);
  } catch (error: any) {
    console.error('Error resolving error log:', error);
    throw new Error(`Failed to resolve error: ${error.message}`);
  }
}

// ============================================================================
// Admin Alert System
// ============================================================================

/**
 * Alert types for admin notifications
 */
export enum AlertType {
  CONFIG_ERROR = 'CONFIG_ERROR',
  BALANCE_LOW = 'BALANCE_LOW',
  TEMPLATE_ERROR = 'TEMPLATE_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  HIGH_ERROR_RATE = 'HIGH_ERROR_RATE',
  SERVICE_DOWN = 'SERVICE_DOWN',
}

/**
 * Parameters for triggering an admin alert
 */
interface TriggerAdminAlertParams {
  type: ErrorCategory | AlertType;
  severity: ErrorSeverity;
  message: string;
  errorCode?: string;
  errorDetails?: string;
  channel?: CommunicationChannel;
}

/**
 * Trigger an admin alert for critical errors
 * Requirement: 14.2, 14.5
 * 
 * Creates an in-app notification for administrators and optionally
 * sends an email alert for critical issues.
 * 
 * @param params - Alert parameters
 */
async function triggerAdminAlert(params: TriggerAdminAlertParams): Promise<void> {
  try {
    const { type, severity, message, errorCode, errorDetails, channel } = params;

    // Get all administrators
    const admins = await db.user.findMany({
      where: {
        role: 'ADMIN',
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (admins.length === 0) {
      console.warn('No administrators found to send alert');
      return;
    }

    // Create alert title and message
    const alertTitle = `${severity} Error: ${type}`;
    const alertMessage = `
${message}

${errorCode ? `Error Code: ${errorCode}` : ''}
${channel ? `Channel: ${channel}` : ''}
${errorDetails ? `Details: ${errorDetails}` : ''}

Please review and resolve this issue as soon as possible.
    `.trim();

    // Create in-app notifications for all admins
    const notificationPromises = admins.map(admin =>
      db.notification.create({
        data: {
          userId: admin.id,
          title: alertTitle,
          message: alertMessage,
          type: 'SYSTEM',
          isRead: false,
        },
      })
    );

    await Promise.all(notificationPromises);

    // For critical errors, also send email alerts
    if (severity === ErrorSeverity.CRITICAL) {
      // TODO: Implement email alert sending
      // This would use the email service to send alerts to admin emails
      console.log('Critical error alert sent to admins:', alertTitle);
    }
  } catch (error: any) {
    console.error('Failed to trigger admin alert:', error);
    // Don't throw - we don't want alert failures to break the main flow
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Map Prisma error log to ErrorLogEntry type
 * 
 * @param log - Prisma error log
 * @returns ErrorLogEntry
 */
function mapPrismaErrorLogToEntry(log: any): ErrorLogEntry {
  return {
    id: log.id,
    message: log.message,
    category: log.category as ErrorCategory,
    severity: log.severity as ErrorSeverity,
    channel: log.channel as CommunicationChannel | undefined,
    errorCode: log.errorCode || undefined,
    errorDetails: log.errorDetails || undefined,
    recipient: log.recipient || undefined,
    userId: log.userId || undefined,
    messageId: log.messageId || undefined,
    metadata: log.metadata || undefined,
    stackTrace: log.stackTrace || undefined,
    resolved: log.resolved,
    resolvedAt: log.resolvedAt || undefined,
    resolvedBy: log.resolvedBy || undefined,
    createdAt: log.createdAt,
    updatedAt: log.updatedAt,
  };
}

/**
 * Delete old error logs (for maintenance)
 * 
 * @param daysToKeep - Number of days to keep logs
 * @returns Number of deleted logs
 */
export async function deleteOldErrorLogs(daysToKeep: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await db.communicationErrorLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        resolved: true, // Only delete resolved errors
      },
    });

    return result.count;
  } catch (error: any) {
    console.error('Error deleting old error logs:', error);
    throw new Error(`Failed to delete old error logs: ${error.message}`);
  }
}
