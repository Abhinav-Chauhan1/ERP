import { NextRequest, NextResponse } from "next/server"
import { schoolContextService } from "@/lib/services/school-context-service"
import { logAuditEvent } from "@/lib/services/audit-service"

/**
 * School Code Validation API Endpoint
 * 
 * Validates school code and returns school information if valid and active.
 * Requirements: 2.2, 2.3
 */

export async function POST(request: NextRequest) {
  try {
    const { schoolCode } = await request.json()

    // Validate input
    if (!schoolCode || typeof schoolCode !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'School code is required' 
        },
        { status: 400 }
      )
    }

    // Get client IP for audit logging
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'

    try {
      // Validate school code
      const school = await schoolContextService.validateSchoolCode(schoolCode.trim())

      if (!school) {
        // Log failed validation attempt
        await logAuditEvent({
          action: 'SCHOOL_VALIDATION_FAILED',
          resource: 'school_context',
          changes: {
            schoolCode: schoolCode.trim(),
            reason: 'SCHOOL_NOT_FOUND',
            clientIP,
            timestamp: new Date()
          }
        })

        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid school code' 
          },
          { status: 404 }
        )
      }

      // Log successful validation
      await logAuditEvent({
        schoolId: school.id,
        action: 'SCHOOL_VALIDATION_SUCCESS',
        resource: 'school_context',
        changes: {
          schoolCode: school.schoolCode,
          schoolName: school.name,
          clientIP,
          timestamp: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        school: {
          id: school.id,
          name: school.name,
          schoolCode: school.schoolCode,
          isOnboarded: school.isOnboarded
        }
      })

    } catch (error: any) {
      console.error('School validation error:', error)

      // Log error
      await logAuditEvent({
        action: 'SCHOOL_VALIDATION_ERROR',
        resource: 'school_context',
        changes: {
          schoolCode: schoolCode.trim(),
          error: error.message,
          errorCode: error.code,
          clientIP,
          timestamp: new Date()
        }
      })

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
          error: 'Unable to validate school code. Please try again.' 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('School validation API error:', error)
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