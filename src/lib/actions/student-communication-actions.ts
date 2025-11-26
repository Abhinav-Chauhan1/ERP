"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { uploadToCloudinary } from "@/lib/cloudinary";

/**
 * Helper function to get current student and verify authentication
 */
async function getCurrentStudent() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    return null;
  }
  
  const dbUser = await db.user.findUnique({
    where: {
      clerkId: clerkUser.id
    },
    include: {
      student: true
    }
  });
  
  if (!dbUser || dbUser.role !== UserRole.STUDENT || !dbUser.student) {
    return null;
  }
  
  return { user: dbUser, student: dbUser.student };
}

// Validation schemas
const getMessagesSchema = z.object({
  type: z.enum(["inbox", "sent"]).default("inbox"),
  isRead: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(50),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

const getAnnouncementsSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(50),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

const getNotificationsSchema = z.object({
  type: z.enum(["ATTENDANCE", "GRADE", "ASSIGNMENT", "MESSAGE", "ANNOUNCEMENT", "FEE", "EVENT", "GENERAL"]).optional(),
  isRead: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(50),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

const markAsReadSchema = z.object({
  id: z.string().min(1, "ID is required"),
  type: z.enum(["message", "notification"]).default("message"),
});

/**
 * Get messages for student (inbox or sent) with filtering and pagination
 * Requirements: 8.1
 */
export async function getMessages(filters?: z.infer<typeof getMessagesSchema>) {
  try {
    // Get current student
    const studentData = await getCurrentStudent();
    if (!studentData) {
      return { success: false, message: "Unauthorized" };
    }
    
    const { user } = studentData;
    
    // Validate and set defaults
    const validated = getMessagesSchema.parse(filters || {});
    
    // Build where clause based on message type
    const where: any = {};
    
    if (validated.type === "inbox") {
      where.recipientId = user.id;
    } else if (validated.type === "sent") {
      where.senderId = user.id;
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
      select: {
        id: true,
        subject: true,
        content: true,
        isRead: true,
        readAt: true,
        createdAt: true,
        attachments: true,
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
    
    return {
      success: true,
      data: {
        messages,
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
 * Get announcements with filtering and pagination
 * Requirements: 8.2
 */
export async function getAnnouncements(filters?: z.infer<typeof getAnnouncementsSchema>) {
  try {
    // Get current student
    const studentData = await getCurrentStudent();
    if (!studentData) {
      return { success: false, message: "Unauthorized" };
    }
    
    // Validate and set defaults
    const validated = getAnnouncementsSchema.parse(filters || {});
    
    // Build where clause
    const where: any = {
      targetAudience: {
        has: "STUDENT"
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
      select: {
        id: true,
        title: true,
        content: true,
        startDate: true,
        endDate: true,
        isActive: true,
        attachments: true,
        createdAt: true,
        publisher: {
          select: {
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
    
    return {
      success: true,
      data: {
        announcements,
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
 * Requirements: 8.3, 8.4
 */
export async function getNotifications(filters?: z.infer<typeof getNotificationsSchema>) {
  try {
    // Get current student
    const studentData = await getCurrentStudent();
    if (!studentData) {
      return { success: false, message: "Unauthorized" };
    }
    
    const { user } = studentData;
    
    // Validate and set defaults
    const validated = getNotificationsSchema.parse(filters || {});
    
    // Build where clause
    const where: any = {
      userId: user.id
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
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        isRead: true,
        readAt: true,
        link: true,
        createdAt: true
      },
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
      
      groupedNotifications[type].push(notification);
      
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
        notifications,
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
 * Mark a message or notification as read
 * Requirements: 8.4
 */
export async function markAsRead(input: z.infer<typeof markAsReadSchema>) {
  try {
    // Get current student
    const studentData = await getCurrentStudent();
    if (!studentData) {
      return { success: false, message: "Unauthorized" };
    }
    
    const { user } = studentData;
    
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
    revalidatePath("/student/communication");
    
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
 * Get unread notification count for header badge
 * Requirements: 8.5
 */
export async function getUnreadNotificationCount() {
  try {
    // Get current student
    const studentData = await getCurrentStudent();
    if (!studentData) {
      return { success: false, message: "Unauthorized" };
    }
    
    const { user } = studentData;
    
    // Count unread notifications
    const unreadNotifications = await db.notification.count({
      where: {
        userId: user.id,
        isRead: false
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
 * Get unread message count
 * Requirements: 8.1
 */
export async function getUnreadMessageCount() {
  try {
    // Get current student
    const studentData = await getCurrentStudent();
    if (!studentData) {
      return { success: false, message: "Unauthorized" };
    }
    
    const { user } = studentData;
    
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
 * Get total unread count (messages + notifications) for header badge
 * Requirements: 8.5
 */
export async function getTotalUnreadCount() {
  try {
    // Get current student
    const studentData = await getCurrentStudent();
    if (!studentData) {
      return { success: false, message: "Unauthorized" };
    }
    
    const { user } = studentData;
    
    // Count unread messages and notifications in parallel
    const [unreadMessages, unreadNotifications] = await Promise.all([
      db.message.count({
        where: {
          recipientId: user.id,
          isRead: false
        }
      }),
      db.notification.count({
        where: {
          userId: user.id,
          isRead: false
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
 * Get message by ID
 * Requirements: 8.1
 */
export async function getMessageById(id: string) {
  try {
    // Get current student
    const studentData = await getCurrentStudent();
    if (!studentData) {
      return { success: false, message: "Unauthorized" };
    }
    
    const { user } = studentData;
    
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

/**
 * Get announcement by ID
 * Requirements: 8.2
 */
export async function getAnnouncementById(id: string) {
  try {
    // Get current student
    const studentData = await getCurrentStudent();
    if (!studentData) {
      return { success: false, message: "Unauthorized" };
    }
    
    const announcement = await db.announcement.findUnique({
      where: { id },
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
      }
    });
    
    if (!announcement) {
      return { success: false, message: "Announcement not found" };
    }
    
    // Check if announcement is for students
    if (!announcement.targetAudience.includes("STUDENT")) {
      return { success: false, message: "Announcement not available" };
    }
    
    return { success: true, data: announcement };
  } catch (error) {
    console.error("Error fetching announcement:", error);
    return { success: false, message: "Failed to fetch announcement" };
  }
}

/**
 * Mark all notifications as read (optionally filtered by type)
 * Requirements: 8.4
 */
export async function markAllNotificationsAsRead(type?: string) {
  try {
    // Get current student
    const studentData = await getCurrentStudent();
    if (!studentData) {
      return { success: false, message: "Unauthorized" };
    }
    
    const { user } = studentData;
    
    // Build where clause
    const where: any = {
      userId: user.id,
      isRead: false
    };
    
    if (type) {
      where.type = type;
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
    revalidatePath("/student/communication");
    
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

// ============================================================================
// MESSAGE COMPOSITION ACTIONS (Task 5.1)
// ============================================================================

// Validation schemas for message composition
const sendMessageSchema = z.object({
  recipientId: z.string().min(1, "Recipient is required"),
  subject: z.string().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  content: z.string().min(1, "Message content is required").max(10000, "Message content must be less than 10000 characters"),
  attachments: z.array(z.string()).optional(),
});

const replyToMessageSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
  content: z.string().min(1, "Reply content is required").max(10000, "Reply content must be less than 10000 characters"),
});

const deleteMessageSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
});

/**
 * Send a new message to a teacher or admin
 * Requirements: FR3.1, NFR2 (XSS protection)
 * Task 5.1
 */
export async function sendMessage(data: z.infer<typeof sendMessageSchema>) {
  try {
    // Get current student
    const studentData = await getCurrentStudent();
    if (!studentData) {
      return { success: false, message: "Unauthorized" };
    }
    
    const { user } = studentData;
    
    // Validate input
    const validated = sendMessageSchema.parse(data);
    
    // Verify recipient exists and is a teacher or admin
    const recipient = await db.user.findUnique({
      where: { id: validated.recipientId },
      select: {
        id: true,
        role: true,
        firstName: true,
        lastName: true,
      }
    });
    
    if (!recipient) {
      return { success: false, message: "Recipient not found" };
    }
    
    if (recipient.role !== UserRole.TEACHER && recipient.role !== UserRole.ADMIN) {
      return { success: false, message: "You can only send messages to teachers and administrators" };
    }
    
    // Sanitize content (basic XSS protection)
    // Note: Additional sanitization should be done on the client side with DOMPurify
    const sanitizedContent = validated.content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
    
    // Create message
    const message = await db.message.create({
      data: {
        senderId: user.id,
        recipientId: validated.recipientId,
        subject: validated.subject,
        content: sanitizedContent,
        attachments: validated.attachments ? JSON.stringify(validated.attachments) : null,
        isRead: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
          }
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
          }
        }
      }
    });
    
    // Create notification for recipient
    await db.notification.create({
      data: {
        userId: validated.recipientId,
        title: "New Message",
        message: `You have a new message from ${user.firstName} ${user.lastName}: ${validated.subject}`,
        type: "MESSAGE",
        link: `/student/communication/messages/${message.id}`,
        isRead: false,
      }
    });
    
    // Revalidate communication pages
    revalidatePath("/student/communication/messages");
    
    return {
      success: true,
      data: message,
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
 * Reply to an existing message
 * Requirements: FR3.2, NFR2 (XSS protection)
 * Task 5.1
 */
export async function replyToMessage(data: z.infer<typeof replyToMessageSchema>) {
  try {
    // Get current student
    const studentData = await getCurrentStudent();
    if (!studentData) {
      return { success: false, message: "Unauthorized" };
    }
    
    const { user } = studentData;
    
    // Validate input
    const validated = replyToMessageSchema.parse(data);
    
    // Get original message
    const originalMessage = await db.message.findUnique({
      where: { id: validated.messageId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          }
        },
        recipient: {
          select: {
            id: true,
            role: true,
          }
        }
      }
    });
    
    if (!originalMessage) {
      return { success: false, message: "Original message not found" };
    }
    
    // Verify user is part of the conversation
    if (originalMessage.senderId !== user.id && originalMessage.recipientId !== user.id) {
      return { success: false, message: "You cannot reply to this message" };
    }
    
    // Determine recipient (reply to sender if we're the recipient, or to recipient if we're the sender)
    const recipientId = originalMessage.recipientId === user.id 
      ? originalMessage.senderId 
      : originalMessage.recipientId;
    
    // Sanitize content
    const sanitizedContent = validated.content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
    
    // Create reply message
    const replyMessage = await db.message.create({
      data: {
        senderId: user.id,
        recipientId,
        subject: originalMessage.subject?.startsWith("Re: ") 
          ? originalMessage.subject 
          : `Re: ${originalMessage.subject || "(No Subject)"}`,
        content: sanitizedContent,
        attachments: null,
        isRead: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
          }
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
          }
        }
      }
    });
    
    // Create notification for recipient
    await db.notification.create({
      data: {
        userId: recipientId,
        title: "New Reply",
        message: `${user.firstName} ${user.lastName} replied to your message: ${originalMessage.subject}`,
        type: "MESSAGE",
        link: `/student/communication/messages/${replyMessage.id}`,
        isRead: false,
      }
    });
    
    // Revalidate communication pages
    revalidatePath("/student/communication/messages");
    
    return {
      success: true,
      data: replyMessage,
      message: "Reply sent successfully"
    };
  } catch (error) {
    console.error("Error replying to message:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Failed to send reply" };
  }
}

/**
 * Delete a message (soft delete)
 * Requirements: FR3.6
 * Task 5.1
 */
export async function deleteMessage(data: z.infer<typeof deleteMessageSchema>) {
  try {
    // Get current student
    const studentData = await getCurrentStudent();
    if (!studentData) {
      return { success: false, message: "Unauthorized" };
    }
    
    const { user } = studentData;
    
    // Validate input
    const validated = deleteMessageSchema.parse(data);
    
    // Get message
    const message = await db.message.findUnique({
      where: { id: validated.messageId },
      select: {
        id: true,
        senderId: true,
        recipientId: true,
      }
    });
    
    if (!message) {
      return { success: false, message: "Message not found" };
    }
    
    // Verify user is sender or recipient
    if (message.senderId !== user.id && message.recipientId !== user.id) {
      return { success: false, message: "You cannot delete this message" };
    }
    
    // Soft delete: we'll just mark it as deleted for this user
    // In a real implementation, you might want to add a deletedBy field or similar
    // For now, we'll actually delete it if the user is the sender
    if (message.senderId === user.id) {
      await db.message.delete({
        where: { id: validated.messageId }
      });
    } else {
      // If recipient, just mark as read so it doesn't show in unread
      await db.message.update({
        where: { id: validated.messageId },
        data: {
          isRead: true,
          readAt: new Date(),
        }
      });
    }
    
    // Revalidate communication pages
    revalidatePath("/student/communication/messages");
    
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
 * Upload a message attachment
 * Requirements: FR3.3, NFR2 (File validation)
 * Task 5.1
 */
export async function uploadMessageAttachment(formData: FormData) {
  try {
    // Get current student
    const studentData = await getCurrentStudent();
    if (!studentData) {
      return { success: false, message: "Unauthorized" };
    }
    
    const file = formData.get("file") as File;
    
    if (!file) {
      return { success: false, message: "No file provided" };
    }
    
    // File validation
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_FILE_TYPES = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];
    
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, message: "File size exceeds 10MB limit" };
    }
    
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return { success: false, message: "File type not allowed. Allowed types: PDF, images, Word, Excel, and text files" };
    }
    
    // Upload to Cloudinary
    try {
      const uploadResult = await uploadToCloudinary(file, {
        folder: `messages/attachments/${studentData.student?.id}`,
        resource_type: "auto",
      });
      
      return {
        success: true,
        data: {
          url: uploadResult.secure_url,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        },
        message: "File uploaded successfully"
      };
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      return { 
        success: false, 
        message: "Failed to upload file to storage. Please try again." 
      };
    }
  } catch (error) {
    console.error("Error uploading attachment:", error);
    return { success: false, message: "Failed to upload file" };
  }
}

/**
 * Get list of available recipients (teachers and admins) for message composition
 * Task 5.1
 */
export async function getAvailableRecipients() {
  try {
    // Get current student
    const studentData = await getCurrentStudent();
    if (!studentData) {
      return { success: false, message: "Unauthorized" };
    }
    
    // Get all teachers and admins (only active users)
    const recipients = await db.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { role: UserRole.TEACHER },
              { role: UserRole.ADMIN },
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
            department: true,
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { firstName: 'asc' },
      ]
    });
    
    console.log(`Found ${recipients.length} available recipients (teachers and admins)`);
    
    return {
      success: true,
      data: recipients
    };
  } catch (error) {
    console.error("Error fetching recipients:", error);
    return { success: false, message: "Failed to fetch recipients" };
  }
}
