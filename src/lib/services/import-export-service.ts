/**
 * Import/Export Service for Calendar Events
 * 
 * Provides functionality to import and export calendar events in multiple formats:
 * - iCal (.ics) format for calendar applications
 * - CSV format for spreadsheet applications
 * - JSON format for data interchange
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { PrismaClient, CalendarEvent, CalendarEventCategory, EventSourceType } from '@prisma/client';
import { createCalendarEvent, CreateCalendarEventInput } from './calendar-service';
import { createEvents, EventAttributes, DateArray } from 'ics';
import { parse as parseCSV } from 'csv-parse/sync';
import { stringify as stringifyCSV } from 'csv-stringify/sync';

const prisma = new PrismaClient();

// Type for event with relations
export type CalendarEventWithRelations = CalendarEvent & {
  category: CalendarEventCategory | null;
};

// Types for import/export operations
export interface ImportResult {
  success: number;
  failed: number;
  duplicates: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

export interface ExportOptions {
  format: 'ical' | 'csv' | 'json';
  startDate?: Date;
  endDate?: Date;
  categoryIds?: string[];
  includeNotes?: boolean;
  includeReminders?: boolean;
}

export type ImportFormat = 'ical' | 'csv' | 'json';

/**
 * Validates import file format
 * Requirement 6.2: Validate the file format and data integrity before processing
 */
export function validateImportFormat(content: string, format: ImportFormat): void {
  if (!content || content.trim() === '') {
    throw new Error('Import file is empty');
  }

  switch (format) {
    case 'ical':
      if (!content.includes('BEGIN:VCALENDAR') || !content.includes('END:VCALENDAR')) {
        throw new Error('Invalid iCal format: Missing VCALENDAR wrapper');
      }
      break;
    case 'csv':
      // Basic CSV validation - check for headers
      const lines = content.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('Invalid CSV format: File must contain headers and at least one data row');
      }
      break;
    case 'json':
      try {
        JSON.parse(content);
      } catch (error) {
        throw new Error('Invalid JSON format: Unable to parse JSON');
      }
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Checks if an event is a duplicate based on title, date, and time
 * Requirement 6.3: Prevent duplicate events based on title, date, and time matching
 */
export async function isDuplicateEvent(
  title: string,
  startDate: Date,
  endDate: Date
): Promise<boolean> {
  const existing = await prisma.calendarEvent.findFirst({
    where: {
      title: title,
      startDate: startDate,
      endDate: endDate
    }
  });

  return existing !== null;
}

/**
 * Validates event data for import
 * Requirement 6.4: Provide detailed error messages indicating which records failed and why
 */
function validateImportEventData(data: any, row: number): ImportError[] {
  const errors: ImportError[] = [];

  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    errors.push({
      row,
      field: 'title',
      message: 'Title is required and must be a non-empty string',
      data
    });
  }

  if (!data.startDate) {
    errors.push({
      row,
      field: 'startDate',
      message: 'Start date is required',
      data
    });
  } else {
    const startDate = new Date(data.startDate);
    if (isNaN(startDate.getTime())) {
      errors.push({
        row,
        field: 'startDate',
        message: 'Invalid start date format',
        data
      });
    }
  }

  if (!data.endDate) {
    errors.push({
      row,
      field: 'endDate',
      message: 'End date is required',
      data
    });
  } else {
    const endDate = new Date(data.endDate);
    if (isNaN(endDate.getTime())) {
      errors.push({
        row,
        field: 'endDate',
        message: 'Invalid end date format',
        data
      });
    }
  }

  if (data.startDate && data.endDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate < startDate) {
      errors.push({
        row,
        field: 'endDate',
        message: 'End date must be after start date',
        data
      });
    }
  }

  if (!data.categoryId || typeof data.categoryId !== 'string') {
    errors.push({
      row,
      field: 'categoryId',
      message: 'Category ID is required',
      data
    });
  }

  if (!data.visibleToRoles || !Array.isArray(data.visibleToRoles) || data.visibleToRoles.length === 0) {
    errors.push({
      row,
      field: 'visibleToRoles',
      message: 'At least one visible role is required',
      data
    });
  }

  return errors;
}

/**
 * Parses iCal format and converts to event data
 */
