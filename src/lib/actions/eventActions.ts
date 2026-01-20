"use server";

import { db } from "@/lib/db";
import {
  eventSchemaWithRefinement,
  eventParticipantSchema,
  eventFilterSchema,
  type EventFormDataWithRefinement,
  type EventParticipantData,
  type EventFilterData
} from "@/lib/schemaValidation/eventSchemaValidation";
import { revalidatePath } from "next/cache";
import { EventStatus, EventCategory, EventSourceType } from "@prisma/client";
import { createNotification } from "@/lib/actions/notificationActions";
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  CreateCalendarEventInput
} from "@/lib/services/calendar-service";

export async function getEvents(filter?: EventFilterData) {
  try {
    // Validate the filter if provided
    let validatedFilter = {};
    if (filter) {
      validatedFilter = eventFilterSchema.parse(filter);
    }

    // Construct the database query based on filter
    const where: any = {};

    if (filter?.type) {
      where.type = filter.type;
    }

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.isPublic !== undefined) {
      where.isPublic = filter.isPublic;
    }

    if (filter?.startDate) {
      where.startDate = {
        gte: filter.startDate,
      };
    }

    if (filter?.endDate) {
      where.endDate = {
        lte: filter.endDate,
      };
    }

    if (filter?.searchTerm) {
      where.OR = [
        { title: { contains: filter.searchTerm, mode: 'insensitive' } },
        { description: { contains: filter.searchTerm, mode: 'insensitive' } },
        { location: { contains: filter.searchTerm, mode: 'insensitive' } },
        { organizer: { contains: filter.searchTerm, mode: 'insensitive' } },
      ];
    }

    // Query the database
    const events = await db.event.findMany({
      where,
      orderBy: {
        startDate: 'asc',
      },
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    return { success: true, data: events };
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return { success: false, error: "Failed to fetch events", data: [] };
  }
}

export async function getEvent(id: string) {
  try {
    const event = await db.event.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            // Since user is defined as a foreign key in EventParticipant with userId,
            // we can't directly include user. We just include the participant information.
          }
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    if (!event) {
      return { success: false, error: "Event not found", data: null };
    }

    return { success: true, data: event };
  } catch (error) {
    console.error(`Failed to fetch event with ID ${id}:`, error);
    return { success: false, error: "Failed to fetch event", data: null };
  }
}

// Helper to get or create Calendar Category ID based on Event Type
async function getCalendarCategoryId(eventType: string | undefined | null): Promise<string> {
  const defaultCategoryName = "School Event";
  let searchName = defaultCategoryName;
  let color = '#10b981'; // Green for School Event
  let icon = 'Star';
  let description = 'School-wide events and activities';

  if (eventType === 'HOLIDAY') {
    searchName = "Holiday";
    color = '#ef4444'; // Red
    icon = 'Calendar';
    description = 'School holidays and breaks';
  } else if (eventType === 'ADMINISTRATIVE') {
    searchName = "Meeting";
    color = '#3b82f6'; // Blue
    icon = 'Users';
    description = 'Meetings';
  } else if (eventType === 'SPORTS') {
    searchName = "Sports Event";
    color = '#f97316'; // Orange
    icon = 'Trophy';
    description = 'Sports competitions';
  }

  // Try to find existing category
  let category = await db.calendarEventCategory.findFirst({
    where: {
      name: {
        equals: searchName,
        mode: 'insensitive'
      }
    }
  });

  if (category) return category.id;

  // If not found, create it
  try {
    category = await db.calendarEventCategory.create({
      data: {
        name: searchName,
        description,
        color,
        icon,
        isActive: true,
        order: 10 // Default order
      }
    });
    return category.id;
  } catch (error) {
    console.error(`Failed to create calendar category ${searchName}:`, error);
    // Fallback to any existing category if creation fails (e.g. race condition)
    const anyCategory = await db.calendarEventCategory.findFirst();
    return anyCategory?.id || "";
  }
}

