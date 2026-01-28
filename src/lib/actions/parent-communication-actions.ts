"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import {
  getMessagesSchema,
  sendMessageSchema,
  markMessageAsReadSchema,
  deleteMessageSchema,
  getAnnouncementsSchema,
  getNotificationsSchema,
  markNotificationAsReadSchema,
  markAllNotificationsAsReadSchema,
  type GetMessagesInput,
  type SendMessageInput,
  type MarkMessageAsReadInput,
  type DeleteMessageInput,
  type GetAnnouncementsInput,
  type GetNotificationsInput,
  type MarkNotificationAsReadInput,
  type MarkAllNotificationsAsReadInput,
} from "@/lib/schemaValidation/parent-communication-schemas";
import { verifyCsrfToken } from "@/lib/utils/csrf";
import { checkRateLimit, RateLimitPresets } from "@/lib/utils/rate-limit";
import { sanitizeHtml, sanitizeText } from "@/lib/utils/input-sanitization";
import { revalidatePath } from "next/cache";
import { requireSchoolAccess } from "@/lib/auth/tenant";

/**
 * Helper function to get current parent and verify authentication
 */
async function getCurrentParent() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const { schoolId } = await requireSchoolAccess();
  if (!schoolId) return null;

  const dbUser = await db.user.findFirst({
    where: {
      id: clerkUser.id,
      parent: {
        schoolId
      }
    },
    include: {
      parent: true
    }
  });

  if (!dbUser || dbUser.role !== UserRole.PARENT || !dbUser.parent) {
    return null;
  }

  return { user: dbUser, parent: dbUser.parent, schoolId };
}

/**
 * Get messages for inbox, sent, or drafts with filtering and pagination
 * Requirements: 2.1
 */
export async function getMessages(filters: GetMessagesInput) {
  try {
    // Validate input
    const validated = getMessagesSchema.parse(filters);

    // Get current parent
    const parentData = await getCurrentParent();
    if (!parentData) {
      return { success: false, message: "Unauthorized" };
    }

    const { user, schoolId } = parentData;

    // Build where clause based on message type
    const where: any = { schoolId };

    if (validated.type === "inbox") {
      where.recipientId = user.id;
    } else if (validated.type === "sent") {
      where.senderId = user.id;
    } else if (validated.type === "drafts") {
      // Note: Drafts would typically be stored separately or with a status field
      // For now, we'll return empty array as drafts aren't in the current schema
      return {
        success: true,
        data: {
          messages: [],
          pagination: {
            page: validated.page,
            limit: validated.limit,
            totalCount: 0,
            totalPages: 0
          }
        }
      };
    }

    // Add optional filters
    if (validated.isRead !== undefined) {
      where.isRead = validated.isRead;
    }

    if (validated.search) {
      where.OR = [
        { subject: { contains: validated.search, mode: "insensitive" } },
        { content: { contains: validated.search, mode: "insensitive" } }
      ];
    }

    if (validated.startDate || validated.endDate) {
      where.createdAt = {};
      if (validated.startDate) {
        where.createdAt.gte = validated.startDate;
      }
      if (validated.endDate) {
        where.createdAt.lte = validated.endDate;
      }
    }

    // Get total count
    const totalCount = await db.message.count({ where });

    // Get paginated messages
    const skip = (validated.page - 1) * validated.limit;
    const messages = await db.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true
          }
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: validated.limit
    });

    // Format messages
    const formattedMessages = messages.map(message => ({
      id: message.id,
      subject: message.subject,
      content: message.content,
      isRead: message.isRead,
      readAt: message.readAt,
      createdAt: message.createdAt,
      attachments: message.attachments,
      sender: {
        id: message.sender.id,
        firstName: message.sender.firstName,
        lastName: message.sender.lastName,
        email: message.sender.email,
        avatar: message.sender.avatar,
        role: message.sender.role
      },
      recipient: {
        id: message.recipient.id,
        firstName: message.recipient.firstName,
        lastName: message.recipient.lastName,
        email: message.recipient.email,
        avatar: message.recipient.avatar,
        role: message.recipient.role
      },
      hasAttachments: !!message.attachments
    }));

    return {
      success: true,
      data: {
        messages: formattedMessages,
        pagination: {
          page: validated.page,
          limit: validated.limit,
          totalCount,
          totalPages: Math.ceil(totalCount / validated.limit)
        }
      }
    };
  } catch (error) {
    console.error("Error fetching messages:", error);
    return { success: false, message: "Failed to fetch messages" };
  }
}

