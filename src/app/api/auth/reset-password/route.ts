import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword, validatePasswordStrength } from "@/lib/password"

/**
 * Password Reset API Route
 * 
 * Handles password reset with token validation and session invalidation
 * Requirements: 11.4, 11.5, 11.6, 13.4
 */
export async function POST(request: NextRequest) {
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
      where: { email }
    })

    if (!user) {
      // Delete invalid token
      await db.verificationToken.delete({
        where: { token }
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
        password: hashedPassword
      }
    })

    // Invalidate reset token (Requirement 11.6)
    await db.verificationToken.delete({
      where: { token }
    })

    // Invalidate all existing sessions except current (Requirement 13.4)
    // This ensures that if the account was compromised, all other sessions are logged out
    await db.session.deleteMany({
      where: {
        userId: user.id
      }
    })

    // Log password change event
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        resource: "PASSWORD",
        resourceId: user.id,
        userId: user.id,
        changes: {
          method: "password_reset",
          timestamp: new Date()
        }
      }
    })

    return NextResponse.json(
      { 
        success: true, 
        message: "Password has been reset successfully. You can now log in with your new password." 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "An error occurred while resetting your password. Please try again." 
      },
      { status: 500 }
    )
  }
}
