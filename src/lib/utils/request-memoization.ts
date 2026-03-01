/**
 * Request-level memoization utility
 * Prevents duplicate queries within the same request cycle
 */

import { cache } from "react";

/**
 * Memoized version of getSchoolSettings for request-level caching
 * This prevents duplicate queries within the same request (e.g., layout + page)
 * 
 * Resolves schoolId from auth context OUTSIDE the cache scope to avoid
 * calling headers() inside unstable_cache().
 */
export const getSchoolSettingsRequestMemo = cache(async () => {
  const { getCurrentSchoolId } = await import("@/lib/auth/tenant");
  const { getSchoolSettings } = await import("@/lib/utils/cached-queries");

  const schoolId = await getCurrentSchoolId();

  if (!schoolId) {
    // No auth context (e.g., public/unauthenticated pages) — return null
    return null;
  }

  return getSchoolSettings(schoolId);
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