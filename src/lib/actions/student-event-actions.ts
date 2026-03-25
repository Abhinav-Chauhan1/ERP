"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole, EventStatus } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// Event registration schema
const eventRegistrationSchema = z.object({
  eventId: z.string().min(1, { message: "Event ID is required" }),
  studentId: z.string().min(1, { message: "Student ID is required" }),
  role: z.enum(["ATTENDEE", "PARTICIPANT", "VOLUNTEER", "ORGANIZER"]).default("ATTENDEE"),
  notes: z.string().optional(),
});

type EventRegistrationValues = z.infer<typeof eventRegistrationSchema>;

// Feedback schema
const eventFeedbackSchema = z.object({
  eventId: z.string().min(1, { message: "Event ID is required" }),
  participantId: z.string().min(1, { message: "Participant ID is required" }),
  rating: z.number().min(1).max(5),
  feedback: z.string().min(3, { message: "Feedback must be at least 3 characters" }),
});

type EventFeedbackValues = z.infer<typeof eventFeedbackSchema>;

/**
 * Get the current student — single auth call, returns schoolId too.
 */
async function getCurrentStudent() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const dbUser = await db.user.findUnique({ where: { id: userId } });
  if (!dbUser || dbUser.role !== UserRole.STUDENT) return null;

  const student = await db.student.findUnique({ where: { userId: dbUser.id } });
  const schoolId = session.user.schoolId as string | undefined;

  return { student, dbUser, schoolId };
}

/**
 * Get all events for a student — scoped to their school, single auth call.
 */
export async function getStudentEvents() {
  const result = await getCurrentStudent();
  if (!result?.student || !result?.dbUser) redirect("/login");

  const { dbUser, schoolId } = result;
  if (!schoolId) redirect("/login");

  const now = new Date();

  // Fetch all school events + student's registrations in parallel
  const [events, registrations] = await Promise.all([
    db.event.findMany({
      where: { schoolId, isPublic: true },
      orderBy: { startDate: "asc" },
    }),
    db.eventParticipant.findMany({
      where: { userId: dbUser.id, schoolId },
      select: { id: true, eventId: true, userId: true, role: true, attended: true, feedback: true, registrationDate: true, schoolId: true },
    }),
  ]);

  const registeredIds = new Set(registrations.map(r => r.eventId));

  // Attach participant info to events
  const eventsWithParticipants = events.map(e => ({
    ...e,
    participants: registrations.filter(r => r.eventId === e.id),
  }));

  const upcomingEvents = eventsWithParticipants.filter(
    e => e.status === EventStatus.UPCOMING || (e.startDate > now && e.status !== EventStatus.CANCELLED)
  );
  const ongoingEvents = eventsWithParticipants.filter(
    e => e.status === EventStatus.ONGOING || (e.startDate <= now && e.endDate >= now && e.status !== EventStatus.CANCELLED)
  );
  const pastEvents = eventsWithParticipants.filter(
    e => e.status === EventStatus.COMPLETED || (e.endDate < now && e.status !== EventStatus.CANCELLED)
  );
  const registeredEvents = eventsWithParticipants.filter(e => registeredIds.has(e.id));

  return {
    student: result.student,
    user: dbUser,
    allEvents: eventsWithParticipants,
    upcomingEvents,
    ongoingEvents,
    pastEvents,
    registeredEvents,
  };
}

/**
 * Get details of a specific event — scoped to student's school.
 */
export async function getEventDetails(eventId: string) {
  const result = await getCurrentStudent();
  if (!result?.student || !result?.dbUser) redirect("/login");

  const { dbUser, schoolId } = result;
  if (!schoolId) redirect("/login");

  const event = await db.event.findUnique({
    where: { id: eventId, schoolId },
    include: {
      participants: {
        where: { userId: dbUser.id },
      },
    },
  });

  if (!event) throw new Error("Event not found");

  const isRegistered = event.participants.length > 0;
  const registration = isRegistered ? event.participants[0] : null;

  return { student: result.student, user: dbUser, event, isRegistered, registration };
}

/**
 * Register for an event
 */
