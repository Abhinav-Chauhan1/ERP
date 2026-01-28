"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sanitizeText, sanitizeEmail, sanitizePhoneNumber, sanitizeUrl } from "@/lib/utils/input-sanitization";

// Get system settings (creates default if doesn't exist)
export async function getSystemSettings() {
  try {
    // Authentication check
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get user and verify admin role
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { administrator: true },
    });

    if (!user || (!user.administrator && user.role !== "SUPER_ADMIN")) {
      return { success: false, error: "Unauthorized - Admin access required" };
    }

    let settings = await db.systemSettings.findFirst();

    // Create default settings if none exist
    if (!settings) {
      settings = await db.systemSettings.create({
        data: {
          schoolName: "School Name",
          timezone: "UTC",
          defaultGradingScale: "PERCENTAGE",
          passingGrade: 50,
          emailEnabled: true,
          defaultTheme: "LIGHT",
          language: "en",
          // Payment Configuration defaults
          enableOfflineVerification: true,
          enableOnlinePayment: false,
          maxReceiptSizeMB: 5,
          allowedReceiptFormats: "jpg,jpeg,png,pdf",
          autoNotifyOnVerification: true,
        },
      });
    }

    return { success: true, data: settings };
  } catch (error) {
    console.error("Error fetching system settings:", error);
    return { success: false, error: "Failed to fetch system settings" };
  }
}

// Get system settings without authentication (for public use in layouts)
export async function getPublicSystemSettings() {
  try {
    let settings = await db.systemSettings.findFirst();

    // Create default settings if none exist
    if (!settings) {
      settings = await db.systemSettings.create({
        data: {
          schoolName: "School Name",
          timezone: "UTC",
          defaultGradingScale: "PERCENTAGE",
          passingGrade: 50,
          emailEnabled: true,
          defaultTheme: "LIGHT",
          language: "en",
          // Payment Configuration defaults
          enableOfflineVerification: true,
          enableOnlinePayment: false,
          maxReceiptSizeMB: 5,
          allowedReceiptFormats: "jpg,jpeg,png,pdf",
          autoNotifyOnVerification: true,
        },
      });
    }

    return { success: true, data: settings };
  } catch (error) {
    console.error("Error fetching system settings:", error);
    return { success: false, error: "Failed to fetch system settings" };
  }
}

// Update school information
export async function updateSchoolInfo(data: {
  schoolName: string;
  schoolEmail?: string;
  schoolPhone?: string;
  schoolAddress?: string;
  schoolWebsite?: string;
  schoolFax?: string;
  timezone: string;
  schoolLogo?: string;
  tagline?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  affiliationNumber?: string;
  schoolCode?: string;
  board?: string;
}) {
  try {
    // Authentication check
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get user and verify admin role
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { administrator: true },
    });

    if (!user || (!user.administrator && user.role !== "SUPER_ADMIN")) {
      return { success: false, error: "Unauthorized - Admin access required" };
    }

    const settings = await db.systemSettings.findFirst();

    if (!settings) {
      return { success: false, error: "Settings not found" };
    }

    // Sanitize inputs
    const sanitizedData = {
      schoolName: sanitizeText(data.schoolName),
      schoolEmail: data.schoolEmail ? sanitizeEmail(data.schoolEmail) : undefined,
      schoolPhone: data.schoolPhone ? sanitizePhoneNumber(data.schoolPhone) : undefined,
      schoolAddress: data.schoolAddress ? sanitizeText(data.schoolAddress) : undefined,
      schoolWebsite: data.schoolWebsite ? sanitizeUrl(data.schoolWebsite) : undefined,
      schoolFax: data.schoolFax ? sanitizePhoneNumber(data.schoolFax) : undefined,
      timezone: sanitizeText(data.timezone),
      schoolLogo: data.schoolLogo ? sanitizeUrl(data.schoolLogo) : undefined,
      tagline: data.tagline ? sanitizeText(data.tagline) : undefined,
      facebookUrl: data.facebookUrl ? sanitizeUrl(data.facebookUrl) : undefined,
      twitterUrl: data.twitterUrl ? sanitizeUrl(data.twitterUrl) : undefined,
      linkedinUrl: data.linkedinUrl ? sanitizeUrl(data.linkedinUrl) : undefined,
      instagramUrl: data.instagramUrl ? sanitizeUrl(data.instagramUrl) : undefined,
      affiliationNumber: data.affiliationNumber ? sanitizeText(data.affiliationNumber) : undefined,
      schoolCode: data.schoolCode ? sanitizeText(data.schoolCode) : undefined,
      board: data.board ? sanitizeText(data.board) : undefined,
    };

    const updated = await db.systemSettings.update({
      where: { id: settings.id },
      data: sanitizedData,
    });

    revalidatePath("/admin/settings");
    revalidatePath("/", "layout");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating school info:", error);
    return { success: false, error: "Failed to update school information" };
  }
}

// Legacy function for backward compatibility
export async function updateGeneralSettings(data: {
  schoolName: string;
  schoolEmail?: string;
  schoolPhone?: string;
  schoolAddress?: string;
  schoolWebsite?: string;
  schoolFax?: string;
  timezone: string;
}) {
  return updateSchoolInfo(data);
}

