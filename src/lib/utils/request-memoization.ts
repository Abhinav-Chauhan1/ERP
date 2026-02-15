/**
 * Request-level memoization utility
 * Prevents duplicate queries within the same request cycle
 */

import { cache } from "react";

/**
 * Memoized version of getSchoolSettings for request-level caching
 * This prevents duplicate queries within the same request (e.g., layout + page)
 */
export const getSchoolSettingsRequestMemo = cache(async () => {
  const { getSchoolSettings } = await import("@/lib/utils/cached-queries");
  return getSchoolSettings();
});

// Backward compatibility alias
export const getSystemSettingsRequestMemo = getSchoolSettingsRequestMemo;

/**
 * Generic request-level memoization wrapper
 * Use this to wrap any function that should be memoized per request
 */
export function requestMemo<T extends (...args: any[]) => any>(fn: T): T {
  return cache(fn) as T;
}

/**
 * Example usage:
 * 
 * // Instead of calling getSystemSettings() directly multiple times
 * const settings1 = await getSystemSettings();
 * const settings2 = await getSystemSettings(); // This would make another DB query
 * 
 * // Use the memoized version
 * const settings1 = await getSystemSettingsRequestMemo();
 * const settings2 = await getSystemSettingsRequestMemo(); // This reuses the first result
 */