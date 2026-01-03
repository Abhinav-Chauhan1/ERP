/**
 * Tests for Assignment Calendar Integration Service
 * 
 * These tests verify that calendar events are properly created, updated,
 * and deleted when assignments are modified.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserRole, EventSourceType } from '@prisma/client';
import {
  createCalendarEventFromAssignment,
  updateCalendarEventFromAssignment,
  deleteCalendarEventFromAssignment,
  syncAssignmentToCalendar
} from '../assignment-calendar-integration';
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
    assignment: {
      findUnique: vi.fn()
    }
  }
}));

import { db } from '@/lib/db';

describe('Assignment Calendar Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCalendarEventFromAssignment', () => {
    it('should create a calendar event with correct assignment details', async () => {
      // Arrange
      const mockAssignment = {
        id: 'assignment-1',
        title: 'Math Homework',
        description: 'Complete exercises 1-10',
        instructions: 'Show all work',
        totalMarks: 50,
        dueDate: new Date('2025-03-20T23:59:59Z'),
        assignedDate: new Date('2025-03-15T00:00:00Z'),
        subject: { id: 'subject-1', name: 'Mathematics' },
        classes: [
          { classId: 'class-1', class: { id: 'class-1', name: 'Grade 10A' } },
          { classId: 'class-2', class: { id: 'class-2', name: 'Grade 10B' } }
        ]
      };

      const mockCategory = {
        id: 'category-assignment',
        name: 'Assignment',
        description: 'Assignment events',
        color: '#00FF00',
        isActive: true,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(db.calendarEventCategory.findFirst).mockResolvedValue(mockCategory);
      vi.mocked(calendarService.createCalendarEvent).mockResolvedValue({} as any);

      // Act
      await createCalendarEventFromAssignment(mockAssignment as any, 'teacher-1');

      // Assert
      expect(calendarService.createCalendarEvent).toHaveBeenCalledWith({
        title: 'Assignment Due: Math Homework',
        description: expect.stringContaining('Complete exercises 1-10'),
        categoryId: 'category-assignment',
        startDate: mockAssignment.dueDate,
        endDate: mockAssignment.dueDate,
        isAllDay: true,
        location: undefined,
        visibleToRoles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT],
        visibleToClasses: ['class-1', 'class-2'],
        visibleToSections: [],
        sourceType: EventSourceType.ASSIGNMENT,
        sourceId: 'assignment-1',
        isRecurring: false,
        createdBy: 'teacher-1'
      });
    });

    it('should handle assignment without description', async () => {
      // Arrange
      const mockAssignment = {
        id: 'assignment-2',
        title: 'Science Project',
        description: null,
        instructions: 'Research and present',
        totalMarks: 100,
        dueDate: new Date('2025-04-01T23:59:59Z'),
        assignedDate: new Date('2025-03-15T00:00:00Z'),
        subject: { id: 'subject-2', name: 'Science' },
        classes: [
          { classId: 'class-1', class: { id: 'class-1', name: 'Grade 9' } }
        ]
      };

      const mockCategory = {
        id: 'category-assignment',
        name: 'Assignment',
        description: 'Assignment events',
        color: '#00FF00',
        isActive: true,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(db.calendarEventCategory.findFirst).mockResolvedValue(mockCategory);
      vi.mocked(calendarService.createCalendarEvent).mockResolvedValue({} as any);

      // Act
      await createCalendarEventFromAssignment(mockAssignment as any, 'teacher-1');

      // Assert
      expect(calendarService.createCalendarEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Assignment Due: Science Project',
          description: expect.stringContaining('Science Project')
        })
      );
    });

    it('should handle missing assignment category gracefully', async () => {
      // Arrange
      const mockAssignment = {
        id: 'assignment-1',
        title: 'Test Assignment',
        totalMarks: 50,
        dueDate: new Date(),
        assignedDate: new Date(),
        subject: { id: 'subject-1', name: 'Math' },
        classes: []
      };

      vi.mocked(db.calendarEventCategory.findFirst).mockResolvedValue(null);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await createCalendarEventFromAssignment(mockAssignment as any, 'teacher-1');

      // Assert
      expect(calendarService.createCalendarEvent).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Assignment category not found in calendar system');
      
      consoleSpy.mockRestore();
    });
  });

  describe('updateCalendarEventFromAssignment', () => {
    it('should update existing calendar event with new assignment details', async () => {
      // Arrange
      const mockAssignment = {
        id: 'assignment-1',
        title: 'Updated Assignment',
        description: 'New description',
        instructions: 'Updated instructions',
        totalMarks: 75,
        dueDate: new Date('2025-03-25T23:59:59Z'),
        assignedDate: new Date('2025-03-15T00:00:00Z'),
        subject: { id: 'subject-1', name: 'English' },
        classes: [
          { classId: 'class-3', class: { id: 'class-3', name: 'Grade 11' } }
        ]
      };

      const mockExistingEvent = {
        id: 'event-1',
        sourceType: EventSourceType.ASSIGNMENT,
        sourceId: 'assignment-1'
      };

      const mockCategory = {
        id: 'category-assignment',
        name: 'Assignment',
        description: 'Assignment events',
        color: '#00FF00',
        isActive: true,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(calendarService.getCalendarEvents).mockResolvedValue([mockExistingEvent] as any);
      vi.mocked(db.calendarEventCategory.findFirst).mockResolvedValue(mockCategory);
      vi.mocked(calendarService.updateCalendarEvent).mockResolvedValue({} as any);

      // Act
      await updateCalendarEventFromAssignment(mockAssignment as any);

      // Assert
      expect(calendarService.updateCalendarEvent).toHaveBeenCalledWith(
        'event-1',
        {
          title: 'Assignment Due: Updated Assignment',
          description: expect.stringContaining('New description'),
          categoryId: 'category-assignment',
          startDate: mockAssignment.dueDate,
          endDate: mockAssignment.dueDate,
          visibleToRoles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT],
          visibleToClasses: ['class-3'],
          visibleToSections: []
        },
        'single'
      );
    });

    it('should handle missing calendar event gracefully', async () => {
      // Arrange
      const mockAssignment = {
        id: 'assignment-1',
        title: 'Test',
        totalMarks: 50,
        dueDate: new Date(),
        assignedDate: new Date(),
        subject: { id: 'subject-1', name: 'Math' },
        classes: []
      };

      vi.mocked(calendarService.getCalendarEvents).mockResolvedValue([]);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      await updateCalendarEventFromAssignment(mockAssignment as any);

      // Assert
      expect(calendarService.updateCalendarEvent).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('No calendar event found for assignment: assignment-1');
      
      consoleSpy.mockRestore();
    });
  });

  describe('deleteCalendarEventFromAssignment', () => {
    it('should delete calendar event associated with assignment', async () => {
      // Arrange
      const mockEvent = {
        id: 'event-1',
        sourceType: EventSourceType.ASSIGNMENT,
        sourceId: 'assignment-1'
      };

      vi.mocked(calendarService.getCalendarEvents).mockResolvedValue([mockEvent] as any);
      vi.mocked(calendarService.deleteCalendarEvent).mockResolvedValue(undefined);

      // Act
      await deleteCalendarEventFromAssignment('assignment-1');

      // Assert
      expect(calendarService.deleteCalendarEvent).toHaveBeenCalledWith('event-1', 'single');
    });

    it('should handle multiple calendar events for same assignment', async () => {
      // Arrange
      const mockEvents = [
        { id: 'event-1', sourceType: EventSourceType.ASSIGNMENT, sourceId: 'assignment-1' },
        { id: 'event-2', sourceType: EventSourceType.ASSIGNMENT, sourceId: 'assignment-1' }
      ];

      vi.mocked(calendarService.getCalendarEvents).mockResolvedValue(mockEvents as any);
      vi.mocked(calendarService.deleteCalendarEvent).mockResolvedValue(undefined);

      // Act
      await deleteCalendarEventFromAssignment('assignment-1');

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
      await deleteCalendarEventFromAssignment('assignment-1');

      // Assert
      expect(calendarService.deleteCalendarEvent).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('No calendar event found for assignment: assignment-1');
      
      consoleSpy.mockRestore();
    });
  });

  describe('syncAssignmentToCalendar', () => {
    it('should sync existing assignment to calendar', async () => {
      // Arrange
      const mockAssignment = {
        id: 'assignment-1',
        title: 'Sync Test',
        totalMarks: 50,
        dueDate: new Date(),
        assignedDate: new Date(),
        subject: { id: 'subject-1', name: 'Math' },
        classes: [
          { classId: 'class-1', class: { id: 'class-1', name: 'Grade 10' } }
        ]
      };

      vi.mocked(db.assignment.findUnique).mockResolvedValue(mockAssignment as any);
      vi.mocked(calendarService.getCalendarEvents).mockResolvedValue([]);
      
      const mockCategory = {
        id: 'category-assignment',
        name: 'Assignment',
        description: 'Assignment events',
        color: '#00FF00',
        isActive: true,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      vi.mocked(db.calendarEventCategory.findFirst).mockResolvedValue(mockCategory);
      vi.mocked(calendarService.createCalendarEvent).mockResolvedValue({} as any);

      // Act
      await syncAssignmentToCalendar('assignment-1', 'teacher-1');

      // Assert
      expect(calendarService.createCalendarEvent).toHaveBeenCalled();
    });

    it('should not create duplicate calendar event', async () => {
      // Arrange
      const mockAssignment = {
        id: 'assignment-1',
        title: 'Test',
        totalMarks: 50,
        dueDate: new Date(),
        assignedDate: new Date(),
        subject: { id: 'subject-1', name: 'Math' },
        classes: []
      };

      const mockExistingEvent = {
        id: 'event-1',
        sourceType: EventSourceType.ASSIGNMENT,
        sourceId: 'assignment-1'
      };

      vi.mocked(db.assignment.findUnique).mockResolvedValue(mockAssignment as any);
      vi.mocked(calendarService.getCalendarEvents).mockResolvedValue([mockExistingEvent] as any);

      // Act
      await syncAssignmentToCalendar('assignment-1', 'teacher-1');

      // Assert
      expect(calendarService.createCalendarEvent).not.toHaveBeenCalled();
    });

    it('should throw error if assignment not found', async () => {
      // Arrange
      vi.mocked(db.assignment.findUnique).mockResolvedValue(null);

      // Act & Assert
      await expect(syncAssignmentToCalendar('assignment-1', 'teacher-1'))
        .rejects.toThrow('Assignment not found: assignment-1');
    });
  });
});