export async function registerForEvent(values: EventRegistrationValues) {
  const result = await getCurrentStudent();
  if (!result?.student || !result?.dbUser || !result?.schoolId) {
    return { success: false, message: "Authentication required" };
  }

  try {
    const { dbUser, student, schoolId } = result;
    const validatedData = eventRegistrationSchema.parse(values);

    const event = await db.event.findUnique({
      where: { id: validatedData.eventId, schoolId },
      include: { participants: true },
    });
    if (!event) return { success: false, message: "Event not found" };

    const now = new Date();
    if (event.registrationDeadline && event.registrationDeadline < now)
      return { success: false, message: "Registration for this event has closed" };
    if (event.maxParticipants && event.participants.length >= event.maxParticipants)
      return { success: false, message: "This event is already at maximum capacity" };

    const existing = await db.eventParticipant.findFirst({
      where: { eventId: validatedData.eventId, userId: dbUser.id },
    });
    if (existing) return { success: false, message: "You are already registered for this event" };

    await db.eventParticipant.create({
      data: {
        eventId: validatedData.eventId,
        userId: dbUser.id,
        role: validatedData.role,
        registrationDate: new Date(),
        feedback: validatedData.notes,
        schoolId,
      },
    });

    await db.notification.create({
      data: {
        userId: dbUser.id,
        title: "Event Registration Confirmed",
        message: `You have successfully registered for ${event.title}`,
        type: "INFO",
        schoolId,
      },
    });

    revalidatePath("/student/events");
    return { success: true, message: "You have successfully registered for the event" };
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, message: error.errors[0].message };
    console.error(error);
    return { success: false, message: "Failed to register for the event" };
  }
}

/**
 * Cancel event registration
 */
export async function cancelEventRegistration(eventId: string) {
  const result = await getCurrentStudent();
  if (!result?.dbUser || !result?.schoolId) return { success: false, message: "Authentication required" };

  try {
    const { dbUser, schoolId } = result;

    const registration = await db.eventParticipant.findFirst({
      where: { eventId, userId: dbUser.id },
      include: { event: true },
    });
    if (!registration) return { success: false, message: "You are not registered for this event" };

    const hoursUntilEvent = (new Date(registration.event.startDate).getTime() - Date.now()) / 3600000;
    if (hoursUntilEvent < 24)
      return { success: false, message: "Registration cannot be cancelled less than 24 hours before the event" };

    await db.eventParticipant.delete({ where: { id: registration.id } });

    await db.notification.create({
      data: {
        userId: dbUser.id,
        title: "Event Registration Cancelled",
        message: `Your registration for ${registration.event.title} has been cancelled`,
        type: "INFO",
        schoolId,
      },
    });

    revalidatePath("/student/events");
    return { success: true, message: "Your registration has been cancelled" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to cancel registration" };
  }
}

/**
 * Submit feedback for an event
 */
export async function submitEventFeedback(values: EventFeedbackValues) {
  const result = await getCurrentStudent();

  if (!result) {
    return { success: false, message: "Authentication required" };
  }

  try {
    // Validate data
    const validatedData = eventFeedbackSchema.parse(values);

    // Update the participant record
    await db.eventParticipant.update({
      where: {
        id: validatedData.participantId
      },
      data: {
        feedback: validatedData.feedback,
        attended: true
      }
    });

    revalidatePath("/student/events");
    return { success: true, message: "Thank you for your feedback" };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0].message || "Invalid feedback data"
      };
    }

    console.error(error);
    return {
      success: false,
      message: "Failed to submit feedback"
    };
  }
}

/**
 * Get upcoming events for the student dashboard — scoped to school.
 */
export async function getUpcomingEventsForDashboard() {
  const result = await getCurrentStudent();
  if (!result?.dbUser || !result?.schoolId) return [];

  const events = await db.event.findMany({
    where: {
      schoolId: result.schoolId,
      startDate: { gt: new Date() },
      participants: { some: { userId: result.dbUser.id } },
    },
    orderBy: { startDate: "asc" },
    take: 3,
  });

  return events;
}
