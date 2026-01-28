import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { rateLimitingService } from '@/lib/services/rate-limiting-service';
import { authenticationService } from '@/lib/services/authentication-service';
import { otpService } from '@/lib/services/otp-service';
import { db } from '@/lib/db';

/**
 * Integration Tests for Rate Limiting System
 * Tests the complete rate limiting flow with authentication
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
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    rateLimitLog: {
      count: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    userSchool: {
      findFirst: vi.fn(),
    },
    school: {
      findUnique: vi.fn(),
    },
    authSession: {
      create: vi.fn(),
    },
    student: {
      findMany: vi.fn(),
    },
  },
}));

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
  compare: vi.fn(),
  hash: vi.fn(),
}));
vi.mock('@/lib/services/school-context-service', () => ({
  schoolContextService: {
    validateSchoolById: vi.fn().mockResolvedValue({ id: 'school1', name: 'Test School' }),
    validateSchoolAccess: vi.fn().mockResolvedValue(true),
    getUserSchools: vi.fn().mockResolvedValue([{ id: 'school1', name: 'Test School' }]),
    getUserSchoolIds: vi.fn().mockResolvedValue(['school1']),
  },
}));

vi.mock('@/lib/services/jwt-service', () => ({
  jwtService: {
    createToken: vi.fn().mockReturnValue('mock-jwt-token'),
  },
}));

vi.mock('@/lib/services/audit-service', () => ({
  logAuditEvent: vi.fn(),
}));

vi.mock('@/lib/services/rate-limit-logger', () => ({
  rateLimitLogger: {
    logEvent: vi.fn(),
  },
}));

describe('Rate Limiting Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('OTP Rate Limiting Integration', () => {
    it('should enforce OTP rate limiting across multiple requests', async () => {
      const identifier = 'test@example.com';

      // Mock no blocked identifier initially
      (db.blockedIdentifier.findFirst as any).mockResolvedValue(null);
      
      // Mock OTP creation
      (db.oTP.create as any).mockResolvedValue({});
      (db.oTP.deleteMany as any).mockResolvedValue({});

      // First 3 requests should succeed
      for (let i = 0; i < 3; i++) {
        (db.oTP.count as any).mockResolvedValue(i);
        const result = await otpService.generateOTP(identifier);
        expect(result.success).toBe(true);
      }

      // 4th request should fail due to rate limiting
      (db.oTP.count as any).mockResolvedValue(3);
      const result = await otpService.generateOTP(identifier);
      expect(result.success).toBe(false);
      expect(result.error).toBe('RATE_LIMITED');
    });

    it('should block identifier after excessive OTP requests', async () => {
      const identifier = 'test@example.com';

      // Mock no blocked identifier initially
      (db.blockedIdentifier.findFirst as any).mockResolvedValue(null);
      
      // Mock excessive OTP requests
      (db.oTP.count as any).mockResolvedValue(10);
      (db.loginFailure.count as any).mockResolvedValue(5);
      (db.rateLimitLog.count as any).mockResolvedValue(8);

      // Check suspicious activity
      const result = await rateLimitingService.checkSuspiciousActivity(identifier);
      
      expect(result.allowed).toBe(false);
      expect(result.isBlocked).toBe(true);
      expect(db.blockedIdentifier.create).toHaveBeenCalled();
    });
  });

  describe('Login Failure Rate Limiting Integration', () => {
    it('should implement exponential backoff for login failures', async () => {
      const identifier = 'test@example.com';
      const schoolId = 'school1';

      // Mock user and school data
      (db.user.findFirst as any).mockResolvedValue({
        id: 'user1',
        name: 'Test User',
        mobile: identifier,
        passwordHash: 'hashed-password',
      });

      (db.userSchool.findFirst as any).mockResolvedValue({
        userId: 'user1',
        schoolId,
        role: 'STUDENT',
      });

      // Mock no blocked identifier initially
      (db.blockedIdentifier.findFirst as any).mockResolvedValue(null);

      // Mock login failures
      const now = new Date();
      const failures = [
        { createdAt: new Date(now.getTime() - 1000) }, // 1 second ago
        { createdAt: new Date(now.getTime() - 2000) }, // 2 seconds ago
      ];

      (db.loginFailure.findMany as any).mockResolvedValue(failures);
      (db.loginFailure.create as any).mockResolvedValue({});

      // Check rate limiting
      const rateLimitResult = await rateLimitingService.checkLoginFailureRateLimit(identifier);
      
      expect(rateLimitResult.attempts).toBe(2);
      expect(rateLimitResult.backoffMs).toBe(2000); // 2^(2-1) * 1000
      expect(rateLimitResult.allowed).toBe(false);

      // Try authentication - should fail due to rate limiting
      const authResult = await authenticationService.authenticateUser(
        identifier,
        schoolId,
        { type: 'otp', value: '123456' },
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(authResult.success).toBe(false);
      expect(authResult.error).toContain('Too many login attempts');
    });

    it('should block identifier after maximum login failures', async () => {
      const identifier = 'test@example.com';

      // Mock excessive login failures
      const failures = Array.from({ length: 6 }, (_, i) => ({
        createdAt: new Date(Date.now() - (i + 1) * 1000)
      }));

      (db.loginFailure.findMany as any).mockResolvedValue(failures);
      (db.loginFailure.create as any).mockResolvedValue({});
      (db.blockedIdentifier.create as any).mockResolvedValue({});

      // Record another failure
      await rateLimitingService.recordLoginFailure(
        identifier,
        'INVALID_CREDENTIALS',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      // Should create a block
      expect(db.blockedIdentifier.create).toHaveBeenCalledWith({
        data: {
          identifier,
          reason: 'EXCESSIVE_LOGIN_FAILURES',
          expiresAt: expect.any(Date),
          attempts: 1,
          isActive: true,
        },
      });
    });
  });

  describe('Suspicious Activity Detection Integration', () => {
    it('should detect and block suspicious activity patterns', async () => {
      const identifier = 'test@example.com';

      // Mock high activity levels
      (db.oTP.count as any).mockResolvedValue(8);
      (db.loginFailure.count as any).mockResolvedValue(7);
      (db.rateLimitLog.count as any).mockResolvedValue(6);
      (db.blockedIdentifier.create as any).mockResolvedValue({});

      const result = await rateLimitingService.checkSuspiciousActivity(
        identifier,
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(result.allowed).toBe(false);
      expect(result.isBlocked).toBe(true);
      expect(db.blockedIdentifier.create).toHaveBeenCalledWith({
        data: {
          identifier,
          reason: 'SUSPICIOUS_ACTIVITY_PATTERN',
          expiresAt: expect.any(Date),
          attempts: 1,
          isActive: true,
        },
      });
    });
  });

  describe('Admin Management Integration', () => {
    it('should allow admin to unblock identifiers', async () => {
      const identifier = 'test@example.com';
      const adminUserId = 'admin1';

      (db.blockedIdentifier.updateMany as any).mockResolvedValue({ count: 1 });

      const result = await rateLimitingService.unblockIdentifier(identifier, adminUserId);

      expect(result).toBe(true);
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
    });

    it('should provide blocked identifiers list for admin', async () => {
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
      expect(result.identifiers[0].identifier).toBe('test1@example.com');
      expect(result.identifiers[1].identifier).toBe('test2@example.com');
    });
  });

  describe('Cleanup Integration', () => {
    it('should clean up expired data', async () => {
      (db.blockedIdentifier.updateMany as any).mockResolvedValue({ count: 5 });
      (db.loginFailure.deleteMany as any).mockResolvedValue({ count: 10 });
      (db.rateLimitLog.deleteMany as any).mockResolvedValue({ count: 15 });

      await rateLimitingService.cleanupExpiredData();

      // Should deactivate expired blocks
      expect(db.blockedIdentifier.updateMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          expiresAt: { lte: expect.any(Date) },
        },
        data: {
          isActive: false,
          updatedAt: expect.any(Date),
        },
      });

      // Should delete old login failures
      expect(db.loginFailure.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: { lte: expect.any(Date) },
        },
      });

      // Should delete old rate limit logs
      expect(db.rateLimitLog.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: { lte: expect.any(Date) },
        },
      });
    });
  });

  describe('End-to-End Authentication with Rate Limiting', () => {
    it('should integrate rate limiting with complete authentication flow', async () => {
      const identifier = 'test@example.com';
      const schoolId = 'school1';

      // Mock user and school data
      (db.user.findFirst as any).mockResolvedValue({
        id: 'user1',
        name: 'Test User',
        mobile: identifier,
        passwordHash: 'hashed-password',
      });

      (db.userSchool.findFirst as any).mockResolvedValue({
        userId: 'user1',
        schoolId,
        role: 'STUDENT',
      });

      (db.student.findMany as any).mockResolvedValue([]);
      (db.authSession.create as any).mockResolvedValue({});

      // Mock no rate limiting issues
      (db.blockedIdentifier.findFirst as any).mockResolvedValue(null);
      (db.loginFailure.findMany as any).mockResolvedValue([]);
      (db.oTP.count as any).mockResolvedValue(0);
      (db.rateLimitLog.count as any).mockResolvedValue(0);

      // Mock OTP verification
      (db.oTP.findFirst as any).mockResolvedValue({
        id: 'otp1',
        codeHash: 'hashed-otp',
        expiresAt: new Date(Date.now() + 60000),
        attempts: 0,
        isUsed: false,
      });

      (db.oTP.update as any).mockResolvedValue({});

      // Mock bcrypt for OTP verification
      const bcrypt = await import('bcryptjs');
      (bcrypt.compare as any).mockResolvedValue(true);

      // Attempt authentication
      const authResult = await authenticationService.authenticateUser(
        identifier,
        schoolId,
        { type: 'otp', value: '123456' },
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(authResult.success).toBe(true);
      expect(authResult.user?.id).toBe('user1');
      expect(authResult.token).toBe('mock-jwt-token');
    });

    it('should block authentication when identifier is blocked', async () => {
      const identifier = 'blocked@example.com';
      const schoolId = 'school1';

      // Mock blocked identifier
      const blockedIdentifier = {
        id: '1',
        identifier,
        reason: 'EXCESSIVE_LOGIN_FAILURES',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
        attempts: 5,
        isActive: true,
      };

      (db.blockedIdentifier.findFirst as any).mockResolvedValue(blockedIdentifier);

      // Attempt authentication
      const authResult = await authenticationService.authenticateUser(
        identifier,
        schoolId,
        { type: 'otp', value: '123456' },
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(authResult.success).toBe(false);
      expect(authResult.error).toContain('Access blocked');
      expect(authResult.error).toContain('EXCESSIVE_LOGIN_FAILURES');
    });
  });
});