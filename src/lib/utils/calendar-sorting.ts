/**
 * Calendar Event Sorting Utility
 * 
 * Provides sorting functionality for calendar events with support for
 * chronological ordering and various sorting options.
 * 
 * Requirements: 3.4
 */

import { CalendarEvent } from '@prisma/client';

export type SortOrder = 'asc' | 'desc';
export type SortField = 'startDate' | 'endDate' | 'title' | 'category' | 'createdAt';

export interface SortOptions {
  field: SortField;
  order: SortOrder;
}

/**
 * Sorts calendar events chronologically by start date
 * 
 * Requirement 3.4: Sort events chronologically with nearest events first
 * 
 * @param events - Array of calendar events to sort
 * @param order - Sort order ('asc' for ascending, 'desc' for descending)
 * @returns Sorted array of calendar events
 */
export function sortEventsByDate(
  events: CalendarEvent[],
  order: SortOrder = 'asc'
): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const dateA = a.startDate.getTime();
    const dateB = b.startDate.getTime();
    
    if (order === 'asc') {
      return dateA - dateB;
    } else {
      return dateB - dateA;
    }
  });
}

/**
 * Sorts calendar events by title alphabetically
 * 
 * @param events - Array of calendar events to sort
 * @param order - Sort order ('asc' for A-Z, 'desc' for Z-A)
 * @returns Sorted array of calendar events
 */
export function sortEventsByTitle(
  events: CalendarEvent[],
  order: SortOrder = 'asc'
): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const titleA = a.title.toLowerCase();
    const titleB = b.title.toLowerCase();
    
    if (order === 'asc') {
      return titleA.localeCompare(titleB);
    } else {
      return titleB.localeCompare(titleA);
    }
  });
}

/**
 * Sorts calendar events by end date
 * 
 * @param events - Array of calendar events to sort
 * @param order - Sort order ('asc' for ascending, 'desc' for descending)
 * @returns Sorted array of calendar events
 */
export function sortEventsByEndDate(
  events: CalendarEvent[],
  order: SortOrder = 'asc'
): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const dateA = a.endDate.getTime();
    const dateB = b.endDate.getTime();
    
    if (order === 'asc') {
      return dateA - dateB;
    } else {
      return dateB - dateA;
    }
  });
}

/**
 * Sorts calendar events by creation date
 * 
 * @param events - Array of calendar events to sort
 * @param order - Sort order ('asc' for oldest first, 'desc' for newest first)
 * @returns Sorted array of calendar events
 */
export function sortEventsByCreatedAt(
  events: CalendarEvent[],
  order: SortOrder = 'asc'
): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const dateA = a.createdAt.getTime();
    const dateB = b.createdAt.getTime();
    
    if (order === 'asc') {
      return dateA - dateB;
    } else {
      return dateB - dateA;
    }
  });
}

/**
 * Generic sorting function that supports multiple sort fields
 * 
 * @param events - Array of calendar events to sort
 * @param options - Sort options specifying field and order
 * @returns Sorted array of calendar events
 */
export function sortEvents(
  events: CalendarEvent[],
  options: SortOptions = { field: 'startDate', order: 'asc' }
): CalendarEvent[] {
  switch (options.field) {
    case 'startDate':
      return sortEventsByDate(events, options.order);
    case 'endDate':
      return sortEventsByEndDate(events, options.order);
    case 'title':
      return sortEventsByTitle(events, options.order);
    case 'createdAt':
      return sortEventsByCreatedAt(events, options.order);
    default:
      // Default to sorting by start date
      return sortEventsByDate(events, options.order);
  }
}

/**
 * Validates sort options
 * 
 * @param field - Sort field to validate
 * @param order - Sort order to validate
 * @returns True if valid, false otherwise
 */
export function isValidSortOptions(field: string, order: string): boolean {
  const validFields: SortField[] = ['startDate', 'endDate', 'title', 'category', 'createdAt'];
  const validOrders: SortOrder[] = ['asc', 'desc'];
  
  return validFields.includes(field as SortField) && validOrders.includes(order as SortOrder);
}

/**
 * Parses sort options from query parameters
 * 
 * @param sortBy - Sort field from query parameter
 * @param sortOrder - Sort order from query parameter
 * @returns Validated sort options with defaults
 */
export function parseSortOptions(
  sortBy?: string | null,
  sortOrder?: string | null
): SortOptions {
  const defaultOptions: SortOptions = { field: 'startDate', order: 'asc' };
  
  if (!sortBy || !sortOrder) {
    return defaultOptions;
  }
  
  if (!isValidSortOptions(sortBy, sortOrder)) {
    return defaultOptions;
  }
  
  return {
    field: sortBy as SortField,
    order: sortOrder as SortOrder
  };
}
