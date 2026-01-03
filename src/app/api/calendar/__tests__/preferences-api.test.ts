/**
 * Integration Tests for Calendar Preferences API
 * 
 * Tests the calendar preferences API endpoints including:
 * - GET /api/calendar/preferences (retrieve preferences)
 * - PUT /api/calendar/preferences (update preferences)
 * - PATCH /api/calendar/preferences (partial update)
 * 
 * Requirements: 2.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Clerk authentication
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn()
}));

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn()
    },
    userCalendarPreferences: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn()
    }
  }
}));

// Mock calendar preferences service
vi.mock('@/lib/services/calendar-preferences-service', () => ({
  getUserCalendarPreferences: vi.fn(),
  updateUserCalendarPreferences: vi.fn(),
  PreferencesValidationError: class PreferencesValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'PreferencesValidationError';
    }
  }
}));

import { GET, PUT, PATCH } from '../preferences/route';
import { auth } from "@/auth";
import { db } from '@/lib/db';
import {
  getUserCalendarPreferences,
  updateUserCalendarPreferences,
  PreferencesValidationError
} from '@/lib/services/calendar-preferences-service';

const mockAuth = auth as any;
const mockDb = db as any;
const mockGetUserCalendarPreferences = getUserCalendarPreferences as any;
const mockUpdateUserCalendarPreferences = updateUserCalendarPreferences as any;

describe('Calendar Preferences API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/calendar/preferences', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockReturnValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/calendar/preferences');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 if user is not found', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-user-id' });
      mockDb.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/calendar/preferences');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('should return existing preferences for authenticated user', async () => {
      const mockUser = {
        id: 'user-id',
        clerkId: 'clerk-user-id',
        role: 'TEACHER'
      };

      const mockPreferences = {
        id: 'pref-id',
        userId: 'user-id',
        defaultView: 'week',
        filterSettings: { selectedCategories: ['cat-1'] },
        defaultReminderTime: 720,
        reminderTypes: ['EMAIL', 'IN_APP'],
        createdAt: new Date('2025-12-25T06:40:01.476Z'),
        updatedAt: new Date('2025-12-25T06:40:01.476Z')
      };

      mockAuth.mockReturnValue({ userId: 'clerk-user-id' });
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockGetUserCalendarPreferences.mockResolvedValue(mockPreferences);

      const request = new NextRequest('http://localhost:3000/api/calendar/preferences');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.preferences.defaultView).toBe('week');
      expect(data.preferences.defaultReminderTime).toBe(720);
      expect(mockGetUserCalendarPreferences).toHaveBeenCalledWith('user-id');
    });

    it('should create default preferences if none exist', async () => {
      const mockUser = {
        id: 'user-id',
        clerkId: 'clerk-user-id',
        role: 'STUDENT'
      };

      const mockDefaultPreferences = {
        id: 'pref-id',
        userId: 'user-id',
        defaultView: 'month',
        filterSettings: null,
        defaultReminderTime: 1440,
        reminderTypes: ['IN_APP'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockAuth.mockReturnValue({ userId: 'clerk-user-id' });
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockGetUserCalendarPreferences.mockResolvedValue(mockDefaultPreferences);

      const request = new NextRequest('http://localhost:3000/api/calendar/preferences');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.preferences.defaultView).toBe('month');
      expect(data.preferences.defaultReminderTime).toBe(1440);
    });
  });

  describe('PUT /api/calendar/preferences', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockReturnValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/calendar/preferences', {
        method: 'PUT',
        body: JSON.stringify({ defaultView: 'week' })
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 if user is not found', async () => {
      mockAuth.mockReturnValue({ userId: 'clerk-user-id' });
      mockDb.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/calendar/preferences', {
        method: 'PUT',
        body: JSON.stringify({ defaultView: 'week' })
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('should update calendar view preference', async () => {
      const mockUser = {
        id: 'user-id',
        clerkId: 'clerk-user-id',
        role: 'TEACHER'
      };

      const mockUpdatedPreferences = {
        id: 'pref-id',
        userId: 'user-id',
        defaultView: 'week',
        filterSettings: null,
        defaultReminderTime: 1440,
        reminderTypes: ['IN_APP'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockAuth.mockReturnValue({ userId: 'clerk-user-id' });
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockUpdateUserCalendarPreferences.mockResolvedValue(mockUpdatedPreferences);

      const request = new NextRequest('http://localhost:3000/api/calendar/preferences', {
        method: 'PUT',
        body: JSON.stringify({ defaultView: 'week' })
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.preferences.defaultView).toBe('week');
      expect(mockUpdateUserCalendarPreferences).toHaveBeenCalledWith('user-id', { defaultView: 'week' });
    });

    it('should update filter settings', async () => {
      const mockUser = {
        id: 'user-id',
        clerkId: 'clerk-user-id',
        role: 'STUDENT'
      };

      const filterSettings = {
        selectedCategories: ['cat-1', 'cat-2'],
        dateRange: {
          start: '2025-01-01',
          end: '2025-12-31'
        }
      };

      const mockUpdatedPreferences = {
        id: 'pref-id',
        userId: 'user-id',
        defaultView: 'month',
        filterSettings,
        defaultReminderTime: 1440,
        reminderTypes: ['IN_APP'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockAuth.mockReturnValue({ userId: 'clerk-user-id' });
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockUpdateUserCalendarPreferences.mockResolvedValue(mockUpdatedPreferences);

      const request = new NextRequest('http://localhost:3000/api/calendar/preferences', {
        method: 'PUT',
        body: JSON.stringify({ filterSettings })
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.preferences.filterSettings).toEqual(filterSettings);
    });

    it('should update reminder preferences', async () => {
      const mockUser = {
        id: 'user-id',
        clerkId: 'clerk-user-id',
        role: 'PARENT'
      };

      const mockUpdatedPreferences = {
        id: 'pref-id',
        userId: 'user-id',
        defaultView: 'month',
        filterSettings: null,
        defaultReminderTime: 720,
        reminderTypes: ['EMAIL', 'SMS'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockAuth.mockReturnValue({ userId: 'clerk-user-id' });
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockUpdateUserCalendarPreferences.mockResolvedValue(mockUpdatedPreferences);

      const request = new NextRequest('http://localhost:3000/api/calendar/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          defaultReminderTime: 720,
          reminderTypes: ['EMAIL', 'SMS']
        })
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.preferences.defaultReminderTime).toBe(720);
      expect(data.preferences.reminderTypes).toEqual(['EMAIL', 'SMS']);
    });

    it('should return 400 for invalid preference data', async () => {
      const mockUser = {
        id: 'user-id',
        clerkId: 'clerk-user-id',
        role: 'TEACHER'
      };

      mockAuth.mockReturnValue({ userId: 'clerk-user-id' });
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      
      const PreferencesValidationErrorClass = PreferencesValidationError;
      mockUpdateUserCalendarPreferences.mockRejectedValue(
        new PreferencesValidationErrorClass('Invalid defaultView')
      );

      const request = new NextRequest('http://localhost:3000/api/calendar/preferences', {
        method: 'PUT',
        body: JSON.stringify({ defaultView: 'invalid' })
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid defaultView');
    });
  });

  describe('PATCH /api/calendar/preferences', () => {
    it('should partially update preferences', async () => {
      const mockUser = {
        id: 'user-id',
        clerkId: 'clerk-user-id',
        role: 'ADMIN'
      };

      const mockUpdatedPreferences = {
        id: 'pref-id',
        userId: 'user-id',
        defaultView: 'agenda',
        filterSettings: null,
        defaultReminderTime: 1440,
        reminderTypes: ['IN_APP'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockAuth.mockReturnValue({ userId: 'clerk-user-id' });
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockUpdateUserCalendarPreferences.mockResolvedValue(mockUpdatedPreferences);

      const request = new NextRequest('http://localhost:3000/api/calendar/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ defaultView: 'agenda' })
      });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.preferences.defaultView).toBe('agenda');
    });
  });
});
