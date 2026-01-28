import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logAuditEvent } from "@/lib/services/audit-service"

/**
 * Validate Password Reset Token API Route
 * 
 * Validates that a password reset token exists and hasn't expired
 * Updated to integrate with unified authentication system
 * Requirements: 11.3, 11.8, 15.1, 15.2
 */
export async function POST(request: NextRequest) {
  const ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
  const userAgent = request.headers.get('user-agent') || 'Unknown'

  try {
    const body = await request.json()
    const { token } = body

    // Validate token field
    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Token is required" 
        },
        { status: 400 }
      )
    }

    // Find token in database
    const resetToken = await db.verificationToken.findUnique({
      where: { token }
    })

    // Check if token exists
    if (!resetToken) {
      await logAuditEvent({
        userId: null,
        action: 'FAILED',
        resource: 'password_reset_validation',
        changes: {
          reason: 'TOKEN_NOT_FOUND',
          token: token.substring(0, 8) + '...',
          ipAddress,
          userAgent
        }
      })

      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid reset token" 
        },
        { status: 404 }
      )
    }

    // Check if token is for password reset (identifier starts with "password-reset:")
    if (!resetToken.identifier.startsWith("password-reset:")) {
      await logAuditEvent({
        userId: null,
        action: 'FAILED',
        resource: 'password_reset_validation',
        changes: {
          reason: 'INVALID_TOKEN_TYPE',
          identifier: resetToken.identifier,
          ipAddress,
          userAgent
        }
      })

      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid reset token" 
        },
        { status: 400 }
      )
    }

    // Check if token has expired (Requirement 11.8)
    if (resetToken.expires < new Date()) {
      // Delete expired token
      await db.verificationToken.delete({
        where: { token }
      })

      await logAuditEvent({
        userId: null,
        action: 'FAILED',
        resource: 'password_reset_validation',
        changes: {
          reason: 'TOKEN_EXPIRED',
          expiredAt: resetToken.expires,
          identifier: resetToken.identifier,
          ipAddress,
          userAgent
        }
      })

      return NextResponse.json(
        { 
          success: false, 
          error: "Reset token has expired. Please request a new password reset link." 
        },
        { status: 410 }
      )
    }

    // Extract email from identifier for additional validation
    const email = resetToken.identifier.replace("password-reset:", "")
    
    // Verify user still exists and is active
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, isActive: true, email: true }
    })

    if (!user || !user.isActive) {
      // Delete token for non-existent or inactive user
      await db.verificationToken.delete({
        where: { token }
      })

      await logAuditEvent({
        userId: user?.id || null,
        action: 'FAILED',
        resource: 'password_reset_validation',
        changes: {
          reason: user ? 'USER_INACTIVE' : 'USER_NOT_FOUND',
          email,
          ipAddress,
          userAgent
        }
      })

      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid reset token" 
        },
        { status: 400 }
      )
    }

    // Log successful token validation
    await logAuditEvent({
      userId: user.id,
      action: 'SUCCESS',
      resource: 'password_reset_validation',
      changes: {
        email: user.email,
        tokenExpiresAt: resetToken.expires,
        ipAddress,
        userAgent
      }
    })

    // Token is valid
    return NextResponse.json(
      { 
        success: true, 
        message: "Token is valid",
        expiresAt: resetToken.expires,
        email: user.email
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("Token validation error:", error)
    
    // Log error using unified audit system
    await logAuditEvent({
      userId: null,
      action: 'ERROR',
      resource: 'password_reset_validation',
      changes: {
        error: error instanceof Error ? error.message : 'Unknown error',
        ipAddress,
        userAgent
      }
    })

    return NextResponse.json(
      { 
        success: false, 
        error: "An error occurred while validating the token" 
      },
      { status: 500 }
    )
  }
}
