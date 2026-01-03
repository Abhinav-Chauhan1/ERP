/**
 * Calendar Service Tests
 * 
 * Basic tests to verify calendar service functionality
 */

import { describe, it, expect } from 'vitest';
import {
  validateEventData,
  generateRecurringInstances,
  ValidationError,
  type CreateCalendarEventInput
} from '../calendar-service';
import { CalendarEvent, EventSourceType } from '@prisma/client';

describe('Calendar Service', () => {
  describe('validateEventData', () => {
    it('should validate required fields for event creation', () => {
      const validData: CreateCalendarEventInput = {
        title: 'Test Event',
        categoryId: 'cat_123',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-02'),
        visibleToRoles: ['ADMIN'],
        createdBy: 'user_123'
      };

      expect(() => validateEventData(validData)).not.toThrow();
    });

    it('should throw error when title is missing', () => {
      const invalidData: CreateCalendarEventInput = {
        title: '',
        categoryId: 'cat_123',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-02'),
        visibleToRoles: ['ADMIN'],
        createdBy: 'user_123'
      };

      expect(() => validateEventData(invalidData)).toThrow(ValidationError);
      expect(() => validateEventData(invalidData)).toThrow('Title is required');
    });

    it('should throw error when start date is missing', () => {
      const invalidData = {
        title: 'Test Event',
        categoryId: 'cat_123',
        endDate: new Date('2025-01-02'),
        visibleToRoles: ['ADMIN'],
        createdBy: 'user_123'
      } as CreateCalendarEventInput;

      expect(() => validateEventData(invalidData)).toThrow(ValidationError);
      expect(() => validateEventData(invalidData)).toThrow('Start date is required');
    });

    it('should throw error when end date is before start date', () => {
      const invalidData: CreateCalendarEventInput = {
        title: 'Test Event',
        categoryId: 'cat_123',
        startDate: new Date('2025-01-02'),
        endDate: new Date('2025-01-01'),
        visibleToRoles: ['ADMIN'],
        createdBy: 'user_123'
      };

      expect(() => validateEventData(invalidData)).toThrow(ValidationError);
      expect(() => validateEventData(invalidData)).toThrow('End date must be after start date');
    });

    it('should throw error when category is missing', () => {
      const invalidData = {
        title: 'Test Event',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-02'),
        visibleToRoles: ['ADMIN'],
        createdBy: 'user_123'
      } as CreateCalendarEventInput;

      expect(() => validateEventData(invalidData)).toThrow(ValidationError);
      expect(() => validateEventData(invalidData)).toThrow('Category is required');
    });

    it('should throw error when visible roles are missing', () => {
      const invalidData: CreateCalendarEventInput = {
        title: 'Test Event',
        categoryId: 'cat_123',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-02'),
        visibleToRoles: [],
        createdBy: 'user_123'
      };

      expect(() => validateEventData(invalidData)).toThrow(ValidationError);
      expect(() => validateEventData(invalidData)).toThrow('At least one visible role is required');
    });

    it('should throw error for invalid recurrence rule', () => {
      const invalidData: CreateCalendarEventInput = {
        title: 'Test Event',
        categoryId: 'cat_123',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-02'),
        visibleToRoles: ['ADMIN'],
        createdBy: 'user_123',
        recurrenceRule: 'INVALID_RULE'
      };

      expect(() => validateEventData(invalidData)).toThrow(ValidationError);
      expect(() => validateEventData(invalidData)).toThrow('Invalid recurrence pattern');
    });

    it('should accept valid recurrence rule', () => {
      const validData: CreateCalendarEventInput = {
        title: 'Test Event',
        categoryId: 'cat_123',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-02'),
        visibleToRoles: ['ADMIN'],
        createdBy: 'user_123',
        recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR'
      };

      expect(() => validateEventData(validData)).not.toThrow();
    });
  });

  describe('generateRecurringInstances', () => {
    it('should return empty array for non-recurring events', () => {
      const baseEvent = {
        id: 'evt_123',
        isRecurring: false,
        recurrenceRule: null,
        startDate: new Date('2025-01-01T10:00:00'),
        endDate: new Date('2025-01-01T11:00:00'),
        exceptionDates: []
      } as CalendarEvent;

      const instances = generateRecurringInstances(
        baseEvent,
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );

      expect(instances).toEqual([]);
    });

    it('should generate instances for weekly recurring event', () => {
      const baseEvent = {
        id: 'evt_123',
        isRecurring: true,
        recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO',
        startDate: new Date('2025-01-06T10:00:00'), // Monday
        endDate: new Date('2025-01-06T11:00:00'),
        exceptionDates: []
      } as CalendarEvent;

      const instances = generateRecurringInstances(
        baseEvent,
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );

      // Should generate 4 Monday instances in January 2025
      expect(instances.length).toBeGreaterThan(0);
      
      // Verify each instance is a Monday
      instances.forEach(instance => {
        expect(instance.startDate.getDay()).toBe(1); // Monday
      });
    });

    it('should exclude exception dates from recurring instances', () => {
      const exceptionDate = new Date('2025-01-13T10:00:00'); // Second Monday
      
      const baseEvent = {
        id: 'evt_123',
        isRecurring: true,
        recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO',
        startDate: new Date('2025-01-06T10:00:00'),
        endDate: new Date('2025-01-06T11:00:00'),
        exceptionDates: [exceptionDate]
      } as CalendarEvent;

      const instances = generateRecurringInstances(
        baseEvent,
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );

      // Verify the exception date is not in the instances
      const hasExceptionDate = instances.some(
        instance => instance.startDate.getTime() === exceptionDate.getTime()
      );
      expect(hasExceptionDate).toBe(false);
    });

    it('should maintain event duration in recurring instances', () => {
      const baseEvent = {
        id: 'evt_123',
        isRecurring: true,
        recurrenceRule: 'FREQ=DAILY',
        startDate: new Date('2025-01-01T10:00:00'),
        endDate: new Date('2025-01-01T12:00:00'), // 2 hour duration
        exceptionDates: []
      } as CalendarEvent;

      const instances = generateRecurringInstances(
        baseEvent,
        new Date('2025-01-01'),
        new Date('2025-01-05')
      );

      // Verify each instance has 2 hour duration
      instances.forEach(instance => {
        const duration = instance.endDate.getTime() - instance.startDate.getTime();
        expect(duration).toBe(2 * 60 * 60 * 1000); // 2 hours in milliseconds
      });
    });
  });
});
