"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/auth-helpers";

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
        user: {
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
      where: { id: user.id },
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
        userId: dbUser.id, // Notification belongs to a user
      },
      include: {
        user: {
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
      },
      include: {
        user: {
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

// Get notifications for current user
export async function getUserNotifications() {
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

    const notifications = await db.notification.findMany({
      where: {
        userId: dbUser.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Limit to 50 most recent notifications
    });

    return { success: true, data: notifications };
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    return { success: false, error: "Failed to fetch notifications" };
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
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

    // Verify the notification belongs to the user
    const notification = await db.notification.findFirst({
      where: {
        id: notificationId,
        userId: dbUser.id,
      },
    });

    if (!notification) {
      return { success: false, error: "Notification not found" };
    }

    await db.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    revalidatePath("/admin/communication/notifications");
    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: "Failed to mark notification as read" };
  }
}

// Mark all notifications as read for current user
export async function markAllNotificationsAsRead() {
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

    await db.notification.updateMany({
      where: {
        userId: dbUser.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    revalidatePath("/admin/communication/notifications");
    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false, error: "Failed to mark all notifications as read" };
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
      where: { id: user.id },
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
        userId: dbUser.id, // Notification belongs to a user
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



// Get notification preferences for current user
export async function getNotificationPreferences() {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        role: true,
        teacher: {
          select: {
            settings: true,
          },
        },
        student: {
          select: {
            settings: true,
          },
        },
        parent: {
          select: {
            settings: true,
          },
        },
      },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Get settings based on role
    let settings: any = null;
    if (dbUser.role === "TEACHER" && dbUser.teacher?.settings) {
      settings = dbUser.teacher.settings;
    } else if (dbUser.role === "STUDENT" && dbUser.student?.settings) {
      settings = dbUser.student.settings;
    } else if (dbUser.role === "PARENT" && dbUser.parent?.settings) {
      settings = dbUser.parent.settings;
    }

    // Return default preferences if no settings found
    const preferences = {
      emailNotifications: settings?.emailNotifications ?? true,
      pushNotifications: settings?.pushNotifications ?? true,
      smsNotifications: settings?.smsNotifications ?? false,
      notifyOnAnnouncements: settings?.notifyOnAnnouncements ?? true,
      notifyOnMessages: settings?.notifyOnMessages ?? true,
      notifyOnAssignments: settings?.notifyOnAssignments ?? true,
      notifyOnGrades: settings?.notifyOnGrades ?? true,
      notifyOnAttendance: settings?.notifyOnAttendance ?? true,
      notifyOnFees: settings?.notifyOnFees ?? true,
      notifyOnEvents: settings?.notifyOnEvents ?? true,
      notifyOnSystemUpdates: settings?.notifyOnSystemUpdates ?? true,
      digestFrequency: settings?.digestFrequency ?? "INSTANT",
    };

    return { success: true, data: preferences };
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return { success: false, error: "Failed to fetch preferences" };
  }
}

// Update notification preferences for current user
export async function updateNotificationPreferences(preferences: any) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        role: true,
        teacher: {
          select: {
            id: true,
            settings: true,
          },
        },
        student: {
          select: {
            id: true,
            settings: true,
          },
        },
        parent: {
          select: {
            id: true,
            settings: true,
          },
        },
      },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Update settings based on role
    if (dbUser.role === "TEACHER" && dbUser.teacher) {
      if (dbUser.teacher.settings) {
        await db.teacherSettings.update({
          where: { teacherId: dbUser.teacher.id },
          data: preferences,
        });
      } else {
        await db.teacherSettings.create({
          data: {
            teacherId: dbUser.teacher.id,
            ...preferences,
          },
        });
      }
    } else if (dbUser.role === "STUDENT" && dbUser.student) {
      if (dbUser.student.settings) {
        await db.studentSettings.update({
          where: { studentId: dbUser.student.id },
          data: preferences,
        });
      } else {
        await db.studentSettings.create({
          data: {
            studentId: dbUser.student.id,
            ...preferences,
          },
        });
      }
    } else if (dbUser.role === "PARENT" && dbUser.parent) {
      if (dbUser.parent.settings) {
        await db.parentSettings.update({
          where: { parentId: dbUser.parent.id },
          data: preferences,
        });
      } else {
        await db.parentSettings.create({
          data: {
            parentId: dbUser.parent.id,
            ...preferences,
          },
        });
      }
    }

    revalidatePath("/admin/settings/notifications");
    return { success: true };
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return { success: false, error: "Failed to update preferences" };
  }
}
