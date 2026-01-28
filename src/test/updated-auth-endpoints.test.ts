import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as registerPOST } from '@/app/api/auth/register/route'
import { POST as forgotPasswordPOST } from '@/app/api/auth/forgot-password/route'
import { POST as resetPasswordPOST } from '@/app/api/auth/reset-password/route'
import { POST as verifyEmailPOST } from '@/app/api/auth/verify-email/route'
import { POST as validateResetTokenPOST } from '@/app/api/auth/validate-reset-token/route'
import { POST as resendVerificationPOST } from '@/app/api/auth/resend-verification/route'
import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'

/**
 * Unit Tests for Updated Authentication Endpoints
 * 
 * Tests the integration of existing authentication endpoints with the new unified system
 * Requirements: 10.6, 1.1, 2.1, 4.1, 5.1, 6.1, 11.1, 14.1, 15.1
 */

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    userSchool: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    school: {
      findUnique: vi.fn(),
    },
    verificationToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    authSession: {
      deleteMany: vi.fn(),
    },
    student: {
      findMany: vi.fn(),
    }
  }
}))

vi.mock('@/lib/services/school-context-service', () => ({
  schoolContextService: {
    validateSchoolCode: vi.fn(),
    validateSchoolById: vi.fn(),
    getUserSchools: vi.fn(),
    validateSchoolAccess: vi.fn(),
  }
}))

vi.mock('@/lib/services/audit-service', () => ({
  logAuditEvent: vi.fn(),
}))

vi.mock('@/lib/services/rate-limiting-service', () => ({
  rateLimitingService: {
    checkPasswordResetRateLimit: vi.fn(),
    checkEmailVerificationRateLimit: vi.fn(),
  }
}))

vi.mock('@/lib/password', () => ({
  hashPassword: vi.fn(),
  validatePasswordStrength: vi.fn(),
}))

vi.mock('@/lib/utils/email-service', () => ({
  sendEmail: vi.fn(),
}))

vi.mock('@/lib/utils/email-templates', () => ({
  getVerificationEmailHtml: vi.fn(),
  getPasswordResetEmailHtml: vi.fn(),
}))

vi.mock('crypto', () => ({
  randomBytes: vi.fn(),
}))

