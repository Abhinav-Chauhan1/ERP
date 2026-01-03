/**
 * Authentication Error Handling Utilities
 * 
 * Provides centralized error types, logging, and user-friendly error messages
 * for the NextAuth v5 authentication system.
 * 
 * Requirements: 17.1, 17.2, 17.8
 */

import { db } from "./db"
import { AuditAction } from "@prisma/client"

/**
 * Authentication error codes
 */
export enum AuthErrorCode {
  // Credentials errors
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",
  ACCOUNT_INACTIVE = "ACCOUNT_INACTIVE",

  // Rate limiting
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",

  // Two-factor authentication
  TWO_FA_REQUIRED = "2FA_REQUIRED",
  INVALID_2FA_CODE = "INVALID_2FA_CODE",

  // Session errors
  SESSION_EXPIRED = "SESSION_EXPIRED",
  INVALID_SESSION = "INVALID_SESSION",

  // Authorization errors
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",

  // Registration errors
  EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS",
  WEAK_PASSWORD = "WEAK_PASSWORD",
  INVALID_EMAIL = "INVALID_EMAIL",

  // Password reset errors
  INVALID_TOKEN = "INVALID_TOKEN",
  EXPIRED_TOKEN = "EXPIRED_TOKEN",
  TOKEN_ALREADY_USED = "TOKEN_ALREADY_USED",

  // General errors
  INTERNAL_ERROR = "INTERNAL_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR"
}

/**
 * Authentication error class with additional context
 */
export class AuthError extends Error {
  code: AuthErrorCode
  statusCode: number
  details?: Record<string, any>
  retryAfter?: number // For rate limiting (seconds)

  constructor(
    code: AuthErrorCode,
    message: string,
    statusCode: number = 400,
    details?: Record<string, any>,
    retryAfter?: number
  ) {
    super(message)
    this.name = "AuthError"
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.retryAfter = retryAfter
  }
}

/**
 * User-friendly error messages mapped to error codes
 */
export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  // Credentials errors
  [AuthErrorCode.INVALID_CREDENTIALS]: "Invalid email or password. Please check your credentials and try again.",
  [AuthErrorCode.EMAIL_NOT_VERIFIED]: "Please verify your email address before logging in. Check your inbox for the verification link.",
  [AuthErrorCode.ACCOUNT_INACTIVE]: "Your account has been deactivated. Please contact support for assistance.",

  // Rate limiting
  [AuthErrorCode.RATE_LIMIT_EXCEEDED]: "Too many login attempts. Please try again later.",

  // Two-factor authentication
  [AuthErrorCode.TWO_FA_REQUIRED]: "Two-factor authentication code required. Please enter your 6-digit code.",
  [AuthErrorCode.INVALID_2FA_CODE]: "Invalid two-factor authentication code. Please try again or use a backup code.",

  // Session errors
  [AuthErrorCode.SESSION_EXPIRED]: "Your session has expired due to inactivity. Please sign in again to continue.",
  [AuthErrorCode.INVALID_SESSION]: "Invalid session. Please sign in again.",

  // Authorization errors
  [AuthErrorCode.UNAUTHORIZED]: "You must be signed in to access this resource.",
  [AuthErrorCode.FORBIDDEN]: "You do not have permission to access this resource.",
  [AuthErrorCode.INSUFFICIENT_PERMISSIONS]: "You do not have sufficient permissions to perform this action.",

  // Registration errors
  [AuthErrorCode.EMAIL_ALREADY_EXISTS]: "An account with this email already exists. Please sign in or use a different email.",
  [AuthErrorCode.WEAK_PASSWORD]: "Password does not meet security requirements. Please choose a stronger password.",
  [AuthErrorCode.INVALID_EMAIL]: "Invalid email address format. Please enter a valid email.",

  // Password reset errors
  [AuthErrorCode.INVALID_TOKEN]: "Invalid or expired reset link. Please request a new password reset.",
  [AuthErrorCode.EXPIRED_TOKEN]: "This reset link has expired. Please request a new password reset.",
  [AuthErrorCode.TOKEN_ALREADY_USED]: "This reset link has already been used. Please request a new password reset if needed.",

  // General errors
  [AuthErrorCode.INTERNAL_ERROR]: "An unexpected error occurred. Please try again later.",
  [AuthErrorCode.VALIDATION_ERROR]: "Please check your input and try again.",
  [AuthErrorCode.NETWORK_ERROR]: "Network error. Please check your connection and try again."
}

/**
 * Get user-friendly error message for an error code
 */
export function getErrorMessage(code: AuthErrorCode, customMessage?: string): string {
  return customMessage || AUTH_ERROR_MESSAGES[code] || AUTH_ERROR_MESSAGES[AuthErrorCode.INTERNAL_ERROR]
}

/**
 * Get user-friendly error message with retry time for rate limiting
 */
export function getRateLimitMessage(retryAfter: number): string {
  const minutes = Math.ceil(retryAfter / 60)
  return `Too many login attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`
}

/**
 * Context for error logging
 */
export interface AuthErrorContext {
  userId?: string
  email?: string
  ip?: string
  userAgent?: string
  action: string
  resource?: string
  resourceId?: string
  errorCode?: AuthErrorCode
  errorMessage?: string
  details?: Record<string, any>
}

