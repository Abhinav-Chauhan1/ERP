import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/utils/email-service"
import { getVerificationEmailHtml } from "@/lib/utils/email-templates"
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

    const emailHtml = getVerificationEmailHtml({
      userName: user.firstName,
      verificationUrl
    })

    const emailResult = await sendEmail({
      to: [userEmail.toLowerCase()],
      subject: "Verify Your Email - SikshaMitra",
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
