/**
 * Notification Service
 * 
 * Provides in-app notification management for calendar reminders and other system events.
 * Integrates with the EventReminderService to deliver in-app notifications.
 * 
 * Requirements: 5.1, 5.2, 5.3
 */

import { db } from '@/lib/db';
import { getSystemSettings } from '@/lib/utils/cached-queries';
import { Notification, AttendanceStatus } from '@prisma/client';
import { sendSMS } from './sms-service';

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
  schoolId: string;
}

export interface NotificationSummary {
  total: number;
  unread: number;
  notifications: Notification[];
}

/**
 * Create an in-app notification for a user
 * 
 * @param input - Notification creation data
 * @returns Created notification
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<Notification> {
  return await db.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type ?? 'INFO',
      link: input.link,
      isRead: false,
      schoolId: input.schoolId
    }
  });
}

/**
 * Create a calendar reminder notification
 * Requirement 5.3: Include event title, date, time, and location in the notification
 * 
 * @param userId - User ID to notify
 * @param eventTitle - Event title
 * @param eventDate - Event date
 * @param eventTime - Event time string
 * @param location - Optional event location
 * @param eventId - Event ID for linking
 * @returns Created notification
 */
export async function createReminderNotification(
  userId: string,
  eventTitle: string,
  eventDate: Date,
  eventTime: string,
  schoolId: string,
  location?: string,
  eventId?: string
): Promise<Notification> {
  const dateStr = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const message = `${dateStr} at ${eventTime}${location ? ` - ${location}` : ''}`;

  return await createNotification({
    userId,
    title: `Reminder: ${eventTitle}`,
    message,
    type: 'REMINDER',
    link: eventId ? `/calendar?event=${eventId}` : undefined,
    schoolId
  });
}

/**
 * Get notifications for a user
 * 
 * @param userId - User ID
 * @param limit - Maximum number of notifications to return
 * @param unreadOnly - Only return unread notifications
 * @returns Array of notifications
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 50,
  unreadOnly: boolean = false
): Promise<Notification[]> {
  return await db.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { isRead: false } : {})
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit
  });
}

/**
 * Get notification summary for a user
 * 
 * @param userId - User ID
 * @returns Notification summary with counts
 */
export async function getNotificationSummary(
  userId: string
): Promise<NotificationSummary> {
  const [total, unread, notifications] = await Promise.all([
    db.notification.count({ where: { userId } }),
    db.notification.count({ where: { userId, isRead: false } }),
    getUserNotifications(userId, 10)
  ]);

  return {
    total,
    unread,
    notifications
  };
}

/**
 * Mark a notification as read
 * 
 * @param notificationId - Notification ID
 * @param userId - User ID (for authorization)
 * @returns Updated notification
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<Notification> {
  // Verify the notification belongs to the user
  const notification = await db.notification.findFirst({
    where: {
      id: notificationId,
      userId
    }
  });

  if (!notification) {
    throw new Error('Notification not found or access denied');
  }

  return await db.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });
}

/**
 * Mark all notifications as read for a user
 * 
 * @param userId - User ID
 * @returns Number of notifications updated
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<number> {
  const result = await db.notification.updateMany({
    where: {
      userId,
      isRead: false
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

  return result.count;
}

/**
 * Delete a notification
 * 
 * @param notificationId - Notification ID
 * @param userId - User ID (for authorization)
 * @returns Success status
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<boolean> {
  // Verify the notification belongs to the user
  const notification = await db.notification.findFirst({
    where: {
      id: notificationId,
      userId
    }
  });

  if (!notification) {
    throw new Error('Notification not found or access denied');
  }

  await db.notification.delete({
    where: { id: notificationId }
  });

  return true;
}

/**
 * Delete old read notifications
 * Cleanup function to remove notifications older than specified days
 * 
 * @param daysOld - Delete notifications older than this many days
 * @returns Number of notifications deleted
 */
export async function deleteOldNotifications(
  daysOld: number = 30
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await db.notification.deleteMany({
    where: {
      isRead: true,
      readAt: {
        lt: cutoffDate
      }
    }
  });

  return result.count;
}

/**
 * Send attendance notification (Internal + SMS)
 * Requirements: 11.2, 5.1
 */
