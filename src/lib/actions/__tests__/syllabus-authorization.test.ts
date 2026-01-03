/**
 * Authorization tests for Enhanced Syllabus System
 * Tests role-based access control for all syllabus operations
 * 
 * Requirements: All (Authorization checks for all operations)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole } from '@prisma/client';

// Mock the auth module
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findFirst: vi.fn(),
    },
  },
}));

import { auth } from "@/auth";
import { db } from '@/lib/db';
import {
  getCurrentUser,
  requireAdmin,
  requireTeacher,
  requireStudent,
  requireAdminOrTeacher,
  requireViewAccess,
  requireModifyAccess,
  requireProgressTrackingAccess,
  verifyTeacherOwnership,
} from '@/lib/utils/syllabus-authorization';

describe('Syllabus Authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should return unauthorized when user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const result = await getCurrentUser();

      expect(result.authorized).toBe(false);
      expect(result.error).toBe('Authentication required');
      expect(result.code).toBe('UNAUTHENTICATED');
    });

    it('should return unauthorized when user is not found in database', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(null);

      const result = await getCurrentUser();

      expect(result.authorized).toBe(false);
      expect(result.error).toBe('User not found in database');
      expect(result.code).toBe('USER_NOT_FOUND');
    });

    it('should return authorized with user data when user exists', async () => {
      const mockUser = {
        id: 'user-123',
        clerkId: 'clerk-123',
        role: UserRole.ADMIN,
        email: 'admin@example.com',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await getCurrentUser();

      expect(result.authorized).toBe(true);
      expect(result.user).toEqual(mockUser);
    });
  });

  describe('requireAdmin', () => {
    it('should authorize admin users', async () => {
      const mockUser = {
        id: 'user-123',
        role: UserRole.ADMIN,
        email: 'admin@example.com',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await requireAdmin();

      expect(result.authorized).toBe(true);
      expect(result.user?.role).toBe(UserRole.ADMIN);
    });

    it('should reject teacher users', async () => {
      const mockUser = {
        id: 'user-123',
        role: UserRole.TEACHER,
        email: 'teacher@example.com',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await requireAdmin();

      expect(result.authorized).toBe(false);
      expect(result.error).toBe('Admin access required');
      expect(result.code).toBe('FORBIDDEN');
    });

    it('should reject student users', async () => {
      const mockUser = {
        id: 'user-123',
        role: UserRole.STUDENT,
        email: 'student@example.com',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await requireAdmin();

      expect(result.authorized).toBe(false);
      expect(result.error).toBe('Admin access required');
    });
  });

  describe('requireTeacher', () => {
    it('should authorize teacher users', async () => {
      const mockUser = {
        id: 'user-123',
        role: UserRole.TEACHER,
        email: 'teacher@example.com',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await requireTeacher();

      expect(result.authorized).toBe(true);
      expect(result.user?.role).toBe(UserRole.TEACHER);
    });

    it('should reject admin users', async () => {
      const mockUser = {
        id: 'user-123',
        role: UserRole.ADMIN,
        email: 'admin@example.com',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await requireTeacher();

      expect(result.authorized).toBe(false);
      expect(result.error).toBe('Teacher access required');
    });

    it('should reject student users', async () => {
      const mockUser = {
        id: 'user-123',
        role: UserRole.STUDENT,
        email: 'student@example.com',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await requireTeacher();

      expect(result.authorized).toBe(false);
      expect(result.error).toBe('Teacher access required');
    });
  });

  describe('requireStudent', () => {
    it('should authorize student users', async () => {
      const mockUser = {
        id: 'user-123',
        role: UserRole.STUDENT,
        email: 'student@example.com',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await requireStudent();

      expect(result.authorized).toBe(true);
      expect(result.user?.role).toBe(UserRole.STUDENT);
    });

    it('should reject admin users', async () => {
      const mockUser = {
        id: 'user-123',
        role: UserRole.ADMIN,
        email: 'admin@example.com',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await requireStudent();

      expect(result.authorized).toBe(false);
      expect(result.error).toBe('Student access required');
    });

    it('should reject teacher users', async () => {
      const mockUser = {
        id: 'user-123',
        role: UserRole.TEACHER,
        email: 'teacher@example.com',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await requireStudent();

      expect(result.authorized).toBe(false);
      expect(result.error).toBe('Student access required');
    });
  });

  describe('requireAdminOrTeacher', () => {
    it('should authorize admin users', async () => {
      const mockUser = {
        id: 'user-123',
        role: UserRole.ADMIN,
        email: 'admin@example.com',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await requireAdminOrTeacher();

      expect(result.authorized).toBe(true);
    });

    it('should authorize teacher users', async () => {
      const mockUser = {
        id: 'user-123',
        role: UserRole.TEACHER,
        email: 'teacher@example.com',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await requireAdminOrTeacher();

      expect(result.authorized).toBe(true);
    });

    it('should reject student users', async () => {
      const mockUser = {
        id: 'user-123',
        role: UserRole.STUDENT,
        email: 'student@example.com',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await requireAdminOrTeacher();

      expect(result.authorized).toBe(false);
      expect(result.error).toBe('Admin or Teacher access required');
    });
  });

  describe('requireViewAccess', () => {
    it('should authorize admin users', async () => {
      const mockUser = {
        id: 'user-123',
        role: UserRole.ADMIN,
        email: 'admin@example.com',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await requireViewAccess();

      expect(result.authorized).toBe(true);
    });

    it('should authorize teacher users', async () => {
      const mockUser = {
        id: 'user-123',
        role: UserRole.TEACHER,
        email: 'teacher@example.com',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await requireViewAccess();

      expect(result.authorized).toBe(true);
    });

    it('should authorize student users', async () => {
      const mockUser = {
        id: 'user-123',
        role: UserRole.STUDENT,
        email: 'student@example.com',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await requireViewAccess();

      expect(result.authorized).toBe(true);
    });

    it('should reject parent users', async () => {
      const mockUser = {
        id: 'user-123',
        clerkId: 'clerk-123',
        role: UserRole.PARENT,
        email: 'parent@example.com',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await requireViewAccess();

      expect(result.authorized).toBe(false);
      expect(result.error).toBe('Access denied');
    });
  });

  describe('requireModifyAccess', () => {
    it('should authorize admin users', async () => {
      const mockUser = {
        id: 'user-123',
        role: UserRole.ADMIN,
        email: 'admin@example.com',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await requireModifyAccess();

      expect(result.authorized).toBe(true);
    });

    it('should reject teacher users', async () => {
      const mockUser = {
        id: 'user-123',
        role: UserRole.TEACHER,
        email: 'teacher@example.com',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await requireModifyAccess();

      expect(result.authorized).toBe(false);
      expect(result.error).toBe('Admin access required');
    });

    it('should reject student users', async () => {
      const mockUser = {
        id: 'user-123',
        role: UserRole.STUDENT,
        email: 'student@example.com',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await requireModifyAccess();

      expect(result.authorized).toBe(false);
    });
  });

  describe('requireProgressTrackingAccess', () => {
    it('should authorize teacher users', async () => {
      const mockUser = {
        id: 'user-123',
        role: UserRole.TEACHER,
        email: 'teacher@example.com',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await requireProgressTrackingAccess();

      expect(result.authorized).toBe(true);
    });

    it('should reject admin users', async () => {
      const mockUser = {
        id: 'user-123',
        role: UserRole.ADMIN,
        email: 'admin@example.com',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await requireProgressTrackingAccess();

      expect(result.authorized).toBe(false);
      expect(result.error).toBe('Teacher access required');
    });

    it('should reject student users', async () => {
      const mockUser = {
        id: 'user-123',
        role: UserRole.STUDENT,
        email: 'student@example.com',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await requireProgressTrackingAccess();

      expect(result.authorized).toBe(false);
    });
  });

  describe('verifyTeacherOwnership', () => {
    it('should authorize teacher accessing their own progress', async () => {
      const mockUser = {
        id: 'teacher-123',
        clerkId: 'clerk-123',
        role: UserRole.TEACHER,
        email: 'teacher@example.com',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await verifyTeacherOwnership('teacher-123');

      expect(result.authorized).toBe(true);
    });

    it('should reject teacher accessing another teacher\'s progress', async () => {
      const mockUser = {
        id: 'teacher-123',
        clerkId: 'clerk-123',
        role: UserRole.TEACHER,
        email: 'teacher@example.com',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await verifyTeacherOwnership('teacher-456');

      expect(result.authorized).toBe(false);
      expect(result.error).toBe('Cannot access another teacher\'s progress');
      expect(result.code).toBe('FORBIDDEN');
    });

    it('should reject non-teacher users', async () => {
      const mockUser = {
        id: 'admin-123',
        role: UserRole.ADMIN,
        email: 'admin@example.com',
      };

      vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as any);
      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await verifyTeacherOwnership('admin-123');

      expect(result.authorized).toBe(false);
      expect(result.error).toBe('Teacher access required');
    });
  });
});
