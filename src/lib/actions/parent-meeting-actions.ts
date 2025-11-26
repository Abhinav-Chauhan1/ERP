"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schemas
const scheduleMeetingSchema = z.object({
  teacherId: z.string().min(1, "Please select a teacher"),
  scheduledDate: z.string().min(1, "Please select a date and time"),
  duration: z.number().min(15, "Meeting duration must be at least 15 minutes").max(180, "Meeting duration cannot exceed 3 hours").default(30),
  location: z.string().optional(),
  mode: z.enum(["IN_PERSON", "ONLINE"], { errorMap: () => ({ message: "Please select a meeting mode" }) }).default("IN_PERSON"),
  purpose: z.string().min(1, "Please provide a purpose for the meeting"),
  description: z.string().optional(),
});

const rescheduleMeetingSchema = z.object({
  meetingId: z.string().min(1, "Meeting ID is required"),
  newDate: z.string().min(1, "Please select a new date and time"),
});

const cancelMeetingSchema = z.object({
  meetingId: z.string().min(1, "Meeting ID is required"),
  reason: z.string().optional(),
});

const getMeetingHistorySchema = z.object({
  parentId: z.string().min(1, "Parent ID is required"),
  status: z.enum(["COMPLETED", "CANCELLED", "ALL"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  page: z.number().min(1).default(1),
});

/**
 * Schedule a new parent-teacher meeting
 * Requirements: 1.1, 1.2, 1.3
 */
export async function scheduleMeeting(formData: FormData) {
  try {
    // 1. Authentication check
    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: "Please sign in to schedule a meeting" };
    }

    // 2. Get parent from database
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { parent: true },
    });

    if (!user || !user.parent) {
      return { success: false, message: "Parent account not found. Please contact support." };
    }

    // 3. Validate input
    const data = {
      teacherId: formData.get("teacherId") as string,
      scheduledDate: formData.get("scheduledDate") as string,
      duration: parseInt(formData.get("duration") as string) || 30,
      location: formData.get("location") as string,
      mode: formData.get("mode") as string,
      purpose: formData.get("purpose") as string,
      description: formData.get("description") as string,
    };

    const validated = scheduleMeetingSchema.parse(data);

    // 4. Verify teacher exists
    const teacher = await db.teacher.findUnique({
      where: { id: validated.teacherId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!teacher) {
      return { success: false, message: "The selected teacher could not be found. Please try again." };
    }

    // 5. Check for scheduling conflicts
    const scheduledDateTime = new Date(validated.scheduledDate);
    const endTime = new Date(scheduledDateTime.getTime() + validated.duration * 60000);

    const conflictingMeeting = await db.parentMeeting.findFirst({
      where: {
        teacherId: validated.teacherId,
        scheduledDate: {
          gte: new Date(scheduledDateTime.getTime() - 60 * 60000), // 1 hour before
          lte: new Date(scheduledDateTime.getTime() + 60 * 60000), // 1 hour after
        },
        status: {
          in: ["SCHEDULED", "REQUESTED"],
        },
      },
    });

    if (conflictingMeeting) {
      return { 
        success: false, 
        message: "Teacher has another meeting scheduled at this time. Please choose a different time." 
      };
    }

    // 6. Create meeting
    const meeting = await db.parentMeeting.create({
      data: {
        title: validated.purpose,
        description: validated.description || null,
        parentId: user.parent.id,
        teacherId: validated.teacherId,
        scheduledDate: scheduledDateTime,
        duration: validated.duration,
        location: validated.mode === "ONLINE" ? "Online Meeting" : validated.location || null,
        status: "SCHEDULED",
      },
      include: {
        parent: {
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
        teacher: {
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

    // 7. Create notifications for both parent and teacher
    await Promise.all([
      db.notification.create({
        data: {
          userId: user.id,
          title: "Meeting Scheduled",
          message: `Your meeting with ${teacher.user.firstName} ${teacher.user.lastName} has been scheduled for ${scheduledDateTime.toLocaleString()}`,
          type: "INFO",
        },
      }),
      db.notification.create({
        data: {
          userId: teacher.userId,
          title: "New Meeting Request",
          message: `${user.firstName} ${user.lastName} has scheduled a meeting with you for ${scheduledDateTime.toLocaleString()}`,
          type: "INFO",
        },
      }),
    ]);

    // 8. Revalidate paths
    revalidatePath("/parent/meetings");
    revalidatePath("/teacher/meetings");

    return { 
      success: true, 
      data: meeting,
      message: "Meeting scheduled successfully. Confirmation notifications have been sent." 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error("Error scheduling meeting:", error);
    return { success: false, message: "Unable to schedule the meeting. Please try again or contact support if the problem persists." };
  }
}

/**
 * Get upcoming meetings for a parent
 * Requirements: 1.2
 */
export async function getUpcomingMeetings(parentId: string) {
  try {
    // 1. Authentication check
    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: "Please sign in to view your meetings" };
    }

    // 2. Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { parent: true },
    });

    if (!user || !user.parent) {
      return { success: false, message: "Parent account not found. Please contact support." };
    }

    // 3. Verify parent ID matches authenticated user
    if (user.parent.id !== parentId) {
      return { success: false, message: "You don't have permission to view these meetings." };
    }

    // 4. Fetch upcoming meetings
    const meetings = await db.parentMeeting.findMany({
      where: {
        parentId,
        scheduledDate: {
          gte: new Date(),
        },
        status: {
          in: ["SCHEDULED", "REQUESTED", "RESCHEDULED"],
        },
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledDate: "asc",
      },
    });

    return { success: true, data: meetings };
  } catch (error) {
    console.error("Error fetching upcoming meetings:", error);
    return { success: false, message: "Unable to load your upcoming meetings. Please refresh the page or try again later." };
  }
}

/**
 * Get meeting history for a parent with filters
 * Requirements: 1.3
 */
export async function getMeetingHistory(params: {
  parentId: string;
  status?: "COMPLETED" | "CANCELLED" | "ALL";
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  page?: number;
}) {
  try {
    // 1. Authentication check
    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: "Please sign in to view your meeting history" };
    }

    // 2. Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { parent: true },
    });

    if (!user || !user.parent) {
      return { success: false, message: "Parent account not found. Please contact support." };
    }

    // 3. Verify parent ID matches authenticated user
    if (user.parent.id !== params.parentId) {
      return { success: false, message: "You don't have permission to view this meeting history." };
    }

    // 4. Validate input
    const validated = getMeetingHistorySchema.parse(params);

    // 5. Build where clause
    const where: any = {
      parentId: validated.parentId,
      scheduledDate: {
        lt: new Date(), // Past meetings only
      },
    };

    if (validated.status && validated.status !== "ALL") {
      where.status = validated.status;
    } else {
      where.status = {
        in: ["COMPLETED", "CANCELLED"],
      };
    }

    if (validated.dateFrom) {
      where.scheduledDate.gte = new Date(validated.dateFrom);
    }

    if (validated.dateTo) {
      where.scheduledDate.lte = new Date(validated.dateTo);
    }

    // 6. Fetch meetings with pagination
    const skip = (validated.page - 1) * validated.limit;

    const [meetings, total] = await Promise.all([
      db.parentMeeting.findMany({
        where,
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: {
          scheduledDate: "desc",
        },
        take: validated.limit,
        skip,
      }),
      db.parentMeeting.count({ where }),
    ]);

    return { 
      success: true, 
      data: meetings,
      pagination: {
        total,
        page: validated.page,
        limit: validated.limit,
        totalPages: Math.ceil(total / validated.limit),
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error("Error fetching meeting history:", error);
    return { success: false, message: "Unable to load your meeting history. Please refresh the page or try again later." };
  }
}

