import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

/**
 * GET /api/user/sessions
 * Retrieves all active sessions for the current user
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

    // Get all sessions for the user
    const sessions = await db.session.findMany({
      where: {
        userId: session.user.id,
        expires: {
          gt: new Date() // Only active sessions
        }
      },
      orderBy: {
        expires: 'desc'
      },
      select: {
        id: true,
        sessionToken: true,
        expires: true
      }
    })

    // Get current session token from the request
    const currentSessionToken = session ? await getCurrentSessionToken() : null

    // Format sessions with additional info
    const formattedSessions = sessions.map(s => ({
      id: s.id,
      isCurrent: s.sessionToken === currentSessionToken,
      expiresAt: s.expires,
      createdAt: new Date(s.expires.getTime() - 1800000), // Approximate (30 min before expiry)
      // Note: Device and location info would require additional tracking
      // This is a simplified version
      device: "Unknown Device",
      location: "Unknown Location"
    }))

    return NextResponse.json({
      success: true,
      sessions: formattedSessions
    })
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch sessions" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/user/sessions
 * Revokes a specific session or all sessions except current
 */
export async function DELETE(request: NextRequest) {
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

    if (revokeAll) {
      // Get current session to preserve it
      const currentSession = await db.session.findFirst({
        where: { userId: session.user.id },
        orderBy: { expires: 'desc' }
      })

      // Delete all sessions except current
      const result = await db.session.deleteMany({
        where: {
          userId: session.user.id,
          id: currentSession ? { not: currentSession.id } : undefined
        }
      })

      // Log session revocation
      await db.auditLog.create({
        data: {
          action: "DELETE",
          resource: "SESSION",
          userId: session.user.id,
          changes: {
            event: "ALL_SESSIONS_REVOKED",
            sessionsRevoked: result.count
          }
        }
      })

      return NextResponse.json({
        success: true,
        message: `${result.count} session(s) revoked successfully`
      })
    } else if (sessionId) {
      // Verify the session belongs to the user
      const sessionToDelete = await db.session.findUnique({
        where: { id: sessionId }
      })

      if (!sessionToDelete) {
        return NextResponse.json(
          { success: false, error: "Session not found" },
          { status: 404 }
        )
      }

      if (sessionToDelete.userId !== session.user.id) {
        return NextResponse.json(
          { success: false, error: "Unauthorized to revoke this session" },
          { status: 403 }
        )
      }

      // Delete the session
      await db.session.delete({
        where: { id: sessionId }
      })

      // Log session revocation
      await db.auditLog.create({
        data: {
          action: "DELETE",
          resource: "SESSION",
          resourceId: sessionId,
          userId: session.user.id,
          changes: {
            event: "SESSION_REVOKED",
            sessionId
          }
        }
      })

      return NextResponse.json({
        success: true,
        message: "Session revoked successfully"
      })
    } else {
      return NextResponse.json(
        { success: false, error: "Missing sessionId or revokeAll parameter" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error revoking session:", error)
    return NextResponse.json(
      { success: false, error: "Failed to revoke session" },
      { status: 500 }
    )
  }
}

/**
 * Helper function to get current session token
 * This is a simplified version - in production you'd extract from cookies
 */
async function getCurrentSessionToken(): Promise<string | null> {
  try {
    const session = await auth()
    if (!session?.user?.id) return null

    const currentSession = await db.session.findFirst({
      where: { userId: session.user.id },
      orderBy: { expires: 'desc' }
    })

    return currentSession?.sessionToken || null
  } catch (error) {
    console.error("Error getting current session token:", error)
    return null
  }
}
