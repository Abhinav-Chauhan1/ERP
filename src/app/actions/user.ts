'use server'

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

/**
 * Creates or updates a user in the database from Clerk data
 */
export async function syncUser() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    // Get user from Clerk
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    
    if (!clerkUser) {
      throw new Error("Clerk user not found");
    }
    
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    
    if (!email) {
      throw new Error("User has no email address");
    }
    
    // Check if user exists in database
    let dbUser = await db.user.findUnique({
      where: { clerkId: userId }
    });
    
    // If user doesn't exist, create it
    if (!dbUser) {
      dbUser = await db.user.create({
        data: {
          clerkId: userId,
          email: email,
          firstName: clerkUser.firstName || "Unknown",
          lastName: clerkUser.lastName || "User",
          avatar: clerkUser.imageUrl,
          phone: clerkUser.phoneNumbers[0]?.phoneNumber,
          role: UserRole.STUDENT, // Default role
        }
      });
      
      // Update Clerk metadata with role
      await clerk.users.updateUser(userId, {
        publicMetadata: {
          role: UserRole.STUDENT
        }
      });
    }
    
    return dbUser;
  } catch (error) {
    console.error("Error syncing user:", error);
    throw error;
  }
}
