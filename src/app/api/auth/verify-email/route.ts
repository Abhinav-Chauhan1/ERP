import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

/**
 * Email Verification API Route
 * 
 * Handles email verification using tokens sent to users
 * Requirements: 12.3, 12.4, 12.5, 12.6
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    // Validate token is provided
    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Verification token is required" 
        },
        { status: 400 }
      )
    }

    // Find verification token in database (Requirement 12.3)
    const verificationToken = await db.verificationToken.findUnique({
      where: { token }
    })

    if (!verificationToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid verification token" 
        },
        { status: 400 }
      )
    }

    // Check token expiration - 24 hours (Requirement 12.4)
    const now = new Date()
    if (verificationToken.expires < now) {
      // Delete expired token
      await db.verificationToken.delete({
        where: { token }
      })

      return NextResponse.json(
        { 
          success: false, 
          error: "Verification token has expired",
          expired: true
        },
        { status: 400 }
      )
    }

    // Find user by email identifier
    const user = await db.user.findUnique({
      where: { email: verificationToken.identifier }
    })

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: "User not found" 
        },
        { status: 404 }
      )
    }

    // Check if email is already verified
    if (user.emailVerified) {
      // Delete token since email is already verified
      await db.verificationToken.delete({
        where: { token }
      })

      return NextResponse.json(
        { 
          success: true, 
          message: "Email is already verified",
          alreadyVerified: true
        },
        { status: 200 }
      )
    }

    // Mark email as verified (Requirement 12.5)
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date()
      }
    })

    // Delete used token (Requirement 12.6)
    await db.verificationToken.delete({
      where: { token }
    })

    // Log verification event
    await db.auditLog.create({
      data: {
        action: "VERIFY",
        resource: "EMAIL",
        resourceId: user.id,
        userId: user.id,
        changes: {
          email: user.email,
          verifiedAt: new Date()
        }
      }
    })

    return NextResponse.json(
      { 
        success: true, 
        message: "Email verified successfully. You can now log in.",
        email: user.email
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "An error occurred during email verification. Please try again." 
      },
      { status: 500 }
    )
  }
}
