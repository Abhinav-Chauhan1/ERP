import { clerkClient } from "@clerk/nextjs/server";
import { db } from "./db";
import { UserRole } from "@prisma/client";

/**
 * Updates a user's role in both database and Clerk
 */
export async function updateUserRole(userId: string, role: UserRole) {
  try {
    // 1. Get the user's Clerk ID
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { clerkId: true }
    });
    
    if (!user) {
      throw new Error("User not found");
    }

    // 2. Update the role in our database
    await db.user.update({
      where: { id: userId },
      data: { role }
    });

    // 3. Update the role in Clerk's metadata
    const clerk = await clerkClient();
    await clerk.users.updateUser(user.clerkId, {
      publicMetadata: {
        role
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { success: false, error };
  }
}

/**
 * Creates role-specific profile for a user
 */
export async function createRoleProfile(userId: string, data: any) {
  try {
    // Get the user to determine their role
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (!user) {
      throw new Error("User not found");
    }

    // Create the appropriate profile based on role
    switch (user.role) {
      case UserRole.ADMIN:
        return await db.administrator.create({
          data: {
            userId,
            position: data.position,
            department: data.department
          }
        });
      
      case UserRole.TEACHER:
        return await db.teacher.create({
          data: {
            userId,
            employeeId: data.employeeId,
            qualification: data.qualification,
            joinDate: data.joinDate || new Date(),
            salary: data.salary
          }
        });
      
      case UserRole.STUDENT:
        return await db.student.create({
          data: {
            userId,
            admissionId: data.admissionId,
            admissionDate: data.admissionDate || new Date(),
            rollNumber: data.rollNumber,
            dateOfBirth: data.dateOfBirth || new Date(),
            gender: data.gender || 'Other'
          }
        });
      
      case UserRole.PARENT:
        return await db.parent.create({
          data: {
            userId,
            occupation: data.occupation,
            alternatePhone: data.alternatePhone,
            relation: data.relation
          }
        });
      
      default:
        throw new Error("Invalid role");
    }
  } catch (error) {
    console.error("Error creating role profile:", error);
    throw error;
  }
}
