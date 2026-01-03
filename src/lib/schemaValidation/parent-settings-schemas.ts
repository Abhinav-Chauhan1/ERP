import { z } from "zod";

// Get Settings Schema
export const getSettingsSchema = z.object({
  parentId: z.string().min(1, "Parent ID is required"),
});

export type GetSettingsInput = z.infer<typeof getSettingsSchema>;

// Update Profile Schema
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name must be less than 50 characters").optional(),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name must be less than 50 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number").optional().nullable(),
  alternatePhone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid alternate phone number").optional().nullable(),
  occupation: z.string().max(100, "Occupation must be less than 100 characters").optional().nullable(),
  relation: z.string().max(50, "Relation must be less than 50 characters").optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// Change Password Schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string().min(8, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// Update Notification Preferences Schema
export const updateNotificationPreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  whatsappNotifications: z.boolean().optional(),
  feeReminders: z.boolean().optional(),
  attendanceAlerts: z.boolean().optional(),
  examResultNotifications: z.boolean().optional(),
  announcementNotifications: z.boolean().optional(),
  meetingReminders: z.boolean().optional(),
  preferredContactMethod: z.enum(["EMAIL", "SMS", "WHATSAPP", "EMAIL_AND_SMS", "EMAIL_AND_WHATSAPP", "SMS_AND_WHATSAPP", "ALL", "BOTH"]).optional(),
  notificationFrequency: z.enum(["IMMEDIATE", "DAILY_DIGEST", "WEEKLY_DIGEST"]).optional(),
  whatsappOptIn: z.boolean().optional(),
  whatsappNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid WhatsApp number format. Use E.164 format (e.g., +919876543210)").optional().nullable(),
  preferredLanguage: z.string().min(2, "Language code must be at least 2 characters").max(5, "Language code must be less than 5 characters").optional(),
}).refine((data) => {
  // Validate that WhatsApp number is provided if WhatsApp is selected as contact method
  const whatsappSelected = data.preferredContactMethod === "WHATSAPP" || 
                           data.preferredContactMethod === "EMAIL_AND_WHATSAPP" || 
                           data.preferredContactMethod === "SMS_AND_WHATSAPP" || 
                           data.preferredContactMethod === "ALL";
  
  if (whatsappSelected && !data.whatsappNumber) {
    return false;
  }
  return true;
}, {
  message: "WhatsApp number is required when WhatsApp is selected as a contact method",
  path: ["whatsappNumber"],
});

export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>;

// Update Privacy Settings Schema
export const updatePrivacySettingsSchema = z.object({
  profileVisibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
});

export type UpdatePrivacySettingsInput = z.infer<typeof updatePrivacySettingsSchema>;

// Update Appearance Settings Schema
export const updateAppearanceSettingsSchema = z.object({
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]).optional(),
  language: z.string().min(2, "Language code must be at least 2 characters").max(5, "Language code must be less than 5 characters").optional(),
});

export type UpdateAppearanceSettingsInput = z.infer<typeof updateAppearanceSettingsSchema>;

// Upload Avatar Schema
export const uploadAvatarSchema = z.object({
  file: z.instanceof(File, { message: "File is required" })
    .refine((file) => file.size <= 5 * 1024 * 1024, "File size must be less than 5MB")
    .refine(
      (file) => ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type),
      "File must be a JPEG, PNG, or WebP image"
    ),
});

export type UploadAvatarInput = z.infer<typeof uploadAvatarSchema>;

// Avatar URL Schema (for when avatar is already uploaded)
export const avatarUrlSchema = z.object({
  avatarUrl: z.string().url("Invalid avatar URL"),
});

export type AvatarUrlInput = z.infer<typeof avatarUrlSchema>;
