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
} from "@/lib/services/calendar-service";
import { requireSchoolAccess } from "@/lib/auth/tenant";

const EVENT_PAGE_SIZE = 20;

export async function getEvents(filter?: EventFilterData & { page?: number }) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required", data: [], total: 0 };

    if (filter) eventFilterSchema.parse(filter);

    const where: any = { schoolId };

    if (filter?.type) where.type = filter.type;
    if (filter?.status) where.status = filter.status;
    if (filter?.isPublic !== undefined) where.isPublic = filter.isPublic;
    if (filter?.startDate) where.startDate = { gte: filter.startDate };
    if (filter?.endDate) where.endDate = { lte: filter.endDate };
    if (filter?.searchTerm) {
      where.OR = [
        { title: { contains: filter.searchTerm, mode: "insensitive" } },
        { description: { contains: filter.searchTerm, mode: "insensitive" } },
        { location: { contains: filter.searchTerm, mode: "insensitive" } },
        { organizer: { contains: filter.searchTerm, mode: "insensitive" } },
      ];
    }

    const page = filter?.page ?? 1;
    const skip = (page - 1) * EVENT_PAGE_SIZE;

    const [events, total] = await Promise.all([
      db.event.findMany({
        where,
        orderBy: { startDate: "asc" },
        include: { _count: { select: { participants: true } } },
        take: EVENT_PAGE_SIZE,
        skip,
      }),
      db.event.count({ where }),
    ]);

    return { success: true, data: events, total, page, pageSize: EVENT_PAGE_SIZE };
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return { success: false, error: "Failed to fetch events", data: [], total: 0 };
  }
}

export async function getEvent(id: string) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required", data: null };

    const event = await db.event.findUnique({
      where: { id, schoolId },
      include: {
        _count: { select: { participants: true } },
      },
    });

    if (!event) return { success: false, error: "Event not found", data: null };

    return { success: true, data: event };
  } catch (error) {
    console.error(`Failed to fetch event ${id}:`, error);
    return { success: false, error: "Failed to fetch event", data: null };
  }
}

// Helper to get or create Calendar Category ID based on Event Type
async function getCalendarCategoryId(eventType: string | undefined | null, schoolId: string): Promise<string> {
  const defaultCategoryName = "School Event";
  let searchName = defaultCategoryName;
  let color = "#10b981";
  let icon = "Star";
  let description = "School-wide events and activities";

  if (eventType === "HOLIDAY") {
    searchName = "Holiday"; color = "#ef4444"; icon = "Calendar"; description = "School holidays and breaks";
  } else if (eventType === "ADMINISTRATIVE") {
    searchName = "Meeting"; color = "#3b82f6"; icon = "Users"; description = "Meetings";
  } else if (eventType === "SPORTS") {
    searchName = "Sports Event"; color = "#f97316"; icon = "Trophy"; description = "Sports competitions";
  }

  let category = await db.calendarEventCategory.findFirst({
    where: { schoolId, name: { equals: searchName, mode: "insensitive" } },
  });

  if (category) return category.id;

  try {
    category = await db.calendarEventCategory.create({
      data: { schoolId, name: searchName, description, color, icon, isActive: true, order: 10 },
    });
    return category.id;
  } catch {
    const anyCategory = await db.calendarEventCategory.findFirst({ where: { schoolId } });
    return anyCategory?.id || "";
  }
}

