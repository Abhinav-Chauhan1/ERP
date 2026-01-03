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
