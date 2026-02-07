import { Redis } from '@upstash/redis';
import { logAuditEvent, AuditAction } from "./audit-service";
import { rateLimitLogger } from "./rate-limit-logger";

/**
 * Redis-based Rate Limiting Service
 * Implements comprehensive distributed rate limiting and abuse protection.
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */

// Initialize Redis client with proper configuration
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
      console.warn('   For production, please use Upstash Redis or configure a Redis client that supports local connections.');
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

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  blockDurationMs: number; // Block duration after limit exceeded
  exponentialBackoffBase: number; // Base multiplier for exponential backoff
  maxBackoffMs: number; // Maximum backoff time
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number; // seconds to wait before retry
  isBlocked: boolean;
  blockExpiresAt?: Date;
}

export interface LoginFailureResult {
  allowed: boolean;
  backoffMs: number;
  attempts: number;
  nextAttemptAt: Date;
  isBlocked: boolean;
}

export interface BlockedIdentifier {
  id: string;
  identifier: string;
  reason: string;
  blockedAt: Date;
  expiresAt: Date;
  attempts: number;
  isActive: boolean;
}

// Rate limiting configurations
export const RATE_LIMIT_CONFIGS = {
  OTP_GENERATION: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 3,
    blockDurationMs: 15 * 60 * 1000, // 15 minutes
    exponentialBackoffBase: 2,
    maxBackoffMs: 60 * 60 * 1000 // 1 hour
  },
  LOGIN_ATTEMPTS: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
    exponentialBackoffBase: 2,
    maxBackoffMs: 2 * 60 * 60 * 1000 // 2 hours
  },
  SUSPICIOUS_ACTIVITY: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    blockDurationMs: 24 * 60 * 60 * 1000, // 24 hours
    exponentialBackoffBase: 3,
    maxBackoffMs: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
} as const;

// Custom errors
export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number,
    public resetTime: Date
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class BlockedIdentifierError extends Error {
  constructor(
    message: string,
    public expiresAt: Date,
    public reason: string
  ) {
    super(message);
    this.name = 'BlockedIdentifierError';
  }
}

// Fallback in-memory store for development
const memoryStore = new Map<string, { count: number; resetTime: number; blocked?: { expiresAt: number; reason: string } }>();