export async function createEvent(formData: EventFormDataWithRefinement) {
  try {
    // Validate the data
    const validatedData = eventSchemaWithRefinement.parse(formData);

    // Create the event in the database
    const event = await db.event.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        location: validatedData.location,
        organizer: validatedData.organizer,
        type: validatedData.type,
        category: getCategoryFromType(validatedData.type),
        status: validatedData.status as EventStatus,
        maxParticipants: validatedData.maxParticipants,
        registrationDeadline: validatedData.registrationDeadline,
        isPublic: validatedData.isPublic,
        thumbnail: validatedData.thumbnail,
      },
    });

    // --- SYNC WITH CALENDAR ---
    try {
      const calendarCategoryId = await getCalendarCategoryId(validatedData.type);
      if (calendarCategoryId) {
        // Determine visibility based on isPublic
        // If public, visible to all roles. If not, maybe restrict (but current logic assumes public = all)
        const visibleToRoles = validatedData.isPublic
          ? ["ADMIN", "TEACHER", "STUDENT", "PARENT"]
          : ["ADMIN", "TEACHER"]; // Default private to staff only? Or keep same.

        await createCalendarEvent({
          title: validatedData.title,
          description: validatedData.description || "",
          categoryId: calendarCategoryId,
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
          location: validatedData.location || undefined,
          isAllDay: false, // Default logic, could be improved
          visibleToRoles: visibleToRoles,
          sourceType: EventSourceType.SCHOOL_EVENT,
          sourceId: event.id,
          createdBy: "SYSTEM", // Or the actual creator if we had it in context
        });
      }
    } catch (calendarError) {
      console.error("Failed to sync event to calendar:", calendarError);
      // We don't block the main event creation on calendar sync failure, but we log it.
    }
    // --------------------------

    // Create notifications for all user types
    const notificationData = {
      title: `New Event: ${validatedData.title}`,
      message: `A new event "${validatedData.title}" has been scheduled. Check the events page for details.`,
      type: "INFO",
    };

    // Notify Students
    await createNotification({
      ...notificationData,
      recipientRole: "STUDENT",
      link: "/student/events",
    });

    // Notify Parents
    await createNotification({
      ...notificationData,
      recipientRole: "PARENT",
      link: "/parent/events",
    });

    // Notify Teachers
    await createNotification({
      ...notificationData,
      recipientRole: "TEACHER",
      link: "/teacher/events",
    });

    revalidatePath("/admin/events");
    revalidatePath("/student/events");
    revalidatePath("/parent/events");
    revalidatePath("/teacher/events");
    revalidatePath("/admin/calendar"); // Revalidate calendar
    return { success: true, data: event };
  } catch (error) {
    console.error("Failed to create event:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message, data: null };
    }
    return { success: false, error: "Failed to create event", data: null };
  }
}

function getCategoryFromType(type: string | undefined | null): EventCategory {
  if (!type) return EventCategory.OTHER;

  switch (type) {
    case 'ACADEMIC':
    case 'CULTURAL':
    case 'SPORTS':
      return EventCategory.SCHOOL_EVENT;
    case 'ADMINISTRATIVE':
      return EventCategory.TEACHER_MEETING; // Assumption
    case 'HOLIDAY':
      return EventCategory.HOLIDAY;
    default:
      return EventCategory.OTHER;
  }
}

export async function updateEvent(id: string, formData: EventFormDataWithRefinement) {
  try {
    // Validate the data
    const validatedData = eventSchemaWithRefinement.parse(formData);

    // Check if the event exists
    const existingEvent = await db.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return { success: false, error: "Event not found", data: null };
    }

    // Update the event in the database
    const updatedEvent = await db.event.update({
      where: { id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        location: validatedData.location,
        organizer: validatedData.organizer,
        type: validatedData.type,
        category: getCategoryFromType(validatedData.type),
        status: validatedData.status as EventStatus,
        maxParticipants: validatedData.maxParticipants,
        registrationDeadline: validatedData.registrationDeadline,
        isPublic: validatedData.isPublic,
        thumbnail: validatedData.thumbnail,
      },
    });

    // --- SYNC WITH CALENDAR ---
    try {
      // Find the associated calendar event
      const calendarEvent = await db.calendarEvent.findFirst({
        where: {
          sourceType: EventSourceType.SCHOOL_EVENT,
          sourceId: id
        }
      });

      if (calendarEvent) {
        const calendarCategoryId = await getCalendarCategoryId(validatedData.type);

        await updateCalendarEvent(calendarEvent.id, {
          title: validatedData.title,
          description: validatedData.description || "",
          categoryId: calendarCategoryId ? calendarCategoryId : undefined,
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
          location: validatedData.location || undefined,
          // Update visibility if needed
        });
      }
    } catch (calendarError) {
      console.error("Failed to sync event update to calendar:", calendarError);
    }
    // --------------------------

    revalidatePath("/admin/events");
    revalidatePath("/student/events");
    revalidatePath("/parent/events");
    revalidatePath("/teacher/events");
    revalidatePath(`/admin/events/${id}`);
    revalidatePath("/admin/calendar");
    return { success: true, data: updatedEvent };
  } catch (error) {
    console.error(`Failed to update event with ID ${id}:`, error);
    if (error instanceof Error) {
      return { success: false, error: error.message, data: null };
    }
    return { success: false, error: "Failed to update event", data: null };
  }
}

export async function deleteEvent(id: string) {
  try {
    // Check if the event exists
    const existingEvent = await db.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return { success: false, error: "Event not found", data: null };
    }

    // Delete the event
    await db.event.delete({
      where: { id },
    });

    // --- SYNC WITH CALENDAR ---
    try {
      const calendarEvent = await db.calendarEvent.findFirst({
        where: {
          sourceType: EventSourceType.SCHOOL_EVENT,
          sourceId: id
        }
      });

      if (calendarEvent) {
        await deleteCalendarEvent(calendarEvent.id);
      }
    } catch (calendarError) {
      console.error("Failed to sync event deletion to calendar:", calendarError);
    }
    // --------------------------

    revalidatePath("/admin/events");
    revalidatePath("/student/events");
    revalidatePath("/parent/events");
    revalidatePath("/teacher/events");
    revalidatePath("/admin/calendar");
    return { success: true, data: null };
  } catch (error) {
    console.error(`Failed to delete event with ID ${id}:`, error);
    return { success: false, error: "Failed to delete event", data: null };
  }
}

