import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as registerPOST } from '@/app/api/auth/register/route'
import { POST as verifyEmailPOST } from '@/app/api/auth/verify-email/route'
import { POST as forgotPasswordPOST } from '@/app/api/auth/forgot-password/route'
import { POST as resetPasswordPOST } from '@/app/api/auth/reset-password/route'
import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'

/**
 * Integration Tests for Updated Authentication Endpoints
 * 
 * Tests the complete authentication flows with the unified system integration
 * Requirements: 10.6, 1.1, 2.1, 4.1, 5.1, 6.1, 11.1, 14.1, 15.1
 */

// Mock external dependencies but allow internal service integration
vi.mock('@/lib/utils/email-service', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true })
}))

vi.mock('@/lib/utils/email-templates', () => ({
  getVerificationEmailHtml: vi.fn().mockReturnValue('<html>Verification Email</html>'),
  getPasswordResetEmailHtml: vi.fn().mockReturnValue('<html>Reset Email</html>')
}))

vi.mock('crypto', () => ({
  randomBytes: vi.fn().mockReturnValue({
    toString: () => 'mock-token-123456789'
  })
}))

// Mock database with realistic behavior
const mockDb = {
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
  auditLog: {
    create: vi.fn(),
  }
}

vi.mock('@/lib/db', () => ({
  db: mockDb
}))

