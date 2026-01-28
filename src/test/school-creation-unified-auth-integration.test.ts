/**
 * Integration Tests for School Creation API with Unified Authentication System
 * Task 11.1: Update school creation API to support new authentication system
 * 
 * Tests the complete integration between school creation API, authentication services,
 * school context service, and audit logging.
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/super-admin/schools/route';
import { db } from '@/lib/db';
import { PrismaClient } from '@prisma/client';

// Use a separate test database
const testDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

describe('Integration: School Creation with Unified Authentication', () => {
  let testSchoolId: string;
  let testAdminUserId: string;

  beforeAll(async () => {
    // Ensure test database is clean
    await testDb.auditLog.deleteMany();
    await testDb.userSchool.deleteMany();
    await testDb.user.deleteMany({ where: { email: { contains: 'test-integration' } } });
    await testDb.school.deleteMany({ where: { schoolCode: { contains: 'TEST-INT' } } });
  });

  afterAll(async () => {
    // Clean up test data
    if (testSchoolId) {
      await testDb.auditLog.deleteMany({ where: { changes: { path: ['schoolId'], equals: testSchoolId } } });
      await testDb.userSchool.deleteMany({ where: { schoolId: testSchoolId } });
      await testDb.school.delete({ where: { id: testSchoolId } }).catch(() => {});
    }
    if (testAdminUserId) {
      await testDb.user.delete({ where: { id: testAdminUserId } }).catch(() => {});
    }
    await testDb.$disconnect();
  });

  beforeEach(() => {
    // Mock authentication to return super admin
    vi.mock('@/auth', () => ({
      auth: vi.fn().mockResolvedValue({
        user: {
          id: 'test-super-admin',
          role: 'SUPER_ADMIN',
          email: 'admin@system.com'
        }
      })
    }));

    // Mock rate limiting
    vi.mock('@/lib/middleware/rate-limit', () => ({
      rateLimit: vi.fn().mockResolvedValue(null)
    }));
  });

  it('should create school with complete unified authentication integration', async () => {
    const schoolData = {
      schoolName: 'Integration Test School',
      subdomain: `test-int-${Date.now()}`,
      contactEmail: 'contact@test-integration.com',
      contactPhone: '+1234567890',
      description: 'Integration test school',
      subscriptionPlan: 'GROWTH',
      billingCycle: 'monthly',
      extraStudents: 10,
      schoolType: 'High School',
      adminEmail: `admin-${Date.now()}@test-integration.com`,
      adminName: 'Test Admin User',
      adminPassword: 'securepassword123',
      enableOTPForAdmins: true,
      authenticationMethod: 'both'
    };

    const request = new NextRequest('http://localhost/api/super-admin/schools', {
      method: 'POST',
      body: JSON.stringify(schoolData),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const responseData = await response.json();

    // Verify successful creation
    expect(response.status).toBe(201);
    expect(responseData.success).toBe(true);
    expect(responseData.schoolId).toBeDefined();
    expect(responseData.message).toContain('unified authentication system');

    testSchoolId = responseData.schoolId;

    // Verify school was created in database with correct configuration
    const createdSchool = await testDb.school.findUnique({
      where: { id: testSchoolId }
    });

    expect(createdSchool).toBeDefined();
    expect(createdSchool!.name).toBe(schoolData.schoolName);
    expect(createdSchool!.schoolCode).toBe(schoolData.subdomain.toUpperCase());
    expect(createdSchool!.subdomain).toBe(schoolData.subdomain);
    expect(createdSchool!.isOnboarded).toBe(false);
    expect(createdSchool!.status).toBe('INACTIVE');
    expect(createdSchool!.plan).toBe(schoolData.subscriptionPlan);

    // Verify authentication configuration in metadata
    const metadata = createdSchool!.metadata as any;
    expect(metadata.authenticationConfig).toBeDefined();
    expect(metadata.authenticationConfig.enableOTPForAdmins).toBe(true);
    expect(metadata.authenticationConfig.authenticationMethod).toBe('both');
    expect(metadata.authenticationConfig.requiresSetup).toBe(true);
    expect(metadata.authenticationConfig.setupStep).toBe('admin_creation');

    // Verify admin user was created
    if (responseData.adminUser) {
      testAdminUserId = responseData.adminUser.id;

      const adminUser = await testDb.user.findUnique({
        where: { id: testAdminUserId }
      });

      expect(adminUser).toBeDefined();
      expect(adminUser!.name).toBe(schoolData.adminName);
      expect(adminUser!.email).toBe(schoolData.adminEmail);
      expect(adminUser!.passwordHash).toBeDefined();
      expect(adminUser!.isActive).toBe(true);

      // Verify user-school relationship
      const userSchool = await testDb.userSchool.findFirst({
        where: {
          userId: testAdminUserId,
          schoolId: testSchoolId
        }
      });

      expect(userSchool).toBeDefined();
      expect(userSchool!.role).toBe('SCHOOL_ADMIN');
      expect(userSchool!.isActive).toBe(true);
    }

    // Verify audit logs were created
    const auditLogs = await testDb.auditLog.findMany({
      where: {
        OR: [
          { resourceId: testSchoolId },
          { changes: { path: ['schoolId'], equals: testSchoolId } }
        ]
      },
      orderBy: { timestamp: 'asc' }
    });

    expect(auditLogs.length).toBeGreaterThan(0);

    // Find main school creation audit log
    const schoolCreationLog = auditLogs.find(log => 
      log.resource === 'SCHOOL' && log.action === 'CREATE'
    );

    expect(schoolCreationLog).toBeDefined();
    expect(schoolCreationLog!.userId).toBe('test-super-admin');
    expect(schoolCreationLog!.resourceId).toBe(testSchoolId);

    const logChanges = schoolCreationLog!.changes as any;
    expect(logChanges.schoolName).toBe(schoolData.schoolName);
    expect(logChanges.subdomain).toBe(schoolData.subdomain);
    expect(logChanges.authenticationConfig).toBeDefined();
    expect(logChanges.unifiedAuthEnabled).toBe(true);

    // Verify admin user creation audit log if admin was created
    if (responseData.adminUser) {
      const adminCreationLog = auditLogs.find(log => 
        (log.changes as any)?.action === 'admin_user_created'
      );

      expect(adminCreationLog).toBeDefined();
      const adminLogChanges = adminCreationLog!.changes as any;
      expect(adminLogChanges.adminUserId).toBe(testAdminUserId);
      expect(adminLogChanges.adminEmail).toBe(schoolData.adminEmail);
      expect(adminLogChanges.authenticationMethod).toBe(schoolData.authenticationMethod);
    }

    // Verify response structure
    expect(responseData).toEqual({
      success: true,
      schoolId: testSchoolId,
      message: 'School created successfully with unified authentication system',
      setupUrl: `/super-admin/schools/${testSchoolId}/setup`,
      school: {
        id: testSchoolId,
        name: schoolData.schoolName,
        schoolCode: schoolData.subdomain.toUpperCase(),
        subdomain: schoolData.subdomain,
        status: 'INACTIVE',
        isOnboarded: false,
        plan: schoolData.subscriptionPlan
      },
      adminUser: responseData.adminUser ? {
        id: testAdminUserId,
        name: schoolData.adminName,
        email: schoolData.adminEmail,
        hasPassword: true
      } : null,
      nextSteps: [
        'Complete school setup wizard',
        responseData.adminUser ? 'Admin user is ready for login' : 'Create admin user in setup wizard',
        'Configure authentication settings',
        'Activate school for student/parent access'
      ]
    });
  });

  it('should handle school creation without admin user', async () => {
    const schoolData = {
      schoolName: 'No Admin Test School',
      subdomain: `test-no-admin-${Date.now()}`,
      contactEmail: 'contact@test-no-admin.com',
      subscriptionPlan: 'STARTER',
      billingCycle: 'monthly',
      extraStudents: 0,
      authenticationMethod: 'password',
      enableOTPForAdmins: false
    };

    const request = new NextRequest('http://localhost/api/super-admin/schools', {
      method: 'POST',
      body: JSON.stringify(schoolData),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(201);
    expect(responseData.success).toBe(true);
    expect(responseData.adminUser).toBeNull();
    expect(responseData.nextSteps).toContain('Create admin user in setup wizard');

    // Clean up
    if (responseData.schoolId) {
      await testDb.school.delete({ where: { id: responseData.schoolId } }).catch(() => {});
    }
  });

  it('should handle existing admin user by linking to school', async () => {
    // First create a user
    const existingUser = await testDb.user.create({
      data: {
        name: 'Existing Admin',
        email: `existing-${Date.now()}@test-integration.com`,
        passwordHash: 'existing-hash',
        isActive: true
      }
    });

    const schoolData = {
      schoolName: 'Existing Admin Test School',
      subdomain: `test-existing-${Date.now()}`,
      contactEmail: 'contact@test-existing.com',
      subscriptionPlan: 'GROWTH',
      billingCycle: 'monthly',
      extraStudents: 0,
      adminEmail: existingUser.email,
      adminName: 'Existing Admin',
      authenticationMethod: 'password',
      enableOTPForAdmins: false
    };

    const request = new NextRequest('http://localhost/api/super-admin/schools', {
      method: 'POST',
      body: JSON.stringify(schoolData),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(201);
    expect(responseData.success).toBe(true);
    expect(responseData.adminUser.id).toBe(existingUser.id);

    // Verify user-school relationship was created
    const userSchool = await testDb.userSchool.findFirst({
      where: {
        userId: existingUser.id,
        schoolId: responseData.schoolId
      }
    });

    expect(userSchool).toBeDefined();
    expect(userSchool!.role).toBe('SCHOOL_ADMIN');

    // Clean up
    await testDb.userSchool.deleteMany({ where: { userId: existingUser.id } });
    await testDb.user.delete({ where: { id: existingUser.id } });
    if (responseData.schoolId) {
      await testDb.school.delete({ where: { id: responseData.schoolId } }).catch(() => {});
    }
  });

  it('should handle subdomain conflicts', async () => {
    // Create a school with a specific subdomain
    const existingSchool = await testDb.school.create({
      data: {
        name: 'Existing School',
        schoolCode: 'EXISTING',
        subdomain: 'existing-subdomain',
        plan: 'STARTER',
        status: 'ACTIVE',
        isOnboarded: false
      }
    });

    const schoolData = {
      schoolName: 'Conflicting School',
      subdomain: 'existing-subdomain', // Same subdomain
      contactEmail: 'conflict@test.com',
      subscriptionPlan: 'STARTER',
      billingCycle: 'monthly',
      extraStudents: 0,
      authenticationMethod: 'password',
      enableOTPForAdmins: false
    };

    const request = new NextRequest('http://localhost/api/super-admin/schools', {
      method: 'POST',
      body: JSON.stringify(schoolData),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.error).toBe('Subdomain already exists');

    // Clean up
    await testDb.school.delete({ where: { id: existingSchool.id } });
  });

  it('should handle school code conflicts', async () => {
    // Create a school with a specific school code
    const existingSchool = await testDb.school.create({
      data: {
        name: 'Existing School',
        schoolCode: 'CONFLICT-CODE',
        subdomain: 'existing-school',
        plan: 'STARTER',
        status: 'ACTIVE',
        isOnboarded: false
      }
    });

    const schoolData = {
      schoolName: 'Conflicting School',
      subdomain: 'conflict-code', // Will generate same school code
      contactEmail: 'conflict@test.com',
      subscriptionPlan: 'STARTER',
      billingCycle: 'monthly',
      extraStudents: 0,
      authenticationMethod: 'password',
      enableOTPForAdmins: false
    };

    const request = new NextRequest('http://localhost/api/super-admin/schools', {
      method: 'POST',
      body: JSON.stringify(schoolData),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.error).toBe('School code already exists');

    // Clean up
    await testDb.school.delete({ where: { id: existingSchool.id } });
  });
});