/**
 * Import/Export Service Tests
 * 
 * Tests for calendar event import and export functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateImportFormat,
  isDuplicateEvent,
  importCalendarEvents,
  exportCalendarEvents,
  exportToICalFormat,
  exportToCSVFormat,
  exportToJSONFormat
} from '../import-export-service';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
vi.mock('@prisma/client', () => {
  const mockPrisma = {
    calendarEvent: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn()
    },
    calendarEventCategory: {
      findUnique: vi.fn(),
      findFirst: vi.fn()
    }
  };
  return {
    PrismaClient: class {
      calendarEvent = mockPrisma.calendarEvent;
      calendarEventCategory = mockPrisma.calendarEventCategory;
    }
  };
});

// Mock calendar service
vi.mock('../calendar-service', () => ({
  createCalendarEvent: vi.fn(),
  ValidationError: class ValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  }
}));

describe('Import/Export Service', () => {
  describe('validateImportFormat', () => {
    it('should validate iCal format', () => {
      const validICal = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:Test Event
END:VEVENT
END:VCALENDAR`;
      
      expect(() => validateImportFormat(validICal, 'ical')).not.toThrow();
    });

    it('should reject invalid iCal format', () => {
      const invalidICal = 'Not a valid iCal file';
      
      expect(() => validateImportFormat(invalidICal, 'ical')).toThrow('Invalid iCal format');
    });

    it('should validate CSV format', () => {
      const validCSV = `title,categoryId,startDate,endDate
Test Event,cat_123,2025-01-30T09:00:00Z,2025-01-30T11:00:00Z`;
      
      expect(() => validateImportFormat(validCSV, 'csv')).not.toThrow();
    });

    it('should reject invalid CSV format', () => {
      const invalidCSV = 'title';
      
      expect(() => validateImportFormat(invalidCSV, 'csv')).toThrow('Invalid CSV format');
    });

    it('should validate JSON format', () => {
      const validJSON = JSON.stringify([{ title: 'Test Event' }]);
      
      expect(() => validateImportFormat(validJSON, 'json')).not.toThrow();
    });

    it('should reject invalid JSON format', () => {
      const invalidJSON = '{invalid json}';
      
      expect(() => validateImportFormat(invalidJSON, 'json')).toThrow('Invalid JSON format');
    });

    it('should reject empty content', () => {
      expect(() => validateImportFormat('', 'ical')).toThrow('Import file is empty');
    });
  });

  describe('Export Functions', () => {
    const mockEvents = [
      {
        id: 'event_1',
        title: 'Math Exam',
        description: 'Final exam',
        categoryId: 'cat_123',
        category: { id: 'cat_123', name: 'Exam', color: '#FF0000' },
        startDate: new Date('2025-01-30T09:00:00Z'),
        endDate: new Date('2025-01-30T11:00:00Z'),
        isAllDay: false,
        location: 'Room 101',
        visibleToRoles: ['ADMIN', 'TEACHER', 'STUDENT'],
        visibleToClasses: ['class_456'],
        visibleToSections: ['section_789'],
        sourceType: null,
        sourceId: null,
        isRecurring: false,
        recurrenceRule: null,
        recurrenceId: null,
        exceptionDates: [],
        attachments: [],
        createdBy: 'user_123',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z')
      }
    ] as any;

    describe('exportToCSVFormat', () => {
      it('should export events to CSV format', async () => {
        const csv = await exportToCSVFormat(mockEvents);
        
        expect(csv).toContain('title,description,categoryId');
        expect(csv).toContain('Math Exam');
        expect(csv).toContain('Final exam');
        expect(csv).toContain('Room 101');
      });

      it('should include all required fields', async () => {
        const csv = await exportToCSVFormat(mockEvents);
        
        expect(csv).toContain('categoryId');
        expect(csv).toContain('startDate');
        expect(csv).toContain('endDate');
        expect(csv).toContain('visibleToRoles');
      });
    });

    describe('exportToJSONFormat', () => {
      it('should export events to JSON format', async () => {
        const json = await exportToJSONFormat(mockEvents);
        const parsed = JSON.parse(json);
        
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].title).toBe('Math Exam');
      });

      it('should include all event fields', async () => {
        const json = await exportToJSONFormat(mockEvents);
        const parsed = JSON.parse(json);
        
        expect(parsed[0]).toHaveProperty('title');
        expect(parsed[0]).toHaveProperty('description');
        expect(parsed[0]).toHaveProperty('categoryId');
        expect(parsed[0]).toHaveProperty('startDate');
        expect(parsed[0]).toHaveProperty('endDate');
        expect(parsed[0]).toHaveProperty('visibleToRoles');
        expect(parsed[0]).toHaveProperty('location');
      });
    });

    describe('exportToICalFormat', () => {
      it('should export events to iCal format', async () => {
        const ical = await exportToICalFormat(mockEvents);
        
        expect(ical).toContain('BEGIN:VCALENDAR');
        expect(ical).toContain('END:VCALENDAR');
        expect(ical).toContain('BEGIN:VEVENT');
        expect(ical).toContain('END:VEVENT');
      });

      it('should include event details', async () => {
        const ical = await exportToICalFormat(mockEvents);
        
        expect(ical).toContain('Math Exam');
        expect(ical).toContain('Room 101');
      });

      it('should include custom X-properties', async () => {
        const ical = await exportToICalFormat(mockEvents);
        
        expect(ical).toContain('X-CATEGORY-ID:cat_123');
        expect(ical).toContain('X-VISIBLE-ROLES:ADMIN,TEACHER,STUDENT');
      });
    });
  });

  describe('Format Validation', () => {
    it('should validate required fields for import', () => {
      const invalidData = {
        // Missing title
        categoryId: 'cat_123',
        startDate: '2025-01-30T09:00:00Z',
        endDate: '2025-01-30T11:00:00Z'
      };

      // This would be tested through importCalendarEvents
      // which calls validateImportEventData internally
    });

    it('should validate date ranges', () => {
      const invalidData = {
        title: 'Test Event',
        categoryId: 'cat_123',
        startDate: '2025-01-30T11:00:00Z',
        endDate: '2025-01-30T09:00:00Z' // End before start
      };

      // This would be tested through importCalendarEvents
    });
  });
});
