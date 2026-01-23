import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/utils/email-service"
import { getPasswordResetEmailHtml } from "@/lib/utils/email-templates"
import crypto from "crypto"

/**
 * Password Reset Request API Route
 * 
 * Handles password reset requests by generating a secure token and sending reset email
 * Requirements: 11.1, 11.2, 11.7
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate email field
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "Email is required"
        },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format"
        },
        { status: 400 }
      )
    }

    // Check if user exists (Requirement 11.1)
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    // Always return success to prevent user enumeration
    // Even if user doesn't exist, we return success message
    if (!user) {
      // Log the attempt but return success
      console.log(`Password reset requested for non-existent email: ${email}`)

      return NextResponse.json(
        {
          success: true,
          message: "If an account with that email exists, a password reset link has been sent."
        },
        { status: 200 }
      )
    }

    // Check if account is active
    if (!user.active) {
      // Return generic message to prevent enumeration
      return NextResponse.json(
        {
          success: true,
          message: "If an account with that email exists, a password reset link has been sent."
        },
        { status: 200 }
      )
    }

    // Generate secure reset token (Requirement 11.2)
    const resetToken = crypto.randomBytes(32).toString("hex")

    // Set token expiration to 1 hour (Requirement 11.7)
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Delete any existing reset tokens for this user
    await db.verificationToken.deleteMany({
      where: {
        identifier: `password-reset:${email.toLowerCase()}`
      }
    })

    // Store reset token in database
    await db.verificationToken.create({
      data: {
        identifier: `password-reset:${email.toLowerCase()}`,
        token: resetToken,
        expires: resetExpires
      }
    })

    // Send reset email with token link (Requirement 11.7)
    const resetUrl = `${process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`

    const emailHtml = getPasswordResetEmailHtml({
      userName: user.firstName,
      resetUrl
    })

    const emailResult = await sendEmail({
      to: email.toLowerCase(),
      subject: "Password Reset Request - SikshaMitra",
      html: emailHtml
    })

    if (!emailResult.success) {
      console.error("Failed to send password reset email:", emailResult.error)
      // Return success anyway to prevent enumeration
    }

    // Log password reset request (Requirement 16.6)
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        resource: "PASSWORD_RESET",
        resourceId: user.id,
        userId: user.id,
        changes: {
          email: user.email,
          timestamp: new Date()
        }
      }
    })

    return NextResponse.json(
      {
        success: true,
        message: "If an account with that email exists, a password reset link has been sent."
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("Password reset request error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while processing your request. Please try again."
      },
      { status: 500 }
    )
  }
}
