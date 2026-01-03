"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  userType?: "student" | "parent";
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component specifically for report card pages
 * Provides user-type-aware error messages and recovery options
 * Requirements: Task 10 - Error boundaries for report card pages
 */
export class ReportCardErrorBoundary extends Component<Props, State> {
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
      `Error in ${this.props.userType || "user"} report cards:`,
      error,
      errorInfo
    );

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, send to error tracking service
    // Example: Sentry.captureException(error, { 
    //   extra: { ...errorInfo, userType: this.props.userType } 
    // });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Optionally reload the page
    window.location.reload();
  };

  getHomeLink(): string {
    return this.props.userType === "parent" 
      ? "/parent" 
      : "/student";
  }

  getContextualMessage(): string {
    const userType = this.props.userType === "parent" ? "your children's" : "your";
    return `There was a problem loading ${userType} report cards. This might be due to a network issue or a problem with the data.`;
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
                  
                  <Link href={this.getHomeLink()}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Home className="h-4 w-4" />
                      Go to Dashboard
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
export function withReportCardErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  userType?: Props["userType"],
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) {
  return function WithReportCardErrorBoundary(props: P) {
    return (
      <ReportCardErrorBoundary 
        userType={userType} 
        fallback={fallback} 
        onError={onError}
      >
        <Component {...props} />
      </ReportCardErrorBoundary>
    );
  };
}
