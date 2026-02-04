"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schemas
const settingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  assignmentReminders: z.boolean().optional(),
  examReminders: z.boolean().optional(),
  messageNotifications: z.boolean().optional(),
  announcementNotifications: z.boolean().optional(),
  theme: z.string().optional(),
  colorTheme: z.string().optional(),
  language: z.string().optional(),
});

const profileUpdateSchema = z.object({
  phone: z.string().optional(),
  qualification: z.string().optional(),
});

/**
 * Get teacher settings
 */
export async function getSettings(teacherId?: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Get teacher
    const teacher = await db.teacher.findUnique({
      where: { userId: user.id },
      include: {
        settings: true,
      },
    });

    if (!teacher) {
      return {
        success: false,
        error: "Teacher not found",
      };
    }

    // If no settings exist, create default settings
    if (!teacher.settings) {
      // Get required school context
      const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
      const schoolId = await getRequiredSchoolId();

      const newSettings = await db.teacherSettings.create({
        data: {
          teacherId: teacher.id,
          schoolId, // Add required schoolId
        },
      });

      return {
        success: true,
        data: newSettings,
      };
    }

    return {
      success: true,
      data: teacher.settings,
    };
  } catch (error) {
    console.error("Error fetching teacher settings:", error);
    return {
      success: false,
      error: "Failed to fetch settings",
    };
  }
}

/**
 * Update teacher settings
 */
export async function updateSettings(settingsData: {
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  assignmentReminders?: boolean;
  examReminders?: boolean;
  messageNotifications?: boolean;
  announcementNotifications?: boolean;
  theme?: string;
  colorTheme?: string;
  language?: string;
}) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    // Validate data
    const validated = settingsSchema.parse(settingsData);

    // Get user and teacher
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    const teacher = await db.teacher.findUnique({
      where: { userId: user.id },
    });

    if (!teacher) {
      return {
        success: false,
        message: "Teacher not found",
      };
    }

    // Get required school context
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Update or create settings
    const settings = await db.teacherSettings.upsert({
      where: { teacherId: teacher.id },
      update: validated,
      create: {
        teacherId: teacher.id,
        schoolId, // Add required schoolId
        ...validated,
      },
    });

    revalidatePath("/teacher/settings");

    return {
      success: true,
      message: "Settings updated successfully",
      data: settings,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0].message,
      };
    }
    console.error("Error updating teacher settings:", error);
    return {
      success: false,
      message: "Failed to update settings",
    };
  }
}

/**
 * Update teacher profile
 */
export async function updateProfile(profileData: {
  phone?: string;
  qualification?: string;
}) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    // Validate data
    const validated = profileUpdateSchema.parse(profileData);

    // Get user and teacher
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    const teacher = await db.teacher.findUnique({
      where: { userId: user.id },
    });

    if (!teacher) {
      return {
        success: false,
        message: "Teacher not found",
      };
    }

    // Update user phone if provided
    if (validated.phone) {
      await db.user.update({
        where: { id: user.id },
        data: { phone: validated.phone },
      });
    }

    // Update teacher qualification if provided
    if (validated.qualification) {
      await db.teacher.update({
        where: { id: teacher.id },
        data: { qualification: validated.qualification },
      });
    }

    revalidatePath("/teacher/profile");
    revalidatePath("/teacher/settings");

    return {
      success: true,
      message: "Profile updated successfully",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0].message,
      };
    }
    console.error("Error updating teacher profile:", error);
    return {
      success: false,
      message: "Failed to update profile",
    };
  }
}

/**
 * Change password via Clerk API
 */
export async function changePassword(passwordData: {
  currentPassword: string;
  newPassword: string;
}) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    // Note: Password changes are handled by Clerk
    // This function is a placeholder for the UI
    // Actual password changes should be done through Clerk's user profile
    
    return {
      success: false,
      message: "Password changes must be done through your account settings. Please use the Clerk user profile.",
    };
  } catch (error) {
    console.error("Error changing password:", error);
    return {
      success: false,
      message: "Failed to change password",
    };
  }
}
