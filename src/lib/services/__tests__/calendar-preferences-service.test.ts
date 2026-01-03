/**
 * Unit Tests for Calendar Preferences Service
 * 
 * Tests the calendar preferences service functions including:
 * - getUserCalendarPreferences
 * - updateUserCalendarPreferences
 * - validatePreferencesData
 * - resetUserCalendarPreferences
 * - getUserFilterSettings
 * - updateUserFilterSettings
 * - clearUserFilterSettings
 * 
 * Requirements: 2.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock database - must be defined before imports
vi.mock('@/lib/db', () => ({
  db: {
    userCalendarPreferences: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn()
    }
  }
}));

import {
  getUserCalendarPreferences,
  updateUserCalendarPreferences,
  validatePreferencesData,
  resetUserCalendarPreferences,
  getUserFilterSettings,
  updateUserFilterSettings,
  clearUserFilterSettings,
  PreferencesValidationError
} from '../calendar-preferences-service';
import { db } from '@/lib/db';

describe('Calendar Preferences Service', () => {
  const mockDb = db as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validatePreferencesData', () => {
    it('should accept valid defaultView values', () => {
      expect(() => validatePreferencesData({ defaultView: 'month' })).not.toThrow();
      expect(() => validatePreferencesData({ defaultView: 'week' })).not.toThrow();
      expect(() => validatePreferencesData({ defaultView: 'day' })).not.toThrow();
      expect(() => validatePreferencesData({ defaultView: 'agenda' })).not.toThrow();
    });

    it('should reject invalid defaultView values', () => {
      expect(() => validatePreferencesData({ defaultView: 'invalid' as any }))
        .toThrow(PreferencesValidationError);
      expect(() => validatePreferencesData({ defaultView: 'yearly' as any }))
        .toThrow('Invalid defaultView');
    });

    it('should accept valid defaultReminderTime values', () => {
      expect(() => validatePreferencesData({ defaultReminderTime: 0 })).not.toThrow();
      expect(() => validatePreferencesData({ defaultReminderTime: 1440 })).not.toThrow();
      expect(() => validatePreferencesData({ defaultReminderTime: 10080 })).not.toThrow();
    });

    it('should reject invalid defaultReminderTime values', () => {
      expect(() => validatePreferencesData({ defaultReminderTime: -1 }))
        .toThrow(PreferencesValidationError);
      expect(() => validatePreferencesData({ defaultReminderTime: 'invalid' as any }))
        .toThrow('Invalid defaultReminderTime');
    });

    it('should accept valid reminderTypes', () => {
      expect(() => validatePreferencesData({ reminderTypes: ['EMAIL'] })).not.toThrow();
      expect(() => validatePreferencesData({ reminderTypes: ['SMS', 'PUSH'] })).not.toThrow();
      expect(() => validatePreferencesData({ reminderTypes: ['IN_APP', 'EMAIL', 'SMS', 'PUSH'] })).not.toThrow();
    });

    it('should reject invalid reminderTypes', () => {
      expect(() => validatePreferencesData({ reminderTypes: ['INVALID'] }))
        .toThrow(PreferencesValidationError);
      expect(() => validatePreferencesData({ reminderTypes: ['EMAIL', 'INVALID'] }))
        .toThrow('Invalid reminderTypes');
    });

    it('should accept valid filterSettings', () => {
      expect(() => validatePreferencesData({
        filterSettings: {
          selectedCategories: ['cat-1', 'cat-2']
        }
      })).not.toThrow();

      expect(() => validatePreferencesData({
        filterSettings: {
          dateRange: {
            start: '2025-01-01',
            end: '2025-12-31'
          }
        }
      })).not.toThrow();

      expect(() => validatePreferencesData({
        filterSettings: {
          selectedCategories: ['cat-1'],
          dateRange: {
            start: '2025-01-01',
            end: '2025-12-31'
          }
        }
      })).not.toThrow();
    });

    it('should accept null filterSettings', () => {
      expect(() => validatePreferencesData({ filterSettings: null })).not.toThrow();
    });

    it('should reject invalid filterSettings structure', () => {
      expect(() => validatePreferencesData({ filterSettings: 'invalid' as any }))
        .toThrow(PreferencesValidationError);

      expect(() => validatePreferencesData({
        filterSettings: {
          selectedCategories: 'not-an-array' as any
        }
      })).toThrow('selectedCategories must be an array');
    });

    it('should reject invalid dateRange in filterSettings', () => {
      expect(() => validatePreferencesData({
        filterSettings: {
          dateRange: {
            start: 'invalid-date',
            end: '2025-12-31'
          }
        }
      })).toThrow('Invalid date format');

      expect(() => validatePreferencesData({
        filterSettings: {
          dateRange: {
            start: '2025-12-31',
            end: '2025-01-01'
          }
        }
      })).toThrow('dateRange end must be after start');
    });
  });

  describe('getUserCalendarPreferences', () => {
    it('should return existing preferences', async () => {
      const mockPreferences = {
        id: 'pref-id',
        userId: 'user-id',
        defaultView: 'week',
        filterSettings: null,
        defaultReminderTime: 1440,
        reminderTypes: ['IN_APP'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDb.userCalendarPreferences.findUnique.mockResolvedValue(mockPreferences);

      const result = await getUserCalendarPreferences('user-id');

      expect(result).toEqual(mockPreferences);
      expect(mockDb.userCalendarPreferences.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-id' }
      });
    });

    it('should create default preferences if none exist', async () => {
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

      mockDb.userCalendarPreferences.findUnique.mockResolvedValue(null);
      mockDb.userCalendarPreferences.create.mockResolvedValue(mockDefaultPreferences);

      const result = await getUserCalendarPreferences('user-id');

      expect(result).toEqual(mockDefaultPreferences);
      expect(mockDb.userCalendarPreferences.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-id',
          defaultView: 'month',
          filterSettings: null,
          defaultReminderTime: 1440,
          reminderTypes: ['IN_APP']
        }
      });
    });
  });

  describe('updateUserCalendarPreferences', () => {
    it('should update defaultView', async () => {
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

      mockDb.userCalendarPreferences.upsert.mockResolvedValue(mockUpdatedPreferences);

      const result = await updateUserCalendarPreferences('user-id', { defaultView: 'week' });

      expect(result.defaultView).toBe('week');
      expect(mockDb.userCalendarPreferences.upsert).toHaveBeenCalled();
    });

    it('should update filterSettings', async () => {
      const filterSettings = {
        selectedCategories: ['cat-1', 'cat-2']
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

      mockDb.userCalendarPreferences.upsert.mockResolvedValue(mockUpdatedPreferences);

      const result = await updateUserCalendarPreferences('user-id', { filterSettings });

      expect(result.filterSettings).toEqual(filterSettings);
    });

    it('should update reminder preferences', async () => {
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

      mockDb.userCalendarPreferences.upsert.mockResolvedValue(mockUpdatedPreferences);

      const result = await updateUserCalendarPreferences('user-id', {
        defaultReminderTime: 720,
        reminderTypes: ['EMAIL', 'SMS']
      });

      expect(result.defaultReminderTime).toBe(720);
      expect(result.reminderTypes).toEqual(['EMAIL', 'SMS']);
    });

    it('should throw validation error for invalid data', async () => {
      await expect(
        updateUserCalendarPreferences('user-id', { defaultView: 'invalid' as any })
      ).rejects.toThrow(PreferencesValidationError);
    });
  });

  describe('resetUserCalendarPreferences', () => {
    it('should reset preferences to defaults', async () => {
      const mockResetPreferences = {
        id: 'pref-id',
        userId: 'user-id',
        defaultView: 'month',
        filterSettings: null,
        defaultReminderTime: 1440,
        reminderTypes: ['IN_APP'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDb.userCalendarPreferences.upsert.mockResolvedValue(mockResetPreferences);

      const result = await resetUserCalendarPreferences('user-id');

      expect(result.defaultView).toBe('month');
      expect(result.filterSettings).toBeNull();
      expect(result.defaultReminderTime).toBe(1440);
      expect(result.reminderTypes).toEqual(['IN_APP']);
    });
  });

  describe('getUserFilterSettings', () => {
    it('should return filter settings if they exist', async () => {
      const filterSettings = {
        selectedCategories: ['cat-1'],
        dateRange: {
          start: '2025-01-01',
          end: '2025-12-31'
        }
      };

      const mockPreferences = {
        id: 'pref-id',
        userId: 'user-id',
        defaultView: 'month',
        filterSettings,
        defaultReminderTime: 1440,
        reminderTypes: ['IN_APP'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDb.userCalendarPreferences.findUnique.mockResolvedValue(mockPreferences);

      const result = await getUserFilterSettings('user-id');

      expect(result).toEqual(filterSettings);
    });

    it('should return null if no filter settings exist', async () => {
      const mockPreferences = {
        id: 'pref-id',
        userId: 'user-id',
        defaultView: 'month',
        filterSettings: null,
        defaultReminderTime: 1440,
        reminderTypes: ['IN_APP'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDb.userCalendarPreferences.findUnique.mockResolvedValue(mockPreferences);

      const result = await getUserFilterSettings('user-id');

      expect(result).toBeNull();
    });
  });

  describe('updateUserFilterSettings', () => {
    it('should update only filter settings', async () => {
      const filterSettings = {
        selectedCategories: ['cat-1', 'cat-2']
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

      mockDb.userCalendarPreferences.upsert.mockResolvedValue(mockUpdatedPreferences);

      const result = await updateUserFilterSettings('user-id', filterSettings);

      expect(result.filterSettings).toEqual(filterSettings);
    });
  });

  describe('clearUserFilterSettings', () => {
    it('should clear filter settings', async () => {
      const mockUpdatedPreferences = {
        id: 'pref-id',
        userId: 'user-id',
        defaultView: 'month',
        filterSettings: null,
        defaultReminderTime: 1440,
        reminderTypes: ['IN_APP'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDb.userCalendarPreferences.upsert.mockResolvedValue(mockUpdatedPreferences);

      const result = await clearUserFilterSettings('user-id');

      expect(result.filterSettings).toBeNull();
    });
  });
});
