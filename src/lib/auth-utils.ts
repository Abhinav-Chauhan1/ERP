import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

/**
 * Server-side middleware for role-based authorization
 */
export async function requireRole(allowedRoles: UserRole[], redirectTo: string = "/") {
  const session = await auth();

  if (!session?.user) {
    return redirect("/login");
  }

  if (!allowedRoles.includes(session.user.role)) {
    return redirect(redirectTo);
  }

  // Return user for convenience
  return session.user;
}

/**
 * Determines the dashboard URL based on user role
 */
export function getDashboardUrl(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return "/admin";
    case UserRole.TEACHER:
      return "/teacher";
    case UserRole.STUDENT:
      return "/student";
    case UserRole.PARENT:
      return "/parent";
    default:
      return "/";
  }
}

export type SecureActionOptions = {
  requireSchoolId?: boolean;
};

/**
 * Ensures the user is authenticated and has a valid schoolId if required.
 * Returns the session and schoolId, or throws an error.
 */
export async function requireSchoolContext() {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized: Please log in to continue.');
  }

  const user = session.user;
  const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
  const schoolId = user.schoolId;

  if (!isSuperAdmin && !schoolId) {
    throw new Error('Forbidden: No active school session found.');
  }

  return { session, user, isSuperAdmin, schoolId: schoolId as string };
}

/**
 * A wrapper for Server Actions to automatically run within the tenant context.
 * 
 * Usage:
 * export const myAction = withTenantContext(async (args) => {
 *   // db operations here are automatically scoped to the user's school
 * });
 */
export function withTenantContext<T extends (...args: any[]) => Promise<any>>(
  actionFn: T,
  options: SecureActionOptions = { requireSchoolId: true }
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const session = await auth();

    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    const { role, schoolId } = session.user;
    const isSuperAdmin = role === UserRole.SUPER_ADMIN;

    if (options.requireSchoolId && !isSuperAdmin && !schoolId) {
      throw new Error('Forbidden: No active school session found.');
    }

    // Run the action within the tenant context
    const { runWithTenantContext } = await import('./tenant-context');
    return runWithTenantContext(
      { schoolId: schoolId as string, isSuperAdmin },
      () => actionFn(...args)
    );
  }) as T;
}