export async function sendAttendanceNotification(
  studentId: string,
  status: AttendanceStatus,
  date: Date,
  schoolId: string
): Promise<{ success: boolean; smsSent?: boolean; notificationCreated?: boolean }> {
  try {
    // Only notify for ABSENT or LATE
    if (status !== 'ABSENT' && status !== 'LATE') {
      return { success: true, smsSent: false, notificationCreated: false };
    }

    // 1. Check System Settings
    const systemSettings = await getSystemSettings(schoolId);

    // Default to true if settings don't exist (safety fallback)
    const smsEnabledSystem = systemSettings?.smsEnabled ?? false;
    const notifyAttendanceSystem = systemSettings?.notifyAttendance ?? true;

    if (!notifyAttendanceSystem) {
      return { success: true, notificationCreated: false, smsSent: false };
    }

    // 2. Get Student & Parent details with settings
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        settings: true,
        parents: {
          include: {
            parent: {
              include: {
                user: true,
                settings: true
              }
            }
          }
        }
      }
    });

    if (!student) return { success: false };

    // 3. Check for recent duplicate notification (to prevent spam if teacher updates multiple times)
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    const existingNotification = await db.notification.findFirst({
      where: {
        userId: student.userId,
        type: 'ATTENDANCE',
        createdAt: {
          gte: dateStart,
          lte: dateEnd
        },
        message: {
          contains: status // Simple check to avoid notifying for same status twice
        }
      }
    });

    if (existingNotification) {
      return { success: true, notificationCreated: false, smsSent: false }; // Already notified
    }

    // 4. Create Internal Notification for Student
    // Check student preference
    const studentNotify = student.settings?.attendanceAlerts ?? true;
    let notificationCreated = false;

    if (studentNotify) {
      await createNotification({
        userId: student.userId,
        title: `Attendance Alert: ${status}`,
        message: `You have been marked ${status} for ${date.toLocaleDateString()}`,
        type: 'ATTENDANCE',
        link: '/student/academics/attendance',
        schoolId
      });
      notificationCreated = true;
    }

    // 5. Notify Parents (Internal + SMS) - OPTIMIZED: Batch notifications and SMS
    let smsSent = false;

    // Collect notifications and SMS recipients for batch processing
    const notificationsToCreate: Array<{
      userId: string;
      title: string;
      message: string;
      type: string;
      link: string;
      schoolId: string;
    }> = [];

    const smsRecipients: Array<{ phone: string; body: string }> = [];

    // Process parents to collect batch data
    for (const p of student.parents) {
      const parent = p.parent;
      const parentNotify = parent.settings?.attendanceAlerts ?? true;
      const parentSmsPref = parent.settings?.smsNotifications ?? false;

      if (parentNotify) {
        // Collect notification data for batch creation
        notificationsToCreate.push({
          userId: parent.userId,
          title: `Attendance Alert: ${student.user.firstName}`,
          message: `${student.user.firstName} has been marked ${status} for ${date.toLocaleDateString()}`,
          type: 'ATTENDANCE',
          link: `/parent/children/${student.id}/attendance`,
          schoolId
        });

        // Collect SMS recipients for batch sending
        if (smsEnabledSystem && parentSmsPref && parent.user.phone) {
          const smsBody = `Alert: ${student.user.firstName} is marked ${status} on ${date.toLocaleDateString()}. - ${systemSettings?.schoolName || 'School Admin'}`;
          smsRecipients.push({ phone: parent.user.phone, body: smsBody });
        }
      }
    }

    // Batch create notifications (1 query instead of N queries)
    if (notificationsToCreate.length > 0) {
      await db.notification.createMany({
        data: notificationsToCreate.map(notification => ({
          ...notification,
          isRead: false
        }))
      });
      notificationCreated = true;
    }

    // Batch send SMS messages (parallel instead of sequential)
    if (smsRecipients.length > 0) {
      try {
        // Send SMS messages in parallel with rate limiting
        const smsPromises = smsRecipients.map(({ phone, body }) =>
          sendSMS(phone, body).catch(error => {
            console.error(`Failed to send SMS to ${phone}:`, error);
            return { success: false, error: error.message };
          })
        );

        // Use Promise.allSettled to handle partial failures gracefully
        const smsResults = await Promise.allSettled(smsPromises);
        smsSent = smsResults.some(result =>
          result.status === 'fulfilled' && result.value.success !== false
        );
      } catch (error) {
        console.error('Error in batch SMS sending:', error);
      }
    }

    return { success: true, notificationCreated, smsSent };

  } catch (error) {
    console.error("Error sending attendance notification:", error);
    return { success: false };
  }
}
