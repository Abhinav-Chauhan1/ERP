/**
 * Calendar Service
 * 
 * Provides CRUD operations for calendar events with validation,
 * recurrence rule parsing, and instance generation.
 * 
 * Requirements: 1.1, 1.3
 */

import { PrismaClient, CalendarEvent, EventSourceType } from '@prisma/client';
import { RRule, RRuleSet, rrulestr } from 'rrule';
import { sortEvents, SortOptions } from '@/lib/utils/calendar-sorting';
import { synchronizeRemindersOnEventUpdate } from './event-reminder-service';
import { invalidateCalendarEventCache } from '@/lib/utils/cache-invalidation';

const prisma = new PrismaClient();

// Types for event creation and updates
export interface CreateCalendarEventInput {
  title: string;
  description?: string;
  categoryId: string;
  startDate: Date;
  endDate: Date;
  isAllDay?: boolean;
  location?: string;
  visibleToRoles: string[];
  visibleToClasses?: string[];
  visibleToSections?: string[];
  sourceType?: EventSourceType;
  sourceId?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  exceptionDates?: Date[];
  attachments?: string[];
  createdBy: string;
}

export interface UpdateCalendarEventInput {
  title?: string;
  description?: string;
  categoryId?: string;
  startDate?: Date;
  endDate?: Date;
  isAllDay?: boolean;
  location?: string;
  visibleToRoles?: string[];
  visibleToClasses?: string[];
  visibleToSections?: string[];
  attachments?: string[];
  recurrenceRule?: string;
  exceptionDates?: Date[];
}

export type RecurringUpdateType = 'single' | 'future' | 'all';

// Validation errors
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates calendar event data
 * Requirement 1.1: Validate all required fields including title, date, time, category, and description
 */
export function validateEventData(data: CreateCalendarEventInput | UpdateCalendarEventInput): void {
  // For creation, check required fields
  if ('createdBy' in data) {
    const createData = data as CreateCalendarEventInput;
    
    if (!createData.title || createData.title.trim() === '') {
      throw new ValidationError('Title is required');
    }
    
    if (!createData.startDate) {
      throw new ValidationError('Start date is required');
    }
    
    if (!createData.endDate) {
      throw new ValidationError('End date is required');
    }
    
    if (!createData.categoryId) {
      throw new ValidationError('Category is required');
    }
    
    if (!createData.visibleToRoles || createData.visibleToRoles.length === 0) {
      throw new ValidationError('At least one visible role is required');
    }
  }
  
  // Validate date range
  if (data.startDate && data.endDate) {
    if (data.endDate < data.startDate) {
      throw new ValidationError('End date must be after start date');
    }
  }
  
  // Validate recurrence rule if provided
  if (data.recurrenceRule) {
    try {
      rrulestr(data.recurrenceRule);
    } catch (error) {
      throw new ValidationError('Invalid recurrence pattern');
    }
  }
}

/**
 * Parses recurrence rule and generates event instances
 * Requirement 1.3: Generate all event instances based on the recurrence pattern
 * 
 * Note: For production use, prefer generateRecurringInstancesOptimized from recurring-event-optimizer
 * which includes caching and performance optimizations
 */
export function generateRecurringInstances(
  baseEvent: CalendarEvent,
  startDate: Date,
  endDate: Date
): Array<{ startDate: Date; endDate: Date }> {
  if (!baseEvent.isRecurring || !baseEvent.recurrenceRule) {
    return [];
  }

  try {
    // Parse the recurrence rule with the base event's start date as dtstart
    const rule = rrulestr(baseEvent.recurrenceRule, {
      dtstart: baseEvent.startDate
    });
    
    // Get occurrences between the date range
    const occurrences = rule.between(startDate, endDate, true);
    
    // Calculate event duration
    const duration = baseEvent.endDate.getTime() - baseEvent.startDate.getTime();
    
    // Filter out exception dates
    const exceptionTimes = new Set(
      baseEvent.exceptionDates.map(d => d.getTime())
    );
    
    return occurrences
      .filter(occurrence => !exceptionTimes.has(occurrence.getTime()))
      .map(occurrence => ({
        startDate: occurrence,
        endDate: new Date(occurrence.getTime() + duration)
      }));
  } catch (error) {
    console.error('Error generating recurring instances:', error);
    return [];
  }
}

/**
 * Creates a new calendar event
 */
