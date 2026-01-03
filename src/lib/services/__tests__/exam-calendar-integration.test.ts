/**
 * Tests for Exam Calendar Integration Service
 * 
 * These tests verify that calendar events are properly created, updated,
 * and deleted when exams are modified.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserRole, EventSourceType } from '@prisma/client';
import {
  createCalendarEventFromExam,
  updateCalendarEventFromExam,
  deleteCalendarEventFromExam,
  syncExamToCalendar
} from '../exam-calendar-integration';
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
    exam: {
      findUnique: vi.fn()
    }
  }
}));

import { db } from '@/lib/db';

describe('Exam Calendar Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCalendarEventFromExam', () => {
    it('should create a calendar event with correct exam details', async () => {
      // Arrange
      const mockExam = {
        id: 'exam-1',
        title: 'Mid-term Exam',
        instructions: 'Bring calculator',
        totalMarks: 100,
        passingMarks: 40,
        startTime: new Date('2025-03-15T09:00:00Z'),
        endTime: new Date('2025-03-15T11:00:00Z'),
        subject: { id: 'subject-1', name: 'Mathematics' },
        examType: { name: 'Mid-term' },
        term: {
          academicYear: { id: 'ay-1' },
          class: {
            id: 'class-1',
            sections: [{ id: 'section-1' }, { id: 'section-2' }]
          }
        }
      };

      const mockCategory = {
        id: 'category-exam',
        name: 'Exam',
        description: 'Exam events',
        color: '#FF0000',
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(db.calendarEventCategory.findFirst).mockResolvedValue(mockCategory);
      vi.mocked(calendarService.createCalendarEvent).mockResolvedValue({} as any);

      // Act
      await createCalendarEventFromExam(mockExam as any, 'user-1');

      // Assert
      expect(calendarService.createCalendarEvent).toHaveBeenCalledWith({
        title: 'Mid-term: Mathematics',
        description: expect.stringContaining('Mid-term Exam'),
        categoryId: 'category-exam',
        startDate: mockExam.startTime,
        endDate: mockExam.endTime,
        isAllDay: false,
        location: undefined,
        visibleToRoles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT],
        visibleToClasses: ['class-1'],
        visibleToSections: ['section-1', 'section-2'],
        sourceType: EventSourceType.EXAM,
        sourceId: 'exam-1',
        isRecurring: false,
        createdBy: 'user-1'
      });
    });

    it('should handle missing exam category gracefully', async () => {
      // Arrange
      const mockExam = {
        id: 'exam-1',
        title: 'Test Exam',
        totalMarks: 100,
        passingMarks: 40,
        startTime: new Date(),
        endTime: new Date(),
        subject: { id: 'subject-1', name: 'Math' },
        examType: { name: 'Test' },
        term: {
          academicYear: { id: 'ay-1' }
        }
      };

      vi.mocked(db.calendarEventCategory.findFirst).mockResolvedValue(null);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await createCalendarEventFromExam(mockExam as any, 'user-1');

      // Assert
      expect(calendarService.createCalendarEvent).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Exam category not found in calendar system');
      
      consoleSpy.mockRestore();
    });
  });

  describe('updateCalendarEventFromExam', () => {
    it('should update existing calendar event with new exam details', async () => {
      // Arrange
      const mockExam = {
        id: 'exam-1',
        title: 'Updated Exam',
        instructions: 'New instructions',
        totalMarks: 150,
        passingMarks: 60,
        startTime: new Date('2025-03-20T10:00:00Z'),
        endTime: new Date('2025-03-20T12:00:00Z'),
        subject: { id: 'subject-1', name: 'Physics' },
        examType: { name: 'Final' },
        term: {
          academicYear: { id: 'ay-1' },
          class: {
            id: 'class-2',
            sections: [{ id: 'section-3' }]
          }
        }
      };

      const mockExistingEvent = {
        id: 'event-1',
        sourceType: EventSourceType.EXAM,
        sourceId: 'exam-1'
      };

      const mockCategory = {
        id: 'category-exam',
        name: 'Exam',
        description: 'Exam events',
        color: '#FF0000',
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(calendarService.getCalendarEvents).mockResolvedValue([mockExistingEvent] as any);
      vi.mocked(db.calendarEventCategory.findFirst).mockResolvedValue(mockCategory);
      vi.mocked(calendarService.updateCalendarEvent).mockResolvedValue({} as any);

      // Act
      await updateCalendarEventFromExam(mockExam as any);

      // Assert
      expect(calendarService.updateCalendarEvent).toHaveBeenCalledWith(
        'event-1',
        {
          title: 'Final: Physics',
          description: expect.stringContaining('Updated Exam'),
          categoryId: 'category-exam',
          startDate: mockExam.startTime,
          endDate: mockExam.endTime,
          visibleToRoles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT],
          visibleToClasses: ['class-2'],
          visibleToSections: ['section-3']
        },
        'single'
      );
    });

    it('should handle missing calendar event gracefully', async () => {
      // Arrange
      const mockExam = {
        id: 'exam-1',
        title: 'Test',
        totalMarks: 100,
        passingMarks: 40,
        startTime: new Date(),
        endTime: new Date(),
        subject: { id: 'subject-1', name: 'Math' },
        examType: { name: 'Test' },
        term: { academicYear: { id: 'ay-1' } }
      };

      vi.mocked(calendarService.getCalendarEvents).mockResolvedValue([]);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      await updateCalendarEventFromExam(mockExam as any);

      // Assert
      expect(calendarService.updateCalendarEvent).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('No calendar event found for exam: exam-1');
      
      consoleSpy.mockRestore();
    });
  });

  describe('deleteCalendarEventFromExam', () => {
    it('should delete calendar event associated with exam', async () => {
      // Arrange
      const mockEvent = {
        id: 'event-1',
        sourceType: EventSourceType.EXAM,
        sourceId: 'exam-1'
      };

      vi.mocked(calendarService.getCalendarEvents).mockResolvedValue([mockEvent] as any);
      vi.mocked(calendarService.deleteCalendarEvent).mockResolvedValue(undefined);

      // Act
      await deleteCalendarEventFromExam('exam-1');

      // Assert
      expect(calendarService.deleteCalendarEvent).toHaveBeenCalledWith('event-1', 'single');
    });

    it('should handle multiple calendar events for same exam', async () => {
      // Arrange
      const mockEvents = [
        { id: 'event-1', sourceType: EventSourceType.EXAM, sourceId: 'exam-1' },
        { id: 'event-2', sourceType: EventSourceType.EXAM, sourceId: 'exam-1' }
      ];

      vi.mocked(calendarService.getCalendarEvents).mockResolvedValue(mockEvents as any);
      vi.mocked(calendarService.deleteCalendarEvent).mockResolvedValue(undefined);

      // Act
      await deleteCalendarEventFromExam('exam-1');

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
      await deleteCalendarEventFromExam('exam-1');

      // Assert
      expect(calendarService.deleteCalendarEvent).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('No calendar event found for exam: exam-1');
      
      consoleSpy.mockRestore();
    });
  });

  describe('syncExamToCalendar', () => {
    it('should sync existing exam to calendar', async () => {
      // Arrange
      const mockExam = {
        id: 'exam-1',
        title: 'Sync Test',
        totalMarks: 100,
        passingMarks: 40,
        startTime: new Date(),
        endTime: new Date(),
        subject: { id: 'subject-1', name: 'Math' },
        examType: { name: 'Test' },
        term: {
          academicYear: { id: 'ay-1' }
        }
      };

      vi.mocked(db.exam.findUnique).mockResolvedValue(mockExam as any);
      vi.mocked(calendarService.getCalendarEvents).mockResolvedValue([]);
      
      const mockCategory = {
        id: 'category-exam',
        name: 'Exam',
        description: 'Exam events',
        color: '#FF0000',
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      vi.mocked(db.calendarEventCategory.findFirst).mockResolvedValue(mockCategory);
      vi.mocked(calendarService.createCalendarEvent).mockResolvedValue({} as any);

      // Act
      await syncExamToCalendar('exam-1', 'user-1');

      // Assert
      expect(calendarService.createCalendarEvent).toHaveBeenCalled();
    });

    it('should not create duplicate calendar event', async () => {
      // Arrange
      const mockExam = {
        id: 'exam-1',
        title: 'Test',
        totalMarks: 100,
        passingMarks: 40,
        startTime: new Date(),
        endTime: new Date(),
        subject: { id: 'subject-1', name: 'Math' },
        examType: { name: 'Test' },
        term: { academicYear: { id: 'ay-1' } }
      };

      const mockExistingEvent = {
        id: 'event-1',
        sourceType: EventSourceType.EXAM,
        sourceId: 'exam-1'
      };

      vi.mocked(db.exam.findUnique).mockResolvedValue(mockExam as any);
      vi.mocked(calendarService.getCalendarEvents).mockResolvedValue([mockExistingEvent] as any);

      // Act
      await syncExamToCalendar('exam-1', 'user-1');

      // Assert
      expect(calendarService.createCalendarEvent).not.toHaveBeenCalled();
    });
  });
});
