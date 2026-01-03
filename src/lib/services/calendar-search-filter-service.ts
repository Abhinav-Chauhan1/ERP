/**
 * Calendar Search and Filter Service
 * 
 * Provides comprehensive search and filtering functionality for calendar events.
 * Supports text search across multiple fields, category filtering, date range filtering,
 * and multi-filter combination with AND logic.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { PrismaClient, CalendarEvent, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Filter options for calendar events
 */
export interface CalendarEventFilters {
  // Text search (Requirement 7.1)
  searchTerm?: string;
  
  // Category filter (Requirement 7.2)
  categoryIds?: string[];
  
  // Date range filter (Requirement 7.3)
  startDate?: Date;
  endDate?: Date;
  
  // Additional filters for role-based visibility
  visibleToRoles?: string[];
  visibleToClasses?: string[];
  visibleToSections?: string[];
  
  // Pagination
  skip?: number;
  take?: number;
}

/**
 * Result of a search/filter operation
 */
export interface CalendarEventSearchResult {
  events: CalendarEvent[];
  totalCount: number;
  hasMore: boolean;
}

/**
 * Builds a Prisma where clause from filter options
 * Requirement 7.4: Apply all filters using AND logic
 */
function buildWhereClause(filters: CalendarEventFilters): Prisma.CalendarEventWhereInput {
  const conditions: Prisma.CalendarEventWhereInput[] = [];
  
  // Requirement 7.1: Search across title, description, location, and category name
  if (filters.searchTerm && filters.searchTerm.trim() !== '') {
    const searchTerm = filters.searchTerm.trim();
    conditions.push({
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { location: { contains: searchTerm, mode: 'insensitive' } },
        { category: { name: { contains: searchTerm, mode: 'insensitive' } } }
      ]
    });
  }
  
  // Requirement 7.2: Category filter
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    conditions.push({
      categoryId: { in: filters.categoryIds }
    });
  }
  
  // Requirement 7.3: Date range filter
  if (filters.startDate || filters.endDate) {
    const dateConditions: Prisma.CalendarEventWhereInput[] = [];
    
    if (filters.startDate) {
      // Event ends on or after the filter start date
      dateConditions.push({ endDate: { gte: filters.startDate } });
    }
    
    if (filters.endDate) {
      // Event starts on or before the filter end date
      dateConditions.push({ startDate: { lte: filters.endDate } });
    }
    
    if (dateConditions.length > 0) {
      conditions.push({ AND: dateConditions });
    }
  }
  
  // Role-based visibility filter
  if (filters.visibleToRoles && filters.visibleToRoles.length > 0) {
    conditions.push({
      visibleToRoles: { hasSome: filters.visibleToRoles }
    });
  }
  
  // Class-based visibility filter
  if (filters.visibleToClasses && filters.visibleToClasses.length > 0) {
    conditions.push({
      OR: [
        { visibleToClasses: { hasSome: filters.visibleToClasses } },
        { visibleToClasses: { isEmpty: true } } // Include events visible to all classes
      ]
    });
  }
  
  // Section-based visibility filter
  if (filters.visibleToSections && filters.visibleToSections.length > 0) {
    conditions.push({
      OR: [
        { visibleToSections: { hasSome: filters.visibleToSections } },
        { visibleToSections: { isEmpty: true } } // Include events visible to all sections
      ]
    });
  }
  
  // Requirement 7.4: Combine all filters with AND logic
  if (conditions.length === 0) {
    return {};
  }
  
  if (conditions.length === 1) {
    return conditions[0];
  }
  
  return { AND: conditions };
}

/**
 * Searches and filters calendar events
 * Requirements: 7.1, 7.2, 7.3, 7.4
 * 
 * @param filters - Filter options to apply
 * @returns Search results with events and metadata
 */
export async function searchAndFilterEvents(
  filters: CalendarEventFilters
): Promise<CalendarEventSearchResult> {
  const whereClause = buildWhereClause(filters);
  
  // Get total count for pagination
  const totalCount = await prisma.calendarEvent.count({
    where: whereClause
  });
  
  // Get filtered events
  const events = await prisma.calendarEvent.findMany({
    where: whereClause,
    include: {
      category: true,
      notes: true,
      reminders: true
    },
    orderBy: {
      startDate: 'asc'
    },
    skip: filters.skip ?? 0,
    take: filters.take ?? 100
  });
  
  const hasMore = (filters.skip ?? 0) + events.length < totalCount;
  
  return {
    events,
    totalCount,
    hasMore
  };
}

/**
 * Gets all events without any filters (default view)
 * Requirement 7.5: Restore default calendar view showing all visible events
 * 
 * @param visibilityFilters - Only role/class/section filters for visibility
 * @returns All visible events
 */
