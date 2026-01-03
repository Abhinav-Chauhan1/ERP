'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { SessionTimeoutWarning } from './SessionTimeoutWarning';
import {
  initializeSession,
  cleanupSession,
  clearSessionData,
} from '@/lib/utils/session-timeout';

/**
 * SessionManager Component
 * 
 * Manages session lifecycle including:
 * - Initializing session tracking
 * - Monitoring user activity
 * - Displaying timeout warnings
 * - Cleaning up on sign out
 * 
 * Implements Requirement 6.5: 8-hour session timeout with automatic termination
 */
export function SessionManager() {
  const { data: session, status } = useSession();
  const isSignedIn = status === 'authenticated';

  useEffect(() => {
    if (isSignedIn) {
      // Initialize session tracking when user signs in
      initializeSession();

      return () => {
        // Cleanup when component unmounts
        cleanupSession();
      };
    } else {
      // Clear session data when user signs out
      clearSessionData();
    }
  }, [isSignedIn]);

  // Only show warning if user is signed in
  if (!isSignedIn) {
    return null;
  }

  return <SessionTimeoutWarning />;
}
