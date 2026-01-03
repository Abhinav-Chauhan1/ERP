/**
 * Unit Tests for Authentication Utilities
 * 
 * Tests role checking and user profile retrieval functions
 * Validates Requirements 9.3, 9.4, 9.5, 9.7, 18.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole } from '@prisma/client';
import {
  getCurrentUserDetails,
  getUserRole,
  isAdmin,
  isTeacher,
  isStudent,
  isParent,
  hasRole,
  getCurrentUserProfile
} from '../auth';

// Mock the auth module
vi.mock('@/auth', () => ({
  auth: vi.fn()
}));

// Mock the database
vi.mock('../db', () => ({
  db: {
    user: {
      findUnique: vi.fn()
    }
  }
}));

describe('Authentication Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentUserDetails', () => {
    it('should return null when no session exists', async () => {
      const { auth } = await import('@/auth');
      vi.mocked(auth).mockResolvedValue(null);

      const result = await getCurrentUserDetails();
      expect(result).toBeNull();
    });

    it('should return null when session has no user', async () => {
      const { auth } = await import('@/auth');
      vi.mocked(auth).mockResolvedValue({ user: null } as any);

      const result = await getCurrentUserDetails();
      expect(result).toBeNull();
    });

    it('should return user details when authenticated', async () => {
      const { auth } = await import('@/auth');
      const { db } = await import('../db');
      
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com', role: UserRole.STUDENT }
      };
      
      const mockDbUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.STUDENT,
        teacher: null,
        student: { id: 'student-123' },
        parent: null,
        administrator: null
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(db.user.findUnique).mockResolvedValue(mockDbUser as any);

      const result = await getCurrentUserDetails();
      
      expect(result).not.toBeNull();
      expect(result?.session).toEqual(mockSession);
      expect(result?.dbUser).toEqual(mockDbUser);
    });

    it('should handle database errors gracefully', async () => {
      const { auth } = await import('@/auth');
      const { db } = await import('../db');
      
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com', role: UserRole.STUDENT }
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(db.user.findUnique).mockRejectedValue(new Error('Database error'));

      const result = await getCurrentUserDetails();
      expect(result).toBeNull();
    });
  });

  describe('getUserRole', () => {
    it('should return null when no user is authenticated', async () => {
      const { auth } = await import('@/auth');
      vi.mocked(auth).mockResolvedValue(null);

      const role = await getUserRole();
      expect(role).toBeNull();
    });

    it('should return user role when authenticated', async () => {
      const { auth } = await import('@/auth');
      const { db } = await import('../db');
      
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com', role: UserRole.ADMIN }
      };
      
      const mockDbUser = {
        id: 'user-123',
        role: UserRole.ADMIN
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(db.user.findUnique).mockResolvedValue(mockDbUser as any);

      const role = await getUserRole();
      expect(role).toBe(UserRole.ADMIN);
    });
  });

  describe('Role Checking Functions', () => {
    it('isAdmin should return true for admin user', async () => {
      const { auth } = await import('@/auth');
      const { db } = await import('../db');
      
      const mockSession = {
        user: { id: 'user-123', role: UserRole.ADMIN }
      };
      
      const mockDbUser = {
        id: 'user-123',
        role: UserRole.ADMIN
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(db.user.findUnique).mockResolvedValue(mockDbUser as any);

      const result = await isAdmin();
      expect(result).toBe(true);
    });

    it('isAdmin should return false for non-admin user', async () => {
      const { auth } = await import('@/auth');
      const { db } = await import('../db');
      
      const mockSession = {
        user: { id: 'user-123', role: UserRole.STUDENT }
      };
      
      const mockDbUser = {
        id: 'user-123',
        role: UserRole.STUDENT
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(db.user.findUnique).mockResolvedValue(mockDbUser as any);

      const result = await isAdmin();
      expect(result).toBe(false);
    });

    it('isTeacher should return true for teacher user', async () => {
      const { auth } = await import('@/auth');
      const { db } = await import('../db');
      
      const mockSession = {
        user: { id: 'user-123', role: UserRole.TEACHER }
      };
      
      const mockDbUser = {
        id: 'user-123',
        role: UserRole.TEACHER
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(db.user.findUnique).mockResolvedValue(mockDbUser as any);

      const result = await isTeacher();
      expect(result).toBe(true);
    });

    it('isStudent should return true for student user', async () => {
      const { auth } = await import('@/auth');
      const { db } = await import('../db');
      
      const mockSession = {
        user: { id: 'user-123', role: UserRole.STUDENT }
      };
      
      const mockDbUser = {
        id: 'user-123',
        role: UserRole.STUDENT
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(db.user.findUnique).mockResolvedValue(mockDbUser as any);

      const result = await isStudent();
      expect(result).toBe(true);
    });

    it('isParent should return true for parent user', async () => {
      const { auth } = await import('@/auth');
      const { db } = await import('../db');
      
      const mockSession = {
        user: { id: 'user-123', role: UserRole.PARENT }
      };
      
      const mockDbUser = {
        id: 'user-123',
        role: UserRole.PARENT
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(db.user.findUnique).mockResolvedValue(mockDbUser as any);

      const result = await isParent();
      expect(result).toBe(true);
    });

    it('hasRole should correctly check for specific role', async () => {
      const { auth } = await import('@/auth');
      const { db } = await import('../db');
      
      const mockSession = {
        user: { id: 'user-123', role: UserRole.TEACHER }
      };
      
      const mockDbUser = {
        id: 'user-123',
        role: UserRole.TEACHER
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(db.user.findUnique).mockResolvedValue(mockDbUser as any);

      const isTeacherRole = await hasRole(UserRole.TEACHER);
      const isAdminRole = await hasRole(UserRole.ADMIN);
      
      expect(isTeacherRole).toBe(true);
      expect(isAdminRole).toBe(false);
    });
  });

  describe('getCurrentUserProfile', () => {
    it('should return admin profile for admin user', async () => {
      const { auth } = await import('@/auth');
      const { db } = await import('../db');
      
      const mockAdminProfile = { id: 'admin-123', userId: 'user-123' };
      const mockSession = {
        user: { id: 'user-123', role: UserRole.ADMIN }
      };
      
      const mockDbUser = {
        id: 'user-123',
        role: UserRole.ADMIN,
        administrator: mockAdminProfile,
        teacher: null,
        student: null,
        parent: null
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(db.user.findUnique).mockResolvedValue(mockDbUser as any);

      const profile = await getCurrentUserProfile();
      expect(profile).toEqual(mockAdminProfile);
    });

    it('should return teacher profile for teacher user', async () => {
      const { auth } = await import('@/auth');
      const { db } = await import('../db');
      
      const mockTeacherProfile = { id: 'teacher-123', userId: 'user-123' };
      const mockSession = {
        user: { id: 'user-123', role: UserRole.TEACHER }
      };
      
      const mockDbUser = {
        id: 'user-123',
        role: UserRole.TEACHER,
        administrator: null,
        teacher: mockTeacherProfile,
        student: null,
        parent: null
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(db.user.findUnique).mockResolvedValue(mockDbUser as any);

      const profile = await getCurrentUserProfile();
      expect(profile).toEqual(mockTeacherProfile);
    });

    it('should return student profile for student user', async () => {
      const { auth } = await import('@/auth');
      const { db } = await import('../db');
      
      const mockStudentProfile = { id: 'student-123', userId: 'user-123' };
      const mockSession = {
        user: { id: 'user-123', role: UserRole.STUDENT }
      };
      
      const mockDbUser = {
        id: 'user-123',
        role: UserRole.STUDENT,
        administrator: null,
        teacher: null,
        student: mockStudentProfile,
        parent: null
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(db.user.findUnique).mockResolvedValue(mockDbUser as any);

      const profile = await getCurrentUserProfile();
      expect(profile).toEqual(mockStudentProfile);
    });

    it('should return parent profile for parent user', async () => {
      const { auth } = await import('@/auth');
      const { db } = await import('../db');
      
      const mockParentProfile = { id: 'parent-123', userId: 'user-123' };
      const mockSession = {
        user: { id: 'user-123', role: UserRole.PARENT }
      };
      
      const mockDbUser = {
        id: 'user-123',
        role: UserRole.PARENT,
        administrator: null,
        teacher: null,
        student: null,
        parent: mockParentProfile
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(db.user.findUnique).mockResolvedValue(mockDbUser as any);

      const profile = await getCurrentUserProfile();
      expect(profile).toEqual(mockParentProfile);
    });

    it('should return null when no user is authenticated', async () => {
      const { auth } = await import('@/auth');
      vi.mocked(auth).mockResolvedValue(null);

      const profile = await getCurrentUserProfile();
      expect(profile).toBeNull();
    });
  });
});
