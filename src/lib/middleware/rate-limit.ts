import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// Initialize Redis client for distributed rate limiting
let redis: Redis | null = null;

try {
  if (process.env.REDIS_URL) {
    // Check if it's an Upstash Redis URL (starts with https)
    if (process.env.REDIS_URL.startsWith('https://')) {
      // Upstash Redis configuration
      redis = new Redis({
        url: process.env.REDIS_URL,
        token: process.env.REDIS_TOKEN || '',
      });
    } else {
      // For local Redis, we'll use a different approach
      console.warn('⚠️  Local Redis URL detected. Upstash Redis client requires HTTPS URLs.');
      console.warn('   Falling back to in-memory rate limiting for development.');
      redis = null;
    }
  }
} catch (error) {
  console.error('Failed to initialize Redis client:', error);
  redis = null;
}

// Warn if Redis is not configured in production
if (!redis && process.env.NODE_ENV === 'production') {
  console.error('🚨 CRITICAL: Redis not configured for rate limiting in production!');
  console.error('   This will cause rate limiting to fail across multiple server instances.');
  console.error('   Please configure REDIS_URL (Upstash HTTPS URL) and REDIS_TOKEN environment variables.');
}

// Fallback in-memory store for development only
const memoryStore: Record<string, { count: number; resetTime: number }> = {};

// Cleanup old entries periodically (development only)
if (!redis) {
  setInterval(() => {
    const now = Date.now();
    Object.keys(memoryStore).forEach(key => {
      if (memoryStore[key].resetTime < now) {
        delete memoryStore[key];
      }
    });
  }, 60000); // Cleanup every minute
}

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
             'unknown';

  // Include user agent for additional uniqueness
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Create a hash of IP + User Agent for better rate limiting
  return `${ip}:${userAgent.substring(0, 50)}`;
}

/**
 * Distributed rate limiting using Redis
 */
async function distributedRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const clientId = getClientId(request);
  const key = `ratelimit:${clientId}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  if (!redis) {
    // Fallback to in-memory for development
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 CRITICAL: Using fallback rate limiting in production!');
    }
    return fallbackRateLimit(clientId, config);
  }

  try {
    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline();
    
    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Count current requests in window
    pipeline.zcard(key);
    
    // Add current request with correct zadd format
    const requestId = `${now}-${Math.random()}`;
    pipeline.zadd(key, { score: now, member: requestId });
    
    // Set expiration
    pipeline.expire(key, Math.ceil(config.windowMs / 1000));
    
    const results = await pipeline.exec();
    const currentCount = (results[1] as number) || 0;

    if (currentCount >= config.max) {
      // Remove the request we just added since it's not allowed
      await redis.zrem(key, requestId);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + config.windowMs,
        retryAfter: Math.ceil(config.windowMs / 1000)
      };
    }

    return {
      allowed: true,
      remaining: config.max - currentCount - 1,
      resetTime: now + config.windowMs
    };

  } catch (error) {
    console.error('Redis rate limiting error:', error);
    // Fallback to allowing request on Redis error
    return {
      allowed: true,
      remaining: config.max - 1,
      resetTime: now + config.windowMs
    };
  }
}

/**
 * Fallback in-memory rate limiting (development only)
 */
function fallbackRateLimit(clientId: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  let entry = memoryStore[clientId];
  
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    memoryStore[clientId] = entry;
  }

  entry.count++;

  if (entry.count > config.max) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000)
    };
  }

  return {
    allowed: true,
    remaining: config.max - entry.count,
    resetTime: entry.resetTime
  };
}

/**
 * Rate limiting middleware
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const result = await distributedRateLimit(request, config);

  if (!result.allowed) {
    const response = NextResponse.json(
      { 
        error: config.message || 'Too many requests',
        retryAfter: result.retryAfter 
      },
      { status: 429 }
    );

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', config.max.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
    
    if (result.retryAfter) {
      response.headers.set('Retry-After', result.retryAfter.toString());
    }

    return response;
  }

  return null; // Allow request to proceed
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  config: RateLimitConfig,
  clientId: string
): NextResponse {
  const entry = memoryStore[clientId];
  
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
  
  let entry = memoryStore[key];
  
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    memoryStore[key] = entry;
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
  
  let entry = memoryStore[key];
  
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    memoryStore[key] = entry;
  }

  entry.count++;
  
  return entry.count <= config.max;
}

/**
 * Clear rate limit for a specific client
 */
export function clearRateLimit(clientId: string): void {
  delete memoryStore[clientId];
}

/**
 * Get current rate limit status for a client
 */
export function getRateLimitStatus(clientId: string, maxRequests: number = 100): {
  count: number;
  remaining: number;
  resetTime: number;
  isLimited: boolean;
} | null {
  const entry = memoryStore[clientId];
  
  if (!entry) {
    return null;
  }
  
  const now = Date.now();
  
  if (entry.resetTime < now) {
    delete memoryStore[clientId];
    return null;
  }
  
  return {
    count: entry.count,
    remaining: Math.max(0, maxRequests - entry.count),
    resetTime: entry.resetTime,
    isLimited: entry.count > maxRequests,
  };
}

export default rateLimit;