/**
 * Cancel a meeting
 * Requirements: 1.4
 */
export async function cancelMeeting(formData: FormData) {
  try {
    // 1. Authentication check
    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: "Please sign in to cancel a meeting" };
    }

    // 2. Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { parent: true },
    });

    if (!user || !user.parent) {
      return { success: false, message: "Parent account not found. Please contact support." };
    }

    // 3. Validate input
    const data = {
      meetingId: formData.get("meetingId") as string,
      reason: formData.get("reason") as string,
    };

    const validated = cancelMeetingSchema.parse(data);

    // 4. Fetch meeting and verify ownership
    const meeting = await db.parentMeeting.findUnique({
      where: { id: validated.meetingId },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!meeting) {
      return { success: false, message: "Meeting not found. It may have been deleted." };
    }

    if (meeting.parentId !== user.parent.id) {
      return { success: false, message: "You don't have permission to cancel this meeting." };
    }

    // 5. Check if meeting can be cancelled
    if (meeting.status === "CANCELLED") {
      return { success: false, message: "This meeting has already been cancelled." };
    }

    if (meeting.status === "COMPLETED") {
      return { success: false, message: "Cannot cancel a meeting that has already been completed." };
    }

    // 6. Update meeting status
    const updatedMeeting = await db.parentMeeting.update({
      where: { id: validated.meetingId },
      data: {
        status: "CANCELLED",
        notes: validated.reason ? `Cancelled by parent: ${validated.reason}` : "Cancelled by parent",
      },
    });

    // 7. Create notification for teacher
    await db.notification.create({
      data: {
        userId: meeting.teacher.userId,
        title: "Meeting Cancelled",
        message: `${user.firstName} ${user.lastName} has cancelled the meeting scheduled for ${meeting.scheduledDate.toLocaleString()}${validated.reason ? `. Reason: ${validated.reason}` : ""}`,
        type: "WARNING",
      },
    });

    // 8. Revalidate paths
    revalidatePath("/parent/meetings");
    revalidatePath("/teacher/meetings");

    return { 
      success: true, 
      data: updatedMeeting,
      message: "Meeting cancelled successfully" 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error("Error cancelling meeting:", error);
    return { success: false, message: "Unable to cancel the meeting. Please try again or contact support if the problem persists." };
  }
}

