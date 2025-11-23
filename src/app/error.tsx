'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Global Error Page
 * Catches errors at the root level of the application
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Global application error:', error);

    // Log to monitoring service with full context
    if (typeof window !== 'undefined') {
      const errorContext = {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          digest: error.digest,
        },
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      };

      console.error('Error context for monitoring:', errorContext);

      // TODO: Uncomment when Sentry is configured
      // if (window.Sentry) {
      //   window.Sentry.captureException(error, {
      //     extra: errorContext,
      //   });
      // }
    }
  }, [error]);

  // Determine user-friendly error message
  const getUserFriendlyMessage = () => {
    if (error.message.toLowerCase().includes('network')) {
      return "We're having trouble connecting to the server. Please check your internet connection and try again.";
    }
    if (error.message.toLowerCase().includes('timeout')) {
      return 'The request took too long to complete. Please try again.';
    }
    if (error.message.toLowerCase().includes('permission') || error.message.toLowerCase().includes('unauthorized')) {
      return "You don't have permission to access this resource. Please contact your administrator.";
    }
    return 'We encountered an unexpected error. Our team has been notified and is working on a fix.';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-md w-full space-y-6 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-6">
            <AlertCircle className="h-16 w-16 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground">
            Oops! Something went wrong
          </h1>
          <p className="text-muted-foreground text-lg">
            {getUserFriendlyMessage()}
          </p>

          {/* Technical Details (collapsed by default) */}
          {process.env.NODE_ENV === 'development' && error.message && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-muted rounded-md">
                <p className="text-xs font-mono break-all">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            </details>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button
            onClick={reset}
            className="flex items-center gap-2"
            size="lg"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/')}
            size="lg"
          >
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>

        {/* Help Text */}
        <div className="pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            If this problem persists, please contact support with Error ID:{' '}
            {error.digest || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}
