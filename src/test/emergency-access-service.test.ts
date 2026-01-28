import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { emergencyAccessService } from '@/lib/services/emergency-access-service';
import { db } from '@/lib/db';
import { UserRole, SchoolStatus } from '@prisma/client';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    userSchool: {
      updateMany: vi.fn(),
    },
    school: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    authSession: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    emergencyAccess: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth/tenant', () => ({
  requireSuperAdminAccess: vi.fn(),
}));

vi.mock('@/lib/services/audit-service', () => ({
  logAuditEvent: vi.fn(),
}));

vi.mock('@/lib/services/school-context-service', () => ({
  schoolContextService: {
    invalidateSchoolSessions: vi.fn().mockResolvedValue({
      invalidatedSessions: 5,
      affectedUsers: 10,
    }),
  },
}));

vi.mock('@/lib/services/jwt-service', () => ({
  jwtService: {
    revokeToken: vi.fn(),
  },
}));

describe('EmergencyAccessService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('emergencyDisableUser', () => {
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      mobile: '+1234567890',
      userSchools: [
        {
          schoolId: 'school-123',
          role: UserRole.STUDENT,
          school: {
            name: 'Test School',
            schoolCode: 'TEST001',
          },
        },
      ],
    };

    const mockRequest = {
      reason: 'Security breach - immediate action required',
      revokeActiveSessions: true,
      notifyUsers: false,
      preventNewLogins: true,
    };

    it('should successfully disable a user account', async () => {
      // Setup mocks
      (db.user.findUnique as any).mockResolvedValue(mockUser);
      (db.user.update as any).mockResolvedValue({ ...mockUser, isActive: false });
      (db.userSchool.updateMany as any).mockResolvedValue({ count: 1 });
      (db.authSession.findMany as any).mockResolvedValue([
        { id: 'session-1', token: 'token-1' },
        { id: 'session-2', token: 'token-2' },
      ]);
      (db.authSession.updateMany as any).mockResolvedValue({ count: 2 });
      (db.emergencyAccess.create as any).mockResolvedValue({
        id: 'emergency-123',
        targetType: 'USER',
        targetId: 'user-123',
      });

      const result = await emergencyAccessService.emergencyDisableUser(
        'user-123',
        mockRequest,
        'super-admin-123'
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('Test User has been emergency disabled');
      expect(result.affectedUsers).toBe(1);
      expect(result.invalidatedSessions).toBe(2);

      // Verify database calls
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: {
          userSchools: {
            include: {
              school: {
                select: { name: true, schoolCode: true },
              },
            },
          },
        },
      });

      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          isActive: false,
          updatedAt: expect.any(Date),
        },
      });

      expect(db.userSchool.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        data: { isActive: false },
      });

      expect(db.emergencyAccess.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          targetType: 'USER',
          targetId: 'user-123',
          targetName: 'Test User',
          action: 'DISABLE',
          reason: mockRequest.reason,
          performedBy: 'super-admin-123',
          affectedUsers: 1,
          invalidatedSessions: 2,
        }),
      });
    });

    it('should prevent disabling super admin users', async () => {
      const superAdminUser = {
        ...mockUser,
        userSchools: [
          {
            schoolId: 'school-123',
            role: UserRole.SUPER_ADMIN,
            school: {
              name: 'Test School',
              schoolCode: 'TEST001',
            },
          },
        ],
      };

      (db.user.findUnique as any).mockResolvedValue(superAdminUser);

      const result = await emergencyAccessService.emergencyDisableUser(
        'user-123',
        mockRequest,
        'super-admin-123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('SUPER_ADMIN_PROTECTION');
      expect(result.message).toContain('Cannot emergency disable super admin users');

      // Verify user was not updated
      expect(db.user.update).not.toHaveBeenCalled();
    });

    it('should handle user not found', async () => {
      (db.user.findUnique as any).mockResolvedValue(null);

      const result = await emergencyAccessService.emergencyDisableUser(
        'nonexistent-user',
        mockRequest,
        'super-admin-123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('USER_NOT_FOUND');
      expect(result.message).toBe('User not found');
    });

    it('should handle database errors gracefully', async () => {
      (db.user.findUnique as any).mockRejectedValue(new Error('Database connection failed'));

      const result = await emergencyAccessService.emergencyDisableUser(
        'user-123',
        mockRequest,
        'super-admin-123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('SYSTEM_ERROR');
      expect(result.message).toBe('Failed to emergency disable user');
    });
  });

  describe('emergencyDisableSchool', () => {
    const mockSchool = {
      id: 'school-123',
      name: 'Test School',
      schoolCode: 'TEST001',
      plan: 'PREMIUM',
      status: SchoolStatus.ACTIVE,
      userSchools: [
        {
          user: {
            id: 'user-1',
            name: 'User 1',
            email: 'user1@example.com',
          },
          role: UserRole.STUDENT,
        },
        {
          user: {
            id: 'user-2',
            name: 'User 2',
            email: 'user2@example.com',
          },
          role: UserRole.TEACHER,
        },
      ],
    };

    const mockRequest = {
      reason: 'Policy violation - immediate suspension required',
      revokeActiveSessions: true,
      notifyUsers: false,
      preventNewLogins: true,
    };

    it('should successfully disable a school account', async () => {
      // Setup mocks
      (db.school.findUnique as any).mockResolvedValue(mockSchool);
      (db.school.update as any).mockResolvedValue({ ...mockSchool, status: SchoolStatus.SUSPENDED });
      (db.userSchool.updateMany as any).mockResolvedValue({ count: 2 });
      (db.emergencyAccess.create as any).mockResolvedValue({
        id: 'emergency-456',
        targetType: 'SCHOOL',
        targetId: 'school-123',
      });

      const result = await emergencyAccessService.emergencyDisableSchool(
        'school-123',
        mockRequest,
        'super-admin-123'
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('Test School has been emergency disabled');
      expect(result.affectedUsers).toBe(2);
      expect(result.invalidatedSessions).toBe(5); // From mocked schoolContextService

      // Verify database calls
      expect(db.school.update).toHaveBeenCalledWith({
        where: { id: 'school-123' },
        data: {
          status: SchoolStatus.SUSPENDED,
          updatedAt: expect.any(Date),
        },
      });

      expect(db.userSchool.updateMany).toHaveBeenCalledWith({
        where: { schoolId: 'school-123' },
        data: { isActive: false },
      });
    });

    it('should prevent disabling already suspended schools', async () => {
      const suspendedSchool = {
        ...mockSchool,
        status: SchoolStatus.SUSPENDED,
      };

      (db.school.findUnique as any).mockResolvedValue(suspendedSchool);

      const result = await emergencyAccessService.emergencyDisableSchool(
        'school-123',
        mockRequest,
        'super-admin-123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('ALREADY_SUSPENDED');
      expect(result.message).toBe('School is already suspended');

      // Verify school was not updated
      expect(db.school.update).not.toHaveBeenCalled();
    });

    it('should handle school not found', async () => {
      (db.school.findUnique as any).mockResolvedValue(null);

      const result = await emergencyAccessService.emergencyDisableSchool(
        'nonexistent-school',
        mockRequest,
        'super-admin-123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('SCHOOL_NOT_FOUND');
      expect(result.message).toBe('School not found');
    });
  });

  describe('emergencyEnableUser', () => {
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      isActive: false,
    };

    it('should successfully enable a disabled user account', async () => {
      (db.user.findUnique as any).mockResolvedValue(mockUser);
      (db.user.update as any).mockResolvedValue({ ...mockUser, isActive: true });
      (db.userSchool.updateMany as any).mockResolvedValue({ count: 1 });
      (db.emergencyAccess.findFirst as any).mockResolvedValue({
        id: 'emergency-123',
        targetType: 'USER',
        targetId: 'user-123',
      });
      (db.emergencyAccess.update as any).mockResolvedValue({});
      (db.emergencyAccess.create as any).mockResolvedValue({});

      const result = await emergencyAccessService.emergencyEnableUser(
        'user-123',
        'Issue resolved - re-enabling account',
        'super-admin-123'
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('Test User has been emergency enabled');
      expect(result.affectedUsers).toBe(1);

      // Verify database calls
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          isActive: true,
          updatedAt: expect.any(Date),
        },
      });

      expect(db.userSchool.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        data: { isActive: true },
      });
    });

    it('should prevent enabling already active users', async () => {
      const activeUser = {
        ...mockUser,
        isActive: true,
      };

      (db.user.findUnique as any).mockResolvedValue(activeUser);

      const result = await emergencyAccessService.emergencyEnableUser(
        'user-123',
        'Issue resolved - re-enabling account',
        'super-admin-123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('ALREADY_ACTIVE');
      expect(result.message).toBe('User is already active');

      // Verify user was not updated
      expect(db.user.update).not.toHaveBeenCalled();
    });
  });

  describe('getEmergencyAccessStats', () => {
    it('should return comprehensive emergency access statistics', async () => {
      // Setup mocks
      (db.emergencyAccess.count as any)
        .mockResolvedValueOnce(25) // total actions
        .mockResolvedValueOnce(5)  // active disabled accounts
        .mockResolvedValueOnce(3); // recent actions

      (db.emergencyAccess.groupBy as any).mockResolvedValue([
        { reason: 'Security breach', _count: { reason: 8 } },
        { reason: 'Policy violation', _count: { reason: 5 } },
        { reason: 'Suspicious activity', _count: { reason: 3 } },
      ]);

      const stats = await emergencyAccessService.getEmergencyAccessStats();

      expect(stats.totalEmergencyActions).toBe(25);
      expect(stats.activeDisabledAccounts).toBe(5);
      expect(stats.recentActions).toBe(3);
      expect(stats.topReasons).toHaveLength(3);
      expect(stats.topReasons[0]).toEqual({
        reason: 'Security breach',
        count: 8,
      });
    });
  });

  describe('isEmergencyDisabled', () => {
    it('should return disabled status for emergency disabled account', async () => {
      const mockRecord = {
        reason: 'Security breach',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        disabledUntil: new Date('2024-01-02T10:00:00Z'),
        performedByUser: {
          name: 'Super Admin',
        },
      };

      (db.emergencyAccess.findFirst as any).mockResolvedValue(mockRecord);

      const result = await emergencyAccessService.isEmergencyDisabled('USER', 'user-123');

      expect(result.isDisabled).toBe(true);
      expect(result.reason).toBe('Security breach');
      expect(result.disabledAt).toEqual(mockRecord.createdAt);
      expect(result.disabledUntil).toEqual(mockRecord.disabledUntil);
      expect(result.performedBy).toBe('Super Admin');
    });

    it('should return not disabled status for active account', async () => {
      (db.emergencyAccess.findFirst as any).mockResolvedValue(null);

      const result = await emergencyAccessService.isEmergencyDisabled('USER', 'user-123');

      expect(result.isDisabled).toBe(false);
      expect(result.reason).toBeUndefined();
      expect(result.disabledAt).toBeUndefined();
      expect(result.disabledUntil).toBeUndefined();
      expect(result.performedBy).toBeUndefined();
    });
  });

  describe('getEmergencyAccessHistory', () => {
    it('should return filtered emergency access history', async () => {
      const mockHistory = [
        {
          id: 'emergency-1',
          targetType: 'USER',
          targetId: 'user-123',
          targetName: 'Test User',
          action: 'DISABLE',
          reason: 'Security breach',
          performedBy: 'super-admin-123',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          disabledUntil: null,
          affectedUsers: 1,
          invalidatedSessions: 2,
          isReversed: false,
          reversedAt: null,
          reversedBy: null,
          reversedReason: null,
          performedByUser: {
            name: 'Super Admin',
            email: 'admin@example.com',
          },
          reversedByUser: null,
        },
      ];

      (db.emergencyAccess.count as any).mockResolvedValue(1);
      (db.emergencyAccess.findMany as any).mockResolvedValue(mockHistory);

      const result = await emergencyAccessService.getEmergencyAccessHistory({
        targetType: 'USER',
        limit: 10,
        offset: 0,
      });

      expect(result.total).toBe(1);
      expect(result.history).toHaveLength(1);
      expect(result.hasMore).toBe(false);
      expect(result.history[0]).toEqual(expect.objectContaining({
        id: 'emergency-1',
        targetType: 'USER',
        targetId: 'user-123',
        targetName: 'Test User',
        action: 'DISABLE',
        reason: 'Security breach',
        performedBy: 'super-admin-123',
        performedByName: 'Super Admin',
        affectedUsers: 1,
        invalidatedSessions: 2,
        isReversed: false,
      }));
    });
  });
});

/**
 * Integration Tests for Emergency Access Service
 * Tests the service with real database interactions
 */
describe('EmergencyAccessService Integration', () => {
  // These tests would run against a test database
  // and verify the complete flow including database operations

  it.skip('should perform complete emergency disable flow', async () => {
    // This would be implemented with a test database
    // and would verify the entire emergency disable process
  });

  it.skip('should maintain audit trail integrity', async () => {
    // This would verify that all emergency actions
    // are properly logged in the audit trail
  });

  it.skip('should handle concurrent emergency actions', async () => {
    // This would test race conditions and concurrent
    // emergency actions on the same account
  });
});