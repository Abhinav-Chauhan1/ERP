import { z } from "zod";

// ============================================================================
// MESSAGE SCHEMAS
// ============================================================================

/**
 * Get messages filter schema
 */
export const getMessagesSchema = z.object({
  type: z.enum(["inbox", "sent", "drafts"]),
  isRead: z.boolean().optional(),
  search: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(50),
});

export type GetMessagesInput = z.infer<typeof getMessagesSchema>;

/**
 * Send message schema
 */
export const sendMessageSchema = z.object({
  recipientId: z.string().min(1, "Recipient is required"),
  subject: z.string().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  content: z.string().min(1, "Message content is required").max(5000, "Message must be less than 5000 characters"),
  attachments: z.string().max(10485760, "Attachments must be less than 10MB").optional(), // 10MB limit
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

/**
 * Mark message as read schema
 */
export const markMessageAsReadSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
});

export type MarkMessageAsReadInput = z.infer<typeof markMessageAsReadSchema>;

/**
 * Delete message schema
 */
export const deleteMessageSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
});

export type DeleteMessageInput = z.infer<typeof deleteMessageSchema>;

// ============================================================================
// ANNOUNCEMENT SCHEMAS
// ============================================================================

/**
 * Get announcements filter schema
 */
export const getAnnouncementsSchema = z.object({
  category: z.enum(["ACADEMIC", "EVENT", "HOLIDAY", "GENERAL", "URGENT"]).optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(50),
});

export type GetAnnouncementsInput = z.infer<typeof getAnnouncementsSchema>;

// ============================================================================
// NOTIFICATION SCHEMAS
// ============================================================================

/**
 * Get notifications filter schema
 */
export const getNotificationsSchema = z.object({
  type: z.enum(["ATTENDANCE", "FEE", "GRADE", "MESSAGE", "ANNOUNCEMENT", "MEETING", "EVENT", "GENERAL"]).optional(),
  isRead: z.boolean().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(50),
});

export type GetNotificationsInput = z.infer<typeof getNotificationsSchema>;

/**
 * Mark notification as read schema
 */
export const markNotificationAsReadSchema = z.object({
  notificationId: z.string().min(1, "Notification ID is required"),
});

export type MarkNotificationAsReadInput = z.infer<typeof markNotificationAsReadSchema>;

/**
 * Mark all notifications as read schema
 */
export const markAllNotificationsAsReadSchema = z.object({
  type: z.enum(["ATTENDANCE", "FEE", "GRADE", "MESSAGE", "ANNOUNCEMENT", "MEETING", "EVENT", "GENERAL"]).optional(),
});

export type MarkAllNotificationsAsReadInput = z.infer<typeof markAllNotificationsAsReadSchema>;
