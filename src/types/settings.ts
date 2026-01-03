// Enum types matching Prisma schema
import { ContactMethod as PrismaContactMethod } from "@prisma/client";
export type ContactMethod = PrismaContactMethod | "ALL";
export type NotificationFrequency = "IMMEDIATE" | "DAILY_DIGEST" | "WEEKLY_DIGEST";
export type ProfileVisibility = "PUBLIC" | "PRIVATE" | "CLASSMATES_ONLY";
export type Theme = "LIGHT" | "DARK" | "SYSTEM";

export interface ParentSettingsData {
  id: string;
  parentId: string;

  // Notification preferences
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  feeReminders: boolean;
  attendanceAlerts: boolean;
  examResultNotifications: boolean;
  announcementNotifications: boolean;
  meetingReminders: boolean;

  // Communication preferences
  preferredContactMethod: ContactMethod;
  notificationFrequency: NotificationFrequency;

  // Privacy settings
  profileVisibility: ProfileVisibility;

  // WhatsApp settings
  whatsappNotifications: boolean;
  whatsappOptIn: boolean;
  whatsappNumber: string | null;

  // Appearance settings
  theme: Theme;
  language: string;
  preferredLanguage: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface ParentProfileData {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    avatar: string | null;
  };
  occupation: string | null;
  alternatePhone: string | null;
  relation: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferencesUpdate {
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  feeReminders?: boolean;
  attendanceAlerts?: boolean;
  examResultNotifications?: boolean;
  announcementNotifications?: boolean;
  meetingReminders?: boolean;
  preferredContactMethod?: ContactMethod;
  notificationFrequency?: NotificationFrequency;
}

export interface PrivacySettingsUpdate {
  profileVisibility?: ProfileVisibility;
}

export interface AppearanceSettingsUpdate {
  theme?: Theme;
  language?: string;
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  alternatePhone?: string | null;
  occupation?: string | null;
  relation?: string | null;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export interface AvatarUploadData {
  avatarUrl: string;
}

export interface SettingsActionResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}
