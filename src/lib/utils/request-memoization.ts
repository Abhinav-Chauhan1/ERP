/**
 * Request-level memoization utility
 * Prevents duplicate queries within the same request cycle
 */

import { cache } from "react";

/** Narrow type — only the fields consumed by the root layout and branding context. */
export type BrandingSettings = {
  id: string;
  schoolId: string;
  schoolName: string;
  tagline: string | null;
  schoolLogo: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  defaultTheme: string | null;
  defaultColorTheme: string | null;
};

/**
 * Memoized version of getSchoolSettings for request-level caching.
 * Selects only the fields needed by layout + branding — avoiding a 100-column SELECT * on every page.
 * React.cache() deduplicates within the same render tree (layout + page).
 */
export const getSchoolSettingsRequestMemo = cache(async (): Promise<BrandingSettings | null> => {
  const { getCurrentSchoolId } = await import("@/lib/auth/tenant");
  const { runWithTenantContext } = await import("@/lib/tenant-context");
  const { db } = await import("@/lib/db");

  const schoolId = await getCurrentSchoolId();

  if (!schoolId) {
    return null;
  }

  return runWithTenantContext({ schoolId, isSuperAdmin: false }, () =>
    db.schoolSettings.findUnique({
      where: { schoolId },
      select: {
        id: true,
        schoolId: true,
        schoolName: true,
        tagline: true,
        schoolLogo: true,
        logoUrl: true,
        faviconUrl: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        defaultTheme: true,
        defaultColorTheme: true,
      },
    })
  );
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