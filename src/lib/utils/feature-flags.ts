/**
 * Feature Flags Utility
 * Centralized feature flag management for gradual rollout
 */

/**
 * Check if the enhanced syllabus system (module-based) is enabled
 * @returns true if enhanced syllabus is enabled, false for legacy structure
 */
export function useEnhancedSyllabus(): boolean {
  return process.env.NEXT_PUBLIC_USE_ENHANCED_SYLLABUS === 'true';
}

/**
 * Server-side helper to check if enhanced syllabus is enabled
 * Avoids linting errors associated with "use" prefix
 */
export function isEnhancedSyllabusEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_ENHANCED_SYLLABUS === 'true';
}

/**
 * Client-side hook to check if enhanced syllabus is enabled
 * Use this in client components
 */
export function useEnhancedSyllabusClient(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return process.env.NEXT_PUBLIC_USE_ENHANCED_SYLLABUS === 'true';
}
