import { z } from "zod";

export const generalSettingsSchema = z.object({
  schoolName: z.string().min(1, "School name is required"),
  schoolEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  schoolPhone: z.string().optional(),
  schoolAddress: z.string().optional(),
  schoolWebsite: z.string().url("Invalid URL").optional().or(z.literal("")),
  schoolFax: z.string().optional(),
  timezone: z.string().min(1, "Timezone is required"),
});

export const academicSettingsSchema = z.object({
  currentAcademicYear: z.string().optional(),
  currentTerm: z.string().optional(),
  gradingSystem: z.enum(["percentage", "gpa", "letter"]),
  passingGrade: z.number().min(0).max(100),
  autoAttendance: z.boolean(),
  lateArrivalThreshold: z.number().min(1).max(60),
});

export const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  notifyEnrollment: z.boolean(),
  notifyPayment: z.boolean(),
  notifyAttendance: z.boolean(),
  notifyExamResults: z.boolean(),
  notifyLeaveApps: z.boolean(),
});

export const securitySettingsSchema = z.object({
  twoFactorAuth: z.boolean(),
  sessionTimeout: z.number().min(5).max(120),
  passwordExpiry: z.number().min(30).max(365),
  autoBackup: z.boolean(),
  backupFrequency: z.enum(["hourly", "daily", "weekly"]),
});

export const appearanceSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  primaryColor: z.string(),
  language: z.enum(["en", "es", "fr", "de"]),
  dateFormat: z.enum(["mdy", "dmy", "ymd"]),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
});

export type GeneralSettings = z.infer<typeof generalSettingsSchema>;
export type AcademicSettings = z.infer<typeof academicSettingsSchema>;
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;
export type SecuritySettings = z.infer<typeof securitySettingsSchema>;
export type AppearanceSettings = z.infer<typeof appearanceSettingsSchema>;
