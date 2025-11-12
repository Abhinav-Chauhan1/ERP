"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

interface ChangePasswordParams {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export async function changePassword({
  userId,
  currentPassword,
  newPassword,
}: ChangePasswordParams) {
  try {
    // Password management is handled by Clerk
    // Users should change their password through Clerk's user profile
    return { 
      success: false, 
      error: "Password changes are managed through your account settings. Please use the Clerk user profile to change your password." 
    };
  } catch (error) {
    console.error("Error changing password:", error);
    return { success: false, error: "Failed to change password" };
  }
}
