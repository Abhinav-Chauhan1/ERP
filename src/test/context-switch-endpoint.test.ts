import { NextRequest } from "next/server"
import { POST } from "@/app/api/auth/context/switch/route"
import { jwtService } from "@/lib/services/jwt-service"
import { sessionContextService } from "@/lib/services/session-context-service"
import { roleRouterService } from "@/lib/services/role-router-service"
import { logAuditEvent } from "@/lib/services/audit-service"
import { UserRole } from "@prisma/client"
import { vi } from 'vitest'

// Mock dependencies
vi.mock("@/lib/services/jwt-service")
vi.mock("@/lib/services/session-context-service")
vi.mock("@/lib/services/role-router-service")
vi.mock("@/lib/services/audit-service")

const mockJwtService = vi.mocked(jwtService)
const mockSessionContextService = vi.mocked(sessionContextService)
const mockRoleRouterService = vi.mocked(roleRouterService)
const mockLogAuditEvent = vi.mocked(logAuditEvent)

describe('/api/auth/context/switch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Input Validation', () => {
    it('should reject request without token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
        method: 'POST',
        body: JSON.stringify({ newSchoolId: 'school-123' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication token is required')
    })

    it('should reject request with invalid token type', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
        method: 'POST',
        body: JSON.stringify({ token: 123, newSchoolId: 'school-123' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication token is required')
    })

    it('should reject request with malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
        method: 'POST',
        body: 'invalid json'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('Token Validation', () => {
    it('should reject invalid token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
        method: 'POST',
        body: JSON.stringify({ token: 'invalid-token', newSchoolId: 'school-123' })
      })

      mockJwtService.verifyToken.mockResolvedValue({
        valid: false,
        error: 'TOKEN_INVALID'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid or expired token')
    })

    it('should reject expired token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
        method: 'POST',
        body: JSON.stringify({ token: 'expired-token', newSchoolId: 'school-123' })
      })

      mockJwtService.verifyToken.mockRejectedValue({ code: 'TOKEN_EXPIRED', message: 'Token expired' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Session expired. Please sign in again.')
      expect(data.code).toBe('TOKEN_EXPIRED')
    })
  })

  describe('School Context Switching', () => {
    const validToken = 'valid-jwt-token'
    const mockTokenPayload = {
      userId: 'user-123',
      role: UserRole.TEACHER,
      activeSchoolId: 'school-old',
      authorizedSchools: ['school-old', 'school-new'],
      permissions: []
    }

    beforeEach(() => {
      mockJwtService.verifyToken.mockResolvedValue({
        valid: true,
        payload: mockTokenPayload
      })
    })

    it('should successfully switch school context for authorized user', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
        method: 'POST',
        body: JSON.stringify({ 
          token: validToken, 
          newSchoolId: 'school-new' 
        }),
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Mozilla/5.0'
        }
      })

      mockSessionContextService.updateSchoolContext.mockResolvedValue(true)
      mockRoleRouterService.getRouteForRole.mockReturnValue('/teacher/dashboard')

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('School context switched successfully')
      expect(data.redirectUrl).toBe('/teacher/dashboard')
      expect(data.newContext.schoolId).toBe('school-new')

      expect(mockSessionContextService.updateSchoolContext).toHaveBeenCalledWith(
        validToken,
        'school-new',
        'user-123'
      )

      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        userId: 'user-123',
        schoolId: 'school-new',
        action: 'UPDATE',
        resource: 'school_context',
        changes: expect.objectContaining({
          previousSchoolId: 'school-old',
          newSchoolId: 'school-new',
          clientIP: '192.168.1.1',
          userAgent: 'Mozilla/5.0'
        })
      })
    })

    it('should reject unauthorized school access', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
        method: 'POST',
        body: JSON.stringify({ 
          token: validToken, 
          newSchoolId: 'unauthorized-school' 
        }),
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Mozilla/5.0'
        }
      })

      mockSessionContextService.updateSchoolContext.mockResolvedValue(false)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toBe('You do not have access to this school')

      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        userId: 'user-123',
        schoolId: 'school-old',
        action: 'REJECT',
        resource: 'school_context',
        changes: expect.objectContaining({
          requestedSchoolId: 'unauthorized-school',
          reason: 'UNAUTHORIZED_ACCESS'
        })
      })
    })

    it('should handle same school context switch gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
        method: 'POST',
        body: JSON.stringify({ 
          token: validToken, 
          newSchoolId: 'school-old' // Same as current
        })
      })

      // Should not call updateSchoolContext for same school
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('No context switch requested')
    })
  })

  describe('Student Context Switching (Parent)', () => {
    const validToken = 'valid-jwt-token'
    const mockParentTokenPayload = {
      userId: 'parent-123',
      role: UserRole.PARENT,
      activeSchoolId: 'school-123',
      activeStudentId: 'student-old',
      authorizedSchools: ['school-123'],
      permissions: []
    }

    beforeEach(() => {
      mockJwtService.verifyToken.mockResolvedValue({
        valid: true,
        payload: mockParentTokenPayload
      })
    })

    it('should successfully switch student context for parent', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
        method: 'POST',
        body: JSON.stringify({ 
          token: validToken, 
          newStudentId: 'student-new' 
        }),
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Mozilla/5.0'
        }
      })

      mockSessionContextService.validateParentStudentAccess.mockResolvedValue(true)
      mockRoleRouterService.getRouteForRole.mockReturnValue('/parent/dashboard')

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Student context switched successfully')
      expect(data.redirectUrl).toBe('/parent/dashboard')
      expect(data.newContext.studentId).toBe('student-new')

      expect(mockSessionContextService.validateParentStudentAccess).toHaveBeenCalledWith(
        'parent-123',
        'student-new',
        'school-123'
      )

      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        userId: 'parent-123',
        schoolId: 'school-123',
        action: 'UPDATE',
        resource: 'parent_context',
        changes: expect.objectContaining({
          previousStudentId: 'student-old',
          newStudentId: 'student-new'
        })
      })
    })

    it('should reject unauthorized student access for parent', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
        method: 'POST',
        body: JSON.stringify({ 
          token: validToken, 
          newStudentId: 'unauthorized-student' 
        })
      })

      mockSessionContextService.validateParentStudentAccess.mockResolvedValue(false)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toBe('You do not have access to this student')

      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        userId: 'parent-123',
        schoolId: 'school-123',
        action: 'REJECT',
        resource: 'parent_context',
        changes: expect.objectContaining({
          requestedStudentId: 'unauthorized-student',
          reason: 'UNAUTHORIZED_ACCESS'
        })
      })
    })

    it('should reject student context switch for non-parent roles', async () => {
      const teacherTokenPayload = {
        ...mockParentTokenPayload,
        role: UserRole.TEACHER
      }

      mockJwtService.verifyToken.mockResolvedValue({
        valid: true,
        payload: teacherTokenPayload
      })

      const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
        method: 'POST',
        body: JSON.stringify({ 
          token: validToken, 
          newStudentId: 'student-123' 
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('No context switch requested')
    })
  })

  describe('Combined Context Switching', () => {
    const validToken = 'valid-jwt-token'
    const mockTokenPayload = {
      userId: 'parent-123',
      role: UserRole.PARENT,
      activeSchoolId: 'school-old',
      authorizedSchools: ['school-old', 'school-new'],
      permissions: []
    }

    beforeEach(() => {
      mockJwtService.verifyToken.mockResolvedValue({
        valid: true,
        payload: mockTokenPayload
      })
    })

    it('should handle both school and student context switch', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
        method: 'POST',
        body: JSON.stringify({ 
          token: validToken, 
          newSchoolId: 'school-new',
          newStudentId: 'student-123'
        })
      })

      mockSessionContextService.updateSchoolContext.mockResolvedValue(true)
      mockRoleRouterService.getRouteForRole.mockReturnValue('/parent/dashboard')

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('School context switched successfully')
      expect(data.newContext.schoolId).toBe('school-new')
      expect(data.newContext.studentId).toBe('student-123')

      // Should prioritize school context switch
      expect(mockSessionContextService.updateSchoolContext).toHaveBeenCalledWith(
        validToken,
        'school-new',
        'parent-123'
      )
    })
  })

  describe('Error Handling', () => {
    const validToken = 'valid-jwt-token'
    const mockTokenPayload = {
      userId: 'user-123',
      role: UserRole.TEACHER,
      activeSchoolId: 'school-123',
      authorizedSchools: ['school-123'],
      permissions: []
    }

    beforeEach(() => {
      mockJwtService.verifyToken.mockResolvedValue({
        valid: true,
        payload: mockTokenPayload
      })
    })

    it('should handle service errors gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
        method: 'POST',
        body: JSON.stringify({ 
          token: validToken, 
          newSchoolId: 'school-new' 
        })
      })

      mockSessionContextService.updateSchoolContext.mockRejectedValue(
        new Error('Database connection failed')
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to switch context. Please try again.')

      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        userId: 'SYSTEM',
        action: 'REJECT',
        resource: 'context_switching',
        changes: expect.objectContaining({
          error: 'Database connection failed',
          requestedSchoolId: 'school-new'
        })
      })
    })

    it('should handle JWT service errors with specific error codes', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
        method: 'POST',
        body: JSON.stringify({ 
          token: 'invalid-token', 
          newSchoolId: 'school-new' 
        })
      })

      mockJwtService.verifyToken.mockRejectedValue({ 
        code: 'TOKEN_INVALID', 
        message: 'Invalid token signature' 
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid session. Please sign in again.')
      expect(data.code).toBe('TOKEN_INVALID')
    })
  })

  describe('Audit Logging', () => {
    const validToken = 'valid-jwt-token'
    const mockTokenPayload = {
      userId: 'user-123',
      role: UserRole.TEACHER,
      activeSchoolId: 'school-old',
      authorizedSchools: ['school-old', 'school-new'],
      permissions: []
    }

    beforeEach(() => {
      mockJwtService.verifyToken.mockResolvedValue({
        valid: true,
        payload: mockTokenPayload
      })
    })

    it('should log successful context switches with client information', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
        method: 'POST',
        body: JSON.stringify({ 
          token: validToken, 
          newSchoolId: 'school-new' 
        }),
        headers: {
          'x-forwarded-for': '192.168.1.100',
          'x-real-ip': '10.0.0.1',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      mockSessionContextService.updateSchoolContext.mockResolvedValue(true)
      mockRoleRouterService.getRouteForRole.mockReturnValue('/teacher/dashboard')

      await POST(request)

      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        userId: 'user-123',
        schoolId: 'school-new',
        action: 'UPDATE',
        resource: 'school_context',
        changes: expect.objectContaining({
          previousSchoolId: 'school-old',
          newSchoolId: 'school-new',
          clientIP: '192.168.1.100', // Should use x-forwarded-for
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: expect.any(Date)
        })
      })
    })

    it('should handle missing client information gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
        method: 'POST',
        body: JSON.stringify({ 
          token: validToken, 
          newSchoolId: 'school-new' 
        })
        // No headers provided
      })

      mockSessionContextService.updateSchoolContext.mockResolvedValue(true)
      mockRoleRouterService.getRouteForRole.mockReturnValue('/teacher/dashboard')

      await POST(request)

      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        userId: 'user-123',
        schoolId: 'school-new',
        action: 'UPDATE',
        resource: 'school_context',
        changes: expect.objectContaining({
          clientIP: 'unknown',
          userAgent: 'unknown'
        })
      })
    })
  })

  describe('CORS Handling', () => {
    it('should handle OPTIONS preflight requests', async () => {
      // Mock OPTIONS method
      const optionsRequest = new NextRequest('http://localhost:3000/api/auth/context/switch', {
        method: 'OPTIONS'
      })

      // Import OPTIONS handler
      const { OPTIONS } = await import('@/app/api/auth/context/switch/route')
      const response = await OPTIONS()

      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS')
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization')
    })
  })
})