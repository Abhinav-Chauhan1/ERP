"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  context?: "overview" | "list" | "detail" | "form";
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component specifically for academic year pages
 * Provides context-aware error messages and recovery options
 * Requirements: Task 10 - Error boundaries for academic pages
 */
export class AcademicErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console with context
    console.error(
      `Error in academic ${this.props.context || "page"}:`,
      error,
      errorInfo
    );

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, send to error tracking service
    // Example: Sentry.captureException(error, { 
    //   extra: { ...errorInfo, context: this.props.context } 
    // });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Optionally reload the page
    window.location.reload();
  };

  getContextualMessage(): string {
    const { context } = this.props;
    
    switch (context) {
      case "overview":
        return "There was a problem loading the academic overview. This might be due to a network issue or a problem with the data.";
      case "list":
        return "There was a problem loading the academic years list. Please try refreshing the page.";
      case "detail":
        return "There was a problem loading the academic year details. The year might not exist or there was a network issue.";
      case "form":
        return "There was a problem with the form. Please check your input and try again.";
      default:
        return "An unexpected error occurred while loading academic data.";
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI with context-aware messaging
      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription className="mt-2 space-y-4">
                <p>{this.getContextualMessage()}</p>
                
                {this.state.error?.message && (
                  <div className="text-xs bg-destructive/10 p-2 rounded border border-destructive/20">
                    <strong>Error details:</strong> {this.state.error.message}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={this.handleReset}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                  
                  <Link href="/admin/academic">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Home className="h-4 w-4" />
                      Go to Academic Home
                    </Button>
                  </Link>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary wrapper for functional components
 */
export function withAcademicErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  context?: Props["context"],
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) {
  return function WithAcademicErrorBoundary(props: P) {
    return (
      <AcademicErrorBoundary 
        context={context} 
        fallback={fallback} 
        onError={onError}
      >
        <Component {...props} />
      </AcademicErrorBoundary>
    );
  };
}
