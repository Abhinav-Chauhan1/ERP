"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/auth-helpers";
import {
  createCalendarEventFromMeeting,
  updateCalendarEventFromMeeting,
  deleteCalendarEventFromMeeting
} from "../services/meeting-calendar-integration";

// Get all parent meetings with filters
export async function getParentMeetings(filters?: {
  status?: string;
  teacherId?: string;
  parentId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
}) {
  try {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.teacherId) {
      where.teacherId = filters.teacherId;
    }

    if (filters?.parentId) {
      where.parentId = filters.parentId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.scheduledAt = {};
      if (filters.dateFrom) {
        where.scheduledAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.scheduledAt.lte = filters.dateTo;
      }
    }

    const meetings = await db.parentMeeting.findMany({
      where,
      include: {
        parent: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            children: {
              include: {
                student: {
                  include: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                    enrollments: {
                      where: {
                        status: "ACTIVE",
                      },
                      include: {
                        class: true,
                        section: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledDate: "desc",
      },
      take: filters?.limit,
    });

    return { success: true, data: meetings };
  } catch (error) {
    console.error("Error fetching parent meetings:", error);
    return { success: false, error: "Failed to fetch parent meetings" };
  }
}

// Get single parent meeting by ID
export async function getParentMeetingById(id: string) {
  try {
    const meeting = await db.parentMeeting.findUnique({
      where: { id },
      include: {
        parent: {
          include: {
            user: true,
            children: {
              include: {
                student: {
                  include: {
                    user: true,
                    enrollments: {
                      where: {
                        status: "ACTIVE",
                      },
                      include: {
                        class: true,
                        section: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!meeting) {
      return { success: false, error: "Meeting not found" };
    }

    return { success: true, data: meeting };
  } catch (error) {
    console.error("Error fetching parent meeting:", error);
    return { success: false, error: "Failed to fetch parent meeting" };
  }
}

// Schedule new parent meeting
export async function scheduleMeeting(data: any) {
  try {
    const user = await currentUser();
    const userId = user?.id || 'system';

    const meeting = await db.parentMeeting.create({
      data: {
        title: data.title || "Parent-Teacher Meeting",
        description: data.description || null,
        parentId: data.parentId,
        teacherId: data.teacherId,
        scheduledDate: new Date(data.scheduledAt),
        duration: data.duration || 30,
        location: data.location || null,
        status: "SCHEDULED",
      },
      include: {
        parent: {
          include: {
            user: true,
          },
        },
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    // Create calendar event for the meeting
    await createCalendarEventFromMeeting(meeting as any, userId);

    revalidatePath("/admin/communication/parent-meetings");
    return { success: true, data: meeting };
  } catch (error) {
    console.error("Error scheduling meeting:", error);
    return { success: false, error: "Failed to schedule meeting" };
  }
}

// Update existing meeting
export async function updateMeeting(id: string, data: any) {
  try {
    const meeting = await db.parentMeeting.update({
      where: { id },
      data: {
        scheduledDate: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        duration: data.duration,
        location: data.location,
        status: data.status,
        notes: data.notes,
      },
      include: {
        parent: {
          include: {
            user: true,
          },
        },
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    // Update calendar event for the meeting
    await updateCalendarEventFromMeeting(meeting as any);

    revalidatePath("/admin/communication/parent-meetings");
    return { success: true, data: meeting };
  } catch (error) {
    console.error("Error updating meeting:", error);
    return { success: false, error: "Failed to update meeting" };
  }
}

// Cancel meeting
export async function cancelMeeting(id: string, reason?: string) {
  try {
    const meeting = await db.parentMeeting.update({
      where: { id },
      data: {
        status: "CANCELLED",
        notes: reason ? `Cancelled: ${reason}` : "Meeting cancelled",
      },
    });

    // Delete calendar event for the cancelled meeting
    await deleteCalendarEventFromMeeting(id);

    revalidatePath("/admin/communication/parent-meetings");
    return { success: true, data: meeting };
  } catch (error) {
    console.error("Error cancelling meeting:", error);
    return { success: false, error: "Failed to cancel meeting" };
  }
}

// Complete meeting
export async function completeMeeting(id: string, notes?: string) {
  try {
    const meeting = await db.parentMeeting.update({
      where: { id },
      data: {
        status: "COMPLETED",
        notes: notes || null,
      },
    });

    revalidatePath("/admin/communication/parent-meetings");
    return { success: true, data: meeting };
  } catch (error) {
    console.error("Error completing meeting:", error);
    return { success: false, error: "Failed to complete meeting" };
  }
}

// Reschedule meeting
export async function rescheduleMeeting(id: string, newDate: Date) {
  try {
    const meeting = await db.parentMeeting.update({
      where: { id },
      data: {
        scheduledDate: newDate,
        status: "RESCHEDULED",
      },
      include: {
        parent: {
          include: {
            user: true,
          },
        },
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    // Update calendar event for the rescheduled meeting
    await updateCalendarEventFromMeeting(meeting as any);

    revalidatePath("/admin/communication/parent-meetings");
    return { success: true, data: meeting };
  } catch (error) {
    console.error("Error rescheduling meeting:", error);
    return { success: false, error: "Failed to reschedule meeting" };
  }
}

// Delete meeting
export async function deleteMeeting(id: string) {
  try {
    // Delete calendar event first
    await deleteCalendarEventFromMeeting(id);

    await db.parentMeeting.delete({
      where: { id },
    });

    revalidatePath("/admin/communication/parent-meetings");
    return { success: true };
  } catch (error) {
    console.error("Error deleting meeting:", error);
    return { success: false, error: "Failed to delete meeting" };
  }
}

// Get teachers for dropdown
export async function getTeachersForMeetings() {
  try {
    const teachers = await db.teacher.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        user: {
          firstName: "asc",
        },
      },
    });

    return { success: true, data: teachers };
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return { success: false, error: "Failed to fetch teachers" };
  }
}

// Get parents for dropdown
export async function getParentsForMeetings() {
  try {
    const parents = await db.parent.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        children: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
                enrollments: {
                  where: {
                    status: "ACTIVE",
                  },
                  include: {
                    class: true,
                    section: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        user: {
          firstName: "asc",
        },
      },
    });

    return { success: true, data: parents };
  } catch (error) {
    console.error("Error fetching parents:", error);
    return { success: false, error: "Failed to fetch parents" };
  }
}

// Get meeting statistics
export async function getMeetingStats() {
  try {
    const [totalMeetings, scheduledMeetings, completedMeetings, cancelledMeetings] =
      await Promise.all([
        db.parentMeeting.count(),
        db.parentMeeting.count({
          where: { status: "SCHEDULED" },
        }),
        db.parentMeeting.count({
          where: { status: "COMPLETED" },
        }),
        db.parentMeeting.count({
          where: { status: "CANCELLED" },
        }),
      ]);

    return {
      success: true,
      data: {
        totalMeetings,
        scheduledMeetings,
        completedMeetings,
        cancelledMeetings,
      },
    };
  } catch (error) {
    console.error("Error fetching meeting stats:", error);
    return { success: false, error: "Failed to fetch statistics" };
  }
}



