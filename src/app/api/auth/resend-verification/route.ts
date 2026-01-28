import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/utils/email-service"
import { getVerificationEmailHtml } from "@/lib/utils/email-templates"
import { schoolContextService } from "@/lib/services/school-context-service"
import { logAuditEvent } from "@/lib/services/audit-service"
import { rateLimitingService } from "@/lib/services/rate-limiting-service"
import crypto from "crypto"

/**
 * Resend Email Verification API Route
 * 
 * Handles resending verification emails to users
 * Updated to integrate with unified authentication system and rate limiting
 * Requirements: 12.8, 14.1, 14.2, 15.1, 15.2
 */
export async function POST(request: NextRequest) {
  const ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
  const userAgent = request.headers.get('user-agent') || 'Unknown'

  try {
    const body = await request.json()
    const { email, token, schoolCode } = body

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

    // Check rate limiting for verification email requests
    const rateLimitResult = await rateLimitingService.checkEmailVerificationRateLimit(userEmail)
    if (!rateLimitResult.allowed) {
      await logAuditEvent({
        userId: null,
        action: 'RATE_LIMITED',
        resource: 'email_verification_resend',
        changes: {
          email: userEmail,
          reason: 'EMAIL_VERIFICATION_RATE_LIMITED',
          nextAttemptAt: rateLimitResult.nextAttemptAt,
          ipAddress,
          userAgent
        }
      })

      const retryAfter = Math.ceil((rateLimitResult.nextAttemptAt.getTime() - Date.now()) / 1000)
      return NextResponse.json(
        {
          success: false,
          error: `Too many verification email requests. Please try again in ${retryAfter} seconds.`
        },
        { status: 429 }
      )
    }

    // Validate school context if provided
    let schoolId: string | undefined
    if (schoolCode) {
      const school = await schoolContextService.validateSchoolCode(schoolCode)
      if (!school) {
        await logAuditEvent({
          userId: null,
          action: 'FAILED',
          resource: 'email_verification_resend',
          changes: {
            email: userEmail,
            schoolCode,
            reason: 'INVALID_SCHOOL_CODE',
            ipAddress,
            userAgent
          }
        })

        return NextResponse.json(
          {
            success: true,
            message: "If an account exists with this email, a verification link has been sent."
          },
          { status: 200 }
        )
      }
      schoolId = school.id
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: userEmail.toLowerCase() },
      include: {
        userSchools: {
          where: {
            isActive: true,
            ...(schoolId && { schoolId })
          },
          include: { school: true }
        }
      }
    })

    if (!user) {
      // Don't reveal if user exists (security)
      await logAuditEvent({
        userId: null,
        schoolId,
        action: 'FAILED',
        resource: 'email_verification_resend',
        changes: {
          email: userEmail,
          schoolCode,
          reason: 'USER_NOT_FOUND',
          ipAddress,
          userAgent
        }
      })

      return NextResponse.json(
        {
          success: true,
          message: "If an account exists with this email, a verification link has been sent."
        },
        { status: 200 }
      )
    }

    // Check if user is active
    if (!user.isActive) {
      await logAuditEvent({
        userId: user.id,
        schoolId,
        action: 'FAILED',
        resource: 'email_verification_resend',
        changes: {
          email: userEmail,
          reason: 'USER_INACTIVE',
          ipAddress,
          userAgent
        }
      })

      return NextResponse.json(
        {
          success: true,
          message: "If an account exists with this email, a verification link has been sent."
        },
        { status: 200 }
      )
    }

    // If school context is provided, validate user has access to that school
    if (schoolId && user.userSchools.length === 0) {
      await logAuditEvent({
        userId: user.id,
        schoolId,
        action: 'FAILED',
        resource: 'email_verification_resend',
        changes: {
          email: userEmail,
          schoolCode,
          reason: 'USER_NOT_IN_SCHOOL',
          ipAddress,
          userAgent
        }
      })

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
      await logAuditEvent({
        userId: user.id,
        schoolId,
        action: 'INFO',
        resource: 'email_verification_resend',
        changes: {
          email: userEmail,
          reason: 'ALREADY_VERIFIED',
          verifiedAt: user.emailVerified,
          ipAddress,
          userAgent
        }
      })

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
      userName: user.name,
      verificationUrl
    })

    const emailResult = await sendEmail({
      to: [userEmail.toLowerCase()],
      subject: "Verify Your Email - SikshaMitra",
      html: emailHtml
    })

    if (!emailResult.success) {
      console.error("Failed to send verification email:", emailResult.error)
      
      await logAuditEvent({
        userId: user.id,
        schoolId,
        action: 'ERROR',
        resource: 'email_verification_resend',
        changes: {
          email: userEmail,
          error: 'EMAIL_SEND_FAILED',
          emailError: emailResult.error,
          ipAddress,
          userAgent
        }
      })

      return NextResponse.json(
        {
          success: false,
          error: "Failed to send verification email. Please try again later."
        },
        { status: 500 }
      )
    }

    // Log resend event using unified audit system
    await logAuditEvent({
      userId: user.id,
      schoolId,
      action: 'CREATE',
      resource: 'email_verification_resend',
      changes: {
        email: user.email,
        schoolCode,
        tokenExpires: verificationExpires,
        previousTokensInvalidated: true,
        ipAddress,
        userAgent
      }
    })

    return NextResponse.json(
      {
        success: true,
        message: "Verification email sent successfully. Please check your inbox.",
        email: userEmail.toLowerCase(),
        expiresAt: verificationExpires
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("Resend verification error:", error)
    
    // Log error using unified audit system
    await logAuditEvent({
      userId: null,
      action: 'ERROR',
      resource: 'email_verification_resend',
      changes: {
        error: error instanceof Error ? error.message : 'Unknown error',
        ipAddress,
        userAgent
      }
    })

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while sending verification email. Please try again."
      },
      { status: 500 }
    )
  }
}
