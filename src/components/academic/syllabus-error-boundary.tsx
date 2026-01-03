"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  context?: "module" | "submodule" | "document" | "progress" | "general";
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Syllabus-specific Error Boundary component
 * Provides context-aware error handling for syllabus features
 * Requirements: Task 14 - Error boundary components
 */
export class SyllabusErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error with context
    console.error(
      `Syllabus Error (${this.props.context || "general"}):`,
      error,
      errorInfo
    );

    this.setState({ errorInfo });

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
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  getContextualMessage(): { title: string; description: string; icon: ReactNode } {
    const context = this.props.context || "general";

    switch (context) {
      case "module":
        return {
          title: "Module Error",
          description: "There was a problem loading or managing modules. This could be due to a network issue or invalid data.",
          icon: <FileText className="h-4 w-4" />,
        };
      case "submodule":
        return {
          title: "Sub-Module Error",
          description: "There was a problem loading or managing sub-modules. Please check your connection and try again.",
          icon: <FileText className="h-4 w-4" />,
        };
      case "document":
        return {
          title: "Document Error",
          description: "There was a problem uploading or managing documents. Please verify the file type and size.",
          icon: <FileText className="h-4 w-4" />,
        };
      case "progress":
        return {
          title: "Progress Tracking Error",
          description: "There was a problem updating progress. Your changes may not have been saved.",
          icon: <AlertTriangle className="h-4 w-4" />,
        };
      default:
        return {
          title: "Something went wrong",
          description: "An unexpected error occurred while loading the syllabus content.",
          icon: <AlertTriangle className="h-4 w-4" />,
        };
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const contextualMessage = this.getContextualMessage();

      // Default error UI with context
      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <div className="max-w-md w-full">
            <Alert variant="destructive">
              {contextualMessage.icon}
              <AlertTitle>{contextualMessage.title}</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-2">{contextualMessage.description}</p>
                
                {this.state.error && (
                  <details className="mb-4 text-sm">
                    <summary className="cursor-pointer font-medium">
                      Technical Details
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={this.handleReset}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                  
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Link href="/admin/academic/syllabus">
                      <Home className="h-4 w-4" />
                      Go to Syllabus
                    </Link>
                  </Button>
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
 * Hook-based wrapper for functional components
 */
export function withSyllabusErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  context?: Props["context"],
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) {
  return function WithSyllabusErrorBoundary(props: P) {
    return (
      <SyllabusErrorBoundary 
        context={context} 
        fallback={fallback} 
        onError={onError}
      >
        <Component {...props} />
      </SyllabusErrorBoundary>
    );
  };
}

/**
 * Lightweight error display component for inline errors
 */
export function InlineError({ 
  message, 
  onRetry 
}: { 
  message: string; 
  onRetry?: () => void;
}) {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        <p className="mb-2">{message}</p>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Error display for form validation errors
 */
export function FormError({ 
  errors 
}: { 
  errors: Record<string, string[]> | string;
}) {
  if (typeof errors === "string") {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{errors}</AlertDescription>
      </Alert>
    );
  }

  const errorEntries = Object.entries(errors);
  if (errorEntries.length === 0) return null;

  return (
    <Alert variant="destructive" className="my-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Validation Errors</AlertTitle>
      <AlertDescription>
        <ul className="list-disc list-inside space-y-1 mt-2">
          {errorEntries.map(([field, messages]) => (
            <li key={field}>
              <span className="font-medium">{field}:</span>{" "}
              {Array.isArray(messages) ? messages.join(", ") : messages}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Loading error component with retry
 */
export function LoadingError({
  message = "Failed to load content",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
      <h3 className="text-lg font-semibold mb-2">Loading Error</h3>
      <p className="text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}
