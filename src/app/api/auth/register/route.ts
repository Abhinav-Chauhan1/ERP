import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword, validatePasswordStrength } from "@/lib/password"
import { sendEmail } from "@/lib/utils/email-service"
import { getVerificationEmailHtml } from "@/lib/utils/email-templates"
import { UserRole } from "@prisma/client"
import { authenticationService } from "@/lib/services/authentication-service"
import { schoolContextService } from "@/lib/services/school-context-service"
import { logAuditEvent } from "@/lib/services/audit-service"
import crypto from "crypto"

/**
 * User Registration API Route
 * 
 * Handles new user registration with email/password
 * Updated to integrate with unified authentication system
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.8, 1.1, 2.1
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, schoolCode, mobile, role } = body

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        {
          success: false,
          error: "Email, password, first name, and last name are required"
        },
        { status: 400 }
      )
    }

    // Validate school code if provided (for school-based users)
    let schoolId: string | undefined
    if (schoolCode) {
      const school = await schoolContextService.validateSchoolCode(schoolCode)
      if (!school) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid or inactive school code"
          },
          { status: 400 }
        )
      }
      schoolId = school.id
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

    // Validate mobile format if provided
    if (mobile) {
      const mobileRegex = /^[+]?[\d\s\-()]{10,15}$/
      if (!mobileRegex.test(mobile)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid mobile number format"
          },
          { status: 400 }
        )
      }
    }

    // Validate password strength (Requirement 3.2)
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

    // Check for duplicate email (Requirement 3.3)
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this email already exists"
        },
        { status: 409 }
      )
    }

    // Check for duplicate mobile if provided
    if (mobile) {
      const existingMobileUser = await db.user.findUnique({
        where: { mobile }
      })

      if (existingMobileUser) {
        return NextResponse.json(
          {
            success: false,
            error: "An account with this mobile number already exists"
          },
          { status: 409 }
        )
      }
    }

    // Hash password with bcrypt (Requirement 3.4)
    const hashedPassword = await hashPassword(password)

    // Generate email verification token (Requirement 3.5)
    const verificationToken = crypto.randomBytes(32).toString("hex")
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Determine user role (default to STUDENT if not specified)
    const userRole = role && Object.values(UserRole).includes(role) ? role : UserRole.STUDENT

    // Create user record with unified authentication support (Requirement 3.8)
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        mobile: mobile || null,
        passwordHash: hashedPassword,
        name: `${firstName} ${lastName}`,
        isActive: true,
        emailVerified: null // Not verified yet
      }
    })

    // Create user-school relationship if school is provided
    if (schoolId) {
      await db.userSchool.create({
        data: {
          userId: user.id,
          schoolId,
          role: userRole,
          isActive: true
        }
      })
    }

    // Store verification token
    await db.verificationToken.create({
      data: {
        identifier: email.toLowerCase(),
        token: verificationToken,
        expires: verificationExpires
      }
    })

    // Send verification email (Requirement 3.5)
    const verificationUrl = `${process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}`

    const emailHtml = getVerificationEmailHtml({
      userName: firstName,
      verificationUrl
    })

    const emailResult = await sendEmail({
      to: [email.toLowerCase()],
      subject: "Verify Your Email - SikshaMitra",
      html: emailHtml
    })

    if (!emailResult.success) {
      console.error("Failed to send verification email:", emailResult.error)
      // Don't fail registration if email fails, but log it
    }

    // Log registration event using unified audit system
    await logAuditEvent({
      userId: user.id,
      schoolId,
      action: 'CREATE',
      resource: 'user_registration',
      changes: {
        email: user.email,
        mobile: user.mobile,
        role: userRole,
        schoolCode,
        registrationMethod: 'email_password'
      }
    })

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful. Please check your email to verify your account.",
        userId: user.id,
        requiresSchoolSelection: !schoolId,
        emailVerificationRequired: true
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Registration error:", error)
    
    // Log error using unified audit system
    await logAuditEvent({
      userId: null,
      action: 'ERROR',
      resource: 'user_registration',
      changes: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }
    })

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred during registration. Please try again."
      },
      { status: 500 }
    )
  }
}
