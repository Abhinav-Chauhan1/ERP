import { NextRequest, NextResponse } from "next/server"
import { authenticationService } from "@/lib/services/authentication-service"
import { roleRouterService } from "@/lib/services/role-router-service"
import { logAuditEvent } from "@/lib/services/audit-service"

/**
 * Unified Login API Endpoint
 * 
 * Handles unified authentication for all school-based user types.
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5
 */

export async function POST(request: NextRequest) {
  try {
    const { identifier, schoolId, credentials } = await request.json()

    // Validate input
    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Mobile number or email is required' 
        },
        { status: 400 }
      )
    }

    if (!schoolId || typeof schoolId !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'School ID is required' 
        },
        { status: 400 }
      )
    }

    if (!credentials || !credentials.type || !credentials.value) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication credentials are required' 
        },
        { status: 400 }
      )
    }

    // Validate credentials type
    if (!['otp', 'password'].includes(credentials.type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid authentication method' 
        },
        { status: 400 }
      )
    }

    // Get client information for audit logging
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    try {
      // Authenticate user
      const authResult = await authenticationService.authenticateUser(
        identifier.trim(),
        schoolId,
        credentials,
        clientIP,
        userAgent
      )

      if (!authResult.success) {
        // Log failed authentication
        await logAuditEvent({
          schoolId,
          action: 'LOGIN_FAILED',
          resource: 'authentication',
          changes: {
            identifier: identifier.trim(),
            authMethod: credentials.type,
            reason: authResult.error,
            clientIP,
            userAgent,
            timestamp: new Date()
          }
        })

        return NextResponse.json(
          { 
            success: false, 
            error: authResult.error || 'Authentication failed' 
          },
          { status: 401 }
        )
      }

      // Authentication successful
      const response = {
        success: true,
        user: authResult.user,
        token: authResult.token,
        requiresSchoolSelection: authResult.requiresSchoolSelection,
        availableSchools: authResult.availableSchools,
        requiresChildSelection: authResult.requiresChildSelection,
        availableChildren: authResult.availableChildren
      }

      // If no additional selections required, determine redirect route
      if (!authResult.requiresSchoolSelection && !authResult.requiresChildSelection && authResult.user) {
        const route = roleRouterService.getRouteForRole(authResult.user.role, {
          userId: authResult.user.id,
          role: authResult.user.role,
          activeSchoolId: schoolId
        })

        response.redirectUrl = route
      }

      // Log successful authentication
      await logAuditEvent({
        userId: authResult.user?.id,
        schoolId,
        action: 'LOGIN_SUCCESS',
        resource: 'authentication',
        changes: {
          identifier: identifier.trim(),
          authMethod: credentials.type,
          userRole: authResult.user?.role,
          requiresSchoolSelection: authResult.requiresSchoolSelection,
          requiresChildSelection: authResult.requiresChildSelection,
          clientIP,
          userAgent,
          timestamp: new Date()
        }
      })

      return NextResponse.json(response)

    } catch (error: any) {
      console.error('Authentication error:', error)

      // Log error
      await logAuditEvent({
        schoolId,
        action: 'LOGIN_ERROR',
        resource: 'authentication',
        changes: {
          identifier: identifier.trim(),
          authMethod: credentials.type,
          error: error.message,
          errorCode: error.code,
          clientIP,
          userAgent,
          timestamp: new Date()
        }
      })

      // Handle specific error cases
      if (error.code === 'INVALID_CREDENTIALS') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid credentials. Please check and try again.',
            code: 'INVALID_CREDENTIALS'
          },
          { status: 401 }
        )
      }

      if (error.code === 'USER_NOT_FOUND') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'No account found with this mobile number or email for the selected school',
            code: 'USER_NOT_FOUND'
          },
          { status: 404 }
        )
      }

      if (error.code === 'UNAUTHORIZED_SCHOOL') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'You do not have access to this school',
            code: 'UNAUTHORIZED_SCHOOL'
          },
          { status: 403 }
        )
      }

      if (error.code === 'SCHOOL_NOT_FOUND') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'School not found',
            code: 'SCHOOL_NOT_FOUND'
          },
          { status: 404 }
        )
      }

      if (error.code === 'SCHOOL_INACTIVE') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'This school is currently inactive. Please contact support.',
            code: 'SCHOOL_INACTIVE'
          },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication failed. Please try again.' 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}