function parseICalEvents(content: string): any[] {
  const events: any[] = [];
  const lines = content.split('\n').map(line => line.trim());

  let currentEvent: any = null;
  let inEvent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {
        visibleToRoles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
        visibleToClasses: [],
        visibleToSections: [],
        isAllDay: false,
        isRecurring: false,
        exceptionDates: [],
        attachments: []
      };
    } else if (line === 'END:VEVENT' && inEvent) {
      if (currentEvent) {
        events.push(currentEvent);
      }
      currentEvent = null;
      inEvent = false;
    } else if (inEvent && currentEvent) {
      // Parse event properties
      if (line.startsWith('SUMMARY:')) {
        currentEvent.title = line.substring(8);
      } else if (line.startsWith('DESCRIPTION:')) {
        currentEvent.description = line.substring(12);
      } else if (line.startsWith('LOCATION:')) {
        currentEvent.location = line.substring(9);
      } else if (line.startsWith('DTSTART')) {
        const dateStr = line.split(':')[1];
        currentEvent.startDate = parseICalDate(dateStr);
      } else if (line.startsWith('DTEND')) {
        const dateStr = line.split(':')[1];
        currentEvent.endDate = parseICalDate(dateStr);
      } else if (line.startsWith('CATEGORIES:')) {
        currentEvent.categoryName = line.substring(11);
      } else if (line.startsWith('RRULE:')) {
        currentEvent.isRecurring = true;
        currentEvent.recurrenceRule = line.substring(6);
      } else if (line.startsWith('X-CATEGORY-ID:')) {
        currentEvent.categoryId = line.substring(14);
      } else if (line.startsWith('X-VISIBLE-ROLES:')) {
        currentEvent.visibleToRoles = line.substring(16).split(',');
      } else if (line.startsWith('X-VISIBLE-CLASSES:')) {
        currentEvent.visibleToClasses = line.substring(18).split(',').filter(Boolean);
      } else if (line.startsWith('X-VISIBLE-SECTIONS:')) {
        currentEvent.visibleToSections = line.substring(19).split(',').filter(Boolean);
      }
    }
  }

  return events;
}

/**
 * Parses iCal date format (YYYYMMDDTHHMMSS or YYYYMMDD)
 */
function parseICalDate(dateStr: string): Date {
  // Remove timezone indicator if present
  dateStr = dateStr.replace(/Z$/, '');

  if (dateStr.length === 8) {
    // YYYYMMDD format
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month, day);
  } else if (dateStr.length >= 15) {
    // YYYYMMDDTHHMMSS format
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    const hour = parseInt(dateStr.substring(9, 11));
    const minute = parseInt(dateStr.substring(11, 13));
    const second = parseInt(dateStr.substring(13, 15));
    return new Date(year, month, day, hour, minute, second);
  }

  return new Date(dateStr);
}

/**
 * Parses CSV format and converts to event data
 */
