import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword, validatePasswordStrength } from "@/lib/password"
import { sendEmail } from "@/lib/utils/email-service"
import { getVerificationEmailHtml } from "@/lib/utils/email-templates"
import { UserRole } from "@prisma/client"
import crypto from "crypto"

/**
 * User Registration API Route
 * 
 * Handles new user registration with email/password
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.8
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName } = body

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        {
          success: false,
          error: "All fields are required"
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

    // Hash password with bcrypt (Requirement 3.4)
    const hashedPassword = await hashPassword(password)

    // Generate email verification token (Requirement 3.5)
    const verificationToken = crypto.randomBytes(32).toString("hex")
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create user record with default STUDENT role (Requirement 3.8)
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        role: UserRole.STUDENT,
        active: true,
        emailVerified: null // Not verified yet
      }
    })

    // Store verification token
    await db.verificationToken.create({
      data: {
        identifier: email.toLowerCase(),
        token: verificationToken,
        expires: verificationExpires
      }
    })

    // Send verification email (Requirement 3.5)
    // Updated to use centralized template
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

    // Log registration event
    await db.auditLog.create({
      data: {
        action: "CREATE",
        resource: "USER",
        resourceId: user.id,
        userId: user.id,
        changes: {
          email: user.email,
          role: user.role
        }
      }
    })

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful. Please check your email to verify your account.",
        userId: user.id
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred during registration. Please try again."
      },
      { status: 500 }
    )
  }
}
