"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verifyCsrfToken } from "@/lib/utils/csrf";
import { checkRateLimit, RateLimitPresets } from "@/lib/utils/rate-limit";
import { sanitizeText, sanitizeHtml } from "@/lib/utils/input-sanitization";
import {
  normalizePagination,
  calculatePaginationMeta,
  monitoredQuery,
  MESSAGE_SELECT_LIST,
  ANNOUNCEMENT_SELECT_LIST,
  USER_SELECT_MINIMAL,
} from "@/lib/utils/query-optimization";

/**
 * Helper function to get current teacher and verify authentication
 */
async function getCurrentTeacher() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const dbUser = await db.user.findUnique({
    where: {
      id: userId
    },
    include: {
      teacher: true
    }
  });

  if (!dbUser || dbUser.role !== UserRole.TEACHER || !dbUser.teacher) {
    return null;
  }

  return { user: dbUser, teacher: dbUser.teacher };
}

// Validation schemas
const getMessagesSchema = z.object({
  type: z.enum(["inbox", "sent", "drafts"]).default("inbox"),
  isRead: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(50),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

const sendMessageSchema = z.object({
  recipientId: z.string().min(1, "Recipient is required"),
  subject: z.string().min(1, "Subject is required").max(200),
  content: z.string().min(1, "Message content is required"),
  attachments: z.string().nullable().optional(),
});

const markAsReadSchema = z.object({
  id: z.string().min(1, "Message ID is required"),
  type: z.enum(["message", "notification"]).default("message"),
});

const deleteMessageSchema = z.object({
  id: z.string().min(1, "Message ID is required"),
});

const getAnnouncementsSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(50),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

/**
 * Get messages for teacher (inbox, sent, or drafts) with filtering and pagination
 * Requirements: 3.1
 */
export async function getMessages(filters?: z.infer<typeof getMessagesSchema>) {
  try {
    // Get current teacher
    const teacherData = await getCurrentTeacher();
    if (!teacherData) {
      return { success: false, message: "Unauthorized" };
    }

    const { user } = teacherData;

    // Validate and set defaults
    const validated = getMessagesSchema.parse(filters || {});

    // Normalize pagination parameters
    const pagination = normalizePagination(validated.page, validated.limit);

    // Build where clause based on message type
    const where: any = {};

    if (validated.type === "inbox") {
      where.recipientId = user.id;
    } else if (validated.type === "sent") {
      where.senderId = user.id;
    } else if (validated.type === "drafts") {
      // Drafts would typically be stored separately or with a status field
      // For now, return empty array as drafts aren't in the current schema
      return {
        success: true,
        data: {
          messages: [],
          pagination: calculatePaginationMeta(0, pagination.page, pagination.limit)
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

    // Execute count and query in parallel with monitoring
    const [totalCount, messages] = await Promise.all([
      monitoredQuery(
        () => db.message.count({ where }),
        "teacher-messages-count"
      ),
      monitoredQuery(
        () => db.message.findMany({
          where,
          select: MESSAGE_SELECT_LIST,
          orderBy: {
            createdAt: "desc"
          },
          skip: pagination.skip,
          take: pagination.take
        }),
        "teacher-messages-list"
      )
    ]);

    return {
      success: true,
      data: {
        messages,
        pagination: calculatePaginationMeta(totalCount, pagination.page, pagination.limit)
      }
    };
  } catch (error) {
    console.error("Error fetching messages:", error);
    return { success: false, message: "Failed to fetch messages" };
  }
}

/**
 * Send a message to a parent, student, or admin
 * Requirements: 3.2, 10.1, 10.2, 10.4
 */
export async function sendMessage(input: z.infer<typeof sendMessageSchema> & { csrfToken?: string }) {
  try {
    // Get current teacher
    const teacherData = await getCurrentTeacher();
    if (!teacherData) {
      return { success: false, message: "Unauthorized" };
    }

    const { user } = teacherData;

    // Verify CSRF token
    if (input.csrfToken) {
      const isCsrfValid = await verifyCsrfToken(input.csrfToken);
      if (!isCsrfValid) {
        return { success: false, message: "Invalid CSRF token" };
      }
    }

    // Rate limiting for message sending
    const rateLimitKey = `message:${user.id}`;
    const rateLimitResult = checkRateLimit(rateLimitKey, RateLimitPresets.MESSAGE);
    if (!rateLimitResult) {
      return { success: false, message: "Too many messages sent. Please try again later." };
    }

    // Validate input
    const validated = sendMessageSchema.parse(input);

    // Sanitize message content
    const sanitizedSubject = sanitizeText(validated.subject);
    const sanitizedContent = sanitizeHtml(validated.content);

    // Verify recipient exists and is active
    const recipient = await db.user.findUnique({
      where: { id: validated.recipientId },
      select: {
        id: true,
        role: true,
        active: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });

    if (!recipient) {
      return { success: false, message: "Recipient not found" };
    }

    if (!recipient.active) {
      return { success: false, message: "Recipient is not active" };
    }

    // Create message
    const message = await db.message.create({
      data: {
        senderId: user.id,
        recipientId: validated.recipientId,
        subject: sanitizedSubject,
        content: sanitizedContent,
        attachments: validated.attachments || null,
        isRead: false
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
        link: `/communication/messages/${message.id}`
      }
    });

    // Revalidate communication pages
    revalidatePath("/teacher/communication");

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
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Failed to send message" };
  }
}

/**
 * Get announcements with filtering and pagination
 * Requirements: 3.3
 */
export async function getAnnouncements(filters?: z.infer<typeof getAnnouncementsSchema>) {
  try {
    // Get current teacher
    const teacherData = await getCurrentTeacher();
    if (!teacherData) {
      return { success: false, message: "Unauthorized" };
    }

    // Validate and set defaults
    const validated = getAnnouncementsSchema.parse(filters || {});

    // Normalize pagination parameters
    const pagination = normalizePagination(validated.page, validated.limit);

    // Build where clause
    const where: any = {
      targetAudience: {
        has: "TEACHER"
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

    console.log("[Teacher] Fetching announcements with where:", JSON.stringify(where));

    // Execute count and query in parallel with monitoring
    const [totalCount, announcements] = await Promise.all([
      monitoredQuery(
        () => db.announcement.count({ where }),
        "teacher-announcements-count"
      ),
      monitoredQuery(
        () => db.announcement.findMany({
          where,
          select: ANNOUNCEMENT_SELECT_LIST,
          orderBy: {
            startDate: "desc"
          },
          skip: pagination.skip,
          take: pagination.take
        }),
        "teacher-announcements-list"
      )
    ]);

    console.log(`[Teacher] Found ${totalCount} announcements.`);

    return {
      success: true,
      data: {
        announcements,
        pagination: calculatePaginationMeta(totalCount, pagination.page, pagination.limit)
      }
    };
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return { success: false, message: "Failed to fetch announcements" };
  }
}

/**
 * Mark a message or notification as read
 * Requirements: 3.4
 */
export async function markAsRead(input: z.infer<typeof markAsReadSchema>) {
  try {
    // Get current teacher
    const teacherData = await getCurrentTeacher();
    if (!teacherData) {
      return { success: false, message: "Unauthorized" };
    }

    const { user } = teacherData;

    // Validate input
    const validated = markAsReadSchema.parse(input);

    if (validated.type === "message") {
      // Verify message exists and belongs to user
      const message = await db.message.findUnique({
        where: { id: validated.id },
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
          where: { id: validated.id },
          data: {
            isRead: true,
            readAt: new Date()
          }
        });
      }
    } else if (validated.type === "notification") {
      // Verify notification exists and belongs to user
      const notification = await db.notification.findUnique({
        where: { id: validated.id },
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
          where: { id: validated.id },
          data: {
            isRead: true,
            readAt: new Date()
          }
        });
      }
    }

    // Revalidate communication pages
    revalidatePath("/teacher/communication");

    return {
      success: true,
      message: `${validated.type === "message" ? "Message" : "Notification"} marked as read`
    };
  } catch (error) {
    console.error("Error marking as read:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Failed to mark as read" };
  }
}

/**
 * Delete a message
 * Requirements: 3.5
 */
export async function deleteMessage(input: z.infer<typeof deleteMessageSchema>) {
  try {
    // Get current teacher
    const teacherData = await getCurrentTeacher();
    if (!teacherData) {
      return { success: false, message: "Unauthorized" };
    }

    const { user } = teacherData;

    // Validate input
    const validated = deleteMessageSchema.parse(input);

    // Verify message exists and user has access
    const message = await db.message.findUnique({
      where: { id: validated.id },
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

    // Delete the message
    await db.message.delete({
      where: { id: validated.id }
    });

    // Revalidate communication pages
    revalidatePath("/teacher/communication");

    return {
      success: true,
      message: "Message deleted successfully"
    };
  } catch (error) {
    console.error("Error deleting message:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Failed to delete message" };
  }
}

/**
 * Get unread message count for header badge
 * Requirements: 3.4
 */
export async function getUnreadMessageCount() {
  try {
    // Get current teacher
    const teacherData = await getCurrentTeacher();
    if (!teacherData) {
      return { success: false, message: "Unauthorized" };
    }

    const { user } = teacherData;

    // Count unread messages
    const unreadMessages = await db.message.count({
      where: {
        recipientId: user.id,
        isRead: false
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
 * Get list of contacts (users teacher can message)
 * Requirements: 3.2
 */
export async function getContacts() {
  try {
    // Get current teacher
    const teacherData = await getCurrentTeacher();
    if (!teacherData) {
      return { success: false, message: "Unauthorized" };
    }

    const { user } = teacherData;

    // Get all active users except current user (optimized with select)
    const users = await monitoredQuery(
      () => db.user.findMany({
        where: {
          id: {
            not: user.id
          },
          active: true
        },
        select: USER_SELECT_MINIMAL,
        orderBy: [
          { role: "asc" },
          { firstName: "asc" }
        ],
        take: 100 // Limit to prevent excessive data transfer
      }),
      "teacher-contacts-list"
    );

    return { success: true, data: users };
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return { success: false, message: "Failed to fetch contacts" };
  }
}

/**
 * Get message by ID
 * Requirements: 3.1
 */
export async function getMessageById(id: string) {
  try {
    // Get current teacher
    const teacherData = await getCurrentTeacher();
    if (!teacherData) {
      return { success: false, message: "Unauthorized" };
    }

    const { user } = teacherData;

    const message = await db.message.findUnique({
      where: { id },
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
      }
    });

    if (!message) {
      return { success: false, message: "Message not found" };
    }

    // Check if user is sender or recipient
    if (message.senderId !== user.id && message.recipientId !== user.id) {
      return { success: false, message: "Unauthorized to view this message" };
    }

    return { success: true, data: message };
  } catch (error) {
    console.error("Error fetching message:", error);
    return { success: false, message: "Failed to fetch message" };
  }
}
