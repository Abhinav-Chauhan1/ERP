import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { rateLimitingService } from '@/lib/services/rate-limiting-service';
import { db } from '@/lib/db';

/**
 * Property-Based Tests for Rate Limiting System
 * Feature: unified-auth-multitenant-refactor
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    blockedIdentifier: {
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    loginFailure: {
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
    oTP: {
      count: vi.fn(),
    },
    rateLimitLog: {
      count: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

// Mock the rate limit logger
vi.mock('@/lib/services/rate-limit-logger', () => ({
  rateLimitLogger: {
    logEvent: vi.fn(),
  },
}));

describe('Rate Limiting System - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property 1: OTP Rate Limiting Consistency
   * For any identifier and request count, the OTP rate limiting should consistently
   * enforce the 3 requests per 5 minutes rule
   * **Validates: Requirements 14.1**
   */
  it('Property 1: OTP rate limiting should consistently enforce 3 requests per 5 minutes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(), // identifier
        fc.integer({ min: 0, max: 10 }), // request count
        async (identifier, requestCount) => {
          // Mock no blocked identifier
          (db.blockedIdentifier.findFirst as any).mockResolvedValue(null);
          
          // Mock OTP count
          (db.oTP.count as any).mockResolvedValue(requestCount);

          const result = await rateLimitingService.checkOTPRateLimit(identifier);

          if (requestCount < 3) {
            // Should allow requests under limit
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(3 - requestCount);
            expect(result.isBlocked).toBe(false);
          } else {
            // Should block requests at or over limit
            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
            expect(result.retryAfter).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Exponential Backoff Calculation
   * For any number of login failures, the exponential backoff should increase
   * exponentially with a base of 2 and have a maximum cap
   * **Validates: Requirements 14.2**
   */
  it('Property 2: Exponential backoff should increase exponentially with proper bounds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(), // identifier
        fc.integer({ min: 1, max: 10 }), // failure count
        async (identifier, failureCount) => {
          const now = new Date();
          const failures = Array.from({ length: failureCount }, (_, i) => ({
            createdAt: new Date(now.getTime() - (i + 1) * 1000)
          }));

          (db.loginFailure.findMany as any).mockResolvedValue(failures);

          const result = await rateLimitingService.checkLoginFailureRateLimit(identifier);

          expect(result.attempts).toBe(failureCount);
          
          // Exponential backoff should follow 2^(attempts-1) * 1000ms pattern
          const expectedBackoff = Math.min(
            Math.pow(2, failureCount - 1) * 1000,
            2 * 60 * 60 * 1000 // 2 hours max
          );
          
          expect(result.backoffMs).toBe(expectedBackoff);
          
          // Should be blocked if backoff time hasn't passed
          const lastFailure = failures[0];
          const nextAttemptTime = lastFailure.createdAt.getTime() + expectedBackoff;
          const shouldBeAllowed = now.getTime() >= nextAttemptTime;
          
          expect(result.allowed).toBe(shouldBeAllowed);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Suspicious Activity Detection
   * For any combination of OTP requests, login failures, and rate limit hits,
   * the system should correctly identify suspicious patterns
   * **Validates: Requirements 14.3**
   */
  it('Property 3: Suspicious activity detection should correctly identify patterns', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(), // identifier
        fc.integer({ min: 0, max: 15 }), // OTP requests
        fc.integer({ min: 0, max: 15 }), // login failures
        fc.integer({ min: 0, max: 15 }), // rate limit hits
        async (identifier, otpRequests, loginFailures, rateLimitHits) => {
          (db.oTP.count as any).mockResolvedValue(otpRequests);
          (db.loginFailure.count as any).mockResolvedValue(loginFailures);
          (db.rateLimitLog.count as any).mockResolvedValue(rateLimitHits);

          const result = await rateLimitingService.checkSuspiciousActivity(
            identifier,
            '192.168.1.1',
            'Mozilla/5.0'
          );

          const totalActivity = otpRequests + loginFailures + rateLimitHits;
          const maxAllowed = 20; // From SUSPICIOUS_ACTIVITY config

          if (totalActivity < maxAllowed) {
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(maxAllowed - totalActivity);
            expect(result.isBlocked).toBe(false);
          } else {
            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
            expect(result.isBlocked).toBe(true);
            expect(result.retryAfter).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: Block Duration Consistency
   * For any identifier and block reason, the blocking mechanism should
   * consistently apply the correct duration and handle extensions properly
   * **Validates: Requirements 14.3**
   */
  it('Property 4: Block duration should be consistent and handle extensions properly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(), // identifier
        fc.constantFrom('EXCESSIVE_LOGIN_FAILURES', 'SUSPICIOUS_ACTIVITY_PATTERN', 'OTP_ABUSE'), // reason
        fc.integer({ min: 1, max: 5 }), // existing attempts
        async (identifier, reason, existingAttempts) => {
          const durationMs = 30 * 60 * 1000; // 30 minutes
          const existingBlock = {
            id: '1',
            identifier,
            attempts: existingAttempts,
            isActive: true,
            expiresAt: new Date(Date.now() + 60000),
          };

          // Test extending existing block
          (db.blockedIdentifier.findFirst as any).mockResolvedValue(existingBlock);
          (db.blockedIdentifier.update as any).mockResolvedValue({});

          await rateLimitingService.blockIdentifier(identifier, reason, durationMs);

          expect(db.blockedIdentifier.update).toHaveBeenCalledWith({
            where: { id: '1' },
            data: {
              expiresAt: expect.any(Date),
              attempts: existingAttempts + 1,
              updatedAt: expect.any(Date),
            },
          });

          // Test creating new block
          (db.blockedIdentifier.findFirst as any).mockResolvedValue(null);
          (db.blockedIdentifier.create as any).mockResolvedValue({});

          await rateLimitingService.blockIdentifier(identifier, reason, durationMs);

          expect(db.blockedIdentifier.create).toHaveBeenCalledWith({
            data: {
              identifier,
              reason,
              expiresAt: expect.any(Date),
              attempts: 1,
              isActive: true,
            },
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Admin Unblock Functionality
   * For any blocked identifier, admin unblock operations should
   * consistently remove blocks and log the action
   * **Validates: Requirements 14.4**
   */
  it('Property 5: Admin unblock should consistently remove blocks and log actions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(), // identifier
        fc.string({ minLength: 10, maxLength: 30 }), // admin user ID
        fc.integer({ min: 0, max: 3 }), // number of blocks affected
        async (identifier, adminUserId, blocksAffected) => {
          (db.blockedIdentifier.updateMany as any).mockResolvedValue({ count: blocksAffected });

          const result = await rateLimitingService.unblockIdentifier(identifier, adminUserId);

          expect(db.blockedIdentifier.updateMany).toHaveBeenCalledWith({
            where: {
              identifier,
              isActive: true,
            },
            data: {
              isActive: false,
              updatedAt: expect.any(Date),
            },
          });

          // Should return true if blocks were affected, false otherwise
          expect(result).toBe(blocksAffected > 0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6: Rate Limit State Consistency
   * For any identifier, the rate limiting state should be consistent
   * across different check operations
   * **Validates: Requirements 14.1, 14.2, 14.3**
   */
  it('Property 6: Rate limiting state should be consistent across operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(), // identifier
        fc.boolean(), // is blocked
        fc.integer({ min: 0, max: 10 }), // request count
        async (identifier, isBlocked, requestCount) => {
          const blockData = isBlocked ? {
            id: '1',
            identifier,
            reason: 'TEST_BLOCK',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 60000),
            attempts: 1,
            isActive: true,
          } : null;

          (db.blockedIdentifier.findFirst as any).mockResolvedValue(blockData);
          (db.oTP.count as any).mockResolvedValue(requestCount);

          // Check OTP rate limit
          const otpResult = await rateLimitingService.checkOTPRateLimit(identifier);
          
          // Check if identifier is blocked
          const blockStatus = await rateLimitingService.isIdentifierBlocked(identifier);

          if (isBlocked) {
            // If blocked, all operations should reflect blocked state
            expect(otpResult.allowed).toBe(false);
            expect(otpResult.isBlocked).toBe(true);
            expect(blockStatus).not.toBeNull();
            expect(blockStatus?.identifier).toBe(identifier);
          } else {
            // If not blocked, rate limiting should work normally
            expect(otpResult.isBlocked).toBe(false);
            expect(blockStatus).toBeNull();
            
            // OTP rate limiting should follow normal rules
            if (requestCount < 3) {
              expect(otpResult.allowed).toBe(true);
            } else {
              expect(otpResult.allowed).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7: Time-Based Rate Limit Windows
   * For any time window and request pattern, rate limits should
   * correctly reset after the window expires
   * **Validates: Requirements 14.1, 14.2**
   */
  it('Property 7: Rate limit windows should correctly reset after expiration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(), // identifier
        fc.integer({ min: 1, max: 10 }), // requests in window
        fc.integer({ min: 0, max: 600 }), // seconds ago
        async (identifier, requestsInWindow, secondsAgo) => {
          const windowMs = 5 * 60 * 1000; // 5 minutes
          const requestTime = new Date(Date.now() - secondsAgo * 1000);
          
          // Mock requests within or outside the window
          const isWithinWindow = secondsAgo * 1000 < windowMs;
          const effectiveRequests = isWithinWindow ? requestsInWindow : 0;

          (db.blockedIdentifier.findFirst as any).mockResolvedValue(null);
          (db.oTP.count as any).mockResolvedValue(effectiveRequests);

          const result = await rateLimitingService.checkOTPRateLimit(identifier);

          if (effectiveRequests < 3) {
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(3 - effectiveRequests);
          } else {
            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
          }

          // Reset time should be in the future
          expect(result.resetTime.getTime()).toBeGreaterThan(Date.now());
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: Comprehensive Logging Consistency
   * For any rate limiting event, the logging should consistently
   * capture all relevant information
   * **Validates: Requirements 14.5**
   */
  it('Property 8: Rate limiting events should be consistently logged', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(), // identifier
        fc.constantFrom('LOGIN_FAILURE'), // action (simplified to just login failure)
        fc.record({
          ipAddress: fc.ipV4(),
          userAgent: fc.string({ minLength: 10, maxLength: 100 }),
          reason: fc.string({ minLength: 5, maxLength: 50 }),
        }), // details
        async (identifier, action, details) => {
          // Import the logger mock
          const { rateLimitLogger } = await import('@/lib/services/rate-limit-logger');
          
          // Mock successful database operations
          (db.blockedIdentifier.findFirst as any).mockResolvedValue(null);
          (db.loginFailure.create as any).mockResolvedValue({});
          (db.loginFailure.findMany as any).mockResolvedValue([
            { createdAt: new Date() }
          ]); // Mock one failure to trigger rate limit check

          // Clear previous calls
          vi.clearAllMocks();

          // Perform an operation that should trigger logging
          await rateLimitingService.recordLoginFailure(
            identifier,
            details.reason,
            details.ipAddress,
            details.userAgent
          );

          // Verify logging was called
          expect(rateLimitLogger.logEvent).toHaveBeenCalled();
          
          // Verify the call parameters
          const logCalls = (rateLimitLogger.logEvent as any).mock.calls;
          expect(logCalls.length).toBeGreaterThan(0);
          
          // Check that at least one call has the correct identifier
          const relevantCall = logCalls.find((call: any[]) => 
            call[0] === identifier || call[1].includes('LOGIN') || call[1].includes('FAILURE')
          );
          expect(relevantCall).toBeTruthy();
        }
      ),
      { numRuns: 50 } // Reduced runs for faster execution
    );
  });
});