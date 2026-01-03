/**
 * Calendar Preferences Service
 * 
 * Provides business logic for managing user calendar preferences
 * including view settings, filter preferences, and reminder settings.
 * 
 * Requirements: 2.5
 */

import { UserCalendarPreferences, Prisma } from '@prisma/client';
import { db } from '@/lib/db';

// Types for preference management
export interface CalendarPreferencesInput {
  defaultView?: 'month' | 'week' | 'day' | 'agenda';
  filterSettings?: {
    selectedCategories?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
  } | null;
  defaultReminderTime?: number;
  reminderTypes?: string[];
}

export interface CalendarFilterSettings {
  selectedCategories?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

// Validation errors
export class PreferencesValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PreferencesValidationError';
  }
}

/**
 * Validates calendar preferences data
 * Requirement 2.5: Validate preference data before storage
 */
export function validatePreferencesData(data: CalendarPreferencesInput): void {
  // Validate defaultView
  if (data.defaultView && !['month', 'week', 'day', 'agenda'].includes(data.defaultView)) {
    throw new PreferencesValidationError(
      'Invalid defaultView. Must be one of: month, week, day, agenda'
    );
  }

  // Validate defaultReminderTime
  if (data.defaultReminderTime !== undefined) {
    if (typeof data.defaultReminderTime !== 'number' || data.defaultReminderTime < 0) {
      throw new PreferencesValidationError(
        'Invalid defaultReminderTime. Must be a non-negative number'
      );
    }
  }

  // Validate reminderTypes
  if (data.reminderTypes) {
    const validReminderTypes = ['EMAIL', 'SMS', 'PUSH', 'IN_APP'];
    const invalidTypes = data.reminderTypes.filter(type => !validReminderTypes.includes(type));

    if (invalidTypes.length > 0) {
      throw new PreferencesValidationError(
        `Invalid reminderTypes: ${invalidTypes.join(', ')}. Must be one of: ${validReminderTypes.join(', ')}`
      );
    }
  }

  // Validate filterSettings structure if provided
  if (data.filterSettings !== undefined && data.filterSettings !== null) {
    if (typeof data.filterSettings !== 'object') {
      throw new PreferencesValidationError('filterSettings must be an object or null');
    }

    // Validate selectedCategories if present
    if (data.filterSettings.selectedCategories !== undefined) {
      if (!Array.isArray(data.filterSettings.selectedCategories)) {
        throw new PreferencesValidationError('selectedCategories must be an array');
      }
    }

    // Validate dateRange if present
    if (data.filterSettings.dateRange !== undefined) {
      if (typeof data.filterSettings.dateRange !== 'object' ||
        !data.filterSettings.dateRange.start ||
        !data.filterSettings.dateRange.end) {
        throw new PreferencesValidationError(
          'dateRange must be an object with start and end properties'
        );
      }

      // Validate date strings
      const startDate = new Date(data.filterSettings.dateRange.start);
      const endDate = new Date(data.filterSettings.dateRange.end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new PreferencesValidationError('Invalid date format in dateRange');
      }

      if (endDate < startDate) {
        throw new PreferencesValidationError('dateRange end must be after start');
      }
    }
  }
}

/**
 * Gets user calendar preferences
 * Creates default preferences if none exist
 * 
 * Requirement 2.5: Retrieve user preferences for calendar view and filters
 */
export async function getUserCalendarPreferences(
  userId: string
): Promise<UserCalendarPreferences> {
  // Try to get existing preferences
  let preferences = await db.userCalendarPreferences.findUnique({
    where: { userId }
  });

  // Create default preferences if they don't exist
  if (!preferences) {
    preferences = await db.userCalendarPreferences.create({
      data: {
        userId,
        defaultView: 'month',
        filterSettings: Prisma.DbNull,
        defaultReminderTime: 1440, // 1 day in minutes
        reminderTypes: ['IN_APP']
      }
    });
  }

  return preferences;
}

/**
 * Updates user calendar preferences
 * 
 * Requirement 2.5: Store and persist user preferences for calendar view and filters
 */
export async function updateUserCalendarPreferences(
  userId: string,
  data: CalendarPreferencesInput
): Promise<UserCalendarPreferences> {
  // Validate input data
  validatePreferencesData(data);

  // Build update data
  const updateData: any = {};

  if (data.defaultView !== undefined) {
    updateData.defaultView = data.defaultView;
  }

  if (data.filterSettings !== undefined) {
    updateData.filterSettings = data.filterSettings;
  }

  if (data.defaultReminderTime !== undefined) {
    updateData.defaultReminderTime = data.defaultReminderTime;
  }

  if (data.reminderTypes !== undefined) {
    updateData.reminderTypes = data.reminderTypes;
  }

  // Update or create preferences
  const preferences = await db.userCalendarPreferences.upsert({
    where: { userId },
    update: updateData,
    create: {
      userId,
      defaultView: data.defaultView || 'month',
      filterSettings: data.filterSettings || Prisma.DbNull,
      defaultReminderTime: data.defaultReminderTime || 1440,
      reminderTypes: data.reminderTypes || ['IN_APP']
    }
  });

  return preferences;
}

/**
 * Resets user calendar preferences to defaults
 * 
 * Requirement 2.5: Allow users to reset preferences to default values
 */
export async function resetUserCalendarPreferences(
  userId: string
): Promise<UserCalendarPreferences> {
  const preferences = await db.userCalendarPreferences.upsert({
    where: { userId },
    update: {
      defaultView: 'month',
      filterSettings: Prisma.DbNull,
      defaultReminderTime: 1440,
      reminderTypes: ['IN_APP']
    },
    create: {
      userId,
      defaultView: 'month',
      filterSettings: Prisma.DbNull,
      defaultReminderTime: 1440,
      reminderTypes: ['IN_APP']
    }
  });

  return preferences;
}

/**
 * Deletes user calendar preferences
 * 
 * Requirement 2.5: Allow cleanup of user preferences
 */
export async function deleteUserCalendarPreferences(
  userId: string
): Promise<void> {
  await db.userCalendarPreferences.delete({
    where: { userId }
  });
}

/**
 * Gets filter settings from user preferences
 * Returns null if no filter settings are stored
 * 
 * Requirement 2.5: Retrieve stored filter settings
 */
export async function getUserFilterSettings(
  userId: string
): Promise<CalendarFilterSettings | null> {
  const preferences = await getUserCalendarPreferences(userId);

  if (!preferences.filterSettings) {
    return null;
  }

  return preferences.filterSettings as CalendarFilterSettings;
}

/**
 * Updates only the filter settings for a user
 * 
 * Requirement 2.5: Update filter settings independently
 */
export async function updateUserFilterSettings(
  userId: string,
  filterSettings: CalendarFilterSettings | null
): Promise<UserCalendarPreferences> {
  return updateUserCalendarPreferences(userId, { filterSettings });
}

/**
 * Clears filter settings for a user
 * 
 * Requirement 2.5: Allow users to clear their filter settings
 */
export async function clearUserFilterSettings(
  userId: string
): Promise<UserCalendarPreferences> {
  return updateUserCalendarPreferences(userId, { filterSettings: null });
}
