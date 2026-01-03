"use server";

/**
 * Message History Actions
 * 
 * Server actions for logging and retrieving message history with analytics.
 * Tracks all bulk messaging operations including delivery statistics and costs.
 * 
 * Requirements: 11.5 - Message History and Analytics
 */

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth-helpers";
import { MessageType, MessageStatus } from "@prisma/client";

export interface MessageHistoryFilters {
  messageType?: MessageType;
  status?: MessageStatus;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  templateId?: string;
}

export interface MessageHistoryInput {
  messageType: MessageType;
  subject?: string;
  body: string;
  templateId?: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  smsCount: number;
  emailCount: number;
  smsCost: number;
  emailCost: number;
  totalCost: number;
  status: MessageStatus;
  recipientSelection: any;
  results?: any;
}

/**
 * Log a bulk message operation to history
 */
export async function logMessageHistory(data: MessageHistoryInput) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    const messageHistory = await db.messageHistory.create({
      data: {
        messageType: data.messageType,
        subject: data.subject,
        body: data.body,
        templateId: data.templateId,
        recipientCount: data.recipientCount,
        sentCount: data.sentCount,
        failedCount: data.failedCount,
        smsCount: data.smsCount,
        emailCount: data.emailCount,
        smsCost: data.smsCost,
        emailCost: data.emailCost,
        totalCost: data.totalCost,
        status: data.status,
        recipientSelection: data.recipientSelection,
        results: data.results,
        sentBy: dbUser.id,
      },
    });

    return {
      success: true,
      data: messageHistory,
    };
  } catch (error: any) {
    console.error("Error in logMessageHistory:", error);
    return { success: false, error: error.message || "Failed to log message history" };
  }
}

/**
 * Get message history with filters and pagination
 */
export async function getMessageHistory(
  filters?: MessageHistoryFilters,
  page: number = 1,
  pageSize: number = 50
) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    // Build where clause
    const where: any = {};

    if (filters?.messageType) {
      where.messageType = filters.messageType;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.templateId) {
      where.templateId = filters.templateId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.sentAt = {};
      if (filters.startDate) {
        where.sentAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.sentAt.lte = filters.endDate;
      }
    }

    if (filters?.search) {
      where.OR = [
        { subject: { contains: filters.search, mode: "insensitive" } },
        { body: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await db.messageHistory.count({ where });

    // Get paginated results
    const messages = await db.messageHistory.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        sentAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      success: true,
      data: {
        messages,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    };
  } catch (error: any) {
    console.error("Error in getMessageHistory:", error);
    return { success: false, error: error.message || "Failed to fetch message history" };
  }
}

/**
 * Get a single message history entry by ID
 */
export async function getMessageHistoryById(id: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    const message = await db.messageHistory.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!message) {
      return { success: false, error: "Message not found" };
    }

    return {
      success: true,
      data: message,
    };
  } catch (error: any) {
    console.error("Error in getMessageHistoryById:", error);
    return { success: false, error: error.message || "Failed to fetch message" };
  }
}

/**
 * Get message analytics and statistics
 */
export async function getMessageAnalytics(
  startDate?: Date,
  endDate?: Date
) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    // Build date filter
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.sentAt = {};
      if (startDate) {
        dateFilter.sentAt.gte = startDate;
      }
      if (endDate) {
        dateFilter.sentAt.lte = endDate;
      }
    }

    // Get aggregate statistics
    const [
      totalMessages,
      totalRecipients,
      totalSent,
      totalFailed,
      totalSMS,
      totalEmails,
      costStats,
      messagesByType,
      messagesByStatus,
      recentMessages,
    ] = await Promise.all([
      // Total messages sent
      db.messageHistory.count({ where: dateFilter }),
      
      // Total recipients
      db.messageHistory.aggregate({
        where: dateFilter,
        _sum: { recipientCount: true },
      }),
      
      // Total sent successfully
      db.messageHistory.aggregate({
        where: dateFilter,
        _sum: { sentCount: true },
      }),
      
      // Total failed
      db.messageHistory.aggregate({
        where: dateFilter,
        _sum: { failedCount: true },
      }),
      
      // Total SMS
      db.messageHistory.aggregate({
        where: dateFilter,
        _sum: { smsCount: true },
      }),
      
      // Total emails
      db.messageHistory.aggregate({
        where: dateFilter,
        _sum: { emailCount: true },
      }),
      
      // Cost statistics
      db.messageHistory.aggregate({
        where: dateFilter,
        _sum: {
          smsCost: true,
          emailCost: true,
          totalCost: true,
        },
      }),
      
      // Messages by type
      db.messageHistory.groupBy({
        by: ["messageType"],
        where: dateFilter,
        _count: true,
        _sum: {
          recipientCount: true,
          totalCost: true,
        },
      }),
      
      // Messages by status
      db.messageHistory.groupBy({
        by: ["status"],
        where: dateFilter,
        _count: true,
      }),
      
      // Recent messages (last 10)
      db.messageHistory.findMany({
        where: dateFilter,
        include: {
          sender: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          sentAt: "desc",
        },
        take: 10,
      }),
    ]);

    // Calculate success rate
    const totalAttempts = (totalSent._sum.sentCount || 0) + (totalFailed._sum.failedCount || 0);
    const successRate = totalAttempts > 0 
      ? ((totalSent._sum.sentCount || 0) / totalAttempts) * 100 
      : 0;

    return {
      success: true,
      data: {
        overview: {
          totalMessages,
          totalRecipients: totalRecipients._sum.recipientCount || 0,
          totalSent: totalSent._sum.sentCount || 0,
          totalFailed: totalFailed._sum.failedCount || 0,
          successRate: Math.round(successRate * 100) / 100,
        },
        channels: {
          sms: totalSMS._sum.smsCount || 0,
          email: totalEmails._sum.emailCount || 0,
        },
        costs: {
          smsCost: costStats._sum.smsCost || 0,
          emailCost: costStats._sum.emailCost || 0,
          totalCost: costStats._sum.totalCost || 0,
        },
        byType: messagesByType.map(item => ({
          type: item.messageType,
          count: item._count,
          recipients: item._sum.recipientCount || 0,
          cost: item._sum.totalCost || 0,
        })),
        byStatus: messagesByStatus.map(item => ({
          status: item.status,
          count: item._count,
        })),
        recentMessages: recentMessages.map(msg => ({
          id: msg.id,
          messageType: msg.messageType,
          subject: msg.subject,
          recipientCount: msg.recipientCount,
          sentCount: msg.sentCount,
          status: msg.status,
          totalCost: msg.totalCost,
          sentBy: `${msg.sender.firstName} ${msg.sender.lastName}`,
          sentAt: msg.sentAt,
        })),
      },
    };
  } catch (error: any) {
    console.error("Error in getMessageAnalytics:", error);
    return { success: false, error: error.message || "Failed to fetch analytics" };
  }
}

/**
 * Delete message history entry
 */
export async function deleteMessageHistory(id: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check permissions
    if (dbUser.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" };
    }

    await db.messageHistory.delete({
      where: { id },
    });

    return {
      success: true,
      message: "Message history deleted successfully",
    };
  } catch (error: any) {
    console.error("Error in deleteMessageHistory:", error);
    return { success: false, error: error.message || "Failed to delete message history" };
  }
}
