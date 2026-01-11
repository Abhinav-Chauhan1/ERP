import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { hashPassword, verifyPassword, validatePasswordStrength } from "@/lib/password"
import { z } from "zod"

// Validation schemas
const updateEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
  currentPassword: z.string().min(1, "Current password is required")
})

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters")
})

const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  phone: z.string().optional(),
  avatar: z.string().url("Invalid avatar URL").optional()
})

/**
 * GET /api/user/profile
 * Retrieves the current user's profile information
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        phone: true,
        avatar: true,
        image: true,
        role: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user
    })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/user/profile
 * Updates the current user's profile information
 * Supports: email updates, password changes, profile fields
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body

    // Get current user
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    // Handle different update actions
    switch (action) {
      case "update_email":
        return await handleEmailUpdate(user, body)

      case "update_password":
        return await handlePasswordUpdate(user, body)

      case "update_profile":
        return await handleProfileUpdate(user, body)

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    )
  }
}

/**
 * Handles email update with verification requirement
 */
async function handleEmailUpdate(user: any, body: any) {
  try {
    // Validate input
    const validation = updateEmailSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          errors: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { email, currentPassword } = validation.data

    // Verify current password
    if (!user.password) {
      return NextResponse.json(
        { success: false, error: "Password authentication not available for OAuth users" },
        { status: 400 }
      )
    }

    const isValidPassword = await verifyPassword(currentPassword, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid current password" },
        { status: 401 }
      )
    }

    // Check if email is already in use
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser && existingUser.id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Email already in use" },
        { status: 409 }
      )
    }

    // Generate verification token
    const token = crypto.randomUUID()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create verification token
    await db.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires
      }
    })

    // Update user email (mark as unverified)
    await db.user.update({
      where: { id: user.id },
      data: {
        email,
        emailVerified: null
      }
    })

    // Log email change
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        userId: user.id,
        resource: "USER",
        resourceId: user.id,
        changes: {
          event: "EMAIL_CHANGED",
          oldEmail: user.email,
          newEmail: email
        }
      }
    })

    // Send verification email
    try {
      const { sendEmail, isEmailConfigured } = await import('@/lib/services/email-service');

      if (isEmailConfigured()) {
        const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`;

        await sendEmail({
          to: email,
          subject: 'Verify Your Email Address',
          html: `
            <h1>Email Verification Required</h1>
            <p>Dear ${user.firstName || 'User'},</p>
            <p>You have requested to change your email address. Please click the link below to verify your new email:</p>
            
            <p style="margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Verify Email Address
              </a>
            </p>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${verificationUrl}</p>
            
            <p><strong>This link will expire in 24 hours.</strong></p>
            
            <p>If you did not request this change, please ignore this email or contact support.</p>
            <br>
            <p>Best regards,<br>School Administration</p>
          `
        });
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Email sending failed but the update was successful
    }

    return NextResponse.json({
      success: true,
      message: "Email updated. Please verify your new email address.",
      requiresVerification: true
    })
  } catch (error) {
    console.error("Error updating email:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update email" },
      { status: 500 }
    )
  }
}

/**
 * Handles password update with validation and session invalidation
 */
async function handlePasswordUpdate(user: any, body: any) {
  try {
    // Validate input
    const validation = updatePasswordSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          errors: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = validation.data

    // Check if user has password (not OAuth-only)
    if (!user.password) {
      return NextResponse.json(
        { success: false, error: "Password authentication not available for OAuth users" },
        { status: 400 }
      )
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid current password" },
        { status: 401 }
      )
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Password does not meet strength requirements",
          errors: passwordValidation.errors
        },
        { status: 400 }
      )
    }

    // Check if new password is same as current
    const isSamePassword = await verifyPassword(newPassword, user.password)
    if (isSamePassword) {
      return NextResponse.json(
        { success: false, error: "New password must be different from current password" },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Get current session token to preserve it
    const session = await auth()
    const currentSession = await db.session.findFirst({
      where: { userId: user.id },
      orderBy: { expires: 'desc' }
    })

    // Update password
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword
      }
    })

    // Invalidate all other sessions except current
    if (currentSession) {
      await db.session.deleteMany({
        where: {
          userId: user.id,
          id: { not: currentSession.id }
        }
      })
    }

    // Log password change
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        userId: user.id,
        resource: "USER",
        resourceId: user.id,
        changes: {
          event: "PASSWORD_CHANGED",
          sessionsInvalidated: true
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. Other sessions have been logged out."
    })
  } catch (error) {
    console.error("Error updating password:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update password" },
      { status: 500 }
    )
  }
}

/**
 * Handles general profile field updates
 */
async function handleProfileUpdate(user: any, body: any) {
  try {
    // Validate input
    const validation = updateProfileSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          errors: validation.error.errors
        },
        { status: 400 }
      )
    }

    const updateData: any = {}

    if (validation.data.firstName !== undefined) {
      updateData.firstName = validation.data.firstName
    }

    if (validation.data.lastName !== undefined) {
      updateData.lastName = validation.data.lastName
    }

    if (validation.data.phone !== undefined) {
      updateData.phone = validation.data.phone
    }

    if (validation.data.avatar !== undefined) {
      updateData.avatar = validation.data.avatar
    }

    // Update name field if firstName or lastName changed
    if (updateData.firstName || updateData.lastName) {
      const firstName = updateData.firstName || user.firstName
      const lastName = updateData.lastName || user.lastName
      updateData.name = `${firstName} ${lastName}`
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        phone: true,
        avatar: true,
        image: true,
        role: true
      }
    })

    // Log profile update
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        userId: user.id,
        resource: "USER",
        resourceId: user.id,
        changes: {
          event: "PROFILE_UPDATED",
          updatedFields: Object.keys(updateData)
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    )
  }
}
