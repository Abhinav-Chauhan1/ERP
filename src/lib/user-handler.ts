import { clerkClient } from "@clerk/nextjs/server";
import { db } from "./db";
import { UserRole } from "@prisma/client";

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
    const newUser = await db.user.create({
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
    
    // Update clerk metadata with the role
    await client.users.updateUser(clerkUserId, {
      publicMetadata: {
        role: UserRole.STUDENT
      }
    });
    
    return newUser;
  } catch (error) {
    console.error("Error creating user from Clerk:", error);
    throw error;
  }
}

/**
 * Ensures a user exists in the database for the given Clerk ID
 * If not, creates a new user with Clerk data
 */
export async function ensureUserExists(clerkUserId: string) {
  const dbUser = await db.user.findUnique({
    where: { clerkId: clerkUserId }
  });
  
  if (!dbUser) {
    return await createUserFromClerk(clerkUserId);
  }
  
  return dbUser;
}