export async function createEvent(formData: EventFormDataWithRefinement) {
  try {
    const validatedData = eventSchemaWithRefinement.parse(formData);
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required", data: null };

    const event = await db.event.create({
      data: {
        schoolId,
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

    // Sync with calendar (non-blocking)
    try {
      const calendarCategoryId = await getCalendarCategoryId(validatedData.type, schoolId);
      if (calendarCategoryId) {
        const visibleToRoles = validatedData.isPublic
          ? ["ADMIN", "TEACHER", "STUDENT", "PARENT"]
          : ["ADMIN", "TEACHER"];
        await createCalendarEvent({
          title: validatedData.title,
          description: validatedData.description || "",
          categoryId: calendarCategoryId,
          schoolId,
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
          location: validatedData.location || undefined,
          isAllDay: false,
          visibleToRoles,
          sourceType: EventSourceType.SCHOOL_EVENT,
          sourceId: event.id,
          createdBy: "SYSTEM",
        });
      }
    } catch (calendarError) {
      console.error("Failed to sync event to calendar:", calendarError);
    }

    // Notify all roles
    const notificationData = {
      title: `New Event: ${validatedData.title}`,
      message: `A new event "${validatedData.title}" has been scheduled.`,
      type: "INFO",
    };
    await Promise.all([
      createNotification({ ...notificationData, recipientRole: "STUDENT", link: "/student/events" }),
      createNotification({ ...notificationData, recipientRole: "PARENT", link: "/parent/events" }),
      createNotification({ ...notificationData, recipientRole: "TEACHER", link: "/teacher/events" }),
    ]);

    revalidatePath("/admin/events");
    revalidatePath("/student/events");
    revalidatePath("/parent/events");
    revalidatePath("/teacher/events");
    revalidatePath("/admin/calendar");
    return { success: true, data: event };
  } catch (error) {
    console.error("Failed to create event:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create event", data: null };
  }
}

function getCategoryFromType(type: string | undefined | null): EventCategory {
  switch (type) {
    case "ACADEMIC":
    case "CULTURAL":
    case "SPORTS":
      return EventCategory.SCHOOL_EVENT;
    case "ADMINISTRATIVE":
      return EventCategory.TEACHER_MEETING;
    case "HOLIDAY":
      return EventCategory.HOLIDAY;
    default:
      return EventCategory.OTHER;
  }
}

export async function updateEvent(id: string, formData: EventFormDataWithRefinement) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required", data: null };

    const validatedData = eventSchemaWithRefinement.parse(formData);

    const existingEvent = await db.event.findUnique({ where: { id, schoolId } });
    if (!existingEvent) return { success: false, error: "Event not found", data: null };

    const updatedEvent = await db.event.update({
      where: { id, schoolId },
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

    // Sync with calendar (non-blocking)
    try {
      const calendarEvent = await db.calendarEvent.findFirst({
        where: { sourceType: EventSourceType.SCHOOL_EVENT, sourceId: id },
      });
      if (calendarEvent) {
        const calendarCategoryId = await getCalendarCategoryId(validatedData.type, schoolId);
        await updateCalendarEvent(calendarEvent.id, {
          title: validatedData.title,
          description: validatedData.description || "",
          categoryId: calendarCategoryId || undefined,
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
          location: validatedData.location || undefined,
        });
      }
    } catch (calendarError) {
      console.error("Failed to sync event update to calendar:", calendarError);
    }

    revalidatePath("/admin/events");
    revalidatePath("/student/events");
    revalidatePath("/parent/events");
    revalidatePath("/teacher/events");
    revalidatePath(`/admin/events/${id}`);
    revalidatePath("/admin/calendar");
    return { success: true, data: updatedEvent };
  } catch (error) {
    console.error(`Failed to update event ${id}:`, error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update event", data: null };
  }
}

export async function deleteEvent(id: string) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required", data: null };

    const existingEvent = await db.event.findUnique({ where: { id, schoolId } });
    if (!existingEvent) return { success: false, error: "Event not found", data: null };

    await db.event.delete({ where: { id, schoolId } });

    // Sync with calendar (non-blocking)
    try {
      const calendarEvent = await db.calendarEvent.findFirst({
        where: { sourceType: EventSourceType.SCHOOL_EVENT, sourceId: id },
      });
      if (calendarEvent) await deleteCalendarEvent(calendarEvent.id);
    } catch (calendarError) {
      console.error("Failed to sync event deletion to calendar:", calendarError);
    }

    revalidatePath("/admin/events");
    revalidatePath("/student/events");
    revalidatePath("/parent/events");
    revalidatePath("/teacher/events");
    revalidatePath("/admin/calendar");
    return { success: true, data: null };
  } catch (error) {
    console.error(`Failed to delete event ${id}:`, error);
    return { success: false, error: "Failed to delete event", data: null };
  }
}

export async function updateEventStatus(id: string, status: EventStatus) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required", data: null };

    const existingEvent = await db.event.findUnique({ where: { id, schoolId } });
    if (!existingEvent) return { success: false, error: "Event not found", data: null };

    const updatedEvent = await db.event.update({ where: { id, schoolId }, data: { status } });

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
    const validatedData = eventParticipantSchema.parse(participantData);
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required", data: null };

    const existingEvent = await db.event.findUnique({
      where: { id: validatedData.eventId, schoolId },
      include: { _count: { select: { participants: true } } },
    });
    if (!existingEvent) return { success: false, error: "Event not found", data: null };

    if (existingEvent.maxParticipants && existingEvent._count.participants >= existingEvent.maxParticipants) {
      return { success: false, error: "Event has reached maximum participants", data: null };
    }

    const existingParticipant = await db.eventParticipant.findUnique({
      where: { eventId_userId: { eventId: validatedData.eventId, userId: validatedData.userId } },
    });
    if (existingParticipant) return { success: false, error: "User is already registered for this event", data: null };

    const participant = await db.eventParticipant.create({
      data: {
        schoolId,
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
    return { success: false, error: error instanceof Error ? error.message : "Failed to add participant", data: null };
  }
}

export async function removeParticipant(eventId: string, userId: string) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required", data: null };

    const event = await db.event.findUnique({ where: { id: eventId, schoolId } });
    if (!event) return { success: false, error: "Event not found", data: null };

    const existingParticipant = await db.eventParticipant.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (!existingParticipant) return { success: false, error: "Participant not found", data: null };

    await db.eventParticipant.delete({ where: { eventId_userId: { eventId, userId } } });

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
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required", data: null };

    const event = await db.event.findUnique({ where: { id: eventId, schoolId } });
    if (!event) return { success: false, error: "Event not found", data: null };

    const existingParticipant = await db.eventParticipant.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (!existingParticipant) return { success: false, error: "Participant not found", data: null };

    const updatedParticipant = await db.eventParticipant.update({
      where: { eventId_userId: { eventId, userId } },
      data: { attended },
    });

    revalidatePath(`/admin/events/${eventId}`);
    return { success: true, data: updatedParticipant };
  } catch (error) {
    console.error(`Failed to mark attendance for event ${eventId}:`, error);
    return { success: false, error: "Failed to mark attendance", data: null };
  }
}

export async function getUpcomingEvents(limit: number = 5) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required", data: [] };

    const events = await db.event.findMany({
      where: { schoolId, startDate: { gte: new Date() }, status: "UPCOMING" },
      orderBy: { startDate: "asc" },
      take: limit,
      include: { _count: { select: { participants: true } } },
    });

    return { success: true, data: events };
  } catch (error) {
    console.error("Failed to fetch upcoming events:", error);
    return { success: false, error: "Failed to fetch upcoming events", data: [] };
  }
}

