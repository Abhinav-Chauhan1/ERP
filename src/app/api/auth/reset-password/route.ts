import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword, validatePasswordStrength } from "@/lib/password"
import { jwtService } from "@/lib/services/jwt-service"
import { logAuditEvent } from "@/lib/services/audit-service"

/**
 * Password Reset API Route
 * 
 * Handles password reset with token validation and session invalidation
 * Updated to integrate with unified authentication system
 * Requirements: 11.4, 11.5, 11.6, 13.4, 11.1, 11.2, 11.3
 */
export async function POST(request: NextRequest) {
  const ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
  const userAgent = request.headers.get('user-agent') || 'Unknown'

  try {
    const body = await request.json()
    const { token, password } = body

    // Validate required fields
    if (!token || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Token and password are required" 
        },
        { status: 400 }
      )
    }

    // Validate password strength (Requirement 11.4)
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Password does not meet requirements",
          details: passwordValidation.errors
        },
        { status: 400 }
      )
    }

    // Find and validate reset token (Requirement 11.4)
    const resetToken = await db.verificationToken.findUnique({
      where: { token }
    })

    // Check if token exists
    if (!resetToken) {
      await logAuditEvent({
        userId: null,
        action: 'REJECT',
        resource: 'password_reset',
        changes: {
          reason: 'INVALID_TOKEN',
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

    // Check if token is for password reset
    if (!resetToken.identifier.startsWith("password-reset:")) {
      await logAuditEvent({
        userId: null,
        action: 'LOGIN',
        resource: 'password_reset',
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

    // Check if token has expired
    if (resetToken.expires < new Date()) {
      // Delete expired token
      await db.verificationToken.delete({
        where: { token }
      })

      await logAuditEvent({
        userId: null,
        action: 'LOGIN',
        resource: 'password_reset',
        changes: {
          reason: 'TOKEN_EXPIRED',
          expiredAt: resetToken.expires,
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

    // Extract email from identifier (format: "password-reset:email@example.com")
    const email = resetToken.identifier.replace("password-reset:", "")

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
      include: {
        userSchools: {
          where: { isActive: true },
          include: { school: true }
        }
      }
    })

    if (!user) {
      // Delete invalid token
      await db.verificationToken.delete({
        where: { token }
      })

      await logAuditEvent({
        userId: null,
        action: 'LOGIN',
        resource: 'password_reset',
        changes: {
          reason: 'USER_NOT_FOUND',
          email,
          ipAddress,
          userAgent
        }
      })

      return NextResponse.json(
        { 
          success: false, 
          error: "User not found" 
        },
        { status: 404 }
      )
    }

    // Hash new password (Requirement 11.5)
    const hashedPassword = await hashPassword(password)

    // Update user password (Requirement 11.5)
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword
      }
    })

    // Invalidate reset token (Requirement 11.6)
    await db.verificationToken.delete({
      where: { token }
    })

    // Invalidate all existing sessions for security (Requirement 13.4)
    // This ensures that if the account was compromised, all other sessions are logged out
    await db.authSession.deleteMany({
      where: {
        userId: user.id
      }
    })

    // Also revoke any JWT tokens by logging them as revoked
    // (The JWT service will check this during token validation)
    await logAuditEvent({
      userId: user.id,
      action: 'DELETE',
      resource: 'jwt_token',
      changes: {
        reason: 'PASSWORD_RESET',
        revokedAt: new Date(),
        allTokensRevoked: true
      }
    })

    // Log password change event using unified audit system
    await logAuditEvent({
      userId: user.id,
      action: 'UPDATE',
      resource: 'password_reset',
      changes: {
        method: 'password_reset',
        email: user.email,
        sessionsInvalidated: true,
        tokensRevoked: true,
        ipAddress,
        userAgent
      }
    })

    return NextResponse.json(
      { 
        success: true, 
        message: "Password has been reset successfully. You can now log in with your new password.",
        sessionInvalidated: true
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("Password reset error:", error)
    
    // Log error using unified audit system
    await logAuditEvent({
      userId: null,
      action: 'CREATE',
      resource: 'password_reset',
      changes: {
        error: error instanceof Error ? error.message : 'Unknown error',
        ipAddress,
        userAgent
      }
    })

    return NextResponse.json(
      { 
        success: false, 
        error: "An error occurred while resetting your password. Please try again." 
      },
      { status: 500 }
    )
  }
}
