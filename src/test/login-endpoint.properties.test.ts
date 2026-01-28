import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fc from 'fast-check'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/login/route'

/**
 * Login Endpoint Property-Based Tests
 * 
 * Property-based tests for the /api/auth/login endpoint.
 * Requirements: 1.1, 2.1, 4.1, 5.1, 6.1, 11.1
 * 
 * **Feature: unified-auth-multitenant-refactor**
 */

// Mock the services
vi.mock('@/lib/services/authentication-service')
vi.mock('@/lib/services/role-router-service')
vi.mock('@/lib/services/audit-service')

const mockAuthenticationService = {
  authenticateUser: vi.fn()
}

const mockRoleRouterService = {
  getRouteForRole: vi.fn()
}

const mockLogAuditEvent = vi.fn()

// Mock the service imports
vi.doMock('@/lib/services/authentication-service', () => ({
  authenticationService: mockAuthenticationService
}))

vi.doMock('@/lib/services/role-router-service', () => ({
  roleRouterService: mockRoleRouterService
}))

vi.doMock('@/lib/services/audit-service', () => ({
  logAuditEvent: mockLogAuditEvent
}))

describe('Login Endpoint Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAuditEvent.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * **Property 1: Input Validation Consistency**
   * For any invalid input combination, the endpoint should consistently return 400 status
   * **Validates: Requirements 1.1, 2.1**
   */
  it('Property 1: should consistently validate required fields and return 400 for invalid inputs', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        identifier: fc.option(fc.oneof(
          fc.string(),
          fc.constant(''),
          fc.constant('   '),
          fc.constant(null),
          fc.constant(undefined)
        )),
        schoolId: fc.option(fc.oneof(
          fc.string(),
          fc.constant(''),
          fc.constant('   '),
          fc.constant(null),
          fc.constant(undefined)
        )),
        credentials: fc.option(fc.record({
          type: fc.option(fc.oneof(
            fc.constant('otp'),
            fc.constant('password'),
            fc.constant('invalid'),
            fc.constant(''),
            fc.constant(null)
          )),
          value: fc.option(fc.oneof(
            fc.string(),
            fc.constant(''),
            fc.constant(null),
            fc.constant(undefined)
          ))
        }))
      }),
      async (input) => {
        // Skip valid inputs for this property
        const hasValidIdentifier = input.identifier && 
          typeof input.identifier === 'string' && 
          input.identifier.trim().length > 0
        const hasValidSchoolId = input.schoolId && 
          typeof input.schoolId === 'string' && 
          input.schoolId.trim().length > 0
        const hasValidCredentials = input.credentials && 
          input.credentials.type && 
          ['otp', 'password'].includes(input.credentials.type) &&
          input.credentials.value && 
          typeof input.credentials.value === 'string' &&
          input.credentials.value.trim().length > 0

        if (hasValidIdentifier && hasValidSchoolId && hasValidCredentials) {
          return // Skip valid combinations
        }

        const request = new NextRequest('http://localhost/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(input),
          headers: { 'Content-Type': 'application/json' }
        })

        const response = await POST(request)
        const data = await response.json()

        // All invalid inputs should return 400
        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(typeof data.error).toBe('string')
        expect(data.error.length).toBeGreaterThan(0)
      }
    ), { numRuns: 100 })
  })

  /**
   * **Property 2: Authentication Service Integration**
   * For any valid input, the authentication service should be called with correct parameters
   * **Validates: Requirements 4.1, 11.1**
   */
  it('Property 2: should call authentication service with correct parameters for valid inputs', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        identifier: fc.oneof(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.emailAddress(),
          fc.string({ minLength: 10, maxLength: 10 }).filter(s => /^\d{10}$/.test(s))
        ),
        schoolId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        credentials: fc.record({
          type: fc.constantFrom('otp', 'password'),
          value: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
        })
      }),
      fc.record({
        clientIP: fc.option(fc.ipV4()),
        userAgent: fc.option(fc.string({ maxLength: 200 }))
      }),
      async (input, headers) => {
        // Mock successful authentication
        mockAuthenticationService.authenticateUser.mockResolvedValue({
          success: true,
          user: {
            id: 'test-user-id',
            name: 'Test User',
            role: 'STUDENT'
          },
          token: 'test-token'
        })

        mockRoleRouterService.getRouteForRole.mockReturnValue('/student/dashboard')

        const requestHeaders = { 'Content-Type': 'application/json' }
        if (headers.clientIP) {
          requestHeaders['x-forwarded-for'] = headers.clientIP
        }
        if (headers.userAgent) {
          requestHeaders['user-agent'] = headers.userAgent
        }

        const request = new NextRequest('http://localhost/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(input),
          headers: requestHeaders
        })

        await POST(request)

        // Verify authentication service was called with correct parameters
        expect(mockAuthenticationService.authenticateUser).toHaveBeenCalledWith(
          input.identifier.trim(),
          input.schoolId,
          input.credentials,
          headers.clientIP || 'unknown',
          headers.userAgent || 'unknown'
        )
      }
    ), { numRuns: 50 })
  })

  /**
   * **Property 3: Successful Authentication Response Structure**
   * For any successful authentication, the response should have consistent structure
   * **Validates: Requirements 5.1, 6.1, 11.1**
   */
  it('Property 3: should return consistent response structure for successful authentication', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        identifier: fc.oneof(
          fc.emailAddress(),
          fc.string({ minLength: 10, maxLength: 10 }).filter(s => /^\d{10}$/.test(s))
        ),
        schoolId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        credentials: fc.record({
          type: fc.constantFrom('otp', 'password'),
          value: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
        })
      }),
      fc.record({
        user: fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          role: fc.constantFrom('STUDENT', 'PARENT', 'TEACHER', 'SCHOOL_ADMIN')
        }),
        token: fc.string({ minLength: 1 }),
        requiresSchoolSelection: fc.option(fc.boolean()),
        availableSchools: fc.option(fc.array(fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          schoolCode: fc.string({ minLength: 1 })
        }))),
        requiresChildSelection: fc.option(fc.boolean()),
        availableChildren: fc.option(fc.array(fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          class: fc.string({ minLength: 1 }),
          section: fc.string({ minLength: 1 })
        })))
      }),
      async (input, mockResponse) => {
        // Mock successful authentication
        mockAuthenticationService.authenticateUser.mockResolvedValue({
          success: true,
          ...mockResponse
        })

        const expectedRoute = `/student/dashboard`
        mockRoleRouterService.getRouteForRole.mockReturnValue(expectedRoute)

        const request = new NextRequest('http://localhost/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(input),
          headers: { 'Content-Type': 'application/json' }
        })

        const response = await POST(request)
        const data = await response.json()

        // Verify response structure
        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.user).toEqual(mockResponse.user)
        expect(data.token).toBe(mockResponse.token)

        // Check conditional fields
        if (mockResponse.requiresSchoolSelection) {
          expect(data.requiresSchoolSelection).toBe(true)
          expect(data.availableSchools).toEqual(mockResponse.availableSchools)
          expect(data.redirectUrl).toBeUndefined()
        }

        if (mockResponse.requiresChildSelection) {
          expect(data.requiresChildSelection).toBe(true)
          expect(data.availableChildren).toEqual(mockResponse.availableChildren)
          expect(data.redirectUrl).toBeUndefined()
        }

        if (!mockResponse.requiresSchoolSelection && !mockResponse.requiresChildSelection) {
          expect(data.redirectUrl).toBe(expectedRoute)
        }
      }
    ), { numRuns: 50 })
  })

  /**
   * **Property 4: Error Handling Consistency**
   * For any authentication error, the response should have consistent error structure
   * **Validates: Requirements 1.1, 2.1, 4.1**
   */
  it('Property 4: should return consistent error structure for authentication failures', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        identifier: fc.oneof(
          fc.emailAddress(),
          fc.string({ minLength: 10, maxLength: 10 }).filter(s => /^\d{10}$/.test(s))
        ),
        schoolId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        credentials: fc.record({
          type: fc.constantFrom('otp', 'password'),
          value: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
        })
      }),
      fc.record({
        errorType: fc.constantFrom(
          'INVALID_CREDENTIALS',
          'USER_NOT_FOUND', 
          'UNAUTHORIZED_SCHOOL',
          'SCHOOL_NOT_FOUND',
          'SCHOOL_INACTIVE'
        ),
        errorMessage: fc.string({ minLength: 1, maxLength: 200 })
      }),
      async (input, errorConfig) => {
        // Mock authentication failure
        if (Math.random() < 0.5) {
          // Test service returning failure
          mockAuthenticationService.authenticateUser.mockResolvedValue({
            success: false,
            error: errorConfig.errorMessage
          })
        } else {
          // Test service throwing error
          const error = new Error(errorConfig.errorMessage)
          error.code = errorConfig.errorType
          mockAuthenticationService.authenticateUser.mockRejectedValue(error)
        }

        const request = new NextRequest('http://localhost/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(input),
          headers: { 'Content-Type': 'application/json' }
        })

        const response = await POST(request)
        const data = await response.json()

        // Verify error response structure
        expect(data.success).toBe(false)
        expect(typeof data.error).toBe('string')
        expect(data.error.length).toBeGreaterThan(0)

        // Verify status codes based on error type
        const expectedStatusCodes = {
          'INVALID_CREDENTIALS': 401,
          'USER_NOT_FOUND': 404,
          'UNAUTHORIZED_SCHOOL': 403,
          'SCHOOL_NOT_FOUND': 404,
          'SCHOOL_INACTIVE': 403
        }

        if (expectedStatusCodes[errorConfig.errorType]) {
          expect(response.status).toBe(expectedStatusCodes[errorConfig.errorType])
          expect(data.code).toBe(errorConfig.errorType)
        } else {
          expect([401, 500]).toContain(response.status)
        }
      }
    ), { numRuns: 50 })
  })

  /**
   * **Property 5: Audit Logging Completeness**
   * For any authentication attempt, appropriate audit events should be logged
   * **Validates: Requirements 11.1**
   */
  it('Property 5: should log audit events for all authentication attempts', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        identifier: fc.oneof(
          fc.emailAddress(),
          fc.string({ minLength: 10, maxLength: 10 }).filter(s => /^\d{10}$/.test(s))
        ),
        schoolId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        credentials: fc.record({
          type: fc.constantFrom('otp', 'password'),
          value: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
        })
      }),
      fc.boolean(), // success or failure
      async (input, shouldSucceed) => {
        if (shouldSucceed) {
          // Mock successful authentication
          mockAuthenticationService.authenticateUser.mockResolvedValue({
            success: true,
            user: {
              id: 'test-user-id',
              name: 'Test User',
              role: 'STUDENT'
            },
            token: 'test-token'
          })
          mockRoleRouterService.getRouteForRole.mockReturnValue('/student/dashboard')
        } else {
          // Mock authentication failure
          mockAuthenticationService.authenticateUser.mockResolvedValue({
            success: false,
            error: 'Authentication failed'
          })
        }

        const request = new NextRequest('http://localhost/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(input),
          headers: { 'Content-Type': 'application/json' }
        })

        await POST(request)

        // Verify audit logging was called
        expect(mockLogAuditEvent).toHaveBeenCalled()

        const auditCall = mockLogAuditEvent.mock.calls[0][0]
        expect(auditCall.schoolId).toBe(input.schoolId)
        expect(auditCall.resource).toBe('authentication')
        expect(auditCall.changes.identifier).toBe(input.identifier.trim())
        expect(auditCall.changes.authMethod).toBe(input.credentials.type)

        if (shouldSucceed) {
          expect(auditCall.action).toBe('LOGIN_SUCCESS')
          expect(auditCall.userId).toBe('test-user-id')
        } else {
          expect(auditCall.action).toBe('LOGIN_FAILED')
          expect(auditCall.changes.reason).toBe('Authentication failed')
        }
      }
    ), { numRuns: 50 })
  })

  /**
   * **Property 6: Identifier Trimming Consistency**
   * For any identifier with whitespace, it should be consistently trimmed
   * **Validates: Requirements 1.1**
   */
  it('Property 6: should consistently trim identifiers before processing', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        baseIdentifier: fc.oneof(
          fc.emailAddress(),
          fc.string({ minLength: 10, maxLength: 10 }).filter(s => /^\d{10}$/.test(s))
        ),
        whitespace: fc.record({
          prefix: fc.string().filter(s => s.trim() === ''),
          suffix: fc.string().filter(s => s.trim() === '')
        }),
        schoolId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        credentials: fc.record({
          type: fc.constantFrom('otp', 'password'),
          value: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
        })
      }),
      async (input) => {
        const identifierWithWhitespace = input.whitespace.prefix + input.baseIdentifier + input.whitespace.suffix

        // Mock successful authentication
        mockAuthenticationService.authenticateUser.mockResolvedValue({
          success: true,
          user: {
            id: 'test-user-id',
            name: 'Test User',
            role: 'STUDENT'
          },
          token: 'test-token'
        })

        const request = new NextRequest('http://localhost/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            identifier: identifierWithWhitespace,
            schoolId: input.schoolId,
            credentials: input.credentials
          }),
          headers: { 'Content-Type': 'application/json' }
        })

        await POST(request)

        // Verify the identifier was trimmed when passed to authentication service
        expect(mockAuthenticationService.authenticateUser).toHaveBeenCalledWith(
          input.baseIdentifier, // Should be trimmed
          input.schoolId,
          input.credentials,
          'unknown',
          'unknown'
        )
      }
    ), { numRuns: 50 })
  })

  /**
   * **Property 7: Role-Based Routing Consistency**
   * For any successful authentication without additional selections, routing should be consistent with role
   * **Validates: Requirements 5.1, 6.1**
   */
  it('Property 7: should consistently route users based on role when no additional selections required', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        identifier: fc.oneof(
          fc.emailAddress(),
          fc.string({ minLength: 10, maxLength: 10 }).filter(s => /^\d{10}$/.test(s))
        ),
        schoolId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        credentials: fc.record({
          type: fc.constantFrom('otp', 'password'),
          value: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
        }),
        userRole: fc.constantFrom('STUDENT', 'PARENT', 'TEACHER', 'SCHOOL_ADMIN')
      }),
      async (input) => {
        const mockUser = {
          id: 'test-user-id',
          name: 'Test User',
          role: input.userRole
        }

        // Mock successful authentication without additional selections
        mockAuthenticationService.authenticateUser.mockResolvedValue({
          success: true,
          user: mockUser,
          token: 'test-token',
          requiresSchoolSelection: false,
          requiresChildSelection: false
        })

        const expectedRoute = `/dashboard/${input.userRole.toLowerCase()}`
        mockRoleRouterService.getRouteForRole.mockReturnValue(expectedRoute)

        const request = new NextRequest('http://localhost/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(input),
          headers: { 'Content-Type': 'application/json' }
        })

        const response = await POST(request)
        const data = await response.json()

        // Verify role router was called with correct parameters
        expect(mockRoleRouterService.getRouteForRole).toHaveBeenCalledWith(
          input.userRole,
          {
            userId: 'test-user-id',
            role: input.userRole,
            activeSchoolId: input.schoolId
          }
        )

        // Verify response includes redirect URL
        expect(data.redirectUrl).toBe(expectedRoute)
      }
    ), { numRuns: 50 })
  })
})