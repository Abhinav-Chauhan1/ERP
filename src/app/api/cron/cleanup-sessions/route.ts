/**
 * API Route for Session Cleanup Cron Job
 * 
 * This endpoint can be called by:
 * - Vercel Cron
 * - GitHub Actions
 * - External cron services (e.g., cron-job.org)
 * - Manual triggers
 * 
 * Security: Should be protected with a secret token in production
 * 
 * Example Vercel Cron configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-sessions",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { AuditAction } from "@prisma/client"

export const dynamic = "force-dynamic"
export const maxDuration = 60 // Maximum execution time in seconds

// System user ID for automated tasks
const SYSTEM_USER_ID = "system"

/**
 * Ensures the system user exists for audit logging
 * Returns null if unable to create/find a user for audit logging
 */
async function ensureSystemUser(): Promise<string | null> {
  try {
    let systemUser = await db.user.findUnique({
      where: { id: SYSTEM_USER_ID }
    })

    if (!systemUser) {
      // Try to find any admin user to use for system operations
      const adminUser = await db.user.findFirst({
        where: { role: "ADMIN", active: true }
      })

      if (adminUser) {
        return adminUser.id
      }

      // If no admin exists, try to create system user
      try {
        systemUser = await db.user.create({
          data: {
            id: SYSTEM_USER_ID,
            email: "system@internal",
            firstName: "System",
            lastName: "Automated",
            role: "ADMIN",
            active: false,
            emailVerified: new Date()
          }
        })
        return systemUser.id
      } catch (createError) {
        console.warn("Could not create system user:", createError)
        return null
      }
    }

    return systemUser.id
  } catch (error) {
    console.warn("Error ensuring system user:", error)
    return null
  }
}

/**
 * POST /api/cron/cleanup-sessions
 * 
 * Deletes expired sessions from the database
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret in production
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const timestamp = new Date()

    // Count expired sessions
    const expiredCount = await db.session.count({
      where: {
        expires: {
          lt: timestamp
        }
      }
    })

    if (expiredCount === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: "No expired sessions to clean up",
        timestamp: timestamp.toISOString()
      })
    }

    // Delete expired sessions
    const result = await db.session.deleteMany({
      where: {
        expires: {
          lt: timestamp
        }
      }
    })

    // Ensure system user exists and log the cleanup action
    const systemUserId = await ensureSystemUser()
    
    if (systemUserId) {
      try {
        await db.auditLog.create({
          data: {
            action: AuditAction.DELETE,
            userId: systemUserId,
            resource: "SESSION_CLEANUP",
            changes: {
              deletedCount: result.count,
              timestamp: timestamp.toISOString(),
              automated: true,
              trigger: "cron"
            }
          }
        })
      } catch (auditError) {
        console.warn("Failed to create audit log:", auditError)
      }
    }

    console.log(`✅ Session cleanup completed: ${result.count} sessions deleted`)

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Successfully deleted ${result.count} expired session(s)`,
      timestamp: timestamp.toISOString()
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    console.error("❌ Session cleanup error:", errorMessage)

    // Log the error (only if we have a valid user)
    const systemUserId = await ensureSystemUser()
    if (systemUserId) {
      try {
        await db.auditLog.create({
          data: {
            action: AuditAction.DELETE,
            userId: systemUserId,
            resource: "SESSION_CLEANUP_ERROR",
            changes: {
              error: errorMessage,
              timestamp: new Date().toISOString(),
              trigger: "cron"
            }
          }
        })
      } catch (logError) {
        console.error("❌ Failed to log cleanup error:", logError)
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cron/cleanup-sessions
 * 
 * Returns statistics about sessions (for monitoring)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret in production
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const now = new Date()

    const [totalSessions, expiredSessions, activeSessions] = await Promise.all([
      db.session.count(),
      db.session.count({
        where: {
          expires: {
            lt: now
          }
        }
      }),
      db.session.count({
        where: {
          expires: {
            gte: now
          }
        }
      })
    ])

    return NextResponse.json({
      success: true,
      stats: {
        total: totalSessions,
        active: activeSessions,
        expired: expiredSessions,
        timestamp: now.toISOString()
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    )
  }
}
