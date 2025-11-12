/**
 * Notification Utilities for Parent Dashboard
 * 
 * This file contains utility functions for managing notifications,
 * including creation, formatting, and grouping.
 */

import { db } from "@/lib/db";
import {
  Notification,
  NotificationListItem,
  NotificationType,
  NotificationPriority,
  GroupedNotifications,
  NotificationStats,
} from "@/lib/types/communication";

// ============================================================================
// NOTIFICATION CREATION UTILITIES
// ============================================================================

/**
 * Create a notification for a user
 */
export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}): Promise<Notification | null> {
  try {
    const notification = await db.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        link: params.link || null,
        isRead: false,
      },
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

/**
 * Create bulk notifications for multiple users
 */
export async function createBulkNotifications(params: {
  userIds: string[];
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}): Promise<{ success: boolean; count: number }> {
  try {
    const notifications = params.userIds.map((userId) => ({
      userId,
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link || null,
      isRead: false,
    }));

    const result = await db.notification.createMany({
      data: notifications,
    });

    return { success: true, count: result.count };
  } catch (error) {
    console.error("Error creating bulk notifications:", error);
    return { success: false, count: 0 };
  }
}

// ============================================================================
// NOTIFICATION TYPE-SPECIFIC CREATORS
// ============================================================================

/**
 * Create attendance notification
 */
export async function createAttendanceNotification(params: {
  parentUserId: string;
  studentName: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  date: Date;
  link?: string;
}): Promise<Notification | null> {
  const statusMessages = {
    PRESENT: "was present",
    ABSENT: "was absent",
    LATE: "arrived late",
  };

  return createNotification({
    userId: params.parentUserId,
    title: "Attendance Update",
    message: `${params.studentName} ${statusMessages[params.status]} on ${params.date.toLocaleDateString()}.`,
    type: NotificationType.ATTENDANCE,
    link: params.link || "/parent/attendance/overview",
  });
}

/**
 * Create fee notification
 */
export async function createFeeNotification(params: {
  parentUserId: string;
  studentName: string;
  amount: number;
  dueDate?: Date;
  type: "DUE" | "OVERDUE" | "PAID";
  link?: string;
}): Promise<Notification | null> {
  const titles = {
    DUE: "Fee Payment Due",
    OVERDUE: "Fee Payment Overdue",
    PAID: "Fee Payment Received",
  };

  const messages = {
    DUE: `Fee payment of ₹${params.amount} is due${params.dueDate ? ` on ${params.dueDate.toLocaleDateString()}` : ""} for ${params.studentName}.`,
    OVERDUE: `Fee payment of ₹${params.amount} is overdue for ${params.studentName}. Please pay immediately.`,
    PAID: `Fee payment of ₹${params.amount} has been received for ${params.studentName}. Thank you!`,
  };

  return createNotification({
    userId: params.parentUserId,
    title: titles[params.type],
    message: messages[params.type],
    type: NotificationType.FEE,
    link: params.link || "/parent/fees/overview",
  });
}

/**
 * Create grade notification
 */
export async function createGradeNotification(params: {
  parentUserId: string;
  studentName: string;
  examName: string;
  subject: string;
  grade?: string;
  marks?: number;
  link?: string;
}): Promise<Notification | null> {
  const gradeInfo = params.grade
    ? `Grade: ${params.grade}`
    : params.marks
      ? `Marks: ${params.marks}`
      : "";

  return createNotification({
    userId: params.parentUserId,
    title: "New Grade Posted",
    message: `${params.examName} results for ${params.subject} are now available for ${params.studentName}. ${gradeInfo}`,
    type: NotificationType.GRADE,
    link: params.link || "/parent/performance/results",
  });
}

/**
 * Create message notification
 */
export async function createMessageNotification(params: {
  recipientUserId: string;
  senderName: string;
  subject: string;
  messageId: string;
}): Promise<Notification | null> {
  return createNotification({
    userId: params.recipientUserId,
    title: "New Message",
    message: `You have a new message from ${params.senderName}: ${params.subject}`,
    type: NotificationType.MESSAGE,
    link: `/parent/communication/messages?id=${params.messageId}`,
  });
}

/**
 * Create announcement notification
 */
export async function createAnnouncementNotification(params: {
  parentUserIds: string[];
  title: string;
  announcementId: string;
}): Promise<{ success: boolean; count: number }> {
  return createBulkNotifications({
    userIds: params.parentUserIds,
    title: "New Announcement",
    message: params.title,
    type: NotificationType.ANNOUNCEMENT,
    link: `/parent/communication/announcements?id=${params.announcementId}`,
  });
}

/**
 * Create meeting notification
 */
export async function createMeetingNotification(params: {
  parentUserId: string;
  teacherName: string;
  meetingDate: Date;
  type: "SCHEDULED" | "CONFIRMED" | "CANCELLED" | "REMINDER";
  meetingId: string;
}): Promise<Notification | null> {
  const titles = {
    SCHEDULED: "Meeting Request Sent",
    CONFIRMED: "Meeting Confirmed",
    CANCELLED: "Meeting Cancelled",
    REMINDER: "Meeting Reminder",
  };

  const messages = {
    SCHEDULED: `Your meeting request with ${params.teacherName} for ${params.meetingDate.toLocaleDateString()} has been sent.`,
    CONFIRMED: `Your meeting with ${params.teacherName} on ${params.meetingDate.toLocaleDateString()} has been confirmed.`,
    CANCELLED: `Your meeting with ${params.teacherName} on ${params.meetingDate.toLocaleDateString()} has been cancelled.`,
    REMINDER: `Reminder: You have a meeting with ${params.teacherName} on ${params.meetingDate.toLocaleDateString()}.`,
  };

  return createNotification({
    userId: params.parentUserId,
    title: titles[params.type],
    message: messages[params.type],
    type: NotificationType.MEETING,
    link: `/parent/meetings/upcoming?id=${params.meetingId}`,
  });
}

/**
 * Create event notification
 */
export async function createEventNotification(params: {
  parentUserId: string;
  eventName: string;
  eventDate: Date;
  type: "NEW" | "REMINDER" | "CANCELLED";
  eventId: string;
}): Promise<Notification | null> {
  const titles = {
    NEW: "New Event",
    REMINDER: "Event Reminder",
    CANCELLED: "Event Cancelled",
  };

  const messages = {
    NEW: `New event: ${params.eventName} on ${params.eventDate.toLocaleDateString()}`,
    REMINDER: `Reminder: ${params.eventName} is scheduled for ${params.eventDate.toLocaleDateString()}`,
    CANCELLED: `Event cancelled: ${params.eventName} scheduled for ${params.eventDate.toLocaleDateString()}`,
  };

  return createNotification({
    userId: params.parentUserId,
    title: titles[params.type],
    message: messages[params.type],
    type: NotificationType.EVENT,
    link: `/parent/events?id=${params.eventId}`,
  });
}

// ============================================================================
// NOTIFICATION FORMATTING UTILITIES
// ============================================================================

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    [NotificationType.ATTENDANCE]: "calendar-check",
    [NotificationType.FEE]: "credit-card",
    [NotificationType.GRADE]: "award",
    [NotificationType.MESSAGE]: "mail",
    [NotificationType.ANNOUNCEMENT]: "megaphone",
    [NotificationType.MEETING]: "users",
    [NotificationType.EVENT]: "calendar",
    [NotificationType.GENERAL]: "bell",
  };

  return icons[type] || "bell";
}

