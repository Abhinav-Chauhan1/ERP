import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * Login Endpoint Unit Tests
 * 
 * Tests the /api/auth/login endpoint for unified authentication.
 * Requirements: 1.1, 2.1, 4.1, 5.1, 6.1, 11.1
 */

// Mock the services before importing the route
const mockAuthenticationService = {
  authenticateUser: vi.fn()
}

const mockRoleRouterService = {
  getRouteForRole: vi.fn()
}

const mockLogAuditEvent = vi.fn()

vi.mock('@/lib/services/authentication-service', () => ({
  authenticationService: mockAuthenticationService
}))

vi.mock('@/lib/services/role-router-service', () => ({
  roleRouterService: mockRoleRouterService
}))

vi.mock('@/lib/services/audit-service', () => ({
  logAuditEvent: mockLogAuditEvent
}))

// Import the route after mocking
const { POST } = await import('@/app/api/auth/login/route')

describe('Login Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAuditEvent.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Input Validation', () => {
    it('should reject request without identifier', async () => {
      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          schoolId: 'school-1',
          credentials: { type: 'otp', value: '123456' }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Mobile number or email is required')
    })

    it('should reject request with empty identifier', async () => {
      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '',
          schoolId: 'school-1',
          credentials: { type: 'otp', value: '123456' }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Mobile number or email is required')
    })

    it('should reject request without schoolId', async () => {
      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          credentials: { type: 'otp', value: '123456' }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('School ID is required')
    })

    it('should reject request without credentials', async () => {
      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'school-1'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication credentials are required')
    })

    it('should reject request with invalid credentials type', async () => {
      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'school-1',
          credentials: { type: 'invalid', value: '123456' }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid authentication method')
    })

    it('should reject request with missing credentials value', async () => {
      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'school-1',
          credentials: { type: 'otp' }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication credentials are required')
    })
  })

  describe('Successful Authentication', () => {
    it('should authenticate student with OTP successfully', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'John Student',
        role: 'STUDENT',
        mobile: '9876543210'
      }

      mockAuthenticationService.authenticateUser.mockResolvedValue({
        success: true,
        user: mockUser,
        token: 'jwt-token-123'
      })

      mockRoleRouterService.getRouteForRole.mockReturnValue('/student/dashboard')

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
      expect(data.user).toEqual(mockUser)
      expect(data.token).toBe('jwt-token-123')
      expect(data.redirectUrl).toBe('/student/dashboard')

      // Verify authentication service was called correctly
      expect(mockAuthenticationService.authenticateUser).toHaveBeenCalledWith(
        '9876543210',
        'school-1',
        { type: 'otp', value: '123456' },
        'unknown',
        'unknown'
      )

      // Verify audit logging
      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        userId: 'user-1',
        schoolId: 'school-1',
        action: 'LOGIN_SUCCESS',
        resource: 'authentication',
        changes: expect.objectContaining({
          identifier: '9876543210',
          authMethod: 'otp',
          userRole: 'STUDENT'
        })
      })
    })

    it('should authenticate teacher with password successfully', async () => {
      const mockUser = {
        id: 'user-2',
        name: 'Jane Teacher',
        role: 'TEACHER',
        email: 'jane@school.com'
      }

      mockAuthenticationService.authenticateUser.mockResolvedValue({
        success: true,
        user: mockUser,
        token: 'jwt-token-456'
      })

      mockRoleRouterService.getRouteForRole.mockReturnValue('/teacher/dashboard')

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: 'jane@school.com',
          schoolId: 'school-1',
          credentials: { type: 'password', value: 'securepassword123' }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user).toEqual(mockUser)
      expect(data.token).toBe('jwt-token-456')
      expect(data.redirectUrl).toBe('/teacher/dashboard')
    })

    it('should handle multi-school user requiring school selection', async () => {
      const mockUser = {
        id: 'user-3',
        name: 'Multi School User',
        role: 'TEACHER'
      }

      const mockSchools = [
        { id: 'school-1', name: 'School A', schoolCode: 'SCHL001' },
        { id: 'school-2', name: 'School B', schoolCode: 'SCHL002' }
      ]

      mockAuthenticationService.authenticateUser.mockResolvedValue({
        success: true,
        user: mockUser,
        token: 'jwt-token-789',
        requiresSchoolSelection: true,
        availableSchools: mockSchools
      })

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
      expect(data.user).toEqual(mockUser)
      expect(data.requiresSchoolSelection).toBe(true)
      expect(data.availableSchools).toEqual(mockSchools)
      expect(data.redirectUrl).toBeUndefined()
    })

    it('should handle parent requiring child selection', async () => {
      const mockUser = {
        id: 'user-4',
        name: 'Parent User',
        role: 'PARENT'
      }

      const mockChildren = [
        { id: 'child-1', name: 'Child A', class: '5', section: 'A' },
        { id: 'child-2', name: 'Child B', class: '3', section: 'B' }
      ]

      mockAuthenticationService.authenticateUser.mockResolvedValue({
        success: true,
        user: mockUser,
        token: 'jwt-token-abc',
        requiresChildSelection: true,
        availableChildren: mockChildren
      })

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
      expect(data.user).toEqual(mockUser)
      expect(data.requiresChildSelection).toBe(true)
      expect(data.availableChildren).toEqual(mockChildren)
      expect(data.redirectUrl).toBeUndefined()
    })
  })

  describe('Authentication Failures', () => {
    it('should handle invalid credentials error', async () => {
      mockAuthenticationService.authenticateUser.mockResolvedValue({
        success: false,
        error: 'Invalid credentials'
      })

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
      expect(data.error).toBe('Invalid credentials')

      // Verify failed login audit log
      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        schoolId: 'school-1',
        action: 'LOGIN_FAILED',
        resource: 'authentication',
        changes: expect.objectContaining({
          identifier: '9876543210',
          authMethod: 'otp',
          reason: 'Invalid credentials'
        })
      })
    })

    it('should handle user not found error', async () => {
      const error = new Error('User not found')
      error.code = 'USER_NOT_FOUND'
      mockAuthenticationService.authenticateUser.mockRejectedValue(error)

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
      expect(data.error).toBe('No account found with this mobile number or email for the selected school')
      expect(data.code).toBe('USER_NOT_FOUND')
    })

    it('should handle unauthorized school error', async () => {
      const error = new Error('Unauthorized school access')
      error.code = 'UNAUTHORIZED_SCHOOL'
      mockAuthenticationService.authenticateUser.mockRejectedValue(error)

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: 'user@school.com',
          schoolId: 'unauthorized-school',
          credentials: { type: 'password', value: 'password123' }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toBe('You do not have access to this school')
      expect(data.code).toBe('UNAUTHORIZED_SCHOOL')
    })

    it('should handle school not found error', async () => {
      const error = new Error('School not found')
      error.code = 'SCHOOL_NOT_FOUND'
      mockAuthenticationService.authenticateUser.mockRejectedValue(error)

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: 'user@school.com',
          schoolId: 'nonexistent-school',
          credentials: { type: 'password', value: 'password123' }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('School not found')
      expect(data.code).toBe('SCHOOL_NOT_FOUND')
    })

    it('should handle inactive school error', async () => {
      const error = new Error('School is inactive')
      error.code = 'SCHOOL_INACTIVE'
      mockAuthenticationService.authenticateUser.mockRejectedValue(error)

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: 'user@school.com',
          schoolId: 'inactive-school',
          credentials: { type: 'password', value: 'password123' }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toBe('This school is currently inactive. Please contact support.')
      expect(data.code).toBe('SCHOOL_INACTIVE')
    })

    it('should handle invalid credentials error with specific code', async () => {
      const error = new Error('Invalid credentials')
      error.code = 'INVALID_CREDENTIALS'
      mockAuthenticationService.authenticateUser.mockRejectedValue(error)

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: 'user@school.com',
          schoolId: 'school-1',
          credentials: { type: 'password', value: 'wrongpassword' }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid credentials. Please check and try again.')
      expect(data.code).toBe('INVALID_CREDENTIALS')
    })

    it('should handle generic authentication errors', async () => {
      const error = new Error('Generic authentication error')
      mockAuthenticationService.authenticateUser.mockRejectedValue(error)

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: 'user@school.com',
          schoolId: 'school-1',
          credentials: { type: 'password', value: 'password123' }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication failed. Please try again.')
    })
  })

  describe('Client Information Extraction', () => {
    it('should extract client IP from x-forwarded-for header', async () => {
      mockAuthenticationService.authenticateUser.mockResolvedValue({
        success: true,
        user: { id: 'user-1', name: 'Test User', role: 'STUDENT' },
        token: 'token-123'
      })

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'school-1',
          credentials: { type: 'otp', value: '123456' }
        }),
        headers: { 
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.100'
        }
      })

      await POST(request)

      expect(mockAuthenticationService.authenticateUser).toHaveBeenCalledWith(
        '9876543210',
        'school-1',
        { type: 'otp', value: '123456' },
        '192.168.1.100',
        'unknown'
      )
    })

    it('should extract client IP from x-real-ip header', async () => {
      mockAuthenticationService.authenticateUser.mockResolvedValue({
        success: true,
        user: { id: 'user-1', name: 'Test User', role: 'STUDENT' },
        token: 'token-123'
      })

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'school-1',
          credentials: { type: 'otp', value: '123456' }
        }),
        headers: { 
          'Content-Type': 'application/json',
          'x-real-ip': '10.0.0.1'
        }
      })

      await POST(request)

      expect(mockAuthenticationService.authenticateUser).toHaveBeenCalledWith(
        '9876543210',
        'school-1',
        { type: 'otp', value: '123456' },
        '10.0.0.1',
        'unknown'
      )
    })

    it('should extract user agent from header', async () => {
      mockAuthenticationService.authenticateUser.mockResolvedValue({
        success: true,
        user: { id: 'user-1', name: 'Test User', role: 'STUDENT' },
        token: 'token-123'
      })

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '9876543210',
          schoolId: 'school-1',
          credentials: { type: 'otp', value: '123456' }
        }),
        headers: { 
          'Content-Type': 'application/json',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      await POST(request)

      expect(mockAuthenticationService.authenticateUser).toHaveBeenCalledWith(
        '9876543210',
        'school-1',
        { type: 'otp', value: '123456' },
        'unknown',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      )
    })
  })

  describe('Audit Logging', () => {
    it('should log successful authentication with all details', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        role: 'STUDENT'
      }

      mockAuthenticationService.authenticateUser.mockResolvedValue({
        success: true,
        user: mockUser,
        token: 'token-123'
      })

      mockRoleRouterService.getRouteForRole.mockReturnValue('/student/dashboard')

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

      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        userId: 'user-1',
        schoolId: 'school-1',
        action: 'LOGIN_SUCCESS',
        resource: 'authentication',
        changes: expect.objectContaining({
          identifier: '9876543210',
          authMethod: 'otp',
          userRole: 'STUDENT',
          requiresSchoolSelection: undefined,
          requiresChildSelection: undefined,
          clientIP: '192.168.1.100',
          userAgent: 'Test User Agent',
          timestamp: expect.any(Date)
        })
      })
    })

    it('should log authentication errors with error details', async () => {
      const error = new Error('Authentication failed')
      error.code = 'AUTH_ERROR'
      mockAuthenticationService.authenticateUser.mockRejectedValue(error)

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

      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        schoolId: 'school-1',
        action: 'LOGIN_ERROR',
        resource: 'authentication',
        changes: expect.objectContaining({
          identifier: '9876543210',
          authMethod: 'otp',
          error: 'Authentication failed',
          errorCode: 'AUTH_ERROR',
          clientIP: '192.168.1.100',
          userAgent: 'Test User Agent',
          timestamp: expect.any(Date)
        })
      })
    })
  })

  describe('JSON Parsing Errors', () => {
    it('should handle malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })
  })
})