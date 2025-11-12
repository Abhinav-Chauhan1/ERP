/**
 * Communication Types for Parent Dashboard
 * 
 * This file contains TypeScript types for messages, announcements, and notifications
 * used in the parent communication system.
 */

// ============================================================================
// MESSAGE TYPES
// ============================================================================

/**
 * Message type for inbox/sent messages
 */
export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  subject: string | null;
  content: string;
  isRead: boolean;
  readAt: Date | null;
  attachments: string | null;
  createdAt: Date;
  updatedAt: Date;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
    role: string;
  };
  recipient?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
    role: string;
  };
}

/**
 * Message list item with sender/recipient info
 */
export interface MessageListItem {
  id: string;
  subject: string | null;
  content: string;
  isRead: boolean;
  createdAt: Date;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    role: string;
  };
  recipient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  hasAttachments: boolean;
}

/**
 * Message detail with full information
 */
export interface MessageDetail extends Message {
  attachmentUrls?: string[];
}

/**
 * Message thread for conversation view
 */
export interface MessageThread {
  id: string;
  subject: string | null;
  participants: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    role: string;
  }[];
  messages: Message[];
  lastMessageAt: Date;
  unreadCount: number;
}

/**
 * Message statistics
 */
export interface MessageStats {
  totalInbox: number;
  unreadInbox: number;
  totalSent: number;
  totalDrafts: number;
}

// ============================================================================
// ANNOUNCEMENT TYPES
// ============================================================================

/**
 * Announcement category enum
 */
export enum AnnouncementCategory {
  ACADEMIC = "ACADEMIC",
  EVENT = "EVENT",
  HOLIDAY = "HOLIDAY",
  GENERAL = "GENERAL",
  URGENT = "URGENT",
}

/**
 * Announcement type
 */
export interface Announcement {
  id: string;
  title: string;
  content: string;
  publisherId: string;
  targetAudience: string[];
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  attachments: string | null;
  createdAt: Date;
  updatedAt: Date;
  publisher?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  category?: AnnouncementCategory;
}

/**
 * Announcement list item
 */
export interface AnnouncementListItem {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  hasAttachments: boolean;
  isRead: boolean;
  publisher: {
    firstName: string;
    lastName: string;
  };
}

/**
 * Announcement detail with full information
 */
export interface AnnouncementDetail extends Announcement {
  attachmentUrls?: string[];
  isRead: boolean;
  readAt?: Date;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

/**
 * Notification type enum
 */
export enum NotificationType {
  ATTENDANCE = "ATTENDANCE",
  FEE = "FEE",
  GRADE = "GRADE",
  MESSAGE = "MESSAGE",
  ANNOUNCEMENT = "ANNOUNCEMENT",
  MEETING = "MEETING",
  EVENT = "EVENT",
  GENERAL = "GENERAL",
}

/**
 * Notification priority enum
 */
export enum NotificationPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

/**
 * Notification type
 */
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  readAt: Date | null;
  link: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Notification list item with grouping
 */
export interface NotificationListItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  isRead: boolean;
  link: string | null;
  createdAt: Date;
  icon?: string;
  color?: string;
}

/**
 * Grouped notifications by type
 */
export interface GroupedNotifications {
  type: NotificationType;
  count: number;
  unreadCount: number;
  notifications: NotificationListItem[];
}

/**
 * Notification statistics
 */
export interface NotificationStats {
  total: number;
  unread: number;
  byType: {
    [key in NotificationType]?: {
      total: number;
      unread: number;
    };
  };
}

// ============================================================================
// DRAFT TYPES
// ============================================================================

/**
 * Message draft type
 */
export interface MessageDraft {
  id: string;
  senderId: string;
  recipientId: string | null;
  subject: string | null;
  content: string | null;
  attachments: string | null;
  createdAt: Date;
  updatedAt: Date;
  recipient?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

// ============================================================================
// ATTACHMENT TYPES
// ============================================================================

/**
 * Attachment type
 */
export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

/**
 * Attachment upload result
 */
export interface AttachmentUploadResult {
  success: boolean;
  attachment?: Attachment;
  error?: string;
}

// ============================================================================
// FILTER AND PAGINATION TYPES
// ============================================================================

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Message filter options
 */
export interface MessageFilterOptions {
  type?: "inbox" | "sent" | "drafts";
  isRead?: boolean;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

/**
 * Announcement filter options
 */
export interface AnnouncementFilterOptions {
  category?: AnnouncementCategory;
  isActive?: boolean;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

/**
 * Notification filter options
 */
export interface NotificationFilterOptions {
  type?: NotificationType;
  isRead?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

// ============================================================================
// ACTION RESULT TYPES
// ============================================================================

/**
 * Generic action result
 */
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Message send result
 */
export interface MessageSendResult extends ActionResult<Message> {
  messageId?: string;
}

/**
 * Bulk action result
 */
export interface BulkActionResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors?: string[];
}

// ============================================================================
// RECIPIENT TYPES
// ============================================================================

/**
 * Message recipient option for selection
 */
export interface RecipientOption {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  type: "teacher" | "admin";
}

/**
 * Recipient search result
 */
export interface RecipientSearchResult {
  teachers: RecipientOption[];
  admins: RecipientOption[];
}
