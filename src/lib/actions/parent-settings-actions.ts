"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  getSettingsSchema,
  updateProfileSchema,
  changePasswordSchema,
  updateNotificationPreferencesSchema,
  avatarUrlSchema,
  type GetSettingsInput,
  type UpdateProfileInput,
  type ChangePasswordInput,
  type UpdateNotificationPreferencesInput,
  type AvatarUrlInput,
} from "@/lib/schemaValidation/parent-settings-schemas";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { checkRateLimit, RateLimitPresets } from "@/lib/utils/rate-limit";
import { validateImageFile } from "@/lib/utils/file-security";
import { CACHE_TAGS } from "@/lib/utils/cache";

/**
 * Helper function to get current parent and verify authentication
 */
async function getCurrentParent() {
  const session = await auth();
  
  if (!session?.user) {
    return null;
  }
  
  const dbUser = await db.user.findUnique({
    where: {
      id: session.user.id
    },
    include: {
      parent: true
    }
  });
  
  if (!dbUser || dbUser.role !== UserRole.PARENT || !dbUser.parent) {
    return null;
  }
  
  return { user: dbUser, parent: dbUser.parent };
}

/**
 * Get settings for a parent including profile and preferences
 * Requirements: 6.1, 6.2, 6.3
 * Cached for 10 minutes (600 seconds) as per requirements 9.5
 */
export async function getSettings(input?: GetSettingsInput) {
  try {
    // Get current parent
    const parentData = await getCurrentParent();
    if (!parentData) {
      return { success: false, message: "Unauthorized" };
    }
    
    const { user, parent } = parentData;
    
    // If parentId is provided, verify it matches current parent
    if (input?.parentId && input.parentId !== parent.id) {
      return { success: false, message: "Access denied" };
    }
    
    // Cached function to fetch settings data
    const getCachedSettingsData = unstable_cache(
      async (parentId: string) => {
        // Get or create parent settings
        let settings = await db.parentSettings.findUnique({
          where: { parentId }
        });
        
        // Create default settings if they don't exist
        if (!settings) {
          settings = await db.parentSettings.create({
            data: {
              parentId
            }
          });
        }
        
        // Get parent profile with user data
        const profile = await db.parent.findUnique({
          where: { id: parentId },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                avatar: true
              }
            }
          }
        });
        
        return { settings, profile };
      },
      [`parent-settings-${parent.id}`],
      {
        tags: [CACHE_TAGS.SETTINGS, CACHE_TAGS.PARENTS, `parent-${parent.id}`],
        revalidate: 600 // 10 minutes
      }
    );
    
    const { settings, profile } = await getCachedSettingsData(parent.id);
    
    if (!profile) {
      return { success: false, message: "Profile not found" };
    }
    
    return {
      success: true,
      data: {
        profile: {
          id: profile.id,
          userId: profile.userId,
          user: profile.user,
          occupation: profile.occupation,
          alternatePhone: profile.alternatePhone,
          relation: profile.relation,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt
        },
        settings: {
          id: settings.id,
          parentId: settings.parentId,
          emailNotifications: settings.emailNotifications,
          smsNotifications: settings.smsNotifications,
          pushNotifications: settings.pushNotifications,
          whatsappNotifications: settings.whatsappNotifications,
          feeReminders: settings.feeReminders,
          attendanceAlerts: settings.attendanceAlerts,
          examResultNotifications: settings.examResultNotifications,
          announcementNotifications: settings.announcementNotifications,
          meetingReminders: settings.meetingReminders,
          preferredContactMethod: settings.preferredContactMethod,
          notificationFrequency: settings.notificationFrequency,
          whatsappOptIn: settings.whatsappOptIn,
          whatsappNumber: settings.whatsappNumber,
          preferredLanguage: settings.preferredLanguage,
          profileVisibility: settings.profileVisibility,
          theme: settings.theme,
          language: settings.language,
          createdAt: settings.createdAt,
          updatedAt: settings.updatedAt
        }
      }
    };
  } catch (error) {
    console.error("Error fetching settings:", error);
    return { success: false, message: "Unable to load your settings. Please refresh the page or try again later." };
  }
}


/**
 * Update parent profile information
 * Requirements: 6.1, 6.2
 */
