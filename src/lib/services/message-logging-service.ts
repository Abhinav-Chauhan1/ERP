/**
 * Message Logging Service
 * 
 * This service handles logging of all messages sent through the communication system
 * (SMS, WhatsApp, Email, In-App). It provides functions to create logs, update status,
 * and retrieve logs with filtering. Message content is hashed for privacy.
 * 
 * Requirements: 4.1, 15.1, 17.2
 */

import { db } from '@/lib/db';
import { CommunicationChannel, MessageLogStatus, Prisma } from '@prisma/client';
import { MessageStatus, MessageLogEntry, CommunicationChannel as AppCommunicationChannel } from '@/lib/types/communication';
import crypto from 'crypto';
import { calculateMessageCost } from './cost-calculation-service';

// ============================================================================
// Types
// ============================================================================

/**
 * Parameters for logging a message
 */
export interface LogMessageParams {
  channel: CommunicationChannel;
  recipient: string;
  userId?: string;
  templateId?: string;
  subject?: string;
  body?: string;
  messageId?: string;
  metadata?: Record<string, any>;
  estimatedCost?: number;
  status?: MessageLogStatus;
}

/**
 * Parameters for updating message status
 */
export interface UpdateMessageStatusParams {
  messageId: string;
  status: MessageLogStatus;
  errorCode?: string;
  errorMessage?: string;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
}

/**
 * Parameters for filtering message logs
 */
export interface GetMessageLogsParams {
  channel?: CommunicationChannel;
  userId?: string;
  status?: MessageLogStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Message logs query result
 */
export interface MessageLogsResult {
  logs: MessageLogEntry[];
  total: number;
  hasMore: boolean;
}

// ============================================================================
// Privacy Functions
// ============================================================================

/**
 * Hash message content for privacy
 * Requirement: 17.2
 * 
 * Uses SHA-256 to create a one-way hash of the message content.
 * This allows us to verify message integrity without storing plain text.
 * 
 * @param content - Message content to hash
 * @returns Hashed content
 */
function hashMessageContent(content: string): string {
  if (!content) return '';

  try {
    const hash = crypto.createHash('sha256');
    hash.update(content);
    return hash.digest('hex');
  } catch (error) {
    console.error('Error hashing message content:', error);
    // Return a placeholder hash if hashing fails
    return 'hash_error';
  }
}

/**
 * Encrypt sensitive data (optional enhancement)
 * 
 * For future use if we need to decrypt message content.
 * Currently we use hashing which is one-way.
 * 
 * @param content - Content to encrypt
 * @param key - Encryption key
 * @returns Encrypted content
 */
function encryptContent(content: string, key: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(key, 'hex'),
      iv
    );

    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Error encrypting content:', error);
    throw new Error('Failed to encrypt content');
  }
}

// ============================================================================
// Core Logging Functions
// ============================================================================

/**
 * Log a message to the database
 * Requirement: 4.1, 15.1, 15.3
 * 
 * Creates a new message log entry with hashed content for privacy.
 * Automatically calculates and stores the estimated cost.
 * Returns the created log entry.
 * 
 * @param params - Message logging parameters
 * @returns Created message log entry
 */
export async function logMessage(
  params: LogMessageParams,
  schoolId?: string
): Promise<MessageLogEntry> {
  try {
    const {
      channel,
      recipient,
      userId,
      templateId,
      subject,
      body,
      messageId,
      metadata,
      estimatedCost,
    } = params;

    // Hash message body for privacy (Requirement 17.2)
    const hashedBody = body ? hashMessageContent(body) : null;

    // Calculate cost if not provided (Requirement 15.3)
    let finalCost = estimatedCost;
    if (finalCost === undefined) {
      const costResult = calculateMessageCost({
        channel,
        messageLength: body?.length || 0,
        recipientCount: 1
      });
      finalCost = costResult.costPerMessage;
    }

    // Create message log entry
    const log = await db.messageLog.create({
      data: {
        channel,
        recipient,
        userId: userId || null,
        templateId: templateId || null,
        subject: subject || null,
        body: hashedBody,
        status: params.status || MessageLogStatus.QUEUED,
        messageId: messageId || null,
        metadata: (metadata as any) || Prisma.DbNull,
        estimatedCost: finalCost || null,
        schoolId: schoolId!, // Add schoolId parameter (required)
        sentAt: null,
        deliveredAt: null,
        readAt: null,
        failedAt: null,
      },
    });

    return mapPrismaLogToEntry(log);
  } catch (error: any) {
    console.error('Error logging message:', error);
    throw new Error(`Failed to log message: ${error.message}`);
  }
}



