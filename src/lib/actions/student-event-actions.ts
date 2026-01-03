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
 * Get the current student
 */
async function getCurrentStudent() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  // Get user from database
  const dbUser = await db.user.findUnique({
    where: {
      id: userId
    }
  });

  if (!dbUser || dbUser.role !== UserRole.STUDENT) {
    return null;
  }

  const student = await db.student.findUnique({
    where: {
      userId: dbUser.id
    }
  });

  return { student, dbUser };
}

/**
 * Get all events for a student
 */
export async function getStudentEvents() {
  const result = await getCurrentStudent();

  if (!result) {
    redirect("/login");
  }

  // Get all events
  const events = await db.event.findMany({
    where: {
      isPublic: true
    },
    include: {
      participants: {
        where: {
          userId: result.dbUser.id
        }
      }
    },
    orderBy: {
      startDate: 'asc'
    }
  });

  // Categorize events
  const now = new Date();

  const upcomingEvents = events.filter(event =>
    event.status === EventStatus.UPCOMING ||
    (event.startDate > now && event.status !== EventStatus.CANCELLED)
  );

  const ongoingEvents = events.filter(event =>
    event.status === EventStatus.ONGOING ||
    (event.startDate <= now && event.endDate >= now && event.status !== EventStatus.CANCELLED)
  );

  const pastEvents = events.filter(event =>
    event.status === EventStatus.COMPLETED ||
    (event.endDate < now && event.status !== EventStatus.CANCELLED)
  );

  // Get user's registered events
  const registeredEvents = events.filter(event =>
    event.participants.length > 0
  );

  return {
    student: result.student,
    user: result.dbUser,
    allEvents: events,
    upcomingEvents,
    ongoingEvents,
    pastEvents,
    registeredEvents
  };
}

/**
 * Get details of a specific event
 */
export async function getEventDetails(eventId: string) {
  const result = await getCurrentStudent();

  if (!result) {
    redirect("/login");
  }

  const event = await db.event.findUnique({
    where: {
      id: eventId
    },
    include: {
      participants: {
        where: {
          userId: result.dbUser.id
        }
      }
    }
  });

  if (!event) {
    throw new Error("Event not found");
  }

  // Check if the student is registered
  const isRegistered = event.participants.length > 0;

  // Get registration details if registered
  const registration = isRegistered ? event.participants[0] : null;

  return {
    student: result.student,
    user: result.dbUser,
    event,
    isRegistered,
    registration
  };
}

/**
 * Register for an event
 */
export async function registerForEvent(values: EventRegistrationValues) {
  const result = await getCurrentStudent();

  if (!result) {
    return { success: false, message: "Authentication required" };
  }

  try {
    const { dbUser, student } = result;

    // Validate data
    const validatedData = eventRegistrationSchema.parse(values);

    // Get the event
    const event = await db.event.findUnique({
      where: { id: validatedData.eventId },
      include: {
        participants: true
      }
    });

    if (!event) {
      return { success: false, message: "Event not found" };
    }

    // Check if registration is open
    const now = new Date();
    const isRegistrationClosed = event.registrationDeadline && event.registrationDeadline < now;

    if (isRegistrationClosed) {
      return { success: false, message: "Registration for this event has closed" };
    }

    // Check if event is full
    if (event.maxParticipants && event.participants.length >= event.maxParticipants) {
      return { success: false, message: "This event is already at maximum capacity" };
    }

    // Check if student is already registered
    const existingRegistration = await db.eventParticipant.findFirst({
      where: {
        eventId: validatedData.eventId,
        userId: dbUser.id
      }
    });

    if (existingRegistration) {
      return { success: false, message: "You are already registered for this event" };
    }

    // Create registration
    await db.eventParticipant.create({
      data: {
        eventId: validatedData.eventId,
        userId: dbUser.id,
        role: validatedData.role,
        registrationDate: new Date(),
        feedback: validatedData.notes,
      }
    });

    // Create notification
    await db.notification.create({
      data: {
        userId: dbUser.id,
        title: "Event Registration Confirmed",
        message: `You have successfully registered for ${event.title}`,
        type: "INFO"
      }
    });

    revalidatePath("/student/events");
    return { success: true, message: "You have successfully registered for the event" };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0].message || "Invalid registration data"
      };
    }

    console.error(error);
    return {
      success: false,
      message: "Failed to register for the event"
    };
  }
}

/**
 * Cancel event registration
 */
export async function cancelEventRegistration(eventId: string) {
  const result = await getCurrentStudent();

  if (!result) {
    return { success: false, message: "Authentication required" };
  }

  try {
    const { dbUser } = result;

    // Find the registration
    const registration = await db.eventParticipant.findFirst({
      where: {
        eventId,
        userId: dbUser.id
      },
      include: {
        event: true
      }
    });

    if (!registration) {
      return { success: false, message: "You are not registered for this event" };
    }

    // Check if it's too late to cancel
    const now = new Date();
    const eventStartTime = new Date(registration.event.startDate);
    const hoursUntilEvent = (eventStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilEvent < 24) {
      return {
        success: false,
        message: "Registration cannot be cancelled less than 24 hours before the event"
      };
    }

    // Delete the registration
    await db.eventParticipant.delete({
      where: {
        id: registration.id
      }
    });

    // Create notification
    await db.notification.create({
      data: {
        userId: dbUser.id,
        title: "Event Registration Cancelled",
        message: `Your registration for ${registration.event.title} has been cancelled`,
        type: "INFO"
      }
    });

    revalidatePath("/student/events");
    return { success: true, message: "Your registration has been cancelled" };

  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to cancel registration"
    };
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
 * Get upcoming events for the student dashboard
 */
export async function getUpcomingEventsForDashboard() {
  const result = await getCurrentStudent();

  if (!result) {
    return [];
  }

  // Get upcoming events that the student is registered for
  const now = new Date();
  const events = await db.event.findMany({
    where: {
      startDate: {
        gt: now
      },
      participants: {
        some: {
          userId: result.dbUser.id
        }
      }
    },
    orderBy: {
      startDate: 'asc'
    },
    take: 3
  });

  return events;
}
