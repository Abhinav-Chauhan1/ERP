/**
 * Auth Helper Functions
 * 
 * Provides helper functions for authentication in server actions and API routes.
 * These functions bridge the gap between NextAuth v5 and the previous Clerk implementation.
 */

import { auth } from "@/auth"

/**
 * Get the current authenticated user from NextAuth session
 * 
 * This function replaces the Clerk `currentUser()` function.
 * It returns a user object compatible with the previous Clerk structure.
 * 
 * @returns User object with id, email, firstName, lastName, role, etc.
 */
export async function currentUser() {
  const session = await auth()
  
  if (!session?.user) {
    return null
  }

  // Map NextAuth session to Clerk-like user object for compatibility
  const nameParts = session.user.name?.split(" ") || []
  const firstName = nameParts[0] || ""
  const lastName = nameParts.slice(1).join(" ") || ""

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    firstName,
    lastName,
    role: session.user.role,
    image: session.user.image,
    schoolId: session.user.schoolId, // Add schoolId from session
    schoolName: session.user.schoolName,
    schoolCode: session.user.schoolCode,
    isSuperAdmin: session.user.isSuperAdmin,
    authorizedSchools: session.user.authorizedSchools,
  }
}

/**
 * Get the current user's ID
 * 
 * @returns User ID or null if not authenticated
 */
export async function currentUserId() {
  const session = await auth()
  return session?.user?.id || null
}

/**
 * Check if the current user has a specific role
 * 
 * @param role - The role to check
 * @returns true if user has the role, false otherwise
 */
export async function hasRole(role: string) {
  const session = await auth()
  return session?.user?.role === role
}

/**
 * Require authentication - throws error if not authenticated
 * 
 * @returns User object
 * @throws Error if not authenticated
 */
export async function requireAuth() {
  const user = await currentUser()
  
  if (!user) {
    throw new Error("Unauthorized")
  }
  
  return user
}

/**
 * Require specific role - throws error if user doesn't have role
 * 
 * @param role - Required role
 * @returns User object
 * @throws Error if not authenticated or doesn't have role
 */
export async function requireRole(role: string) {
  const user = await requireAuth()
  
  if (user.role !== role) {
    throw new Error(`Forbidden: Requires ${role} role`)
  }
  
  return user
}
