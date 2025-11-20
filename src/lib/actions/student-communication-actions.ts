"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
