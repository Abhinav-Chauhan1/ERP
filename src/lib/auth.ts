import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { db } from "./db";
import { UserRole } from "@prisma/client";

/**
 * Fetches the current authenticated user details including Clerk and database records
 */
export async function getCurrentUserDetails() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return null;
    }

    const dbUser = await db.user.findUnique({
      where: {
        clerkId: user.id
      }
    });

    return {
      clerkUser: user,
      dbUser
    };
  } catch (error) {
    console.error("Error fetching current user details:", error);
    return null;
  }
}

/**
 * Gets the role of the current authenticated user
 */
export async function getUserRole(): Promise<UserRole | null> {
  try {
    const userDetails = await getCurrentUserDetails();
    
    if (!userDetails || !userDetails.dbUser) {
      return null;
    }

    return userDetails.dbUser.role;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
}

/**
 * Checks if the current user is an administrator
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'ADMIN';
}

/**
 * Checks if the current user is a teacher
 */
export async function isTeacher(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'TEACHER';
}

/**
 * Checks if the current user is a student
 */
export async function isStudent(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'STUDENT';
}

/**
 * Checks if the current user is a parent
 */
export async function isParent(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'PARENT';
}

/**
 * Utility function to check user roles
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const userRole = await getUserRole();
  return userRole === role;
}