export async function updateEventStatus(id: string, status: EventStatus) {
  try {
    // Check if the event exists
    const existingEvent = await db.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return { success: false, error: "Event not found", data: null };
    }

    // Update the event status
    const updatedEvent = await db.event.update({
      where: { id },
      data: { status },
    });

    revalidatePath("/admin/events");
    revalidatePath("/student/events");
    revalidatePath("/parent/events");
    revalidatePath("/teacher/events");
    revalidatePath(`/admin/events/${id}`);
    return { success: true, data: updatedEvent };
  } catch (error) {
    console.error(`Failed to update status for event ${id}:`, error);
    return { success: false, error: "Failed to update event status", data: null };
  }
}

export async function addParticipant(participantData: EventParticipantData) {
  try {
    // Validate the data
    const validatedData = eventParticipantSchema.parse(participantData);

    // Check if the event exists
    const existingEvent = await db.event.findUnique({
      where: { id: validatedData.eventId },
      include: {
        _count: { select: { participants: true } },
      },
    });

    if (!existingEvent) {
      return { success: false, error: "Event not found", data: null };
    }

    // Check if the event has reached max participants
    if (
      existingEvent.maxParticipants &&
      existingEvent._count.participants >= existingEvent.maxParticipants
    ) {
      return { success: false, error: "Event has reached maximum participants", data: null };
    }

    // Check if the user is already a participant
    const existingParticipant = await db.eventParticipant.findUnique({
      where: {
        eventId_userId: {
          eventId: validatedData.eventId,
          userId: validatedData.userId,
        },
      },
    });

    if (existingParticipant) {
      return { success: false, error: "User is already registered for this event", data: null };
    }

    // Add the participant
    const participant = await db.eventParticipant.create({
      data: {
        eventId: validatedData.eventId,
        userId: validatedData.userId,
        role: validatedData.role,
        attended: validatedData.attended || false,
        feedback: validatedData.feedback,
      },
    });

    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${validatedData.eventId}`);
    return { success: true, data: participant };
  } catch (error) {
    console.error("Failed to add participant:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message, data: null };
    }
    return { success: false, error: "Failed to add participant", data: null };
  }
}

export async function removeParticipant(eventId: string, userId: string) {
  try {
    // Check if the participant exists
    const existingParticipant = await db.eventParticipant.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (!existingParticipant) {
      return { success: false, error: "Participant not found", data: null };
    }

    // Remove the participant
    await db.eventParticipant.delete({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${eventId}`);
    return { success: true, data: null };
  } catch (error) {
    console.error(`Failed to remove participant from event ${eventId}:`, error);
    return { success: false, error: "Failed to remove participant", data: null };
  }
}

export async function markAttendance(eventId: string, userId: string, attended: boolean) {
  try {
    // Check if the participant exists
    const existingParticipant = await db.eventParticipant.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (!existingParticipant) {
      return { success: false, error: "Participant not found", data: null };
    }

    // Update attendance
    const updatedParticipant = await db.eventParticipant.update({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      data: { attended },
    });

    revalidatePath(`/admin/events/${eventId}`);
    return { success: true, data: updatedParticipant };
  } catch (error) {
    console.error(`Failed to mark attendance for participant in event ${eventId}:`, error);
    return { success: false, error: "Failed to mark attendance", data: null };
  }
}

export async function getUpcomingEvents(limit: number = 5) {
  try {
    const now = new Date();

    // Get upcoming events
    const events = await db.event.findMany({
      where: {
        startDate: { gte: now },
        status: "UPCOMING",
      },
      orderBy: {
        startDate: 'asc',
      },
      take: limit,
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    return { success: true, data: events };
  } catch (error) {
    console.error("Failed to fetch upcoming events:", error);
    return { success: false, error: "Failed to fetch upcoming events", data: [] };
  }
}

export async function getEventParticipants(eventId: string) {
  try {
    const participants = await db.eventParticipant.findMany({
      where: {
        eventId,
      },
      orderBy: {
        registrationDate: 'desc',
      },
    });

    // Fetch user details for each participant
    const userIds = participants.map((p) => p.userId);
    const users = await db.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        image: true,
        student: {
          select: {
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
    });

    // Map users to participants
    const participantsWithUser = participants.map((participant) => {
      const user = users.find((u) => u.id === participant.userId);
      return {
        ...participant,
        user: user || null,
      };
    });

    return { success: true, data: participantsWithUser };
  } catch (error) {
    console.error(`Failed to fetch participants for event ${eventId}:`, error);
    return { success: false, error: "Failed to fetch event participants", data: [] };
  }
}
