import { NextRequest, NextResponse } from "next/server"
import { authenticationService } from "@/lib/services/authentication-service"
import { logAuditEvent } from "@/lib/services/audit-service"

/**
 * OTP Verification API Endpoint
 * 
 * Verifies OTP code for user authentication.
 * Requirements: 4.4, 4.5, 4.6
 */

export async function POST(request: NextRequest) {
  try {
    const { identifier, otpCode, schoolId } = await request.json()

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

    if (!otpCode || typeof otpCode !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'OTP code is required' 
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

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otpCode.trim())) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'OTP must be 6 digits' 
        },
        { status: 400 }
      )
    }

    // Get client IP for audit logging
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'

    try {
      // Verify OTP
      const isValid = await authenticationService.verifyOTP(identifier.trim(), otpCode.trim())

      if (!isValid) {
        // Log failed OTP verification
        await logAuditEvent({
          schoolId,
          action: 'OTP_VERIFICATION_FAILED',
          resource: 'authentication',
          changes: {
            identifier: identifier.trim(),
            reason: 'INVALID_OTP',
            clientIP,
            timestamp: new Date()
          }
        })

        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid or expired OTP code',
            code: 'INVALID_OTP'
          },
          { status: 400 }
        )
      }

      // Log successful OTP verification
      await logAuditEvent({
        schoolId,
        action: 'OTP_VERIFICATION_SUCCESS',
        resource: 'authentication',
        changes: {
          identifier: identifier.trim(),
          clientIP,
          timestamp: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully'
      })

    } catch (error: any) {
      console.error('OTP verification error:', error)

      // Log error
      await logAuditEvent({
        schoolId,
        action: 'OTP_VERIFICATION_ERROR',
        resource: 'authentication',
        changes: {
          identifier: identifier.trim(),
          error: error.message,
          errorCode: error.code,
          clientIP,
          timestamp: new Date()
        }
      })

      if (error.code === 'OTP_EXPIRED') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'OTP has expired. Please request a new one.',
            code: 'OTP_EXPIRED'
          },
          { status: 400 }
        )
      }

      if (error.code === 'OTP_INVALID') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid OTP code. Please check and try again.',
            code: 'OTP_INVALID'
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to verify OTP. Please try again.' 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('OTP verification API error:', error)
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