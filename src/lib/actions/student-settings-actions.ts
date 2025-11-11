"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

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
        const defaultSettings = await db.studentSettings.create({
          data: {
            studentId: studentId,
            emailNotifications: true,
            assignmentReminders: true,
            examReminders: true,
            attendanceAlerts: true,
            feeReminders: true,
            eventNotifications: true,
            announcementNotifications: true,
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
          profileVisibility: "PRIVATE",
          showEmail: false,
          showPhone: false,
          theme: "LIGHT",
          language: "en",
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
      profileVisibility: "PRIVATE",
      showEmail: false,
      showPhone: false,
      theme: "LIGHT",
      language: "en",
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
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      redirect("/login");
    }

    const dbUser = await db.user.findUnique({
      where: {
        clerkId: clerkUser.id
      }
    });

    if (!dbUser) {
      redirect("/login");
    }

    const student = await db.student.findUnique({
      where: {
        id: data.studentId
      }
    });

    if (!student || student.userId !== dbUser.id) {
      throw new Error("Unauthorized");
    }

    // Update student record
    await db.student.update({
      where: {
        id: data.studentId
      },
      data: {
        phone: data.phone,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone
      }
    });

    // Update user email if provided
    if (data.email) {
      await db.user.update({
        where: {
          id: student.userId
        },
        data: {
          email: data.email
        }
      });
    }

    revalidatePath("/student/settings");
    return { success: true, message: "Account settings updated successfully" };
  } catch (error) {
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
}) {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      redirect("/login");
    }

    const dbUser = await db.user.findUnique({
      where: {
        clerkId: clerkUser.id
      }
    });

    if (!dbUser) {
      redirect("/login");
    }

    const student = await db.student.findUnique({
      where: {
        id: data.studentId
      }
    });

    if (!student || student.userId !== dbUser.id) {
      throw new Error("Unauthorized");
    }

    await db.studentSettings.upsert({
      where: {
        studentId: data.studentId
      },
      update: {
        emailNotifications: data.emailNotifications,
        assignmentReminders: data.assignmentReminders,
        examReminders: data.examReminders,
        attendanceAlerts: data.attendanceAlerts,
        feeReminders: data.feeReminders,
        eventNotifications: data.eventNotifications,
        announcementNotifications: data.announcementNotifications
      },
      create: {
        studentId: data.studentId,
        emailNotifications: data.emailNotifications ?? true,
        assignmentReminders: data.assignmentReminders ?? true,
        examReminders: data.examReminders ?? true,
        attendanceAlerts: data.attendanceAlerts ?? true,
        feeReminders: data.feeReminders ?? true,
        eventNotifications: data.eventNotifications ?? true,
        announcementNotifications: data.announcementNotifications ?? true
      }
    });

    revalidatePath("/student/settings");
    return { success: true, message: "Notification settings updated successfully" };
  } catch (error) {
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
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      redirect("/login");
    }

    const dbUser = await db.user.findUnique({
      where: {
        clerkId: clerkUser.id
      }
    });

    if (!dbUser) {
      redirect("/login");
    }

    const student = await db.student.findUnique({
      where: {
        id: data.studentId
      }
    });

    if (!student || student.userId !== dbUser.id) {
      throw new Error("Unauthorized");
    }

    await db.studentSettings.upsert({
      where: {
        studentId: data.studentId
      },
      update: {
        profileVisibility: data.profileVisibility,
        showEmail: data.showEmail,
        showPhone: data.showPhone
      },
      create: {
        studentId: data.studentId,
        profileVisibility: data.profileVisibility ?? "PRIVATE",
        showEmail: data.showEmail ?? false,
        showPhone: data.showPhone ?? false
      }
    });

    revalidatePath("/student/settings");
    return { success: true, message: "Privacy settings updated successfully" };
  } catch (error) {
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
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      redirect("/login");
    }

    const dbUser = await db.user.findUnique({
      where: {
        clerkId: clerkUser.id
      }
    });

    if (!dbUser) {
      redirect("/login");
    }

    const student = await db.student.findUnique({
      where: {
        id: data.studentId
      }
    });

    if (!student || student.userId !== dbUser.id) {
      throw new Error("Unauthorized");
    }

    await db.studentSettings.upsert({
      where: {
        studentId: data.studentId
      },
      update: {
        theme: data.theme,
        language: data.language,
        dateFormat: data.dateFormat,
        timeFormat: data.timeFormat
      },
      create: {
        studentId: data.studentId,
        theme: data.theme ?? "LIGHT",
        language: data.language ?? "en",
        dateFormat: data.dateFormat ?? "MM/DD/YYYY",
        timeFormat: data.timeFormat ?? "TWELVE_HOUR"
      }
    });

    revalidatePath("/student/settings");
    return { success: true, message: "Appearance settings updated successfully" };
  } catch (error) {
    console.error("Failed to update appearance settings:", error);
    return { success: false, message: "Failed to update appearance settings" };
  }
}
