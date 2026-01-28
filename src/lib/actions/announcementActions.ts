"use server";

import { withSchoolAuthAction } from "@/lib/auth/security-wrapper";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/auth-helpers";

// Get all announcements with filters
export const getAnnouncements = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, filters?: {
  isActive?: boolean;
  targetAudience?: string;
  limit?: number;
  offset?: number;
}) => {
  try {
    const where: any = { schoolId }; // Ensure scoped

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.targetAudience) {
      where.targetAudience = {
        has: filters.targetAudience,
      };
    }

    // Only show active announcements within date range
    if (filters?.isActive) {
      where.startDate = {
        lte: new Date(),
      };
      where.OR = [
        { endDate: null },
        { endDate: { gte: new Date() } },
      ];
    }

    const announcements = await db.announcement.findMany({
      where,
      include: {
        publisher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: filters?.limit,
      skip: filters?.offset,
    });

    return { success: true, data: announcements };
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return { success: false, error: "Failed to fetch announcements" };
  }
});

// Get single announcement by ID
export const getAnnouncementById = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string) => {
  try {
    const announcement = await db.announcement.findUnique({
      where: {
        schoolId,
        id
      },
      include: {
        publisher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                84: true, // ERROR IN PREVIOUS VIEW? No, reading 3533 line 84 was empty? Ah, line 84 was `email: true` in 3533.
                // Wait, using logical lines.
              },
            },
          },
        },
      },
    });

    if (!announcement) {
      return { success: false, error: "Announcement not found" };
    }

    return { success: true, data: announcement };
  } catch (error) {
    console.error("Error fetching announcement:", error);
    return { success: false, error: "Failed to fetch announcement" };
  }
});

// Create new announcement
export const createAnnouncement = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, data: any) => {
  try {
    // Get current user
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get user from database
    const dbUser = await db.user.findUnique({
      where: {
        id: user.id
      },
      include: {
        administrator: true,
      },
    });

    if (!dbUser || !dbUser.administrator) {
      return { success: false, error: "Only administrators can create announcements" };
    }

    const announcement = await db.announcement.create({
      data: {
        schoolId,
        title: data.title,
        content: data.content,
        publisherId: dbUser.administrator.id,
        targetAudience: data.targetAudience,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive ?? true,
        attachments: data.attachments || null,
      },
      include: {
        publisher: {
          include: {
            user: true,
          },
        },
      },
    });

    revalidatePath("/admin/communication/announcements");

    // Notification logic
    const targetRoles: string[] = Array.isArray(data.targetAudience)
      ? data.targetAudience
      : [data.targetAudience];

    const validRoles = ["ADMIN", "TEACHER", "STUDENT", "PARENT"];
    const rolesToNotify = targetRoles.filter(role => validRoles.includes(role));

    if (rolesToNotify.length > 0) {
      const userSchools = await db.userSchool.findMany({
        where: {
          schoolId,
          role: {
            in: rolesToNotify as any
          },
          isActive: true
        },
        include: { user: true }
      });
      const usersToNotify = userSchools.map(us => us.user);

      if (usersToNotify.length > 0) {
        await db.notification.createMany({
          data: usersToNotify.map(u => ({
            schoolId,
            userId: u.id,
            title: "New Announcement",
            message: announcement.title,
            type: "ANNOUNCEMENT",
            link: `/communication/announcements/${announcement.id}`,
            isRead: false,
          }))
        });
      }
    }

    return { success: true, data: announcement };
  } catch (error) {
    console.error("Error creating announcement:", error);
    return { success: false, error: "Failed to create announcement" };
  }
});

// Update existing announcement
export const updateAnnouncement = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string, data: any) => {
  try {
    const announcement = await db.announcement.update({
      where: {
        schoolId,
        id
      },
      data: {
        title: data.title,
        content: data.content,
        targetAudience: data.targetAudience,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive ?? true,
        attachments: data.attachments || null,
      },
      include: {
        publisher: {
          include: {
            user: true,
          },
        },
      },
    });

    revalidatePath("/admin/communication/announcements");
    return { success: true, data: announcement };
  } catch (error) {
    console.error("Error updating announcement:", error);
    return { success: false, error: "Failed to update announcement" };
  }
});

// Delete announcement
export const deleteAnnouncement = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string) => {
  try {
    await db.announcement.delete({
      where: {
        schoolId,
        id
      },
    });

    revalidatePath("/admin/communication/announcements");
    return { success: true };
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return { success: false, error: "Failed to delete announcement" };
  }
});

// Toggle announcement status (active/inactive)
export const toggleAnnouncementStatus = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string) => {
  try {
    const announcement = await db.announcement.findUnique({
      where: {
        schoolId,
        id
      },
    });

    if (!announcement) {
      return { success: false, error: "Announcement not found" };
    }

    const updated = await db.announcement.update({
      where: {
        schoolId,
        id
      },
      data: {
        isActive: !announcement.isActive,
      },
    });

    revalidatePath("/admin/communication/announcements");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error toggling announcement status:", error);
    return { success: false, error: "Failed to toggle announcement status" };
  }
});

// Get announcement statistics
export const getAnnouncementStats = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  try {
    const totalAnnouncements = await db.announcement.count({ where: { schoolId } });
    const activeAnnouncements = await db.announcement.count({
      where: {
        schoolId,
        isActive: true,
        startDate: {
          lte: new Date(),
        },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } },
        ],
      },
    });
    const archivedAnnouncements = await db.announcement.count({
      where: {
        schoolId,
        isActive: false,
      },
    });

    return {
      success: true,
      data: {
        totalAnnouncements,
        activeAnnouncements,
        archivedAnnouncements,
      },
    };
  } catch (error) {
    console.error("Error fetching announcement stats:", error);
    return { success: false, error: "Failed to fetch statistics" };
  }
});

// Get announcements by target audience
export const getAnnouncementsByAudience = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, audience: string) => {
  try {
    const announcements = await db.announcement.findMany({
      where: {
        schoolId,
        targetAudience: {
          has: audience,
        },
        isActive: true,
        startDate: {
          lte: new Date(),
        },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } },
        ],
      },
      include: {
        publisher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return { success: true, data: announcements };
  } catch (error) {
    console.error("Error fetching announcements by audience:", error);
    return { success: false, error: "Failed to fetch announcements" };
  }
});
