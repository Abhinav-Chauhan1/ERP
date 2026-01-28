import { db } from "@/lib/db";
import { logAuditEvent } from "./audit-service";
import { rateLimitLogger } from "./rate-limit-logger";

/**
 * Rate Limiting Service
 * Implements comprehensive rate limiting and abuse protection for authentication.
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */

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

class RateLimitingService {
  /**
   * Check OTP rate limiting for identifier
   * Requirements: 14.1
   */
  async checkOTPRateLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkRateLimit(identifier, 'OTP_GENERATION', RATE_LIMIT_CONFIGS.OTP_GENERATION);
  }

  /**
   * Check login failure rate limiting with exponential backoff
   * Requirements: 14.2
   */
  async checkLoginFailureRateLimit(identifier: string): Promise<LoginFailureResult> {
    const config = RATE_LIMIT_CONFIGS.LOGIN_ATTEMPTS;
    
    // Get recent login failures
    const windowStart = new Date(Date.now() - config.windowMs);
    const failures = await db.loginFailure.findMany({
      where: {
        identifier,
        createdAt: { gte: windowStart }
      },
      orderBy: { createdAt: 'desc' }
    });

    const attempts = failures.length;
    
    if (attempts === 0) {
      return {
        allowed: true,
        backoffMs: 0,
        attempts: 0,
        nextAttemptAt: new Date(),
        isBlocked: false
      };
    }

    // Calculate exponential backoff
    const backoffMs = Math.min(
      Math.pow(config.exponentialBackoffBase, attempts - 1) * 1000,
      config.maxBackoffMs
    );

    const lastFailure = failures[0];
    const nextAttemptAt = new Date(lastFailure.createdAt.getTime() + backoffMs);
    const now = new Date();

    const allowed = now >= nextAttemptAt;
    const isBlocked = attempts >= config.maxRequests && !allowed;

    return {
      allowed,
      backoffMs,
      attempts,
      nextAttemptAt,
      isBlocked
    };
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
    try {
      // Record the failure
      await db.loginFailure.create({
        data: {
          identifier,
          reason,
          ipAddress,
          userAgent,
          createdAt: new Date()
        }
      });

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
      await this.logRateLimitEvent(
        'LOGIN_FAILURE_RECORDED',
        identifier,
        {
          reason,
          attempts: rateLimit.attempts,
          backoffMs: rateLimit.backoffMs,
          ipAddress,
          userAgent
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
      const recentAttempts = await db.rateLimitLog.count({
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
      const recentAttempts = await db.rateLimitLog.count({
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
      const existingBlock = await db.blockedIdentifier.findFirst({
        where: {
          identifier,
          isActive: true,
          expiresAt: { gt: new Date() }
        }
      });

      if (existingBlock) {
        // Extend the existing block
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
    const block = await db.blockedIdentifier.findFirst({
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
      const result = await db.blockedIdentifier.updateMany({
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
  private async checkRateLimit(
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
        return await db.oTP.count({
          where: {
            identifier,
            createdAt: { gte: windowStart }
          }
        });
      
      case 'LOGIN_ATTEMPTS':
        return await db.loginFailure.count({
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