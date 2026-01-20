import { z } from "zod";

// Event status enum that matches Prisma schema
export const EventStatusEnum = z.enum([
  "UPCOMING",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
  "POSTPONED"
]);

// Event type enum
export const EventTypeEnum = z.enum([
  "ACADEMIC",
  "CULTURAL",
  "SPORTS",
  "ADMINISTRATIVE",
  "HOLIDAY",
  "OTHER"
]);

// Event schema for creation and updates
export const eventSchema = z.object({
  id: z.string().optional(), // Optional for new events
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  location: z.string().optional(),
  organizer: z.string().optional(),
  type: EventTypeEnum.optional(),
  status: EventStatusEnum.default("UPCOMING"),
  maxParticipants: z.number().int().positive().optional(),
  registrationDeadline: z.coerce.date().optional(),
  isPublic: z.boolean().default(true),
  thumbnail: z.string().url().or(z.literal('')).optional(),
});

// Add a refinement for date validation
export const eventSchemaWithRefinement = eventSchema.refine(
  (data) => {
    // Ensure end date is after start date
    return data.endDate > data.startDate;
  },
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
).refine(
  (data) => {
    // Ensure registration deadline is before start date (if provided)
    if (data.registrationDeadline) {
      return data.registrationDeadline < data.startDate;
    }
    return true;
  },
  {
    message: "Registration deadline must be before event start date",
    path: ["registrationDeadline"],
  }
);

// Participant schema
export const eventParticipantSchema = z.object({
  id: z.string().optional(),
  eventId: z.string(),
  userId: z.string(),
  role: z.string().default("ATTENDEE"),
  attended: z.boolean().default(false),
  feedback: z.string().optional(),
});

// Schema for filtering events
export const eventFilterSchema = z.object({
  type: z.string().optional(),
  status: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isPublic: z.boolean().optional(),
  searchTerm: z.string().optional(),
});

export type EventFormData = z.infer<typeof eventSchema>;
export type EventFormDataWithRefinement = z.infer<typeof eventSchemaWithRefinement>;
export type EventFilterData = z.infer<typeof eventFilterSchema>;
export type EventParticipantData = z.infer<typeof eventParticipantSchema>;
