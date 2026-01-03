/**
 * Authentication Audit Logging Service
 * 
 * Provides comprehensive audit logging for all authentication-related events.
 * This service ensures all security-relevant events are logged for monitoring
 * and compliance purposes.
 * 
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7
 */

import { db } from "@/lib/db"
import { headers } from "next/headers"

/**
 * Authentication event types for audit logging
 */
export enum AuthAuditEvent {
  // Login events (Requirement 16.1)
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILED = "LOGIN_FAILED",
  LOGIN_FAILED_INVALID_CREDENTIALS = "LOGIN_FAILED_INVALID_CREDENTIALS",
  LOGIN_FAILED_EMAIL_NOT_VERIFIED = "LOGIN_FAILED_EMAIL_NOT_VERIFIED",
  LOGIN_FAILED_ACCOUNT_INACTIVE = "LOGIN_FAILED_ACCOUNT_INACTIVE",
  LOGIN_FAILED_2FA_REQUIRED = "LOGIN_FAILED_2FA_REQUIRED",
  LOGIN_FAILED_INVALID_2FA = "LOGIN_FAILED_INVALID_2FA",

  // Logout events (Requirement 16.2)
  LOGOUT_SUCCESS = "LOGOUT_SUCCESS",

  // Password events (Requirement 16.3)
  PASSWORD_CHANGED = "PASSWORD_CHANGED",
  PASSWORD_RESET_REQUESTED = "PASSWORD_RESET_REQUESTED",
  PASSWORD_RESET_COMPLETED = "PASSWORD_RESET_COMPLETED",

  // 2FA events (Requirement 16.4)
  TWO_FA_ENABLED = "2FA_ENABLED",
  TWO_FA_DISABLED = "2FA_DISABLED",
  TWO_FA_BACKUP_CODE_USED = "2FA_BACKUP_CODE_USED",
  TWO_FA_BACKUP_CODES_REGENERATED = "2FA_BACKUP_CODES_REGENERATED",

  // Role change events (Requirement 16.5)
  ROLE_CHANGED = "ROLE_CHANGED",

  // Authorization failure events (Requirement 16.7)
  AUTHORIZATION_FAILED = "AUTHORIZATION_FAILED",
  AUTHORIZATION_FAILED_INSUFFICIENT_PERMISSIONS = "AUTHORIZATION_FAILED_INSUFFICIENT_PERMISSIONS",
  AUTHORIZATION_FAILED_IP_BLOCKED = "AUTHORIZATION_FAILED_IP_BLOCKED",
  AUTHORIZATION_FAILED_RATE_LIMITED = "AUTHORIZATION_FAILED_RATE_LIMITED",

  // Registration events
  USER_REGISTERED = "USER_REGISTERED",
  EMAIL_VERIFIED = "EMAIL_VERIFIED",

  // Session events
  SESSION_CREATED = "SESSION_CREATED",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  SESSION_REVOKED = "SESSION_REVOKED",
  ALL_SESSIONS_REVOKED = "ALL_SESSIONS_REVOKED"
}

/**
 * Context for authentication audit logging
 */
export interface AuthAuditContext {
  userId?: string
  email?: string
  ipAddress?: string
  userAgent?: string
  event: AuthAuditEvent
  resource?: string
  resourceId?: string
  details?: Record<string, any>
  success: boolean
}

/**
 * Get IP address and user agent from request headers
 */
async function getRequestMetadata(): Promise<{ ipAddress: string; userAgent: string }> {
  try {
    const headersList = await headers()

    // Try to get real IP from various headers (for proxies/load balancers)
    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
      headersList.get('x-real-ip') ||
      headersList.get('cf-connecting-ip') || // Cloudflare
      'unknown'

    const userAgent = headersList.get('user-agent') || 'unknown'

    return { ipAddress, userAgent }
  } catch (error) {
    // If headers() fails (e.g., not in request context), return defaults
    return { ipAddress: 'unknown', userAgent: 'unknown' }
  }
}

/**
 * Log an authentication audit event
 * 
 * This is the main function for logging all authentication-related events.
 * It automatically captures IP address and user agent from the request context.
 * 
 * @param context - The authentication audit context
 * @returns Promise<void>
 */
