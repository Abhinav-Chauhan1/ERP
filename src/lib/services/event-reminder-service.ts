/**
 * Event Reminder Service
 * 
 * Provides reminder scheduling, notification generation, and synchronization
 * for calendar events based on user preferences.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { EventReminder, ReminderType, CalendarEvent } from '@prisma/client';
import { randomUUID } from 'crypto';
import { sendEmail, isEmailConfigured } from "@/lib/utils/email-service";
import { getEventReminderEmailHtml } from "@/lib/utils/email-templates";
import { createReminderNotification } from './notification-service';
import { db } from '@/lib/db';

// Types for reminder creation
export interface CreateReminderInput {
  eventId: string;
  userId: string;
  reminderTime: Date;
  reminderType: ReminderType;
}

export interface ReminderNotificationData {
  eventTitle: string;
  eventDate: Date;
  eventTime: string;
  location?: string;
  description?: string;
}

// Validation errors
export class ReminderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReminderValidationError';
  }
}

/**
 * Calculate reminder time based on user preferences
 * Requirement 5.1, 5.2: Send notifications based on user-configured reminder settings
 * 
 * @param eventDate - The date/time of the event
 * @param reminderOffsetMinutes - Minutes before event to send reminder (from user preferences)
 * @returns The calculated reminder time
 */
export function calculateReminderTime(
  eventDate: Date,
  reminderOffsetMinutes: number
): Date {
  const reminderTime = new Date(eventDate);
  reminderTime.setMinutes(reminderTime.getMinutes() - reminderOffsetMinutes);
  return reminderTime;
}

/**
 * Create reminders for an event based on user preferences
 * Requirement 5.1, 5.2: Apply settings to all future events of selected categories
 * 
 * @param eventId - The calendar event ID
 * @param userIds - Array of user IDs who should receive reminders
 * @returns Array of created reminders
 */
export async function createRemindersForEvent(
  eventId: string,
  userIds: string[],
  schoolId: string
): Promise<EventReminder[]> {
  // Get the event details
  const event = await db.calendarEvent.findUnique({
    where: { id: eventId }
  });

  if (!event) {
    throw new ReminderValidationError('Event not found');
  }

  // Fetch all user preferences in a single batch query
  // This solves the N+1 query issue
  const allPreferences = await db.userCalendarPreferences.findMany({
    where: { userId: { in: userIds } }
  });

  // Create a map for O(1) lookup
  const preferencesMap = new Map(
    allPreferences.map(p => [p.userId, p])
  );

  const remindersToCreate: EventReminder[] = [];
  const now = new Date();

  // Prepare reminders for each user
  for (const userId of userIds) {
    // Get user's reminder preferences from map or use default
    const preferences = preferencesMap.get(userId);

    // Use default preferences if not set
    const reminderOffsetMinutes = preferences?.defaultReminderTime ?? 1440; // Default: 1 day
    const reminderTypes = preferences?.reminderTypes ?? ['IN_APP'];

    // Calculate reminder time
    const reminderTime = calculateReminderTime(event.startDate, reminderOffsetMinutes);

    // Only create reminders for future events
    if (reminderTime > now) {
      // Create a reminder for each enabled reminder type
      for (const reminderType of reminderTypes) {
        // Generate ID and timestamps client-side to avoid fetching back created records
        // and to enable batch insertion while returning full objects
        remindersToCreate.push({
          id: randomUUID(),
          eventId,
          userId,
          reminderTime,
          reminderType: reminderType as ReminderType,
          isSent: false,
          sentAt: null,
          createdAt: now,
          updatedAt: now,
          schoolId
        });
      }
    }
  }

  if (remindersToCreate.length > 0) {
    // Use createMany for efficient batch insertion
    await db.eventReminder.createMany({
      data: remindersToCreate
    });
  }

  return remindersToCreate;
}

/**
 * Generate reminder notification content
 * Requirement 5.3: Include event title, date, time, and location in the notification
 * 
 * @param event - The calendar event
 * @returns Notification data with complete event details
 */
export function generateReminderNotification(
  event: CalendarEvent
): ReminderNotificationData {
  // Format time
  const eventTime = event.isAllDay
    ? 'All Day'
    : event.startDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

  return {
    eventTitle: event.title,
    eventDate: event.startDate,
    eventTime,
    location: event.location ?? undefined,
    description: event.description ?? undefined
  };
}

