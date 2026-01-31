import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/utils/email-service"
import { getPasswordResetEmailHtml } from "@/lib/utils/email-templates"
import { schoolContextService } from "@/lib/services/school-context-service"
import { logAuditEvent } from "@/lib/services/audit-service"
import { rateLimitingService } from "@/lib/services/rate-limiting-service"
import crypto from "crypto"

/**
 * Password Reset Request API Route
 * 
 * Handles password reset requests by generating a secure token and sending reset email
 * Updated to integrate with unified authentication system and rate limiting
 * Requirements: 11.1, 11.2, 11.7, 14.1, 14.2, 14.3
 */
export async function POST(request: NextRequest) {
  const ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
  const userAgent = request.headers.get('user-agent') || 'Unknown'

  try {
    const body = await request.json()
    const { email, schoolCode } = body

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

    // Check rate limiting for password reset requests
    const rateLimitResult = await rateLimitingService.checkPasswordResetRateLimit(email)
    if (!rateLimitResult.allowed) {
      await logAuditEvent({
        userId: null,
        action: 'REJECT',
        resource: 'password_reset',
        changes: {
          email,
          reason: 'PASSWORD_RESET_RATE_LIMITED',
          nextAttemptAt: rateLimitResult.nextAttemptAt,
          ipAddress,
          userAgent
        }
      })

      const retryAfter = Math.ceil((rateLimitResult.nextAttemptAt.getTime() - Date.now()) / 1000)
      return NextResponse.json(
        {
          success: false,
          error: `Too many password reset requests. Please try again in ${retryAfter} seconds.`
        },
        { status: 429 }
      )
    }

    // Validate school context if provided
    let schoolId: string | undefined
    if (schoolCode) {
      const school = await schoolContextService.validateSchoolCode(schoolCode)
      if (!school) {
        // Log but don't reveal school doesn't exist
        await logAuditEvent({
          userId: null,
          action: 'REJECT',
          resource: 'password_reset',
          changes: {
            email,
            schoolCode,
            reason: 'INVALID_SCHOOL_CODE',
            ipAddress,
            userAgent
          }
        })

        return NextResponse.json(
          {
            success: true,
            message: "If an account with that email exists, a password reset link has been sent."
          },
          { status: 200 }
        )
      }
      schoolId = school.id
    }

    // Check if user exists (Requirement 11.1)
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        userSchools: {
          where: {
            isActive: true,
            ...(schoolId && { schoolId })
          },
          include: {
            school: true
          }
        }
      }
    })

    // Always return success to prevent user enumeration
    // Even if user doesn't exist, we return success message
    if (!user) {
      // Log the attempt but return success
      await logAuditEvent({
        userId: null,
        ...(schoolId && { schoolId }),
        action: 'REJECT',
        resource: 'password_reset',
        changes: {
          email,
          schoolCode,
          reason: 'USER_NOT_FOUND',
          ipAddress,
          userAgent
        }
      })

      return NextResponse.json(
        {
          success: true,
          message: "If an account with that email exists, a password reset link has been sent."
        },
        { status: 200 }
      )
    }

    // Check if account is active
    if (!user.isActive) {
      await logAuditEvent({
        userId: user.id,
        ...(schoolId && { schoolId }),
        action: 'REJECT',
        resource: 'password_reset',
        changes: {
          email,
          reason: 'USER_INACTIVE',
          ipAddress,
          userAgent
        }
      })

      // Return generic message to prevent enumeration
      return NextResponse.json(
        {
          success: true,
          message: "If an account with that email exists, a password reset link has been sent."
        },
        { status: 200 }
      )
    }

    // If school context is provided, validate user has access to that school
    if (schoolId && user.userSchools.length === 0) {
      await logAuditEvent({
        userId: user.id,
        ...(schoolId && { schoolId }),
        action: 'REJECT',
        resource: 'password_reset',
        changes: {
          email,
          schoolCode,
          reason: 'USER_NOT_IN_SCHOOL',
          ipAddress,
          userAgent
        }
      })

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
      userName: user.name,
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

    // Log password reset request using unified audit system
    await logAuditEvent({
      userId: user.id,
      ...(schoolId && { schoolId }),
      action: 'CREATE',
      resource: 'password_reset',
      changes: {
        email: user.email,
        schoolCode,
        tokenExpires: resetExpires,
        ipAddress,
        userAgent
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
    
    // Log error using unified audit system
    await logAuditEvent({
      userId: null,
      action: 'REJECT',
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
        error: "An error occurred while processing your request. Please try again."
      },
      { status: 500 }
    )
  }
}
