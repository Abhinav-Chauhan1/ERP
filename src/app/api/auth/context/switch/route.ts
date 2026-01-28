import { NextRequest, NextResponse } from "next/server"
import { schoolContextService } from "@/lib/services/school-context-service"
import { roleRouterService } from "@/lib/services/role-router-service"
import { jwtService } from "@/lib/services/jwt-service"
import { logAuditEvent } from "@/lib/services/audit-service"
import { sessionContextService } from "@/lib/services/session-context-service"

/**
 * Context Switching API Endpoint
 * 
 * Handles school and child context switching for multi-school users and parents.
 * Requirements: 5.2, 5.3, 6.2, 6.3
 */

export async function POST(request: NextRequest) {
  try {
    const { newSchoolId, newStudentId, token } = await request.json()

    // Validate input
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication token is required' 
        },
        { status: 401 }
      )
    }

    // Get client information for audit logging
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    try {
      // Verify and decode token
      const tokenValidation = await jwtService.verifyToken(token)
      
      if (!tokenValidation.valid || !tokenValidation.payload) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid or expired token' 
          },
          { status: 401 }
        )
      }

      const { userId, role, activeSchoolId } = tokenValidation.payload

      // Handle school context switching
      if (newSchoolId && newSchoolId !== activeSchoolId) {
        // Use session context service for validation and switching
        const switchSuccess = await sessionContextService.updateSchoolContext(
          token,
          newSchoolId,
          userId
        )

        if (!switchSuccess) {
          await logAuditEvent({
            userId,
            schoolId: activeSchoolId,
            action: 'REJECT',
            resource: 'school_context',
            changes: {
              requestedSchoolId: newSchoolId,
              reason: 'UNAUTHORIZED_ACCESS',
              clientIP,
              userAgent,
              timestamp: new Date()
            }
          })

          return NextResponse.json(
            { 
              success: false, 
              error: 'You do not have access to this school' 
            },
            { status: 403 }
          )
        }

        // Log successful school context switch
        await logAuditEvent({
          userId,
          schoolId: newSchoolId,
          action: 'UPDATE',
          resource: 'school_context',
          changes: {
            previousSchoolId: activeSchoolId,
            newSchoolId,
            clientIP,
            userAgent,
            timestamp: new Date()
          }
        })

        // Get redirect route for new school context
        const route = roleRouterService.getRouteForRole(role, {
          userId,
          role,
          activeSchoolId: newSchoolId,
          activeStudentId: newStudentId
        })

        return NextResponse.json({
          success: true,
          message: 'School context switched successfully',
          redirectUrl: route,
          newContext: {
            schoolId: newSchoolId,
            studentId: newStudentId
          }
        })
      }

      // Handle student context switching (for parents)
      if (newStudentId && role === 'PARENT') {
        // Validate parent has access to this student using session context service
        const hasStudentAccess = await sessionContextService.validateParentStudentAccess(
          userId, 
          newStudentId, 
          activeSchoolId
        )
        
        if (!hasStudentAccess) {
          await logAuditEvent({
            userId,
            schoolId: activeSchoolId,
            action: 'REJECT',
            resource: 'parent_context',
            changes: {
              requestedStudentId: newStudentId,
              reason: 'UNAUTHORIZED_ACCESS',
              clientIP,
              userAgent,
              timestamp: new Date()
            }
          })

          return NextResponse.json(
            { 
              success: false, 
              error: 'You do not have access to this student' 
            },
            { status: 403 }
          )
        }

        // Note: For now, we'll handle student context in the frontend/JWT
        // In a future enhancement, we could add activeStudentId to AuthSession model
        
        // Log student context switch
        await logAuditEvent({
          userId,
          schoolId: activeSchoolId,
          action: 'UPDATE',
          resource: 'parent_context',
          changes: {
            previousStudentId: tokenValidation.payload.activeStudentId,
            newStudentId,
            clientIP,
            userAgent,
            timestamp: new Date()
          }
        })

        // Get redirect route for new student context
        const route = roleRouterService.getRouteForRole(role, {
          userId,
          role,
          activeSchoolId: activeSchoolId || newSchoolId,
          activeStudentId: newStudentId
        })

        return NextResponse.json({
          success: true,
          message: 'Student context switched successfully',
          redirectUrl: route,
          newContext: {
            schoolId: activeSchoolId || newSchoolId,
            studentId: newStudentId
          }
        })
      }

      // If no context switching was requested
      return NextResponse.json(
        { 
          success: false, 
          error: 'No context switch requested' 
        },
        { status: 400 }
      )

    } catch (error: any) {
      console.error('Context switching error:', error)

      // Log error (userId might not be available if token validation failed)
      await logAuditEvent({
        userId: 'SYSTEM', // Use system identifier when user context is not available
        action: 'REJECT',
        resource: 'context_switching',
        changes: {
          error: error.message,
          errorCode: error.code,
          requestedSchoolId: newSchoolId,
          requestedStudentId: newStudentId,
          clientIP,
          userAgent,
          timestamp: new Date()
        }
      })

      if (error.code === 'TOKEN_EXPIRED') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Session expired. Please sign in again.',
            code: 'TOKEN_EXPIRED'
          },
          { status: 401 }
        )
      }

      if (error.code === 'TOKEN_INVALID') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid session. Please sign in again.',
            code: 'TOKEN_INVALID'
          },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to switch context. Please try again.' 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Context switching API error:', error)
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}