/**
 * Update message status
 * Requirement: 4.1
 * 
 * Updates the status of a message log entry based on delivery updates
 * from MSG91, WhatsApp, or Email providers.
 * 
 * @param params - Status update parameters
 * @returns Updated message log entry
 */
export async function updateMessageStatus(
  params: UpdateMessageStatusParams
): Promise<MessageLogEntry> {
  try {
    const {
      messageId,
      status,
      errorCode,
      errorMessage,
      deliveredAt,
      readAt,
      failedAt,
    } = params;

    // Find the message log by external message ID
    const existingLog = await db.messageLog.findFirst({
      where: { messageId },
    });

    if (!existingLog) {
      throw new Error(`Message log not found for messageId: ${messageId}`);
    }

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    // Set timestamp based on status
    if (status === MessageLogStatus.SENT && !existingLog.sentAt) {
      updateData.sentAt = new Date();
    }

    if (status === MessageLogStatus.DELIVERED && deliveredAt) {
      updateData.deliveredAt = deliveredAt;
    }

    if (status === MessageLogStatus.READ && readAt) {
      updateData.readAt = readAt;
    }

    if (status === MessageLogStatus.FAILED) {
      updateData.failedAt = failedAt || new Date();
      updateData.errorCode = errorCode || null;
      updateData.errorMessage = errorMessage || null;
    }

    // Update the message log
    const updatedLog = await db.messageLog.update({
      where: { id: existingLog.id },
      data: updateData,
    });

    return mapPrismaLogToEntry(updatedLog);
  } catch (error: any) {
    console.error('Error updating message status:', error);
    throw new Error(`Failed to update message status: ${error.message}`);
  }
}

/**
 * Get message logs with filtering
 * Requirement: 15.1
 * 
 * Retrieves message logs from the database with optional filtering
 * by channel, user, status, and date range. Supports pagination.
 * 
 * @param params - Filter parameters
 * @returns Message logs result with pagination info
 */
export async function getMessageLogs(
  params: GetMessageLogsParams = {}
): Promise<MessageLogsResult> {
  try {
    const {
      channel,
      userId,
      status,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = params;

    // Build where clause
    const where: any = {};

    if (channel) {
      where.channel = channel;
    }

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
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

    // Get logs with pagination
    const logs = await db.messageLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Map to MessageLogEntry type
    const mappedLogs = logs.map(mapPrismaLogToEntry);

    return {
      logs: mappedLogs,
      total,
      hasMore: offset + logs.length < total,
    };
  } catch (error: any) {
    console.error('Error getting message logs:', error);
    throw new Error(`Failed to get message logs: ${error.message}`);
  }
}

/**
 * Get message log by ID
 * 
 * @param id - Message log ID
 * @returns Message log entry or null
 */
export async function getMessageLogById(
  id: string
): Promise<MessageLogEntry | null> {
  try {
    const log = await db.messageLog.findUnique({
      where: { id },
    });

    if (!log) {
      return null;
    }

    return mapPrismaLogToEntry(log);
  } catch (error: any) {
    console.error('Error getting message log by ID:', error);
    throw new Error(`Failed to get message log: ${error.message}`);
  }
}

/**
 * Get message log by external message ID
 * 
 * @param messageId - External message ID from provider
 * @returns Message log entry or null
 */
export async function getMessageLogByMessageId(
  messageId: string
): Promise<MessageLogEntry | null> {
  try {
    const log = await db.messageLog.findFirst({
      where: { messageId },
    });

    if (!log) {
      return null;
    }

    return mapPrismaLogToEntry(log);
  } catch (error: any) {
    console.error('Error getting message log by message ID:', error);
    throw new Error(`Failed to get message log: ${error.message}`);
  }
}

// ============================================================================
// Analytics Functions
// ============================================================================

/**
 * Get message statistics by channel
 * Requirement: 15.1
 * 
 * @param startDate - Start date for statistics
 * @param endDate - End date for statistics
 * @returns Statistics by channel
 */
export async function getMessageStatsByChannel(
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

    // Get all logs
    const logs = await db.messageLog.findMany({
      where,
      select: {
        channel: true,
        status: true,
        estimatedCost: true,
      },
    });

    // Group by channel
    const statsByChannel = new Map<
      CommunicationChannel,
      {
        total: number;
        sent: number;
        delivered: number;
        failed: number;
        totalCost: number;
      }
    >();

    for (const log of logs) {
      if (!statsByChannel.has(log.channel)) {
        statsByChannel.set(log.channel, {
          total: 0,
          sent: 0,
          delivered: 0,
          failed: 0,
          totalCost: 0,
        });
      }

      const stats = statsByChannel.get(log.channel)!;
      stats.total++;

      if (log.status === MessageLogStatus.SENT) {
        stats.sent++;
      } else if (log.status === MessageLogStatus.DELIVERED) {
        stats.delivered++;
      } else if (log.status === MessageLogStatus.FAILED) {
        stats.failed++;
      }

      if (log.estimatedCost) {
        stats.totalCost += Number(log.estimatedCost);
      }
    }

    // Convert to array
    return Array.from(statsByChannel.entries()).map(([channel, stats]) => ({
      channel,
      ...stats,
    }));
  } catch (error: any) {
    console.error('Error getting message stats by channel:', error);
    throw new Error(`Failed to get message stats: ${error.message}`);
  }
}

