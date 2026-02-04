/**
 * Calendar Security Utilities
 * 
 * Provides security measures for calendar operations including:
 * - Rate limiting
 * - Input sanitization
 * - File upload validation
 * - Audit logging
 * - CSRF protection
 * 
 * Requirements: Security requirements for academic calendar system
 */

import { rateLimit, getClientIp } from './rate-limit';
import { sanitizeText, sanitizeHtml, sanitizeUrl } from './input-sanitization';
import { logCreate, logUpdate, logDelete, logImport, logExport } from './audit-log';
import { verifyCsrfToken } from './csrf';
import { NextRequest } from 'next/server';

/**
 * Rate limit presets for calendar operations
 */
export const CalendarRateLimits = {
  // Event creation: 100 requests per hour per user
  EVENT_CREATE: { limit: 100, window: 60 * 60 * 1000 },
  
  // Event queries: 1000 requests per hour per user
  EVENT_QUERY: { limit: 1000, window: 60 * 60 * 1000 },
  
  // Import operations: 10 requests per hour per admin
  IMPORT: { limit: 10, window: 60 * 60 * 1000 },
  
  // Export operations: 20 requests per hour per user
  EXPORT: { limit: 20, window: 60 * 60 * 1000 },
} as const;

/**
 * Check rate limit for calendar operations
 * 
 * @param request - Next.js request object
 * @param operation - Type of operation
 * @returns Rate limit result
 */
