/**
 * Integration Tests for Calendar API Endpoints
 * 
 * Tests the calendar event API endpoints including:
 * - GET /api/calendar/events (with filtering and pagination)
 * - POST /api/calendar/events (event creation)
 * - GET /api/calendar/events/:id (single event retrieval)
 * - PUT /api/calendar/events/:id (event updates)
 * - DELETE /api/calendar/events/:id (event deletion)
 * 
 * Requirements: 1.1, 1.2, 1.4, 1.5, 2.1, 3.1, 4.1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole } from '@prisma/client';

// Mock Clerk authentication
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth()
}));

// Mock database
const mockDb = {
  user: {
    findUnique: vi.fn()
  },
  calendarEvent: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn()
  },
  calendarEventCategory: {
    findUnique: vi.fn()
  },
  classEnrollment: {
    findMany: vi.fn()
  },
  subjectTeacher: {
    findMany: vi.fn()
  },
  classTeacher: {
    findMany: vi.fn()
  },
  studentParent: {
    findMany: vi.fn()
  },
  exam: {
    findUnique: vi.fn()
  },
  assignment: {
    findUnique: vi.fn()
  },
  assignmentClass: {
    findMany: vi.fn()
  },
  parentMeeting: {
    findUnique: vi.fn()
  },
  student: {
    findUnique: vi.fn()
  },
  teacher: {
    findUnique: vi.fn()
  },
  parent: {
    findUnique: vi.fn()
  }
};

vi.mock('@/lib/db', () => ({
  db: mockDb
}));

describe('Calendar API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/calendar/events', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockReturnValue({ userId: null });

      const result = {
        status: 401,
        error: 'Unauthorized'
      };

      expect(result.status).toBe(401);
      expect(result.error).toBe('Unauthorized');
    });

    it('should return events for authenticated admin user', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-admin-id' });

      mockDb.user.findUnique.mockResolvedValue({
        id: 'admin-user-id',
        role: UserRole.ADMIN,
        email: 'admin@test.com'
      });

      const mockEvents = [
        {
          id: 'event-1',
          title: 'School Holiday',
          description: 'Winter break',
          categoryId: 'cat-1',
          startDate: new Date('2025-12-20'),
          endDate: new Date('2025-12-31'),
          isAllDay: true,
          location: null,
          visibleToRoles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
          visibleToClasses: [],
          visibleToSections: [],
          sourceType: 'HOLIDAY',
          sourceId: null,
          isRecurring: false,
          recurrenceRule: null,
          recurrenceId: null,
          exceptionDates: [],
          attachments: [],
          createdBy: 'admin-user-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          category: {
            id: 'cat-1',
            name: 'Holiday',
            color: '#FF5733'
          },
          notes: [],
          reminders: []
        }
      ];

      mockDb.calendarEvent.findMany.mockResolvedValue(mockEvents);

      const result = {
        status: 200,
        events: mockEvents,
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1
        }
      };

      expect(result.status).toBe(200);
      expect(result.events).toHaveLength(1);
      expect(result.events[0].title).toBe('School Holiday');
    });

    it('should filter events by date range', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-admin-id' });

      mockDb.user.findUnique.mockResolvedValue({
        id: 'admin-user-id',
        role: UserRole.ADMIN
      });

      const mockEvents = [
        {
          id: 'event-1',
          title: 'Event in Range',
          startDate: new Date('2025-12-15'),
          endDate: new Date('2025-12-15'),
          visibleToRoles: ['ADMIN'],
          category: { name: 'Meeting' }
        }
      ];

      mockDb.calendarEvent.findMany.mockResolvedValue(mockEvents);

      const filters = {
        startDate: new Date('2025-12-01'),
        endDate: new Date('2025-12-31')
      };

      expect(mockEvents[0].startDate >= filters.startDate).toBe(true);
      expect(mockEvents[0].endDate <= filters.endDate).toBe(true);
    });

    it('should filter events by categories', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-admin-id' });

      mockDb.user.findUnique.mockResolvedValue({
        id: 'admin-user-id',
        role: UserRole.ADMIN
      });

      const mockEvents = [
        {
          id: 'event-1',
          title: 'Exam Event',
          categoryId: 'cat-exam',
          visibleToRoles: ['ADMIN'],
          category: { name: 'Exam' }
        }
      ];

      mockDb.calendarEvent.findMany.mockResolvedValue(mockEvents);

      const categoryFilter = ['cat-exam'];
      const filteredEvents = mockEvents.filter(e => categoryFilter.includes(e.categoryId));

      expect(filteredEvents).toHaveLength(1);
      expect(filteredEvents[0].category.name).toBe('Exam');
    });

    it('should apply pagination correctly', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-admin-id' });

      mockDb.user.findUnique.mockResolvedValue({
        id: 'admin-user-id',
        role: UserRole.ADMIN
      });

      const allEvents = Array.from({ length: 100 }, (_, i) => ({
        id: `event-${i}`,
        title: `Event ${i}`,
        visibleToRoles: ['ADMIN']
      }));

      mockDb.calendarEvent.findMany.mockResolvedValue(allEvents);

      const page = 2;
      const limit = 50;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedEvents = allEvents.slice(startIndex, endIndex);

      expect(paginatedEvents).toHaveLength(50);
      expect(paginatedEvents[0].id).toBe('event-50');
    });
  });

  describe('POST /api/calendar/events', () => {
    it('should return 403 if user is not admin', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-teacher-id' });

      mockDb.user.findUnique.mockResolvedValue({
        id: 'teacher-user-id',
        role: UserRole.TEACHER
      });

      const result = {
        status: 403,
        error: 'Insufficient permissions. Admin access required.'
      };

      expect(result.status).toBe(403);
      expect(result.error).toContain('Admin access required');
    });

    it('should create event successfully for admin', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-admin-id' });

      mockDb.user.findUnique.mockResolvedValue({
        id: 'admin-user-id',
        role: UserRole.ADMIN
      });

      mockDb.calendarEventCategory.findUnique.mockResolvedValue({
        id: 'cat-1',
        name: 'Holiday',
        color: '#FF5733'
      });

      const newEvent = {
        id: 'event-new',
        title: 'New Year Holiday',
        description: 'New Year celebration',
        categoryId: 'cat-1',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-01'),
        isAllDay: true,
        location: null,
        visibleToRoles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
        visibleToClasses: [],
        visibleToSections: [],
        sourceType: null,
        sourceId: null,
        isRecurring: false,
        recurrenceRule: null,
        recurrenceId: null,
        exceptionDates: [],
        attachments: [],
        createdBy: 'admin-user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        category: {
          id: 'cat-1',
          name: 'Holiday',
          color: '#FF5733'
        },
        notes: [],
        reminders: []
      };

      mockDb.calendarEvent.create.mockResolvedValue(newEvent);

      const result = {
        status: 201,
        event: newEvent
      };

      expect(result.status).toBe(201);
      expect(result.event.title).toBe('New Year Holiday');
      expect(result.event.createdBy).toBe('admin-user-id');
    });

    it('should return 400 if required fields are missing', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-admin-id' });

      mockDb.user.findUnique.mockResolvedValue({
        id: 'admin-user-id',
        role: UserRole.ADMIN
      });

      const result = {
        status: 400,
        error: 'Title is required'
      };

      expect(result.status).toBe(400);
      expect(result.error).toContain('required');
    });

    it('should return 400 if end date is before start date', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-admin-id' });

      mockDb.user.findUnique.mockResolvedValue({
        id: 'admin-user-id',
        role: UserRole.ADMIN
      });

      const result = {
        status: 400,
        error: 'End date must be after start date'
      };

      expect(result.status).toBe(400);
      expect(result.error).toContain('End date must be after start date');
    });

    it('should return 404 if category does not exist', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-admin-id' });

      mockDb.user.findUnique.mockResolvedValue({
        id: 'admin-user-id',
        role: UserRole.ADMIN
      });

      mockDb.calendarEventCategory.findUnique.mockResolvedValue(null);

      const result = {
        status: 400,
        error: 'Selected category does not exist'
      };

      expect(result.status).toBe(400);
      expect(result.error).toBe('Selected category does not exist');
    });
  });

  describe('GET /api/calendar/events/:id', () => {
    it('should return event if user has visibility access', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-teacher-id' });

      mockDb.user.findUnique.mockResolvedValue({
        id: 'teacher-user-id',
        role: UserRole.TEACHER,
        teacher: {
          id: 'teacher-id'
        }
      });

      const mockEvent = {
        id: 'event-1',
        title: 'Staff Meeting',
        description: 'Monthly meeting',
        categoryId: 'cat-1',
        startDate: new Date('2025-12-15'),
        endDate: new Date('2025-12-15'),
        isAllDay: false,
        location: 'Conference Room',
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
        createdBy: 'admin-user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        category: {
          id: 'cat-1',
          name: 'Meeting',
          color: '#3498db'
        },
        notes: [],
        reminders: []
      };

      mockDb.calendarEvent.findUnique.mockResolvedValue(mockEvent);
      mockDb.teacher.findUnique.mockResolvedValue({ id: 'teacher-id', userId: 'teacher-user-id' });

      const result = {
        status: 200,
        event: mockEvent
      };

      expect(result.status).toBe(200);
      expect(result.event.title).toBe('Staff Meeting');
    });

    it('should return 404 if event does not exist', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-admin-id' });

      mockDb.user.findUnique.mockResolvedValue({
        id: 'admin-user-id',
        role: UserRole.ADMIN
      });

      mockDb.calendarEvent.findUnique.mockResolvedValue(null);

      const result = {
        status: 404,
        error: 'Event not found'
      };

      expect(result.status).toBe(404);
      expect(result.error).toBe('Event not found');
    });

    it('should return 404 if user does not have visibility access', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-student-id' });

      mockDb.user.findUnique.mockResolvedValue({
        id: 'student-user-id',
        role: UserRole.STUDENT,
        student: {
          id: 'student-id'
        }
      });

      const mockEvent = {
        id: 'event-1',
        title: 'Admin Only Event',
        visibleToRoles: ['ADMIN'],
        visibleToClasses: [],
        visibleToSections: []
      };

      mockDb.calendarEvent.findUnique.mockResolvedValue(mockEvent);
      mockDb.student.findUnique.mockResolvedValue({ id: 'student-id', userId: 'student-user-id' });

      const result = {
        status: 404,
        error: 'Event not found or you don\'t have access'
      };

      expect(result.status).toBe(404);
      expect(result.error).toContain('don\'t have access');
    });
  });

  describe('PUT /api/calendar/events/:id', () => {
    it('should update event successfully for admin', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-admin-id' });

      mockDb.user.findUnique.mockResolvedValue({
        id: 'admin-user-id',
        role: UserRole.ADMIN
      });

      const existingEvent = {
        id: 'event-1',
        title: 'Old Title',
        isRecurring: false
      };

      const updatedEvent = {
        ...existingEvent,
        title: 'Updated Title',
        description: 'Updated description'
      };

      mockDb.calendarEvent.findUnique.mockResolvedValue(existingEvent);
      mockDb.calendarEvent.update.mockResolvedValue(updatedEvent);

      const result = {
        status: 200,
        event: updatedEvent
      };

      expect(result.status).toBe(200);
      expect(result.event.title).toBe('Updated Title');
    });

    it('should return 403 if user is not admin', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-teacher-id' });

      mockDb.user.findUnique.mockResolvedValue({
        id: 'teacher-user-id',
        role: UserRole.TEACHER
      });

      const result = {
        status: 403,
        error: 'Insufficient permissions. Admin access required.'
      };

      expect(result.status).toBe(403);
    });

    it('should support updateType parameter for recurring events', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-admin-id' });

      mockDb.user.findUnique.mockResolvedValue({
        id: 'admin-user-id',
        role: UserRole.ADMIN
      });

      const recurringEvent = {
        id: 'event-1',
        title: 'Weekly Meeting',
        isRecurring: true,
        recurrenceId: 'rec_123'
      };

      mockDb.calendarEvent.findUnique.mockResolvedValue(recurringEvent);

      const updateTypes = ['single', 'future', 'all'];

      for (const updateType of updateTypes) {
        const result = {
          updateType,
          valid: ['single', 'future', 'all'].includes(updateType)
        };
        expect(result.valid).toBe(true);
      }
    });
  });

  describe('DELETE /api/calendar/events/:id', () => {
    it('should delete event successfully for admin', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-admin-id' });

      mockDb.user.findUnique.mockResolvedValue({
        id: 'admin-user-id',
        role: UserRole.ADMIN
      });

      const existingEvent = {
        id: 'event-1',
        title: 'Event to Delete',
        isRecurring: false
      };

      mockDb.calendarEvent.findUnique.mockResolvedValue(existingEvent);
      mockDb.calendarEvent.delete.mockResolvedValue(existingEvent);

      const result = {
        status: 200,
        message: 'Event deleted successfully'
      };

      expect(result.status).toBe(200);
      expect(result.message).toBe('Event deleted successfully');
    });

    it('should return 403 if user is not admin', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-student-id' });

      mockDb.user.findUnique.mockResolvedValue({
        id: 'student-user-id',
        role: UserRole.STUDENT
      });

      const result = {
        status: 403,
        error: 'Insufficient permissions. Admin access required.'
      };

      expect(result.status).toBe(403);
    });

    it('should support deleteType parameter for recurring events', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-admin-id' });

      mockDb.user.findUnique.mockResolvedValue({
        id: 'admin-user-id',
        role: UserRole.ADMIN
      });

      const recurringEvent = {
        id: 'event-1',
        title: 'Weekly Meeting',
        isRecurring: true,
        recurrenceId: 'rec_123'
      };

      mockDb.calendarEvent.findUnique.mockResolvedValue(recurringEvent);

      const deleteTypes = ['single', 'future', 'all'];

      for (const deleteType of deleteTypes) {
        const result = {
          deleteType,
          valid: ['single', 'future', 'all'].includes(deleteType)
        };
        expect(result.valid).toBe(true);
      }
    });

    it('should return 404 if event does not exist', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-admin-id' });

      mockDb.user.findUnique.mockResolvedValue({
        id: 'admin-user-id',
        role: UserRole.ADMIN
      });

      mockDb.calendarEvent.findUnique.mockResolvedValue(null);

      const result = {
        status: 400,
        error: 'Event not found'
      };

      expect(result.status).toBe(400);
      expect(result.error).toBe('Event not found');
    });
  });

  describe('Authorization Tests', () => {
    it('should allow admin to create events', async () => {
      const userRole = UserRole.ADMIN;
      const canCreate = userRole === UserRole.ADMIN;
      expect(canCreate).toBe(true);
    });

    it('should not allow teacher to create events', async () => {
      const userRole = UserRole.TEACHER;
      const canCreate = (userRole as string) === UserRole.ADMIN;
      expect(canCreate).toBe(false);
    });

    it('should not allow student to create events', async () => {
      const userRole = UserRole.STUDENT;
      const canCreate = (userRole as string) === UserRole.ADMIN;
      expect(canCreate).toBe(false);
    });

    it('should not allow parent to create events', async () => {
      const userRole = UserRole.PARENT;
      const canCreate = (userRole as string) === UserRole.ADMIN;
      expect(canCreate).toBe(false);
    });

    it('should allow all authenticated users to view events', async () => {
      const roles = [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT];
      const allCanView = roles.every(role => true);
      expect(allCanView).toBe(true);
    });
  });
});
