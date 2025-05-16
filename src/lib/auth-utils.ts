import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "./db";
import { UserRole } from "@prisma/client";

/**
 * Server-side middleware for role-based authorization
 */
export async function requireRole(allowedRoles: UserRole[], redirectTo: string = "/") {
  const { userId } = await auth();
  
  if (!userId) {
    return redirect("/sign-in");
  }
  
  // Find user in our database
  const user = await db.user.findFirst({
    where: {
      clerkId: userId
    }
  });
  
  if (!user || !allowedRoles.includes(user.role)) {
    return redirect(redirectTo);
  }
  
  // Return user for convenience
  return user;
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
