import { auth } from "@/auth";
import { requireSchoolAccess, requireSuperAdminAccess, getCurrentUserSchoolContext } from "./tenant";
import { validateSessionForSecurityWrapper } from "./session-refresh";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Security wrapper for API routes
 * Ensures proper school access validation
 */
export function withSchoolAuth(
  handler: (request: NextRequest, context: { schoolId: string; userId: string; userRole: string, params: any }) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: { params: Promise<any> }) => {
    try {
      const params = await context.params; // Next.js 15 params are async
      const session = await auth();

      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Super admin can access everything
      if (session.user.role === "SUPER_ADMIN") {
        const authContext = await requireSuperAdminAccess();
        return handler(request, {
          schoolId: authContext.schoolId || "", // Super admin may not have a specific school
          userId: authContext.userId,
          userRole: authContext.role,
          params
        });
      }

      // Regular users need school access
      const authContext = await requireSchoolAccess();

      return handler(request, {
        schoolId: authContext.schoolId || "", // Handle null schoolId
        userId: authContext.userId,
        userRole: authContext.role,
        params
      });
    } catch (error: any) {
      console.error("Security wrapper error:", error);
      return NextResponse.json(
        { error: error.message || "Access denied" },
        { status: 403 }
      );
    }
  };
}

/**
 * Security wrapper for server actions
 * Ensures proper school access validation
 */
export function withSchoolAuthAction<T extends any[], R>(
  action: (schoolId: string, userId: string, userRole: string, ...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      // Use enhanced session validation for better debugging
      const sessionValidation = await validateSessionForSecurityWrapper();
      
      if (!sessionValidation.isValid) {
        console.error("Security wrapper session validation failed:", {
          error: sessionValidation.error,
          debugInfo: sessionValidation.debugInfo
        });
        throw new Error(`Unauthorized: ${sessionValidation.error || "You must be logged in"}`);
      }

      const session = sessionValidation.session;
      const userId = sessionValidation.userId!;
      const role = sessionValidation.role!;

      // Super admin can access everything
      if (role === "SUPER_ADMIN") {
        const authContext = await requireSuperAdminAccess();
        return action(authContext.schoolId || "", authContext.userId, authContext.role, ...args);
      }

      // Regular users need school access
      const authContext = await requireSchoolAccess();
      return action(authContext.schoolId || "", authContext.userId, authContext.role, ...args);
    } catch (error: any) {
      console.error("Security action wrapper error:", error);
      throw new Error(error.message || "Access denied");
    }
  };
}

/**
 * Security wrapper for pages (server components)
 * Ensures proper school access validation
 */
export function withSchoolAuthPage<T>(
  pageComponent: (props: T & { schoolId: string; userId: string; userRole: string }) => Promise<JSX.Element>
) {
  return async (props: T) => {
    try {
      // Use enhanced session validation for better debugging
      const sessionValidation = await validateSessionForSecurityWrapper();
      
      if (!sessionValidation.isValid) {
        console.error("Security wrapper page validation failed:", {
          error: sessionValidation.error,
          debugInfo: sessionValidation.debugInfo
        });
        throw new Error(`Unauthorized: ${sessionValidation.error || "You must be logged in"}`);
      }

      const session = sessionValidation.session;
      const userId = sessionValidation.userId!;
      const role = sessionValidation.role!;

      // Super admin can access everything
      if (role === "SUPER_ADMIN") {
        const authContext = await requireSuperAdminAccess();
        return pageComponent({
          ...props,
          schoolId: authContext.schoolId || "",
          userId: authContext.userId,
          userRole: authContext.role,
        });
      }

      // Regular users need school access
      const authContext = await requireSchoolAccess();
      return pageComponent({
        ...props,
        schoolId: authContext.schoolId || "",
        userId: authContext.userId,
        userRole: authContext.role,
      });
    } catch (error: any) {
      // This will be caught by error boundaries
      throw error;
    }
  };
}

/**
 * Helper to create secure database queries with school scope
 */
export function createSecureQuery(baseWhere: any = {}) {
  return async (additionalWhere: any = {}) => {
    const schoolId = await getCurrentUserSchoolContext()
      .then(context => {
        if (context?.isSuperAdmin) return null; // Super admin can see all
        return context?.schoolId;
      })
      .catch(() => null);

    if (schoolId) {
      return {
        ...baseWhere,
        ...additionalWhere,
        schoolId,
      };
    }

    // Super admin or no school context - return base query
    return {
      ...baseWhere,
      ...additionalWhere,
    };
  };
}

/**
 * Validate that a resource belongs to the user's school
 */
export async function validateResourceOwnership(resourceId: string, model: any, schoolId?: string) {
  const targetSchoolId = schoolId || await getCurrentUserSchoolContext()
    .then(context => context?.schoolId)
    .catch(() => null);

  if (!targetSchoolId) {
    throw new Error("School access required");
  }

  const resource = await model.findUnique({
    where: { id: resourceId },
    select: { schoolId: true },
  });

  if (!resource) {
    throw new Error("Resource not found");
  }

  if (resource.schoolId !== targetSchoolId) {
    throw new Error("Access denied: Resource belongs to different school");
  }

  return resource;
}

/**
 * Batch validate multiple resources belong to user's school
 */
export async function validateResourcesOwnership(resourceIds: string[], model: any, schoolId?: string) {
  const targetSchoolId = schoolId || await getCurrentUserSchoolContext()
    .then(context => context?.schoolId)
    .catch(() => null);

  if (!targetSchoolId) {
    throw new Error("School access required");
  }

  const resources = await model.findMany({
    where: {
      id: { in: resourceIds },
    },
    select: { id: true, schoolId: true },
  });

  const invalidResources = resources.filter((r: any) => r.schoolId !== targetSchoolId);

  if (invalidResources.length > 0) {
    throw new Error(`Access denied: ${invalidResources.length} resources belong to different schools`);
  }

  return resources;
}