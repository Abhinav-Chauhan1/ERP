/**
 * Tests for Meeting Calendar Integration Service
 * 
 * These tests verify that calendar events are properly created, updated,
 * and deleted when parent-teacher meetings are modified.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserRole, EventSourceType, MeetingStatus } from '@prisma/client';
import {
  createCalendarEventFromMeeting,
  updateCalendarEventFromMeeting,
  deleteCalendarEventFromMeeting,
  syncMeetingToCalendar
} from '../meeting-calendar-integration';
import * as calendarService from '../calendar-service';

// Mock the calendar service
vi.mock('../calendar-service', () => ({
  createCalendarEvent: vi.fn(),
  updateCalendarEvent: vi.fn(),
  deleteCalendarEvent: vi.fn(),
  getCalendarEvents: vi.fn()
}));

// Mock the Prisma client
vi.mock('@/lib/db', () => ({
  db: {
    calendarEventCategory: {
      findFirst: vi.fn()
    },
    parentMeeting: {
      findUnique: vi.fn()
    }
  }
}));

import { db } from '@/lib/db';

describe('Meeting Calendar Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCalendarEventFromMeeting', () => {
    it('should create a calendar event with correct meeting details', async () => {
      // Arrange
      const mockMeeting = {
        id: 'meeting-1',
        title: 'Discuss Academic Progress',
        description: 'Review student performance',
        scheduledDate: new Date('2025-03-15T14:00:00Z'),
        duration: 45,
        location: 'Room 101',
        status: MeetingStatus.SCHEDULED,
        parent: {
          id: 'parent-1',
          userId: 'user-parent-1',
          user: { id: 'user-parent-1', firstName: 'John', lastName: 'Doe' }
        },
        teacher: {
          id: 'teacher-1',
          userId: 'user-teacher-1',
          user: { id: 'user-teacher-1', firstName: 'Jane', lastName: 'Smith' }
        }
      };

      const mockCategory = {
        id: 'category-meeting',
        name: 'Meeting',
        description: 'Meeting events',
        color: '#00FF00',
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(db.calendarEventCategory.findFirst).mockResolvedValue(mockCategory);
      vi.mocked(calendarService.createCalendarEvent).mockResolvedValue({} as any);

      // Act
      await createCalendarEventFromMeeting(mockMeeting as any, 'user-1');

      // Assert
      expect(calendarService.createCalendarEvent).toHaveBeenCalledWith({
        title: 'Parent-Teacher Meeting: Discuss Academic Progress',
        description: expect.stringContaining('Review student performance'),
        categoryId: 'category-meeting',
        startDate: mockMeeting.scheduledDate,
        endDate: new Date(mockMeeting.scheduledDate.getTime() + 45 * 60000),
        isAllDay: false,
        location: 'Room 101',
        visibleToRoles: [UserRole.ADMIN],
        visibleToClasses: [],
        visibleToSections: [],
        sourceType: EventSourceType.MEETING,
        sourceId: 'meeting-1',
        isRecurring: false,
        createdBy: 'user-1'
      });
    });

    it('should use default duration when not specified', async () => {
      // Arrange
      const mockMeeting = {
        id: 'meeting-1',
        title: 'Quick Meeting',
        scheduledDate: new Date('2025-03-15T14:00:00Z'),
        duration: null,
        status: MeetingStatus.SCHEDULED,
        parent: {
          id: 'parent-1',
          userId: 'user-parent-1',
          user: { id: 'user-parent-1', firstName: 'John', lastName: 'Doe' }
        },
        teacher: {
          id: 'teacher-1',
          userId: 'user-teacher-1',
          user: { id: 'user-teacher-1', firstName: 'Jane', lastName: 'Smith' }
        }
      };

      const mockCategory = {
        id: 'category-meeting',
        name: 'Meeting',
        description: 'Meeting events',
        color: '#00FF00',
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(db.calendarEventCategory.findFirst).mockResolvedValue(mockCategory);
      vi.mocked(calendarService.createCalendarEvent).mockResolvedValue({} as any);

      // Act
      await createCalendarEventFromMeeting(mockMeeting as any, 'user-1');

      // Assert
      expect(calendarService.createCalendarEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          endDate: new Date(mockMeeting.scheduledDate.getTime() + 30 * 60000) // Default 30 minutes
        })
      );
    });

    it('should handle missing meeting category gracefully', async () => {
      // Arrange
      const mockMeeting = {
        id: 'meeting-1',
        title: 'Test Meeting',
        scheduledDate: new Date(),
        status: MeetingStatus.SCHEDULED,
        parent: {
          id: 'parent-1',
          userId: 'user-parent-1',
          user: { id: 'user-parent-1', firstName: 'John', lastName: 'Doe' }
        },
        teacher: {
          id: 'teacher-1',
          userId: 'user-teacher-1',
          user: { id: 'user-teacher-1', firstName: 'Jane', lastName: 'Smith' }
        }
      };

      vi.mocked(db.calendarEventCategory.findFirst).mockResolvedValue(null);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await createCalendarEventFromMeeting(mockMeeting as any, 'user-1');

      // Assert
      expect(calendarService.createCalendarEvent).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Meeting category not found in calendar system');
      
      consoleSpy.mockRestore();
    });
  });

  describe('updateCalendarEventFromMeeting', () => {
    it('should update existing calendar event with new meeting details', async () => {
      // Arrange
      const mockMeeting = {
        id: 'meeting-1',
        title: 'Updated Meeting',
        description: 'New agenda',
        scheduledDate: new Date('2025-03-20T15:00:00Z'),
        duration: 60,
        location: 'Room 202',
        status: MeetingStatus.RESCHEDULED,
        parent: {
          id: 'parent-1',
          userId: 'user-parent-1',
          user: { id: 'user-parent-1', firstName: 'John', lastName: 'Doe' }
        },
        teacher: {
          id: 'teacher-1',
          userId: 'user-teacher-1',
          user: { id: 'user-teacher-1', firstName: 'Jane', lastName: 'Smith' }
        }
      };

      const mockExistingEvent = {
        id: 'event-1',
        sourceType: EventSourceType.MEETING,
        sourceId: 'meeting-1'
      };

      const mockCategory = {
        id: 'category-meeting',
        name: 'Meeting',
        description: 'Meeting events',
        color: '#00FF00',
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(calendarService.getCalendarEvents).mockResolvedValue([mockExistingEvent] as any);
      vi.mocked(db.calendarEventCategory.findFirst).mockResolvedValue(mockCategory);
      vi.mocked(calendarService.updateCalendarEvent).mockResolvedValue({} as any);

      // Act
      await updateCalendarEventFromMeeting(mockMeeting as any);

      // Assert
      expect(calendarService.updateCalendarEvent).toHaveBeenCalledWith(
        'event-1',
        {
          title: 'Parent-Teacher Meeting: Updated Meeting',
          description: expect.stringContaining('New agenda'),
          categoryId: 'category-meeting',
          startDate: mockMeeting.scheduledDate,
          endDate: new Date(mockMeeting.scheduledDate.getTime() + 60 * 60000),
          location: 'Room 202',
          visibleToRoles: [UserRole.ADMIN]
        },
        'single'
      );
    });

    it('should handle missing calendar event gracefully', async () => {
      // Arrange
      const mockMeeting = {
        id: 'meeting-1',
        title: 'Test',
        scheduledDate: new Date(),
        status: MeetingStatus.SCHEDULED,
        parent: {
          id: 'parent-1',
          userId: 'user-parent-1',
          user: { id: 'user-parent-1', firstName: 'John', lastName: 'Doe' }
        },
        teacher: {
          id: 'teacher-1',
          userId: 'user-teacher-1',
          user: { id: 'user-teacher-1', firstName: 'Jane', lastName: 'Smith' }
        }
      };

      vi.mocked(calendarService.getCalendarEvents).mockResolvedValue([]);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      await updateCalendarEventFromMeeting(mockMeeting as any);

      // Assert
      expect(calendarService.updateCalendarEvent).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('No calendar event found for meeting: meeting-1');
      
      consoleSpy.mockRestore();
    });
  });

  describe('deleteCalendarEventFromMeeting', () => {
    it('should delete calendar event associated with meeting', async () => {
      // Arrange
      const mockEvent = {
        id: 'event-1',
        sourceType: EventSourceType.MEETING,
        sourceId: 'meeting-1'
      };

      vi.mocked(calendarService.getCalendarEvents).mockResolvedValue([mockEvent] as any);
      vi.mocked(calendarService.deleteCalendarEvent).mockResolvedValue(undefined);

      // Act
      await deleteCalendarEventFromMeeting('meeting-1');

      // Assert
      expect(calendarService.deleteCalendarEvent).toHaveBeenCalledWith('event-1', 'single');
    });

    it('should handle multiple calendar events for same meeting', async () => {
      // Arrange
      const mockEvents = [
        { id: 'event-1', sourceType: EventSourceType.MEETING, sourceId: 'meeting-1' },
        { id: 'event-2', sourceType: EventSourceType.MEETING, sourceId: 'meeting-1' }
      ];

      vi.mocked(calendarService.getCalendarEvents).mockResolvedValue(mockEvents as any);
      vi.mocked(calendarService.deleteCalendarEvent).mockResolvedValue(undefined);

      // Act
      await deleteCalendarEventFromMeeting('meeting-1');

      // Assert
      expect(calendarService.deleteCalendarEvent).toHaveBeenCalledTimes(2);
      expect(calendarService.deleteCalendarEvent).toHaveBeenCalledWith('event-1', 'single');
      expect(calendarService.deleteCalendarEvent).toHaveBeenCalledWith('event-2', 'single');
    });

    it('should handle missing calendar event gracefully', async () => {
      // Arrange
      vi.mocked(calendarService.getCalendarEvents).mockResolvedValue([]);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      await deleteCalendarEventFromMeeting('meeting-1');

      // Assert
      expect(calendarService.deleteCalendarEvent).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('No calendar event found for meeting: meeting-1');
      
      consoleSpy.mockRestore();
    });
  });

  describe('syncMeetingToCalendar', () => {
    it('should sync existing meeting to calendar', async () => {
      // Arrange
      const mockMeeting = {
        id: 'meeting-1',
        title: 'Sync Test',
        scheduledDate: new Date(),
        status: MeetingStatus.SCHEDULED,
        parent: {
          id: 'parent-1',
          userId: 'user-parent-1',
          user: { id: 'user-parent-1', firstName: 'John', lastName: 'Doe' }
        },
        teacher: {
          id: 'teacher-1',
          userId: 'user-teacher-1',
          user: { id: 'user-teacher-1', firstName: 'Jane', lastName: 'Smith' }
        }
      };

      vi.mocked(db.parentMeeting.findUnique).mockResolvedValue(mockMeeting as any);
      vi.mocked(calendarService.getCalendarEvents).mockResolvedValue([]);
      
      const mockCategory = {
        id: 'category-meeting',
        name: 'Meeting',
        description: 'Meeting events',
        color: '#00FF00',
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      vi.mocked(db.calendarEventCategory.findFirst).mockResolvedValue(mockCategory);
      vi.mocked(calendarService.createCalendarEvent).mockResolvedValue({} as any);

      // Act
      await syncMeetingToCalendar('meeting-1', 'user-1');

      // Assert
      expect(calendarService.createCalendarEvent).toHaveBeenCalled();
    });

    it('should not create duplicate calendar event', async () => {
      // Arrange
      const mockMeeting = {
        id: 'meeting-1',
        title: 'Test',
        scheduledDate: new Date(),
        status: MeetingStatus.SCHEDULED,
        parent: {
          id: 'parent-1',
          userId: 'user-parent-1',
          user: { id: 'user-parent-1', firstName: 'John', lastName: 'Doe' }
        },
        teacher: {
          id: 'teacher-1',
          userId: 'user-teacher-1',
          user: { id: 'user-teacher-1', firstName: 'Jane', lastName: 'Smith' }
        }
      };

      const mockExistingEvent = {
        id: 'event-1',
        sourceType: EventSourceType.MEETING,
        sourceId: 'meeting-1'
      };

      vi.mocked(db.parentMeeting.findUnique).mockResolvedValue(mockMeeting as any);
      vi.mocked(calendarService.getCalendarEvents).mockResolvedValue([mockExistingEvent] as any);

      // Act
      await syncMeetingToCalendar('meeting-1', 'user-1');

      // Assert
      expect(calendarService.createCalendarEvent).not.toHaveBeenCalled();
    });

    it('should throw error when meeting not found', async () => {
      // Arrange
      vi.mocked(db.parentMeeting.findUnique).mockResolvedValue(null);

      // Act & Assert
      await expect(syncMeetingToCalendar('meeting-1', 'user-1')).rejects.toThrow('Meeting not found: meeting-1');
    });
  });
});
