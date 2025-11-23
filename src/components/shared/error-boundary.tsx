'use client';

import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Reusable Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console for debugging
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Log to monitoring service (Sentry, etc.)
    if (typeof window !== 'undefined') {
      // In production, this would send to Sentry or similar service
      // For now, we'll log with full context
      const errorContext = {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      };
      
      console.error('Error context for monitoring:', errorContext);
      
      // TODO: Uncomment when Sentry is configured
      // if (window.Sentry) {
      //   window.Sentry.captureException(error, { 
      //     extra: errorContext 
      //   });
      // }
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      // Default fallback UI
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
                <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Something went wrong
              </h2>
              <p className="text-muted-foreground">
                We encountered an unexpected error. Please try again.
              </p>
              {this.state.error.message && (
                <p className="text-sm text-muted-foreground mt-2 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  {this.state.error.message}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.reset}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