/**
 * Log authentication error to audit log
 * 
 * This function creates an audit log entry for authentication-related errors
 * to help with security monitoring and debugging.
 */
export async function logAuthError(context: AuthErrorContext): Promise<void> {
  try {
    // Determine the audit action based on the context
    let auditAction: AuditAction = AuditAction.LOGIN

    if (context.action.includes("logout")) {
      auditAction = AuditAction.LOGOUT
    } else if (context.action.includes("register") || context.action.includes("create")) {
      auditAction = AuditAction.CREATE
    } else if (context.action.includes("update") || context.action.includes("change")) {
      auditAction = AuditAction.UPDATE
    } else if (context.action.includes("delete")) {
      auditAction = AuditAction.DELETE
    } else if (context.action.includes("verify")) {
      auditAction = AuditAction.VERIFY
    }

    // Create audit log entry
    await db.auditLog.create({
      data: {
        userId: context.userId || "anonymous",
        action: auditAction,
        resource: context.resource || "AUTH",
        resourceId: context.resourceId || null,
        changes: {
          action: context.action,
          errorCode: context.errorCode,
          errorMessage: context.errorMessage,
          email: context.email,
          ...context.details
        },
        ipAddress: context.ip || null,
        userAgent: context.userAgent || null
      }
    })

    // Also log to console for development
    if (process.env.NODE_ENV === "development") {
      console.error("[Auth Error]", {
        action: context.action,
        errorCode: context.errorCode,
        errorMessage: context.errorMessage,
        email: context.email,
        ip: context.ip
      })
    }
  } catch (error) {
    // Don't throw if logging fails - just log to console
    console.error("Failed to log auth error:", error)
  }
}

/**
 * Log successful authentication event
 */
export async function logAuthSuccess(context: Omit<AuthErrorContext, "errorCode" | "errorMessage">): Promise<void> {
  try {
    let auditAction: AuditAction = AuditAction.LOGIN

    if (context.action.includes("logout")) {
      auditAction = AuditAction.LOGOUT
    } else if (context.action.includes("register") || context.action.includes("create")) {
      auditAction = AuditAction.CREATE
    } else if (context.action.includes("verify")) {
      auditAction = AuditAction.VERIFY
    }

    await db.auditLog.create({
      data: {
        userId: context.userId || "anonymous",
        action: auditAction,
        resource: context.resource || "AUTH",
        resourceId: context.resourceId || null,
        changes: {
          action: context.action,
          email: context.email,
          success: true,
          ...context.details
        },
        ipAddress: context.ip || null,
        userAgent: context.userAgent || null
      }
    })

    if (process.env.NODE_ENV === "development") {
      console.log("[Auth Success]", {
        action: context.action,
        email: context.email,
        userId: context.userId
      })
    }
  } catch (error) {
    console.error("Failed to log auth success:", error)
  }
}

/**
 * Parse NextAuth error to AuthError
 */
export function parseNextAuthError(error: any): AuthError {
  const errorString = error?.message || error?.toString() || ""

  // Check for specific error patterns
  if (errorString.includes("2FA_REQUIRED")) {
    return new AuthError(
      AuthErrorCode.TWO_FA_REQUIRED,
      getErrorMessage(AuthErrorCode.TWO_FA_REQUIRED),
      401
    )
  }

  if (errorString.includes("INVALID_2FA_CODE")) {
    return new AuthError(
      AuthErrorCode.INVALID_2FA_CODE,
      getErrorMessage(AuthErrorCode.INVALID_2FA_CODE),
      401
    )
  }

  if (errorString.includes("EMAIL_NOT_VERIFIED")) {
    return new AuthError(
      AuthErrorCode.EMAIL_NOT_VERIFIED,
      getErrorMessage(AuthErrorCode.EMAIL_NOT_VERIFIED),
      403
    )
  }

  if (errorString.includes("ACCOUNT_INACTIVE")) {
    return new AuthError(
      AuthErrorCode.ACCOUNT_INACTIVE,
      getErrorMessage(AuthErrorCode.ACCOUNT_INACTIVE),
      403
    )
  }

  // Default to invalid credentials for security (don't reveal details)
  return new AuthError(
    AuthErrorCode.INVALID_CREDENTIALS,
    getErrorMessage(AuthErrorCode.INVALID_CREDENTIALS),
    401
  )
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: AuthError | Error) {
  if (error instanceof AuthError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      details: error.details,
      retryAfter: error.retryAfter
    }
  }

  // Generic error
  return {
    success: false,
    error: getErrorMessage(AuthErrorCode.INTERNAL_ERROR),
    code: AuthErrorCode.INTERNAL_ERROR
  }
}

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: any): boolean {
  return error instanceof AuthError && error.code === AuthErrorCode.RATE_LIMIT_EXCEEDED
}

/**
 * Check if error requires 2FA
 */
export function requires2FA(error: any): boolean {
  return error instanceof AuthError && error.code === AuthErrorCode.TWO_FA_REQUIRED
}

/**
 * Extract retry time from rate limit error
 */
export function getRetryAfter(error: any): number | undefined {
  if (error instanceof AuthError && error.retryAfter) {
    return error.retryAfter
  }
  return undefined
}
