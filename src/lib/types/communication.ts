/**
 * Communication System Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for the
 * WhatsApp Notification System and MSG91 SMS integration.
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * Communication channels supported by the system
 */
export enum CommunicationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  IN_APP = 'IN_APP'
}

/**
 * Message delivery status
 */
export enum MessageStatus {
  QUEUED = 'QUEUED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED'
}

/**
 * Notification types
 */
export enum NotificationType {
  ATTENDANCE = 'ATTENDANCE',
  LEAVE = 'LEAVE',
  FEE = 'FEE',
  GRADE = 'GRADE',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  EXAM = 'EXAM',
  TIMETABLE = 'TIMETABLE',
  GENERAL = 'GENERAL',
  MEETING = 'MEETING',
  EVENT = 'EVENT',
  MESSAGE = 'MESSAGE',
  RECEIPT_VERIFIED = 'RECEIPT_VERIFIED',
  RECEIPT_REJECTED = 'RECEIPT_REJECTED'
}

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

/**
 * Basic Notification interface matching the Prisma model structure
 */
export interface Notification {
  id: string;
  userId: string;
  type: string; // Stored as string in DB but mapped to NotificationType
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Formatted Notification for UI display
 */
export interface NotificationListItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  link: string | null;
  createdAt: Date;
  icon: string;
  color: string;
}

/**
 * Notification Statistics
 */
export interface NotificationStats {
  total: number;
  unread: number;
  byType: Partial<Record<NotificationType, { total: number; unread: number }>>;
}

/**
 * Grouped Notifications
 */
export interface GroupedNotifications {
  type: NotificationType;
  count: number;
  unreadCount: number;
  notifications: NotificationListItem[];
}

/**
 * WhatsApp message types
 */
export enum WhatsAppMessageType {
  TEXT = 'text',
  TEMPLATE = 'template',
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio',
  LOCATION = 'location',
  INTERACTIVE = 'interactive'
}

/**
 * WhatsApp template status
 */
export enum WhatsAppTemplateStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

/**
 * MSG91 SMS route types
 */
export enum MSG91Route {
  TRANSACTIONAL = 'transactional',
  PROMOTIONAL = 'promotional'
}

// ============================================================================
// MSG91 Types
// ============================================================================

/**
 * MSG91 SMS send parameters
 */
export interface MSG91SMSParams {
  sender: string;
  route: MSG91Route;
  country: string;
  sms: Array<{
    message: string;
    to: string[];
  }>;
  DLT_TE_ID?: string;
}

/**
 * MSG91 API response
 */
export interface MSG91Response {
  type: 'success' | 'error';
  message: string;
  request_id?: string;
}

/**
 * MSG91 send result
 */
export interface MSG91SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
}

/**
 * MSG91 status result
 */
export interface MSG91StatusResult {
  status: MessageStatus;
  description?: string;
  deliveredAt?: Date;
}

/**
 * MSG91 webhook payload
 */
export interface MSG91WebhookPayload {
  request_id: string;
  status: string;
  mobile: string;
  description?: string;
  timestamp?: string;
}

// ============================================================================
// WhatsApp Types
// ============================================================================

/**
 * WhatsApp text message
 */
export interface WhatsAppTextMessage {
  type: 'text';
  text: {
    body: string;
    preview_url?: boolean;
  };
}

/**
 * WhatsApp template parameter
 */
export interface WhatsAppTemplateParameter {
  type: 'text' | 'image' | 'document' | 'video';
  text?: string;
  image?: { link: string };
  document?: { link: string; filename: string };
  video?: { link: string };
}

/**
 * WhatsApp template component
 */
export interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'button';
  parameters: WhatsAppTemplateParameter[];
}

/**
 * WhatsApp template message
 */
export interface WhatsAppTemplateMessage {
  type: 'template';
  template: {
    name: string;
    language: {
      code: string;
    };
    components: WhatsAppTemplateComponent[];
  };
}

/**
 * WhatsApp media message
 */
export interface WhatsAppMediaMessage {
  type: 'image' | 'document' | 'video' | 'audio';
  [key: string]: any;
}

/**
 * WhatsApp location message
 */
export interface WhatsAppLocationMessage {
  type: 'location';
  location: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
}

/**
 * WhatsApp interactive button
 */
export interface WhatsAppButton {
  type: 'reply';
  reply: {
    id: string;
    title: string;
  };
}

/**
 * WhatsApp interactive list row
 */
export interface WhatsAppListRow {
  id: string;
  title: string;
  description?: string;
}

/**
 * WhatsApp interactive list section
 */