class RateLimitingService {
  /**
   * Redis-based rate limiting check
   */
  private async checkRedisRateLimit(
    key: string, 
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    if (!redis) {
      return this.fallbackRateLimit(key, config);
    }

    try {
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Use Redis pipeline for atomic operations
      const pipeline = redis.pipeline();
      
      // Remove expired entries
      pipeline.zremrangebyscore(key, 0, windowStart);
      
      // Count current requests in window
      pipeline.zcard(key);
      
      // Add current request
      const requestId = `${now}-${Math.random()}`;
      pipeline.zadd(key, { score: now, member: requestId });
      
      // Set expiration
      pipeline.expire(key, Math.ceil(config.windowMs / 1000));
      
      const results = await pipeline.exec();
      const currentCount = (results[1] as number) || 0;

      // Check if blocked
      const blockKey = `block:${key}`;
      const blockData = await redis.get(blockKey);
      
      if (blockData) {
        const block = JSON.parse(blockData as string);
        if (block.expiresAt > now) {
          // Remove the request we just added since it's blocked
          await redis.zrem(key, requestId);
          
          return {
            allowed: false,
            remaining: 0,
            resetTime: new Date(block.expiresAt),
            retryAfter: Math.ceil((block.expiresAt - now) / 1000),
            isBlocked: true,
            blockExpiresAt: new Date(block.expiresAt)
          };
        } else {
          // Block expired, remove it
          await redis.del(blockKey);
        }
      }

      if (currentCount >= config.maxRequests) {
        // Block the identifier
        const blockExpiresAt = now + config.blockDurationMs;
        await redis.setex(
          blockKey,
          Math.ceil(config.blockDurationMs / 1000),
          JSON.stringify({
            expiresAt: blockExpiresAt,
            reason: 'Rate limit exceeded',
            attempts: currentCount
          })
        );

        // Remove the request we just added since it's not allowed
        await redis.zrem(key, requestId);
        
        // Log the rate limit violation
        await rateLimitLogger.logEvent(
          key,
          'RATE_LIMIT_EXCEEDED',
          'RATE_LIMIT',
          {
            attempts: currentCount,
            windowMs: config.windowMs,
            maxRequests: config.maxRequests,
            blocked: true,
            blockDurationMs: config.blockDurationMs
          }
        );

        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(blockExpiresAt),
          retryAfter: Math.ceil(config.blockDurationMs / 1000),
          isBlocked: true,
          blockExpiresAt: new Date(blockExpiresAt)
        };
      }

      return {
        allowed: true,
        remaining: config.maxRequests - currentCount - 1,
        resetTime: new Date(now + config.windowMs),
        isBlocked: false
      };

    } catch (error) {
      console.error('Redis rate limiting error:', error);
      // Fallback to allowing request on Redis error
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: new Date(Date.now() + config.windowMs),
        isBlocked: false
      };
    }
  }

  /**
   * Fallback in-memory rate limiting (development only)
   */
  private fallbackRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 CRITICAL: Using fallback rate limiting in production!');
    }

    const now = Date.now();
    let entry = memoryStore.get(key);
    
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      memoryStore.set(key, entry);
    }

    // Check if blocked
    if (entry.blocked && entry.blocked.expiresAt > now) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(entry.blocked.expiresAt),
        retryAfter: Math.ceil((entry.blocked.expiresAt - now) / 1000),
        isBlocked: true,
        blockExpiresAt: new Date(entry.blocked.expiresAt)
      };
    } else if (entry.blocked && entry.blocked.expiresAt <= now) {
      // Block expired
      delete entry.blocked;
    }

    entry.count++;

    if (entry.count > config.maxRequests) {
      // Block the identifier
      const blockExpiresAt = now + config.blockDurationMs;
      entry.blocked = {
        expiresAt: blockExpiresAt,
        reason: 'Rate limit exceeded'
      };

      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(blockExpiresAt),
        retryAfter: Math.ceil(config.blockDurationMs / 1000),
        isBlocked: true,
        blockExpiresAt: new Date(blockExpiresAt)
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: new Date(entry.resetTime),
      isBlocked: false
    };
  }

  /**
   * Check OTP rate limiting for identifier
   * Requirements: 14.1
   */
  async checkOTPRateLimit(identifier: string): Promise<RateLimitResult> {
    const key = `otp:${identifier}`;
    return this.checkRedisRateLimit(key, RATE_LIMIT_CONFIGS.OTP_GENERATION);
  }

  /**
   * Check login rate limiting for identifier
   * Requirements: 14.2
   */
  async checkLoginRateLimit(identifier: string): Promise<RateLimitResult> {
    const key = `login:${identifier}`;
    return this.checkRedisRateLimit(key, RATE_LIMIT_CONFIGS.LOGIN_ATTEMPTS);
  }



  /**
   * Check login failure rate limiting with exponential backoff
   * Requirements: 14.2
   */
  async checkLoginFailureRateLimit(identifier: string): Promise<LoginFailureResult> {
    const key = `login_failures:${identifier}`;
    
    if (!redis) {
      // Fallback for development
      const entry = memoryStore.get(key);
      const attempts = entry?.count || 0;
      
      if (attempts === 0) {
        return {
          allowed: true,
          backoffMs: 0,
          attempts: 0,
          nextAttemptAt: new Date(),
          isBlocked: false
        };
      }

      const config = RATE_LIMIT_CONFIGS.LOGIN_ATTEMPTS;
      const backoffMs = Math.min(
        Math.pow(config.exponentialBackoffBase, attempts - 1) * 1000,
        config.maxBackoffMs
      );

      const nextAttemptAt = new Date(Date.now() + backoffMs);
      const allowed = attempts < config.maxRequests;

      return {
        allowed,
        backoffMs,
        attempts,
        nextAttemptAt,
        isBlocked: !allowed
      };
    }

    try {
      const now = Date.now();
      const windowStart = now - RATE_LIMIT_CONFIGS.LOGIN_ATTEMPTS.windowMs;
      
      // Get failure count in current window
      const failures = await redis.zcount(key, windowStart, now);
      
      if (failures === 0) {
        return {
          allowed: true,
          backoffMs: 0,
          attempts: 0,
          nextAttemptAt: new Date(),
          isBlocked: false
        };
      }

      // Calculate exponential backoff
      const config = RATE_LIMIT_CONFIGS.LOGIN_ATTEMPTS;
      const backoffMs = Math.min(
        Math.pow(config.exponentialBackoffBase, failures - 1) * 1000,
        config.maxBackoffMs
      );

      // Get last failure time
      const lastFailures = await redis.zrange(key, 0, 0, { rev: true, withScores: true });
      const lastFailureTime = lastFailures.length > 0 ? (lastFailures[0] as any).score : now;
      
      const nextAttemptAt = new Date(lastFailureTime + backoffMs);
      const allowed = new Date() >= nextAttemptAt && failures < config.maxRequests;

      return {
        allowed,
        backoffMs,
        attempts: failures,
        nextAttemptAt,
        isBlocked: !allowed
      };

    } catch (error) {
      console.error('Redis login failure check error:', error);
      // Fallback to allowing on error
      return {
        allowed: true,
        backoffMs: 0,
        attempts: 0,
        nextAttemptAt: new Date(),
        isBlocked: false
      };
    }
  }

  /**
   * Record login failure for exponential backoff calculation
   * Requirements: 14.2
   */
  async recordLoginFailure(
    identifier: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const key = `login_failures:${identifier}`;
    const now = Date.now();

    if (!redis) {
      // Fallback for development
      const entry = memoryStore.get(key) || { count: 0, resetTime: now + RATE_LIMIT_CONFIGS.LOGIN_ATTEMPTS.windowMs };
      entry.count++;
      memoryStore.set(key, entry);
      return;
    }

    try {
      // Add failure to sorted set
      await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });
      
      // Set expiration
      await redis.expire(key, Math.ceil(RATE_LIMIT_CONFIGS.LOGIN_ATTEMPTS.windowMs / 1000));
      
      // Clean up old entries
      const windowStart = now - RATE_LIMIT_CONFIGS.LOGIN_ATTEMPTS.windowMs;
      await redis.zremrangebyscore(key, 0, windowStart);

      // Check if we should block the identifier
      const rateLimit = await this.checkLoginFailureRateLimit(identifier);
      
      if (rateLimit.attempts >= RATE_LIMIT_CONFIGS.LOGIN_ATTEMPTS.maxRequests) {
        await this.blockIdentifier(
          identifier,
          'EXCESSIVE_LOGIN_FAILURES',
          RATE_LIMIT_CONFIGS.LOGIN_ATTEMPTS.blockDurationMs
        );
      }

      // Log the event
      await rateLimitLogger.logEvent(
        identifier,
        'LOGIN_FAILURE_RECORDED',
        'LOGIN_ATTEMPTS',
        {
          attempts: rateLimit.attempts,
          windowMs: RATE_LIMIT_CONFIGS.LOGIN_ATTEMPTS.windowMs,
          maxRequests: RATE_LIMIT_CONFIGS.LOGIN_ATTEMPTS.maxRequests,
          blocked: rateLimit.isBlocked,
          blockDurationMs: rateLimit.isBlocked ? RATE_LIMIT_CONFIGS.LOGIN_ATTEMPTS.blockDurationMs : undefined
        }
      );

    } catch (error) {
      console.error('Failed to record login failure:', error);
      throw error;
    }
  }



  /**
   * Check password reset rate limit
   * Requirements: 14.1, 14.2
   */
  async checkPasswordResetRateLimit(identifier: string): Promise<LoginFailureResult> {
    try {
      const config = RATE_LIMIT_CONFIGS.LOGIN_ATTEMPTS;
      
      // Get recent password reset attempts
      if (!db) throw new Error("Database not initialized");
      const recentAttempts =       await db.rateLimitLog.count({
        where: {
          identifier,
          type: 'PASSWORD_RESET',
          createdAt: {
            gte: new Date(Date.now() - config.windowMs)
          }
        }
      });

      if (recentAttempts >= config.maxRequests) {
        const backoffMs = Math.min(
          config.exponentialBackoffBase * Math.pow(2, recentAttempts - config.maxRequests),
          config.maxBackoffMs
        );

        return {
          allowed: false,
          backoffMs,
          attempts: recentAttempts,
          nextAttemptAt: new Date(Date.now() + backoffMs),
          isBlocked: true
        };
      }

      return {
        allowed: true,
        backoffMs: 0,
        attempts: recentAttempts,
        nextAttemptAt: new Date(),
        isBlocked: false
      };
    } catch (error) {
      console.error('Password reset rate limit check error:', error);
      return {
        allowed: true,
        backoffMs: 0,
        attempts: 0,
        nextAttemptAt: new Date(),
        isBlocked: false
      };
    }
  }

  /**
   * Check email verification rate limit
   * Requirements: 14.1, 14.2
   */
  async checkEmailVerificationRateLimit(identifier: string): Promise<LoginFailureResult> {
    try {
      const config = RATE_LIMIT_CONFIGS.OTP_GENERATION; // Use OTP config for email verification
      
      // Get recent email verification attempts
      if (!db) throw new Error("Database not initialized");
      const recentAttempts =       await db.rateLimitLog.count({
        where: {
          identifier,
          type: 'EMAIL_VERIFICATION',
          createdAt: {
            gte: new Date(Date.now() - config.windowMs)
          }
        }
      });

      if (recentAttempts >= config.maxRequests) {
        const backoffMs = Math.min(
          config.exponentialBackoffBase * Math.pow(2, recentAttempts - config.maxRequests),
          config.maxBackoffMs
        );

        return {
          allowed: false,
          backoffMs,
          attempts: recentAttempts,
          nextAttemptAt: new Date(Date.now() + backoffMs),
          isBlocked: true
        };
      }

      return {
        allowed: true,
        backoffMs: 0,
        attempts: recentAttempts,
        nextAttemptAt: new Date(),
        isBlocked: false
      };
    } catch (error) {
      console.error('Email verification rate limit check error:', error);
      return {
        allowed: true,
        backoffMs: 0,
        attempts: 0,
        nextAttemptAt: new Date(),
        isBlocked: false
      };
    }
  }

  /**
   * Check for suspicious activity patterns
   * Requirements: 14.3
   */
  async checkSuspiciousActivity(
    identifier: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<RateLimitResult> {
    const config = RATE_LIMIT_CONFIGS.SUSPICIOUS_ACTIVITY;
    
    // Check multiple indicators of suspicious activity
    const windowStart = new Date(Date.now() - config.windowMs);
    
    if (!db) {
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: new Date(Date.now() + config.windowMs),
        isBlocked: false
      };
    }
    
    const [otpRequests, loginFailures, rateLimitHits] = await Promise.all([
      // Count OTP requests
      db.oTP.count({
        where: {
          identifier,
          createdAt: { gte: windowStart }
        }
      }),
      
      // Count login failures
      db.loginFailure.count({
        where: {
          identifier,
          createdAt: { gte: windowStart }
        }
      }),
      
      // Count rate limit hits
      db.rateLimitLog.count({
        where: {
          identifier,
          action: 'RATE_LIMIT_HIT',
          createdAt: { gte: windowStart }
        }
      })
    ]);

    const totalSuspiciousActivity = otpRequests + loginFailures + rateLimitHits;
    const remaining = Math.max(0, config.maxRequests - totalSuspiciousActivity);
    const resetTime = new Date(Date.now() + config.windowMs);

    const isSuspicious = totalSuspiciousActivity >= config.maxRequests;
    
    if (isSuspicious) {
      // Block for suspicious activity
      await this.blockIdentifier(
        identifier,
        'SUSPICIOUS_ACTIVITY_PATTERN',
        config.blockDurationMs
      );

      await this.logRateLimitEvent(
        'SUSPICIOUS_ACTIVITY_DETECTED',
        identifier,
        {
          otpRequests,
          loginFailures,
          rateLimitHits,
          totalActivity: totalSuspiciousActivity,
          ipAddress,
          userAgent
        }
      );

      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil(config.blockDurationMs / 1000),
        isBlocked: true,
        blockExpiresAt: new Date(Date.now() + config.blockDurationMs)
      };
    }

    return {
      allowed: true,
      remaining,
      resetTime,
      isBlocked: false
    };
  }

  /**
   * Block identifier temporarily
   * Requirements: 14.3
   */
  async blockIdentifier(
    identifier: string,
    reason: string,
    durationMs: number
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + durationMs);
    
    try {
      // Check if already blocked
      if (!db) throw new Error("Database not initialized");
      const existingBlock =       await db.blockedIdentifier.findFirst({
        where: {
          identifier,
          isActive: true,
          expiresAt: { gt: new Date() }
        }
      });

      if (existingBlock) {
        // Extend the existing block
        if (!db) throw new Error("Database not initialized");
      await db.blockedIdentifier.update({
          where: { id: existingBlock.id },
          data: {
            expiresAt,
            attempts: existingBlock.attempts + 1,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new block
        if (!db) throw new Error("Database not initialized");
      await db.blockedIdentifier.create({
          data: {
            identifier,
            reason,
            expiresAt,
            attempts: 1,
            isActive: true
          }
        });
      }

      await this.logRateLimitEvent(
        'IDENTIFIER_BLOCKED',
        identifier,
        {
          reason,
          durationMs,
          expiresAt: expiresAt.toISOString()
        }
      );

    } catch (error) {
      console.error('Failed to block identifier:', error);
      throw error;
    }
  }

  /**
   * Check if identifier is currently blocked
   * Requirements: 14.3
   */
  async isIdentifierBlocked(identifier: string): Promise<BlockedIdentifier | null> {
    if (!db) throw new Error("Database not initialized");
    const block =       await db.blockedIdentifier.findFirst({
      where: {
        identifier,
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    });

    if (!block) {
      return null;
    }

    return {
      id: block.id,
      identifier: block.identifier,
      reason: block.reason,
      blockedAt: block.createdAt,
      expiresAt: block.expiresAt,
      attempts: block.attempts,
      isActive: block.isActive
    };
  }

  /**
   * Unblock identifier (admin function)
   * Requirements: 14.4
   */
  async unblockIdentifier(identifier: string, adminUserId: string): Promise<boolean> {
    try {
      if (!db) throw new Error("Database not initialized");
      const result =       await db.blockedIdentifier.updateMany({
        where: {
          identifier,
          isActive: true
        },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      if (result.count > 0) {
        await this.logRateLimitEvent(
          'IDENTIFIER_UNBLOCKED',
          identifier,
          {
            adminUserId,
            unblockedAt: new Date().toISOString()
          }
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to unblock identifier:', error);
      return false;
    }
  }

  /**
   * Get all blocked identifiers (admin function)
   * Requirements: 14.4
   */
  async getBlockedIdentifiers(
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    identifiers: BlockedIdentifier[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      if (!db) {
        return {
          identifiers: [],
          total: 0,
          hasMore: false
        };
      }
      
      const [identifiers, total] = await Promise.all([
        db.blockedIdentifier.findMany({
          where: {
            isActive: true,
            expiresAt: { gt: new Date() }
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        }),
        db.blockedIdentifier.count({
          where: {
            isActive: true,
            expiresAt: { gt: new Date() }
          }
        })
      ]);

      return {
        identifiers: identifiers.map(block => ({
          id: block.id,
          identifier: block.identifier,
          reason: block.reason,
          blockedAt: block.createdAt,
          expiresAt: block.expiresAt,
          attempts: block.attempts,
          isActive: block.isActive
        })),
        total,
        hasMore: offset + limit < total
      };
    } catch (error) {
      console.error('Failed to get blocked identifiers:', error);
      throw error;
    }
  }

  /**
   * Clean up expired blocks and failures
   * Requirements: 14.5
   */
  async cleanupExpiredData(): Promise<void> {
    try {
      const now = new Date();
      
      // Deactivate expired blocks
      if (!db) throw new Error("Database not initialized");
      await db.blockedIdentifier.updateMany({
        where: {
          isActive: true,
          expiresAt: { lte: now }
        },
        data: {
          isActive: false,
          updatedAt: now
        }
      });

      // Clean up old login failures (keep for 7 days)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      await db.loginFailure.deleteMany({
        where: {
          createdAt: { lte: sevenDaysAgo }
        }
      });

      // Clean up old rate limit logs (keep for 30 days)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      await db.rateLimitLog.deleteMany({
        where: {
          createdAt: { lte: thirtyDaysAgo }
        }
      });

      await this.logRateLimitEvent(
        'CLEANUP_COMPLETED',
        'SYSTEM',
        {
          cleanupTime: now.toISOString()
        }
      );

    } catch (error) {
      console.error('Failed to cleanup expired data:', error);
      throw error;
    }
  }

  // Private helper methods

  /**
   * Generic rate limiting check
   */
  async checkRateLimit(
    identifier: string,
    type: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    // First check if identifier is blocked
    const block = await this.isIdentifierBlocked(identifier);
    if (block) {
      const retryAfter = Math.ceil((block.expiresAt.getTime() - Date.now()) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTime: block.expiresAt,
        retryAfter,
        isBlocked: true,
        blockExpiresAt: block.expiresAt
      };
    }

    // Check rate limit
    const windowStart = new Date(Date.now() - config.windowMs);
    const requests = await this.getRequestCount(identifier, type, windowStart);
    
    const remaining = Math.max(0, config.maxRequests - requests);
    const resetTime = new Date(Date.now() + config.windowMs);

    if (requests >= config.maxRequests) {
      // Log rate limit hit
      await this.logRateLimitHit(identifier, type);
      
      const retryAfter = Math.ceil(config.windowMs / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter,
        isBlocked: false
      };
    }

    return {
      allowed: true,
      remaining,
      resetTime,
      isBlocked: false
    };
  }

  /**
   * Get request count for rate limiting
   */
  private async getRequestCount(
    identifier: string,
    type: string,
    windowStart: Date
  ): Promise<number> {
    switch (type) {
      case 'OTP_GENERATION':
        if (!db) throw new Error("Database not initialized");
        return       await db.oTP.count({
          where: {
            identifier,
            createdAt: { gte: windowStart }
          }
        });
      
      case 'LOGIN_ATTEMPTS':
        if (!db) throw new Error("Database not initialized");
        return       await db.loginFailure.count({
          where: {
            identifier,
            createdAt: { gte: windowStart }
          }
        });
      
      default:
        return 0;
    }
  }

  /**
   * Log rate limit hit
   */
  private async logRateLimitHit(identifier: string, type: string): Promise<void> {
    try {
      if (!db) return;
      
      await db.rateLimitLog.create({
        data: {
          identifier,
          action: 'RATE_LIMIT_HIT',
          type,
          createdAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log rate limit hit:', error);
    }
  }

  /**
   * Log rate limiting events
   * Requirements: 14.5
   */
  private async logRateLimitEvent(
    action: string,
    identifier: string,
    details: Record<string, any>
  ): Promise<void> {
    try {
      // Use the dedicated rate limit logger
      await rateLimitLogger.logEvent(
        identifier,
        action,
        'RATE_LIMITING',
        details,
        details.ipAddress,
        details.userAgent
      );

    } catch (error) {
      console.error('Failed to log rate limit event:', error);
      // Don't throw to avoid breaking rate limiting flow
    }
  }
}

export const rateLimitingService = new RateLimitingService();