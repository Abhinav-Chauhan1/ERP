import { NextRequest, NextResponse } from "next/server"
import { authenticationService } from "@/lib/services/authentication-service"
import { logAuditEvent } from "@/lib/services/audit-service"

/**
 * OTP Generation API Endpoint
 * 
 * Generates and sends OTP for user authentication.
 * Requirements: 4.1, 4.2, 4.3, 14.1
 */

export async function POST(request: NextRequest) {
  try {
    const { identifier, schoolId } = await request.json()

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

    // Basic identifier validation
    const isEmail = identifier.includes('@')
    const isMobile = /^\d{10}$/.test(identifier.trim())

    if (!isEmail && !isMobile) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Please enter a valid mobile number (10 digits) or email address' 
        },
        { status: 400 }
      )
    }

    // Get client IP for audit logging
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'

    try {
      // Generate OTP
      const otpResult = await authenticationService.generateOTP(identifier.trim(), schoolId)

      if (!otpResult.success) {
        // Log failed OTP generation
        await logAuditEvent({
          userId: null,
          schoolId,
          action: 'REJECT',
          resource: 'authentication',
          changes: {
            identifier: identifier.trim(),
            reason: otpResult.error,
            clientIP,
            timestamp: new Date()
          }
        })

        // Handle specific error cases
        if (otpResult.error === 'USER_NOT_FOUND') {
          return NextResponse.json(
            { 
              success: false, 
              error: 'No account found with this mobile number or email for the selected school',
              code: 'USER_NOT_FOUND'
            },
            { status: 404 }
          )
        }

        if (otpResult.error === 'SCHOOL_NOT_FOUND') {
          return NextResponse.json(
            { 
              success: false, 
              error: 'School not found or inactive',
              code: 'SCHOOL_NOT_FOUND'
            },
            { status: 404 }
          )
        }

        if (otpResult.error === 'RATE_LIMITED') {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Too many OTP requests. Please wait before trying again.',
              code: 'RATE_LIMITED'
            },
            { status: 429 }
          )
        }

        return NextResponse.json(
          { 
            success: false, 
            error: otpResult.message || 'Failed to generate OTP' 
          },
          { status: 500 }
        )
      }

      // Log successful OTP generation
      await logAuditEvent({
        userId: null,
        schoolId,
        action: 'CREATE',
        resource: 'authentication',
        changes: {
          identifier: identifier.trim(),
          expiresAt: otpResult.expiresAt,
          clientIP,
          timestamp: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: otpResult.message,
        expiresAt: otpResult.expiresAt
      })

    } catch (error: any) {
      console.error('OTP generation error:', error)

      // Log error
      await logAuditEvent({
        userId: null,
        schoolId,
        action: 'REJECT',
        resource: 'authentication',
        changes: {
          identifier: identifier.trim(),
          error: error.message,
          errorCode: error.code,
          clientIP,
          timestamp: new Date()
        }
      })

      if (error.code === 'RATE_LIMITED') {
        return NextResponse.json(
          { 
            success: false, 
            error: error.message,
            code: 'RATE_LIMITED',
            retryAfter: error.retryAfter
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to generate OTP. Please try again.' 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('OTP generation API error:', error)
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