export async function getDefaultCalendarView(
  visibilityFilters?: {
    visibleToRoles?: string[];
    visibleToClasses?: string[];
    visibleToSections?: string[];
  }
): Promise<CalendarEvent[]> {
  // Only apply visibility filters, no search or category filters
  const filters: CalendarEventFilters = {
    visibleToRoles: visibilityFilters?.visibleToRoles,
    visibleToClasses: visibilityFilters?.visibleToClasses,
    visibleToSections: visibilityFilters?.visibleToSections
  };
  
  const result = await searchAndFilterEvents(filters);
  return result.events;
}

/**
 * Clears all filters and returns to default view
 * Requirement 7.5: Clear filters and restore default calendar view
 * 
 * This is a convenience function that explicitly shows the intent
 * of clearing filters and returning to the default view.
 */
export async function clearFiltersAndGetDefaultView(
  visibilityFilters?: {
    visibleToRoles?: string[];
    visibleToClasses?: string[];
    visibleToSections?: string[];
  }
): Promise<CalendarEvent[]> {
  return getDefaultCalendarView(visibilityFilters);
}

/**
 * Filters events by category only
 * Requirement 7.2: Display only events matching selected categories
 * 
 * @param categoryIds - Array of category IDs to filter by
 * @param visibilityFilters - Optional visibility filters
 * @returns Events in the specified categories
 */
export async function filterEventsByCategory(
  categoryIds: string[],
  visibilityFilters?: {
    visibleToRoles?: string[];
    visibleToClasses?: string[];
    visibleToSections?: string[];
  }
): Promise<CalendarEvent[]> {
  const filters: CalendarEventFilters = {
    categoryIds,
    visibleToRoles: visibilityFilters?.visibleToRoles,
    visibleToClasses: visibilityFilters?.visibleToClasses,
    visibleToSections: visibilityFilters?.visibleToSections
  };
  
  const result = await searchAndFilterEvents(filters);
  return result.events;
}

/**
 * Filters events by date range only
 * Requirement 7.3: Show events within the specified start and end dates
 * 
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @param visibilityFilters - Optional visibility filters
 * @returns Events within the date range
 */
export async function filterEventsByDateRange(
  startDate: Date,
  endDate: Date,
  visibilityFilters?: {
    visibleToRoles?: string[];
    visibleToClasses?: string[];
    visibleToSections?: string[];
  }
): Promise<CalendarEvent[]> {
  const filters: CalendarEventFilters = {
    startDate,
    endDate,
    visibleToRoles: visibilityFilters?.visibleToRoles,
    visibleToClasses: visibilityFilters?.visibleToClasses,
    visibleToSections: visibilityFilters?.visibleToSections
  };
  
  const result = await searchAndFilterEvents(filters);
  return result.events;
}

/**
 * Searches events by text only
 * Requirement 7.1: Match search terms against event title, description, location, and category
 * 
 * @param searchTerm - Text to search for
 * @param visibilityFilters - Optional visibility filters
 * @returns Events matching the search term
 */
export async function searchEvents(
  searchTerm: string,
  visibilityFilters?: {
    visibleToRoles?: string[];
    visibleToClasses?: string[];
    visibleToSections?: string[];
  }
): Promise<CalendarEvent[]> {
  const filters: CalendarEventFilters = {
    searchTerm,
    visibleToRoles: visibilityFilters?.visibleToRoles,
    visibleToClasses: visibilityFilters?.visibleToClasses,
    visibleToSections: visibilityFilters?.visibleToSections
  };
  
  const result = await searchAndFilterEvents(filters);
  return result.events;
}

/**
 * Combines multiple filters with AND logic
 * Requirement 7.4: Apply all filters using AND logic
 * 
 * @param filters - All filter options to combine
 * @returns Events matching all filters
 */
export async function combineFilters(
  filters: CalendarEventFilters
): Promise<CalendarEventSearchResult> {
  return searchAndFilterEvents(filters);
}

/**
 * Validates filter inputs
 */
export function validateFilters(filters: CalendarEventFilters): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate date range
  if (filters.startDate && filters.endDate) {
    if (filters.endDate < filters.startDate) {
      errors.push('End date must be after start date');
    }
  }
  
  // Validate category IDs format
  if (filters.categoryIds) {
    if (!Array.isArray(filters.categoryIds)) {
      errors.push('Category IDs must be an array');
    }
  }
  
  // Validate pagination
  if (filters.skip !== undefined && filters.skip < 0) {
    errors.push('Skip value must be non-negative');
  }
  
  if (filters.take !== undefined && filters.take <= 0) {
    errors.push('Take value must be positive');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