export async function getEventParticipants(eventId: string) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required", data: [] };

    const event = await db.event.findUnique({ where: { id: eventId, schoolId } });
    if (!event) return { success: false, error: "Event not found", data: [] };

    // Single query with join instead of N+1
    const participants = await db.eventParticipant.findMany({
      where: { eventId, schoolId },
      orderBy: { registrationDate: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            avatar: true,
            student: {
              select: {
                enrollments: {
                  where: { status: "ACTIVE" },
                  take: 1,
                  include: { class: true, section: true },
                },
              },
            },
          },
        },
      },
    });

    return { success: true, data: participants };
  } catch (error) {
    console.error(`Failed to fetch participants for event ${eventId}:`, error);
    return { success: false, error: "Failed to fetch event participants", data: [] };
  }
}

/**
 * Fetch both events list and upcoming events in a single auth round-trip.
 * Used by the admin events page to avoid double auth overhead.
 */
export async function getEventsPageData(filter?: EventFilterData & { page?: number }) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required", events: [], total: 0, upcomingEvents: [] };

    if (filter) eventFilterSchema.parse(filter);

    const where: any = { schoolId };
    if (filter?.type) where.type = filter.type;
    if (filter?.status) where.status = filter.status;
    if (filter?.isPublic !== undefined) where.isPublic = filter.isPublic;
    if (filter?.startDate) where.startDate = { gte: filter.startDate };
    if (filter?.endDate) where.endDate = { lte: filter.endDate };
    if (filter?.searchTerm) {
      where.OR = [
        { title: { contains: filter.searchTerm, mode: "insensitive" } },
        { description: { contains: filter.searchTerm, mode: "insensitive" } },
        { location: { contains: filter.searchTerm, mode: "insensitive" } },
        { organizer: { contains: filter.searchTerm, mode: "insensitive" } },
      ];
    }

    const page = filter?.page ?? 1;
    const skip = (page - 1) * EVENT_PAGE_SIZE;

    const now = new Date();
    const upcomingWhere = {
      schoolId,
      startDate: { gte: now },
      status: "UPCOMING" as EventStatus,
    };

    const [events, total, upcomingEvents] = await Promise.all([
      db.event.findMany({
        where,
        orderBy: { startDate: "asc" },
        include: { _count: { select: { participants: true } } },
        take: EVENT_PAGE_SIZE,
        skip,
      }),
      db.event.count({ where }),
      db.event.findMany({
        where: upcomingWhere,
        orderBy: { startDate: "asc" },
        take: 3,
        include: { _count: { select: { participants: true } } },
      }),
    ]);

    return { success: true, events, total, page, pageSize: EVENT_PAGE_SIZE, upcomingEvents };
  } catch (error) {
    console.error("Failed to fetch events page data:", error);
    return { success: false, error: "Failed to fetch events", events: [], total: 0, upcomingEvents: [] };
  }
}
