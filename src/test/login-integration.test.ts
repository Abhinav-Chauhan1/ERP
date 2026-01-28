import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/login/route'

/**
 * Login Endpoint Integration Tests
 * 
 * Integration tests for the /api/auth/login endpoint with real service interactions.
 * Requirements: 1.1, 2.1, 4.1, 5.1, 6.1, 11.1
 */

// Import actual services for integration testing
import { authenticationService } from '@/lib/services/authentication-service'
import { roleRouterService } from '@/lib/services/role-router-service'
import { logAuditEvent } from '@/lib/services/audit-service'

// Mock only external dependencies
vi.mock('@/lib/services/otp-service')
vi.mock('@/lib/services/jwt-service')
vi.mock('@/lib/services/school-context-service')

const mockOTPService = {
  verifyOTP: vi.fn(),
  generateOTP: vi.fn(),
  isRateLimited: vi.fn()
}

const mockJWTService = {
  createToken: vi.fn(),
  verifyToken: vi.fn()
}

const mockSchoolContextService = {
  validateSchoolCode: vi.fn(),
  getUserSchools: vi.fn(),
  validateSchoolAccess: vi.fn()
}

// Mock Prisma client
const mockPrismaClient = {
  user: {
    findFirst: vi.fn(),
    findMany: vi.fn()
  },
  userSchool: {
    findMany: vi.fn()
  },
  school: {
    findUnique: vi.fn()
  },
  student: {
    findMany: vi.fn()
  },
  auditLog: {
    create: vi.fn()
  }
}

vi.doMock('@/lib/services/otp-service', () => ({
  otpService: mockOTPService
}))

vi.doMock('@/lib/services/jwt-service', () => ({
  jwtService: mockJWTService
}))

vi.doMock('@/lib/services/school-context-service', () => ({
  schoolContextService: mockSchoolContextService
}))

vi.doMock('@/lib/db', () => ({
  prisma: mockPrismaClient
}))

