/**
 * Session Timeout Utilities
 * 
 * Provides utilities for managing session timeouts and warnings
 * according to Requirement 6.5: 8-hour session timeout with warnings
 */

export const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
export const SESSION_WARNING_MS = 5 * 60 * 1000; // 5 minutes before expiry
export const SESSION_CHECK_INTERVAL_MS = 60 * 1000; // Check every minute

export interface SessionInfo {
  lastActivity: number;
  expiresAt: number;
  isExpired: boolean;
  timeUntilExpiry: number;
  shouldShowWarning: boolean;
}

/**
 * Gets the current session information
 */
export function getSessionInfo(): SessionInfo {
  if (typeof window === 'undefined') {
    return {
      lastActivity: Date.now(),
      expiresAt: Date.now() + SESSION_TIMEOUT_MS,
      isExpired: false,
      timeUntilExpiry: SESSION_TIMEOUT_MS,
      shouldShowWarning: false,
    };
  }

  const lastActivity = parseInt(
    localStorage.getItem('session_last_activity') || Date.now().toString()
  );
  const expiresAt = lastActivity + SESSION_TIMEOUT_MS;
  const now = Date.now();
  const timeUntilExpiry = expiresAt - now;
  const isExpired = timeUntilExpiry <= 0;
  const shouldShowWarning = timeUntilExpiry <= SESSION_WARNING_MS && timeUntilExpiry > 0;

  return {
    lastActivity,
    expiresAt,
    isExpired,
    timeUntilExpiry,
    shouldShowWarning,
  };
}

/**
 * Updates the last activity timestamp
 */
export function updateLastActivity(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('session_last_activity', Date.now().toString());
}

/**
 * Clears session data
 */
export function clearSessionData(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('session_last_activity');
}

/**
 * Formats time remaining in a human-readable format
 */
export function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) return '0 minutes';
  
  const minutes = Math.floor(milliseconds / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
  }
  
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

/**
 * Initializes session tracking
 */
export function initializeSession(): void {
  if (typeof window === 'undefined') return;
  
  // Set initial activity timestamp if not exists
  if (!localStorage.getItem('session_last_activity')) {
    updateLastActivity();
  }
  
  // Track user activity
  const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  
  activityEvents.forEach(event => {
    window.addEventListener(event, updateLastActivity, { passive: true });
  });
}

/**
 * Cleanup session tracking
 */
export function cleanupSession(): void {
  if (typeof window === 'undefined') return;
  
  const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  
  activityEvents.forEach(event => {
    window.removeEventListener(event, updateLastActivity);
  });
}
