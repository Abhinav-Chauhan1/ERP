/**
 * Retry Utility with Exponential Backoff
 * 
 * This utility provides configurable retry logic with exponential backoff
 * for handling transient failures in external API calls.
 * 
 * Requirements: 3.3, 14.3
 */

import { CommunicationError, MSG91Error, WhatsAppError } from '@/lib/types/communication';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Retry configuration options
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries: number;
  /** Base delay in milliseconds before first retry (default: 1000ms) */
  baseDelay: number;
  /** Maximum delay in milliseconds between retries (default: 30000ms) */
  maxDelay: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier: number;
  /** Whether to add random jitter to delays (default: true) */
  useJitter: boolean;
  /** Function to determine if an error should be retried (optional) */
  shouldRetry?: (error: any, attempt: number) => boolean;
  /** Callback function called before each retry (optional) */
  onRetry?: (error: any, attempt: number, delay: number) => void;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  useJitter: true,
};

// ============================================================================
// Retry Logic
// ============================================================================

/**
 * Calculate delay for next retry attempt using exponential backoff
 * 
 * @param attempt - Current attempt number (0-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  // Calculate exponential backoff: baseDelay * (backoffMultiplier ^ attempt)
  const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);

  // Cap at maximum delay
  let delay = Math.min(exponentialDelay, config.maxDelay);

  // Add jitter to prevent thundering herd problem
  if (config.useJitter) {
    // Add random jitter between 0% and 25% of the delay
    const jitter = delay * 0.25 * Math.random();
    delay = delay + jitter;
  }

  return Math.floor(delay);
}

/**
 * Default function to determine if an error should be retried
 * 
 * @param error - Error that occurred
 * @param attempt - Current attempt number
 * @returns true if error should be retried
 */
function defaultShouldRetry(error: any, attempt: number): boolean {
  // Don't retry configuration errors
  if (error instanceof MSG91Error) {
    const nonRetryableCodes = ['102', '103', '104', '107']; // Config, sender ID, invalid number, DLT template errors
    if (error.code && nonRetryableCodes.includes(error.code)) {
      return false;
    }
  }

  if (error instanceof WhatsAppError) {
    const nonRetryableCodes = ['131026', '131051']; // Invalid number, unsupported message type
    if (error.code && nonRetryableCodes.includes(error.code)) {
      return false;
    }
  }

  // Retry all other errors
  return true;
}

/**
 * Sleep for specified milliseconds
 * 
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Main Retry Function
// ============================================================================

/**
 * Execute a function with retry logic and exponential backoff
 * 
 * This function will attempt to execute the provided async function,
 * and retry on failure according to the retry configuration.
 * 
 * @param fn - Async function to execute
 * @param config - Retry configuration (optional, uses defaults if not provided)
 * @returns Promise with the result of the function
 * @throws The last error if all retries are exhausted
 * 
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   async () => await sendSMS('+919876543210', 'Hello'),
 *   { maxRetries: 3, baseDelay: 1000 }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  // Merge provided config with defaults
  const finalConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
    shouldRetry: config.shouldRetry || defaultShouldRetry,
  };

  let lastError: any;

  // Attempt execution up to maxRetries + 1 times (initial attempt + retries)
  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      // Execute the function
      const result = await fn();
      return result;
    } catch (error: any) {
      lastError = error;

      // Check if we should retry this error
      const shouldRetry = finalConfig.shouldRetry!(error, attempt);

      // If this is the last attempt or error shouldn't be retried, throw
      if (attempt >= finalConfig.maxRetries || !shouldRetry) {
        throw error;
      }

      // Calculate delay for next retry
      const delay = calculateDelay(attempt, finalConfig);

      // Call onRetry callback if provided
      if (finalConfig.onRetry) {
        finalConfig.onRetry(error, attempt + 1, delay);
      } else {
        // Default logging
        console.log(
          `Retry attempt ${attempt + 1}/${finalConfig.maxRetries} after ${delay}ms due to error:`,
          error.message || error
        );
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

// ============================================================================
// Specialized Retry Functions
// ============================================================================

/**
 * Retry configuration optimized for SMS operations
 */
export const SMS_RETRY_CONFIG: Partial<RetryConfig> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  useJitter: true,
};

/**
 * Retry configuration optimized for WhatsApp operations
 */
export const WHATSAPP_RETRY_CONFIG: Partial<RetryConfig> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 15000,
  backoffMultiplier: 2,
  useJitter: true,
};

/**
 * Retry configuration for rate-limited operations
 * Uses longer delays to respect rate limits
 */
export const RATE_LIMITED_RETRY_CONFIG: Partial<RetryConfig> = {
  maxRetries: 5,
  baseDelay: 5000,
  maxDelay: 60000,
  backoffMultiplier: 2,
  useJitter: true,
  shouldRetry: (error: any, attempt: number) => {
    // Retry rate limit errors
    if (error instanceof MSG91Error && error.code === '106') {
      return true;
    }
    if (error instanceof WhatsAppError && error.code === '133016') {
      return true;
    }
    // Use default retry logic for other errors
    return defaultShouldRetry(error, attempt);
  },
};

/**
 * Execute an SMS operation with retry logic
 * 
 * @param fn - Async SMS function to execute
 * @param config - Optional retry configuration override
 * @returns Promise with the result
 */
export async function retrySMSOperation<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  return retryWithBackoff(fn, { ...SMS_RETRY_CONFIG, ...config });
}

/**
 * Execute a WhatsApp operation with retry logic
 * 
 * @param fn - Async WhatsApp function to execute
 * @param config - Optional retry configuration override
 * @returns Promise with the result
 */
export async function retryWhatsAppOperation<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  return retryWithBackoff(fn, { ...WHATSAPP_RETRY_CONFIG, ...config });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if an error is retryable
 * 
 * @param error - Error to check
 * @returns true if error should be retried
 */
export function isRetryableError(error: any): boolean {
  return defaultShouldRetry(error, 0);
}

/**
 * Get a human-readable description of retry configuration
 * 
 * @param config - Retry configuration
 * @returns Description string
 */
export function describeRetryConfig(config: Partial<RetryConfig>): string {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  return `Retry up to ${finalConfig.maxRetries} times with ${finalConfig.baseDelay}ms base delay, ` +
    `${finalConfig.backoffMultiplier}x backoff multiplier, max ${finalConfig.maxDelay}ms delay` +
    (finalConfig.useJitter ? ' (with jitter)' : '');
}
