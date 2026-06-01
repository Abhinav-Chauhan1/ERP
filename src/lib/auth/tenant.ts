import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

// Optional React.cache — works in React render context, falls back to identity elsewhere
let reactCache: typeof import('react').cache | undefined;
try {
  reactCache = require('react').cache;
} catch {
  reactCache = undefined;
}
function memoize<T extends (...args: any[]) => any>(fn: T): T {
  return reactCache ? reactCache(fn) : fn;
}

/**
 * Get the current user's active school ID from session
 * This should never be called from client components - only server actions and API routes
 */
export const getCurrentSchoolId = memoize(async (): Promise<string | null> => {
  // Delegate to the memoized context lookup — avoids a second user_schools query
  const ctx = await getCurrentUserSchoolContext();
  return ctx?.schoolId ?? null;
});

/**
 * Get the current user's school context including role.
 * Memoized with React.cache() so the DB is hit only once per render tree —
 * all server actions in the same request share this result.
 */
export const getCurrentUserSchoolContext = memoize(async () => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return null;
    }

    // Super admin doesn't need a school lookup
    if (session.user.role === "SUPER_ADMIN") {
      return {
        schoolId: null as string | null,
        role: "SUPER_ADMIN" as UserRole,
        school: null as null,
        isSuperAdmin: true,
        user: session.user,
        userId: session.user.id,
      };
    }

    // Single query — no school include; wrappers only need schoolId + role
    const userSchool = await db.userSchool.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: {
        schoolId: true,
        role: true,
      },
    });

    if (!userSchool) {
      return null;
    }

    return {
      schoolId: userSchool.schoolId as string | null,
      role: userSchool.role,
      school: null as null,
      isSuperAdmin: false,
      user: session.user,
      userId: session.user.id,
    };
  } catch (error) {
    console.error("Error getting user school context:", error);
    return null;
  }
});

/**
 * Require school access - throws error if user doesn't have access to the specified school
 * Use this in API routes and server actions that need to verify school access
 */
export async function requireSchoolAccess(requiredSchoolId?: string) {
  const context = await getCurrentUserSchoolContext();

  if (!context) {
    throw new Error("Authentication required");
  }

  // Super admin can access any school
  if (context.isSuperAdmin) {
    return context;
  }

  // Regular users must have access to the specific school
  if (requiredSchoolId && context.schoolId !== requiredSchoolId) {
    throw new Error("Access denied: No permission for this school");
  }

  if (!context.schoolId) {
    throw new Error("No active school found");
  }

  return context;
}

/**
 * Require super admin access
 */
export async function requireSuperAdminAccess() {
  const context = await getCurrentUserSchoolContext();

  if (!context?.isSuperAdmin) {
    throw new Error("Super admin access required");
  }

  return context;
}

/**
 * Create a Prisma where clause that includes schoolId filter
 * Use this for all database queries to ensure tenant isolation
 */
export function withSchoolScope(whereClause: any = {}, schoolId?: string) {
  if (!schoolId) {
    throw new Error("schoolId is required for school-scoped queries");
  }

  return {
    ...whereClause,
    schoolId,
  };
}

/**
 * Helper to add schoolId to create operations
 */
export function withSchoolId(data: any, schoolId: string) {
  return {
    ...data,
    schoolId,
  };
}

/**
 * Get all schools a user has access to (for school selection)
 */
export async function getUserSchools(userId: string) {
  try {
    const userSchools = await db.userSchool.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            schoolCode: true,
            status: true,
            plan: true,
          },
        },
      },
    });

    return userSchools;
  } catch (error) {
    console.error("Error getting user schools:", error);
    return [];
  }
}

/**
 * Set active school for a user
 */
export async function setActiveSchool(userId: string, schoolId: string) {
  try {
    const [, activated] = await db.$transaction([
      db.userSchool.updateMany({
        where: { userId },
        data: { isActive: false },
      }),
      db.userSchool.updateMany({
        where: { userId, schoolId },
        data: { isActive: true },
      }),
    ]);

    return activated.count > 0;
  } catch (error) {
    console.error("Error setting active school:", error);
    return false;
  }
}