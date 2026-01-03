import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

/**
 * Validate Password Reset Token API Route
 * 
 * Validates that a password reset token exists and hasn't expired
 * Requirements: 11.3, 11.8
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    // Validate token field
    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Token is required" 
        },
        { status: 400 }
      )
    }

    // Find token in database
    const resetToken = await db.verificationToken.findUnique({
      where: { token }
    })

    // Check if token exists
    if (!resetToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid reset token" 
        },
        { status: 404 }
      )
    }

    // Check if token is for password reset (identifier starts with "password-reset:")
    if (!resetToken.identifier.startsWith("password-reset:")) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid reset token" 
        },
        { status: 400 }
      )
    }

    // Check if token has expired (Requirement 11.8)
    if (resetToken.expires < new Date()) {
      // Delete expired token
      await db.verificationToken.delete({
        where: { token }
      })

      return NextResponse.json(
        { 
          success: false, 
          error: "Reset token has expired. Please request a new password reset link." 
        },
        { status: 410 }
      )
    }

    // Token is valid
    return NextResponse.json(
      { 
        success: true, 
        message: "Token is valid" 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("Token validation error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "An error occurred while validating the token" 
      },
      { status: 500 }
    )
  }
}