/**
 * Reschedule a meeting
 * Requirements: 1.5
 */
export async function rescheduleMeeting(formData: FormData) {
  try {
    // 1. Authentication check
    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: "Please sign in to reschedule a meeting" };
    }

    // 2. Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { parent: true },
    });

    if (!user || !user.parent) {
      return { success: false, message: "Parent account not found. Please contact support." };
    }

    // 3. Validate input
    const data = {
      meetingId: formData.get("meetingId") as string,
      newDate: formData.get("newDate") as string,
    };

    const validated = rescheduleMeetingSchema.parse(data);

    // 4. Fetch meeting and verify ownership
    const meeting = await db.parentMeeting.findUnique({
      where: { id: validated.meetingId },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!meeting) {
      return { success: false, message: "Meeting not found. It may have been deleted." };
    }

    if (meeting.parentId !== user.parent.id) {
      return { success: false, message: "You don't have permission to reschedule this meeting." };
    }

    // 5. Check if meeting can be rescheduled
    if (meeting.status === "CANCELLED") {
      return { success: false, message: "Cannot reschedule a cancelled meeting. Please schedule a new meeting instead." };
    }

    if (meeting.status === "COMPLETED") {
      return { success: false, message: "Cannot reschedule a meeting that has already been completed." };
    }

    // 6. Check for scheduling conflicts
    const newDateTime = new Date(validated.newDate);
    const conflictingMeeting = await db.parentMeeting.findFirst({
      where: {
        teacherId: meeting.teacherId,
        id: { not: validated.meetingId },
        scheduledDate: {
          gte: new Date(newDateTime.getTime() - 60 * 60000), // 1 hour before
          lte: new Date(newDateTime.getTime() + 60 * 60000), // 1 hour after
        },
        status: {
          in: ["SCHEDULED", "REQUESTED"],
        },
      },
    });

    if (conflictingMeeting) {
      return { 
        success: false, 
        message: "Teacher has another meeting scheduled at this time. Please choose a different time." 
      };
    }

    // 7. Update meeting
    const updatedMeeting = await db.parentMeeting.update({
      where: { id: validated.meetingId },
      data: {
        scheduledDate: newDateTime,
        status: "RESCHEDULED",
        notes: `Rescheduled from ${meeting.scheduledDate.toLocaleString()} to ${newDateTime.toLocaleString()}`,
      },
    });

    // 8. Create notification for teacher
    await db.notification.create({
      data: {
        userId: meeting.teacher.userId,
        title: "Meeting Rescheduled",
        message: `${user.firstName} ${user.lastName} has rescheduled the meeting from ${meeting.scheduledDate.toLocaleString()} to ${newDateTime.toLocaleString()}`,
        type: "INFO",
      },
    });

    // 9. Revalidate paths
    revalidatePath("/parent/meetings");
    revalidatePath("/teacher/meetings");

    return { 
      success: true, 
      data: updatedMeeting,
      message: "Meeting rescheduled successfully" 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error("Error rescheduling meeting:", error);
    return { success: false, message: "Unable to reschedule the meeting. Please try again or contact support if the problem persists." };
  }
}

