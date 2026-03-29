"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth-helpers";
import { UserRole, EventStatus } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSchoolAccess } from "@/lib/auth/tenant";

/**
 * Schema for event filters
 */
const eventFilterSchema = z.object({
  type: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  searchTerm: z.string().optional(),
  status: z.nativeEnum(EventStatus).optional(),
});

type EventFilter = z.infer<typeof eventFilterSchema>;

/**
 * Schema for event registration
 */
const eventRegistrationSchema = z.object({
  eventId: z.string().min(1, { message: "Event ID is required" }),
  childId: z.string().min(1, { message: "Child ID is required" }),
});

type EventRegistration = z.infer<typeof eventRegistrationSchema>;

/**
 * Helper function to get current parent, verify authentication, and return schoolId.
 * Single auth round-trip — reuses requireSchoolAccess which already calls auth().
 */
async function getCurrentParentWithSchool() {
  const { schoolId, userId } = await requireSchoolAccess();
  if (!schoolId || !userId) return null;

  const dbUser = await db.user.findUnique({ where: { id: userId } });
  if (!dbUser || dbUser.role !== UserRole.PARENT) return null;

  const parent = await db.parent.findUnique({ where: { userId: dbUser.id } });
  if (!parent) return null;

  return { parent, schoolId };
}

/**
 * Helper function to verify parent-child relationship
 */
async function verifyParentChildRelationship(
  parentId: string,
  childId: string
): Promise<boolean> {
  const relationship = await db.studentParent.findFirst({
    where: { parentId, studentId: childId }
  });
  return !!relationship;
}

/**
 * Get events with optional filtering
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
export async function getEvents(filters?: EventFilter) {
  try {
    const ctx = await getCurrentParentWithSchool();
    if (!ctx) return { success: false, message: "Unauthorized", data: [] };

    if (filters) eventFilterSchema.parse(filters);

    const where: any = { schoolId: ctx.schoolId, isPublic: true };
    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.startDate) where.startDate = { gte: filters.startDate };
    if (filters?.endDate) where.endDate = { lte: filters.endDate };
    if (filters?.searchTerm) {
      where.OR = [
        { title: { contains: filters.searchTerm, mode: "insensitive" } },
        { description: { contains: filters.searchTerm, mode: "insensitive" } },
        { location: { contains: filters.searchTerm, mode: "insensitive" } },
        { organizer: { contains: filters.searchTerm, mode: "insensitive" } },
      ];
    }

    const events = await db.event.findMany({
      where,
      include: { _count: { select: { participants: true } } },
      orderBy: { startDate: "asc" },
      take: 100, // Add limit to prevent unbounded query
    });

    return { success: true, data: events };
  } catch (error) {
    console.error("Failed to fetch events:", error);
    if (error instanceof z.ZodError) return { success: false, message: error.errors[0].message, data: [] };
    return { success: false, message: "Failed to fetch events", data: [] };
  }
}

/**
 * Register a child for an event
 * Requirements: 8.2, 8.3
 */
export async function registerForEvent(data: EventRegistration, schoolId: string) {
  try {
    const validated = eventRegistrationSchema.parse(data);

    const ctx = await getCurrentParentWithSchool();
    if (!ctx) return { success: false, message: "Unauthorized" };

    const hasAccess = await verifyParentChildRelationship(ctx.parent.id, validated.childId);
    if (!hasAccess) return { success: false, message: "Access denied" };

    const student = await db.student.findUnique({
      where: { id: validated.childId },
      select: { userId: true, user: { select: { firstName: true, lastName: true } } },
    });
    if (!student) return { success: false, message: "Student not found" };

    const event = await db.event.findUnique({
      where: { id: validated.eventId, schoolId: ctx.schoolId },
      include: { _count: { select: { participants: true } } },
    });
    if (!event) return { success: false, message: "Event not found" };
    if (!event.isPublic) return { success: false, message: "This event is not open for registration" };

    const now = new Date();
    if (event.registrationDeadline && event.registrationDeadline < now)
      return { success: false, message: "Registration deadline has passed" };
    if (event.maxParticipants && event._count.participants >= event.maxParticipants)
      return { success: false, message: "Event has reached maximum capacity" };
    if (event.status === EventStatus.CANCELLED) return { success: false, message: "This event has been cancelled" };
    if (event.status === EventStatus.COMPLETED) return { success: false, message: "This event has already been completed" };

    const existing = await db.eventParticipant.findUnique({
      where: { eventId_userId: { eventId: validated.eventId, userId: student.userId } },
    });
    if (existing) return { success: false, message: "Student is already registered for this event" };

    await db.eventParticipant.create({
      data: { eventId: validated.eventId, userId: student.userId, role: "ATTENDEE", registrationDate: new Date(), schoolId: ctx.schoolId },
    });

    await db.notification.create({
      data: { userId: student.userId, title: "Event Registration Confirmed", message: `You have been registered for ${event.title}`, type: "INFO", schoolId: ctx.schoolId },
    });

    revalidatePath("/parent/events");
    return { success: true, message: "Successfully registered for the event" };
  } catch (error) {
    console.error("Failed to register for event:", error);
    if (error instanceof z.ZodError) return { success: false, message: error.errors[0].message };
    return { success: false, message: "Failed to register for event" };
  }
}