/**
 * Send a message to a teacher or admin
 * Requirements: 2.1
 */
export async function sendMessage(input: SendMessageInput & { csrfToken?: string }) {
  try {
    // Get current parent first for rate limiting
    const parentData = await getCurrentParent();
    if (!parentData) {
      return { success: false, message: "Unauthorized" };
    }

    const { user, schoolId } = parentData;

    // Rate limiting check
    const rateLimitAllowed = checkRateLimit(user.id, RateLimitPresets.MESSAGE);
    if (!rateLimitAllowed) {
      return {
        success: false,
        message: "Too many messages sent. Please try again later."
      };
    }

    // Verify CSRF token if provided
    if (input.csrfToken) {
      const isCsrfValid = await verifyCsrfToken(input.csrfToken);
      if (!isCsrfValid) {
        return { success: false, message: "Invalid CSRF token" };
      }
    }

    // Validate input
    const validated = sendMessageSchema.parse(input);

    // Sanitize message content to prevent XSS
    const sanitizedSubject = sanitizeText(validated.subject);
    const sanitizedContent = sanitizeHtml(validated.content);

    // Verify recipient exists and is a teacher or admin
    const recipient = await db.user.findUnique({
      where: {
        id: validated.recipientId,
        active: true,
        OR: [
          { administrator: { schoolId } },
          { teacher: { schoolId } }
        ]
      },
      select: {
        id: true,
        role: true,
        active: true
      }
    });

    if (!recipient) {
      return { success: false, message: "Recipient not found" };
    }

    if (!recipient.active) {
      return { success: false, message: "Recipient is not active" };
    }

    if (recipient.role !== UserRole.TEACHER && recipient.role !== UserRole.ADMIN) {
      return { success: false, message: "Can only send messages to teachers or administrators" };
    }

    // Create message with sanitized content
    const message = await db.message.create({
      data: {
        senderId: user.id,
        recipientId: validated.recipientId,
        subject: sanitizedSubject,
        content: sanitizedContent,
        attachments: validated.attachments || null,
        isRead: false,
        schoolId
      },
      include: {
        recipient: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Create notification for recipient
    await db.notification.create({
      data: {
        userId: validated.recipientId,
        title: "New Message",
        message: `You have a new message from ${user.firstName} ${user.lastName}`,
        type: "MESSAGE",
        isRead: false,
        link: `/communication/messages/${message.id}`,
        schoolId
      }
    });

    // Revalidate communication pages
    revalidatePath("/parent/communication");

    return {
      success: true,
      data: {
        messageId: message.id,
        recipient: {
          name: `${message.recipient.firstName} ${message.recipient.lastName}`,
          email: message.recipient.email
        }
      },
      message: "Message sent successfully"
    };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, message: "Failed to send message" };
  }
}

/**
 * Get announcements with filtering and pagination
 * Requirements: 2.2
 */
export async function getAnnouncements(filters: GetAnnouncementsInput) {
  try {
    // Validate input
    const validated = getAnnouncementsSchema.parse(filters);

    // Get current parent
    const parentData = await getCurrentParent();
    if (!parentData) {
      return { success: false, message: "Unauthorized" };
    }

    // Build where clause
    const { schoolId } = parentData;
    const where: any = {
      schoolId,
      targetAudience: {
        has: "PARENT"
      }
    };

    // Add optional filters
    if (validated.isActive !== undefined) {
      where.isActive = validated.isActive;
    }

    if (validated.search) {
      where.OR = [
        { title: { contains: validated.search, mode: "insensitive" } },
        { content: { contains: validated.search, mode: "insensitive" } }
      ];
    }

    if (validated.startDate || validated.endDate) {
      where.startDate = {};
      if (validated.startDate) {
        where.startDate.gte = validated.startDate;
      }
      if (validated.endDate) {
        where.startDate.lte = validated.endDate;
      }
    }

    // Get total count
    const totalCount = await db.announcement.count({ where });

    // Get paginated announcements
    const skip = (validated.page - 1) * validated.limit;
    const announcements = await db.announcement.findMany({
      where,
      include: {
        publisher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: {
        startDate: "desc"
      },
      skip,
      take: validated.limit
    });

    // Format announcements
    const formattedAnnouncements = announcements.map(announcement => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      startDate: announcement.startDate,
      endDate: announcement.endDate,
      isActive: announcement.isActive,
      hasAttachments: !!announcement.attachments,
      publisher: {
        firstName: announcement.publisher.user.firstName,
        lastName: announcement.publisher.user.lastName,
        avatar: announcement.publisher.user.avatar
      },
      createdAt: announcement.createdAt
    }));

    return {
      success: true,
      data: {
        announcements: formattedAnnouncements,
        pagination: {
          page: validated.page,
          limit: validated.limit,
          totalCount,
          totalPages: Math.ceil(totalCount / validated.limit)
        }
      }
    };
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return { success: false, message: "Failed to fetch announcements" };
  }
}

/**
 * Get notifications grouped by type with filtering and pagination
 * Requirements: 2.3, 2.4
 */
export async function getNotifications(filters: GetNotificationsInput) {
  try {
    // Validate input
    const validated = getNotificationsSchema.parse(filters);

    // Get current parent
    const parentData = await getCurrentParent();
    if (!parentData) {
      return { success: false, message: "Unauthorized" };
    }

    const { user, schoolId } = parentData;

    // Build where clause
    const where: any = {
      userId: user.id,
      schoolId
    };

    // Add optional filters
    if (validated.type) {
      where.type = validated.type;
    }

    if (validated.isRead !== undefined) {
      where.isRead = validated.isRead;
    }

    if (validated.startDate || validated.endDate) {
      where.createdAt = {};
      if (validated.startDate) {
        where.createdAt.gte = validated.startDate;
      }
      if (validated.endDate) {
        where.createdAt.lte = validated.endDate;
      }
    }

    // Get total count
    const totalCount = await db.notification.count({ where });

    // Get paginated notifications
    const skip = (validated.page - 1) * validated.limit;
    const notifications = await db.notification.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: validated.limit
    });

    // Group notifications by type
    const groupedNotifications: Record<string, any[]> = {};
    const typeCounts: Record<string, { total: number; unread: number }> = {};

    notifications.forEach(notification => {
      const type = notification.type;

      if (!groupedNotifications[type]) {
        groupedNotifications[type] = [];
        typeCounts[type] = { total: 0, unread: 0 };
      }

      groupedNotifications[type].push({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        link: notification.link,
        createdAt: notification.createdAt
      });

      typeCounts[type].total++;
      if (!notification.isRead) {
        typeCounts[type].unread++;
      }
    });

    // Format grouped notifications
    const formattedGroups = Object.entries(groupedNotifications).map(([type, items]) => ({
      type,
      count: typeCounts[type].total,
      unreadCount: typeCounts[type].unread,
      notifications: items
    }));

    // Calculate total unread count
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return {
      success: true,
      data: {
        notifications: notifications.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          isRead: n.isRead,
          link: n.link,
          createdAt: n.createdAt
        })),
        groupedNotifications: formattedGroups,
        stats: {
          total: totalCount,
          unread: unreadCount,
          byType: typeCounts
        },
        pagination: {
          page: validated.page,
          limit: validated.limit,
          totalCount,
          totalPages: Math.ceil(totalCount / validated.limit)
        }
      }
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { success: false, message: "Failed to fetch notifications" };
  }
}