/**
 * Get delivery rate by channel
 * Requirement: 15.1
 * 
 * @param channel - Communication channel
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Delivery rate percentage
 */
export async function getDeliveryRate(
  channel: CommunicationChannel,
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  try {
    const where: any = { channel };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const total = await db.messageLog.count({ where });

    if (total === 0) {
      return 0;
    }

    const delivered = await db.messageLog.count({
      where: {
        ...where,
        status: {
          in: [MessageLogStatus.DELIVERED, MessageLogStatus.READ],
        },
      },
    });

    return (delivered / total) * 100;
  } catch (error: any) {
    console.error('Error getting delivery rate:', error);
    throw new Error(`Failed to get delivery rate: ${error.message}`);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Map Prisma message log to MessageLogEntry type
 * 
 * @param log - Prisma message log
 * @returns MessageLogEntry
 */
function mapPrismaLogToEntry(log: any): MessageLogEntry {
  return {
    id: log.id,
    channel: log.channel as unknown as AppCommunicationChannel,
    recipient: log.recipient,
    userId: log.userId || undefined,
    templateId: log.templateId || undefined,
    subject: log.subject || undefined,
    body: log.body || undefined,
    status: mapPrismaStatusToMessageStatus(log.status),
    messageId: log.messageId || undefined,
    errorCode: log.errorCode || undefined,
    errorMessage: log.errorMessage || undefined,
    sentAt: log.sentAt || undefined,
    deliveredAt: log.deliveredAt || undefined,
    readAt: log.readAt || undefined,
    failedAt: log.failedAt || undefined,
    estimatedCost: log.estimatedCost ? Number(log.estimatedCost) : undefined,
    metadata: log.metadata || undefined,
    createdAt: log.createdAt,
    updatedAt: log.updatedAt,
  };
}

/**
 * Map Prisma MessageLogStatus to MessageStatus enum
 * 
 * @param status - Prisma status
 * @returns MessageStatus
 */
function mapPrismaStatusToMessageStatus(
  status: MessageLogStatus
): MessageStatus {
  switch (status) {
    case MessageLogStatus.QUEUED:
      return MessageStatus.QUEUED;
    case MessageLogStatus.SENDING:
      return MessageStatus.SENDING;
    case MessageLogStatus.SENT:
      return MessageStatus.SENT;
    case MessageLogStatus.DELIVERED:
      return MessageStatus.DELIVERED;
    case MessageLogStatus.READ:
      return MessageStatus.READ;
    case MessageLogStatus.FAILED:
      return MessageStatus.FAILED;
    default:
      return MessageStatus.QUEUED;
  }
}

/**
 * Delete old message logs (for maintenance)
 * 
 * @param daysToKeep - Number of days to keep logs
 * @returns Number of deleted logs
 */
export async function deleteOldMessageLogs(
  daysToKeep: number = 90
): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await db.messageLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  } catch (error: any) {
    console.error('Error deleting old message logs:', error);
    throw new Error(`Failed to delete old message logs: ${error.message}`);
  }
}

