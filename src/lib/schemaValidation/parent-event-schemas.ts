import { z } from "zod";

// ============================================================================
// EVENT SCHEMAS
// ============================================================================

/**
 * Get events filter schema
 */
export const getEventsSchema = z.object({
  type: z.enum(["ACADEMIC", "SPORTS", "CULTURAL", "GENERAL"]).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(50),
});

export type GetEventsInput = z.infer<typeof getEventsSchema>;

/**
 * Register for event schema
 */
export const registerForEventSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  childId: z.string().min(1, "Child ID is required"),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

export type RegisterForEventInput = z.infer<typeof registerForEventSchema>;

/**
 * Cancel event registration schema
 */
export const cancelEventRegistrationSchema = z.object({
  registrationId: z.string().min(1, "Registration ID is required"),
  reason: z.string().min(10, "Cancellation reason must be at least 10 characters").max(500, "Reason must be less than 500 characters").optional(),
});

export type CancelEventRegistrationInput = z.infer<typeof cancelEventRegistrationSchema>;

/**
 * Get registered events schema
 */
export const getRegisteredEventsSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
  status: z.enum(["REGISTERED", "ATTENDED", "CANCELLED"]).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(50),
});

export type GetRegisteredEventsInput = z.infer<typeof getRegisteredEventsSchema>;

/**
 * Event detail schema (for responses)
 */
export const eventDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(["ACADEMIC", "SPORTS", "CULTURAL", "GENERAL"]),
  startDate: z.date(),
  endDate: z.date().nullable(),
  location: z.string().nullable(),
  maxParticipants: z.number().nullable(),
  currentParticipants: z.number(),
  registrationDeadline: z.date().nullable(),
  isRegistrationOpen: z.boolean(),
  requiresApproval: z.boolean(),
  attachments: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type EventDetail = z.infer<typeof eventDetailSchema>;

/**
 * Event registration detail schema (for responses)
 */
export const eventRegistrationDetailSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  eventTitle: z.string(),
  eventType: z.enum(["ACADEMIC", "SPORTS", "CULTURAL", "GENERAL"]),
  eventDate: z.date(),
  childId: z.string(),
  childName: z.string(),
  status: z.enum(["REGISTERED", "ATTENDED", "CANCELLED"]),
  registrationDate: z.date(),
  notes: z.string().nullable(),
});

export type EventRegistrationDetail = z.infer<typeof eventRegistrationDetailSchema>;

