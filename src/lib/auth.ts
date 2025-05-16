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

/**
 * Syncs the user's role to Clerk's metadata
 */
export async function syncRoleToClerk(userId: string): Promise<void> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { clerkId: true, role: true }
    });
    
    if (!user) {
      throw new Error("User not found");
    }

    // Update the user's metadata in Clerk
    const client = await clerkClient();
    await client.users.updateUser(user.clerkId, {
      publicMetadata: {
        role: user.role
      }
    });
  } catch (error) {
    console.error("Error syncing role to Clerk:", error);
    throw error;
  }
}

/**
 * Gets the current user's profile based on role
 */
export async function getCurrentUserProfile() {
  try {
    const userDetails = await getCurrentUserDetails();
    
    if (!userDetails || !userDetails.dbUser) {
      return null;
    }

    const { dbUser } = userDetails;
    
    // Based on role, fetch the specific profile
    switch (dbUser.role) {
      case UserRole.ADMIN:
        return await db.administrator.findUnique({
          where: { userId: dbUser.id }
        });
      case UserRole.TEACHER:
        return await db.teacher.findUnique({
          where: { userId: dbUser.id }
        });
      case UserRole.STUDENT:
        return await db.student.findUnique({
          where: { userId: dbUser.id }
        });
      case UserRole.PARENT:
        return await db.parent.findUnique({
          where: { userId: dbUser.id }
        });
      default:
        return null;
    }
  } catch (error) {
    console.error("Error getting current user profile:", error);
    return null;
  }
}
