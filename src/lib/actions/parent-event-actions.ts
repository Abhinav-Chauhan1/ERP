"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth-helpers";
import { UserRole, EventStatus } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";

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
 * Helper function to get current parent and verify authentication
 */
async function getCurrentParent() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    return null;
  }
  
  const dbUser = await db.user.findUnique({
    where: { id: clerkUser.id }
  });
  
  if (!dbUser || dbUser.role !== UserRole.PARENT) {
    return null;
  }
  
  const parent = await db.parent.findUnique({
    where: {
      userId: dbUser.id
    }
  });
  
  return parent;
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
    // Get current parent
    const parent = await getCurrentParent();
    if (!parent) {
      return { success: false, message: "Unauthorized", data: [] };
    }
    
    // Validate filters if provided
    let validated = {};
    if (filters) {
      validated = eventFilterSchema.parse(filters);
    }
    
    // Build query filters
    const where: any = {
      isPublic: true // Parents can only see public events
    };
    
    // Add type filter
    if (filters?.type) {
      where.type = filters.type;
    }
    
    // Add status filter
    if (filters?.status) {
      where.status = filters.status;
    }
    
    // Add date range filter
    if (filters?.startDate) {
      where.startDate = {
        gte: filters.startDate
      };
    }
    
    if (filters?.endDate) {
      where.endDate = {
        lte: filters.endDate
      };
    }
    
    // Add search filter
    if (filters?.searchTerm) {
      where.OR = [
        { title: { contains: filters.searchTerm, mode: 'insensitive' } },
        { description: { contains: filters.searchTerm, mode: 'insensitive' } },
        { location: { contains: filters.searchTerm, mode: 'insensitive' } },
        { organizer: { contains: filters.searchTerm, mode: 'insensitive' } },
      ];
    }
    
    // Fetch events
    const events = await db.event.findMany({
      where,
      include: {
        _count: {
          select: {
            participants: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    });
    
    return { success: true, data: events };
  } catch (error) {
    console.error("Failed to fetch events:", error);
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        message: error.errors[0].message || "Invalid filter data",
        data: []
      };
    }
    return { success: false, message: "Failed to fetch events", data: [] };
  }
}

/**
 * Register a child for an event
 * Requirements: 8.2, 8.3
 */
export async function registerForEvent(data: EventRegistration) {
  try {
    // Validate input
    const validated = eventRegistrationSchema.parse(data);
    
    // Get current parent
    const parent = await getCurrentParent();
    if (!parent) {
      return { success: false, message: "Unauthorized" };
    }
    
    // Verify parent-child relationship
    const hasAccess = await verifyParentChildRelationship(parent.id, validated.childId);
    if (!hasAccess) {
      return { success: false, message: "Access denied" };
    }
    
    // Get student user ID
    const student = await db.student.findUnique({
      where: { id: validated.childId },
      select: { userId: true, user: { select: { firstName: true, lastName: true } } }
    });
    
    if (!student) {
      return { success: false, message: "Student not found" };
    }
    
    // Get the event
    const event = await db.event.findUnique({
      where: { id: validated.eventId },
      include: {
        _count: {
          select: {
            participants: true
          }
        }
      }
    });
    
    if (!event) {
      return { success: false, message: "Event not found" };
    }
    
    // Check if event is public
    if (!event.isPublic) {
      return { success: false, message: "This event is not open for registration" };
    }
    
    // Check if registration deadline has passed
    const now = new Date();
    if (event.registrationDeadline && event.registrationDeadline < now) {
      return { success: false, message: "Registration deadline has passed" };
    }
    
    // Check if event is full
    if (event.maxParticipants && event._count.participants >= event.maxParticipants) {
      return { success: false, message: "Event has reached maximum capacity" };
    }
    
    // Check if event is cancelled or completed
    if (event.status === EventStatus.CANCELLED) {
      return { success: false, message: "This event has been cancelled" };
    }
    
    if (event.status === EventStatus.COMPLETED) {
      return { success: false, message: "This event has already been completed" };
    }
    
    // Check if student is already registered
    const existingRegistration = await db.eventParticipant.findUnique({
      where: {
        eventId_userId: {
          eventId: validated.eventId,
          userId: student.userId
        }
      }
    });
    
    if (existingRegistration) {
      return { success: false, message: "Student is already registered for this event" };
    }
    
    // Create registration
    await db.eventParticipant.create({
      data: {
        eventId: validated.eventId,
        userId: student.userId,
        role: "ATTENDEE",
        registrationDate: new Date()
      }
    });
    
    // Create notification for student
    await db.notification.create({
      data: {
        userId: student.userId,
        title: "Event Registration Confirmed",
        message: `You have been registered for ${event.title}`,
        type: "INFO"
      }
    });
    
    revalidatePath("/parent/events");
    return { success: true, message: "Successfully registered for the event" };
  } catch (error) {
    console.error("Failed to register for event:", error);
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        message: error.errors[0].message || "Invalid registration data"
      };
    }
    return { success: false, message: "Failed to register for event" };
  }
}

