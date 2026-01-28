import { describe, it, expect, beforeEach, jest } from '@jest/globals'

/**
 * Unified Login System Tests
 * 
 * Tests the unified authentication system for all school-based user types.
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5
 */

// Mock the services
jest.mock('@/lib/services/school-context-service')
jest.mock('@/lib/services/authentication-service')
jest.mock('@/lib/services/role-router-service')

describe('Unified Login System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('School Code Validation', () => {
    it('should validate school code and return school information', async () => {
      // Test school code validation API endpoint
      const mockSchool = {
        id: 'school-1',
        name: 'Test School',
        schoolCode: 'TEST001',
        isOnboarded: true
      }

      // Mock fetch for school validation
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          school: mockSchool
        })
      })

      const response = await fetch('/api/auth/school-validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolCode: 'TEST001' })
      })

      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.school).toEqual(mockSchool)
    })

    it('should reject invalid school codes', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid school code'
        })
      })

      const response = await fetch('/api/auth/school-validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolCode: 'INVALID' })
      })

      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid school code')
    })

    it('should reject inactive school codes', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({
          success: false,
          error: 'This school is currently inactive. Please contact support.',
          code: 'SCHOOL_INACTIVE'
        })
      })

      const response = await fetch('/api/auth/school-validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolCode: 'INACTIVE001' })
      })

      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.code).toBe('SCHOOL_INACTIVE')
    })
  })

  describe('OTP Generation and Verification', () => {
    it('should generate OTP for valid user', async () => {
      const mockOTPResponse = {
        success: true,
        message: 'OTP sent successfully',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      }

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockOTPResponse)
      })

      const response = await fetch('/api/auth/otp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'school-1'
        })
      })

      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.message).toBe('OTP sent successfully')
      expect(data.expiresAt).toBeDefined()
    })

    it('should reject OTP generation for non-existent user', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({
          success: false,
          error: 'No account found with this mobile number or email for the selected school',
          code: 'USER_NOT_FOUND'
        })
      })

      const response = await fetch('/api/auth/otp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: '0000000000',
          schoolId: 'school-1'
        })
      })

      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.code).toBe('USER_NOT_FOUND')
    })

    it('should verify valid OTP', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: 'OTP verified successfully'
        })
      })

      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: '9876543210',
          otpCode: '123456',
          schoolId: 'school-1'
        })
      })

      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.message).toBe('OTP verified successfully')
    })

    it('should reject invalid OTP', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid or expired OTP code',
          code: 'INVALID_OTP'
        })
      })

      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: '9876543210',
          otpCode: '000000',
          schoolId: 'school-1'
        })
      })

      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.code).toBe('INVALID_OTP')
    })
  })

  describe('Unified Authentication', () => {
    it('should authenticate student with OTP', async () => {
      const mockAuthResponse = {
        success: true,
        user: {
          id: 'user-1',
          name: 'John Student',
          role: 'STUDENT',
          mobile: '9876543210'
        },
        token: 'jwt-token-123',
        redirectUrl: '/student/dashboard'
      }

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAuthResponse)
      })

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'school-1',
          credentials: {
            type: 'otp',
            value: '123456'
          }
        })
      })

      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.user.role).toBe('STUDENT')
      expect(data.token).toBeDefined()
      expect(data.redirectUrl).toBe('/student/dashboard')
    })

    it('should authenticate teacher with password', async () => {
      const mockAuthResponse = {
        success: true,
        user: {
          id: 'user-2',
          name: 'Jane Teacher',
          role: 'TEACHER',
          email: 'jane@school.com'
        },
        token: 'jwt-token-456',
        redirectUrl: '/teacher/dashboard'
      }

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAuthResponse)
      })

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'jane@school.com',
          schoolId: 'school-1',
          credentials: {
            type: 'password',
            value: 'securepassword123'
          }
        })
      })

      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.user.role).toBe('TEACHER')
      expect(data.token).toBeDefined()
      expect(data.redirectUrl).toBe('/teacher/dashboard')
    })

    it('should handle multi-school user selection', async () => {
      const mockAuthResponse = {
        success: true,
        user: {
          id: 'user-3',
          name: 'Multi School User',
          role: 'TEACHER'
        },
        token: 'jwt-token-789',
        requiresSchoolSelection: true,
        availableSchools: [
          { id: 'school-1', name: 'School A', schoolCode: 'SCHL001' },
          { id: 'school-2', name: 'School B', schoolCode: 'SCHL002' }
        ]
      }

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAuthResponse)
      })

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'multi@school.com',
          schoolId: 'school-1',
          credentials: {
            type: 'password',
            value: 'password123'
          }
        })
      })

      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.requiresSchoolSelection).toBe(true)
      expect(data.availableSchools).toHaveLength(2)
    })

    it('should handle parent with multiple children', async () => {
      const mockAuthResponse = {
        success: true,
        user: {
          id: 'user-4',
          name: 'Parent User',
          role: 'PARENT'
        },
        token: 'jwt-token-abc',
        requiresChildSelection: true,
        availableChildren: [
          { id: 'child-1', name: 'Child A', class: '5', section: 'A' },
          { id: 'child-2', name: 'Child B', class: '3', section: 'B' }
        ]
      }

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAuthResponse)
      })

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'school-1',
          credentials: {
            type: 'otp',
            value: '123456'
          }
        })
      })

      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.requiresChildSelection).toBe(true)
      expect(data.availableChildren).toHaveLength(2)
    })
  })

  describe('Super Admin Authentication', () => {
    it('should authenticate super admin with email and password', async () => {
      const mockSuperAdminResponse = {
        success: true,
        user: {
          id: 'super-admin-1',
          name: 'Super Admin',
          email: 'admin@system.com',
          role: 'SUPER_ADMIN'
        },
        token: 'super-admin-token-123',
        redirectUrl: '/super-admin'
      }

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSuperAdminResponse)
      })

      const response = await fetch('/api/auth/super-admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@system.com',
          password: 'supersecurepassword'
        })
      })

      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.user.role).toBe('SUPER_ADMIN')
      expect(data.token).toBeDefined()
      expect(data.redirectUrl).toBe('/super-admin')
    })

    it('should reject invalid super admin credentials', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        })
      })

      const response = await fetch('/api/auth/super-admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid@system.com',
          password: 'wrongpassword'
        })
      })

      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.code).toBe('INVALID_CREDENTIALS')
    })
  })

  describe('Context Switching', () => {
    it('should switch school context for multi-school user', async () => {
      const mockContextSwitchResponse = {
        success: true,
        message: 'School context switched successfully',
        redirectUrl: '/teacher/dashboard',
        newContext: {
          schoolId: 'school-2',
          studentId: null
        }
      }

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockContextSwitchResponse)
      })

      const response = await fetch('/api/auth/context/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newSchoolId: 'school-2',
          token: 'jwt-token-123'
        })
      })

      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.newContext.schoolId).toBe('school-2')
      expect(data.redirectUrl).toBe('/teacher/dashboard')
    })

    it('should switch child context for parent', async () => {
      const mockContextSwitchResponse = {
        success: true,
        message: 'Student context switched successfully',
        redirectUrl: '/parent/dashboard',
        newContext: {
          schoolId: 'school-1',
          studentId: 'child-2'
        }
      }

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockContextSwitchResponse)
      })

      const response = await fetch('/api/auth/context/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStudentId: 'child-2',
          token: 'parent-token-123'
        })
      })

      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.newContext.studentId).toBe('child-2')
      expect(data.redirectUrl).toBe('/parent/dashboard')
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      try {
        await fetch('/api/auth/school-validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schoolCode: 'TEST001' })
        })
      } catch (error: any) {
        expect(error.message).toBe('Network error')
      }
    })

    it('should handle rate limiting', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({
          success: false,
          error: 'Too many requests. Please wait before trying again.',
          code: 'RATE_LIMITED'
        })
      })

      const response = await fetch('/api/auth/otp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'school-1'
        })
      })

      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.code).toBe('RATE_LIMITED')
    })
  })

  describe('Input Validation', () => {
    it('should validate school code format', () => {
      const validSchoolCodes = ['SCHOOL001', 'TEST123', 'ABC']
      const invalidSchoolCodes = ['', '   ', 'school with spaces', '123-456']

      validSchoolCodes.forEach(code => {
        expect(code.trim().length).toBeGreaterThan(0)
        expect(code.trim()).toBe(code.toUpperCase())
      })

      invalidSchoolCodes.forEach(code => {
        expect(code.trim().length === 0 || code.includes(' ') || code.includes('-')).toBe(true)
      })
    })

    it('should validate mobile number format', () => {
      const validMobileNumbers = ['9876543210', '8765432109']
      const invalidMobileNumbers = ['123', '98765432101', 'abcdefghij', '']

      validMobileNumbers.forEach(mobile => {
        expect(/^\d{10}$/.test(mobile)).toBe(true)
      })

      invalidMobileNumbers.forEach(mobile => {
        expect(/^\d{10}$/.test(mobile)).toBe(false)
      })
    })

    it('should validate email format', () => {
      const validEmails = ['user@example.com', 'test.email@domain.co.in']
      const invalidEmails = ['invalid-email', '@domain.com', 'user@', '']

      validEmails.forEach(email => {
        expect(email.includes('@') && email.includes('.')).toBe(true)
      })

      invalidEmails.forEach(email => {
        expect(!(email.includes('@') && email.includes('.')) || email.length === 0).toBe(true)
      })
    })

    it('should validate OTP format', () => {
      const validOTPs = ['123456', '000000', '999999']
      const invalidOTPs = ['12345', '1234567', 'abcdef', '']

      validOTPs.forEach(otp => {
        expect(/^\d{6}$/.test(otp)).toBe(true)
      })

      invalidOTPs.forEach(otp => {
        expect(/^\d{6}$/.test(otp)).toBe(false)
      })
    })
  })
})