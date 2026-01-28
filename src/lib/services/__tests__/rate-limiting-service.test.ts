import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { rateLimitingService, RATE_LIMIT_CONFIGS } from '../rate-limiting-service';
import { db } from '@/lib/db';

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
vi.mock('../rate-limit-logger', () => ({
  rateLimitLogger: {
    logEvent: vi.fn(),
  },
}));

describe('RateLimitingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkOTPRateLimit', () => {
    it('should allow OTP generation when under rate limit', async () => {
      // Mock no blocked identifier
      (db.blockedIdentifier.findFirst as any).mockResolvedValue(null);
      
      // Mock OTP count under limit
      (db.oTP.count as any).mockResolvedValue(2);

      const result = await rateLimitingService.checkOTPRateLimit('test@example.com');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1); // 3 - 2 = 1
      expect(result.isBlocked).toBe(false);
    });

    it('should block OTP generation when rate limit exceeded', async () => {
      // Mock no blocked identifier
      (db.blockedIdentifier.findFirst as any).mockResolvedValue(null);
      
      // Mock OTP count at limit
      (db.oTP.count as any).mockResolvedValue(3);

      const result = await rateLimitingService.checkOTPRateLimit('test@example.com');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.isBlocked).toBe(false);
    });

    it('should block when identifier is blocked', async () => {
      const blockedIdentifier = {
        id: '1',
        identifier: 'test@example.com',
        reason: 'EXCESSIVE_LOGIN_FAILURES',
        expiresAt: new Date(Date.now() + 60000),
        attempts: 5,
        isActive: true,
        createdAt: new Date(),
        blockedAt: new Date(),
      };

      (db.blockedIdentifier.findFirst as any).mockResolvedValue(blockedIdentifier);

      const result = await rateLimitingService.checkOTPRateLimit('test@example.com');

      expect(result.allowed).toBe(false);
      expect(result.isBlocked).toBe(true);
      expect(result.blockExpiresAt).toEqual(blockedIdentifier.expiresAt);
    });
  });

  describe('checkLoginFailureRateLimit', () => {
    it('should allow login when no previous failures', async () => {
      (db.loginFailure.findMany as any).mockResolvedValue([]);

      const result = await rateLimitingService.checkLoginFailureRateLimit('test@example.com');

      expect(result.allowed).toBe(true);
      expect(result.attempts).toBe(0);
      expect(result.backoffMs).toBe(0);
      expect(result.isBlocked).toBe(false);
    });

    it('should implement exponential backoff for repeated failures', async () => {
      const now = new Date();
      const failures = [
        { createdAt: new Date(now.getTime() - 1000) }, // 1 second ago
        { createdAt: new Date(now.getTime() - 2000) }, // 2 seconds ago
      ];

      (db.loginFailure.findMany as any).mockResolvedValue(failures);

      const result = await rateLimitingService.checkLoginFailureRateLimit('test@example.com');

      expect(result.attempts).toBe(2);
      expect(result.backoffMs).toBe(2000); // 2^(2-1) * 1000 = 2000ms
      expect(result.allowed).toBe(false); // Should be blocked due to recent failure
    });

    it('should block after maximum attempts', async () => {
      const now = new Date();
      const failures = Array.from({ length: 6 }, (_, i) => ({
        createdAt: new Date(now.getTime() - (i + 1) * 1000)
      }));

      (db.loginFailure.findMany as any).mockResolvedValue(failures);

      const result = await rateLimitingService.checkLoginFailureRateLimit('test@example.com');

      expect(result.attempts).toBe(6);
      expect(result.isBlocked).toBe(true);
    });
  });

  describe('recordLoginFailure', () => {
    it('should record login failure and check for blocking', async () => {
      (db.loginFailure.create as any).mockResolvedValue({});
      (db.loginFailure.findMany as any).mockResolvedValue([
        { createdAt: new Date() },
        { createdAt: new Date() },
        { createdAt: new Date() },
        { createdAt: new Date() },
        { createdAt: new Date() },
      ]);

      await rateLimitingService.recordLoginFailure(
        'test@example.com',
        'INVALID_CREDENTIALS',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(db.loginFailure.create).toHaveBeenCalledWith({
        data: {
          identifier: 'test@example.com',
          reason: 'INVALID_CREDENTIALS',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: expect.any(Date),
        },
      });
    });
  });

  describe('checkSuspiciousActivity', () => {
    it('should allow normal activity levels', async () => {
      (db.oTP.count as any).mockResolvedValue(2);
      (db.loginFailure.count as any).mockResolvedValue(1);
      (db.rateLimitLog.count as any).mockResolvedValue(1);

      const result = await rateLimitingService.checkSuspiciousActivity(
        'test@example.com',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(16); // 20 - 4 = 16
      expect(result.isBlocked).toBe(false);
    });

    it('should block suspicious activity patterns', async () => {
      (db.oTP.count as any).mockResolvedValue(10);
      (db.loginFailure.count as any).mockResolvedValue(8);
      (db.rateLimitLog.count as any).mockResolvedValue(5);

      const result = await rateLimitingService.checkSuspiciousActivity(
        'test@example.com',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(result.allowed).toBe(false);
      expect(result.isBlocked).toBe(true);
      expect(result.retryAfter).toBeGreaterThan(0);
    });
  });

  describe('blockIdentifier', () => {
    it('should create new block for identifier', async () => {
      (db.blockedIdentifier.findFirst as any).mockResolvedValue(null);
      (db.blockedIdentifier.create as any).mockResolvedValue({});

      await rateLimitingService.blockIdentifier(
        'test@example.com',
        'EXCESSIVE_LOGIN_FAILURES',
        30 * 60 * 1000 // 30 minutes
      );

      expect(db.blockedIdentifier.create).toHaveBeenCalledWith({
        data: {
          identifier: 'test@example.com',
          reason: 'EXCESSIVE_LOGIN_FAILURES',
          expiresAt: expect.any(Date),
          attempts: 1,
          isActive: true,
        },
      });
    });

    it('should extend existing block', async () => {
      const existingBlock = {
        id: '1',
        identifier: 'test@example.com',
        attempts: 2,
        isActive: true,
        expiresAt: new Date(Date.now() + 60000),
      };

      (db.blockedIdentifier.findFirst as any).mockResolvedValue(existingBlock);
      (db.blockedIdentifier.update as any).mockResolvedValue({});

      await rateLimitingService.blockIdentifier(
        'test@example.com',
        'EXCESSIVE_LOGIN_FAILURES',
        30 * 60 * 1000
      );

      expect(db.blockedIdentifier.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          expiresAt: expect.any(Date),
          attempts: 3,
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('isIdentifierBlocked', () => {
    it('should return null for non-blocked identifier', async () => {
      (db.blockedIdentifier.findFirst as any).mockResolvedValue(null);

      const result = await rateLimitingService.isIdentifierBlocked('test@example.com');

      expect(result).toBeNull();
    });

    it('should return block details for blocked identifier', async () => {
      const block = {
        id: '1',
        identifier: 'test@example.com',
        reason: 'EXCESSIVE_LOGIN_FAILURES',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
        attempts: 3,
        isActive: true,
      };

      (db.blockedIdentifier.findFirst as any).mockResolvedValue(block);

      const result = await rateLimitingService.isIdentifierBlocked('test@example.com');

      expect(result).toEqual({
        id: '1',
        identifier: 'test@example.com',
        reason: 'EXCESSIVE_LOGIN_FAILURES',
        blockedAt: block.createdAt,
        expiresAt: block.expiresAt,
        attempts: 3,
        isActive: true,
      });
    });
  });

  describe('unblockIdentifier', () => {
    it('should unblock identifier successfully', async () => {
      (db.blockedIdentifier.updateMany as any).mockResolvedValue({ count: 1 });

      const result = await rateLimitingService.unblockIdentifier(
        'test@example.com',
        'admin-user-id'
      );

      expect(result).toBe(true);
      expect(db.blockedIdentifier.updateMany).toHaveBeenCalledWith({
        where: {
          identifier: 'test@example.com',
          isActive: true,
        },
        data: {
          isActive: false,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should return false when no blocks found', async () => {
      (db.blockedIdentifier.updateMany as any).mockResolvedValue({ count: 0 });

      const result = await rateLimitingService.unblockIdentifier(
        'test@example.com',
        'admin-user-id'
      );

      expect(result).toBe(false);
    });
  });

  describe('getBlockedIdentifiers', () => {
    it('should return paginated blocked identifiers', async () => {
      const mockIdentifiers = [
        {
          id: '1',
          identifier: 'test1@example.com',
          reason: 'EXCESSIVE_LOGIN_FAILURES',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 60000),
          attempts: 3,
          isActive: true,
        },
        {
          id: '2',
          identifier: 'test2@example.com',
          reason: 'SUSPICIOUS_ACTIVITY_PATTERN',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 120000),
          attempts: 1,
          isActive: true,
        },
      ];

      (db.blockedIdentifier.findMany as any).mockResolvedValue(mockIdentifiers);
      (db.blockedIdentifier.count as any).mockResolvedValue(2);

      const result = await rateLimitingService.getBlockedIdentifiers(10, 0);

      expect(result.identifiers).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('cleanupExpiredData', () => {
    it('should clean up expired data', async () => {
      (db.blockedIdentifier.updateMany as any).mockResolvedValue({ count: 5 });
      (db.loginFailure.deleteMany as any).mockResolvedValue({ count: 10 });
      (db.rateLimitLog.deleteMany as any).mockResolvedValue({ count: 15 });

      await rateLimitingService.cleanupExpiredData();

      expect(db.blockedIdentifier.updateMany).toHaveBeenCalled();
      expect(db.loginFailure.deleteMany).toHaveBeenCalled();
      expect(db.rateLimitLog.deleteMany).toHaveBeenCalled();
    });
  });
});

describe('Rate Limit Configurations', () => {
  it('should have correct OTP generation limits', () => {
    const config = RATE_LIMIT_CONFIGS.OTP_GENERATION;
    
    expect(config.windowMs).toBe(5 * 60 * 1000); // 5 minutes
    expect(config.maxRequests).toBe(3);
    expect(config.blockDurationMs).toBe(15 * 60 * 1000); // 15 minutes
  });

  it('should have correct login attempt limits', () => {
    const config = RATE_LIMIT_CONFIGS.LOGIN_ATTEMPTS;
    
    expect(config.windowMs).toBe(15 * 60 * 1000); // 15 minutes
    expect(config.maxRequests).toBe(5);
    expect(config.blockDurationMs).toBe(30 * 60 * 1000); // 30 minutes
  });

  it('should have correct suspicious activity limits', () => {
    const config = RATE_LIMIT_CONFIGS.SUSPICIOUS_ACTIVITY;
    
    expect(config.windowMs).toBe(60 * 60 * 1000); // 1 hour
    expect(config.maxRequests).toBe(20);
    expect(config.blockDurationMs).toBe(24 * 60 * 60 * 1000); // 24 hours
  });
});