function parseCSVEvents(content: string): any[] {
  const records = parseCSV(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  return records.map((record: any) => ({
    title: record.title,
    description: record.description || undefined,
    categoryId: record.categoryId,
    startDate: record.startDate,
    endDate: record.endDate,
    isAllDay: record.isAllDay === 'true' || record.isAllDay === '1',
    location: record.location || undefined,
    visibleToRoles: record.visibleToRoles ? record.visibleToRoles.split(',') : ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
    visibleToClasses: record.visibleToClasses ? record.visibleToClasses.split(',').filter(Boolean) : [],
    visibleToSections: record.visibleToSections ? record.visibleToSections.split(',').filter(Boolean) : [],
    isRecurring: record.isRecurring === 'true' || record.isRecurring === '1',
    recurrenceRule: record.recurrenceRule || undefined,
    exceptionDates: record.exceptionDates ? record.exceptionDates.split(',').map((d: string) => new Date(d)) : [],
    attachments: record.attachments ? record.attachments.split(',').filter(Boolean) : []
  }));
}

/**
 * Parses JSON format and converts to event data
 */
function parseJSONEvents(content: string): any[] {
  const data = JSON.parse(content);

  if (!Array.isArray(data)) {
    throw new Error('JSON must contain an array of events');
  }

  return data.map((event: any) => ({
    ...event,
    startDate: event.startDate,
    endDate: event.endDate,
    exceptionDates: event.exceptionDates || [],
    attachments: event.attachments || [],
    visibleToRoles: event.visibleToRoles || ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
    visibleToClasses: event.visibleToClasses || [],
    visibleToSections: event.visibleToSections || []
  }));
}

/**
 * Imports calendar events from various formats
 * Requirements: 6.2, 6.3, 6.4
 */
export async function importCalendarEvents(
  content: string,
  format: ImportFormat,
  createdBy: string
): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    failed: 0,
    duplicates: 0,
    errors: []
  };

  try {
    // Validate format
    validateImportFormat(content, format);

    // Parse events based on format
    let parsedEvents: any[];
    try {
      switch (format) {
        case 'ical':
          parsedEvents = parseICalEvents(content);
          break;
        case 'csv':
          parsedEvents = parseCSVEvents(content);
          break;
        case 'json':
          parsedEvents = parseJSONEvents(content);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error: any) {
      result.errors.push({
        row: 0,
        message: `Failed to parse ${format.toUpperCase()} file: ${error.message}`
      });
      result.failed = 1;
      return result;
    }

    // Process each event
    for (let i = 0; i < parsedEvents.length; i++) {
      const eventData = parsedEvents[i];
      const row = i + 1;

      try {
        // Validate event data
        const validationErrors = validateImportEventData(eventData, row);
        if (validationErrors.length > 0) {
          result.errors.push(...validationErrors);
          result.failed++;
          continue;
        }

        // If categoryName is provided but not categoryId, try to find the category
        if (eventData.categoryName && !eventData.categoryId) {
          const category = await prisma.calendarEventCategory.findFirst({
            where: { name: eventData.categoryName }
          });
          if (category) {
            eventData.categoryId = category.id;
          } else {
            result.errors.push({
              row,
              field: 'categoryId',
              message: `Category "${eventData.categoryName}" not found`,
              data: eventData
            });
            result.failed++;
            continue;
          }
        }

        // Verify category exists
        const category = await prisma.calendarEventCategory.findUnique({
          where: { id: eventData.categoryId }
        });
        if (!category) {
          result.errors.push({
            row,
            field: 'categoryId',
            message: `Category with ID "${eventData.categoryId}" not found`,
            data: eventData
          });
          result.failed++;
          continue;
        }

        // Check for duplicates
        const isDuplicate = await isDuplicateEvent(
          eventData.title,
          new Date(eventData.startDate),
          new Date(eventData.endDate)
        );

        if (isDuplicate) {
          result.duplicates++;
          continue;
        }

        // Create the event
        const createData: CreateCalendarEventInput = {
          title: eventData.title,
          description: eventData.description,
          categoryId: eventData.categoryId,
          startDate: new Date(eventData.startDate),
          endDate: new Date(eventData.endDate),
          isAllDay: eventData.isAllDay ?? false,
          location: eventData.location,
          visibleToRoles: eventData.visibleToRoles,
          visibleToClasses: eventData.visibleToClasses,
          visibleToSections: eventData.visibleToSections,
          isRecurring: eventData.isRecurring ?? false,
          recurrenceRule: eventData.recurrenceRule,
          exceptionDates: eventData.exceptionDates,
          attachments: eventData.attachments,
          createdBy
        };

        await createCalendarEvent(createData);
        result.success++;
      } catch (error: any) {
        result.errors.push({
          row,
          message: error.message || 'Unknown error occurred',
          data: eventData
        });
        result.failed++;
      }
    }
  } catch (error: any) {
    result.errors.push({
      row: 0,
      message: error.message || 'Unknown error occurred'
    });
    result.failed++;
  }

  return result;
}

/**
 * Exports calendar events to iCal format
 * Requirement 6.1, 6.5: Generate files in standard formats with all event fields
 */
export async function exportToICalFormat(
  events: CalendarEventWithRelations[]
): Promise<string> {
  const icsEvents: EventAttributes[] = events.map(event => {
    const startArray: DateArray = [
      event.startDate.getFullYear(),
      event.startDate.getMonth() + 1,
      event.startDate.getDate(),
      event.startDate.getHours(),
      event.startDate.getMinutes()
    ];

    const endArray: DateArray = [
      event.endDate.getFullYear(),
      event.endDate.getMonth() + 1,
      event.endDate.getDate(),
      event.endDate.getHours(),
      event.endDate.getMinutes()
    ];

    const icsEvent: EventAttributes = {
      start: startArray,
      end: endArray,
      title: event.title,
      description: event.description || undefined,
      location: event.location || undefined,
      categories: event.category ? [event.category.name] : undefined,
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      organizer: { name: 'School Calendar', email: 'calendar@school.edu' }
    };

    return icsEvent;
  });

  const { error, value } = createEvents(icsEvents);

  if (error) {
    throw new Error(`Failed to generate iCal file: ${error.message}`);
  }

  // Add custom fields to the iCal content
  let icalContent = value || '';

  // Insert custom X-properties for each event
  events.forEach((event, index) => {
    const customProps = [
      `X-CATEGORY-ID:${event.categoryId}`,
      `X-VISIBLE-ROLES:${event.visibleToRoles.join(',')}`,
      `X-VISIBLE-CLASSES:${event.visibleToClasses.join(',')}`,
      `X-VISIBLE-SECTIONS:${event.visibleToSections.join(',')}`
    ].join('\r\n');

    // Find the END:VEVENT for this event and insert custom properties before it
    const eventEndPattern = /END:VEVENT/g;
    let matchCount = 0;
    icalContent = icalContent.replace(eventEndPattern, (match) => {
      matchCount++;
      if (matchCount === index + 1) {
        return `${customProps}\r\n${match}`;
      }
      return match;
    });
  });

  return icalContent;
}

