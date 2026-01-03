import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/utils/email-service"
import crypto from "crypto"

/**
 * Resend Email Verification API Route
 * 
 * Handles resending verification emails to users
 * Requirements: 12.8
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, token } = body

    // Need either email or token to identify user
    if (!email && !token) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Email address or token is required" 
        },
        { status: 400 }
      )
    }

    let userEmail = email

    // If token provided, get email from existing token
    if (token && !email) {
      const existingToken = await db.verificationToken.findUnique({
        where: { token }
      })

      if (existingToken) {
        userEmail = existingToken.identifier
      }
    }

    if (!userEmail) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Unable to identify user" 
        },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(userEmail)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid email format" 
        },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: userEmail.toLowerCase() }
    })

    if (!user) {
      // Don't reveal if user exists (security)
      return NextResponse.json(
        { 
          success: true, 
          message: "If an account exists with this email, a verification link has been sent."
        },
        { status: 200 }
      )
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Email is already verified. You can log in now.",
          alreadyVerified: true
        },
        { status: 400 }
      )
    }

    // Invalidate previous tokens for this email (Requirement 12.8)
    await db.verificationToken.deleteMany({
      where: { identifier: userEmail.toLowerCase() }
    })

    // Generate new verification token (Requirement 12.8)
    const verificationToken = crypto.randomBytes(32).toString("hex")
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store new verification token
    await db.verificationToken.create({
      data: {
        identifier: userEmail.toLowerCase(),
        token: verificationToken,
        expires: verificationExpires
      }
    })

    // Send new verification email (Requirement 12.8)
    const verificationUrl = `${process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}`
    
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
            <h1>Verify Your Email</h1>
          </div>
          <div class="content">
            <p>Hello ${user.firstName},</p>
            <p>You requested a new verification link for your School ERP account. Click the button below to verify your email address:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #3b82f6;">${verificationUrl}</p>
            
            <p><strong>This link will expire in 24 hours.</strong></p>
            
            <p>If you didn't request this verification email, please ignore it.</p>
            
            <p>Best regards,<br>School ERP Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email from School ERP System.</p>
          </div>
        </body>
      </html>
    `

    const emailResult = await sendEmail({
      to: [userEmail.toLowerCase()],
      subject: "Verify Your Email - School ERP",
      html: emailHtml
    })

    if (!emailResult.success) {
      console.error("Failed to send verification email:", emailResult.error)
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to send verification email. Please try again later." 
        },
        { status: 500 }
      )
    }

    // Log resend event
    await db.auditLog.create({
      data: {
        action: "CREATE",
        resource: "VERIFICATION_EMAIL",
        resourceId: user.id,
        userId: user.id,
        changes: {
          email: user.email,
          resentAt: new Date()
        }
      }
    })

    return NextResponse.json(
      { 
        success: true, 
        message: "Verification email sent successfully. Please check your inbox.",
        email: userEmail.toLowerCase()
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "An error occurred while sending verification email. Please try again." 
      },
      { status: 500 }
    )
  }
}
