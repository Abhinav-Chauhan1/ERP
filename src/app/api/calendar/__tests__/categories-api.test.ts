/**
 * Integration Tests for Calendar Categories API Endpoints
 * 
 * Tests the calendar category API endpoints including:
 * - GET /api/calendar/categories (list all categories)
 * - POST /api/calendar/categories (create category)
 * - GET /api/calendar/categories/:id (get single category)
 * - PUT /api/calendar/categories/:id (update category)
 * - DELETE /api/calendar/categories/:id (delete category with reassignment)
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole } from '@prisma/client';

// Mock Clerk authentication
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth()
}));

// Mock database - must be defined before the mock
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn()
    },
    calendarEventCategory: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    calendarEvent: {
      count: vi.fn(),
      updateMany: vi.fn()
    }
  }
}));

// Import after mocks are set up
import { db } from '@/lib/db';
import { GET as getCategories, POST as createCategory } from '../categories/route';
import { GET as getCategory, PUT as updateCategory, DELETE as deleteCategory } from '../categories/[id]/route';
import { NextRequest } from 'next/server';

describe('Calendar Categories API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/calendar/categories', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockReturnValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/calendar/categories');
      const response = await getCategories(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return all active categories for authenticated user', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-user-id' });
      
      (db.user.findUnique as any).mockResolvedValue({
        id: 'user-id',
        clerkId: 'clerk-user-id',
        role: UserRole.TEACHER
      });

      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Holiday',
          description: 'School holidays',
          color: '#EF4444',
          icon: 'Calendar',
          isActive: true,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { events: 5 }
        },
        {
          id: 'cat-2',
          name: 'Exam',
          description: 'Examinations',
          color: '#3B82F6',
          icon: 'FileText',
          isActive: true,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { events: 10 }
        }
      ];

      (db.calendarEventCategory.findMany as any).mockResolvedValue(mockCategories);

      const request = new NextRequest('http://localhost:3000/api/calendar/categories');
      const response = await getCategories(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories).toHaveLength(2);
      expect(data.categories[0].name).toBe('Holiday');
      expect(data.categories[1].name).toBe('Exam');
    });
  });

  describe('POST /api/calendar/categories', () => {
    it('should return 403 if user is not admin', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-teacher-id' });
      
      (db.user.findUnique as any).mockResolvedValue({
        id: 'teacher-id',
        clerkId: 'clerk-teacher-id',
        role: UserRole.TEACHER
      });

      const request = new NextRequest('http://localhost:3000/api/calendar/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Category',
          color: '#10B981'
        })
      });

      const response = await createCategory(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Admin access required');
    });

    it('should create category for admin user', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-admin-id' });
      
      (db.user.findUnique as any).mockResolvedValue({
        id: 'admin-id',
        clerkId: 'clerk-admin-id',
        role: UserRole.ADMIN
      });

      (db.calendarEventCategory.findFirst as any).mockResolvedValue(null); // No duplicate

      const newCategory = {
        id: 'new-cat-id',
        name: 'Sports Event',
        description: 'Sports activities',
        color: '#10B981',
        icon: 'Trophy',
        isActive: true,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (db.calendarEventCategory.create as any).mockResolvedValue(newCategory);

      const request = new NextRequest('http://localhost:3000/api/calendar/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Sports Event',
          description: 'Sports activities',
          color: '#10B981',
          icon: 'Trophy'
        })
      });

      const response = await createCategory(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.category.name).toBe('Sports Event');
      expect(data.category.color).toBe('#10B981');
    });

    it('should return 400 for invalid color format', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-admin-id' });
      
      (db.user.findUnique as any).mockResolvedValue({
        id: 'admin-id',
        clerkId: 'clerk-admin-id',
        role: UserRole.ADMIN
      });

      const request = new NextRequest('http://localhost:3000/api/calendar/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Invalid Category',
          color: 'red' // Invalid format
        })
      });

      const response = await createCategory(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid color format');
    });
  });

  describe('PUT /api/calendar/categories/:id', () => {
    it('should update category for admin user', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-admin-id' });
      
      (db.user.findUnique as any).mockResolvedValue({
        id: 'admin-id',
        clerkId: 'clerk-admin-id',
        role: UserRole.ADMIN
      });

      const existingCategory = {
        id: 'cat-1',
        name: 'Holiday',
        description: 'School holidays',
        color: '#EF4444',
        icon: 'Calendar',
        isActive: true,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { events: 5 }
      };

      (db.calendarEventCategory.findUnique as any).mockResolvedValue(existingCategory);
      (db.calendarEventCategory.findFirst as any).mockResolvedValue(null); // No duplicate name

      const updatedCategory = {
        ...existingCategory,
        color: '#F59E0B',
        updatedAt: new Date()
      };

      (db.calendarEventCategory.update as any).mockResolvedValue(updatedCategory);

      const request = new NextRequest('http://localhost:3000/api/calendar/categories/cat-1', {
        method: 'PUT',
        body: JSON.stringify({
          color: '#F59E0B'
        })
      });

      const response = await updateCategory(request, { params: { id: 'cat-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.category.color).toBe('#F59E0B');
    });
  });

  describe('DELETE /api/calendar/categories/:id', () => {
    it('should require replacement category if category has events', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-admin-id' });
      
      (db.user.findUnique as any).mockResolvedValue({
        id: 'admin-id',
        clerkId: 'clerk-admin-id',
        role: UserRole.ADMIN
      });

      const existingCategory = {
        id: 'cat-1',
        name: 'Holiday',
        description: 'School holidays',
        color: '#EF4444',
        icon: 'Calendar',
        isActive: true,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { events: 5 }
      };

      (db.calendarEventCategory.findUnique as any).mockResolvedValue(existingCategory);
      (db.calendarEvent.count as any).mockResolvedValue(5); // Has events

      const request = new NextRequest('http://localhost:3000/api/calendar/categories/cat-1', {
        method: 'DELETE',
        body: JSON.stringify({}) // No replacement category
      });

      const response = await deleteCategory(request, { params: { id: 'cat-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('replacement category');
    });

    it('should delete category and reassign events when replacement provided', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-admin-id' });
      
      (db.user.findUnique as any).mockResolvedValue({
        id: 'admin-id',
        clerkId: 'clerk-admin-id',
        role: UserRole.ADMIN
      });

      const existingCategory = {
        id: 'cat-1',
        name: 'Holiday',
        color: '#EF4444',
        isActive: true,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { events: 5 }
      };

      const replacementCategory = {
        id: 'cat-2',
        name: 'School Event',
        color: '#3B82F6',
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { events: 3 }
      };

      (db.calendarEventCategory.findUnique as any)
        .mockResolvedValueOnce(existingCategory)
        .mockResolvedValueOnce(replacementCategory);
      
      (db.calendarEvent.count as any).mockResolvedValue(5);
      (db.calendarEvent.updateMany as any).mockResolvedValue({ count: 5 });
      (db.calendarEventCategory.delete as any).mockResolvedValue(existingCategory);

      const request = new NextRequest('http://localhost:3000/api/calendar/categories/cat-1', {
        method: 'DELETE',
        body: JSON.stringify({
          replacementCategoryId: 'cat-2'
        })
      });

      const response = await deleteCategory(request, { params: { id: 'cat-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Category deleted successfully');
      expect(db.calendarEvent.updateMany).toHaveBeenCalledWith({
        where: { categoryId: 'cat-1' },
        data: { categoryId: 'cat-2' }
      });
    });

    it('should delete category without reassignment if no events', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-admin-id' });
      
      (db.user.findUnique as any).mockResolvedValue({
        id: 'admin-id',
        clerkId: 'clerk-admin-id',
        role: UserRole.ADMIN
      });

      const existingCategory = {
        id: 'cat-1',
        name: 'Holiday',
        color: '#EF4444',
        isActive: true,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { events: 0 }
      };

      (db.calendarEventCategory.findUnique as any).mockResolvedValue(existingCategory);
      (db.calendarEvent.count as any).mockResolvedValue(0); // No events
      (db.calendarEventCategory.delete as any).mockResolvedValue(existingCategory);

      const request = new NextRequest('http://localhost:3000/api/calendar/categories/cat-1', {
        method: 'DELETE',
        body: JSON.stringify({})
      });

      const response = await deleteCategory(request, { params: { id: 'cat-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Category deleted successfully');
      expect(db.calendarEvent.updateMany).not.toHaveBeenCalled();
    });
  });
});
