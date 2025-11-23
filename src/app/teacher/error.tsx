'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logError, getUserFriendlyMessage } from '@/lib/utils/error-handler';

export default function TeacherError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error with context
    logError(error, {
      section: 'teacher',
      digest: error.digest,
    });
  }, [error]);

  const userMessage = getUserFriendlyMessage(error);

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-6">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
            <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            Something went wrong
          </h2>
          <p className="text-muted-foreground">
            {userMessage}
          </p>
          
          {/* Technical details (only in development) */}
          {process.env.NODE_ENV === 'development' && error.message && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-muted rounded-md">
                <p className="text-xs font-mono break-all">
                  {error.message}
                </p>
              </div>
            </details>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/teacher'}
          >
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
        </div>

        {error.digest && (
          <p className="text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
