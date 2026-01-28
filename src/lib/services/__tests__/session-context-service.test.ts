import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sessionContextService } from '../session-context-service';
import { db } from '@/lib/db';
import { UserRole, SchoolStatus } from '@prisma/client';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    authSession: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    userSchool: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    parent: {
      findFirst: vi.fn(),
    },
    studentParent: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

// Mock the audit service
vi.mock('../audit-service', () => ({
  logAuditEvent: vi.fn(),
}));

describe('SessionContextService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSessionContext', () => {
    it('should return null for invalid token', async () => {
      (db.authSession.findUnique as any).mockResolvedValue(null);

      const result = await sessionContextService.getSessionContext('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null for expired session', async () => {
      const expiredSession = {
        id: 'session-1',
        userId: 'user-1',
        token: 'valid-token',
        activeSchoolId: 'school-1',
        expiresAt: new Date(Date.now() - 1000), // Expired
        user: {
          userSchools: [
            {
              schoolId: 'school-1',
              role: UserRole.STUDENT,
              school: { status: SchoolStatus.ACTIVE }
            }
          ]
        }
      };

      (db.authSession.findUnique as any).mockResolvedValue(expiredSession);

      const result = await sessionContextService.getSessionContext('valid-token');

      expect(result).toBeNull();
    });

    it('should return session context for valid token', async () => {
      const validSession = {
        id: 'session-1',
        userId: 'user-1',
        token: 'valid-token',
        activeSchoolId: 'school-1',
        expiresAt: new Date(Date.now() + 3600000), // Valid for 1 hour
        user: {
          userSchools: [
            {
              schoolId: 'school-1',
              role: UserRole.STUDENT,
              school: { status: SchoolStatus.ACTIVE }
            }
          ]
        }
      };

      (db.authSession.findUnique as any).mockResolvedValue(validSession);

      const result = await sessionContextService.getSessionContext('valid-token');

      expect(result).toEqual({
        userId: 'user-1',
        activeSchoolId: 'school-1',
        activeStudentId: undefined,
        role: UserRole.STUDENT,
        token: 'valid-token'
      });
    });
  });

  describe('getUserSchools', () => {
    it('should return empty array when user has no schools', async () => {
      (db.userSchool.findMany as any).mockResolvedValue([]);

      const result = await sessionContextService.getUserSchools('user-1');

      expect(result).toEqual([]);
    });

    it('should return user schools', async () => {
      const userSchools = [
        {
          school: {
            id: 'school-1',
            name: 'Test School 1',
            schoolCode: 'TEST1'
          }
        },
        {
          school: {
            id: 'school-2',
            name: 'Test School 2',
            schoolCode: 'TEST2'
          }
        }
      ];

      (db.userSchool.findMany as any).mockResolvedValue(userSchools);

      const result = await sessionContextService.getUserSchools('user-1');

      expect(result).toEqual([
        {
          id: 'school-1',
          name: 'Test School 1',
          schoolCode: 'TEST1'
        },
        {
          id: 'school-2',
          name: 'Test School 2',
          schoolCode: 'TEST2'
        }
      ]);
    });
  });

  describe('validateUserSchoolAccess', () => {
    it('should return false when user has no access to school', async () => {
      (db.userSchool.findFirst as any).mockResolvedValue(null);

      const result = await sessionContextService.validateUserSchoolAccess('user-1', 'school-1');

      expect(result).toBe(false);
    });

    it('should return true when user has access to school', async () => {
      const userSchool = {
        userId: 'user-1',
        schoolId: 'school-1',
        isActive: true,
        school: { status: SchoolStatus.ACTIVE }
      };

      (db.userSchool.findFirst as any).mockResolvedValue(userSchool);

      const result = await sessionContextService.validateUserSchoolAccess('user-1', 'school-1');

      expect(result).toBe(true);
    });
  });

  describe('validateParentStudentAccess', () => {
    it('should return false when parent record not found', async () => {
      (db.parent.findFirst as any).mockResolvedValue(null);

      const result = await sessionContextService.validateParentStudentAccess('user-1', 'student-1');

      expect(result).toBe(false);
    });

    it('should return false when parent-student relationship not found', async () => {
      const parent = { id: 'parent-1', userId: 'user-1' };
      
      (db.parent.findFirst as any).mockResolvedValue(parent);
      (db.studentParent.findFirst as any).mockResolvedValue(null);

      const result = await sessionContextService.validateParentStudentAccess('user-1', 'student-1');

      expect(result).toBe(false);
    });

    it('should return true when parent has access to student', async () => {
      const parent = { id: 'parent-1', userId: 'user-1' };
      const studentParent = {
        parentId: 'parent-1',
        studentId: 'student-1',
        student: {
          user: { isActive: true }
        }
      };
      
      (db.parent.findFirst as any).mockResolvedValue(parent);
      (db.studentParent.findFirst as any).mockResolvedValue(studentParent);

      const result = await sessionContextService.validateParentStudentAccess('user-1', 'student-1');

      expect(result).toBe(true);
    });
  });

  describe('updateSchoolContext', () => {
    it('should throw error when user has no access to school', async () => {
      (db.userSchool.findFirst as any).mockResolvedValue(null);

      await expect(
        sessionContextService.updateSchoolContext('token', 'school-1', 'user-1')
      ).rejects.toThrow('Unauthorized access to school');
    });

    it('should update school context successfully', async () => {
      const userSchool = {
        userId: 'user-1',
        schoolId: 'school-1',
        isActive: true,
        school: { status: SchoolStatus.ACTIVE }
      };

      (db.userSchool.findFirst as any).mockResolvedValue(userSchool);
      (db.authSession.updateMany as any).mockResolvedValue({ count: 1 });

      const result = await sessionContextService.updateSchoolContext('token', 'school-1', 'user-1');

      expect(result).toBe(true);
      expect(db.authSession.updateMany).toHaveBeenCalledWith({
        where: {
          token: 'token',
          userId: 'user-1',
          expiresAt: { gt: expect.any(Date) }
        },
        data: {
          activeSchoolId: 'school-1',
          lastAccessAt: expect.any(Date)
        }
      });
    });
  });

  describe('getParentChildren', () => {
    it('should return empty array when parent not found', async () => {
      (db.parent.findFirst as any).mockResolvedValue(null);

      const result = await sessionContextService.getParentChildren('user-1');

      expect(result).toEqual([]);
    });

    it('should return parent children', async () => {
      const parent = { id: 'parent-1', userId: 'user-1' };
      const studentParents = [
        {
          student: {
            id: 'student-1',
            rollNumber: 'S001',
            user: { name: 'John Doe', isActive: true },
            section: {
              name: 'A',
              class: { name: '5' }
            }
          }
        },
        {
          student: {
            id: 'student-2',
            rollNumber: 'S002',
            user: { name: 'Jane Doe', isActive: true },
            section: {
              name: 'B',
              class: { name: '3' }
            }
          }
        }
      ];

      (db.parent.findFirst as any).mockResolvedValue(parent);
      (db.studentParent.findMany as any).mockResolvedValue(studentParents);

      const result = await sessionContextService.getParentChildren('user-1');

      expect(result).toEqual([
        {
          id: 'student-1',
          name: 'John Doe',
          class: '5',
          section: 'A',
          rollNumber: 'S001'
        },
        {
          id: 'student-2',
          name: 'Jane Doe',
          class: '3',
          section: 'B',
          rollNumber: 'S002'
        }
      ]);
    });
  });
});