export async function logAuthAudit(context: AuthAuditContext): Promise<void> {
  try {
    // Get request metadata if not provided
    let ipAddress = context.ipAddress
    let userAgent = context.userAgent

    if (!ipAddress || !userAgent) {
      const metadata = await getRequestMetadata()
      ipAddress = ipAddress || metadata.ipAddress
      userAgent = userAgent || metadata.userAgent
    }

    // Map event to valid AuditAction
    const actionMap: Record<string, string> = {
      'LOGIN_SUCCESS': 'LOGIN',
      'LOGIN_FAILED_INVALID_CREDENTIALS': 'LOGIN',
      'LOGIN_FAILED_ACCOUNT_DISABLED': 'LOGIN',
      'LOGIN_FAILED_2FA_REQUIRED': 'LOGIN',
      'LOGIN_FAILED_2FA_INVALID': 'LOGIN',
      'LOGOUT_SUCCESS': 'LOGOUT',
      'PASSWORD_RESET_REQUESTED': 'UPDATE',
      'PASSWORD_RESET_COMPLETED': 'UPDATE',
      'PASSWORD_CHANGED': 'UPDATE',
      'EMAIL_VERIFICATION_SENT': 'UPDATE',
      'EMAIL_VERIFIED': 'VERIFY',
      '2FA_ENABLED': 'UPDATE',
      '2FA_DISABLED': 'UPDATE',
    };

    const action = actionMap[context.event] || 'UPDATE';

    // Create audit log entry
    await db.auditLog.create({
      data: {
        userId: context.userId || "anonymous",
        action: action as any,
        resource: context.resource || "AUTH",
        resourceId: context.resourceId || null,
        changes: {
          event: context.event,
          success: context.success,
          email: context.email,
          timestamp: new Date().toISOString(),
          ...context.details
        },
        ipAddress: ipAddress || null,
        userAgent: userAgent || null
      }
    })

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      const logLevel = context.success ? "log" : "warn"
      console[logLevel](`[Auth Audit] ${context.event}`, {
        userId: context.userId,
        email: context.email,
        success: context.success,
        ipAddress
      })
    }
  } catch (error) {
    // Don't throw if logging fails - just log to console
    console.error("Failed to log authentication audit event:", error)
  }
}

/**
 * Log a successful login attempt (Requirement 16.1)
 */
export async function logLoginSuccess(
  userId: string,
  email: string,
  provider: string = "credentials",
  details?: Record<string, any>
): Promise<void> {
  await logAuthAudit({
    userId,
    email,
    event: provider === "credentials"
      ? AuthAuditEvent.LOGIN_SUCCESS
      : AuthAuditEvent.LOGIN_SUCCESS,
    success: true,
    details: {
      provider,
      ...details
    }
  })
}

/**
 * Log a failed login attempt (Requirement 16.1)
 */
export async function logLoginFailure(
  email: string,
  reason: string,
  details?: Record<string, any>
): Promise<void> {
  // Map reason to specific event
  let event = AuthAuditEvent.LOGIN_FAILED

  if (reason.includes("INVALID_CREDENTIALS") || reason.includes("invalid")) {
    event = AuthAuditEvent.LOGIN_FAILED_INVALID_CREDENTIALS
  } else if (reason.includes("EMAIL_NOT_VERIFIED")) {
    event = AuthAuditEvent.LOGIN_FAILED_EMAIL_NOT_VERIFIED
  } else if (reason.includes("ACCOUNT_INACTIVE")) {
    event = AuthAuditEvent.LOGIN_FAILED_ACCOUNT_INACTIVE
  } else if (reason.includes("2FA_REQUIRED")) {
    event = AuthAuditEvent.LOGIN_FAILED_2FA_REQUIRED
  } else if (reason.includes("INVALID_2FA")) {
    event = AuthAuditEvent.LOGIN_FAILED_INVALID_2FA
  }

  await logAuthAudit({
    email,
    event,
    success: false,
    details: {
      reason,
      ...details
    }
  })
}

/**
 * Log a logout event (Requirement 16.2)
 */
export async function logLogout(
  userId: string,
  details?: Record<string, any>
): Promise<void> {
  await logAuthAudit({
    userId,
    event: AuthAuditEvent.LOGOUT_SUCCESS,
    success: true,
    details
  })
}

/**
 * Log a password change event (Requirement 16.3)
 */
export async function logPasswordChange(
  userId: string,
  email: string,
  initiatedBy: "user" | "admin" | "reset" = "user",
  details?: Record<string, any>
): Promise<void> {
  await logAuthAudit({
    userId,
    email,
    event: AuthAuditEvent.PASSWORD_CHANGED,
    success: true,
    details: {
      initiatedBy,
      ...details
    }
  })
}

/**
 * Log a password reset request (Requirement 16.3, 16.6)
 */
export async function logPasswordResetRequest(
  email: string,
  userId?: string,
  details?: Record<string, any>
): Promise<void> {
  await logAuthAudit({
    userId,
    email,
    event: AuthAuditEvent.PASSWORD_RESET_REQUESTED,
    success: true,
    details
  })
}

/**
 * Log a password reset completion (Requirement 16.3)
 */
export async function logPasswordResetComplete(
  userId: string,
  email: string,
  details?: Record<string, any>
): Promise<void> {
  await logAuthAudit({
    userId,
    email,
    event: AuthAuditEvent.PASSWORD_RESET_COMPLETED,
    success: true,
    details
  })
}