export async function updateProfile(input: UpdateProfileInput) {
  try {
    // Validate input
    const validated = updateProfileSchema.parse(input);
    
    // Get current parent
    const parentData = await getCurrentParent();
    if (!parentData) {
      return { success: false, message: "Unauthorized" };
    }
    
    const { user, parent } = parentData;
    
    // Prepare update data for User table
    const userUpdateData: any = {};
    if (validated.firstName !== undefined) userUpdateData.firstName = validated.firstName;
    if (validated.lastName !== undefined) userUpdateData.lastName = validated.lastName;
    if (validated.email !== undefined) userUpdateData.email = validated.email;
    if (validated.phone !== undefined) userUpdateData.phone = validated.phone;
    
    // Prepare update data for Parent table
    const parentUpdateData: any = {};
    if (validated.alternatePhone !== undefined) parentUpdateData.alternatePhone = validated.alternatePhone;
    if (validated.occupation !== undefined) parentUpdateData.occupation = validated.occupation;
    if (validated.relation !== undefined) parentUpdateData.relation = validated.relation;
    
    // Update user in database
    if (Object.keys(userUpdateData).length > 0) {
      await db.user.update({
        where: { id: user.id },
        data: userUpdateData
      });
    }
    
    // Update parent in database
    if (Object.keys(parentUpdateData).length > 0) {
      await db.parent.update({
        where: { id: parent.id },
        data: parentUpdateData
      });
    }
    
    // Invalidate cache and revalidate settings page
    revalidateTag(CACHE_TAGS.SETTINGS, "default");
    revalidateTag(CACHE_TAGS.PARENTS, "default");
    revalidateTag(`parent-${parent.id}`, "default");
    revalidatePath("/parent/settings");
    
    return {
      success: true,
      message: "Profile updated successfully"
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    if (error instanceof Error && error.message.includes("validation")) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Unable to update your profile. Please check your information and try again." };
  }
}


/**
 * Change parent password via NextAuth
 * Requirements: 6.4
 */
export async function changePassword(input: ChangePasswordInput) {
  try {
    // Validate input
    const validated = changePasswordSchema.parse(input);
    
    // Get current parent
    const parentData = await getCurrentParent();
    if (!parentData) {
      return { success: false, message: "Unauthorized" };
    }
    
    const { user } = parentData;
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(validated.currentPassword, user.password || "");
    if (!isValidPassword) {
      return { success: false, message: "Current password is incorrect" };
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(validated.newPassword, 10);
    
    // Update password in database
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    
    return {
      success: true,
      message: "Password changed successfully"
    };
  } catch (error) {
    console.error("Error changing password:", error);
    if (error instanceof Error && error.message.includes("validation")) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unexpected error occurred while changing your password. Please try again or contact support if the problem persists." };
  }
}


/**
 * Update notification preferences for all notification types
 * Requirements: 6.3
 */
export async function updateNotificationPreferences(input: UpdateNotificationPreferencesInput) {
  try {
    // Validate input
    const validated = updateNotificationPreferencesSchema.parse(input);
    
    // Get current parent
    const parentData = await getCurrentParent();
    if (!parentData) {
      return { success: false, message: "Unauthorized" };
    }
    
    const { parent } = parentData;
    
    // Get or create parent settings
    let settings = await db.parentSettings.findUnique({
      where: { parentId: parent.id }
    });
    
    if (!settings) {
      // Create default settings first
      settings = await db.parentSettings.create({
        data: {
          parentId: parent.id
        }
      });
    }
    
    // Prepare update data
    const updateData: any = {};
    if (validated.emailNotifications !== undefined) updateData.emailNotifications = validated.emailNotifications;
    if (validated.smsNotifications !== undefined) updateData.smsNotifications = validated.smsNotifications;
    if (validated.pushNotifications !== undefined) updateData.pushNotifications = validated.pushNotifications;
    if (validated.whatsappNotifications !== undefined) updateData.whatsappNotifications = validated.whatsappNotifications;
    if (validated.feeReminders !== undefined) updateData.feeReminders = validated.feeReminders;
    if (validated.attendanceAlerts !== undefined) updateData.attendanceAlerts = validated.attendanceAlerts;
    if (validated.examResultNotifications !== undefined) updateData.examResultNotifications = validated.examResultNotifications;
    if (validated.announcementNotifications !== undefined) updateData.announcementNotifications = validated.announcementNotifications;
    if (validated.meetingReminders !== undefined) updateData.meetingReminders = validated.meetingReminders;
    if (validated.preferredContactMethod !== undefined) updateData.preferredContactMethod = validated.preferredContactMethod;
    if (validated.notificationFrequency !== undefined) updateData.notificationFrequency = validated.notificationFrequency;
    if (validated.whatsappOptIn !== undefined) updateData.whatsappOptIn = validated.whatsappOptIn;
    if (validated.whatsappNumber !== undefined) updateData.whatsappNumber = validated.whatsappNumber;
    if (validated.preferredLanguage !== undefined) updateData.preferredLanguage = validated.preferredLanguage;
    
    // Update settings
    if (Object.keys(updateData).length > 0) {
      await db.parentSettings.update({
        where: { parentId: parent.id },
        data: updateData
      });
    }
    
    // Invalidate cache and revalidate settings page
    revalidateTag(CACHE_TAGS.SETTINGS, "default");
    revalidateTag(CACHE_TAGS.PARENTS, "default");
    revalidateTag(`parent-${parent.id}`, "default");
    revalidatePath("/parent/settings");
    
    return {
      success: true,
      message: "Notification preferences updated successfully"
    };
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    if (error instanceof Error && error.message.includes("validation")) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Unable to update your notification preferences. Please try again." };
  }
}


/**
 * Upload avatar with file validation and Cloudinary upload
 * Requirements: 6.5, 10.1, 10.2, 10.4
 */
export async function uploadAvatar(formData: FormData) {
  try {
    // Get current parent
    const parentData = await getCurrentParent();
    if (!parentData) {
      return { success: false, message: "Unauthorized" };
    }
    
    const { user } = parentData;
    
    // Rate limiting for file uploads
    const rateLimitKey = `file-upload:${user.id}`;
    const rateLimitResult = checkRateLimit(rateLimitKey, RateLimitPresets.FILE_UPLOAD);
    if (!rateLimitResult) {
      return { success: false, message: "Too many upload requests. Please try again later." };
    }
    
    // Extract file from FormData
    const file = formData.get("file") as File;
    
    if (!file) {
      return { success: false, message: "No file provided" };
    }
    
    // Validate file using security utility
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, message: validation.error || "Invalid file" };
    }
    
    // Upload to Cloudinary
    try {
      const uploadResult = await uploadToCloudinary(file, {
        folder: `parents/${user.id}/avatar`,
        resource_type: "image"
      });
      
      const avatarUrl = uploadResult.secure_url;
      
      // Update user avatar in database
      await db.user.update({
        where: { id: user.id },
        data: { avatar: avatarUrl }
      });
      
      // Invalidate cache and revalidate settings page
      revalidateTag(CACHE_TAGS.SETTINGS, "default");
      revalidateTag(CACHE_TAGS.PARENTS, "default");
      revalidateTag(CACHE_TAGS.USERS, "default");
      revalidatePath("/parent/settings");
      
      return {
        success: true,
        data: {
          avatarUrl
        },
        message: "Avatar uploaded successfully"
      };
    } catch (uploadError) {
      console.error("Error uploading to Cloudinary:", uploadError);
      return { success: false, message: "Unable to upload your profile picture. Please check your internet connection and try again." };
    }
  } catch (error) {
    console.error("Error uploading avatar:", error);
    if (error instanceof Error && error.message.includes("validation")) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unexpected error occurred while uploading your profile picture. Please try again." };
  }
}


