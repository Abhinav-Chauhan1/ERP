/**
 * Client-side error recovery utilities
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Retry a fetch operation with exponential backoff
 * Useful for handling network errors and transient failures
 */
export async function retryFetch(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry,
  } = retryOptions;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Retry on 5xx errors (server errors) but not on 4xx (client errors)
      if (response.status >= 500 && attempt < maxRetries) {
        throw new Error(`Server error: ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Fetch failed');

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Check if error is retryable
      if (!isNetworkError(lastError)) {
        throw lastError;
      }

      // Call retry callback
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Wait before retrying
      await sleep(delay);

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError!;
}

/**
 * Check if an error is a network error that should be retried
 */
function isNetworkError(error: Error): boolean {
  const message = error.message.toLowerCase();
  
  const networkErrorPatterns = [
    'network',
    'fetch',
    'timeout',
    'connection',
    'server error',
    'failed to fetch',
  ];

  return networkErrorPatterns.some(pattern => message.includes(pattern));
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute an operation with automatic retry on failure
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Operation failed');

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Call retry callback
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Wait before retrying
      await sleep(delay);

      // Increase delay for next attempt
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError!;
}

/**
 * Queue for managing failed operations that can be retried later
 */
export class OperationQueue {
  private queue: Array<{
    id: string;
    operation: () => Promise<any>;
    retries: number;
    maxRetries: number;
  }> = [];

  /**
   * Add an operation to the queue
   */
  add(
    id: string,
    operation: () => Promise<any>,
    maxRetries: number = 3
  ): void {
    this.queue.push({ id, operation, retries: 0, maxRetries });
  }

  /**
   * Process all queued operations
   */
  async processAll(): Promise<{
    succeeded: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const succeeded: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const item of this.queue) {
      try {
        await item.operation();
        succeeded.push(item.id);
      } catch (error) {
        item.retries++;

        if (item.retries >= item.maxRetries) {
          failed.push({
            id: item.id,
            error: error instanceof Error ? error.message : 'Operation failed',
          });
        }
      }
    }

    // Remove succeeded and permanently failed items
    this.queue = this.queue.filter(
      item => !succeeded.includes(item.id) && item.retries < item.maxRetries
    );

    return { succeeded, failed };
  }

  /**
   * Get the number of pending operations
   */
  get size(): number {
    return this.queue.length;
  }

  /**
   * Clear all queued operations
   */
  clear(): void {
    this.queue = [];
  }
}

/**
 * Save form data to local storage for recovery
 */
export function saveFormData(formId: string, data: Record<string, any>): void {
  try {
    const key = `form_backup_${formId}`;
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Failed to save form data:', error);
  }
}

/**
 * Recover form data from local storage
 */
export function recoverFormData(
  formId: string,
  maxAge: number = 24 * 60 * 60 * 1000 // 24 hours
): Record<string, any> | null {
  try {
    const key = `form_backup_${formId}`;
    const stored = localStorage.getItem(key);

    if (!stored) {
      return null;
    }

    const { data, timestamp } = JSON.parse(stored);

    // Check if data is too old
    if (Date.now() - timestamp > maxAge) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to recover form data:', error);
    return null;
  }
}

/**
 * Clear saved form data
 */
export function clearFormData(formId: string): void {
  try {
    const key = `form_backup_${formId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear form data:', error);
  }
}

/**
 * Debounce form data saving
 */
export function createFormSaver(formId: string, delay: number = 1000) {
  let timeoutId: NodeJS.Timeout | null = null;

  return (data: Record<string, any>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      saveFormData(formId, data);
    }, delay);
  };
}
