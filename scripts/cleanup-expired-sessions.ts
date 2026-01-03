/**
 * Session Cleanup Script
 * 
 * Deletes expired sessions from the database to maintain performance
 * and reduce database storage usage.
 * 
 * Usage:
 *   npx tsx scripts/cleanup-expired-sessions.ts
 *   npx tsx scripts/cleanup-expired-sessions.ts --dry-run
 *   npx tsx scripts/cleanup-expired-sessions.ts --verbose
 * 
 * Scheduling:
 *   This script can be scheduled to run periodically using:
 *   - Cron jobs (Linux/Mac)
 *   - Task Scheduler (Windows)
 *   - Vercel Cron (for Vercel deployments)
 *   - GitHub Actions (for automated cleanup)
 * 
 * Example cron schedule (daily at 2 AM):
 *   0 2 * * * cd /path/to/project && npx tsx scripts/cleanup-expired-sessions.ts
 */

import { db } from "../src/lib/db"
import { AuditAction } from "@prisma/client"

interface CleanupResult {
  success: boolean
  deletedCount: number
  error?: string
  timestamp: Date
  dryRun: boolean
}

// System user ID for automated tasks (will be created if doesn't exist)
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
            active: false, // System user should not be able to log in
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
 * Deletes all expired sessions from the database
 * 
 * @param dryRun - If true, only counts expired sessions without deleting
 * @param verbose - If true, logs detailed information
 * @returns Promise<CleanupResult>
 */
async function cleanupExpiredSessions(
  dryRun: boolean = false,
  verbose: boolean = false
): Promise<CleanupResult> {
  const timestamp = new Date()
  
  try {
    if (verbose) {
      console.log(`\n🔍 Checking for expired sessions...`)
      console.log(`   Current time: ${timestamp.toISOString()}`)
    }

    // Count expired sessions first
    const expiredCount = await db.session.count({
      where: {
        expires: {
          lt: timestamp
        }
      }
    })

    if (verbose) {
      console.log(`   Found ${expiredCount} expired session(s)`)
    }

    if (expiredCount === 0) {
      if (verbose) {
        console.log(`✅ No expired sessions to clean up`)
      }
      return {
        success: true,
        deletedCount: 0,
        timestamp,
        dryRun
      }
    }

    if (dryRun) {
      console.log(`\n🔍 DRY RUN: Would delete ${expiredCount} expired session(s)`)
      return {
        success: true,
        deletedCount: expiredCount,
        timestamp,
        dryRun: true
      }
    }

    // Delete expired sessions
    const result = await db.session.deleteMany({
      where: {
        expires: {
          lt: timestamp
        }
      }
    })

    // Ensure system user exists for audit logging
    const systemUserId = await ensureSystemUser()

    // Log the cleanup action for audit purposes (only if we have a valid user)
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
              automated: true
            }
          }
        })
      } catch (auditError) {
        // Don't fail the cleanup if audit logging fails
        console.warn("Failed to create audit log:", auditError)
      }
    }

    if (verbose) {
      console.log(`✅ Successfully deleted ${result.count} expired session(s)`)
    }

    return {
      success: true,
      deletedCount: result.count,
      timestamp,
      dryRun: false
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    console.error(`❌ Error during session cleanup:`, errorMessage)
    
    // Log the error for audit purposes (only if we have a valid user)
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
              timestamp: timestamp.toISOString()
            }
          }
        })
      } catch (logError) {
        console.error(`❌ Failed to log cleanup error:`, logError)
      }
    }

    return {
      success: false,
      deletedCount: 0,
      error: errorMessage,
      timestamp,
      dryRun
    }
  }
}

/**
 * Gets statistics about current sessions
 * 
 * @returns Promise<object> - Session statistics
 */
async function getSessionStats() {
  try {
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

    // Get oldest and newest sessions
    const oldestSession = await db.session.findFirst({
      orderBy: {
        expires: "asc"
      },
      select: {
        expires: true
      }
    })

    const newestSession = await db.session.findFirst({
      orderBy: {
        expires: "desc"
      },
      select: {
        expires: true
      }
    })

    return {
      total: totalSessions,
      active: activeSessions,
      expired: expiredSessions,
      oldestExpiry: oldestSession?.expires,
      newestExpiry: newestSession?.expires
    }
  } catch (error) {
    console.error("❌ Error getting session stats:", error)
    return null
  }
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes("--dry-run")
  const verbose = args.includes("--verbose") || args.includes("-v")
  const showStats = args.includes("--stats")
  const help = args.includes("--help") || args.includes("-h")

  if (help) {
    console.log(`
Session Cleanup Script
======================

Deletes expired sessions from the database.

Usage:
  npx tsx scripts/cleanup-expired-sessions.ts [options]

Options:
  --dry-run       Show what would be deleted without actually deleting
  --verbose, -v   Show detailed information during cleanup
  --stats         Show session statistics before cleanup
  --help, -h      Show this help message

Examples:
  npx tsx scripts/cleanup-expired-sessions.ts
  npx tsx scripts/cleanup-expired-sessions.ts --dry-run
  npx tsx scripts/cleanup-expired-sessions.ts --verbose
  npx tsx scripts/cleanup-expired-sessions.ts --stats --verbose

Scheduling:
  Daily at 2 AM (cron):
    0 2 * * * cd /path/to/project && npx tsx scripts/cleanup-expired-sessions.ts

  Vercel Cron (vercel.json):
    {
      "crons": [{
        "path": "/api/cron/cleanup-sessions",
        "schedule": "0 2 * * *"
      }]
    }
`)
    process.exit(0)
  }

  console.log("=== Session Cleanup Script ===\n")

  // Show statistics if requested
  if (showStats || verbose) {
    console.log("📊 Session Statistics:")
    const stats = await getSessionStats()
    if (stats) {
      console.log(`   Total sessions: ${stats.total}`)
      console.log(`   Active sessions: ${stats.active}`)
      console.log(`   Expired sessions: ${stats.expired}`)
      if (stats.oldestExpiry) {
        console.log(`   Oldest expiry: ${stats.oldestExpiry.toISOString()}`)
      }
      if (stats.newestExpiry) {
        console.log(`   Newest expiry: ${stats.newestExpiry.toISOString()}`)
      }
      console.log()
    }
  }

  // Run cleanup
  const result = await cleanupExpiredSessions(dryRun, verbose)

  // Display summary
  if (!verbose) {
    if (result.success) {
      if (dryRun) {
        console.log(`\n🔍 DRY RUN: Would delete ${result.deletedCount} expired session(s)`)
      } else {
        console.log(`\n✅ Cleanup complete: Deleted ${result.deletedCount} expired session(s)`)
      }
    } else {
      console.log(`\n❌ Cleanup failed: ${result.error}`)
    }
  }

  // Show final statistics if requested
  if (showStats && !dryRun && result.deletedCount > 0) {
    console.log("\n📊 Updated Session Statistics:")
    const stats = await getSessionStats()
    if (stats) {
      console.log(`   Total sessions: ${stats.total}`)
      console.log(`   Active sessions: ${stats.active}`)
      console.log(`   Expired sessions: ${stats.expired}`)
    }
  }

  console.log()
  
  // Exit with appropriate code
  process.exit(result.success ? 0 : 1)
}

// Run the script
main().catch((error) => {
  console.error("❌ Unexpected error:", error)
  process.exit(1)
})