export interface WhatsAppListSection {
  title: string;
  rows: WhatsAppListRow[];
}

/**
 * WhatsApp interactive message
 */
export interface WhatsAppInteractiveMessage {
  type: 'interactive';
  interactive: {
    type: 'button' | 'list';
    header?: {
      type: 'text';
      text: string;
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      buttons?: WhatsAppButton[];
      button?: string;
      sections?: WhatsAppListSection[];
    };
  };
}

/**
 * Union type for all WhatsApp message types
 */
export type WhatsAppMessage =
  | WhatsAppTextMessage
  | WhatsAppTemplateMessage
  | WhatsAppMediaMessage
  | WhatsAppLocationMessage
  | WhatsAppInteractiveMessage;

/**
 * WhatsApp send result
 */
export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: number;
}

/**
 * WhatsApp status result
 */
export interface WhatsAppStatusResult {
  status: MessageStatus;
  timestamp?: Date;
  error?: string;
}

/**
 * WhatsApp webhook payload
 */
export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: {
            body: string;
          };
          button?: {
            text: string;
            payload: string;
          };
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
          errors?: Array<{
            code: number;
            title: string;
          }>;
        }>;
      };
      field: string;
    }>;
  }>;
}

// ============================================================================
// Communication Service Types
// ============================================================================

/**
 * Notification parameters
 */
export interface NotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels?: CommunicationChannel[];
  schoolId?: string; // Add optional schoolId
}

/**
 * Channel result
 */
export interface ChannelResult {
  success: boolean;
  messageId?: string;
  notificationId?: string;
  error?: string;
}

/**
 * Communication result
 */
export interface CommunicationResult {
  success: boolean;
  channels: {
    email?: ChannelResult;
    sms?: ChannelResult;
    whatsapp?: ChannelResult;
    inApp?: ChannelResult;
  };
}

/**
 * Attendance alert parameters
 */
export interface AttendanceAlertParams {
  studentId: string;
  studentName: string;
  date: Date;
  status: 'ABSENT' | 'LATE' | 'PRESENT';
  attendancePercentage: number;
  parentId: string;
}

/**
 * Leave notification parameters
 */
export interface LeaveNotificationParams {
  applicantId: string;
  applicantName: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  approverName?: string;
  rejectionReason?: string;
  isTeacher?: boolean;
}

/**
 * Fee reminder parameters
 */
export interface FeeReminderParams {
  studentId: string;
  studentName: string;
  amount: number;
  dueDate: Date;
  isOverdue: boolean;
  outstandingBalance: number;
  paymentLink?: string;
  parentId: string;
}

/**
 * Bulk notification parameters
 */
export interface BulkNotificationParams {
  recipients: string[];
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  channel: CommunicationChannel;
  templateId?: string;
}

/**
 * Bulk communication result
 */
export interface BulkCommunicationResult {
  success: boolean;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  results: Array<{
    userId: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}

/**
 * Message log entry
 */
export interface MessageLogEntry {
  id: string;
  channel: CommunicationChannel;
  recipient: string;
  userId?: string;
  templateId?: string;
  subject?: string;
  body?: string;
  status: MessageStatus;
  messageId?: string;
  errorCode?: string;
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  estimatedCost?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Message template variable
 */
export interface MessageTemplateVariable {
  name: string;
  description?: string;
  required: boolean;
  example?: string;
}

/**
 * Contact preference
 */
export interface ContactPreference {
  userId: string;
  preferredMethod: CommunicationChannel | 'ALL';
  emailNotifications: boolean;
  smsNotifications: boolean;
  whatsappNotifications: boolean;
  pushNotifications: boolean;
  whatsappOptIn: boolean;
  whatsappNumber?: string;
  preferredLanguage?: string;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Communication error
 */
export class CommunicationError extends Error {
  constructor(
    message: string,
    public code?: string,
    public channel?: CommunicationChannel,
    public originalError?: any
  ) {
    super(message);
    this.name = 'CommunicationError';
  }
}

/**
 * MSG91 error
 */
export class MSG91Error extends CommunicationError {
  constructor(
    message: string,
    public code?: string,
    public phoneNumber?: string,
    public templateId?: string
  ) {
    super(message, code, CommunicationChannel.SMS);
    this.name = 'MSG91Error';
  }
}

/**
 * WhatsApp error
 */
export class WhatsAppError extends CommunicationError {
  constructor(
    message: string,
    code?: number,
    public phoneNumber?: string,
    public messageType?: string,
    public messageId?: string
  ) {
    super(message, code?.toString(), CommunicationChannel.WHATSAPP);
    this.name = 'WhatsAppError';
  }
}