describe('Updated Authentication Endpoints Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup realistic database responses
    mockDb.school.findUnique.mockResolvedValue({
      id: 'school-1',
      name: 'Test School',
      schoolCode: 'TEST001',
      status: 'ACTIVE',
      isOnboarded: true,
      onboardingStep: 5
    })
    
    mockDb.auditLog.create.mockResolvedValue({
      id: 'audit-1',
      action: 'CREATE',
      resource: 'test',
      userId: 'user-1',
      createdAt: new Date()
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Complete User Registration and Verification Flow', () => {
    it('should complete full registration flow with school context', async () => {
      // Step 1: Register user with school context
      mockDb.user.findUnique.mockResolvedValue(null) // No existing user
      mockDb.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        mobile: '+1234567890',
        name: 'Test User',
        isActive: true,
        emailVerified: null,
        passwordHash: 'hashed-password'
      })
      
      mockDb.userSchool.create.mockResolvedValue({
        id: 'user-school-1',
        userId: 'user-1',
        schoolId: 'school-1',
        role: UserRole.STUDENT,
        isActive: true
      })
      
      mockDb.verificationToken.create.mockResolvedValue({
        id: 'token-1',
        identifier: 'test@example.com',
        token: 'mock-token-123456789',
        expires: new Date(Date.now() + 86400000)
      })

      const registerRequest = new NextRequest('http://localhost:3000/api/auth/register', {
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

      const registerResponse = await registerPOST(registerRequest)
      const registerData = await registerResponse.json()

      expect(registerResponse.status).toBe(201)
      expect(registerData.success).toBe(true)
      expect(registerData.requiresSchoolSelection).toBe(false)
      expect(registerData.emailVerificationRequired).toBe(true)

      // Step 2: Verify email
      mockDb.verificationToken.findUnique.mockResolvedValue({
        token: 'mock-token-123456789',
        identifier: 'test@example.com',
        expires: new Date(Date.now() + 86400000)
      })
      
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: null,
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
      })
      
      mockDb.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        emailVerified: new Date()
      })

      const verifyRequest = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({
          token: 'mock-token-123456789'
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      const verifyResponse = await verifyEmailPOST(verifyRequest)
      const verifyData = await verifyResponse.json()

      expect(verifyResponse.status).toBe(200)
      expect(verifyData.success).toBe(true)
      expect(verifyData.canLogin).toBe(true)

      // Verify the complete flow
      expect(mockDb.school.findUnique).toHaveBeenCalledWith({
        where: { schoolCode: 'TEST001' }
      })
      
      expect(mockDb.userSchool.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          schoolId: 'school-1',
          role: UserRole.STUDENT,
          isActive: true
        }
      })
      
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { emailVerified: expect.any(Date) }
      })
      
      expect(mockDb.verificationToken.delete).toHaveBeenCalledWith({
        where: { token: 'mock-token-123456789' }
      })
    })

    it('should handle registration without school context and require school selection', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)
      mockDb.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        isActive: true,
        emailVerified: null,
        passwordHash: 'hashed-password'
      })

      const registerRequest = new NextRequest('http://localhost:3000/api/auth/register', {
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

      const registerResponse = await registerPOST(registerRequest)
      const registerData = await registerResponse.json()

      expect(registerResponse.status).toBe(201)
      expect(registerData.success).toBe(true)
      expect(registerData.requiresSchoolSelection).toBe(true)
      expect(registerData.emailVerificationRequired).toBe(true)

      // Verify no school context was created
      expect(mockDb.userSchool.create).not.toHaveBeenCalled()
      expect(mockDb.school.findUnique).not.toHaveBeenCalled()
    })
  })

  describe('Complete Password Reset Flow', () => {
    it('should complete full password reset flow with security measures', async () => {
      // Step 1: Request password reset
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
      })
      
      mockDb.verificationToken.deleteMany.mockResolvedValue({ count: 0 })
      mockDb.verificationToken.create.mockResolvedValue({
        id: 'reset-token-1',
        identifier: 'password-reset:test@example.com',
        token: 'mock-token-123456789',
        expires: new Date(Date.now() + 3600000)
      })

      const forgotRequest = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          schoolCode: 'TEST001'
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      const forgotResponse = await forgotPasswordPOST(forgotRequest)
      const forgotData = await forgotResponse.json()

      expect(forgotResponse.status).toBe(200)
      expect(forgotData.success).toBe(true)

      // Step 2: Reset password
      mockDb.verificationToken.findUnique.mockResolvedValue({
        token: 'mock-token-123456789',
        identifier: 'password-reset:test@example.com',
        expires: new Date(Date.now() + 3600000)
      })
      
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        userSchools: []
      })
      
      mockDb.user.update.mockResolvedValue({
        id: 'user-1',
        passwordHash: 'new-hashed-password'
      })
      
      mockDb.authSession.deleteMany.mockResolvedValue({ count: 2 })

      const resetRequest = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'mock-token-123456789',
          password: 'NewSecurePass123!'
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      const resetResponse = await resetPasswordPOST(resetRequest)
      const resetData = await resetResponse.json()

      expect(resetResponse.status).toBe(200)
      expect(resetData.success).toBe(true)
      expect(resetData.sessionInvalidated).toBe(true)

      // Verify the complete security flow
      expect(mockDb.verificationToken.deleteMany).toHaveBeenCalledWith({
        where: { identifier: 'password-reset:test@example.com' }
      })
      
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: expect.any(String) }
      })
      
      expect(mockDb.verificationToken.delete).toHaveBeenCalledWith({
        where: { token: 'mock-token-123456789' }
      })
      
      expect(mockDb.authSession.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' }
      })
    })

    it('should handle password reset with school context validation', async () => {
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
      })

      const forgotRequest = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          schoolCode: 'TEST001'
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      const forgotResponse = await forgotPasswordPOST(forgotRequest)
      const forgotData = await forgotResponse.json()

      expect(forgotResponse.status).toBe(200)
      expect(forgotData.success).toBe(true)

      // Verify school context was validated
      expect(mockDb.school.findUnique).toHaveBeenCalledWith({
        where: { schoolCode: 'TEST001' }
      })
      
      // Verify user was found with school context
      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: {
          userSchools: {
            where: {
              isActive: true,
              schoolId: 'school-1'
            },
            include: { school: true }
          }
        }
      })
    })
  })

  describe('Security and Error Handling Integration', () => {
    it('should handle user enumeration protection in forgot password', async () => {
      // Test with non-existent user
      mockDb.user.findUnique.mockResolvedValue(null)

      const forgotRequest = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com'
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      const forgotResponse = await forgotPasswordPOST(forgotRequest)
      const forgotData = await forgotResponse.json()

      // Should return success to prevent user enumeration
      expect(forgotResponse.status).toBe(200)
      expect(forgotData.success).toBe(true)
      expect(forgotData.message).toBe('If an account with that email exists, a password reset link has been sent.')

      // Should not create any tokens
      expect(mockDb.verificationToken.create).not.toHaveBeenCalled()
    })

    it('should handle inactive user in password reset flow', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        isActive: false,
        userSchools: []
      })

      const forgotRequest = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com'
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      const forgotResponse = await forgotPasswordPOST(forgotRequest)
      const forgotData = await forgotResponse.json()

      // Should return success to prevent user enumeration
      expect(forgotResponse.status).toBe(200)
      expect(forgotData.success).toBe(true)
      expect(forgotData.message).toBe('If an account with that email exists, a password reset link has been sent.')

      // Should not create any tokens for inactive user
      expect(mockDb.verificationToken.create).not.toHaveBeenCalled()
    })

    it('should handle school context mismatch in password reset', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        isActive: true,
        userSchools: [] // User not in the requested school
      })

      const forgotRequest = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          schoolCode: 'TEST001'
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      const forgotResponse = await forgotPasswordPOST(forgotRequest)
      const forgotData = await forgotResponse.json()

      // Should return success to prevent user enumeration
      expect(forgotResponse.status).toBe(200)
      expect(forgotData.success).toBe(true)
      expect(forgotData.message).toBe('If an account with that email exists, a password reset link has been sent.')

      // Should not create any tokens
      expect(mockDb.verificationToken.create).not.toHaveBeenCalled()
    })

    it('should handle expired tokens gracefully', async () => {
      mockDb.verificationToken.findUnique.mockResolvedValue({
        token: 'expired-token',
        identifier: 'password-reset:test@example.com',
        expires: new Date(Date.now() - 3600000) // Expired 1 hour ago
      })

      const resetRequest = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'expired-token',
          password: 'NewSecurePass123!'
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      const resetResponse = await resetPasswordPOST(resetRequest)
      const resetData = await resetResponse.json()

      expect(resetResponse.status).toBe(410)
      expect(resetData.success).toBe(false)
      expect(resetData.error).toContain('Reset token has expired')

      // Should delete expired token
      expect(mockDb.verificationToken.delete).toHaveBeenCalledWith({
        where: { token: 'expired-token' }
      })

      // Should not update password
      expect(mockDb.user.update).not.toHaveBeenCalled()
    })
  })

  describe('Audit Logging Integration', () => {
    it('should log all authentication events properly', async () => {
      // Test registration with audit logging
      mockDb.user.findUnique.mockResolvedValue(null)
      mockDb.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        isActive: true,
        emailVerified: null,
        passwordHash: 'hashed-password'
      })

      const registerRequest = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePass123!',
          firstName: 'Test',
          lastName: 'User'
        }),
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Test Browser'
        }
      })

      const registerResponse = await registerPOST(registerRequest)
      expect(registerResponse.status).toBe(201)

      // Verify audit log was created with proper context
      expect(mockDb.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'CREATE',
          resource: 'user_registration',
          userId: 'user-1',
          changes: expect.objectContaining({
            email: 'test@example.com',
            registrationMethod: 'email_password'
          })
        })
      })
    })

    it('should log security events with IP and user agent', async () => {
      mockDb.verificationToken.findUnique.mockResolvedValue({
        token: 'invalid-token-type',
        identifier: 'not-password-reset:test@example.com',
        expires: new Date(Date.now() + 3600000)
      })

      const resetRequest = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'invalid-token-type',
          password: 'NewSecurePass123!'
        }),
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.100',
          'user-agent': 'Suspicious Browser'
        }
      })

      const resetResponse = await resetPasswordPOST(resetRequest)
      expect(resetResponse.status).toBe(400)

      // Verify security event was logged with context
      expect(mockDb.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'FAILED',
          resource: 'password_reset',
          changes: expect.objectContaining({
            reason: 'INVALID_TOKEN_TYPE',
            ipAddress: '192.168.1.100',
            userAgent: 'Suspicious Browser'
          })
        })
      })
    })
  })
})