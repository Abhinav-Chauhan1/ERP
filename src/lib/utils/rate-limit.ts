/**
 * Rate Limiting Utility
 * Implements rate limiting for API endpoints and server actions
 * Requirements: 10.2, 10.4
 */

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

/**
 * Rate limit store entry
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * In-memory rate limit store
 * In production, use Redis or similar for distributed rate limiting
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
  // Strict rate limit for payment operations (5 requests per 10 seconds)
  PAYMENT: {
    windowMs: 10000,
    maxRequests: 5,
  },
  // Moderate rate limit for message sending (10 requests per minute)
  MESSAGE: {
    windowMs: 60000,
    maxRequests: 10,
  },
  // Moderate rate limit for file uploads (5 requests per minute)
  FILE_UPLOAD: {
    windowMs: 60000,
    maxRequests: 5,
  },
  // Lenient rate limit for general API calls (30 requests per minute)
  GENERAL: {
    windowMs: 60000,
    maxRequests: 30,
  },
  // Very strict rate limit for authentication (3 requests per 5 minutes)
  AUTH: {
    windowMs: 300000,
    maxRequests: 3,
  },
} as const;

/**
 * Check if request is within rate limit
 * Returns true if allowed, false if rate limit exceeded
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RateLimitPresets.GENERAL
): boolean {
  const now = Date.now();
  const key = `${identifier}:${config.windowMs}:${config.maxRequests}`;
  const entry = rateLimitStore.get(key);

  // If no entry exists or window has expired, create new entry
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return true;
  }

  // If limit exceeded, deny request
  if (entry.count >= config.maxRequests) {
    return false;
  }

  // Increment count and allow request
  entry.count++;
  return true;
}

/**
 * Get remaining requests for an identifier
 */
export function getRemainingRequests(
  identifier: string,
  config: RateLimitConfig = RateLimitPresets.GENERAL
): number {
  const now = Date.now();
  const key = `${identifier}:${config.windowMs}:${config.maxRequests}`;
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    return config.maxRequests;
  }

  return Math.max(0, config.maxRequests - entry.count);
}

/**
 * Get time until rate limit reset (in milliseconds)
 */
export function getResetTime(
  identifier: string,
  config: RateLimitConfig = RateLimitPresets.GENERAL
): number {
  const now = Date.now();
  const key = `${identifier}:${config.windowMs}:${config.maxRequests}`;
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    return 0;
  }

  return entry.resetTime - now;
}

/**
 * Reset rate limit for an identifier
 * Useful for testing or manual reset
 */
export function resetRateLimit(
  identifier: string,
  config: RateLimitConfig = RateLimitPresets.GENERAL
): void {
  const key = `${identifier}:${config.windowMs}:${config.maxRequests}`;
  rateLimitStore.delete(key);
}

/**
 * Clean up expired entries from the store
 * Should be called periodically to prevent memory leaks
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  
  for (const [key, entry] of Array.from(rateLimitStore.entries())) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate limit middleware for API routes
 * Returns response object if rate limit exceeded, null otherwise
 */
export function rateLimitMiddleware(
  identifier: string,
  config: RateLimitConfig = RateLimitPresets.GENERAL
): { exceeded: boolean; remaining: number; resetTime: number } {
  const allowed = checkRateLimit(identifier, config);
  const remaining = getRemainingRequests(identifier, config);
  const resetTime = getResetTime(identifier, config);

  return {
    exceeded: !allowed,
    remaining,
    resetTime,
  };
}

/**
 * Rate limit decorator for server actions
 * Throws error if rate limit exceeded
 */
export async function withRateLimit<T>(
  identifier: string,
  config: RateLimitConfig,
  action: () => Promise<T>
): Promise<T> {
  const allowed = checkRateLimit(identifier, config);

  if (!allowed) {
    const resetTime = getResetTime(identifier, config);
    const resetInSeconds = Math.ceil(resetTime / 1000);
    throw new Error(
      `Rate limit exceeded. Please try again in ${resetInSeconds} seconds.`
    );
  }

  return await action();
}

// Set up periodic cleanup (every 5 minutes)
if (typeof window === "undefined") {
  // Only run on server
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}