/**
 * Log 2FA enablement (Requirement 16.4)
 */
export async function log2FAEnabled(
  userId: string,
  email: string,
  details?: Record<string, any>
): Promise<void> {
  await logAuthAudit({
    userId,
    email,
    event: AuthAuditEvent.TWO_FA_ENABLED,
    success: true,
    details
  })
}

/**
 * Log 2FA disablement (Requirement 16.4)
 */
export async function log2FADisabled(
  userId: string,
  email: string,
  details?: Record<string, any>
): Promise<void> {
  await logAuthAudit({
    userId,
    email,
    event: AuthAuditEvent.TWO_FA_DISABLED,
    success: true,
    details
  })
}

/**
 * Log 2FA backup code usage (Requirement 16.4)
 */
export async function log2FABackupCodeUsed(
  userId: string,
  remainingCodes: number,
  details?: Record<string, any>
): Promise<void> {
  await logAuthAudit({
    userId,
    event: AuthAuditEvent.TWO_FA_BACKUP_CODE_USED,
    success: true,
    details: {
      remainingCodes,
      ...details
    }
  })
}

/**
 * Log 2FA backup codes regeneration (Requirement 16.4)
 */
export async function log2FABackupCodesRegenerated(
  userId: string,
  details?: Record<string, any>
): Promise<void> {
  await logAuthAudit({
    userId,
    event: AuthAuditEvent.TWO_FA_BACKUP_CODES_REGENERATED,
    success: true,
    details
  })
}

/**
 * Log a role change event (Requirement 16.5)
 */
export async function logRoleChange(
  userId: string,
  oldRole: string,
  newRole: string,
  changedBy: string,
  details?: Record<string, any>
): Promise<void> {
  await logAuthAudit({
    userId,
    event: AuthAuditEvent.ROLE_CHANGED,
    resource: "USER_ROLE",
    resourceId: userId,
    success: true,
    details: {
      oldRole,
      newRole,
      changedBy,
      ...details
    }
  })
}

/**
 * Log a failed authorization attempt (Requirement 16.7)
 */
export async function logAuthorizationFailure(
  userId: string,
  resource: string,
  action: string,
  reason: string,
  details?: Record<string, any>
): Promise<void> {
  // Map reason to specific event
  let event = AuthAuditEvent.AUTHORIZATION_FAILED

  if (reason.includes("insufficient") || reason.includes("permission")) {
    event = AuthAuditEvent.AUTHORIZATION_FAILED_INSUFFICIENT_PERMISSIONS
  } else if (reason.includes("ip") || reason.includes("blocked")) {
    event = AuthAuditEvent.AUTHORIZATION_FAILED_IP_BLOCKED
  } else if (reason.includes("rate") || reason.includes("limit")) {
    event = AuthAuditEvent.AUTHORIZATION_FAILED_RATE_LIMITED
  }

  await logAuthAudit({
    userId,
    event,
    resource,
    success: false,
    details: {
      action,
      reason,
      ...details
    }
  })
}

/**
 * Log user registration (Requirement 16.1)
 */
export async function logUserRegistration(
  userId: string,
  email: string,
  provider: string = "credentials",
  details?: Record<string, any>
): Promise<void> {
  await logAuthAudit({
    userId,
    email,
    event: AuthAuditEvent.USER_REGISTERED,
    success: true,
    details: {
      provider,
      ...details
    }
  })
}

/**
 * Log email verification (Requirement 16.1)
 */
export async function logEmailVerified(
  userId: string,
  email: string,
  details?: Record<string, any>
): Promise<void> {
  await logAuthAudit({
    userId,
    email,
    event: AuthAuditEvent.EMAIL_VERIFIED,
    success: true,
    details
  })
}

/**
 * Log session revocation (Requirement 16.2)
 */
export async function logSessionRevoked(
  userId: string,
  sessionId: string,
  revokedBy: "user" | "admin" | "system" = "user",
  details?: Record<string, any>
): Promise<void> {
  await logAuthAudit({
    userId,
    event: AuthAuditEvent.SESSION_REVOKED,
    resource: "SESSION",
    resourceId: sessionId,
    success: true,
    details: {
      revokedBy,
      ...details
    }
  })
}

/**
 * Log all sessions revocation (Requirement 16.2)
 */
export async function logAllSessionsRevoked(
  userId: string,
  sessionCount: number,
  revokedBy: "user" | "admin" | "system" = "user",
  details?: Record<string, any>
): Promise<void> {
  await logAuthAudit({
    userId,
    event: AuthAuditEvent.ALL_SESSIONS_REVOKED,
    resource: "USER_SESSIONS",
    resourceId: userId,
    success: true,
    details: {
      sessionCount,
      revokedBy,
      ...details
    }
  })
}