/**
 * Cancel event registration for a child
 * Requirements: 8.3
 */
export async function cancelEventRegistration(registrationId: string, schoolId: string) {
  try {
    const ctx = await getCurrentParentWithSchool();
    if (!ctx) return { success: false, message: "Unauthorized" };

    const registration = await db.eventParticipant.findUnique({
      where: { id: registrationId },
      include: { event: true },
    });
    if (!registration) return { success: false, message: "Registration not found" };

    const student = await db.student.findFirst({ where: { userId: registration.userId } });
    if (!student) return { success: false, message: "Student not found" };

    const hasAccess = await verifyParentChildRelationship(ctx.parent.id, student.id);
    if (!hasAccess) return { success: false, message: "Access denied" };

    if (registration.event.startDate < new Date())
      return { success: false, message: "Cannot cancel registration for an event that has already started" };

    await db.eventParticipant.delete({ where: { id: registrationId } });

    await db.notification.create({
      data: { userId: registration.userId, title: "Event Registration Cancelled", message: `Your registration for ${registration.event.title} has been cancelled`, type: "INFO", schoolId: ctx.schoolId },
    });

    revalidatePath("/parent/events");
    return { success: true, message: "Registration cancelled successfully" };
  } catch (error) {
    console.error("Failed to cancel registration:", error);
    return { success: false, message: "Failed to cancel registration" };
  }
}

/**
 * Get registered events for a child
 * Requirements: 8.4, 8.5
 */
export async function getRegisteredEvents(childId: string) {
  try {
    const ctx = await getCurrentParentWithSchool();
    if (!ctx) return { success: false, message: "Unauthorized", data: [] };

    const hasAccess = await verifyParentChildRelationship(ctx.parent.id, childId);
    if (!hasAccess) return { success: false, message: "Access denied", data: [] };

    const student = await db.student.findUnique({ where: { id: childId }, select: { userId: true } });
    if (!student) return { success: false, message: "Student not found", data: [] };

    const registrations = await db.eventParticipant.findMany({
      where: { userId: student.userId, schoolId: ctx.schoolId },
      include: { event: { include: { _count: { select: { participants: true } } } } },
      orderBy: { registrationDate: "desc" },
    });

    const now = new Date();
    return {
      success: true,
      data: {
        all: registrations,
        upcoming: registrations.filter(r => r.event.startDate > now),
        past: registrations.filter(r => r.event.endDate < now),
      },
    };
  } catch (error) {
    console.error("Failed to fetch registered events:", error);
    return { success: false, message: "Failed to fetch registered events", data: [] };
  }
}

/**
 * Get event details
 * Requirements: 8.1, 8.2
 */
export async function getEventDetails(eventId: string, childId?: string) {
  try {
    const ctx = await getCurrentParentWithSchool();
    if (!ctx) return { success: false, message: "Unauthorized", data: null };

    const event = await db.event.findUnique({
      where: { id: eventId, schoolId: ctx.schoolId },
      include: { _count: { select: { participants: true } } },
    });
    if (!event) return { success: false, message: "Event not found", data: null };

    let isRegistered = false;
    let registration = null;

    if (childId) {
      const hasAccess = await verifyParentChildRelationship(ctx.parent.id, childId);
      if (hasAccess) {
        const student = await db.student.findUnique({ where: { id: childId }, select: { userId: true } });
        if (student) {
          registration = await db.eventParticipant.findUnique({
            where: { eventId_userId: { eventId, userId: student.userId } },
          });
          isRegistered = !!registration;
        }
      }
    }

    return { success: true, data: { event, isRegistered, registration } };
  } catch (error) {
    console.error("Failed to fetch event details:", error);
    return { success: false, message: "Failed to fetch event details", data: null };
  }
}

/**
 * Get upcoming events (for dashboard widget)
 * Requirements: 8.1, 8.5
 */
export async function getUpcomingEvents(limit: number = 5) {
  try {
    const ctx = await getCurrentParentWithSchool();
    if (!ctx) return { success: false, message: "Unauthorized", data: [] };

    const events = await db.event.findMany({
      where: {
        schoolId: ctx.schoolId,
        isPublic: true,
        startDate: { gte: new Date() },
        status: { in: [EventStatus.UPCOMING, EventStatus.ONGOING] },
      },
      include: { _count: { select: { participants: true } } },
      orderBy: { startDate: "asc" },
      take: limit,
    });

    return { success: true, data: events };
  } catch (error) {
    console.error("Failed to fetch upcoming events:", error);
    return { success: false, message: "Failed to fetch upcoming events", data: [] };
  }
}

/**
 * Get event types/categories
 * Requirements: 8.1, 8.4
 */
export async function getEventTypes() {
  try {
    const ctx = await getCurrentParentWithSchool();
    if (!ctx) return { success: false, message: "Unauthorized", data: [] };

    const events = await db.event.findMany({
      where: { schoolId: ctx.schoolId, isPublic: true, type: { not: null } },
      select: { type: true },
      distinct: ["type"],
    });

    const types = events.map(e => e.type).filter((t): t is string => t !== null).sort();
    return { success: true, data: types };
  } catch (error) {
    console.error("Failed to fetch event types:", error);
    return { success: false, message: "Failed to fetch event types", data: [] };
  }
}