// Update academic settings
export async function updateAcademicSettings(data: {
  currentAcademicYear?: string;
  currentTerm?: string;
  defaultGradingScale: string;
  passingGrade: number;
  autoAttendance: boolean;
  lateArrivalMinutes: number;
  attendanceThreshold: number;
}) {
  try {
    // Authentication check
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get user and verify admin role
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { administrator: true },
    });

    if (!user || (!user.administrator && user.role !== "SUPER_ADMIN")) {
      return { success: false, error: "Unauthorized - Admin access required" };
    }

    const settings = await db.systemSettings.findFirst();

    if (!settings) {
      return { success: false, error: "Settings not found" };
    }

    const updated = await db.systemSettings.update({
      where: { id: settings.id },
      data: {
        currentAcademicYear: data.currentAcademicYear,
        currentTerm: data.currentTerm,
        defaultGradingScale: data.defaultGradingScale,
        passingGrade: data.passingGrade,
        autoAttendance: data.autoAttendance,
        lateArrivalMinutes: data.lateArrivalMinutes,
        attendanceThreshold: data.attendanceThreshold,
      },
    });

    revalidatePath("/admin/settings");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating academic settings:", error);
    return { success: false, error: "Failed to update academic settings" };
  }
}

// Update notification settings
export async function updateNotificationSettings(data: {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  notifyEnrollment: boolean;
  notifyPayment: boolean;
  notifyAttendance: boolean;
  notifyExamResults: boolean;
  notifyLeaveApps: boolean;
  // New granular settings
  enrollmentNotificationChannels?: string[];
  paymentNotificationChannels?: string[];
  attendanceNotificationChannels?: string[];
  examResultNotificationChannels?: string[];
  leaveAppNotificationChannels?: string[];
}) {
  try {
    // Authentication check
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get user and verify admin role
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { administrator: true },
    });

    if (!user || (!user.administrator && user.role !== "SUPER_ADMIN")) {
      return { success: false, error: "Unauthorized - Admin access required" };
    }

    const settings = await db.systemSettings.findFirst();

    if (!settings) {
      return { success: false, error: "Settings not found" };
    }

    const updated = await db.systemSettings.update({
      where: { id: settings.id },
      data: {
        emailEnabled: data.emailEnabled,
        smsEnabled: data.smsEnabled,
        pushEnabled: data.pushEnabled, // Kept for backward compatibility
        notifyEnrollment: data.notifyEnrollment,
        notifyPayment: data.notifyPayment,
        notifyAttendance: data.notifyAttendance,
        notifyExamResults: data.notifyExamResults,
        notifyLeaveApps: data.notifyLeaveApps,
        // Update new granular fields if provided
        enrollmentNotificationChannels: data.enrollmentNotificationChannels,
        paymentNotificationChannels: data.paymentNotificationChannels,
        attendanceNotificationChannels: data.attendanceNotificationChannels,
        examResultNotificationChannels: data.examResultNotificationChannels,
        leaveAppNotificationChannels: data.leaveAppNotificationChannels,
      },
    });

    revalidatePath("/admin/settings");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return { success: false, error: "Failed to update notification settings" };
  }
}

// Update security settings
export async function updateSecuritySettings(data: {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
  passwordMinLength: number;
  passwordRequireSpecialChar: boolean;
  passwordRequireNumber: boolean;
  passwordRequireUppercase: boolean;
  autoBackup: boolean;
  backupFrequency: string;
}) {
  try {
    // Authentication check
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get user and verify admin role
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { administrator: true },
    });

    if (!user || (!user.administrator && user.role !== "SUPER_ADMIN")) {
      return { success: false, error: "Unauthorized - Admin access required" };
    }

    const settings = await db.systemSettings.findFirst();

    if (!settings) {
      return { success: false, error: "Settings not found" };
    }

    const updated = await db.systemSettings.update({
      where: { id: settings.id },
      data,
    });

    revalidatePath("/admin/settings");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating security settings:", error);
    return { success: false, error: "Failed to update security settings" };
  }
}

// Update appearance settings
export async function updateAppearanceSettings(data: {
  defaultTheme: string;
  defaultColorTheme: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  language: string;
  dateFormat: string;
  logoUrl?: string;
  faviconUrl?: string;
  emailLogo?: string;
  emailFooter?: string;
  emailSignature?: string;
  letterheadLogo?: string;
  letterheadText?: string;
  documentFooter?: string;
}) {
  try {
    // Authentication check
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get user and verify admin role
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { administrator: true },
    });

    if (!user || (!user.administrator && user.role !== "SUPER_ADMIN")) {
      return { success: false, error: "Unauthorized - Admin access required" };
    }

    const settings = await db.systemSettings.findFirst();

    if (!settings) {
      return { success: false, error: "Settings not found" };
    }

    const updated = await db.systemSettings.update({
      where: { id: settings.id },
      data,
    });

    revalidatePath("/admin/settings");
    revalidatePath("/", "layout");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating appearance settings:", error);
    return { success: false, error: "Failed to update appearance settings" };
  }
}

// Trigger manual backup
export async function triggerBackup() {
  try {
    // Authentication check
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get user and verify admin role
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { administrator: true },
    });

    if (!user || (!user.administrator && user.role !== "SUPER_ADMIN")) {
      return { success: false, error: "Unauthorized - Admin access required" };
    }

    // Import and call the backup service
    const { createBackup } = await import("@/lib/utils/backup-service");
    const backupResult = await createBackup(false, "manual");

    if (!backupResult.success) {
      return { success: false, error: backupResult.error || "Failed to create backup" };
    }

    return {
      success: true,
      message: "Backup initiated successfully",
      data: {
        filename: backupResult.metadata?.filename,
        size: backupResult.metadata?.size,
      }
    };
  } catch (error) {
    console.error("Error triggering backup:", error);
    return { success: false, error: "Failed to trigger backup" };
  }
}
