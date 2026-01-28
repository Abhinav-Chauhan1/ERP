/**
 * Property-Based Tests for School Creation API with Unified Authentication System
 * Task 11.1: Update school creation API to support new authentication system
 * 
 * **Feature: unified-auth-multitenant-refactor, Property 1: School Creation Authentication Integration**
 * **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { POST } from '@/app/api/super-admin/schools/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/auth', () => ({
  auth: vi.fn()
}));

vi.mock('@/lib/db', () => ({
  db: {
    school: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
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
    hash: vi.fn().mockResolvedValue('hashed-password')
  }
}));

const { auth } = await import('@/auth');
const { db } = await import('@/lib/db');
const { schoolService } = await import('@/lib/services/school-service');
const { schoolContextService } = await import('@/lib/services/school-context-service');
const { logSchoolManagementAction } = await import('@/lib/services/audit-service');

describe('Property-Based Tests: School Creation with Unified Authentication', () => {
  const mockSuperAdminSession = {
    user: {
      id: 'super-admin-id',
      role: 'SUPER_ADMIN',
      email: 'admin@system.com'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue(mockSuperAdminSession);
  });

  // Generators for test data
  const validSchoolNameGen = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);
  const validSubdomainGen = fc.string({ minLength: 3, maxLength: 30 })
    .map(s => s.toLowerCase().replace(/[^a-z0-9-]/g, ''))
    .filter(s => s.length >= 3 && /^[a-z0-9-]+$/.test(s));
  const validEmailGen = fc.emailAddress();
  const phoneGen = fc.option(fc.string({ minLength: 10, maxLength: 15 }));
  const descriptionGen = fc.option(fc.string({ maxLength: 500 }));
  const planGen = fc.constantFrom('STARTER', 'GROWTH', 'DOMINATE');
  const billingCycleGen = fc.constantFrom('monthly', 'yearly');
  const extraStudentsGen = fc.integer({ min: 0, max: 1000 });
  const schoolTypeGen = fc.option(fc.constantFrom(
    'Primary School', 'Secondary School', 'High School', 'College', 'University'
  ));
  const authMethodGen = fc.constantFrom('password', 'otp', 'both');
  const booleanGen = fc.boolean();

  const validSchoolDataGen = fc.record({
    schoolName: validSchoolNameGen,
    subdomain: validSubdomainGen,
    contactEmail: validEmailGen,
    contactPhone: phoneGen,
    description: descriptionGen,
    subscriptionPlan: planGen,
    billingCycle: billingCycleGen,
    extraStudents: extraStudentsGen,
    schoolType: schoolTypeGen,
    adminEmail: validEmailGen,
    adminName: validSchoolNameGen,
    adminPassword: fc.option(fc.string({ minLength: 8, maxLength: 50 })),
    enableOTPForAdmins: booleanGen,
    authenticationMethod: authMethodGen
  });

  /**
   * **Feature: unified-auth-multitenant-refactor, Property 1: School Creation Authentication Integration**
   * For any valid school creation request, the system should integrate with unified authentication system
   * **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7**
   */
  it('Property 1: School creation should always integrate with unified authentication system', async () => {
    await fc.assert(
      fc.asyncProperty(validSchoolDataGen, async (schoolData) => {
        // Setup mocks for successful creation
        (schoolService.getSchoolBySubdomain as any).mockResolvedValue(null);
        (db.school.findUnique as any).mockResolvedValue(null);
        
        const mockCreatedSchool = {
          id: `school-${Date.now()}`,
          name: schoolData.schoolName,
          schoolCode: schoolData.subdomain.toUpperCase(),
          subdomain: schoolData.subdomain,
          status: 'INACTIVE',
          isOnboarded: false,
          plan: schoolData.subscriptionPlan
        };
        
        (schoolService.createSchoolWithSaasConfig as any).mockResolvedValue(mockCreatedSchool);
        (schoolContextService.initializeSchoolContext as any).mockResolvedValue(undefined);
        
        if (schoolData.adminEmail && schoolData.adminName) {
          (db.user.findFirst as any).mockResolvedValue(null);
          (db.user.create as any).mockResolvedValue({
            id: `admin-${Date.now()}`,
            name: schoolData.adminName,
            email: schoolData.adminEmail,
            passwordHash: schoolData.adminPassword ? 'hashed-password' : null
          });
        }

        const request = new NextRequest('http://localhost/api/super-admin/schools', {
          method: 'POST',
          body: JSON.stringify(schoolData)
        });

        const response = await POST(request);
        const data = await response.json();

        // Property: All successful school creations must integrate with unified auth
        if (response.status === 201) {
          // 1. School must be created with authentication configuration
          expect(schoolService.createSchoolWithSaasConfig).toHaveBeenCalledWith(
            expect.objectContaining({
              isOnboarded: false, // Required by unified auth system
              metadata: expect.objectContaining({
                authenticationConfig: expect.objectContaining({
                  enableOTPForAdmins: schoolData.enableOTPForAdmins,
                  authenticationMethod: schoolData.authenticationMethod,
                  requiresSetup: true,
                  setupStep: 'admin_creation'
                })
              })
            })
          );

          // 2. School context must be initialized in unified auth system
          expect(schoolContextService.initializeSchoolContext).toHaveBeenCalledWith(
            mockCreatedSchool.id,
            expect.objectContaining({
              schoolCode: schoolData.subdomain.toUpperCase(),
              name: schoolData.schoolName,
              subdomain: schoolData.subdomain,
              authenticationConfig: expect.objectContaining({
                enableOTPForAdmins: schoolData.enableOTPForAdmins,
                authenticationMethod: schoolData.authenticationMethod
              }),
              createdBy: mockSuperAdminSession.user.id
            })
          );

          // 3. Response must indicate unified auth integration
          expect(data.message).toContain('unified authentication system');
          expect(data.nextSteps).toContain('Configure authentication settings');

          // 4. Comprehensive audit logging must occur
          expect(logSchoolManagementAction).toHaveBeenCalledWith(
            mockSuperAdminSession.user.id,
            'CREATE',
            mockCreatedSchool.id,
            expect.objectContaining({
              authenticationConfig: expect.objectContaining({
                enableOTPForAdmins: schoolData.enableOTPForAdmins,
                authenticationMethod: schoolData.authenticationMethod
              }),
              unifiedAuthEnabled: true
            })
          );
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: unified-auth-multitenant-refactor, Property 2: Admin User Authentication Setup**
   * For any school creation with admin user data, the system should properly set up admin authentication
   * **Validates: Requirements 10.1, 10.3, 10.5**
   */
  it('Property 2: Admin user creation should always follow unified authentication patterns', async () => {
    await fc.assert(
      fc.asyncProperty(
        validSchoolDataGen.filter(data => data.adminEmail && data.adminName),
        async (schoolData) => {
          // Setup mocks
          (schoolService.getSchoolBySubdomain as any).mockResolvedValue(null);
          (db.school.findUnique as any).mockResolvedValue(null);
          
          const mockCreatedSchool = {
            id: `school-${Date.now()}`,
            name: schoolData.schoolName,
            schoolCode: schoolData.subdomain.toUpperCase(),
            subdomain: schoolData.subdomain,
            status: 'INACTIVE',
            isOnboarded: false,
            plan: schoolData.subscriptionPlan
          };
          
          (schoolService.createSchoolWithSaasConfig as any).mockResolvedValue(mockCreatedSchool);
          (schoolContextService.initializeSchoolContext as any).mockResolvedValue(undefined);
          (db.user.findFirst as any).mockResolvedValue(null);
          
          const mockCreatedAdmin = {
            id: `admin-${Date.now()}`,
            name: schoolData.adminName,
            email: schoolData.adminEmail,
            passwordHash: schoolData.adminPassword ? 'hashed-password' : null
          };
          
          (db.user.create as any).mockResolvedValue(mockCreatedAdmin);

          const request = new NextRequest('http://localhost/api/super-admin/schools', {
            method: 'POST',
            body: JSON.stringify(schoolData)
          });

          const response = await POST(request);
          const data = await response.json();

          // Property: Admin user creation must follow unified auth patterns
          if (response.status === 201 && data.adminUser) {
            // 1. Admin user must be created with proper authentication setup
            expect(db.user.create).toHaveBeenCalledWith({
              data: expect.objectContaining({
                name: schoolData.adminName,
                email: schoolData.adminEmail,
                passwordHash: schoolData.adminPassword ? 'hashed-password' : null,
                isActive: true
              })
            });

            // 2. User-school relationship must be created with SCHOOL_ADMIN role
            expect(db.userSchool.create).toHaveBeenCalledWith({
              data: {
                userId: mockCreatedAdmin.id,
                schoolId: mockCreatedSchool.id,
                role: 'SCHOOL_ADMIN',
                isActive: true
              }
            });

            // 3. Admin user creation must be logged for audit
            expect(logSchoolManagementAction).toHaveBeenCalledWith(
              mockSuperAdminSession.user.id,
              'CREATE',
              mockCreatedSchool.id,
              expect.objectContaining({
                action: 'admin_user_created',
                adminUserId: mockCreatedAdmin.id,
                adminEmail: schoolData.adminEmail,
                adminName: schoolData.adminName,
                authenticationMethod: schoolData.authenticationMethod
              })
            );

            // 4. Response must include admin user information
            expect(data.adminUser).toEqual({
              id: mockCreatedAdmin.id,
              name: mockCreatedAdmin.name,
              email: mockCreatedAdmin.email,
              hasPassword: !!schoolData.adminPassword
            });
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: unified-auth-multitenant-refactor, Property 3: Authentication Method Consistency**
   * For any authentication method specified, the system should consistently apply it throughout
   * **Validates: Requirements 10.2, 10.3**
   */
  it('Property 3: Authentication method should be consistently applied across all components', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          schoolData: validSchoolDataGen,
          authMethod: authMethodGen,
          enableOTP: booleanGen
        }),
        async ({ schoolData, authMethod, enableOTP }) => {
          const testData = {
            ...schoolData,
            authenticationMethod: authMethod,
            enableOTPForAdmins: enableOTP
          };

          // Setup mocks
          (schoolService.getSchoolBySubdomain as any).mockResolvedValue(null);
          (db.school.findUnique as any).mockResolvedValue(null);
          
          const mockCreatedSchool = {
            id: `school-${Date.now()}`,
            name: testData.schoolName,
            schoolCode: testData.subdomain.toUpperCase(),
            subdomain: testData.subdomain,
            status: 'INACTIVE',
            isOnboarded: false,
            plan: testData.subscriptionPlan
          };
          
          (schoolService.createSchoolWithSaasConfig as any).mockResolvedValue(mockCreatedSchool);
          (schoolContextService.initializeSchoolContext as any).mockResolvedValue(undefined);

          const request = new NextRequest('http://localhost/api/super-admin/schools', {
            method: 'POST',
            body: JSON.stringify(testData)
          });

          const response = await POST(request);

          // Property: Authentication method must be consistent across all components
          if (response.status === 201) {
            // 1. School metadata must contain consistent auth config
            const schoolCreateCall = (schoolService.createSchoolWithSaasConfig as any).mock.calls[0][0];
            expect(schoolCreateCall.metadata.authenticationConfig).toEqual(
              expect.objectContaining({
                enableOTPForAdmins: enableOTP,
                authenticationMethod: authMethod,
                requiresSetup: true,
                setupStep: 'admin_creation'
              })
            );

            // 2. School context initialization must use same auth config
            const contextInitCall = (schoolContextService.initializeSchoolContext as any).mock.calls[0][1];
            expect(contextInitCall.authenticationConfig).toEqual(
              expect.objectContaining({
                enableOTPForAdmins: enableOTP,
                authenticationMethod: authMethod
              })
            );

            // 3. Audit log must record consistent auth config
            const auditCall = (logSchoolManagementAction as any).mock.calls.find(
              call => call[3].authenticationConfig
            );
            expect(auditCall[3].authenticationConfig).toEqual(
              expect.objectContaining({
                enableOTPForAdmins: enableOTP,
                authenticationMethod: authMethod
              })
            );
          }
        }
      ),
      { numRuns: 75 }
    );
  });

  /**
   * **Feature: unified-auth-multitenant-refactor, Property 4: School Context Initialization**
   * For any successfully created school, the unified authentication context must be properly initialized
   * **Validates: Requirements 10.4, 10.6**
   */
  it('Property 4: School context must always be initialized for unified authentication', async () => {
    await fc.assert(
      fc.asyncProperty(validSchoolDataGen, async (schoolData) => {
        // Setup mocks for successful creation
        (schoolService.getSchoolBySubdomain as any).mockResolvedValue(null);
        (db.school.findUnique as any).mockResolvedValue(null);
        
        const mockCreatedSchool = {
          id: `school-${Date.now()}`,
          name: schoolData.schoolName,
          schoolCode: schoolData.subdomain.toUpperCase(),
          subdomain: schoolData.subdomain,
          status: 'INACTIVE',
          isOnboarded: false,
          plan: schoolData.subscriptionPlan
        };
        
        (schoolService.createSchoolWithSaasConfig as any).mockResolvedValue(mockCreatedSchool);
        (schoolContextService.initializeSchoolContext as any).mockResolvedValue(undefined);

        const request = new NextRequest('http://localhost/api/super-admin/schools', {
          method: 'POST',
          body: JSON.stringify(schoolData)
        });

        const response = await POST(request);

        // Property: School context initialization must always be attempted
        if (response.status === 201) {
          expect(schoolContextService.initializeSchoolContext).toHaveBeenCalledTimes(1);
          
          const initCall = (schoolContextService.initializeSchoolContext as any).mock.calls[0];
          const [schoolId, config] = initCall;
          
          // Context initialization must include all required fields
          expect(schoolId).toBe(mockCreatedSchool.id);
          expect(config).toEqual(
            expect.objectContaining({
              schoolCode: schoolData.subdomain.toUpperCase(),
              name: schoolData.schoolName,
              subdomain: schoolData.subdomain,
              authenticationConfig: expect.objectContaining({
                enableOTPForAdmins: schoolData.enableOTPForAdmins,
                authenticationMethod: schoolData.authenticationMethod,
                requiresSetup: true,
                setupStep: 'admin_creation'
              }),
              createdBy: mockSuperAdminSession.user.id
            })
          );
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: unified-auth-multitenant-refactor, Property 5: Audit Trail Completeness**
   * For any school creation operation, comprehensive audit logging must occur
   * **Validates: Requirements 10.7**
   */
  it('Property 5: Comprehensive audit logging must occur for all school creation operations', async () => {
    await fc.assert(
      fc.asyncProperty(validSchoolDataGen, async (schoolData) => {
        // Setup mocks
        (schoolService.getSchoolBySubdomain as any).mockResolvedValue(null);
        (db.school.findUnique as any).mockResolvedValue(null);
        
        const mockCreatedSchool = {
          id: `school-${Date.now()}`,
          name: schoolData.schoolName,
          schoolCode: schoolData.subdomain.toUpperCase(),
          subdomain: schoolData.subdomain,
          status: 'INACTIVE',
          isOnboarded: false,
          plan: schoolData.subscriptionPlan
        };
        
        (schoolService.createSchoolWithSaasConfig as any).mockResolvedValue(mockCreatedSchool);
        (schoolContextService.initializeSchoolContext as any).mockResolvedValue(undefined);

        const request = new NextRequest('http://localhost/api/super-admin/schools', {
          method: 'POST',
          body: JSON.stringify(schoolData)
        });

        const response = await POST(request);

        // Property: Comprehensive audit logging must always occur
        if (response.status === 201) {
          // Main school creation audit log
          expect(logSchoolManagementAction).toHaveBeenCalledWith(
            mockSuperAdminSession.user.id,
            'CREATE',
            mockCreatedSchool.id,
            expect.objectContaining({
              schoolName: schoolData.schoolName,
              subdomain: schoolData.subdomain,
              plan: schoolData.subscriptionPlan,
              authenticationConfig: expect.any(Object),
              unifiedAuthEnabled: true
            })
          );

          // Verify audit log contains all critical information
          const mainAuditCall = (logSchoolManagementAction as any).mock.calls.find(
            call => call[3].schoolName === schoolData.schoolName
          );
          
          expect(mainAuditCall[3]).toEqual(
            expect.objectContaining({
              schoolName: schoolData.schoolName,
              subdomain: schoolData.subdomain,
              plan: schoolData.subscriptionPlan,
              billingCycle: schoolData.billingCycle,
              extraStudents: schoolData.extraStudents,
              authenticationConfig: expect.objectContaining({
                enableOTPForAdmins: schoolData.enableOTPForAdmins,
                authenticationMethod: schoolData.authenticationMethod
              }),
              setupRequired: true,
              unifiedAuthEnabled: true
            })
          );
        }
      }),
      { numRuns: 100 }
    );
  });
});