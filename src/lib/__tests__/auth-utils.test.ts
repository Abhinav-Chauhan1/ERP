/**
 * Unit Tests for Authorization Utilities
 * 
 * Tests role-based authorization and dashboard URL generation
 * Validates Requirements 7.4, 7.5, 7.8, 18.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole } from '@prisma/client';
import { getDashboardUrl } from '../auth-utils';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}));

// Mock the auth module
vi.mock('@/auth', () => ({
  auth: vi.fn()
}));

describe('Authorization Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboardUrl', () => {
    it('should return /admin for ADMIN role', () => {
      const url = getDashboardUrl(UserRole.ADMIN);
      expect(url).toBe('/admin');
    });

    it('should return /teacher for TEACHER role', () => {
      const url = getDashboardUrl(UserRole.TEACHER);
      expect(url).toBe('/teacher');
    });

    it('should return /student for STUDENT role', () => {
      const url = getDashboardUrl(UserRole.STUDENT);
      expect(url).toBe('/student');
    });

    it('should return /parent for PARENT role', () => {
      const url = getDashboardUrl(UserRole.PARENT);
      expect(url).toBe('/parent');
    });

    it('should return / for unknown role', () => {
      const url = getDashboardUrl('UNKNOWN' as UserRole);
      expect(url).toBe('/');
    });
  });

  describe('requireRole', () => {
    it('should redirect to login when no session exists', async () => {
      const { auth } = await import('@/auth');
      const { redirect } = await import('next/navigation');
      
      vi.mocked(auth).mockResolvedValue(null);

      const { requireRole } = await import('../auth-utils');
      await requireRole([UserRole.ADMIN]);

      expect(redirect).toHaveBeenCalledWith('/login');
    });

    it('should redirect to login when session has no user', async () => {
      const { auth } = await import('@/auth');
      const { redirect } = await import('next/navigation');
      
      vi.mocked(auth).mockResolvedValue({ user: null } as any);

      const { requireRole } = await import('../auth-utils');
      await requireRole([UserRole.ADMIN]);

      expect(redirect).toHaveBeenCalledWith('/login');
    });

    it('should redirect to default path when user lacks required role', async () => {
      const { auth } = await import('@/auth');
      const { redirect } = await import('next/navigation');
      
      const mockSession = {
        user: { id: 'user-123', role: UserRole.STUDENT }
      };
      
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const { requireRole } = await import('../auth-utils');
      await requireRole([UserRole.ADMIN]);

      expect(redirect).toHaveBeenCalledWith('/');
    });

    it('should redirect to custom path when user lacks required role', async () => {
      const { auth } = await import('@/auth');
      const { redirect } = await import('next/navigation');
      
      const mockSession = {
        user: { id: 'user-123', role: UserRole.STUDENT }
      };
      
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const { requireRole } = await import('../auth-utils');
      await requireRole([UserRole.ADMIN], '/student');

      expect(redirect).toHaveBeenCalledWith('/student');
    });

    it('should return user when role is allowed', async () => {
      const { auth } = await import('@/auth');
      const { redirect } = await import('next/navigation');
      
      const mockUser = { id: 'user-123', role: UserRole.ADMIN };
      const mockSession = { user: mockUser };
      
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const { requireRole } = await import('../auth-utils');
      const result = await requireRole([UserRole.ADMIN]);

      expect(redirect).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should allow user with one of multiple allowed roles', async () => {
      const { auth } = await import('@/auth');
      const { redirect } = await import('next/navigation');
      
      const mockUser = { id: 'user-123', role: UserRole.TEACHER };
      const mockSession = { user: mockUser };
      
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const { requireRole } = await import('../auth-utils');
      const result = await requireRole([UserRole.ADMIN, UserRole.TEACHER]);

      expect(redirect).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });
  });
});
