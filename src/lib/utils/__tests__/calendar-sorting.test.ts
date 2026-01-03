/**
 * Calendar Sorting Utility Tests
 * 
 * Tests for calendar event sorting functionality
 * 
 * Requirements: 3.4
 */

import { describe, it, expect } from 'vitest';
import {
  sortEventsByDate,
  sortEventsByTitle,
  sortEventsByEndDate,
  sortEventsByCreatedAt,
  sortEvents,
  isValidSortOptions,
  parseSortOptions,
  type SortOptions
} from '../calendar-sorting';
import { CalendarEvent } from '@prisma/client';

// Helper function to create mock events
function createMockEvent(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: 'evt_123',
    title: 'Test Event',
    description: null,
    categoryId: 'cat_123',
    startDate: new Date('2025-01-15T10:00:00'),
    endDate: new Date('2025-01-15T11:00:00'),
    isAllDay: false,
    location: null,
    visibleToRoles: ['ADMIN'],
    visibleToClasses: [],
    visibleToSections: [],
    sourceType: null,
    sourceId: null,
    isRecurring: false,
    recurrenceRule: null,
    recurrenceId: null,
    exceptionDates: [],
    attachments: [],
    createdBy: 'user_123',
    createdAt: new Date('2025-01-01T00:00:00'),
    updatedAt: new Date('2025-01-01T00:00:00'),
    ...overrides
  } as CalendarEvent;
}

