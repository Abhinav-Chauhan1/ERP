import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword, validatePasswordStrength } from "@/lib/password"
import { sendEmail } from "@/lib/utils/email-service"
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
            <h1>Welcome to School ERP!</h1>
          </div>
          <div class="content">
            <p>Hello ${firstName},</p>
            <p>Thank you for registering with School ERP. To complete your registration, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #3b82f6;">${verificationUrl}</p>
            
            <p><strong>This link will expire in 24 hours.</strong></p>
            
            <p>If you didn't create an account with School ERP, please ignore this email.</p>
            
            <p>Best regards,<br>School ERP Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email from School ERP System.</p>
          </div>
        </body>
      </html>
    `

    const emailResult = await sendEmail({
      to: [email.toLowerCase()],
      subject: "Verify Your Email - School ERP",
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
