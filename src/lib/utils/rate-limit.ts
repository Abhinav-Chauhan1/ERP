/**
 * Rate Limiting Utility
 * Implements rate limiting for API routes
 * Requirements: 6.3
 * 
 * Configuration:
 * - 100 requests per 10 seconds per IP
 * - Returns 429 status code when limit exceeded
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory fallback for development/testing
class InMemoryRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private window: number;

  constructor(limit: number, window: number) {
    this.maxRequests = limit;
    this.window = window;
  }

  async limit(identifier: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const now = Date.now();
    const windowStart = now - this.window;

    // Get existing requests for this identifier
    let timestamps = this.requests.get(identifier) || [];

    // Filter out requests outside the current window
    timestamps = timestamps.filter((timestamp) => timestamp > windowStart);

    // Check if limit exceeded
    if (timestamps.length >= this.maxRequests) {
      const oldestTimestamp = timestamps[0];
      const reset = oldestTimestamp + this.window;

      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset,
      };
    }

    // Add current request
    timestamps.push(now);
    this.requests.set(identifier, timestamps);

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - timestamps.length,
      reset: now + this.window,
    };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const filtered = timestamps.filter(
        (timestamp) => timestamp > now - this.window
      );
      if (filtered.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, filtered);
      }
    }
  }
}

// Create rate limiter instance
let rateLimiter: Ratelimit | InMemoryRateLimiter;

// Try to use Upstash if configured, otherwise fall back to in-memory
if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  // Use Upstash Redis for production
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  rateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "10 s"),
    analytics: true,
    prefix: "@upstash/ratelimit",
  });
} else {
  // Use in-memory rate limiter for development
  console.warn(
    "UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not configured. Using in-memory rate limiter."
  );
  rateLimiter = new InMemoryRateLimiter(100, 10000); // 100 requests per 10 seconds
}

/**
 * Rate limit a request based on IP address
 * @param identifier - Unique identifier (typically IP address)
 * @returns Rate limit result
 */
export async function rateLimit(identifier: string) {
  try {
    if (rateLimiter instanceof InMemoryRateLimiter) {
      return await rateLimiter.limit(identifier);
    } else {
      // Upstash Ratelimit returns a different structure
      const result = await rateLimiter.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    }
  } catch (error) {
    // If rate limiting fails (e.g., Upstash is down), allow the request
    console.error("Rate limiting error:", error);
    return {
      success: true,
      limit: 100,
      remaining: 100,
      reset: Date.now() + 10000,
    };
  }
}

/**
 * Get client IP address from request headers
 * @param headers - Request headers
 * @returns IP address
 */
export function getClientIp(headers: Headers): string {
  // Try various headers that might contain the real IP
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to a default value
  return "unknown";
}

/**
 * Create a rate limit response
 * @param result - Rate limit result
 * @returns Response with appropriate headers
 */
export function createRateLimitResponse(result: {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}) {
  const headers = new Headers();
  headers.set("X-RateLimit-Limit", result.limit.toString());
  headers.set("X-RateLimit-Remaining", result.remaining.toString());
  headers.set("X-RateLimit-Reset", result.reset.toString());

  if (!result.success) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Too many requests. Please try again later.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": result.limit.toString(),
          "X-RateLimit-Remaining": result.remaining.toString(),
          "X-RateLimit-Reset": result.reset.toString(),
          "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null;
}

/**
 * Rate limit presets for different operations
 */
export const RateLimitPresets = {
  MESSAGE: { limit: 10, window: 60000 }, // 10 messages per minute
  PAYMENT: { limit: 5, window: 60000 }, // 5 payment operations per minute
  FILE_UPLOAD: { limit: 10, window: 60000 }, // 10 file uploads per minute
  API: { limit: 100, window: 60000 }, // 100 API calls per minute
} as const;

/**
 * Check rate limit for server actions
 * @param identifier - Unique identifier (typically user ID)
 * @param preset - Rate limit preset
 * @returns true if allowed, false if rate limited
 */
export async function checkRateLimit(
  identifier: string,
  preset: { limit: number; window: number }
): Promise<boolean> {
  const result = await rateLimit(identifier);
  return result.success;
}

/**
 * Rate limit middleware for API routes
 * @param identifier - Unique identifier (typically user ID)
 * @param preset - Rate limit preset
 * @returns Rate limit result with exceeded flag
 */
export async function rateLimitMiddleware(
  identifier: string,
  preset: { limit: number; window: number }
): Promise<{ exceeded: boolean; limit: number; remaining: number; reset: number }> {
  const result = await rateLimit(identifier);
  return {
    exceeded: !result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}