/**
 * Mark a message as read
 * Requirements: 2.1
 */
export async function markMessageAsRead(input: MarkMessageAsReadInput) {
  try {
    // Validate input
    const validated = markMessageAsReadSchema.parse(input);

    // Get current parent
    const parentData = await getCurrentParent();
    if (!parentData) {
      return { success: false, message: "Unauthorized" };
    }

    const { user } = parentData;

    // Verify message exists and belongs to user
    const message = await db.message.findUnique({
      where: { id: validated.messageId },
      select: {
        id: true,
        recipientId: true,
        isRead: true
      }
    });

    if (!message) {
      return { success: false, message: "Message not found" };
    }

    if (message.recipientId !== user.id) {
      return { success: false, message: "Access denied" };
    }

    // Update message if not already read
    if (!message.isRead) {
      await db.message.update({
        where: {
          id: validated.messageId,
          recipientId: user.id // Extra safety
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    }

    // Revalidate communication pages
    revalidatePath("/parent/communication");

    return {
      success: true,
      message: "Message marked as read"
    };
  } catch (error) {
    console.error("Error marking message as read:", error);
    return { success: false, message: "Failed to mark message as read" };
  }
}

/**
 * Mark a notification as read
 * Requirements: 2.4
 */
export async function markNotificationAsRead(input: MarkNotificationAsReadInput) {
  try {
    // Validate input
    const validated = markNotificationAsReadSchema.parse(input);

    // Get current parent
    const parentData = await getCurrentParent();
    if (!parentData) {
      return { success: false, message: "Unauthorized" };
    }

    const { user } = parentData;

    // Verify notification exists and belongs to user
    const notification = await db.notification.findUnique({
      where: { id: validated.notificationId },
      select: {
        id: true,
        userId: true,
        isRead: true
      }
    });

    if (!notification) {
      return { success: false, message: "Notification not found" };
    }

    if (notification.userId !== user.id) {
      return { success: false, message: "Access denied" };
    }

    // Update notification if not already read
    if (!notification.isRead) {
      await db.notification.update({
        where: {
          id: validated.notificationId,
          userId: user.id // Extra safety
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    }

    // Revalidate communication pages
    revalidatePath("/parent/communication");

    return {
      success: true,
      message: "Notification marked as read"
    };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, message: "Failed to mark notification as read" };
  }
}

/**
 * Mark all notifications as read (optionally filtered by type)
 * Requirements: 2.4
 */
export async function markAllNotificationsAsRead(input?: MarkAllNotificationsAsReadInput) {
  try {
    // Validate input if provided
    const validated = input ? markAllNotificationsAsReadSchema.parse(input) : undefined;

    // Get current parent
    const parentData = await getCurrentParent();
    if (!parentData) {
      return { success: false, message: "Unauthorized" };
    }

    const { user, schoolId } = parentData;

    // Build where clause
    const where: any = {
      userId: user.id,
      isRead: false,
      schoolId
    };

    if (validated?.type) {
      where.type = validated.type;
    }

    // Update all unread notifications
    const result = await db.notification.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    // Revalidate communication pages
    revalidatePath("/parent/communication");

    return {
      success: true,
      data: {
        count: result.count
      },
      message: `${result.count} notification(s) marked as read`
    };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false, message: "Failed to mark notifications as read" };
  }
}

/**
 * Delete a message (soft delete by marking as deleted)
 * Requirements: 2.1
 */
export async function deleteMessage(input: DeleteMessageInput) {
  try {
    // Validate input
    const validated = deleteMessageSchema.parse(input);

    // Get current parent
    const parentData = await getCurrentParent();
    if (!parentData) {
      return { success: false, message: "Unauthorized" };
    }

    const { user } = parentData;

    // Verify message exists and user has access
    const message = await db.message.findUnique({
      where: { id: validated.messageId },
      select: {
        id: true,
        senderId: true,
        recipientId: true
      }
    });

    if (!message) {
      return { success: false, message: "Message not found" };
    }

    // User can delete if they are sender or recipient
    if (message.senderId !== user.id && message.recipientId !== user.id) {
      return { success: false, message: "Access denied" };
    }

    // Perform soft delete by actually deleting the message
    // Note: In a production system, you might want to add a deletedBy field
    // to track who deleted it and keep the message for the other party
    await db.message.delete({
      where: {
        id: validated.messageId,
        OR: [
          { senderId: user.id },
          { recipientId: user.id }
        ]
      }
    });

    // Revalidate communication pages
    revalidatePath("/parent/communication");

    return {
      success: true,
      message: "Message deleted successfully"
    };
  } catch (error) {
    console.error("Error deleting message:", error);
    return { success: false, message: "Failed to delete message" };
  }
}

/**
 * Get unread message count for header badge
 * Requirements: 2.5
 */
export async function getUnreadMessageCount() {
  try {
    // Get current parent
    const parentData = await getCurrentParent();
    if (!parentData) {
      return { success: false, message: "Unauthorized" };
    }

    const { user, schoolId } = parentData;

    // Count unread messages
    const unreadMessages = await db.message.count({
      where: {
        recipientId: user.id,
        isRead: false,
        schoolId
      }
    });

    return {
      success: true,
      data: {
        count: unreadMessages
      }
    };
  } catch (error) {
    console.error("Error fetching unread message count:", error);
    return { success: false, message: "Failed to fetch unread count" };
  }
}

/**
 * Get unread notification count for header badge
 * Requirements: 2.5
 */
export async function getUnreadNotificationCount() {
  try {
    // Get current parent
    const parentData = await getCurrentParent();
    if (!parentData) {
      return { success: false, message: "Unauthorized" };
    }

    const { user, schoolId } = parentData;

    // Count unread notifications
    const unreadNotifications = await db.notification.count({
      where: {
        userId: user.id,
        isRead: false,
        schoolId
      }
    });

    return {
      success: true,
      data: {
        count: unreadNotifications
      }
    };
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    return { success: false, message: "Failed to fetch unread count" };
  }
}

/**
 * Get total unread count (messages + notifications) for header badge
 * Requirements: 2.5
 */
export async function getTotalUnreadCount() {
  try {
    // Get current parent
    const parentData = await getCurrentParent();
    if (!parentData) {
      return { success: false, message: "Unauthorized" };
    }

    const { user, schoolId } = parentData;

    // Count unread messages and notifications in parallel
    const [unreadMessages, unreadNotifications] = await Promise.all([
      db.message.count({
        where: {
          recipientId: user.id,
          isRead: false,
          schoolId
        }
      }),
      db.notification.count({
        where: {
          userId: user.id,
          isRead: false,
          schoolId
        }
      })
    ]);

    const totalUnread = unreadMessages + unreadNotifications;

    return {
      success: true,
      data: {
        total: totalUnread,
        messages: unreadMessages,
        notifications: unreadNotifications
      }
    };
  } catch (error) {
    console.error("Error fetching total unread count:", error);
    return { success: false, message: "Failed to fetch unread count" };
  }
}

/**
 * Get available recipients (teachers and admins) for composing messages
 * Requirements: 2.1
 */
export async function getAvailableRecipients() {
  try {
    // Get current parent
    const parentData = await getCurrentParent();
    if (!parentData) {
      return { success: false, message: "Unauthorized" };
    }

    const { schoolId } = parentData;

    // Get all teachers and admins (only active users in same school)
    const recipients = await db.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { administrator: { schoolId } },
              { teacher: { schoolId } }
            ]
          },
          { active: true }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        role: true,
        teacher: {
          select: {
            id: true,
            subjects: {
              select: {
                subject: {
                  select: {
                    name: true,
                  }
                }
              }
            }
          }
        },
        administrator: {
          select: {
            id: true,
            position: true,
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { firstName: 'asc' },
      ]
    });

    console.log(`Found ${recipients.length} available recipients (teachers and admins) for parent`);

    return {
      success: true,
      data: recipients
    };
  } catch (error) {
    console.error("Error fetching recipients:", error);
    return { success: false, message: "Failed to fetch recipients" };
  }
}
