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
import { EventStatus, EventCategory } from "@prisma/client";

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

    revalidatePath("/admin/events");
    revalidatePath("/student/events");
    revalidatePath("/parent/events");
    revalidatePath("/teacher/events");
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

    revalidatePath("/admin/events");
    revalidatePath("/student/events");
    revalidatePath("/parent/events");
    revalidatePath("/teacher/events");
    revalidatePath(`/admin/events/${id}`);
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

    revalidatePath("/admin/events");
    revalidatePath("/student/events");
    revalidatePath("/parent/events");
    revalidatePath("/teacher/events");
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
      include: {
        // Cannot directly include user since it appears to be a foreign key
        // Include any other relationships that you need
      },
      orderBy: {
        registrationDate: 'desc',
      },
    });

    return { success: true, data: participants };
  } catch (error) {
    console.error(`Failed to fetch participants for event ${eventId}:`, error);
    return { success: false, error: "Failed to fetch event participants", data: [] };
  }
}
