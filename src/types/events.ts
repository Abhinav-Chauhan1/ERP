import { Event, EventParticipant, EventStatus } from "@prisma/client";

export type EventWithParticipantCount = Event & {
  _count: {
    participants: number;
  };
};

export type EventWithRegistration = {
  event: EventWithParticipantCount;
  isRegistered: boolean;
  registration: EventParticipant | null;
};

export type EventRegistrationData = {
  eventId: string;
  childId: string;
};

export type EventFilterData = {
  type?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
  status?: EventStatus;
};

export type RegisteredEventsData = {
  all: (EventParticipant & { event: EventWithParticipantCount })[];
  upcoming: (EventParticipant & { event: EventWithParticipantCount })[];
  past: (EventParticipant & { event: EventWithParticipantCount })[];
};
