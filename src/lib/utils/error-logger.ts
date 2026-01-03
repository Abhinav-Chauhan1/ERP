/**
 * Error logging utilities for Enhanced Syllabus System
 * Provides structured error logging with context
 * Requirements: Task 14 - Error handling and validation
 */

import { type ErrorResponse } from "./syllabus-error-handling";

/**
 * Error log entry
 */
export interface ErrorLogEntry {
  timestamp: string;
  level: "error" | "warn" | "info";
  context: string;
  message: string;
  code?: string;
  details?: Record<string, any>;
  stack?: string;
  userId?: string;
  sessionId?: string;
}

/**
 * Error logger class
 */
class ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogs: number = 100;

  /**
   * Log an error
   */
  error(
    context: string,
    message: string,
    error?: Error | ErrorResponse,
    userId?: string
  ): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: "error",
      context,
      message,
      userId,
    };

    if (error) {
      if (error instanceof Error) {
        entry.stack = error.stack;
        entry.details = { errorMessage: error.message };
      } else if ("code" in error) {
        entry.code = error.code;
        entry.details = error.details;
      }
    }

    this.addLog(entry);
    this.consoleLog(entry);
  }

  /**
   * Log a warning
   */
  warn(
    context: string,
    message: string,
    details?: Record<string, any>,
    userId?: string
  ): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: "warn",
      context,
      message,
      details,
      userId,
    };

    this.addLog(entry);
    this.consoleLog(entry);
  }

  /**
   * Log info
   */
  info(
    context: string,
    message: string,
    details?: Record<string, any>,
    userId?: string
  ): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      context,
      message,
      details,
      userId,
    };

    this.addLog(entry);
    this.consoleLog(entry);
  }

  /**
   * Add log entry to memory
   */
  private addLog(entry: ErrorLogEntry): void {
    this.logs.push(entry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Output to console
   */
  private consoleLog(entry: ErrorLogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.context}]`;

    switch (entry.level) {
      case "error":
        console.error(prefix, entry.message, entry.details || "");
        if (entry.stack) {
          console.error("Stack:", entry.stack);
        }
        break;
      case "warn":
        console.warn(prefix, entry.message, entry.details || "");
        break;
      case "info":
        console.info(prefix, entry.message, entry.details || "");
        break;
    }
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 10): ErrorLogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs by context
   */
  getLogsByContext(context: string): ErrorLogEntry[] {
    return this.logs.filter((log) => log.context === context);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: ErrorLogEntry["level"]): ErrorLogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

/**
 * Log module operation error
 */
export function logModuleError(
  operation: string,
  error: Error | ErrorResponse,
  moduleId?: string,
  userId?: string
): void {
  errorLogger.error(
    "module-operations",
    `Module ${operation} failed`,
    error,
    userId
  );
}

/**
 * Log sub-module operation error
 */
export function logSubModuleError(
  operation: string,
  error: Error | ErrorResponse,
  subModuleId?: string,
  userId?: string
): void {
  errorLogger.error(
    "submodule-operations",
    `Sub-module ${operation} failed`,
    error,
    userId
  );
}

/**
 * Log document operation error
 */
export function logDocumentError(
  operation: string,
  error: Error | ErrorResponse,
  documentId?: string,
  userId?: string
): void {
  errorLogger.error(
    "document-operations",
    `Document ${operation} failed`,
    error,
    userId
  );
}

/**
 * Log file storage error
 */
export function logFileStorageError(
  operation: string,
  error: Error | ErrorResponse,
  filename?: string,
  userId?: string
): void {
  errorLogger.error(
    "file-storage",
    `File storage ${operation} failed for ${filename || "unknown file"}`,
    error,
    userId
  );
}

/**
 * Log database error
 */
export function logDatabaseError(
  operation: string,
  error: Error | ErrorResponse,
  entity?: string,
  userId?: string
): void {
  errorLogger.error(
    "database",
    `Database ${operation} failed for ${entity || "unknown entity"}`,
    error,
    userId
  );
}

/**
 * Log validation error
 */
export function logValidationError(
  context: string,
  errors: Array<{ field: string; message: string }>,
  userId?: string
): void {
  errorLogger.warn(
    "validation",
    `Validation failed in ${context}`,
    { errors },
    userId
  );
}

/**
 * Log progress tracking error
 */
export function logProgressError(
  operation: string,
  error: Error | ErrorResponse,
  subModuleId?: string,
  userId?: string
): void {
  errorLogger.error(
    "progress-tracking",
    `Progress ${operation} failed`,
    error,
    userId
  );
}

/**
 * Log reordering error
 */
export function logReorderingError(
  entityType: "module" | "submodule" | "document",
  error: Error | ErrorResponse,
  userId?: string
): void {
  errorLogger.error(
    "reordering",
    `${entityType} reordering failed`,
    error,
    userId
  );
}

/**
 * Create error report for debugging
 */
export function createErrorReport(
  error: Error | ErrorResponse,
  context: string,
  additionalInfo?: Record<string, any>
): string {
  const report = {
    timestamp: new Date().toISOString(),
    context,
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : error,
    additionalInfo,
    recentLogs: errorLogger.getRecentLogs(5),
  };

  return JSON.stringify(report, null, 2);
}

/**
 * Send error to monitoring service (placeholder)
 */
export async function sendErrorToMonitoring(
  error: Error | ErrorResponse,
  context: string,
  userId?: string
): Promise<void> {
  // In production, this would send to a service like Sentry, LogRocket, etc.
  // For now, just log it
  errorLogger.error(context, "Error sent to monitoring", error, userId);

  // Example integration:
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.captureException(error, {
  //     tags: { context },
  //     user: userId ? { id: userId } : undefined,
  //   });
  // }
}