describe('Calendar Sorting Utility', () => {
  describe('sortEventsByDate', () => {
    it('should sort events by start date in ascending order', () => {
      const events = [
        createMockEvent({ id: '1', startDate: new Date('2025-01-20') }),
        createMockEvent({ id: '2', startDate: new Date('2025-01-10') }),
        createMockEvent({ id: '3', startDate: new Date('2025-01-15') })
      ];

      const sorted = sortEventsByDate(events, 'asc');

      expect(sorted[0].id).toBe('2'); // Jan 10
      expect(sorted[1].id).toBe('3'); // Jan 15
      expect(sorted[2].id).toBe('1'); // Jan 20
    });

    it('should sort events by start date in descending order', () => {
      const events = [
        createMockEvent({ id: '1', startDate: new Date('2025-01-10') }),
        createMockEvent({ id: '2', startDate: new Date('2025-01-20') }),
        createMockEvent({ id: '3', startDate: new Date('2025-01-15') })
      ];

      const sorted = sortEventsByDate(events, 'desc');

      expect(sorted[0].id).toBe('2'); // Jan 20
      expect(sorted[1].id).toBe('3'); // Jan 15
      expect(sorted[2].id).toBe('1'); // Jan 10
    });

    it('should not mutate the original array', () => {
      const events = [
        createMockEvent({ id: '1', startDate: new Date('2025-01-20') }),
        createMockEvent({ id: '2', startDate: new Date('2025-01-10') })
      ];

      const originalFirstId = events[0].id;
      sortEventsByDate(events, 'asc');

      expect(events[0].id).toBe(originalFirstId);
    });

    it('should handle events with same start date', () => {
      const sameDate = new Date('2025-01-15');
      const events = [
        createMockEvent({ id: '1', startDate: sameDate }),
        createMockEvent({ id: '2', startDate: sameDate }),
        createMockEvent({ id: '3', startDate: sameDate })
      ];

      const sorted = sortEventsByDate(events, 'asc');

      expect(sorted).toHaveLength(3);
    });
  });

  describe('sortEventsByTitle', () => {
    it('should sort events by title alphabetically in ascending order', () => {
      const events = [
        createMockEvent({ id: '1', title: 'Zebra Event' }),
        createMockEvent({ id: '2', title: 'Apple Event' }),
        createMockEvent({ id: '3', title: 'Mango Event' })
      ];

      const sorted = sortEventsByTitle(events, 'asc');

      expect(sorted[0].title).toBe('Apple Event');
      expect(sorted[1].title).toBe('Mango Event');
      expect(sorted[2].title).toBe('Zebra Event');
    });

    it('should sort events by title alphabetically in descending order', () => {
      const events = [
        createMockEvent({ id: '1', title: 'Apple Event' }),
        createMockEvent({ id: '2', title: 'Zebra Event' }),
        createMockEvent({ id: '3', title: 'Mango Event' })
      ];

      const sorted = sortEventsByTitle(events, 'desc');

      expect(sorted[0].title).toBe('Zebra Event');
      expect(sorted[1].title).toBe('Mango Event');
      expect(sorted[2].title).toBe('Apple Event');
    });

    it('should be case-insensitive', () => {
      const events = [
        createMockEvent({ id: '1', title: 'zebra event' }),
        createMockEvent({ id: '2', title: 'Apple Event' }),
        createMockEvent({ id: '3', title: 'MANGO EVENT' })
      ];

      const sorted = sortEventsByTitle(events, 'asc');

      expect(sorted[0].title).toBe('Apple Event');
      expect(sorted[1].title).toBe('MANGO EVENT');
      expect(sorted[2].title).toBe('zebra event');
    });
  });

  describe('sortEventsByEndDate', () => {
    it('should sort events by end date in ascending order', () => {
      const events = [
        createMockEvent({ id: '1', endDate: new Date('2025-01-20') }),
        createMockEvent({ id: '2', endDate: new Date('2025-01-10') }),
        createMockEvent({ id: '3', endDate: new Date('2025-01-15') })
      ];

      const sorted = sortEventsByEndDate(events, 'asc');

      expect(sorted[0].id).toBe('2'); // Jan 10
      expect(sorted[1].id).toBe('3'); // Jan 15
      expect(sorted[2].id).toBe('1'); // Jan 20
    });

    it('should sort events by end date in descending order', () => {
      const events = [
        createMockEvent({ id: '1', endDate: new Date('2025-01-10') }),
        createMockEvent({ id: '2', endDate: new Date('2025-01-20') }),
        createMockEvent({ id: '3', endDate: new Date('2025-01-15') })
      ];

      const sorted = sortEventsByEndDate(events, 'desc');

      expect(sorted[0].id).toBe('2'); // Jan 20
      expect(sorted[1].id).toBe('3'); // Jan 15
      expect(sorted[2].id).toBe('1'); // Jan 10
    });
  });

  describe('sortEventsByCreatedAt', () => {
    it('should sort events by creation date in ascending order', () => {
      const events = [
        createMockEvent({ id: '1', createdAt: new Date('2025-01-20') }),
        createMockEvent({ id: '2', createdAt: new Date('2025-01-10') }),
        createMockEvent({ id: '3', createdAt: new Date('2025-01-15') })
      ];

      const sorted = sortEventsByCreatedAt(events, 'asc');

      expect(sorted[0].id).toBe('2'); // Jan 10
      expect(sorted[1].id).toBe('3'); // Jan 15
      expect(sorted[2].id).toBe('1'); // Jan 20
    });

    it('should sort events by creation date in descending order', () => {
      const events = [
        createMockEvent({ id: '1', createdAt: new Date('2025-01-10') }),
        createMockEvent({ id: '2', createdAt: new Date('2025-01-20') }),
        createMockEvent({ id: '3', createdAt: new Date('2025-01-15') })
      ];

      const sorted = sortEventsByCreatedAt(events, 'desc');

      expect(sorted[0].id).toBe('2'); // Jan 20
      expect(sorted[1].id).toBe('3'); // Jan 15
      expect(sorted[2].id).toBe('1'); // Jan 10
    });
  });

  describe('sortEvents', () => {
    it('should sort by startDate when field is startDate', () => {
      const events = [
        createMockEvent({ id: '1', startDate: new Date('2025-01-20') }),
        createMockEvent({ id: '2', startDate: new Date('2025-01-10') })
      ];

      const options: SortOptions = { field: 'startDate', order: 'asc' };
      const sorted = sortEvents(events, options);

      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('1');
    });

    it('should sort by title when field is title', () => {
      const events = [
        createMockEvent({ id: '1', title: 'Zebra' }),
        createMockEvent({ id: '2', title: 'Apple' })
      ];

      const options: SortOptions = { field: 'title', order: 'asc' };
      const sorted = sortEvents(events, options);

      expect(sorted[0].title).toBe('Apple');
      expect(sorted[1].title).toBe('Zebra');
    });

    it('should sort by endDate when field is endDate', () => {
      const events = [
        createMockEvent({ id: '1', endDate: new Date('2025-01-20') }),
        createMockEvent({ id: '2', endDate: new Date('2025-01-10') })
      ];

      const options: SortOptions = { field: 'endDate', order: 'asc' };
      const sorted = sortEvents(events, options);

      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('1');
    });

    it('should sort by createdAt when field is createdAt', () => {
      const events = [
        createMockEvent({ id: '1', createdAt: new Date('2025-01-20') }),
        createMockEvent({ id: '2', createdAt: new Date('2025-01-10') })
      ];

      const options: SortOptions = { field: 'createdAt', order: 'asc' };
      const sorted = sortEvents(events, options);

      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('1');
    });

    it('should default to startDate sorting for unknown fields', () => {
      const events = [
        createMockEvent({ id: '1', startDate: new Date('2025-01-20') }),
        createMockEvent({ id: '2', startDate: new Date('2025-01-10') })
      ];

      const options = { field: 'unknown' as any, order: 'asc' as const };
      const sorted = sortEvents(events, options);

      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('1');
    });

    it('should use default options when none provided', () => {
      const events = [
        createMockEvent({ id: '1', startDate: new Date('2025-01-20') }),
        createMockEvent({ id: '2', startDate: new Date('2025-01-10') })
      ];

      const sorted = sortEvents(events);

      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('1');
    });
  });

  describe('isValidSortOptions', () => {
    it('should return true for valid sort field and order', () => {
      expect(isValidSortOptions('startDate', 'asc')).toBe(true);
      expect(isValidSortOptions('endDate', 'desc')).toBe(true);
      expect(isValidSortOptions('title', 'asc')).toBe(true);
      expect(isValidSortOptions('createdAt', 'desc')).toBe(true);
    });

    it('should return false for invalid sort field', () => {
      expect(isValidSortOptions('invalid', 'asc')).toBe(false);
      expect(isValidSortOptions('unknown', 'desc')).toBe(false);
    });

    it('should return false for invalid sort order', () => {
      expect(isValidSortOptions('startDate', 'invalid')).toBe(false);
      expect(isValidSortOptions('title', 'up')).toBe(false);
    });

    it('should return false when both field and order are invalid', () => {
      expect(isValidSortOptions('invalid', 'wrong')).toBe(false);
    });
  });

  describe('parseSortOptions', () => {
    it('should parse valid sort options', () => {
      const result = parseSortOptions('startDate', 'asc');
      
      expect(result.field).toBe('startDate');
      expect(result.order).toBe('asc');
    });

    it('should return default options when sortBy is null', () => {
      const result = parseSortOptions(null, 'asc');
      
      expect(result.field).toBe('startDate');
      expect(result.order).toBe('asc');
    });

    it('should return default options when sortOrder is null', () => {
      const result = parseSortOptions('title', null);
      
      expect(result.field).toBe('startDate');
      expect(result.order).toBe('asc');
    });

    it('should return default options when both are null', () => {
      const result = parseSortOptions(null, null);
      
      expect(result.field).toBe('startDate');
      expect(result.order).toBe('asc');
    });

    it('should return default options for invalid sort field', () => {
      const result = parseSortOptions('invalid', 'asc');
      
      expect(result.field).toBe('startDate');
      expect(result.order).toBe('asc');
    });

    it('should return default options for invalid sort order', () => {
      const result = parseSortOptions('title', 'invalid');
      
      expect(result.field).toBe('startDate');
      expect(result.order).toBe('asc');
    });

    it('should parse all valid field types', () => {
      expect(parseSortOptions('startDate', 'asc').field).toBe('startDate');
      expect(parseSortOptions('endDate', 'desc').field).toBe('endDate');
      expect(parseSortOptions('title', 'asc').field).toBe('title');
      expect(parseSortOptions('createdAt', 'desc').field).toBe('createdAt');
    });

    it('should parse both order types', () => {
      expect(parseSortOptions('startDate', 'asc').order).toBe('asc');
      expect(parseSortOptions('startDate', 'desc').order).toBe('desc');
    });
  });
});
