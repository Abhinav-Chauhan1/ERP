import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

/**
 * Get the current user's active school ID from session
 * This should never be called from client components - only server actions and API routes
 */
export async function getCurrentSchoolId(): Promise<string | null> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return null;
    }

    // Check if user is SUPER_ADMIN (can access any school)
    if (session.user.role === "SUPER_ADMIN") {
      // For super admin, we need to get the active school from a different source
      // This could be from URL params, cookies, or a default school
      // For now, return null and let the caller handle it
      return null;
    }

    // For regular users, get their active school from UserSchool
    const userSchool = await db.userSchool.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: {
        schoolId: true,
      },
    });

    return userSchool?.schoolId || null;
  } catch (error) {
    console.error("Error getting current school ID:", error);
    return null;
  }
}

/**
 * Get the current user's school context including role
 */
export async function getCurrentUserSchoolContext() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return null;
    }

    // For SUPER_ADMIN, return special context
    if (session.user.role === "SUPER_ADMIN") {
      return {
        schoolId: null,
        role: "SUPER_ADMIN" as UserRole,
        isSuperAdmin: true,
        user: session.user,
        userId: session.user.id,
      };
    }

    // For regular users, get their active school and role
    const userSchool = await db.userSchool.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: {
        schoolId: true,
        role: true,
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

    if (!userSchool) {
      return null;
    }

    return {
      schoolId: userSchool.schoolId,
      role: userSchool.role,
      school: userSchool.school,
      isSuperAdmin: false,
      user: session.user,
      userId: session.user.id,
    };
  } catch (error) {
    console.error("Error getting user school context:", error);
    return null;
  }
}

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
    // First, deactivate all schools for this user
    await db.userSchool.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    // Then activate the specified school
    const result = await db.userSchool.updateMany({
      where: {
        userId,
        schoolId,
      },
      data: { isActive: true },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Error setting active school:", error);
    return false;
  }
}