/**
 * Exports calendar events to CSV format
 * Requirement 6.1, 6.5: Generate files in standard formats with all event fields
 */
export async function exportToCSVFormat(
  events: CalendarEventWithRelations[]
): Promise<string> {
  const records = events.map(event => ({
    title: event.title,
    description: event.description || '',
    categoryId: event.categoryId,
    categoryName: event.category?.name || '',
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    isAllDay: event.isAllDay,
    location: event.location || '',
    visibleToRoles: event.visibleToRoles.join(','),
    visibleToClasses: event.visibleToClasses.join(','),
    visibleToSections: event.visibleToSections.join(','),
    isRecurring: event.isRecurring,
    recurrenceRule: event.recurrenceRule || '',
    exceptionDates: event.exceptionDates.map(d => d.toISOString()).join(','),
    attachments: event.attachments.join(','),
    sourceType: event.sourceType || '',
    sourceId: event.sourceId || '',
    createdBy: event.createdBy,
    createdAt: event.createdAt.toISOString()
  }));

  return stringifyCSV(records, {
    header: true,
    columns: [
      'title',
      'description',
      'categoryId',
      'categoryName',
      'startDate',
      'endDate',
      'isAllDay',
      'location',
      'visibleToRoles',
      'visibleToClasses',
      'visibleToSections',
      'isRecurring',
      'recurrenceRule',
      'exceptionDates',
      'attachments',
      'sourceType',
      'sourceId',
      'createdBy',
      'createdAt'
    ]
  });
}

/**
 * Exports calendar events to JSON format
 * Requirement 6.1, 6.5: Generate files in standard formats with all event fields
 */
export async function exportToJSONFormat(
  events: CalendarEventWithRelations[]
): Promise<string> {
  const exportData = events.map(event => ({
    title: event.title,
    description: event.description,
    categoryId: event.categoryId,
    categoryName: event.category?.name,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    isAllDay: event.isAllDay,
    location: event.location,
    visibleToRoles: event.visibleToRoles,
    visibleToClasses: event.visibleToClasses,
    visibleToSections: event.visibleToSections,
    isRecurring: event.isRecurring,
    recurrenceRule: event.recurrenceRule,
    exceptionDates: event.exceptionDates.map(d => d.toISOString()),
    attachments: event.attachments,
    sourceType: event.sourceType,
    sourceId: event.sourceId,
    createdBy: event.createdBy,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString()
  }));

  return JSON.stringify(exportData, null, 2);
}

/**
 * Main export function that handles all formats
 * Requirement 6.1: Generate files in standard formats (iCal, CSV, JSON)
 */
export async function exportCalendarEvents(
  options: ExportOptions
): Promise<string> {
  // Build filter criteria
  const filters: any = {};

  if (options.startDate || options.endDate) {
    filters.AND = [];
    if (options.startDate) {
      filters.AND.push({ endDate: { gte: options.startDate } });
    }
    if (options.endDate) {
      filters.AND.push({ startDate: { lte: options.endDate } });
    }
  }

  if (options.categoryIds && options.categoryIds.length > 0) {
    filters.categoryId = { in: options.categoryIds };
  }

  // Fetch events
  const events = await prisma.calendarEvent.findMany({
    where: filters,
    include: {
      category: true,
      notes: options.includeNotes,
      reminders: options.includeReminders
    },
    orderBy: {
      startDate: 'asc'
    }
  });

  // Export based on format
  switch (options.format) {
    case 'ical':
      return await exportToICalFormat(events);
    case 'csv':
      return await exportToCSVFormat(events);
    case 'json':
      return await exportToJSONFormat(events);
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}
