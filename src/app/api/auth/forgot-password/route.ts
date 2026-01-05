import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/services/email-service"
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

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #3b82f6;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 20px;
              border: 1px solid #e5e7eb;
              border-top: none;
              border-radius: 0 0 5px 5px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #3b82f6;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .warning {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 12px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello ${user.firstName},</p>
            <p>We received a request to reset your password for your SikshaMitra account. Click the button below to reset your password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #3b82f6;">${resetUrl}</p>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
            </div>
            
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            
            <p>For security reasons, we recommend:</p>
            <ul>
              <li>Never share your password with anyone</li>
              <li>Use a strong, unique password</li>
              <li>Enable two-factor authentication</li>
            </ul>
            
            <p>Best regards,<br>SikshaMitra Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email from SikshaMitra.</p>
            <p>If you have any questions, please contact your system administrator.</p>
          </div>
        </body>
      </html>
    `

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
