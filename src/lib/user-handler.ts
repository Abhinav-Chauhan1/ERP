import { clerkClient } from "@clerk/nextjs/server";
import { db } from "./db";
import { UserRole } from "@prisma/client";
import { syncUser } from "@/app/actions/user";

/**
 * Creates a user in the database from Clerk user data
 */
export async function createUserFromClerk(clerkUserId: string) {
  try {
    // Get user details from Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkUserId);
    
    if (!clerkUser) {
      throw new Error("Clerk user not found");
    }
    
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    
    if (!email) {
      throw new Error("User has no email address");
    }
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { clerkId: clerkUserId }
    });
    
    if (existingUser) {
      return existingUser;
    }
    
    // Create new user
    return await db.user.create({
      data: {
        clerkId: clerkUserId,
        email: email,
        firstName: clerkUser.firstName || "Unknown",
        lastName: clerkUser.lastName || "User",
        avatar: clerkUser.imageUrl,
        phone: clerkUser.phoneNumbers[0]?.phoneNumber,
        role: UserRole.STUDENT, // Default role
      }
    });
  } catch (error) {
    console.error("Error creating user from Clerk:", error);
    throw error;
  }
}

/**
 * Ensures a user exists in the database for the given Clerk ID
 * IMPORTANT: Only use in server components or API routes, NOT in middleware
 */
export async function ensureUserExists(clerkUserId: string) {
  try {
    const user = await syncUser();
    return user;
  } catch (error) {
    console.error("Error ensuring user exists:", error);
    throw error;
  }
}
