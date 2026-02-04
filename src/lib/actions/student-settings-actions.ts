"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { z } from "zod";

// Validation schemas
const accountSettingsSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

const notificationSettingsSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  emailNotifications: z.boolean().optional(),
  assignmentReminders: z.boolean().optional(),
  examReminders: z.boolean().optional(),
  attendanceAlerts: z.boolean().optional(),
  feeReminders: z.boolean().optional(),
  eventNotifications: z.boolean().optional(),
  announcementNotifications: z.boolean().optional(),
  whatsappNotifications: z.boolean().optional(),
  whatsappOptIn: z.boolean().optional(),
  preferredLanguage: z.string().min(2, "Language code must be at least 2 characters").max(5, "Language code must be less than 5 characters").optional(),
});

const privacySettingsSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  profileVisibility: z.enum(["PUBLIC", "PRIVATE", "CLASSMATES_ONLY"]).optional(),
  showEmail: z.boolean().optional(),
  showPhone: z.boolean().optional(),
});

const appearanceSettingsSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]).optional(),
  language: z.string().optional(),
  dateFormat: z.string().optional(),
  timeFormat: z.enum(["TWELVE_HOUR", "TWENTY_FOUR_HOUR"]).optional(),
});

export async function getStudentSettings(studentId: string) {
  try {
    // Check if StudentSettings table exists by trying to query it
    const settings = await db.studentSettings.findUnique({
      where: {
        studentId: studentId
      }
    }).catch(() => null);

    // If no settings exist, create default settings
    if (!settings) {
      try {
        // Get required school context
        const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
        const schoolId = await getRequiredSchoolId();

        const defaultSettings = await db.studentSettings.create({
          data: {
            studentId: studentId,
            schoolId, // Add required schoolId
            emailNotifications: true,
            assignmentReminders: true,
            examReminders: true,
            attendanceAlerts: true,
            feeReminders: true,
            eventNotifications: true,
            announcementNotifications: true,
            whatsappNotifications: false,
            whatsappOptIn: false,
            profileVisibility: "PRIVATE",
            showEmail: false,
            showPhone: false,
            theme: "LIGHT",
            language: "en",
            dateFormat: "MM/DD/YYYY",
            timeFormat: "TWELVE_HOUR"
          }
        });
        return defaultSettings;
      } catch (createError) {
        // If table doesn't exist, return default values
        return {
          id: "",
          studentId: studentId,
          emailNotifications: true,
          assignmentReminders: true,
          examReminders: true,
          attendanceAlerts: true,
          feeReminders: true,
          eventNotifications: true,
          announcementNotifications: true,
          whatsappNotifications: false,
          whatsappOptIn: false,
          profileVisibility: "PRIVATE",
          showEmail: false,
          showPhone: false,
          theme: "LIGHT",
          language: "en",
          preferredLanguage: "en",
          dateFormat: "MM/DD/YYYY",
          timeFormat: "TWELVE_HOUR",
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
    }

    return settings;
  } catch (error) {
    console.error("Failed to fetch student settings:", error);
    // Return default settings if table doesn't exist
    return {
      id: "",
      studentId: studentId,
      emailNotifications: true,
      assignmentReminders: true,
      examReminders: true,
      attendanceAlerts: true,
      feeReminders: true,
      eventNotifications: true,
      announcementNotifications: true,
      whatsappNotifications: false,
      whatsappOptIn: false,
      profileVisibility: "PRIVATE",
      showEmail: false,
      showPhone: false,
      theme: "LIGHT",
      language: "en",
      preferredLanguage: "en",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "TWELVE_HOUR",
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

export async function updateAccountSettings(data: {
  studentId: string;
  email?: string;
  phone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}) {
  try {
    // Validate input
    const validated = accountSettingsSchema.parse(data);
    
    const session = await auth();
    
    if (!session?.user) {
      redirect("/login");
    }

    const dbUser = await db.user.findUnique({
      where: {
        id: session.user.id
      }
    });

    if (!dbUser) {
      redirect("/login");
    }

    const student = await db.student.findUnique({
      where: {
        id: validated.studentId
      }
    });

    if (!student || student.userId !== dbUser.id) {
      throw new Error("Unauthorized");
    }

    // Update student record
    await db.student.update({
      where: {
        id: validated.studentId
      },
      data: {
        phone: validated.phone,
        emergencyContact: validated.emergencyContact,
        emergencyPhone: validated.emergencyPhone
      }
    });

    // Update user email if provided
    if (validated.email) {
      await db.user.update({
        where: {
          id: student.userId
        },
        data: {
          email: validated.email
        }
      });
    }

    revalidatePath("/student/settings");
    return { success: true, message: "Account settings updated successfully" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error("Failed to update account settings:", error);
    return { success: false, message: "Failed to update account settings" };
  }
}

export async function updateNotificationSettings(data: {
  studentId: string;
  emailNotifications?: boolean;
  assignmentReminders?: boolean;
  examReminders?: boolean;
  attendanceAlerts?: boolean;
  feeReminders?: boolean;
  eventNotifications?: boolean;
  announcementNotifications?: boolean;
  whatsappNotifications?: boolean;
  whatsappOptIn?: boolean;
  preferredLanguage?: string;
}) {
  try {
    // Validate input
    const validated = notificationSettingsSchema.parse(data);
    
    const session = await auth();
    
    if (!session?.user) {
      redirect("/login");
    }

    const dbUser = await db.user.findUnique({
      where: {
        id: session.user.id
      }
    });

    if (!dbUser) {
      redirect("/login");
    }

    const student = await db.student.findUnique({
      where: {
        id: validated.studentId
      }
    });

    if (!student || student.userId !== dbUser.id) {
      throw new Error("Unauthorized");
    }

    await db.studentSettings.upsert({
      where: {
        studentId: validated.studentId
      },
      update: {
        emailNotifications: validated.emailNotifications,
        assignmentReminders: validated.assignmentReminders,
        examReminders: validated.examReminders,
        attendanceAlerts: validated.attendanceAlerts,
        feeReminders: validated.feeReminders,
        eventNotifications: validated.eventNotifications,
        announcementNotifications: validated.announcementNotifications,
        whatsappNotifications: validated.whatsappNotifications,
        whatsappOptIn: validated.whatsappOptIn,
        preferredLanguage: validated.preferredLanguage
      },
      create: {
        studentId: validated.studentId,
        emailNotifications: validated.emailNotifications ?? true,
        assignmentReminders: validated.assignmentReminders ?? true,
        examReminders: validated.examReminders ?? true,
        attendanceAlerts: validated.attendanceAlerts ?? true,
        feeReminders: validated.feeReminders ?? true,
        eventNotifications: validated.eventNotifications ?? true,
        announcementNotifications: validated.announcementNotifications ?? true,
        whatsappNotifications: validated.whatsappNotifications ?? false,
        whatsappOptIn: validated.whatsappOptIn ?? false,
        preferredLanguage: validated.preferredLanguage ?? "en",
        schoolId: student.schoolId, // Add required schoolId
      }
    });

    revalidatePath("/student/settings");
    return { success: true, message: "Notification settings updated successfully" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error("Failed to update notification settings:", error);
    return { success: false, message: "Failed to update notification settings" };
  }
}

export async function updatePrivacySettings(data: {
  studentId: string;
  profileVisibility?: "PUBLIC" | "PRIVATE" | "CLASSMATES_ONLY";
  showEmail?: boolean;
  showPhone?: boolean;
}) {
  try {
    // Validate input
    const validated = privacySettingsSchema.parse(data);
    
    const session = await auth();
    
    if (!session?.user) {
      redirect("/login");
    }

    const dbUser = await db.user.findUnique({
      where: {
        id: session.user.id
      }
    });

    if (!dbUser) {
      redirect("/login");
    }

    const student = await db.student.findUnique({
      where: {
        id: validated.studentId
      }
    });

    if (!student || student.userId !== dbUser.id) {
      throw new Error("Unauthorized");
    }

    await db.studentSettings.upsert({
      where: {
        studentId: validated.studentId
      },
      update: {
        profileVisibility: validated.profileVisibility,
        showEmail: validated.showEmail,
        showPhone: validated.showPhone
      },
      create: {
        studentId: validated.studentId,
        profileVisibility: validated.profileVisibility ?? "PRIVATE",
        showEmail: validated.showEmail ?? false,
        showPhone: validated.showPhone ?? false,
        schoolId: student.schoolId, // Add required schoolId
      }
    });

    revalidatePath("/student/settings");
    return { success: true, message: "Privacy settings updated successfully" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error("Failed to update privacy settings:", error);
    return { success: false, message: "Failed to update privacy settings" };
  }
}

export async function updateAppearanceSettings(data: {
  studentId: string;
  theme?: "LIGHT" | "DARK" | "SYSTEM";
  language?: string;
  dateFormat?: string;
  timeFormat?: "TWELVE_HOUR" | "TWENTY_FOUR_HOUR";
}) {
  try {
    // Validate input
    const validated = appearanceSettingsSchema.parse(data);
    
    const session = await auth();
    
    if (!session?.user) {
      redirect("/login");
    }

    const dbUser = await db.user.findUnique({
      where: {
        id: session.user.id
      }
    });

    if (!dbUser) {
      redirect("/login");
    }

    const student = await db.student.findUnique({
      where: {
        id: validated.studentId
      }
    });

    if (!student || student.userId !== dbUser.id) {
      throw new Error("Unauthorized");
    }

    await db.studentSettings.upsert({
      where: {
        studentId: validated.studentId
      },
      update: {
        theme: validated.theme,
        language: validated.language,
        dateFormat: validated.dateFormat,
        timeFormat: validated.timeFormat
      },
      create: {
        studentId: validated.studentId,
        theme: validated.theme ?? "LIGHT",
        language: validated.language ?? "en",
        dateFormat: validated.dateFormat ?? "MM/DD/YYYY",
        timeFormat: validated.timeFormat ?? "TWELVE_HOUR",
        schoolId: student.schoolId, // Add required schoolId
      }
    });

    revalidatePath("/student/settings");
    return { success: true, message: "Appearance settings updated successfully" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error("Failed to update appearance settings:", error);
    return { success: false, message: "Failed to update appearance settings" };
  }
}