/**
 * Get notification color based on type
 */
export function getNotificationColor(type: NotificationType): string {
  const colors: Record<NotificationType, string> = {
    [NotificationType.ATTENDANCE]: "blue",
    [NotificationType.FEE]: "green",
    [NotificationType.GRADE]: "purple",
    [NotificationType.MESSAGE]: "indigo",
    [NotificationType.ANNOUNCEMENT]: "orange",
    [NotificationType.MEETING]: "pink",
    [NotificationType.EVENT]: "cyan",
    [NotificationType.GENERAL]: "gray",
  };

  return colors[type] || "gray";
}

/**
 * Determine notification priority based on type and content
 */
export function getNotificationPriority(
  type: NotificationType,
  message: string
): NotificationPriority {
  // Urgent keywords
  const urgentKeywords = ["overdue", "urgent", "immediately", "critical"];
  const hasUrgentKeyword = urgentKeywords.some((keyword) =>
    message.toLowerCase().includes(keyword)
  );

  if (hasUrgentKeyword) {
    return NotificationPriority.URGENT;
  }

  // High priority types
  if (
    type === NotificationType.FEE ||
    type === NotificationType.ATTENDANCE
  ) {
    return NotificationPriority.HIGH;
  }

  // Medium priority types
  if (
    type === NotificationType.GRADE ||
    type === NotificationType.MEETING
  ) {
    return NotificationPriority.MEDIUM;
  }

  // Default to low priority
  return NotificationPriority.LOW;
}

