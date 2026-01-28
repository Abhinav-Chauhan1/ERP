import { NextRequest, NextResponse } from "next/server"
import { withSchoolAuth } from "@/lib/auth/security-wrapper"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { cookies } from "next/headers"

/**
 * GET /api/user/sessions
 * Retrieves session information for the current user
 * 
 * Note: With JWT strategy, we can only show the current session
 * as sessions are not stored in the database
 */
export const GET = withSchoolAuth(async (request, context) => {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // With JWT strategy, we can only show the current session
    // Get session cookie to extract expiry
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("authjs.session-token") ||
      cookieStore.get("__Secure-authjs.session-token")

    if (!sessionCookie) {
      return NextResponse.json({
        success: true,
        sessions: []
      })
    }

    // Calculate expiry based on maxAge (30 minutes = 1800 seconds)
    const maxAge = 1800 // from auth.ts config
    const expiresAt = new Date(Date.now() + maxAge * 1000)

    // Get user agent for device info
    const userAgent = (await import("next/headers")).headers().then(h => h.get("user-agent") || "Unknown")
    const ua = await userAgent

    const device = getDeviceFromUserAgent(ua)

    const currentSession = {
      id: "current",
      isCurrent: true,
      expiresAt: expiresAt,
      createdAt: new Date(), // Approximate
      device: device,
      location: "Current Location" // Would need IP geolocation service for actual location
    }

    return NextResponse.json({
      success: true,
      sessions: [currentSession],
      note: "JWT sessions: Only current session is displayed. For multi-device session management, consider switching to database session strategy."
    })
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/user/sessions
 * With JWT strategy, we can only sign out the current session
 */
export const DELETE = withSchoolAuth(async (request, context) => {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")
    const revokeAll = searchParams.get("revokeAll") === "true"

    // With JWT strategy, we can't revoke other sessions
    // User needs to sign out from each device manually
    if (revokeAll || sessionId) {
      return NextResponse.json({
        success: false,
        error: "Session revocation not available with JWT strategy. Please sign out from each device manually."
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: "Invalid request"
    }, { status: 400 })
  } catch (error) {
    console.error("Error revoking session:", error)
    return NextResponse.json(
      { success: false, error: "Failed to revoke session" },
      { status: 500 }
    )
  }
});

/**
 * Helper function to extract device info from user agent
 */
function getDeviceFromUserAgent(userAgent: string): string {
  const ua = userAgent.toLowerCase()

  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    if (ua.includes("iphone")) return "iPhone"
    if (ua.includes("android")) return "Android Phone"
    return "Mobile Device"
  }

  if (ua.includes("tablet") || ua.includes("ipad")) {
    if (ua.includes("ipad")) return "iPad"
    return "Tablet"
  }

  if (ua.includes("windows")) return "Windows PC"
  if (ua.includes("mac")) return "Mac"
  if (ua.includes("linux")) return "Linux PC"

  return "Desktop Browser"
}
