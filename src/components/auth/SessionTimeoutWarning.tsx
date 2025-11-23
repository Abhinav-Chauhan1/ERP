'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  getSessionInfo,
  formatTimeRemaining,
  updateLastActivity,
  SESSION_CHECK_INTERVAL_MS,
} from '@/lib/utils/session-timeout';

/**
 * SessionTimeoutWarning Component
 * 
 * Displays a warning dialog when the user's session is about to expire
 * and automatically signs out when the session expires.
 * 
 * Implements Requirement 6.5: Session timeout with warning
 */
export function SessionTimeoutWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const { signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check session status periodically
    const checkSession = () => {
      const sessionInfo = getSessionInfo();
      
      if (sessionInfo.isExpired) {
        // Session expired - sign out
        handleSessionExpired();
      } else if (sessionInfo.shouldShowWarning) {
        // Show warning
        setShowWarning(true);
        setTimeRemaining(sessionInfo.timeUntilExpiry);
      } else {
        // Session is fine
        setShowWarning(false);
      }
    };

    // Initial check
    checkSession();

    // Set up interval to check session
    const intervalId = setInterval(checkSession, SESSION_CHECK_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const handleSessionExpired = async () => {
    try {
      await signOut();
      router.push('/login?session_expired=true');
    } catch (error) {
      console.error('Error signing out:', error);
      // Force redirect even if sign out fails
      router.push('/login?session_expired=true');
    }
  };

  const handleContinueSession = () => {
    // Update activity to extend session
    updateLastActivity();
    setShowWarning(false);
  };

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Expiring Soon</AlertDialogTitle>
          <AlertDialogDescription>
            Your session will expire in {formatTimeRemaining(timeRemaining)} due to inactivity.
            Click "Continue" to extend your session, or you will be automatically signed out.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleContinueSession}>
            Continue Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
