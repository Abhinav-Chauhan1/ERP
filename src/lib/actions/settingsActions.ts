"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Get system settings (creates default if doesn't exist)
export async function getSystemSettings() {
  try {
    let settings = await db.systemSettings.findFirst();
    
    // Create default settings if none exist
    if (!settings) {
      settings = await db.systemSettings.create({
        data: {
          schoolName: "School Name",
          timezone: "UTC",
          gradingSystem: "percentage",
          passingGrade: 50,
          emailNotifications: true,
          theme: "light",
          language: "en",
        },
      });
    }
    
    return { success: true, data: settings };
  } catch (error) {
    console.error("Error fetching system settings:", error);
    return { success: false, error: "Failed to fetch system settings" };
  }
}

// Update general settings
export async function updateGeneralSettings(data: {
  schoolName: string;
  schoolEmail?: string;
  schoolPhone?: string;
  schoolAddress?: string;
  schoolWebsite?: string;
  schoolFax?: string;
  timezone: string;
}) {
  try {
    const settings = await db.systemSettings.findFirst();
    
    if (!settings) {
      return { success: false, error: "Settings not found" };
    }
    
    const updated = await db.systemSettings.update({
      where: { id: settings.id },
      data: {
        schoolName: data.schoolName,
        schoolEmail: data.schoolEmail,
        schoolPhone: data.schoolPhone,
        schoolAddress: data.schoolAddress,
        schoolWebsite: data.schoolWebsite,
        schoolFax: data.schoolFax,
        timezone: data.timezone,
      },
    });
    
    revalidatePath("/admin/settings");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating general settings:", error);
    return { success: false, error: "Failed to update general settings" };
  }
}

// Update academic settings
export async function updateAcademicSettings(data: {
  currentAcademicYear?: string;
  currentTerm?: string;
  gradingSystem: string;
  passingGrade: number;
  autoAttendance: boolean;
  lateArrivalThreshold: number;
}) {
  try {
    const settings = await db.systemSettings.findFirst();
    
    if (!settings) {
      return { success: false, error: "Settings not found" };
    }
    
    const updated = await db.systemSettings.update({
      where: { id: settings.id },
      data: {
        currentAcademicYear: data.currentAcademicYear,
        currentTerm: data.currentTerm,
        gradingSystem: data.gradingSystem,
        passingGrade: data.passingGrade,
        autoAttendance: data.autoAttendance,
        lateArrivalThreshold: data.lateArrivalThreshold,
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
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  notifyEnrollment: boolean;
  notifyPayment: boolean;
  notifyAttendance: boolean;
  notifyExamResults: boolean;
  notifyLeaveApps: boolean;
}) {
  try {
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
    console.error("Error updating notification settings:", error);
    return { success: false, error: "Failed to update notification settings" };
  }
}

// Update security settings
export async function updateSecuritySettings(data: {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
  autoBackup: boolean;
  backupFrequency: string;
}) {
  try {
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
  theme: string;
  primaryColor: string;
  language: string;
  dateFormat: string;
  logoUrl?: string;
  faviconUrl?: string;
}) {
  try {
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
    console.error("Error updating appearance settings:", error);
    return { success: false, error: "Failed to update appearance settings" };
  }
}

// Trigger manual backup
export async function triggerBackup() {
  try {
    // TODO: Implement actual backup logic
    // This would typically involve:
    // 1. Creating a database dump
    // 2. Uploading to cloud storage (S3, etc.)
    // 3. Logging the backup
    
    return { success: true, message: "Backup initiated successfully" };
  } catch (error) {
    console.error("Error triggering backup:", error);
    return { success: false, error: "Failed to trigger backup" };
  }
}