/**
 * Send reminder notification to a user
 * Requirement 5.3: Send reminder with complete event information
 * 
 * @param reminder - The reminder to send
 * @param event - The associated calendar event
 * @param userEmail - The user's email address
 * @returns Success status
 */
export async function sendReminderNotification(
  reminder: EventReminder,
  event: CalendarEvent,
  userEmail: string
): Promise<boolean> {
  try {
    const notificationData = generateReminderNotification(event);

    // Send based on reminder type
    switch (reminder.reminderType) {
      case 'EMAIL':
        if (!isEmailConfigured()) {
          console.warn('Email service not configured. Reminder not sent.');
          return false;
        }

        const emailResult = await sendEmail({
          to: [userEmail],
          subject: `Reminder: ${notificationData.eventTitle}`,
          html: getEventReminderEmailHtml(notificationData),
        });

        return emailResult.success;

      case 'IN_APP':
        // Create in-app notification
        await createReminderNotification(
          reminder.userId,
          notificationData.eventTitle,
          notificationData.eventDate,
          notificationData.eventTime,
          notificationData.location || '',
          event.id
        );
        return true;

      case 'SMS':
        // SMS notifications would be handled by an SMS service
        console.log('SMS reminder:', notificationData);
        return true;

      case 'PUSH':
        // Push notifications would be handled by a push notification service
        console.log('Push reminder:', notificationData);
        return true;

      default:
        console.warn('Unknown reminder type:', reminder.reminderType);
        return false;
    }
  } catch (error) {
    console.error('Error sending reminder notification:', error);
    return false;
  }
}

/**
 * Check for duplicate reminders
 * Requirement 5.4: Not send duplicate reminders for the same event
 * 
 * @param eventId - The event ID
 * @param userId - The user ID
 * @param reminderType - The reminder type
 * @returns True if a reminder already exists
 */
export async function hasExistingReminder(
  eventId: string,
  userId: string,
  reminderType: ReminderType
): Promise<boolean> {
  const existingReminder = await db.eventReminder.findFirst({
    where: {
      eventId,
      userId,
      reminderType,
      isSent: true
    }
  });

  return existingReminder !== null;
}

/**
 * Mark reminder as sent
 * Requirement 5.4: Prevent duplicate reminders
 * 
 * @param reminderId - The reminder ID
 * @returns Updated reminder
 */
export async function markReminderAsSent(
  reminderId: string
): Promise<EventReminder> {
  return await db.eventReminder.update({
    where: { id: reminderId },
    data: {
      isSent: true,
      sentAt: new Date()
    }
  });
}

/**
 * Get pending reminders that need to be sent
 * 
 * @param beforeTime - Get reminders scheduled before this time (default: now)
 * @returns Array of pending reminders with event details
 */
export async function getPendingReminders(
  beforeTime: Date = new Date()
): Promise<Array<EventReminder & { event: CalendarEvent }>> {
  return await db.eventReminder.findMany({
    where: {
      isSent: false,
      reminderTime: {
        lte: beforeTime
      }
    },
    include: {
      event: true
    },
    orderBy: {
      reminderTime: 'asc'
    }
  });
}

/**
 * Synchronize reminders when an event is updated
 * Requirement 5.5: Send updated reminders to all affected users when event is updated
 * 
 * @param eventId - The event ID
 * @param oldStartDate - The previous start date
 * @param newStartDate - The new start date
 * @returns Number of reminders updated
 */
export async function synchronizeRemindersOnEventUpdate(
  eventId: string,
  oldStartDate: Date,
  newStartDate: Date
): Promise<number> {
  // If the date hasn't changed, no need to update reminders
  if (oldStartDate.getTime() === newStartDate.getTime()) {
    return 0;
  }

  // Calculate the time difference
  const timeDifference = newStartDate.getTime() - oldStartDate.getTime();

  // Get all unsent reminders for this event
  const reminders = await db.eventReminder.findMany({
    where: {
      eventId,
      isSent: false
    }
  });

  // Update each reminder's time
  let updatedCount = 0;
  for (const reminder of reminders) {
    const newReminderTime = new Date(reminder.reminderTime.getTime() + timeDifference);

    await db.eventReminder.update({
      where: { id: reminder.id },
      data: {
        reminderTime: newReminderTime
      }
    });

    updatedCount++;
  }

  return updatedCount;
}

/**
 * Delete reminders for an event
 * Used when an event is deleted
 * 
 * @param eventId - The event ID
 * @returns Number of reminders deleted
 */