export async function createCalendarEvent(
  data: CreateCalendarEventInput
): Promise<CalendarEvent> {
  // Validate input
  validateEventData(data);
  
  // Verify category exists
  const category = await prisma.calendarEventCategory.findUnique({
    where: { id: data.categoryId }
  });
  
  if (!category) {
    throw new ValidationError('Selected category does not exist');
  }
  
  // Generate recurrence ID for recurring events
  const recurrenceId = data.isRecurring ? `rec_${Date.now()}` : null;
  
  // Create the event
  const event = await prisma.calendarEvent.create({
    data: {
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      startDate: data.startDate,
      endDate: data.endDate,
      isAllDay: data.isAllDay ?? false,
      location: data.location,
      visibleToRoles: data.visibleToRoles,
      visibleToClasses: data.visibleToClasses ?? [],
      visibleToSections: data.visibleToSections ?? [],
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      isRecurring: data.isRecurring ?? false,
      recurrenceRule: data.recurrenceRule,
      recurrenceId: recurrenceId,
      exceptionDates: data.exceptionDates ?? [],
      attachments: data.attachments ?? [],
      createdBy: data.createdBy
    },
    include: {
      category: true,
      notes: true,
      reminders: true
    }
  });
  
  // Invalidate calendar cache
  await invalidateCalendarEventCache(event.id);
  
  return event;
}

/**
 * Gets a calendar event by ID
 */
export async function getCalendarEventById(
  eventId: string
): Promise<CalendarEvent | null> {
  return await prisma.calendarEvent.findUnique({
    where: { id: eventId },
    include: {
      category: true,
      notes: true,
      reminders: true
    }
  });
}

/**
 * Gets calendar events with filtering and sorting
 */
export async function getCalendarEvents(
  filters: {
    startDate?: Date;
    endDate?: Date;
    categoryIds?: string[];
    visibleToRoles?: string[];
    classIds?: string[];
    sectionIds?: string[];
    sourceType?: EventSourceType;
    sourceId?: string;
    createdBy?: string;
  },
  sortOptions?: SortOptions
): Promise<CalendarEvent[]> {
  const where: any = {};
  
  // Date range filter
  if (filters.startDate || filters.endDate) {
    where.AND = [];
    if (filters.startDate) {
      where.AND.push({ endDate: { gte: filters.startDate } });
    }
    if (filters.endDate) {
      where.AND.push({ startDate: { lte: filters.endDate } });
    }
  }
  
  // Category filter
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    where.categoryId = { in: filters.categoryIds };
  }
  
  // Role filter
  if (filters.visibleToRoles && filters.visibleToRoles.length > 0) {
    where.visibleToRoles = { hasSome: filters.visibleToRoles };
  }
  
  // Class filter
  if (filters.classIds && filters.classIds.length > 0) {
    where.visibleToClasses = { hasSome: filters.classIds };
  }
  
  // Section filter
  if (filters.sectionIds && filters.sectionIds.length > 0) {
    where.visibleToSections = { hasSome: filters.sectionIds };
  }
  
  // Source type filter
  if (filters.sourceType) {
    where.sourceType = filters.sourceType;
  }
  
  // Source ID filter
  if (filters.sourceId) {
    where.sourceId = filters.sourceId;
  }
  
  // Created by filter
  if (filters.createdBy) {
    where.createdBy = filters.createdBy;
  }
  
  const events = await prisma.calendarEvent.findMany({
    where,
    include: {
      category: true,
      notes: true,
      reminders: true
    },
    orderBy: {
      startDate: 'asc'
    }
  });
  
  // Apply custom sorting if provided
  if (sortOptions) {
    return sortEvents(events, sortOptions);
  }
  
  return events;
}

/**
 * Updates a calendar event
 * For recurring events, supports updating single instance, future instances, or all instances
 */
