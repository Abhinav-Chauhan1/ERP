"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";

// Get all notifications with filters
export async function getNotifications(filters?: {
  type?: string;
  recipientRole?: string;
  limit?: number;
}) {
  try {
    const where: any = {};

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.recipientRole) {
      where.recipientRole = filters.recipientRole;
    }

    const notifications = await db.notification.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: filters?.limit,
    });

    return { success: true, data: notifications };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { success: false, error: "Failed to fetch notifications" };
  }
}

// Get single notification by ID
export async function getNotificationById(id: string) {
  try {
    const notification = await db.notification.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!notification) {
      return { success: false, error: "Notification not found" };
    }

    return { success: true, data: notification };
  } catch (error) {
    console.error("Error fetching notification:", error);
    return { success: false, error: "Failed to fetch notification" };
  }
}

// Create new notification
export async function createNotification(data: any) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    const notification = await db.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type || "INFO",
        link: data.link || null,
        recipientRole: data.recipientRole || "ALL",
        senderId: dbUser.id,
      },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    revalidatePath("/admin/communication/notifications");
    return { success: true, data: notification };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error: "Failed to create notification" };
  }
}

// Update notification
export async function updateNotification(id: string, data: any) {
  try {
    const notification = await db.notification.update({
      where: { id },
      data: {
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link || null,
        recipientRole: data.recipientRole,
      },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    revalidatePath("/admin/communication/notifications");
    return { success: true, data: notification };
  } catch (error) {
    console.error("Error updating notification:", error);
    return { success: false, error: "Failed to update notification" };
  }
}

// Delete notification
export async function deleteNotification(id: string) {
  try {
    await db.notification.delete({
      where: { id },
    });

    revalidatePath("/admin/communication/notifications");
    return { success: true };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return { success: false, error: "Failed to delete notification" };
  }
}

// Mark notification as read for a user
export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    // This would typically update a join table tracking read status per user
    // For now, we'll just return success
    // In a full implementation, you'd have a NotificationRead table
    
    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: "Failed to mark notification as read" };
  }
}

// Send bulk notifications to specific users
export async function sendBulkNotifications(userIds: string[], data: any) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Create a single notification that targets multiple users
    // In a full implementation, you might create individual notifications
    // or use a more sophisticated notification system
    const notification = await db.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type || "INFO",
        link: data.link || null,
        recipientRole: "CUSTOM", // Indicates custom recipient list
        senderId: dbUser.id,
      },
    });

    revalidatePath("/admin/communication/notifications");
    return { success: true, data: notification };
  } catch (error) {
    console.error("Error sending bulk notifications:", error);
    return { success: false, error: "Failed to send bulk notifications" };
  }
}

// Get notification statistics
export async function getNotificationStats() {
  try {
    const [totalNotifications, infoCount, warningCount, alertCount, successCount] =
      await Promise.all([
        db.notification.count(),
        db.notification.count({
          where: { type: "INFO" },
        }),
        db.notification.count({
          where: { type: "WARNING" },
        }),
        db.notification.count({
          where: { type: "ALERT" },
        }),
        db.notification.count({
          where: { type: "SUCCESS" },
        }),
      ]);

    return {
      success: true,
      data: {
        totalNotifications,
        infoCount,
        warningCount,
        alertCount,
        successCount,
      },
    };
  } catch (error) {
    console.error("Error fetching notification stats:", error);
    return { success: false, error: "Failed to fetch statistics" };
  }
}

// Get users for bulk notification targeting
export async function getUsersForNotifications(role?: string) {
  try {
    const where: any = {};

    if (role && role !== "ALL") {
      where.role = role;
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
      orderBy: {
        firstName: "asc",
      },
    });

    return { success: true, data: users };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, error: "Failed to fetch users" };
  }
}
