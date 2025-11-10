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
    // Get the user with their current password
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return { success: false, error: "Current password is incorrect" };
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true, message: "Password changed successfully" };
  } catch (error) {
    console.error("Error changing password:", error);
    return { success: false, error: "Failed to change password" };
  }
}