export async function updateCalendarEvent(
  eventId: string,
  data: UpdateCalendarEventInput,
  updateType: RecurringUpdateType = 'single'
): Promise<CalendarEvent | CalendarEvent[]> {
  // Validate input
  validateEventData(data);
  
  // Get the existing event
  const existingEvent = await getCalendarEventById(eventId);
  if (!existingEvent) {
    throw new ValidationError('Event not found');
  }
  
  // Verify category if being updated
  if (data.categoryId) {
    const category = await prisma.calendarEventCategory.findUnique({
      where: { id: data.categoryId }
    });
    if (!category) {
      throw new ValidationError('Selected category does not exist');
    }
  }
  
  // Handle non-recurring events or single instance updates
  if (!existingEvent.isRecurring || updateType === 'single') {
    const updated = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        startDate: data.startDate,
        endDate: data.endDate,
        isAllDay: data.isAllDay,
        location: data.location,
        visibleToRoles: data.visibleToRoles,
        visibleToClasses: data.visibleToClasses,
        visibleToSections: data.visibleToSections,
        attachments: data.attachments,
        recurrenceRule: data.recurrenceRule,
        exceptionDates: data.exceptionDates
      },
      include: {
        category: true,
        notes: true,
        reminders: true
      }
    });
    
    // Synchronize reminders if date changed
    // Requirement 5.5: Send updated reminders when event is updated
    if (data.startDate && data.startDate.getTime() !== existingEvent.startDate.getTime()) {
      await synchronizeRemindersOnEventUpdate(
        eventId,
        existingEvent.startDate,
        data.startDate
      );
    }
    
    // Invalidate calendar cache
    await invalidateCalendarEventCache(eventId);
    
    return updated;
  }
  
  // Handle recurring event updates
  if (updateType === 'all') {
    // Update all instances with the same recurrenceId
    const updated = await prisma.calendarEvent.updateMany({
      where: { recurrenceId: existingEvent.recurrenceId },
      data: {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        location: data.location,
        visibleToRoles: data.visibleToRoles,
        visibleToClasses: data.visibleToClasses,
        visibleToSections: data.visibleToSections,
        recurrenceRule: data.recurrenceRule
      }
    });
    
    // Return all updated events
    const updatedEvents = await prisma.calendarEvent.findMany({
      where: { recurrenceId: existingEvent.recurrenceId },
      include: {
        category: true,
        notes: true,
        reminders: true
      }
    });
    
    // Invalidate calendar cache
    await invalidateCalendarEventCache();
    
    return updatedEvents;
  }
  
  if (updateType === 'future') {
    // Update this and all future instances
    const updated = await prisma.calendarEvent.updateMany({
      where: {
        recurrenceId: existingEvent.recurrenceId,
        startDate: { gte: existingEvent.startDate }
      },
      data: {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        location: data.location,
        visibleToRoles: data.visibleToRoles,
        visibleToClasses: data.visibleToClasses,
        visibleToSections: data.visibleToSections,
        recurrenceRule: data.recurrenceRule
      }
    });
    
    // Return all updated events
    const updatedEvents = await prisma.calendarEvent.findMany({
      where: {
        recurrenceId: existingEvent.recurrenceId,
        startDate: { gte: existingEvent.startDate }
      },
      include: {
        category: true,
        notes: true,
        reminders: true
      }
    });
    
    // Invalidate calendar cache
    await invalidateCalendarEventCache();
    
    return updatedEvents;
  }
  
  throw new ValidationError('Invalid update type');
}

/**
 * Deletes a calendar event
 * For recurring events, supports deleting single instance, future instances, or all instances
 */
export async function deleteCalendarEvent(
  eventId: string,
  deleteType: RecurringUpdateType = 'single'
): Promise<void> {
  // Get the existing event
  const existingEvent = await getCalendarEventById(eventId);
  if (!existingEvent) {
    throw new ValidationError('Event not found');
  }
  
  // Handle non-recurring events or single instance deletion
  if (!existingEvent.isRecurring || deleteType === 'single') {
    await prisma.calendarEvent.delete({
      where: { id: eventId }
    });
    
    // Invalidate calendar cache
    await invalidateCalendarEventCache(eventId);
    
    return;
  }
  
  // Handle recurring event deletion
  if (deleteType === 'all') {
    // Delete all instances with the same recurrenceId
    await prisma.calendarEvent.deleteMany({
      where: { recurrenceId: existingEvent.recurrenceId }
    });
    
    // Invalidate calendar cache
    await invalidateCalendarEventCache();
    
    return;
  }
  
  if (deleteType === 'future') {
    // Delete this and all future instances
    await prisma.calendarEvent.deleteMany({
      where: {
        recurrenceId: existingEvent.recurrenceId,
        startDate: { gte: existingEvent.startDate }
      }
    });
    
    // Invalidate calendar cache
    await invalidateCalendarEventCache();
    
    return;
  }
  
  throw new ValidationError('Invalid delete type');
}

/**
 * Searches calendar events by text with sorting
 */
export async function searchCalendarEvents(
  searchTerm: string,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    categoryIds?: string[];
  },
  sortOptions?: SortOptions
): Promise<CalendarEvent[]> {
  const where: any = {
    OR: [
      { title: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
      { location: { contains: searchTerm, mode: 'insensitive' } }
    ]
  };
  
  // Apply additional filters
  if (filters?.startDate || filters?.endDate) {
    where.AND = [];
    if (filters.startDate) {
      where.AND.push({ endDate: { gte: filters.startDate } });
    }
    if (filters.endDate) {
      where.AND.push({ startDate: { lte: filters.endDate } });
    }
  }
  
  if (filters?.categoryIds && filters.categoryIds.length > 0) {
    where.categoryId = { in: filters.categoryIds };
  }
  
  const events = await prisma.calendarEvent.findMany({
    where,
    include: {
      category: true,
      notes: true,
      reminders: true
    },
    orderBy: {
      startDate: 'asc'
    }
  });
  
  // Apply custom sorting if provided
  if (sortOptions) {
    return sortEvents(events, sortOptions);
  }
  
  return events;
}
