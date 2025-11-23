'use client';

import { AlertCircle, RefreshCw, WifiOff, ShieldAlert, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { parseError, type AppError } from '@/lib/utils/error-handler';

interface ErrorDisplayProps {
  error: unknown;
  onRetry?: () => void;
  retryLabel?: string;
  showDetails?: boolean;
  className?: string;
}

/**
 * Enhanced Error Display Component
 * Shows user-friendly error messages with appropriate icons and retry functionality
 */
export function ErrorDisplay({
  error,
  onRetry,
  retryLabel = 'Try Again',
  showDetails = false,
  className = '',
}: ErrorDisplayProps) {
  const appError = parseError(error);

  // Get appropriate icon based on error type
  const getIcon = () => {
    switch (appError.type) {
      case 'network':
        return <WifiOff className="h-5 w-5" />;
      case 'authorization':
      case 'authentication':
        return <ShieldAlert className="h-5 w-5" />;
      case 'not_found':
        return <FileQuestion className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  // Get appropriate title based on error type
  const getTitle = () => {
    switch (appError.type) {
      case 'network':
        return 'Connection Error';
      case 'validation':
        return 'Validation Error';
      case 'authentication':
        return 'Authentication Required';
      case 'authorization':
        return 'Access Denied';
      case 'not_found':
        return 'Not Found';
      case 'server':
        return 'Server Error';
      default:
        return 'Error';
    }
  };

  return (
    <Alert variant="destructive" className={className}>
      {getIcon()}
      <AlertTitle>{getTitle()}</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>{appError.userMessage}</p>

        {/* Technical details (only in development or when explicitly shown) */}
        {showDetails && appError.message && (
          <details className="text-xs">
            <summary className="cursor-pointer hover:underline">
              Technical Details
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {appError.message}
            </pre>
          </details>
        )}

        {/* Retry button for retryable errors */}
        {appError.retryable && onRetry && (
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
 * Inline Error Display (for smaller contexts)
 */
export function InlineErrorDisplay({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const appError = parseError(error);

  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
      <div className="flex items-center gap-2 flex-1">
        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
        <p className="text-sm text-red-800 dark:text-red-200">
          {appError.userMessage}
        </p>
      </div>
      {appError.retryable && onRetry && (
        <Button
          onClick={onRetry}
          variant="ghost"
          size="sm"
          className="h-8 text-red-600 hover:text-red-700 dark:text-red-400 flex-shrink-0"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}

/**
 * Full Page Error Display
 */
export function FullPageError({
  error,
  onRetry,
  onGoHome,
}: {
  error: unknown;
  onRetry?: () => void;
  onGoHome?: () => void;
}) {
  const appError = parseError(error);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-6">
            <AlertCircle className="h-16 w-16 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">
            {appError.type === 'network' ? 'Connection Error' : 'Something went wrong'}
          </h2>
          <p className="text-muted-foreground text-lg">{appError.userMessage}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          {appError.retryable && onRetry && (
            <Button onClick={onRetry} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
          {onGoHome && (
            <Button variant="outline" onClick={onGoHome}>
              Go Home
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