export async function checkCalendarRateLimit(
  request: NextRequest,
  operation: keyof typeof CalendarRateLimits
): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const clientIp = getClientIp(request.headers);
  const identifier = `calendar:${operation}:${clientIp}`;
  
  const result = await rateLimit(identifier);
  
  return {
    allowed: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Sanitize calendar event data
 * 
 * @param eventData - Raw event data from user input
 * @returns Sanitized event data
 */
export function sanitizeEventData(eventData: any): any {
  return {
    title: sanitizeText(eventData.title || ''),
    description: eventData.description ? sanitizeHtml(eventData.description) : undefined,
    location: eventData.location ? sanitizeText(eventData.location) : undefined,
    categoryId: sanitizeText(eventData.categoryId || ''),
    startDate: eventData.startDate,
    endDate: eventData.endDate,
    isAllDay: Boolean(eventData.isAllDay),
    visibleToRoles: Array.isArray(eventData.visibleToRoles) 
      ? eventData.visibleToRoles.map((role: string) => sanitizeText(role))
      : [],
    visibleToClasses: Array.isArray(eventData.visibleToClasses)
      ? eventData.visibleToClasses.map((id: string) => sanitizeText(id))
      : [],
    visibleToSections: Array.isArray(eventData.visibleToSections)
      ? eventData.visibleToSections.map((id: string) => sanitizeText(id))
      : [],
    sourceType: eventData.sourceType ? sanitizeText(eventData.sourceType) : undefined,
    sourceId: eventData.sourceId ? sanitizeText(eventData.sourceId) : undefined,
    isRecurring: Boolean(eventData.isRecurring),
    recurrenceRule: eventData.recurrenceRule ? sanitizeText(eventData.recurrenceRule) : undefined,
    exceptionDates: Array.isArray(eventData.exceptionDates) ? eventData.exceptionDates : [],
    attachments: Array.isArray(eventData.attachments)
      ? eventData.attachments.map((url: string) => sanitizeUrl(url))
      : [],
    createdBy: eventData.createdBy,
  };
}

/**
 * Sanitize event category data
 * 
 * @param categoryData - Raw category data from user input
 * @returns Sanitized category data
 */
export function sanitizeCategoryData(categoryData: any): any {
  return {
    name: sanitizeText(categoryData.name || ''),
    description: categoryData.description ? sanitizeText(categoryData.description) : undefined,
    color: sanitizeColor(categoryData.color || '#000000'),
    icon: categoryData.icon ? sanitizeText(categoryData.icon) : undefined,
    isActive: Boolean(categoryData.isActive ?? true),
    order: typeof categoryData.order === 'number' ? categoryData.order : 0,
  };
}

/**
 * Sanitize event note data
 * 
 * @param noteData - Raw note data from user input
 * @returns Sanitized note data
 */
export function sanitizeNoteData(noteData: any): any {
  return {
    content: sanitizeHtml(noteData.content || ''),
    eventId: sanitizeText(noteData.eventId || ''),
    userId: sanitizeText(noteData.userId || ''),
  };
}

/**
 * Sanitize color hex code
 * 
 * @param color - Color string
 * @returns Valid hex color code
 */
function sanitizeColor(color: string): string {
  // Remove any non-hex characters
  const cleaned = color.replace(/[^0-9A-Fa-f#]/g, '');
  
  // Ensure it starts with #
  if (!cleaned.startsWith('#')) {
    return '#' + cleaned.slice(0, 6).padEnd(6, '0');
  }
  
  // Ensure it's exactly 7 characters (#RRGGBB)
  if (cleaned.length !== 7) {
    return cleaned.slice(0, 7).padEnd(7, '0');
  }
  
  return cleaned;
}

/**
 * Validate file upload for calendar attachments
 * 
 * @param file - File to validate
 * @returns Validation result
 */
export function validateCalendarAttachment(file: File): {
  valid: boolean;
  error?: string;
} {
  // Maximum file size: 10MB
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  
  // Allowed file types
  const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }
  
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: PDF, DOC, DOCX, XLS, XLSX, JPEG, PNG, GIF, WEBP`,
    };
  }
  
  // Check file name for suspicious patterns
  const suspiciousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.sh$/i,
    /\.php$/i,
    /\.js$/i,
    /\.html$/i,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(file.name)) {
      return {
        valid: false,
        error: 'File name contains suspicious extension',
      };
    }
  }
  
  return { valid: true };
}

/**
 * Validate attachment URL
 * 
 * @param url - URL to validate
 * @returns Validation result
 */
export function validateAttachmentUrl(url: string): {
  valid: boolean;
  error?: string;
} {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow HTTPS URLs
    if (parsedUrl.protocol !== 'https:') {
      return {
        valid: false,
        error: 'Only HTTPS URLs are allowed for attachments',
      };
    }
    
    // Check for allowed domains (if you have specific storage providers)
    // For example, only allow your own CDN domain
    const allowedDomains = [
      'cdn.yourdomain.com', // Your R2 CDN domain
      // Add your own domains here
    ];
    
    // If allowedDomains is configured, validate against it
    if (allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(domain => 
        parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
      );
      
      if (!isAllowed) {
        return {
          valid: false,
          error: 'Attachment URL must be from an allowed domain',
        };
      }
    }
    
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid URL format',
    };
  }
}

/**
 * Log calendar event creation
 * 
 * @param userId - User ID who created the event
 * @param eventId - Created event ID
 * @param eventData - Event data
 */
export async function logEventCreation(
  userId: string,
  eventId: string,
  eventData: any
): Promise<void> {
  await logCreate(userId, 'calendar_event', eventId, {
    title: eventData.title,
    categoryId: eventData.categoryId,
    startDate: eventData.startDate,
    endDate: eventData.endDate,
    isRecurring: eventData.isRecurring,
  });
}

/**
 * Log calendar event update
 * 
 * @param userId - User ID who updated the event
 * @param eventId - Updated event ID
 * @param before - Event data before update
 * @param after - Event data after update
 */
export async function logEventUpdate(
  userId: string,
  eventId: string,
  before: any,
  after: any
): Promise<void> {
  await logUpdate(userId, 'calendar_event', eventId, {
    before: {
      title: before.title,
      startDate: before.startDate,
      endDate: before.endDate,
      categoryId: before.categoryId,
    },
    after: {
      title: after.title,
      startDate: after.startDate,
      endDate: after.endDate,
      categoryId: after.categoryId,
    },
  });
}

/**
 * Log calendar event deletion
 * 
 * @param userId - User ID who deleted the event
 * @param eventId - Deleted event ID
 * @param eventData - Event data before deletion
 */
export async function logEventDeletion(
  userId: string,
  eventId: string,
  eventData: any
): Promise<void> {
  await logDelete(userId, 'calendar_event', eventId, {
    title: eventData.title,
    categoryId: eventData.categoryId,
    startDate: eventData.startDate,
    endDate: eventData.endDate,
  });
}

/**
 * Log calendar import operation
 * 
 * @param userId - User ID who performed the import
 * @param format - Import format (ical, csv, json)
 * @param recordCount - Number of records imported
 * @param summary - Import summary
 */
export async function logCalendarImport(
  userId: string,
  format: string,
  recordCount: number,
  summary?: any
): Promise<void> {
  await logImport(userId, 'calendar_events', recordCount, {
    format,
    ...summary,
  });
}

/**
 * Log calendar export operation
 * 
 * @param userId - User ID who performed the export
 * @param format - Export format (ical, csv, json)
 * @param filters - Export filters applied
 */
export async function logCalendarExport(
  userId: string,
  format: string,
  filters?: any
): Promise<void> {
  await logExport(userId, 'calendar_events', format, filters);
}

/**
 * Verify CSRF token for calendar operations
 * 
 * @param token - CSRF token from request
 * @returns true if valid, false otherwise
 */
export async function verifyCalendarCsrfToken(token: string | null | undefined): Promise<boolean> {
  return await verifyCsrfToken(token);
}

/**
 * Create rate limit error response
 * 
 * @param limit - Rate limit
 * @param reset - Reset timestamp
 * @returns Error response data
 */
export function createRateLimitError(limit: number, reset: number) {
  return {
    error: 'Too many requests. Please try again later.',
    rateLimit: {
      limit,
      remaining: 0,
      reset,
      retryAfter: Math.ceil((reset - Date.now()) / 1000),
    },
  };
}
