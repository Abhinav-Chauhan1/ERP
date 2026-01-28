import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting
// In production, you'd want to use Redis or another distributed cache
const store: RateLimitStore = {};

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60000); // Cleanup every minute

/**
 * Get client identifier for rate limiting
 */
function getClientId(request: NextRequest): string {
  // Try to get real IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  const ip = forwarded?.split(',')[0].trim() || 
             realIp || 
             cfConnectingIp || 
             request.ip || 
             'unknown';

  // Include user agent for additional uniqueness
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Create a hash of IP + User Agent for better rate limiting
  return `${ip}:${userAgent.substring(0, 50)}`;
}

/**
 * Rate limiting middleware
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const clientId = getClientId(request);
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Get or create rate limit entry
  let entry = store[clientId];
  
  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired entry
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    store[clientId] = entry;
  }

  // Increment request count
  entry.count++;

  // Check if limit exceeded
  if (entry.count > config.max) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    
    return NextResponse.json(
      {
        error: config.message || 'Too many requests',
        retryAfter,
        limit: config.max,
        windowMs: config.windowMs,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': config.max.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetTime.toString(),
          'Retry-After': retryAfter.toString(),
        },
      }
    );
  }

  // Add rate limit headers to successful responses
  const remaining = Math.max(0, config.max - entry.count);
  
  // Return null to indicate request should proceed
  // The calling route handler should add these headers to the response
  return null;
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  config: RateLimitConfig,
  clientId: string
): NextResponse {
  const entry = store[clientId];
  
  if (entry) {
    const remaining = Math.max(0, config.max - entry.count);
    
    response.headers.set('X-RateLimit-Limit', config.max.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', entry.resetTime.toString());
  }
  
  return response;
}

/**
 * Create a rate limit middleware for specific routes
 */
export function createRateLimit(config: RateLimitConfig) {
  return async (request: NextRequest) => {
    return await rateLimit(request, config);
  };
}

/**
 * Predefined rate limit configurations
 */
export const rateLimitConfigs = {
  // Very restrictive for sensitive operations
  critical: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many critical operations. Please try again later.',
  },
  
  // Restrictive for admin operations
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    message: 'Too many admin requests. Please try again later.',
  },
  
  // Standard for API operations
  standard: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests. Please try again later.',
  },
  
  // Lenient for read operations
  lenient: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: 'Too many requests. Please try again later.',
  },
  
  // Very lenient for health checks and monitoring
  monitoring: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 500,
    message: 'Too many monitoring requests. Please try again later.',
  },
} as const;

/**
 * Rate limit by user ID (for authenticated requests)
 */
export async function rateLimitByUser(
  userId: string,
  config: RateLimitConfig
): Promise<boolean> {
  const now = Date.now();
  const key = `user:${userId}`;
  
  let entry = store[key];
  
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    store[key] = entry;
  }

  entry.count++;
  
  return entry.count <= config.max;
}

/**
 * Rate limit by resource (for specific resources)
 */
export async function rateLimitByResource(
  resourceId: string,
  config: RateLimitConfig
): Promise<boolean> {
  const now = Date.now();
  const key = `resource:${resourceId}`;
  
  let entry = store[key];
  
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    store[key] = entry;
  }

  entry.count++;
  
  return entry.count <= config.max;
}

/**
 * Clear rate limit for a specific client
 */
export function clearRateLimit(clientId: string): void {
  delete store[clientId];
}

/**
 * Get current rate limit status for a client
 */
export function getRateLimitStatus(clientId: string): {
  count: number;
  remaining: number;
  resetTime: number;
  isLimited: boolean;
} | null {
  const entry = store[clientId];
  
  if (!entry) {
    return null;
  }
  
  const now = Date.now();
  
  if (entry.resetTime < now) {
    delete store[clientId];
    return null;
  }
  
  return {
    count: entry.count,
    remaining: Math.max(0, 100 - entry.count), // Assuming max of 100, adjust as needed
    resetTime: entry.resetTime,
    isLimited: entry.count > 100, // Assuming max of 100, adjust as needed
  };
}

export default rateLimit;