/**
 * Format notification for display
 */
export function formatNotification(
  notification: Notification
): NotificationListItem {
  const type = notification.type as NotificationType;

  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type,
    priority: getNotificationPriority(type, notification.message),
    isRead: notification.isRead,
    link: notification.link,
    createdAt: notification.createdAt,
    icon: getNotificationIcon(type),
    color: getNotificationColor(type),
  };
}

// ============================================================================
// NOTIFICATION GROUPING UTILITIES
// ============================================================================

/**
 * Group notifications by type
 */
export function groupNotificationsByType(
  notifications: Notification[]
): GroupedNotifications[] {
  const grouped = new Map<NotificationType, Notification[]>();

  // Group notifications
  notifications.forEach((notification) => {
    const type = notification.type as NotificationType;
    if (!grouped.has(type)) {
      grouped.set(type, []);
    }
    grouped.get(type)!.push(notification);
  });

  // Convert to array and format
  return Array.from(grouped.entries()).map(([type, notifs]) => ({
    type,
    count: notifs.length,
    unreadCount: notifs.filter((n) => !n.isRead).length,
    notifications: notifs.map(formatNotification),
  }));
}

/**
 * Calculate notification statistics
 */
export function calculateNotificationStats(
  notifications: Notification[]
): NotificationStats {
  const stats: NotificationStats = {
    total: notifications.length,
    unread: notifications.filter((n) => !n.isRead).length,
    byType: {},
  };

  // Calculate stats by type
  notifications.forEach((notification) => {
    const type = notification.type as NotificationType;
    if (!stats.byType[type]) {
      stats.byType[type] = { total: 0, unread: 0 };
    }
    stats.byType[type]!.total++;
    if (!notification.isRead) {
      stats.byType[type]!.unread++;
    }
  });

  return stats;
}

// ============================================================================
// NOTIFICATION TIME UTILITIES
// ============================================================================

/**
 * Format notification time for display
 */
export function formatNotificationTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return "Just now";
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Check if notification is recent (within last 24 hours)
 */
export function isRecentNotification(date: Date): boolean {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / 3600000;
  return diffHours < 24;
}

// ============================================================================
// NOTIFICATION BADGE UTILITIES
// ============================================================================

/**
 * Get unread notification count for badge
 */
export async function getUnreadNotificationCount(
  userId: string
): Promise<number> {
  try {
    const count = await db.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
    return count;
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    return 0;
  }
}

/**
 * Get unread notification count by type
 */
export async function getUnreadNotificationCountByType(
  userId: string,
  type: NotificationType
): Promise<number> {
  try {
    const count = await db.notification.count({
      where: {
        userId,
        type,
        isRead: false,
      },
    });
    return count;
  } catch (error) {
    console.error("Error getting unread notification count by type:", error);
    return 0;
  }
}

/**
 * Format badge count (e.g., 99+ for counts over 99)
 */
export function formatBadgeCount(count: number): string {
  if (count === 0) return "";
  if (count > 99) return "99+";
  return count.toString();
}
