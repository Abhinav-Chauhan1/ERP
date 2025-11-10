"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";

// Get all announcements with filters
export async function getAnnouncements(filters?: {
  isActive?: boolean;
  targetAudience?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const where: any = {};

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
}

// Get single announcement by ID
export async function getAnnouncementById(id: string) {
  try {
    const announcement = await db.announcement.findUnique({
      where: { id },
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
    });

    if (!announcement) {
      return { success: false, error: "Announcement not found" };
    }

    return { success: true, data: announcement };
  } catch (error) {
    console.error("Error fetching announcement:", error);
    return { success: false, error: "Failed to fetch announcement" };
  }
}

// Create new announcement
export async function createAnnouncement(data: any) {
  try {
    // Get current user
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      include: {
        administrator: true,
      },
    });

    if (!dbUser || !dbUser.administrator) {
      return { success: false, error: "Only administrators can create announcements" };
    }

    const announcement = await db.announcement.create({
      data: {
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
    return { success: true, data: announcement };
  } catch (error) {
    console.error("Error creating announcement:", error);
    return { success: false, error: "Failed to create announcement" };
  }
}

// Update existing announcement
export async function updateAnnouncement(id: string, data: any) {
  try {
    const announcement = await db.announcement.update({
      where: { id },
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
}

// Delete announcement
export async function deleteAnnouncement(id: string) {
  try {
    await db.announcement.delete({
      where: { id },
    });

    revalidatePath("/admin/communication/announcements");
    return { success: true };
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return { success: false, error: "Failed to delete announcement" };
  }
}

// Toggle announcement status (active/inactive)
export async function toggleAnnouncementStatus(id: string) {
  try {
    const announcement = await db.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      return { success: false, error: "Announcement not found" };
    }

    const updated = await db.announcement.update({
      where: { id },
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
}

// Get announcement statistics
export async function getAnnouncementStats() {
  try {
    const totalAnnouncements = await db.announcement.count();
    const activeAnnouncements = await db.announcement.count({
      where: {
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
}

// Get announcements by target audience
export async function getAnnouncementsByAudience(audience: string) {
  try {
    const announcements = await db.announcement.findMany({
      where: {
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
}