/**
 * Cancel event registration for a child
 * Requirements: 8.3
 */
export async function cancelEventRegistration(registrationId: string) {
  try {
    // Get current parent
    const parent = await getCurrentParent();
    if (!parent) {
      return { success: false, message: "Unauthorized" };
    }
    
    // Get registration with event and student details
    const registration = await db.eventParticipant.findUnique({
      where: { id: registrationId },
      include: {
        event: true
      }
    });
    
    if (!registration) {
      return { success: false, message: "Registration not found" };
    }
    
    // Get student from userId
    const student = await db.student.findFirst({
      where: { userId: registration.userId }
    });
    
    if (!student) {
      return { success: false, message: "Student not found" };
    }
    
    // Verify parent-child relationship
    const hasAccess = await verifyParentChildRelationship(parent.id, student.id);
    if (!hasAccess) {
      return { success: false, message: "Access denied" };
    }
    
    // Check if event has already started or completed
    const now = new Date();
    if (registration.event.startDate < now) {
      return { 
        success: false, 
        message: "Cannot cancel registration for an event that has already started" 
      };
    }
    
    // Delete the registration
    await db.eventParticipant.delete({
      where: { id: registrationId }
    });
    
    // Create notification for student
    await db.notification.create({
      data: {
        userId: registration.userId,
        title: "Event Registration Cancelled",
        message: `Your registration for ${registration.event.title} has been cancelled`,
        type: "INFO"
      }
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
    // Get current parent
    const parent = await getCurrentParent();
    if (!parent) {
      return { success: false, message: "Unauthorized", data: [] };
    }
    
    // Verify parent-child relationship
    const hasAccess = await verifyParentChildRelationship(parent.id, childId);
    if (!hasAccess) {
      return { success: false, message: "Access denied", data: [] };
    }
    
    // Get student user ID
    const student = await db.student.findUnique({
      where: { id: childId },
      select: { userId: true }
    });
    
    if (!student) {
      return { success: false, message: "Student not found", data: [] };
    }
    
    // Fetch registered events
    const registrations = await db.eventParticipant.findMany({
      where: {
        userId: student.userId
      },
      include: {
        event: {
          include: {
            _count: {
              select: {
                participants: true
              }
            }
          }
        }
      },
      orderBy: {
        registrationDate: 'desc'
      }
    });
    
    // Categorize events
    const now = new Date();
    const upcoming = registrations.filter(r => r.event.startDate > now);
    const past = registrations.filter(r => r.event.endDate < now);
    
    return { 
      success: true, 
      data: {
        all: registrations,
        upcoming,
        past
      }
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
    // Get current parent
    const parent = await getCurrentParent();
    if (!parent) {
      return { success: false, message: "Unauthorized", data: null };
    }
    
    // Get event
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            participants: true
          }
        }
      }
    });
    
    if (!event) {
      return { success: false, message: "Event not found", data: null };
    }
    
    // If childId is provided, check if child is registered
    let isRegistered = false;
    let registration = null;
    
    if (childId) {
      // Verify parent-child relationship
      const hasAccess = await verifyParentChildRelationship(parent.id, childId);
      if (hasAccess) {
        // Get student user ID
        const student = await db.student.findUnique({
          where: { id: childId },
          select: { userId: true }
        });
        
        if (student) {
          registration = await db.eventParticipant.findUnique({
            where: {
              eventId_userId: {
                eventId,
                userId: student.userId
              }
            }
          });
          isRegistered = !!registration;
        }
      }
    }
    
    return { 
      success: true, 
      data: {
        event,
        isRegistered,
        registration
      }
    };
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
    // Get current parent
    const parent = await getCurrentParent();
    if (!parent) {
      return { success: false, message: "Unauthorized", data: [] };
    }
    
    const now = new Date();
    
    // Get upcoming public events
    const events = await db.event.findMany({
      where: {
        isPublic: true,
        startDate: {
          gte: now
        },
        status: {
          in: [EventStatus.UPCOMING, EventStatus.ONGOING]
        }
      },
      include: {
        _count: {
          select: {
            participants: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      },
      take: limit
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
    // Get current parent
    const parent = await getCurrentParent();
    if (!parent) {
      return { success: false, message: "Unauthorized", data: [] };
    }
    
    // Get distinct event types
    const events = await db.event.findMany({
      where: {
        isPublic: true,
        type: {
          not: null
        }
      },
      select: {
        type: true
      },
      distinct: ['type']
    });
    
    const types = events
      .map(e => e.type)
      .filter((type): type is string => type !== null)
      .sort();
    
    return { success: true, data: types };
  } catch (error) {
    console.error("Failed to fetch event types:", error);
    return { success: false, message: "Failed to fetch event types", data: [] };
  }
}
