/**
 * Event Reminder Service Tests
 * 
 * Tests the reminder service functionality including:
 * - Reminder time calculation
 * - Notification generation
 * - Deduplication logic
 */

import { describe, it, expect } from 'vitest';
import {
  calculateReminderTime,
  generateReminderNotification,
  ReminderValidationError
} from '../event-reminder-service';
import { CalendarEvent, EventSourceType } from '@prisma/client';

describe('Event Reminder Service', () => {
  describe('calculateReminderTime', () => {
    it('should calculate reminder time correctly for 1 day before', () => {
      const eventDate = new Date('2025-12-31T10:00:00');
      const reminderTime = calculateReminderTime(eventDate, 1440); // 1440 minutes = 1 day
      
      expect(reminderTime.getTime()).toBe(new Date('2025-12-30T10:00:00').getTime());
    });

    it('should calculate reminder time correctly for 1 week before', () => {
      const eventDate = new Date('2025-12-31T10:00:00');
      const reminderTime = calculateReminderTime(eventDate, 10080); // 10080 minutes = 7 days
      
      expect(reminderTime.getTime()).toBe(new Date('2025-12-24T10:00:00').getTime());
    });

    it('should calculate reminder time correctly for 1 hour before', () => {
      const eventDate = new Date('2025-12-31T10:00:00');
      const reminderTime = calculateReminderTime(eventDate, 60); // 60 minutes = 1 hour
      
      expect(reminderTime.getTime()).toBe(new Date('2025-12-31T09:00:00').getTime());
    });

    it('should handle zero offset', () => {
      const eventDate = new Date('2025-12-31T10:00:00');
      const reminderTime = calculateReminderTime(eventDate, 0);
      
      expect(reminderTime.getTime()).toBe(eventDate.getTime());
    });
  });

  describe('generateReminderNotification', () => {
    it('should generate notification with all event details', () => {
      const event: CalendarEvent = {
        id: 'event-123',
        title: 'Team Meeting',
        description: 'Quarterly review meeting',
        categoryId: 'cat-123',
        startDate: new Date('2025-12-31T10:00:00'),
        endDate: new Date('2025-12-31T11:00:00'),
        isAllDay: false,
        location: 'Conference Room A',
        visibleToRoles: ['TEACHER'],
        visibleToClasses: [],
        visibleToSections: [],
        sourceType: null,
        sourceId: null,
        isRecurring: false,
        recurrenceRule: null,
        recurrenceId: null,
        exceptionDates: [],
        attachments: [],
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const notification = generateReminderNotification(event);

      expect(notification.eventTitle).toBe('Team Meeting');
      expect(notification.eventDate).toEqual(event.startDate);
      expect(notification.eventTime).toBeTruthy();
      expect(notification.location).toBe('Conference Room A');
      expect(notification.description).toBe('Quarterly review meeting');
    });

    it('should handle all-day events', () => {
      const event: CalendarEvent = {
        id: 'event-123',
        title: 'Holiday',
        description: null,
        categoryId: 'cat-123',
        startDate: new Date('2025-12-31T00:00:00'),
        endDate: new Date('2025-12-31T23:59:59'),
        isAllDay: true,
        location: null,
        visibleToRoles: ['TEACHER', 'STUDENT'],
        visibleToClasses: [],
        visibleToSections: [],
        sourceType: null,
        sourceId: null,
        isRecurring: false,
        recurrenceRule: null,
        recurrenceId: null,
        exceptionDates: [],
        attachments: [],
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const notification = generateReminderNotification(event);

      expect(notification.eventTitle).toBe('Holiday');
      expect(notification.eventTime).toBe('All Day');
      expect(notification.location).toBeUndefined();
      expect(notification.description).toBeUndefined();
    });

    it('should handle events without location and description', () => {
      const event: CalendarEvent = {
        id: 'event-123',
        title: 'Quick Meeting',
        description: null,
        categoryId: 'cat-123',
        startDate: new Date('2025-12-31T10:00:00'),
        endDate: new Date('2025-12-31T10:30:00'),
        isAllDay: false,
        location: null,
        visibleToRoles: ['TEACHER'],
        visibleToClasses: [],
        visibleToSections: [],
        sourceType: null,
        sourceId: null,
        isRecurring: false,
        recurrenceRule: null,
        recurrenceId: null,
        exceptionDates: [],
        attachments: [],
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const notification = generateReminderNotification(event);

      expect(notification.eventTitle).toBe('Quick Meeting');
      expect(notification.location).toBeUndefined();
      expect(notification.description).toBeUndefined();
    });
  });
});
