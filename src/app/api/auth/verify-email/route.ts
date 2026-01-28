import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logAuditEvent } from "@/lib/services/audit-service"

/**
 * Email Verification API Route
 * 
 * Handles email verification using tokens sent to users
 * Updated to integrate with unified authentication system
 * Requirements: 12.3, 12.4, 12.5, 12.6, 15.1, 15.2
 */
export async function POST(request: NextRequest) {
  const ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
  const userAgent = request.headers.get('user-agent') || 'Unknown'

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
      await logAuditEvent({
        userId: null,
        action: 'FAILED',
        resource: 'email_verification',
        changes: {
          reason: 'INVALID_TOKEN',
          token: token.substring(0, 8) + '...',
          ipAddress,
          userAgent
        }
      })

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

      await logAuditEvent({
        userId: null,
        action: 'FAILED',
        resource: 'email_verification',
        changes: {
          reason: 'TOKEN_EXPIRED',
          expiredAt: verificationToken.expires,
          identifier: verificationToken.identifier,
          ipAddress,
          userAgent
        }
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
      where: { email: verificationToken.identifier },
      include: {
        userSchools: {
          where: { isActive: true },
          include: { school: true }
        }
      }
    })

    if (!user) {
      await logAuditEvent({
        userId: null,
        action: 'FAILED',
        resource: 'email_verification',
        changes: {
          reason: 'USER_NOT_FOUND',
          identifier: verificationToken.identifier,
          ipAddress,
          userAgent
        }
      })

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

      await logAuditEvent({
        userId: user.id,
        action: 'INFO',
        resource: 'email_verification',
        changes: {
          reason: 'ALREADY_VERIFIED',
          email: user.email,
          verifiedAt: user.emailVerified,
          ipAddress,
          userAgent
        }
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

    // Log verification event using unified audit system
    await logAuditEvent({
      userId: user.id,
      action: 'UPDATE',
      resource: 'email_verification',
      changes: {
        email: user.email,
        verifiedAt: new Date(),
        previouslyVerified: false,
        ipAddress,
        userAgent
      }
    })

    return NextResponse.json(
      { 
        success: true, 
        message: "Email verified successfully. You can now log in.",
        email: user.email,
        canLogin: true
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("Email verification error:", error)
    
    // Log error using unified audit system
    await logAuditEvent({
      userId: null,
      action: 'ERROR',
      resource: 'email_verification',
      changes: {
        error: error instanceof Error ? error.message : 'Unknown error',
        ipAddress,
        userAgent
      }
    })

    return NextResponse.json(
      { 
        success: false, 
        error: "An error occurred during email verification. Please try again." 
      },
      { status: 500 }
    )
  }
}
