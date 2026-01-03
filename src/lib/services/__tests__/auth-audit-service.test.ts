/**
 * Tests for Authentication Audit Logging Service
 * 
 * Validates that all authentication events are properly logged
 * according to Requirements 16.1-16.7
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { db } from "@/lib/db"
import {
  logLoginSuccess,
  logLoginFailure,
  logLogout,
  logPasswordChange,
  logPasswordResetRequest,
  logPasswordResetComplete,
  log2FAEnabled,
  log2FADisabled,
  log2FABackupCodeUsed,
  log2FABackupCodesRegenerated,
  logRoleChange,
  logAuthorizationFailure,
  logUserRegistration,
  logEmailVerified,
  logSessionRevoked,
  logAllSessionsRevoked,
  AuthAuditEvent
} from "../auth-audit-service"

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    auditLog: {
      create: vi.fn()
    }
  }
}))

// Mock headers
vi.mock("next/headers", () => ({
  headers: vi.fn(() => ({
    get: vi.fn((header: string) => {
      if (header === "x-forwarded-for") return "192.168.1.1"
      if (header === "user-agent") return "Mozilla/5.0"
      return null
    })
  }))
}))

describe("Authentication Audit Service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Login Events (Requirement 16.1)", () => {
    it("should log successful login", async () => {
      await logLoginSuccess("user-123", "test@example.com", "credentials")

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-123",
          action: AuthAuditEvent.LOGIN_SUCCESS,
          resource: "AUTH",
          changes: expect.objectContaining({
            event: AuthAuditEvent.LOGIN_SUCCESS,
            success: true,
            email: "test@example.com",
            provider: "credentials"
          })
        })
      })
    })

    it("should log failed login with invalid credentials", async () => {
      await logLoginFailure("test@example.com", "INVALID_CREDENTIALS")

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuthAuditEvent.LOGIN_FAILED_INVALID_CREDENTIALS,
          resource: "AUTH",
          changes: expect.objectContaining({
            success: false,
            email: "test@example.com",
            reason: "INVALID_CREDENTIALS"
          })
        })
      })
    })

    it("should log failed login with email not verified", async () => {
      await logLoginFailure("test@example.com", "EMAIL_NOT_VERIFIED")

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuthAuditEvent.LOGIN_FAILED_EMAIL_NOT_VERIFIED,
          changes: expect.objectContaining({
            success: false,
            reason: "EMAIL_NOT_VERIFIED"
          })
        })
      })
    })

    it("should log failed login with account inactive", async () => {
      await logLoginFailure("test@example.com", "ACCOUNT_INACTIVE")

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuthAuditEvent.LOGIN_FAILED_ACCOUNT_INACTIVE,
          changes: expect.objectContaining({
            success: false,
            reason: "ACCOUNT_INACTIVE"
          })
        })
      })
    })

    it("should log failed login with 2FA required", async () => {
      await logLoginFailure("test@example.com", "2FA_REQUIRED")

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuthAuditEvent.LOGIN_FAILED_2FA_REQUIRED,
          changes: expect.objectContaining({
            success: false,
            reason: "2FA_REQUIRED"
          })
        })
      })
    })

    it("should log failed login with invalid 2FA code", async () => {
      await logLoginFailure("test@example.com", "INVALID_2FA_CODE")

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuthAuditEvent.LOGIN_FAILED_INVALID_2FA,
          changes: expect.objectContaining({
            success: false,
            reason: "INVALID_2FA_CODE"
          })
        })
      })
    })

    it("should log login with provider info", async () => {
      await logLoginSuccess("user-123", "test@example.com", "credentials")

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuthAuditEvent.LOGIN_SUCCESS,
          changes: expect.objectContaining({
            provider: "credentials"
          })
        })
      })
    })
  })

  describe("Logout Events (Requirement 16.2)", () => {
    it("should log logout", async () => {
      await logLogout("user-123")

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-123",
          action: AuthAuditEvent.LOGOUT_SUCCESS,
          resource: "AUTH",
          changes: expect.objectContaining({
            success: true
          })
        })
      })
    })

    it("should log session revocation", async () => {
      await logSessionRevoked("user-123", "session-456", "user")

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-123",
          action: AuthAuditEvent.SESSION_REVOKED,
          resource: "SESSION",
          resourceId: "session-456",
          changes: expect.objectContaining({
            revokedBy: "user"
          })
        })
      })
    })

    it("should log all sessions revocation", async () => {
      await logAllSessionsRevoked("user-123", 3, "admin")

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-123",
          action: AuthAuditEvent.ALL_SESSIONS_REVOKED,
          resource: "USER_SESSIONS",
          changes: expect.objectContaining({
            sessionCount: 3,
            revokedBy: "admin"
          })
        })
      })
    })
  })

  describe("Password Events (Requirement 16.3)", () => {
    it("should log password change", async () => {
      await logPasswordChange("user-123", "test@example.com", "user")

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-123",
          action: AuthAuditEvent.PASSWORD_CHANGED,
          changes: expect.objectContaining({
            email: "test@example.com",
            initiatedBy: "user"
          })
        })
      })
    })

    it("should log password reset request", async () => {
      await logPasswordResetRequest("test@example.com", "user-123")

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-123",
          action: AuthAuditEvent.PASSWORD_RESET_REQUESTED,
          changes: expect.objectContaining({
            email: "test@example.com"
          })
        })
      })
    })

    it("should log password reset completion", async () => {
      await logPasswordResetComplete("user-123", "test@example.com")

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-123",
          action: AuthAuditEvent.PASSWORD_RESET_COMPLETED,
          changes: expect.objectContaining({
            email: "test@example.com"
          })
        })
      })
    })
  })

  describe("2FA Events (Requirement 16.4)", () => {
    it("should log 2FA enablement", async () => {
      await log2FAEnabled("user-123", "test@example.com")

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-123",
          action: AuthAuditEvent.TWO_FA_ENABLED,
          changes: expect.objectContaining({
            email: "test@example.com"
          })
        })
      })
    })

    it("should log 2FA disablement", async () => {
      await log2FADisabled("user-123", "test@example.com")

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-123",
          action: AuthAuditEvent.TWO_FA_DISABLED,
          changes: expect.objectContaining({
            email: "test@example.com"
          })
        })
      })
    })

    it("should log 2FA backup code usage", async () => {
      await log2FABackupCodeUsed("user-123", 5)

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-123",
          action: AuthAuditEvent.TWO_FA_BACKUP_CODE_USED,
          changes: expect.objectContaining({
            remainingCodes: 5
          })
        })
      })
    })

    it("should log 2FA backup codes regeneration", async () => {
      await log2FABackupCodesRegenerated("user-123")

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-123",
          action: AuthAuditEvent.TWO_FA_BACKUP_CODES_REGENERATED
        })
      })
    })
  })

  describe("Role Change Events (Requirement 16.5)", () => {
    it("should log role change", async () => {
      await logRoleChange("user-123", "STUDENT", "TEACHER", "admin-456")

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-123",
          action: AuthAuditEvent.ROLE_CHANGED,
          resource: "USER_ROLE",
          resourceId: "user-123",
          changes: expect.objectContaining({
            oldRole: "STUDENT",
            newRole: "TEACHER",
            changedBy: "admin-456"
          })
        })
      })
    })
  })

  describe("Authorization Failure Events (Requirement 16.7)", () => {
    it("should log authorization failure", async () => {
      await logAuthorizationFailure(
        "user-123",
        "ADMIN_ROUTE",
        "ACCESS",
        "Access denied"
      )

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-123",
          action: AuthAuditEvent.AUTHORIZATION_FAILED,
          resource: "ADMIN_ROUTE",
          changes: expect.objectContaining({
            success: false,
            action: "ACCESS",
            reason: "Access denied"
          })
        })
      })
    })

    it("should log authorization failure due to insufficient permissions", async () => {
      await logAuthorizationFailure(
        "user-123",
        "ADMIN_ROUTE",
        "ACCESS",
        "insufficient permissions"
      )

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuthAuditEvent.AUTHORIZATION_FAILED_INSUFFICIENT_PERMISSIONS
        })
      })
    })

    it("should log authorization failure due to IP block", async () => {
      await logAuthorizationFailure(
        "user-123",
        "ADMIN_ROUTE",
        "ACCESS",
        "IP address blocked"
      )

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuthAuditEvent.AUTHORIZATION_FAILED_IP_BLOCKED
        })
      })
    })

    it("should log authorization failure due to rate limiting", async () => {
      await logAuthorizationFailure(
        "user-123",
        "API_ROUTE",
        "ACCESS",
        "Rate limit exceeded"
      )

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuthAuditEvent.AUTHORIZATION_FAILED_RATE_LIMITED
        })
      })
    })
  })


  describe("Registration Events", () => {
    it("should log user registration", async () => {
      await logUserRegistration("user-123", "test@example.com")

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-123",
          action: AuthAuditEvent.USER_REGISTERED,
          changes: expect.objectContaining({
            email: "test@example.com",
            provider: "credentials"
          })
        })
      })
    })

    it("should log email verification", async () => {
      await logEmailVerified("user-123", "test@example.com")

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-123",
          action: AuthAuditEvent.EMAIL_VERIFIED,
          changes: expect.objectContaining({
            email: "test@example.com"
          })
        })
      })
    })
  })

  describe("Error Handling", () => {
    it("should not throw error if audit logging fails", async () => {
      vi.mocked(db.auditLog.create).mockRejectedValueOnce(new Error("Database error"))

      // Should not throw
      await expect(logLoginSuccess("user-123", "test@example.com")).resolves.not.toThrow()
    })

    it("should handle missing IP address and user agent gracefully", async () => {
      await logLoginSuccess("user-123", "test@example.com")

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ipAddress: expect.any(String),
          userAgent: expect.any(String)
        })
      })
    })
  })
})
