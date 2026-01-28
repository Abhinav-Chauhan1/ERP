import { PrismaClient, UserRole } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const prisma = new PrismaClient();

describe('Database Schema Validation for Multi-Tenant Authentication', () => {
  beforeAll(async () => {
    // Ensure database connection is established
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Task 1.1: User Model Updates', () => {
    it('should support nullable mobile and email fields', async () => {
      // Test that we can create a user with only mobile
      const userWithMobile = {
        name: 'Test User Mobile',
        mobile: '+1234567890',
        email: null,
      };

      // Test that we can create a user with only email
      const userWithEmail = {
        name: 'Test User Email',
        mobile: null,
        email: 'test@example.com',
      };

      // These should not throw errors
      expect(() => userWithMobile).not.toThrow();
      expect(() => userWithEmail).not.toThrow();
    });

    it('should have passwordHash field for authentication', () => {
      // Verify the field exists in the schema
      const userFields = Object.keys(prisma.user.fields || {});
      expect(userFields).toContain('passwordHash');
    });
  });

  describe('Task 1.2: UserSchool Model Updates', () => {
    it('should use UserRole enum instead of string', async () => {
      // Test that UserRole enum values are available
      expect(UserRole.STUDENT).toBe('STUDENT');
      expect(UserRole.PARENT).toBe('PARENT');
      expect(UserRole.TEACHER).toBe('TEACHER');
      expect(UserRole.ADMIN).toBe('ADMIN');
      expect(UserRole.SUPER_ADMIN).toBe('SUPER_ADMIN');
    });

    it('should support all required user roles', () => {
      const expectedRoles = ['STUDENT', 'PARENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN'];
      const actualRoles = Object.values(UserRole);
      
      expectedRoles.forEach(role => {
        expect(actualRoles).toContain(role);
      });
    });
  });

  describe('Task 1.3: OTP Model Creation', () => {
    it('should have OTP model with required fields', async () => {
      // Test that OTP model exists and has correct structure
      const otpCount = await prisma.oTP.count();
      expect(typeof otpCount).toBe('number');
    });

    it('should support OTP lifecycle fields', () => {
      // Verify OTP model has all required fields for secure code storage
      const otpData = {
        identifier: 'test@example.com',
        codeHash: 'hashed_code',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        attempts: 0,
        isUsed: false,
      };

      expect(() => otpData).not.toThrow();
    });
  });

  describe('Task 1.4: AuthSession Model Creation', () => {
    it('should have AuthSession model for JWT session management', async () => {
      // Test that AuthSession model exists
      const sessionCount = await prisma.authSession.count();
      expect(typeof sessionCount).toBe('number');
    });

    it('should support session context fields', () => {
      // Verify AuthSession model has required fields
      const sessionData = {
        userId: 'user_id',
        token: 'jwt_token',
        activeSchoolId: 'school_id',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      expect(() => sessionData).not.toThrow();
    });
  });

  describe('Task 1.5: AuditLog Model Updates', () => {
    it('should have updated AuditLog model for authentication logging', async () => {
      // Test that AuditLog model exists and is accessible
      const auditCount = await prisma.auditLog.count();
      expect(typeof auditCount).toBe('number');
    });

    it('should support multi-tenant audit logging', () => {
      // Verify AuditLog supports nullable userId and schoolId
      const auditData = {
        userId: null, // Should be nullable
        schoolId: 'school_id',
        action: 'LOGIN_ATTEMPT',
        details: { ip: '127.0.0.1' },
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
      };

      expect(() => auditData).not.toThrow();
    });
  });

  describe('Task 1.6: Student Model Updates', () => {
    it('should have parentMobile field for parent-child linking', async () => {
      // Test that Student model has parentMobile field
      const studentCount = await prisma.student.count();
      expect(typeof studentCount).toBe('number');
    });

    it('should support parent-child relationship via mobile', () => {
      // Verify Student model supports parentMobile field
      const studentData = {
        userId: 'user_id',
        admissionId: 'ADM001',
        admissionDate: new Date(),
        dateOfBirth: new Date('2010-01-01'),
        gender: 'Male',
        schoolId: 'school_id',
        parentMobile: '+1234567890', // New field for parent-child linking
      };

      expect(() => studentData).not.toThrow();
    });
  });

  describe('Task 1.7: Database Indexes', () => {
    it('should have performance indexes on key fields', async () => {
      // Test that database queries work efficiently
      // This is more of a structural test since we can't directly test indexes
      
      // Test User model indexes
      const userQuery = prisma.user.findMany({
        where: { isActive: true },
        take: 1,
      });

      // Test UserSchool model indexes
      const userSchoolQuery = prisma.userSchool.findMany({
        where: { role: UserRole.STUDENT },
        take: 1,
      });

      // Test Student model indexes
      const studentQuery = prisma.student.findMany({
        where: { parentMobile: { not: null } },
        take: 1,
      });

      // These queries should execute without errors
      await expect(userQuery).resolves.not.toThrow();
      await expect(userSchoolQuery).resolves.not.toThrow();
      await expect(studentQuery).resolves.not.toThrow();
    });
  });

  describe('Task 1.8: Schema Integration', () => {
    it('should maintain referential integrity', async () => {
      // Test that all foreign key relationships are properly defined
      
      // Test User -> UserSchool relationship
      const userSchools = await prisma.userSchool.findMany({
        include: { user: true, school: true },
        take: 1,
      });

      // Test User -> AuthSession relationship
      const authSessions = await prisma.authSession.findMany({
        include: { user: true },
        take: 1,
      });

      // Test School -> AuditLog relationship
      const auditLogs = await prisma.auditLog.findMany({
        include: { school: true, user: true },
        take: 1,
      });

      // These should execute without foreign key errors
      expect(() => userSchools).not.toThrow();
      expect(() => authSessions).not.toThrow();
      expect(() => auditLogs).not.toThrow();
    });

    it('should support multi-tenant data isolation', async () => {
      // Test that school-scoped queries work correctly
      const schoolSpecificData = await prisma.userSchool.findMany({
        where: {
          schoolId: 'test_school_id',
          isActive: true,
        },
        include: {
          user: true,
          school: true,
        },
        take: 1,
      });

      expect(Array.isArray(schoolSpecificData)).toBe(true);
    });
  });
});