/**
 * Update avatar URL directly (when avatar is already uploaded)
 * Requirements: 6.5
 */
export async function updateAvatarUrl(input: AvatarUrlInput) {
  try {
    // Validate input
    const validated = avatarUrlSchema.parse(input);
    
    // Get current parent
    const parentData = await getCurrentParent();
    if (!parentData) {
      return { success: false, message: "Unauthorized" };
    }
    
    const { user } = parentData;
    
    // Update user avatar in database
    await db.user.update({
      where: { id: user.id },
      data: { avatar: validated.avatarUrl }
    });
    
    // Invalidate cache and revalidate settings page
    revalidateTag(CACHE_TAGS.SETTINGS, "default");
    revalidateTag(CACHE_TAGS.PARENTS, "default");
    revalidateTag(CACHE_TAGS.USERS, "default");
    revalidatePath("/parent/settings");
    
    return {
      success: true,
      data: {
        avatarUrl: validated.avatarUrl
      },
      message: "Avatar updated successfully"
    };
  } catch (error) {
    console.error("Error updating avatar URL:", error);
    if (error instanceof Error && error.message.includes("validation")) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Unable to update your profile picture. Please try again." };
  }
}


/**
 * Remove avatar (set to null)
 * Requirements: 6.5, 7.4
 */
export async function removeAvatar() {
  try {
    // Get current parent
    const parentData = await getCurrentParent();
    if (!parentData) {
      return { success: false, message: "Unauthorized" };
    }
    
    const { user } = parentData;
    
    // Update user avatar to null in database
    await db.user.update({
      where: { id: user.id },
      data: { avatar: null }
    });
    
    // Invalidate cache and revalidate settings page
    revalidateTag(CACHE_TAGS.SETTINGS, "default");
    revalidateTag(CACHE_TAGS.PARENTS, "default");
    revalidateTag(CACHE_TAGS.USERS, "default");
    revalidatePath("/parent/settings");
    
    return {
      success: true,
      message: "Avatar removed successfully"
    };
  } catch (error) {
    console.error("Error removing avatar:", error);
    if (error instanceof Error && error.message.includes("validation")) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Unable to remove your profile picture. Please try again." };
  }
}