export async function deleteRemindersForEvent(
  eventId: string
): Promise<number> {
  const result = await db.eventReminder.deleteMany({
    where: { eventId }
  });

  return result.count;
}

/**
 * Delete reminders for a user
 * Used when cleaning up user data
 * 
 * @param userId - The user ID
 * @returns Number of reminders deleted
 */
export async function deleteRemindersForUser(
  userId: string
): Promise<number> {
  const result = await db.eventReminder.deleteMany({
    where: { userId }
  });

  return result.count;
}

// Concurrency limiter helper
function pLimit(concurrency: number) {
  const queue: Array<{
    fn: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
  }> = [];
  let active = 0;

  const next = () => {
    active--;
    if (queue.length > 0) {
      const item = queue.shift();
      if (item) {
        run(item.fn, item.resolve, item.reject);
      }
    }
  };

  const run = async (
    fn: () => Promise<any>,
    resolve: (value: any) => void,
    reject: (reason?: any) => void
  ) => {
    active++;
    try {
      const result = await fn();
      resolve(result);
    } catch (e) {
      reject(e);
    } finally {
      next();
    }
  };

  return <T>(fn: () => Promise<T>): Promise<T> =>
    new Promise((resolve, reject) => {
      if (active < concurrency) {
        run(fn, resolve, reject);
      } else {
        queue.push({ fn, resolve, reject });
      }
    });
}

/**
 * Process pending reminders
 * This function should be called periodically (e.g., by a cron job)
 * to send reminders that are due
 * 
 * @returns Summary of processed reminders
 */
export async function processPendingReminders(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const pendingReminders = await getPendingReminders();

  if (pendingReminders.length === 0) {
    return { processed: 0, sent: 0, failed: 0 };
  }

  // 1. Batch fetch sent reminders to optimize duplicate checking
  // We check for any sent reminders for the same event, user, and type combination
  const eventIds = [...new Set(pendingReminders.map(r => r.eventId))];
  const userIds = [...new Set(pendingReminders.map(r => r.userId))];

  // Optimize: Fetch sent reminders for the relevant events/users
  // This replaces the N calls to hasExistingReminder
  const sentReminders = await db.eventReminder.findMany({
    where: {
      eventId: { in: eventIds },
      userId: { in: userIds },
      isSent: true
    },
    select: {
      eventId: true,
      userId: true,
      reminderType: true
    }
  });

  // Create a set of sent reminder keys for O(1) lookup
  const sentReminderKeys = new Set(
    sentReminders.map(r => `${r.eventId}-${r.userId}-${r.reminderType}`)
  );

  // 2. Batch fetch user emails
  // This replaces the N calls to db.user.findUnique
  const users = await db.user.findMany({
    where: {
      id: { in: userIds }
    },
    select: {
      id: true,
      email: true
    }
  });

  const userMap = new Map(users.map(u => [u.id, u]));

  // 3. Process reminders in parallel with concurrency limit
  const limit = pLimit(10); // Process 10 reminders concurrently

  const results = await Promise.all(
    pendingReminders.map(reminder =>
      limit(async () => {
        const key = `${reminder.eventId}-${reminder.userId}-${reminder.reminderType}`;

        // Check for duplicates (including those we just marked as sent in this batch)
        if (sentReminderKeys.has(key)) {
          // Mark as sent without actually sending
          await markReminderAsSent(reminder.id);
          return { status: 'duplicate' };
        }

        // Add to set to prevent duplicates within this batch
        sentReminderKeys.add(key);

        try {
          const user = userMap.get(reminder.userId);

          if (!user) {
            console.error('User not found for reminder:', reminder.userId);
            return { status: 'failed' };
          }

          if (!user.email) {
            console.error('User email not found for reminder:', reminder.userId);
            return { status: 'failed' };
          }

          // Send the notification
          const success = await sendReminderNotification(
            reminder,
            reminder.event,
            user.email
          );

          if (success) {
            await markReminderAsSent(reminder.id);
            return { status: 'sent' };
          } else {
            return { status: 'failed' };
          }
        } catch (error) {
          console.error('Error processing reminder:', error);
          return { status: 'failed' };
        }
      })
    )
  );

  const sent = results.filter(r => r.status === 'sent').length;
  const failed = results.filter(r => r.status === 'failed').length;

  return {
    processed: pendingReminders.length,
    sent,
    failed
  };
}