describe('Updated Authentication Endpoints Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks using direct imports
    vi.mocked(require('@/lib/services/school-context-service')).schoolContextService.validateSchoolCode.mockResolvedValue({
      id: 'school-1',
      name: 'Test School',
      schoolCode: 'TEST001',
      status: 'ACTIVE',
      isOnboarded: true,
      onboardingStep: 5
    })

    vi.mocked(require('@/lib/services/audit-service')).logAuditEvent.mockResolvedValue(undefined)
    
    vi.mocked(require('@/lib/services/rate-limiting-service')).rateLimitingService.checkPasswordResetRateLimit.mockResolvedValue({
      allowed: true,
      nextAttemptAt: new Date(Date.now() + 300000)
    })
    
    vi.mocked(require('@/lib/services/rate-limiting-service')).rateLimitingService.checkEmailVerificationRateLimit.mockResolvedValue({
      allowed: true,
      nextAttemptAt: new Date(Date.now() + 300000)
    })

    vi.mocked(require('@/lib/password')).validatePasswordStrength.mockReturnValue({
      valid: true,
      errors: []
    })
    
    vi.mocked(require('@/lib/password')).hashPassword.mockResolvedValue('hashed-password')
    
    vi.mocked(require('@/lib/utils/email-service')).sendEmail.mockResolvedValue({
      success: true
    })
    
    vi.mocked(require('@/lib/utils/email-templates')).getVerificationEmailHtml.mockReturnValue('<html>Verification Email</html>')
    vi.mocked(require('@/lib/utils/email-templates')).getPasswordResetEmailHtml.mockReturnValue('<html>Reset Email</html>')
    
    vi.mocked(require('crypto')).randomBytes.mockReturnValue({
      toString: () => 'mock-token-123'
    } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Registration Endpoint Integration', () => {
    it('should register user with school context integration', async () => {
      const mockDb = vi.mocked(db)
      
      mockDb.user.findUnique.mockResolvedValue(null) // No existing user
      mockDb.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        mobile: '+1234567890',
        name: 'Test User',
        isActive: true,
        emailVerified: null,
        passwordHash: 'hashed-password'
      } as any)
      
      mockDb.userSchool.create.mockResolvedValue({
        id: 'user-school-1',
        userId: 'user-1',
        schoolId: 'school-1',
        role: UserRole.STUDENT,
        isActive: true
      } as any)

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePass123!',
          firstName: 'Test',
          lastName: 'User',
          mobile: '+1234567890',
          schoolCode: 'TEST001',
          role: UserRole.STUDENT
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await registerPOST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.requiresSchoolSelection).toBe(false)
      expect(data.emailVerificationRequired).toBe(true)
      
      // Verify school context service was called
      expect(vi.mocked(require('@/lib/services/school-context-service')).schoolContextService.validateSchoolCode).toHaveBeenCalledWith('TEST001')
      
      // Verify user-school relationship was created
      expect(mockDb.userSchool.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          schoolId: 'school-1',
          role: UserRole.STUDENT,
          isActive: true
        }
      })
      
      // Verify audit logging
      expect(vi.mocked(require('@/lib/services/audit-service')).logAuditEvent).toHaveBeenCalledWith({
        userId: 'user-1',
        schoolId: 'school-1',
        action: 'CREATE',
        resource: 'user_registration',
        changes: expect.objectContaining({
          email: 'test@example.com',
          mobile: '+1234567890',
          role: UserRole.STUDENT,
          schoolCode: 'TEST001',
          registrationMethod: 'email_password'
        })
      })
    })

    it('should handle registration without school context', async () => {
      const mockDb = vi.mocked(db)
      
      mockDb.user.findUnique.mockResolvedValue(null)
      mockDb.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        isActive: true,
        emailVerified: null,
        passwordHash: 'hashed-password'
      } as any)

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePass123!',
          firstName: 'Test',
          lastName: 'User'
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await registerPOST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.requiresSchoolSelection).toBe(true)
      
      // Verify no user-school relationship was created
      expect(mockDb.userSchool.create).not.toHaveBeenCalled()
    })

    it('should reject registration with invalid school code', async () => {
      vi.mocked(require('@/lib/services/school-context-service')).schoolContextService.validateSchoolCode.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePass123!',
          firstName: 'Test',
          lastName: 'User',
          schoolCode: 'INVALID'
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await registerPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid or inactive school code')
    })
  })

  describe('Forgot Password Endpoint Integration', () => {
    it('should handle forgot password with school context', async () => {
      const mockDb = vi.mocked(db)
      
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        isActive: true,
        userSchools: [{
          id: 'user-school-1',
          schoolId: 'school-1',
          isActive: true,
          school: {
            id: 'school-1',
            name: 'Test School',
            schoolCode: 'TEST001'
          }
        }]
      } as any)

      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          schoolCode: 'TEST001'
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await forgotPasswordPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('password reset link has been sent')
      
      // Verify school context validation
      expect(vi.mocked(require('@/lib/services/school-context-service')).schoolContextService.validateSchoolCode).toHaveBeenCalledWith('TEST001')
      
      // Verify rate limiting check
      expect(vi.mocked(require('@/lib/services/rate-limiting-service')).rateLimitingService.checkPasswordResetRateLimit).toHaveBeenCalledWith('test@example.com')
    })

    it('should handle rate limiting for password reset', async () => {
      vi.mocked(require('@/lib/services/rate-limiting-service')).rateLimitingService.checkPasswordResetRateLimit.mockResolvedValue({
        allowed: false,
        nextAttemptAt: new Date(Date.now() + 60000)
      })

      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com'
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await forgotPasswordPOST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Too many password reset requests')
    })
  })

  describe('Reset Password Endpoint Integration', () => {
    it('should reset password and invalidate sessions', async () => {
      const mockDb = vi.mocked(db)
      
      mockDb.verificationToken.findUnique.mockResolvedValue({
        token: 'valid-token',
        identifier: 'password-reset:test@example.com',
        expires: new Date(Date.now() + 3600000) // 1 hour from now
      } as any)
      
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        userSchools: []
      } as any)

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'valid-token',
          password: 'NewSecurePass123!'
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await resetPasswordPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.sessionInvalidated).toBe(true)
      
      // Verify password was updated
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: 'hashed-password' }
      })
      
      // Verify token was deleted
      expect(mockDb.verificationToken.delete).toHaveBeenCalledWith({
        where: { token: 'valid-token' }
      })
      
      // Verify sessions were invalidated
      expect(mockDb.authSession.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' }
      })
      
      // Verify audit logging for token revocation
      expect(vi.mocked(require('@/lib/services/audit-service')).logAuditEvent).toHaveBeenCalledWith({
        userId: 'user-1',
        action: 'REVOKE',
        resource: 'jwt_token',
        changes: expect.objectContaining({
          reason: 'PASSWORD_RESET',
          allTokensRevoked: true
        })
      })
    })

    it('should handle expired reset token', async () => {
      const mockDb = vi.mocked(db)
      
      mockDb.verificationToken.findUnique.mockResolvedValue({
        token: 'expired-token',
        identifier: 'password-reset:test@example.com',
        expires: new Date(Date.now() - 3600000) // 1 hour ago
      } as any)

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'expired-token',
          password: 'NewSecurePass123!'
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await resetPasswordPOST(request)
      const data = await response.json()

      expect(response.status).toBe(410)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Reset token has expired')
      
      // Verify expired token was deleted
      expect(mockDb.verificationToken.delete).toHaveBeenCalledWith({
        where: { token: 'expired-token' }
      })
    })
  })

  describe('Email Verification Endpoint Integration', () => {
    it('should verify email and log audit event', async () => {
      const mockDb = vi.mocked(db)
      
      mockDb.verificationToken.findUnique.mockResolvedValue({
        token: 'valid-token',
        identifier: 'test@example.com',
        expires: new Date(Date.now() + 86400000) // 24 hours from now
      } as any)
      
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: null,
        userSchools: []
      } as any)

      const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({
          token: 'valid-token'
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await verifyEmailPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.canLogin).toBe(true)
      
      // Verify email was marked as verified
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { emailVerified: expect.any(Date) }
      })
      
      // Verify token was deleted
      expect(mockDb.verificationToken.delete).toHaveBeenCalledWith({
        where: { token: 'valid-token' }
      })
      
      // Verify audit logging
      expect(vi.mocked(require('@/lib/services/audit-service')).logAuditEvent).toHaveBeenCalledWith({
        userId: 'user-1',
        action: 'UPDATE',
        resource: 'email_verification',
        changes: expect.objectContaining({
          email: 'test@example.com',
          previouslyVerified: false
        })
      })
    })

    it('should handle already verified email', async () => {
      const mockDb = vi.mocked(db)
      
      mockDb.verificationToken.findUnique.mockResolvedValue({
        token: 'valid-token',
        identifier: 'test@example.com',
        expires: new Date(Date.now() + 86400000)
      } as any)
      
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        emailVerified: new Date(),
        userSchools: []
      } as any)

      const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({
          token: 'valid-token'
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await verifyEmailPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.alreadyVerified).toBe(true)
      
      // Verify token was deleted
      expect(mockDb.verificationToken.delete).toHaveBeenCalledWith({
        where: { token: 'valid-token' }
      })
    })
  })

  describe('Validate Reset Token Endpoint Integration', () => {
    it('should validate reset token and user status', async () => {
      const mockDb = vi.mocked(db)
      
      mockDb.verificationToken.findUnique.mockResolvedValue({
        token: 'valid-token',
        identifier: 'password-reset:test@example.com',
        expires: new Date(Date.now() + 3600000)
      } as any)
      
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        isActive: true
      } as any)

      const request = new NextRequest('http://localhost:3000/api/auth/validate-reset-token', {
        method: 'POST',
        body: JSON.stringify({
          token: 'valid-token'
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await validateResetTokenPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.email).toBe('test@example.com')
      
      // Verify audit logging
      expect(vi.mocked(require('@/lib/services/audit-service')).logAuditEvent).toHaveBeenCalledWith({
        userId: 'user-1',
        action: 'SUCCESS',
        resource: 'password_reset_validation',
        changes: expect.objectContaining({
          email: 'test@example.com'
        })
      })
    })

    it('should handle inactive user', async () => {
      const mockDb = vi.mocked(db)
      
      mockDb.verificationToken.findUnique.mockResolvedValue({
        token: 'valid-token',
        identifier: 'password-reset:test@example.com',
        expires: new Date(Date.now() + 3600000)
      } as any)
      
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        isActive: false
      } as any)

      const request = new NextRequest('http://localhost:3000/api/auth/validate-reset-token', {
        method: 'POST',
        body: JSON.stringify({
          token: 'valid-token'
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await validateResetTokenPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid reset token')
      
      // Verify token was deleted
      expect(mockDb.verificationToken.delete).toHaveBeenCalledWith({
        where: { token: 'valid-token' }
      })
    })
  })

  describe('Resend Verification Endpoint Integration', () => {
    it('should resend verification with rate limiting', async () => {
      const mockDb = vi.mocked(db)
      
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        isActive: true,
        emailVerified: null,
        userSchools: []
      } as any)

      const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com'
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await resendVerificationPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.expiresAt).toBeDefined()
      
      // Verify rate limiting check
      expect(vi.mocked(require('@/lib/services/rate-limiting-service')).rateLimitingService.checkEmailVerificationRateLimit).toHaveBeenCalledWith('test@example.com')
      
      // Verify old tokens were deleted
      expect(mockDb.verificationToken.deleteMany).toHaveBeenCalledWith({
        where: { identifier: 'test@example.com' }
      })
      
      // Verify new token was created
      expect(mockDb.verificationToken.create).toHaveBeenCalled()
    })

    it('should handle rate limiting for verification resend', async () => {
      vi.mocked(require('@/lib/services/rate-limiting-service')).rateLimitingService.checkEmailVerificationRateLimit.mockResolvedValue({
        allowed: false,
        nextAttemptAt: new Date(Date.now() + 60000)
      })

      const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com'
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await resendVerificationPOST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Too many verification email requests')
    })

    it('should handle already verified email', async () => {
      const mockDb = vi.mocked(db)
      
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        isActive: true,
        emailVerified: new Date(),
        userSchools: []
      } as any)

      const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com'
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await resendVerificationPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.alreadyVerified).toBe(true)
      expect(data.error).toContain('Email is already verified')
    })
  })

  describe('Error Handling and Security', () => {
    it('should handle database errors gracefully', async () => {
      const mockDb = vi.mocked(db)
      mockDb.user.findUnique.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePass123!',
          firstName: 'Test',
          lastName: 'User'
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await registerPOST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('An error occurred during registration')
      
      // Verify error was logged
      expect(vi.mocked(require('@/lib/services/audit-service')).logAuditEvent).toHaveBeenCalledWith({
        userId: null,
        action: 'ERROR',
        resource: 'user_registration',
        changes: expect.objectContaining({
          error: 'Database connection failed'
        })
      })
    })

    it('should not reveal user existence in security-sensitive endpoints', async () => {
      const mockDb = vi.mocked(db)
      mockDb.user.findUnique.mockResolvedValue(null) // User doesn't exist

      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com'
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await forgotPasswordPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('If an account with that email exists, a password reset link has been sent.')
      
      // Should still log the attempt
      expect(vi.mocked(require('@/lib/services/audit-service')).logAuditEvent).toHaveBeenCalledWith({
        userId: null,
        schoolId: undefined,
        action: 'FAILED',
        resource: 'password_reset',
        changes: expect.objectContaining({
          reason: 'USER_NOT_FOUND'
        })
      })
    })
  })
})