describe('Login Endpoint Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    mockSchoolContextService.validateSchoolCode.mockResolvedValue({
      id: 'school-1',
      name: 'Test School',
      schoolCode: 'TEST001',
      status: 'ACTIVE',
      isOnboarded: true
    })
    
    mockJWTService.createToken.mockReturnValue('jwt-token-123')
    mockOTPService.isRateLimited.mockResolvedValue(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Student OTP Authentication Flow', () => {
    it('should authenticate student with valid OTP through complete flow', async () => {
      // Setup test data
      const mockUser = {
        id: 'user-1',
        name: 'John Student',
        mobile: '9876543210',
        email: null,
        passwordHash: null,
        isActive: true
      }

      const mockUserSchool = {
        id: 'us-1',
        userId: 'user-1',
        schoolId: 'school-1',
        role: 'STUDENT',
        isActive: true
      }

      // Mock database responses
      mockPrismaClient.user.findFirst.mockResolvedValue(mockUser)
      mockPrismaClient.userSchool.findMany.mockResolvedValue([mockUserSchool])
      mockSchoolContextService.validateSchoolAccess.mockResolvedValue(true)
      mockOTPService.verifyOTP.mockResolvedValue(true)
      mockPrismaClient.auditLog.create.mockResolvedValue({})

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'school-1',
          credentials: { type: 'otp', value: '123456' }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user.name).toBe('John Student')
      expect(data.user.role).toBe('STUDENT')
      expect(data.token).toBe('jwt-token-123')
      expect(data.redirectUrl).toBe('/student/dashboard')

      // Verify service interactions
      expect(mockSchoolContextService.validateSchoolCode).toHaveBeenCalledWith('school-1')
      expect(mockPrismaClient.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { mobile: '9876543210' },
            { email: '9876543210' }
          ],
          isActive: true
        }
      })
      expect(mockOTPService.verifyOTP).toHaveBeenCalledWith('9876543210', '123456')
      expect(mockJWTService.createToken).toHaveBeenCalled()
    })

    it('should reject student authentication with invalid OTP', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'John Student',
        mobile: '9876543210',
        email: null,
        passwordHash: null,
        isActive: true
      }

      const mockUserSchool = {
        id: 'us-1',
        userId: 'user-1',
        schoolId: 'school-1',
        role: 'STUDENT',
        isActive: true
      }

      mockPrismaClient.user.findFirst.mockResolvedValue(mockUser)
      mockPrismaClient.userSchool.findMany.mockResolvedValue([mockUserSchool])
      mockSchoolContextService.validateSchoolAccess.mockResolvedValue(true)
      mockOTPService.verifyOTP.mockResolvedValue(false) // Invalid OTP
      mockPrismaClient.auditLog.create.mockResolvedValue({})

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'school-1',
          credentials: { type: 'otp', value: '000000' }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid')
    })
  })

  describe('Teacher Password Authentication Flow', () => {
    it('should authenticate teacher with valid password through complete flow', async () => {
      const mockUser = {
        id: 'user-2',
        name: 'Jane Teacher',
        mobile: null,
        email: 'jane@school.com',
        passwordHash: '$2b$10$hashedpassword',
        isActive: true
      }

      const mockUserSchool = {
        id: 'us-2',
        userId: 'user-2',
        schoolId: 'school-1',
        role: 'TEACHER',
        isActive: true
      }

      mockPrismaClient.user.findFirst.mockResolvedValue(mockUser)
      mockPrismaClient.userSchool.findMany.mockResolvedValue([mockUserSchool])
      mockSchoolContextService.validateSchoolAccess.mockResolvedValue(true)
      mockPrismaClient.auditLog.create.mockResolvedValue({})

      // Mock bcrypt for password verification
      const bcrypt = require('bcrypt')
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true)

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: 'jane@school.com',
          schoolId: 'school-1',
          credentials: { type: 'password', value: 'correctpassword' }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user.name).toBe('Jane Teacher')
      expect(data.user.role).toBe('TEACHER')
      expect(data.token).toBe('jwt-token-123')
      expect(data.redirectUrl).toBe('/teacher/dashboard')
    })

    it('should reject teacher authentication with invalid password', async () => {
      const mockUser = {
        id: 'user-2',
        name: 'Jane Teacher',
        mobile: null,
        email: 'jane@school.com',
        passwordHash: '$2b$10$hashedpassword',
        isActive: true
      }

      const mockUserSchool = {
        id: 'us-2',
        userId: 'user-2',
        schoolId: 'school-1',
        role: 'TEACHER',
        isActive: true
      }

      mockPrismaClient.user.findFirst.mockResolvedValue(mockUser)
      mockPrismaClient.userSchool.findMany.mockResolvedValue([mockUserSchool])
      mockSchoolContextService.validateSchoolAccess.mockResolvedValue(true)
      mockPrismaClient.auditLog.create.mockResolvedValue({})

      // Mock bcrypt for password verification
      const bcrypt = require('bcrypt')
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(false)

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: 'jane@school.com',
          schoolId: 'school-1',
          credentials: { type: 'password', value: 'wrongpassword' }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid')
    })
  })

  describe('Multi-School User Flow', () => {
    it('should handle multi-school user requiring school selection', async () => {
      const mockUser = {
        id: 'user-3',
        name: 'Multi School User',
        mobile: null,
        email: 'multi@school.com',
        passwordHash: '$2b$10$hashedpassword',
        isActive: true
      }

      const mockUserSchools = [
        {
          id: 'us-3a',
          userId: 'user-3',
          schoolId: 'school-1',
          role: 'TEACHER',
          isActive: true
        },
        {
          id: 'us-3b',
          userId: 'user-3',
          schoolId: 'school-2',
          role: 'TEACHER',
          isActive: true
        }
      ]

      const mockSchools = [
        { id: 'school-1', name: 'School A', schoolCode: 'SCHL001' },
        { id: 'school-2', name: 'School B', schoolCode: 'SCHL002' }
      ]

      mockPrismaClient.user.findFirst.mockResolvedValue(mockUser)
      mockPrismaClient.userSchool.findMany.mockResolvedValue(mockUserSchools)
      mockSchoolContextService.validateSchoolAccess.mockResolvedValue(true)
      mockSchoolContextService.getUserSchools.mockResolvedValue(mockSchools)
      mockPrismaClient.auditLog.create.mockResolvedValue({})

      // Mock bcrypt for password verification
      const bcrypt = require('bcrypt')
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true)

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: 'multi@school.com',
          schoolId: 'school-1',
          credentials: { type: 'password', value: 'password123' }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user.name).toBe('Multi School User')
      expect(data.requiresSchoolSelection).toBe(true)
      expect(data.availableSchools).toHaveLength(2)
      expect(data.redirectUrl).toBeUndefined()
    })
  })

  describe('Parent Multi-Child Flow', () => {
    it('should handle parent with multiple children requiring child selection', async () => {
      const mockUser = {
        id: 'user-4',
        name: 'Parent User',
        mobile: '9876543210',
        email: null,
        passwordHash: null,
        isActive: true
      }

      const mockUserSchool = {
        id: 'us-4',
        userId: 'user-4',
        schoolId: 'school-1',
        role: 'PARENT',
        isActive: true
      }

      const mockChildren = [
        {
          id: 'child-1',
          name: 'Child A',
          class: '5',
          section: 'A',
          parentMobile: '9876543210',
          schoolId: 'school-1'
        },
        {
          id: 'child-2',
          name: 'Child B',
          class: '3',
          section: 'B',
          parentMobile: '9876543210',
          schoolId: 'school-1'
        }
      ]

      mockPrismaClient.user.findFirst.mockResolvedValue(mockUser)
      mockPrismaClient.userSchool.findMany.mockResolvedValue([mockUserSchool])
      mockPrismaClient.student.findMany.mockResolvedValue(mockChildren)
      mockSchoolContextService.validateSchoolAccess.mockResolvedValue(true)
      mockOTPService.verifyOTP.mockResolvedValue(true)
      mockPrismaClient.auditLog.create.mockResolvedValue({})

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'school-1',
          credentials: { type: 'otp', value: '123456' }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user.name).toBe('Parent User')
      expect(data.requiresChildSelection).toBe(true)
      expect(data.availableChildren).toHaveLength(2)
      expect(data.availableChildren[0].name).toBe('Child A')
      expect(data.redirectUrl).toBeUndefined()
    })
  })

  describe('School Validation Integration', () => {
    it('should reject authentication for inactive school', async () => {
      mockSchoolContextService.validateSchoolCode.mockResolvedValue({
        id: 'school-inactive',
        name: 'Inactive School',
        schoolCode: 'INACTIVE001',
        status: 'INACTIVE',
        isOnboarded: true
      })

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'school-inactive',
          credentials: { type: 'otp', value: '123456' }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.code).toBe('SCHOOL_INACTIVE')
    })

    it('should reject authentication for non-existent school', async () => {
      mockSchoolContextService.validateSchoolCode.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'nonexistent-school',
          credentials: { type: 'otp', value: '123456' }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.code).toBe('SCHOOL_NOT_FOUND')
    })
  })

  describe('User Access Validation Integration', () => {
    it('should reject authentication for user without school access', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'John Student',
        mobile: '9876543210',
        email: null,
        passwordHash: null,
        isActive: true
      }

      mockPrismaClient.user.findFirst.mockResolvedValue(mockUser)
      mockPrismaClient.userSchool.findMany.mockResolvedValue([]) // No school access
      mockSchoolContextService.validateSchoolAccess.mockResolvedValue(false)

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'school-1',
          credentials: { type: 'otp', value: '123456' }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.code).toBe('UNAUTHORIZED_SCHOOL')
    })

    it('should reject authentication for non-existent user', async () => {
      mockPrismaClient.user.findFirst.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '0000000000',
          schoolId: 'school-1',
          credentials: { type: 'otp', value: '123456' }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.code).toBe('USER_NOT_FOUND')
    })

    it('should reject authentication for inactive user', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Inactive User',
        mobile: '9876543210',
        email: null,
        passwordHash: null,
        isActive: false // Inactive user
      }

      mockPrismaClient.user.findFirst.mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'school-1',
          credentials: { type: 'otp', value: '123456' }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.code).toBe('USER_NOT_FOUND')
    })
  })

  describe('Rate Limiting Integration', () => {
    it('should reject authentication when rate limited', async () => {
      mockOTPService.isRateLimited.mockResolvedValue(true)

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'school-1',
          credentials: { type: 'otp', value: '123456' }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.success).toBe(false)
      expect(data.error).toContain('rate limit')
    })
  })

  describe('Audit Logging Integration', () => {
    it('should create audit log entries for successful authentication', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'John Student',
        mobile: '9876543210',
        email: null,
        passwordHash: null,
        isActive: true
      }

      const mockUserSchool = {
        id: 'us-1',
        userId: 'user-1',
        schoolId: 'school-1',
        role: 'STUDENT',
        isActive: true
      }

      mockPrismaClient.user.findFirst.mockResolvedValue(mockUser)
      mockPrismaClient.userSchool.findMany.mockResolvedValue([mockUserSchool])
      mockSchoolContextService.validateSchoolAccess.mockResolvedValue(true)
      mockOTPService.verifyOTP.mockResolvedValue(true)
      mockPrismaClient.auditLog.create.mockResolvedValue({})

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'school-1',
          credentials: { type: 'otp', value: '123456' }
        }),
        headers: { 
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.100',
          'user-agent': 'Test User Agent'
        }
      })

      await POST(request)

      expect(mockPrismaClient.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          schoolId: 'school-1',
          action: 'LOGIN_SUCCESS',
          resource: 'authentication',
          ipAddress: '192.168.1.100',
          userAgent: 'Test User Agent',
          details: expect.objectContaining({
            identifier: '9876543210',
            authMethod: 'otp',
            userRole: 'STUDENT'
          })
        })
      })
    })

    it('should create audit log entries for failed authentication', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'John Student',
        mobile: '9876543210',
        email: null,
        passwordHash: null,
        isActive: true
      }

      const mockUserSchool = {
        id: 'us-1',
        userId: 'user-1',
        schoolId: 'school-1',
        role: 'STUDENT',
        isActive: true
      }

      mockPrismaClient.user.findFirst.mockResolvedValue(mockUser)
      mockPrismaClient.userSchool.findMany.mockResolvedValue([mockUserSchool])
      mockSchoolContextService.validateSchoolAccess.mockResolvedValue(true)
      mockOTPService.verifyOTP.mockResolvedValue(false) // Failed OTP
      mockPrismaClient.auditLog.create.mockResolvedValue({})

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'school-1',
          credentials: { type: 'otp', value: '000000' }
        }),
        headers: { 
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.100'
        }
      })

      await POST(request)

      expect(mockPrismaClient.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schoolId: 'school-1',
          action: 'LOGIN_FAILED',
          resource: 'authentication',
          ipAddress: '192.168.1.100',
          details: expect.objectContaining({
            identifier: '9876543210',
            authMethod: 'otp',
            reason: expect.stringContaining('Invalid')
          })
        })
      })
    })
  })
})