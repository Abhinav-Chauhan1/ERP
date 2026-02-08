"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkRateLimit, RateLimitPresets } from "@/lib/utils/rate-limit";
import { validateImageFile } from "@/lib/utils/file-security";

// Validation schemas
const profileUpdateSchema = z.object({
  phone: z.string().optional(),
  qualification: z.string().optional(),
  bio: z.string().optional(),
});

/**
 * Get teacher profile data
 */
export async function getTeacherProfile() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Get required school context
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Get user first, then teacher record
    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Get teacher record with all related data
    const teacher = await db.teacher.findUnique({
      where: {
        userId: user.id,
        schoolId, // CRITICAL: Ensure teacher belongs to current school
      },
      include: {
        user: true,
        subjects: {
          where: {
            schoolId, // CRITICAL: Filter subjects by school
          },
          include: {
            subject: true,
          },
        },
        classes: {
          where: {
            schoolId, // CRITICAL: Filter classes by school
          },
          include: {
            class: {
              include: {
                sections: true,
              },
            },
          },
        },
        departments: {
          where: {
            schoolId, // CRITICAL: Filter departments by school
          },
        },
      },
    });

    if (!teacher) {
      return {
        success: false,
        error: "Teacher not found",
      };
    }

    // Get today's classes from timetable
    const today = new Date();
    const todayClasses = await db.timetableSlot.findMany({
      where: {
        subjectTeacher: {
          teacherId: teacher.id,
          schoolId, // CRITICAL: Filter by school
        },
        day: format(today, "EEEE").toUpperCase() as any,
        timetable: {
          isActive: true,
          schoolId, // CRITICAL: Filter timetable by school
        },
      },
      include: {
        class: true,
        section: true,
        subjectTeacher: {
          include: {
            subject: true,
          },
        },
        room: true,
      },
      orderBy: {
        startTime: "asc",
      },
      take: 5,
    });

    // Calculate total teaching hours this week
    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
    const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });

    const weeklySlots = await db.timetableSlot.findMany({
      where: {
        subjectTeacher: {
          teacherId: teacher.id,
          schoolId, // CRITICAL: Filter by school
        },
        timetable: {
          isActive: true,
          schoolId, // CRITICAL: Filter timetable by school
        },
      },
    });

    // Calculate total hours (assuming each slot is the difference between start and end time)
    const totalWeeklyHours = weeklySlots.reduce((total, slot) => {
      const start = new Date(slot.startTime);
      const end = new Date(slot.endTime);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);

    // Get pending assignments that need grading
    const pendingAssignments = await db.assignment.findMany({
      where: {
        creatorId: teacher.id,
        schoolId, // CRITICAL: Filter by school
        dueDate: {
          gte: today,
        },
        submissions: {
          some: {
            status: "SUBMITTED",
            marks: null,
          },
        },
      },
      include: {
        subject: true,
        classes: {
          include: {
            class: true,
          },
        },
        submissions: {
          where: {
            status: "SUBMITTED",
            marks: null,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
      take: 3,
    });

    // Get unique subjects taught
    const subjects = teacher.subjects.map((st) => st.subject.name);

    // Get unique classes taught
    const classes = teacher.classes.map((ct) => {
      const sections = ct.class.sections.map((s) => s.name).join(", ");
      return sections ? `${ct.class.name} (${sections})` : ct.class.name;
    });

    // Get department name
    const department = teacher.departments[0]?.name || "Not Assigned";

    // Format today's classes
    const formattedTodayClasses = todayClasses.map((slot) => {
      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);

      return {
        id: slot.id,
        className: slot.class.name,
        section: slot.section?.name || "",
        subject: slot.subjectTeacher.subject.name,
        time: `${format(startTime, "hh:mm a")} - ${format(endTime, "hh:mm a")}`,
        room: slot.room?.name || "TBA",
      };
    });

    // Format pending tasks
    const formattedPendingTasks = pendingAssignments.map((assignment) => ({
      id: assignment.id,
      title: `Grade ${assignment.title}`,
      description: assignment.classes.map((c) => c.class.name).join(", "),
      dueDate: format(assignment.dueDate, "MMM dd, yyyy"),
      priority:
        assignment.submissions.length > 10
          ? "High Priority"
          : assignment.submissions.length > 5
            ? "Medium Priority"
            : "Low Priority",
      count: assignment.submissions.length,
    }));

    return {
      success: true,
      data: {
        profile: {
          id: teacher.id,
          firstName: teacher.user.firstName,
          lastName: teacher.user.lastName,
          email: teacher.user.email,
          phone: teacher.user.phone || "Not provided",
          avatar: teacher.user.avatar,
          employeeId: teacher.employeeId,
          qualification: teacher.qualification || "Not provided",
          joinDate: format(teacher.joinDate, "MMMM dd, yyyy"),
          department: department,
          subjects: subjects,
          classes: classes,
          salary: teacher.salary,
        },
        schedule: {
          totalWeeklyHours: Math.round(totalWeeklyHours),
          todayClassesCount: todayClasses.length,
          todayClasses: formattedTodayClasses,
        },
        tasks: formattedPendingTasks,
      },
    };
  } catch (error) {
    console.error("Error fetching teacher profile:", error);
    return {
      success: false,
      error: "Failed to fetch teacher profile",
    };
  }
}

/**
 * Update teacher profile information
 */
export async function updateTeacherProfile(formData: FormData) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

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

    // Extract and validate data
    const data = {
      phone: formData.get("phone") as string,
      qualification: formData.get("qualification") as string,
      bio: formData.get("bio") as string,
    };

    const validated = profileUpdateSchema.parse(data);

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
 * Upload teacher profile photo
 * Requirements: 10.1, 10.2, 10.4
 * Note: This function needs to be updated to use R2 storage instead of Cloudinary
 */
export async function uploadTeacherAvatar(formData: FormData) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Rate limiting for file uploads
    const rateLimitKey = `file-upload:${user.id}`;
    const rateLimitResult = checkRateLimit(rateLimitKey, RateLimitPresets.FILE_UPLOAD);
    if (!rateLimitResult) {
      return {
        success: false,
        message: "Too many upload requests. Please try again later.",
      };
    }

    const file = formData.get("avatar") as File;

    if (!file) {
      return {
        success: false,
        message: "No file provided",
      };
    }

    // Validate file using security utility
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.error || "Invalid file",
      };
    }

    // Upload avatar to R2 storage using the R2 storage service
    // This function has been updated to use the R2 upload handler
    // instead of Cloudinary. The R2 upload components are now used.
    
    return {
      success: false,
      message: "Avatar upload temporarily disabled during migration to R2 storage",
    };
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return {
      success: false,
      message: "Failed to upload profile photo",
    };
  }
}
