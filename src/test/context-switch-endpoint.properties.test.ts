import fc from 'fast-check'
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

/**
 * Property-Based Tests for Context Switching Endpoint
 * Feature: unified-auth-multitenant-refactor
 */

describe('Context Switching Endpoint - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Property 1: Token Validation Consistency
   * For any token input, the endpoint should consistently validate tokens and reject invalid ones
   * **Validates: Requirements 11.3**
   */
  describe('Property 1: Token Validation Consistency', () => {
    it('should consistently validate tokens across all inputs', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          token: fc.oneof(
            fc.string(), // Valid string tokens
            fc.constant(null), // Null tokens
            fc.constant(undefined), // Undefined tokens
            fc.integer(), // Invalid type tokens
            fc.boolean(), // Invalid type tokens
            fc.object() // Invalid type tokens
          ),
          newSchoolId: fc.option(fc.string({ minLength: 1 })),
          newStudentId: fc.option(fc.string({ minLength: 1 }))
        }),
        async (input) => {
          const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
            method: 'POST',
            body: JSON.stringify(input)
          })

          // Mock JWT service response based on token validity
          if (typeof input.token === 'string' && input.token.length > 0) {
            mockJwtService.verifyToken.mockResolvedValue({
              valid: true,
              payload: {
                userId: 'user-123',
                role: UserRole.TEACHER,
                activeSchoolId: 'school-123',
                authorizedSchools: ['school-123'],
                permissions: []
              }
            })
            mockSessionContextService.updateSchoolContext.mockResolvedValue(true)
            mockRoleRouterService.getRouteForRole.mockReturnValue('/teacher/dashboard')
          } else {
            mockJwtService.verifyToken.mockResolvedValue({
              valid: false,
              error: 'INVALID_TOKEN'
            })
          }

          const response = await POST(request)
          const data = await response.json()

          // Property: Invalid or missing tokens should always be rejected with 401
          if (!input.token || typeof input.token !== 'string') {
            expect(response.status).toBe(401)
            expect(data.success).toBe(false)
            expect(data.error).toBe('Authentication token is required')
          }
        }
      ), { numRuns: 100 })
    })
  })

  /**
   * Property 2: School Context Authorization
   * For any school context switch request, the system should validate user authorization
   * **Validates: Requirements 5.4, 8.2**
   */
  describe('Property 2: School Context Authorization', () => {
    it('should validate school authorization for all context switch attempts', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          userId: fc.string({ minLength: 1 }),
          role: fc.constantFrom(...Object.values(UserRole)),
          currentSchoolId: fc.string({ minLength: 1 }),
          authorizedSchools: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
          requestedSchoolId: fc.string({ minLength: 1 })
        }),
        async (testData) => {
          const validToken = 'valid-jwt-token'
          const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
            method: 'POST',
            body: JSON.stringify({ 
              token: validToken, 
              newSchoolId: testData.requestedSchoolId 
            })
          })

          mockJwtService.verifyToken.mockResolvedValue({
            valid: true,
            payload: {
              userId: testData.userId,
              role: testData.role,
              activeSchoolId: testData.currentSchoolId,
              authorizedSchools: testData.authorizedSchools,
              permissions: []
            }
          })

          // Mock authorization based on whether school is in authorized list
          const isAuthorized = testData.authorizedSchools.includes(testData.requestedSchoolId)
          mockSessionContextService.updateSchoolContext.mockResolvedValue(isAuthorized)
          
          if (isAuthorized) {
            mockRoleRouterService.getRouteForRole.mockReturnValue('/dashboard')
          }

          const response = await POST(request)
          const data = await response.json()

          // Property: Only authorized school switches should succeed
          if (testData.requestedSchoolId === testData.currentSchoolId) {
            // Same school - should return 400 (no context switch needed)
            expect(response.status).toBe(400)
            expect(data.error).toBe('No context switch requested')
          } else if (isAuthorized) {
            // Authorized school - should succeed
            expect(response.status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.message).toBe('School context switched successfully')
          } else {
            // Unauthorized school - should fail with 403
            expect(response.status).toBe(403)
            expect(data.success).toBe(false)
            expect(data.error).toBe('You do not have access to this school')
          }
        }
      ), { numRuns: 100 })
    })
  })

  /**
   * Property 3: Parent-Student Context Validation
   * For any parent-student context switch, the system should validate parent-child relationships
   * **Validates: Requirements 6.4, 6.5**
   */
  describe('Property 3: Parent-Student Context Validation', () => {
    it('should validate parent-student relationships for all context switches', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          parentId: fc.string({ minLength: 1 }),
          schoolId: fc.string({ minLength: 1 }),
          requestedStudentId: fc.string({ minLength: 1 }),
          hasAccess: fc.boolean()
        }),
        async (testData) => {
          const validToken = 'valid-jwt-token'
          const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
            method: 'POST',
            body: JSON.stringify({ 
              token: validToken, 
              newStudentId: testData.requestedStudentId 
            })
          })

          mockJwtService.verifyToken.mockResolvedValue({
            valid: true,
            payload: {
              userId: testData.parentId,
              role: UserRole.PARENT,
              activeSchoolId: testData.schoolId,
              authorizedSchools: [testData.schoolId],
              permissions: []
            }
          })

          mockSessionContextService.validateParentStudentAccess.mockResolvedValue(testData.hasAccess)
          
          if (testData.hasAccess) {
            mockRoleRouterService.getRouteForRole.mockReturnValue('/parent/dashboard')
          }

          const response = await POST(request)
          const data = await response.json()

          // Property: Only valid parent-student relationships should allow context switching
          if (testData.hasAccess) {
            expect(response.status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.message).toBe('Student context switched successfully')
            expect(mockSessionContextService.validateParentStudentAccess).toHaveBeenCalledWith(
              testData.parentId,
              testData.requestedStudentId,
              testData.schoolId
            )
          } else {
            expect(response.status).toBe(403)
            expect(data.success).toBe(false)
            expect(data.error).toBe('You do not have access to this student')
          }
        }
      ), { numRuns: 100 })
    })
  })

  /**
   * Property 4: Role-Based Context Switching Restrictions
   * For any context switch request, only appropriate roles should be allowed to switch contexts
   * **Validates: Requirements 6.2, 6.3**
   */
  describe('Property 4: Role-Based Context Switching Restrictions', () => {
    it('should enforce role-based restrictions on context switching', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          userId: fc.string({ minLength: 1 }),
          role: fc.constantFrom(...Object.values(UserRole)),
          schoolId: fc.string({ minLength: 1 }),
          requestedStudentId: fc.string({ minLength: 1 })
        }),
        async (testData) => {
          const validToken = 'valid-jwt-token'
          const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
            method: 'POST',
            body: JSON.stringify({ 
              token: validToken, 
              newStudentId: testData.requestedStudentId 
            })
          })

          mockJwtService.verifyToken.mockResolvedValue({
            valid: true,
            payload: {
              userId: testData.userId,
              role: testData.role,
              activeSchoolId: testData.schoolId,
              authorizedSchools: [testData.schoolId],
              permissions: []
            }
          })

          // Only parents should be able to switch student context
          if (testData.role === UserRole.PARENT) {
            mockSessionContextService.validateParentStudentAccess.mockResolvedValue(true)
            mockRoleRouterService.getRouteForRole.mockReturnValue('/parent/dashboard')
          }

          const response = await POST(request)
          const data = await response.json()

          // Property: Only parents should be able to switch student context
          if (testData.role === UserRole.PARENT) {
            expect(response.status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.message).toBe('Student context switched successfully')
          } else {
            // Non-parent roles should not be able to switch student context
            expect(response.status).toBe(400)
            expect(data.success).toBe(false)
            expect(data.error).toBe('No context switch requested')
          }
        }
      ), { numRuns: 100 })
    })
  })

  /**
   * Property 5: Audit Logging Completeness
   * For any context switch attempt, the system should log the event for audit purposes
   * **Validates: Requirements 15.3, 8.5**
   */
  describe('Property 5: Audit Logging Completeness', () => {
    it('should log all context switch attempts with complete information', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          userId: fc.string({ minLength: 1 }),
          role: fc.constantFrom(...Object.values(UserRole)),
          currentSchoolId: fc.string({ minLength: 1 }),
          requestedSchoolId: fc.string({ minLength: 1 }),
          clientIP: fc.option(fc.ipV4()),
          userAgent: fc.option(fc.string())
        }),
        async (testData) => {
          const validToken = 'valid-jwt-token'
          const headers: Record<string, string> = {}
          
          if (testData.clientIP) {
            headers['x-forwarded-for'] = testData.clientIP
          }
          if (testData.userAgent) {
            headers['user-agent'] = testData.userAgent
          }

          const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
            method: 'POST',
            body: JSON.stringify({ 
              token: validToken, 
              newSchoolId: testData.requestedSchoolId 
            }),
            headers
          })

          mockJwtService.verifyToken.mockResolvedValue({
            valid: true,
            payload: {
              userId: testData.userId,
              role: testData.role,
              activeSchoolId: testData.currentSchoolId,
              authorizedSchools: [testData.currentSchoolId, testData.requestedSchoolId],
              permissions: []
            }
          })

          const isValidSwitch = testData.requestedSchoolId !== testData.currentSchoolId
          mockSessionContextService.updateSchoolContext.mockResolvedValue(isValidSwitch)
          
          if (isValidSwitch) {
            mockRoleRouterService.getRouteForRole.mockReturnValue('/dashboard')
          }

          await POST(request)

          // Property: All context switch attempts should be logged
          if (testData.requestedSchoolId === testData.currentSchoolId) {
            // No context switch needed - no audit log expected
            return
          }

          expect(mockLogAuditEvent).toHaveBeenCalled()
          
          const auditCall = mockLogAuditEvent.mock.calls[0][0]
          expect(auditCall.userId).toBe(testData.userId.trim() || testData.userId)
          expect(auditCall.action).toMatch(/UPDATE|REJECT/)
          expect(auditCall.resource).toBe('school_context')
          expect(auditCall.changes).toMatchObject({
            clientIP: testData.clientIP || 'unknown',
            userAgent: testData.userAgent || 'unknown',
            timestamp: expect.any(Date)
          })
        }
      ), { numRuns: 100 })
    })
  })

  /**
   * Property 6: Error Handling Consistency
   * For any error condition, the system should handle errors gracefully and provide appropriate responses
   * **Validates: Requirements 11.4, 11.5**
   */
  describe('Property 6: Error Handling Consistency', () => {
    it('should handle all error conditions gracefully', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          tokenValid: fc.boolean(),
          serviceError: fc.option(fc.constantFrom(
            'DATABASE_ERROR',
            'NETWORK_ERROR',
            'VALIDATION_ERROR',
            'PERMISSION_ERROR'
          )),
          errorMessage: fc.string()
        }),
        async (testData) => {
          const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
            method: 'POST',
            body: JSON.stringify({ 
              token: 'test-token', 
              newSchoolId: 'school-123' 
            })
          })

          if (testData.tokenValid) {
            mockJwtService.verifyToken.mockResolvedValue({
              valid: true,
              payload: {
                userId: 'user-123',
                role: UserRole.TEACHER,
                activeSchoolId: 'school-old',
                authorizedSchools: ['school-old', 'school-123'],
                permissions: []
              }
            })

            if (testData.serviceError) {
              mockSessionContextService.updateSchoolContext.mockRejectedValue(
                new Error(testData.errorMessage)
              )
            } else {
              mockSessionContextService.updateSchoolContext.mockResolvedValue(true)
              mockRoleRouterService.getRouteForRole.mockReturnValue('/teacher/dashboard')
            }
          } else {
            mockJwtService.verifyToken.mockResolvedValue({
              valid: false,
              error: 'TOKEN_INVALID'
            })
          }

          const response = await POST(request)
          const data = await response.json()

          // Property: All error responses should be well-formed and secure
          expect(data).toHaveProperty('success')
          expect(data.success).toBe(testData.tokenValid && !testData.serviceError)
          
          if (!testData.tokenValid || testData.serviceError) {
            expect(data).toHaveProperty('error')
            expect(typeof data.error).toBe('string')
            expect(data.error.length).toBeGreaterThan(0)
            
            // Should not expose internal error details
            expect(data.error).not.toContain('Database')
            expect(data.error).not.toContain('SQL')
            expect(data.error).not.toContain('Connection')
          }

          // Status codes should be appropriate
          if (!testData.tokenValid) {
            expect(response.status).toBe(401)
          } else if (testData.serviceError) {
            expect([403, 500]).toContain(response.status)
          } else {
            expect(response.status).toBe(200)
          }
        }
      ), { numRuns: 100 })
    })
  })

  /**
   * Property 7: Response Structure Consistency
   * For any valid request, the response should have a consistent structure
   * **Validates: Requirements 5.2, 5.3, 6.2, 6.3**
   */
  describe('Property 7: Response Structure Consistency', () => {
    it('should return consistent response structures for all valid requests', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          userId: fc.string({ minLength: 1 }),
          role: fc.constantFrom(...Object.values(UserRole)),
          contextType: fc.constantFrom('school', 'student'),
          contextId: fc.string({ minLength: 1 }),
          isAuthorized: fc.boolean()
        }),
        async (testData) => {
          const validToken = 'valid-jwt-token'
          const requestBody: any = { token: validToken }
          
          if (testData.contextType === 'school') {
            requestBody.newSchoolId = testData.contextId
          } else {
            requestBody.newStudentId = testData.contextId
          }

          const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
            method: 'POST',
            body: JSON.stringify(requestBody)
          })

          mockJwtService.verifyToken.mockResolvedValue({
            valid: true,
            payload: {
              userId: testData.userId,
              role: testData.role,
              activeSchoolId: 'current-school',
              authorizedSchools: ['current-school'],
              permissions: []
            }
          })

          if (testData.contextType === 'school') {
            mockSessionContextService.updateSchoolContext.mockResolvedValue(testData.isAuthorized)
          } else if (testData.role === UserRole.PARENT) {
            mockSessionContextService.validateParentStudentAccess.mockResolvedValue(testData.isAuthorized)
          }

          if (testData.isAuthorized) {
            mockRoleRouterService.getRouteForRole.mockReturnValue('/dashboard')
          }

          const response = await POST(request)
          const data = await response.json()

          // Property: All responses should have consistent structure
          expect(data).toHaveProperty('success')
          expect(typeof data.success).toBe('boolean')

          if (data.success) {
            expect(data).toHaveProperty('message')
            expect(data).toHaveProperty('redirectUrl')
            expect(data).toHaveProperty('newContext')
            expect(typeof data.message).toBe('string')
            expect(typeof data.redirectUrl).toBe('string')
            expect(typeof data.newContext).toBe('object')
          } else {
            expect(data).toHaveProperty('error')
            expect(typeof data.error).toBe('string')
          }
        }
      ), { numRuns: 100 })
    })
  })

  /**
   * Property 8: Context Isolation
   * For any context switch, the system should maintain proper isolation between contexts
   * **Validates: Requirements 8.1, 8.3**
   */
  describe('Property 8: Context Isolation', () => {
    it('should maintain proper context isolation during switches', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          userId: fc.string({ minLength: 1 }),
          role: fc.constantFrom(...Object.values(UserRole)),
          fromSchoolId: fc.string({ minLength: 1 }),
          toSchoolId: fc.string({ minLength: 1 }),
          authorizedSchools: fc.array(fc.string({ minLength: 1 }), { minLength: 2, maxLength: 5 })
        }).filter(data => 
          data.fromSchoolId !== data.toSchoolId && 
          data.authorizedSchools.includes(data.fromSchoolId) &&
          data.authorizedSchools.includes(data.toSchoolId)
        ),
        async (testData) => {
          const validToken = 'valid-jwt-token'
          const request = new NextRequest('http://localhost:3000/api/auth/context/switch', {
            method: 'POST',
            body: JSON.stringify({ 
              token: validToken, 
              newSchoolId: testData.toSchoolId 
            })
          })

          mockJwtService.verifyToken.mockResolvedValue({
            valid: true,
            payload: {
              userId: testData.userId,
              role: testData.role,
              activeSchoolId: testData.fromSchoolId,
              authorizedSchools: testData.authorizedSchools,
              permissions: []
            }
          })

          mockSessionContextService.updateSchoolContext.mockResolvedValue(true)
          mockRoleRouterService.getRouteForRole.mockReturnValue('/dashboard')

          const response = await POST(request)
          const data = await response.json()

          // Property: Context switches should properly isolate school data
          expect(response.status).toBe(200)
          expect(data.success).toBe(true)
          expect(data.newContext.schoolId).toBe(testData.toSchoolId)
          
          // Verify the context switch was properly validated
          expect(mockSessionContextService.updateSchoolContext).toHaveBeenCalledWith(
            validToken,
            testData.toSchoolId,
            testData.userId
          )

          // Verify audit logging includes context change
          expect(mockLogAuditEvent).toHaveBeenCalledWith(
            expect.objectContaining({
              userId: testData.userId,
              schoolId: testData.toSchoolId,
              action: 'UPDATE',
              resource: 'school_context',
              changes: expect.objectContaining({
                previousSchoolId: testData.fromSchoolId,
                newSchoolId: testData.toSchoolId
              })
            })
          )
        }
      ), { numRuns: 50 })
    })
  })
})