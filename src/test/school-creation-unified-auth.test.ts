/**
 * Unit Tests for School Creation API with Unified Authentication System
 * Task 11.1: Update school creation API to support new authentication system
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/super-admin/schools/route';
import { db } from '@/lib/db';
import { schoolService } from '@/lib/services/school-service';
import { authenticationService } from '@/lib/services/authentication-service';
import { schoolContextService } from '@/lib/services/school-context-service';
import { logSchoolManagementAction, logAuditEvent } from '@/lib/services/audit-service';
import bcrypt from 'bcryptjs';

// Mock dependencies
vi.mock('@/auth', () => ({
  auth: vi.fn()
}));

vi.mock('@/lib/db', () => ({
  db: {
    school: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    user: {
      findFirst: vi.fn(),
      create: vi.fn()
    },
    userSchool: {
      create: vi.fn()
    },
    authSession: {
      create: vi.fn()
    }
  }
}));

vi.mock('@/lib/services/school-service', () => ({
  schoolService: {
    getSchoolBySubdomain: vi.fn(),
    createSchoolWithSaasConfig: vi.fn()
  }
}));

vi.mock('@/lib/services/authentication-service', () => ({
  authenticationService: {
    createSession: vi.fn()
  }
}));

vi.mock('@/lib/services/school-context-service', () => ({
  schoolContextService: {
    initializeSchoolContext: vi.fn()
  }
}));

vi.mock('@/lib/services/audit-service', () => ({
  logSchoolManagementAction: vi.fn(),
  logAuditEvent: vi.fn()
}));

vi.mock('@/lib/middleware/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(null)
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn()
  }
}));

const { auth } = await import('@/auth');

describe('School Creation API with Unified Authentication', () => {
  const mockSuperAdminSession = {
    user: {
      id: 'super-admin-id',
      role: 'SUPER_ADMIN',
      email: 'admin@system.com'
    }
  };

  const validSchoolData = {
    schoolName: 'Test School',
    subdomain: 'test-school',
    contactEmail: 'contact@testschool.com',
    contactPhone: '+1234567890',
    description: 'A test school',
    subscriptionPlan: 'GROWTH',
    billingCycle: 'monthly',
    extraStudents: 5,
    schoolType: 'High School',
    adminEmail: 'admin@testschool.com',
    adminName: 'School Admin',
    adminPassword: 'securepassword123',
    enableOTPForAdmins: true,
    authenticationMethod: 'both'
  };

  const mockCreatedSchool = {
    id: 'school-id-123',
    name: 'Test School',
    schoolCode: 'TEST-SCHOOL',
    subdomain: 'test-school',
    status: 'INACTIVE',
    isOnboarded: false,
    plan: 'GROWTH'
  };

  const mockCreatedAdmin = {
    id: 'admin-user-id',
    name: 'School Admin',
    email: 'admin@testschool.com',
    passwordHash: 'hashed-password'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue(mockSuperAdminSession);
  });

  describe('Authentication and Authorization', () => {
    it('should reject requests without authentication', async () => {
      (auth as any).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/super-admin/schools', {
        method: 'POST',
        body: JSON.stringify(validSchoolData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject requests from non-super-admin users', async () => {
      (auth as any).mockResolvedValue({
        user: { id: 'user-id', role: 'SCHOOL_ADMIN' }
      });

      const request = new NextRequest('http://localhost/api/super-admin/schools', {
        method: 'POST',
        body: JSON.stringify(validSchoolData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Input Validation', () => {
    it('should validate required fields', async () => {
      const invalidData = {
        schoolName: '',
        subdomain: 'test',
        contactEmail: 'invalid-email'
      };

      const request = new NextRequest('http://localhost/api/super-admin/schools', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
      expect(data.details).toBeDefined();
    });

    it('should validate subdomain format', async () => {
      const invalidData = {
        ...validSchoolData,
        subdomain: 'Invalid_Subdomain!'
      };

      const request = new NextRequest('http://localhost/api/super-admin/schools', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
    });

    it('should validate email formats', async () => {
      const invalidData = {
        ...validSchoolData,
        contactEmail: 'invalid-email',
        adminEmail: 'also-invalid'
      };

      const request = new NextRequest('http://localhost/api/super-admin/schools', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
    });
  });

  describe('School Creation with Unified Authentication', () => {
    beforeEach(() => {
      (schoolService.getSchoolBySubdomain as any).mockResolvedValue(null);
      (db.school.findUnique as any).mockResolvedValue(null);
      (schoolService.createSchoolWithSaasConfig as any).mockResolvedValue(mockCreatedSchool);
      (schoolContextService.initializeSchoolContext as any).mockResolvedValue(undefined);
    });

    it('should create school with unified authentication configuration', async () => {
      const request = new NextRequest('http://localhost/api/super-admin/schools', {
        method: 'POST',
        body: JSON.stringify(validSchoolData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.schoolId).toBe(mockCreatedSchool.id);
      expect(data.message).toContain('unified authentication system');

      // Verify school creation with authentication config
      expect(schoolService.createSchoolWithSaasConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          name: validSchoolData.schoolName,
          schoolCode: 'TEST-SCHOOL',
          isOnboarded: false,
          metadata: expect.objectContaining({
            authenticationConfig: expect.objectContaining({
              enableOTPForAdmins: true,
              authenticationMethod: 'both',
              requiresSetup: true,
              setupStep: 'admin_creation'
            })
          })
        })
      );
    });

    it('should initialize school context in unified authentication system', async () => {
      const request = new NextRequest('http://localhost/api/super-admin/schools', {
        method: 'POST',
        body: JSON.stringify(validSchoolData)
      });

      await POST(request);

      expect(schoolContextService.initializeSchoolContext).toHaveBeenCalledWith(
        mockCreatedSchool.id,
        expect.objectContaining({
          schoolCode: 'TEST-SCHOOL',
          name: validSchoolData.schoolName,
          subdomain: validSchoolData.subdomain,
          authenticationConfig: expect.objectContaining({
            enableOTPForAdmins: true,
            authenticationMethod: 'both'
          }),
          createdBy: mockSuperAdminSession.user.id
        })
      );
    });

    it('should create admin user with proper authentication setup', async () => {
      (db.user.findFirst as any).mockResolvedValue(null);
      (db.user.create as any).mockResolvedValue(mockCreatedAdmin);
      (bcrypt.hash as any).mockResolvedValue('hashed-password');

      const request = new NextRequest('http://localhost/api/super-admin/schools', {
        method: 'POST',
        body: JSON.stringify(validSchoolData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.adminUser).toEqual({
        id: mockCreatedAdmin.id,
        name: mockCreatedAdmin.name,
        email: mockCreatedAdmin.email,
        hasPassword: true
      });

      // Verify admin user creation
      expect(db.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: validSchoolData.adminName,
          email: validSchoolData.adminEmail,
          passwordHash: 'hashed-password',
          isActive: true
        })
      });

      // Verify user-school relationship
      expect(db.userSchool.create).toHaveBeenCalledWith({
        data: {
          userId: mockCreatedAdmin.id,
          schoolId: mockCreatedSchool.id,
          role: 'SCHOOL_ADMIN',
          isActive: true
        }
      });
    });

    it('should handle existing admin user by linking to school', async () => {
      const existingUser = {
        id: 'existing-user-id',
        name: 'Existing Admin',
        email: 'admin@testschool.com'
      };

      (db.user.findFirst as any).mockResolvedValue(existingUser);

      const request = new NextRequest('http://localhost/api/super-admin/schools', {
        method: 'POST',
        body: JSON.stringify(validSchoolData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.adminUser.id).toBe(existingUser.id);

      // Should not create new user
      expect(db.user.create).not.toHaveBeenCalled();

      // Should link existing user to school
      expect(db.userSchool.create).toHaveBeenCalledWith({
        data: {
          userId: existingUser.id,
          schoolId: mockCreatedSchool.id,
          role: 'SCHOOL_ADMIN',
          isActive: true
        }
      });
    });

    it('should create school without admin user if not provided', async () => {
      const dataWithoutAdmin = {
        ...validSchoolData,
        adminEmail: undefined,
        adminName: undefined,
        adminPassword: undefined
      };

      const request = new NextRequest('http://localhost/api/super-admin/schools', {
        method: 'POST',
        body: JSON.stringify(dataWithoutAdmin)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.adminUser).toBeNull();
      expect(data.nextSteps).toContain('Create admin user in setup wizard');

      // Should not attempt to create user
      expect(db.user.create).not.toHaveBeenCalled();
      expect(db.userSchool.create).not.toHaveBeenCalled();
    });
  });

  describe('Audit Logging', () => {
    beforeEach(() => {
      (schoolService.getSchoolBySubdomain as any).mockResolvedValue(null);
      (db.school.findUnique as any).mockResolvedValue(null);
      (schoolService.createSchoolWithSaasConfig as any).mockResolvedValue(mockCreatedSchool);
      (schoolContextService.initializeSchoolContext as any).mockResolvedValue(undefined);
      (db.user.findFirst as any).mockResolvedValue(null);
      (db.user.create as any).mockResolvedValue(mockCreatedAdmin);
    });

    it('should log comprehensive school creation event', async () => {
      const request = new NextRequest('http://localhost/api/super-admin/schools', {
        method: 'POST',
        body: JSON.stringify(validSchoolData)
      });

      await POST(request);

      expect(logSchoolManagementAction).toHaveBeenCalledWith(
        mockSuperAdminSession.user.id,
        'CREATE',
        mockCreatedSchool.id,
        expect.objectContaining({
          schoolName: validSchoolData.schoolName,
          subdomain: validSchoolData.subdomain,
          plan: validSchoolData.subscriptionPlan,
          authenticationConfig: expect.objectContaining({
            enableOTPForAdmins: true,
            authenticationMethod: 'both'
          }),
          adminUserCreated: true,
          setupRequired: true,
          unifiedAuthEnabled: true
        })
      );
    });

    it('should log admin user creation separately', async () => {
      const request = new NextRequest('http://localhost/api/super-admin/schools', {
        method: 'POST',
        body: JSON.stringify(validSchoolData)
      });

      await POST(request);

      expect(logSchoolManagementAction).toHaveBeenCalledWith(
        mockSuperAdminSession.user.id,
        'CREATE',
        mockCreatedSchool.id,
        expect.objectContaining({
          action: 'admin_user_created',
          adminUserId: mockCreatedAdmin.id,
          adminEmail: validSchoolData.adminEmail,
          adminName: validSchoolData.adminName,
          isNewUser: true,
          authenticationMethod: validSchoolData.authenticationMethod
        })
      );
    });

    it('should log context initialization errors', async () => {
      const contextError = new Error('Context initialization failed');
      (schoolContextService.initializeSchoolContext as any).mockRejectedValue(contextError);

      const request = new NextRequest('http://localhost/api/super-admin/schools', {
        method: 'POST',
        body: JSON.stringify(validSchoolData)
      });

      const response = await POST(request);

      expect(response.status).toBe(201); // Should still succeed
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockSuperAdminSession.user.id,
          action: 'CREATE',
          resource: 'SCHOOL_CONTEXT',
          resourceId: mockCreatedSchool.id,
          changes: expect.objectContaining({
            error: 'Failed to initialize school context',
            errorMessage: 'Context initialization failed'
          })
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle subdomain conflicts', async () => {
      (schoolService.getSchoolBySubdomain as any).mockResolvedValue({ id: 'existing-school' });

      const request = new NextRequest('http://localhost/api/super-admin/schools', {
        method: 'POST',
        body: JSON.stringify(validSchoolData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Subdomain already exists');
    });

    it('should handle school code conflicts', async () => {
      (schoolService.getSchoolBySubdomain as any).mockResolvedValue(null);
      (db.school.findUnique as any).mockResolvedValue({ id: 'existing-school' });

      const request = new NextRequest('http://localhost/api/super-admin/schools', {
        method: 'POST',
        body: JSON.stringify(validSchoolData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('School code already exists');
    });

    it('should continue school creation even if admin user creation fails', async () => {
      (schoolService.getSchoolBySubdomain as any).mockResolvedValue(null);
      (db.school.findUnique as any).mockResolvedValue(null);
      (schoolService.createSchoolWithSaasConfig as any).mockResolvedValue(mockCreatedSchool);
      (schoolContextService.initializeSchoolContext as any).mockResolvedValue(undefined);
      (db.user.findFirst as any).mockResolvedValue(null);
      (db.user.create as any).mockRejectedValue(new Error('User creation failed'));

      const request = new NextRequest('http://localhost/api/super-admin/schools', {
        method: 'POST',
        body: JSON.stringify(validSchoolData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.adminUser).toBeNull();
      expect(data.nextSteps).toContain('Create admin user in setup wizard');
    });

    it('should log errors for audit purposes', async () => {
      const createError = new Error('School creation failed');
      (schoolService.createSchoolWithSaasConfig as any).mockRejectedValue(createError);

      const request = new NextRequest('http://localhost/api/super-admin/schools', {
        method: 'POST',
        body: JSON.stringify(validSchoolData)
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockSuperAdminSession.user.id,
          action: 'CREATE',
          resource: 'SCHOOL',
          changes: expect.objectContaining({
            error: 'School creation failed',
            errorMessage: 'School creation failed'
          })
        })
      );
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      (schoolService.getSchoolBySubdomain as any).mockResolvedValue(null);
      (db.school.findUnique as any).mockResolvedValue(null);
      (schoolService.createSchoolWithSaasConfig as any).mockResolvedValue(mockCreatedSchool);
      (schoolContextService.initializeSchoolContext as any).mockResolvedValue(undefined);
      (db.user.findFirst as any).mockResolvedValue(null);
      (db.user.create as any).mockResolvedValue(mockCreatedAdmin);
    });

    it('should return comprehensive response with setup information', async () => {
      const request = new NextRequest('http://localhost/api/super-admin/schools', {
        method: 'POST',
        body: JSON.stringify(validSchoolData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({
        success: true,
        schoolId: mockCreatedSchool.id,
        message: 'School created successfully with unified authentication system',
        setupUrl: `/super-admin/schools/${mockCreatedSchool.id}/setup`,
        school: {
          id: mockCreatedSchool.id,
          name: mockCreatedSchool.name,
          schoolCode: mockCreatedSchool.schoolCode,
          subdomain: mockCreatedSchool.subdomain,
          status: mockCreatedSchool.status,
          isOnboarded: mockCreatedSchool.isOnboarded,
          plan: mockCreatedSchool.plan
        },
        adminUser: {
          id: mockCreatedAdmin.id,
          name: mockCreatedAdmin.name,
          email: mockCreatedAdmin.email,
          hasPassword: true
        },
        nextSteps: [
          'Complete school setup wizard',
          'Admin user is ready for login',
          'Configure authentication settings',
          'Activate school for student/parent access'
        ]
      });
    });
  });
});