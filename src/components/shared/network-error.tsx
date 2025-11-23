'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface NetworkErrorProps {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * Network Error Component
 * Displays a user-friendly message for network errors with retry functionality
 */
export function NetworkError({ 
  message = 'Unable to connect to the server. Please check your internet connection.',
  onRetry,
  retryLabel = 'Try again'
}: NetworkErrorProps) {
  return (
    <Alert variant="destructive" className="max-w-2xl mx-auto">
      <WifiOff className="h-4 w-4" />
      <AlertTitle>Network Error</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>{message}</p>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {retryLabel}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Inline Network Error (for smaller contexts)
 */
export function InlineNetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
      <WifiOff className="h-5 w-5 text-red-600 dark:text-red-400" />
      <p className="text-sm text-red-800 dark:text-red-200">
        Connection error
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="ghost"
          size="sm"
          className="h-8 text-red-600 hover:text-red-700 dark:text-red-400"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}
