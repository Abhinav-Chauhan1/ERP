/**
 * Session Management Utilities
 * 
 * Provides functions for managing NextAuth v5 sessions including:
 * - Session updates when user data changes
 * - Session cleanup for expired sessions
 */

import { db } from "@/lib/db"
import { UserRole, AuditAction } from "@prisma/client"

/**
 * Updates the user's session when their role changes
 * 
 * Note: NextAuth v5's unstable_update is not yet available in the current beta.
 * This function updates the database user record, and the session will be
 * refreshed on the next request due to the database session strategy.
 * 
 * @param userId - The ID of the user whose role is changing
 * @param newRole - The new role to assign to the user
 * @returns Promise<void>
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<void> {
  try {
    // Update user role in database
    await db.user.update({
      where: { id: userId },
      data: { role: newRole }
    })

    // Log the role change for audit purposes
    await db.auditLog.create({
      data: {
        action: AuditAction.UPDATE,
        userId: userId,
        resource: "USER_ROLE",
        resourceId: userId,
        changes: {
          newRole: newRole,
          timestamp: new Date().toISOString()
        }
      }
    })

    console.log(`✅ User role updated: ${userId} -> ${newRole}`)
  } catch (error) {
    console.error("❌ Error updating user role:", error)
    throw new Error(`Failed to update user role: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Updates the user's session when their profile data changes
 * 
 * This function updates the database user record. The session will be
 * refreshed on the next request due to the database session strategy.
 * 
 * @param userId - The ID of the user whose profile is changing
 * @param updates - Object containing the fields to update
 * @returns Promise<void>
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    name?: string
    email?: string
    image?: string
    firstName?: string
    lastName?: string
  }
): Promise<void> {
  try {
    // Update user profile in database
    await db.user.update({
      where: { id: userId },
      data: updates
    })

    // Log the profile update for audit purposes
    await db.auditLog.create({
      data: {
        action: AuditAction.UPDATE,
        userId: userId,
        resource: "USER_PROFILE",
        resourceId: userId,
        changes: {
          updatedFields: Object.keys(updates),
          timestamp: new Date().toISOString()
        }
      }
    })

    console.log(`✅ User profile updated: ${userId}`)
  } catch (error) {
    console.error("❌ Error updating user profile:", error)
    throw new Error(`Failed to update user profile: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Invalidates all sessions for a specific user
 * Useful when password changes or account security is compromised
 * 
 * @param userId - The ID of the user whose sessions should be invalidated
 * @param exceptSessionToken - Optional session token to keep active (e.g., current session)
 * @returns Promise<number> - Number of sessions deleted
 */
export async function invalidateUserSessions(
  userId: string,
  exceptSessionToken?: string
): Promise<number> {
  try {
    const result = await db.session.deleteMany({
      where: {
        userId: userId,
        ...(exceptSessionToken && {
          sessionToken: {
            not: exceptSessionToken
          }
        })
      }
    })

    // Log the session invalidation for audit purposes
    await db.auditLog.create({
      data: {
        action: AuditAction.DELETE,
        userId: userId,
        resource: "USER_SESSIONS",
        resourceId: userId,
        changes: {
          sessionsDeleted: result.count,
          exceptCurrentSession: !!exceptSessionToken,
          timestamp: new Date().toISOString()
        }
      }
    })

    console.log(`✅ Invalidated ${result.count} session(s) for user: ${userId}`)
    return result.count
  } catch (error) {
    console.error("❌ Error invalidating user sessions:", error)
    throw new Error(`Failed to invalidate user sessions: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Gets all active sessions for a user
 * 
 * @param userId - The ID of the user
 * @returns Promise<Array> - Array of active sessions with details
 */
export async function getUserSessions(userId: string) {
  try {
    const sessions = await db.session.findMany({
      where: {
        userId: userId,
        expires: {
          gt: new Date() // Only get non-expired sessions
        }
      },
      orderBy: {
        expires: "desc"
      }
    })

    return sessions.map(session => ({
      id: session.id,
      sessionToken: session.sessionToken,
      expires: session.expires,
      isExpired: session.expires < new Date()
    }))
  } catch (error) {
    console.error("❌ Error getting user sessions:", error)
    throw new Error(`Failed to get user sessions: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Revokes a specific session by session token
 * 
 * @param sessionToken - The session token to revoke
 * @returns Promise<boolean> - True if session was deleted, false if not found
 */
export async function revokeSession(sessionToken: string): Promise<boolean> {
  try {
    const session = await db.session.findUnique({
      where: { sessionToken }
    })

    if (!session) {
      return false
    }

    await db.session.delete({
      where: { sessionToken }
    })

    // Log the session revocation for audit purposes
    await db.auditLog.create({
      data: {
        action: AuditAction.DELETE,
        userId: session.userId,
        resource: "SESSION",
        resourceId: session.id,
        changes: {
          sessionToken: sessionToken.substring(0, 10) + "...", // Partial token for security
          timestamp: new Date().toISOString()
        }
      }
    })

    console.log(`✅ Session revoked: ${sessionToken.substring(0, 10)}...`)
    return true
  } catch (error) {
    console.error("❌ Error revoking session:", error)
    throw new Error(`Failed to revoke session: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