/**
 * Get teacher availability (simplified - returns available time slots)
 * Requirements: 1.2
 */
export async function getTeacherAvailability(teacherId: string, date: string) {
  try {
    // 1. Authentication check
    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: "Please sign in to view teacher availability" };
    }

    // 2. Verify teacher exists
    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!teacher) {
      return { success: false, message: "The selected teacher could not be found." };
    }

    // 3. Get all meetings for the teacher on the specified date
    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

    const meetings = await db.parentMeeting.findMany({
      where: {
        teacherId,
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ["SCHEDULED", "REQUESTED", "RESCHEDULED"],
        },
      },
      select: {
        scheduledDate: true,
        duration: true,
      },
    });

    // 4. Generate available time slots (9 AM to 5 PM, 30-minute intervals)
    const availableSlots = [];
    const workStartHour = 9;
    const workEndHour = 17;
    
    for (let hour = workStartHour; hour < workEndHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);
        
        // Check if slot is in the past
        if (slotTime < new Date()) {
          continue;
        }
        
        // Check if slot conflicts with existing meetings
        const hasConflict = meetings.some(meeting => {
          const meetingStart = new Date(meeting.scheduledDate);
          const meetingEnd = new Date(meetingStart.getTime() + (meeting.duration || 30) * 60000);
          const slotEnd = new Date(slotTime.getTime() + 30 * 60000);
          
          return (
            (slotTime >= meetingStart && slotTime < meetingEnd) ||
            (slotEnd > meetingStart && slotEnd <= meetingEnd) ||
            (slotTime <= meetingStart && slotEnd >= meetingEnd)
          );
        });
        
        if (!hasConflict) {
          availableSlots.push({
            time: slotTime.toISOString(),
            label: slotTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          });
        }
      }
    }

    return { 
      success: true, 
      data: {
        teacherId,
        teacherName: `${teacher.user.firstName} ${teacher.user.lastName}`,
        date,
        availableSlots,
      },
    };
  } catch (error) {
    console.error("Error fetching teacher availability:", error);
    return { success: false, message: "Unable to load teacher availability. Please try again later." };
  }
}

/**
 * Get all teachers for meeting scheduling
 * Requirements: 1.1
 */
export async function getTeachersForMeetings() {
  try {
    // 1. Authentication check
    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: "Please sign in to view teachers" };
    }

    // 2. Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { parent: true },
    });

    if (!user || !user.parent) {
      return { success: false, message: "Parent account not found. Please contact support." };
    }

    // 3. Fetch all active teachers
    const teachers = await db.teacher.findMany({
      where: {
        user: {
          active: true,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
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
    return { success: false, message: "Unable to load the list of teachers. Please refresh the page or try again later." };
  }
}

/**
 * Get single meeting details
 * Requirements: 1.2, 1.3
 */
export async function getMeetingById(meetingId: string) {
  try {
    // 1. Authentication check
    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: "Please sign in to view meeting details" };
    }

    // 2. Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { parent: true },
    });

    if (!user || !user.parent) {
      return { success: false, message: "Parent account not found. Please contact support." };
    }

    // 3. Fetch meeting
    const meeting = await db.parentMeeting.findUnique({
      where: { id: meetingId },
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
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!meeting) {
      return { success: false, message: "Meeting not found. It may have been deleted." };
    }

    // 4. Verify parent owns this meeting
    if (meeting.parentId !== user.parent.id) {
      return { success: false, message: "You don't have permission to view this meeting." };
    }

    return { success: true, data: meeting };
  } catch (error) {
    console.error("Error fetching meeting:", error);
    return { success: false, message: "Unable to load meeting details. Please try again later." };
  }
}
