/**
 * Property-Based Tests for School Management
 * 
 * Tests school management operations for super-admin SaaS completion
 * Feature: super-admin-saas-completion
 * Properties: 8, 9, 10 - School management consistency
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import * as fc from 'fast-check';
import { db } from '@/lib/db';
import { schoolService } from '@/lib/services/school-service';
import { PlanType, SchoolStatus, UserRole } from '@prisma/client';

// Mock super admin access for testing
vi.mock('@/lib/auth/tenant', () => ({
  requireSuperAdminAccess: vi.fn().mockResolvedValue({
    userId: 'super-admin-user-id',
    role: 'SUPER_ADMIN',
    isSuperAdmin: true
  })
}));

describe('School Management Property Tests', () => {
  let testSuperAdminId: string;

  beforeAll(async () => {
    // Create test super admin user
    const superAdmin = await db.user.create({
      data: {
        email: 'superadmin@test.com',
        name: 'Test Super Admin',
        firstName: 'Test',
        lastName: 'Admin',
        role: UserRole.SUPER_ADMIN
      }
    });
    testSuperAdminId = superAdmin.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.userSchool.deleteMany({
      where: {
        user: {
          email: {
            contains: 'schooltest'
          }
        }
      }
    });
    
    await db.school.deleteMany({
      where: {
        schoolCode: {
          startsWith: 'TEST_SCHOOL_'
        }
      }
    });

    await db.user.deleteMany({
      where: {
        email: {
          contains: 'schooltest'
        }
      }
    });

    await db.user.delete({
      where: { id: testSuperAdminId }
    });
  });

  // Generators for test data
  const schoolDataGenerator = fc.record({
    name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length > 0),
    schoolCode: fc.string({ minLength: 3, maxLength: 20 }).map(s => `TEST_SCHOOL_${s.toUpperCase()}`),
    email: fc.emailAddress(),
    phone: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
    address: fc.option(fc.string({ minLength: 10, maxLength: 200 })),
    domain: fc.option(fc.domain()),
    plan: fc.constantFrom(...Object.values(PlanType)),
    tagline: fc.option(fc.string({ minLength: 5, maxLength: 100 })),
    primaryColor: fc.option(fc.string({ minLength: 6, maxLength: 6 }).map(s => `#${s}`)),
    secondaryColor: fc.option(fc.string({ minLength: 6, maxLength: 6 }).map(s => `#${s}`))
  });

  const schoolUpdateDataGenerator = fc.record({
    name: fc.option(fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length > 0)),
    email: fc.option(fc.emailAddress()),
    phone: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
    address: fc.option(fc.string({ minLength: 10, maxLength: 200 })),
    plan: fc.option(fc.constantFrom(...Object.values(PlanType))),
    status: fc.option(fc.constantFrom(...Object.values(SchoolStatus))),
    tagline: fc.option(fc.string({ minLength: 5, maxLength: 100 }))
  });

  const userDataGenerator = fc.record({
    email: fc.emailAddress().map(email => `schooltest.${email}`),
    name: fc.string({ minLength: 3, maxLength: 50 }),
    firstName: fc.string({ minLength: 2, maxLength: 25 }),
    lastName: fc.string({ minLength: 2, maxLength: 25 }),
    role: fc.constantFrom('STUDENT', 'TEACHER', 'ADMIN')
  });

  // Property 8: School Data Management Consistency
  // **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
  test('Property 8: School Data Management Consistency', async () => {
    await fc.assert(fc.asyncProperty(
      schoolDataGenerator,
      schoolUpdateDataGenerator,
      userDataGenerator,
      async (schoolData, updateData, userData) => {
        let createdSchoolId: string | null = null;
        let createdUserId: string | null = null;

        try {
          // Test school creation with validation
          const createdSchool = await schoolService.createSchool(schoolData);
          createdSchoolId = createdSchool.id;

          // Verify school was created with correct data
          expect(createdSchool.name).toBe(schoolData.name);
          expect(createdSchool.schoolCode).toBe(schoolData.schoolCode);
          expect(createdSchool.email).toBe(schoolData.email);
          expect(createdSchool.plan).toBe(schoolData.plan);
          expect(createdSchool.status).toBe(SchoolStatus.ACTIVE);

          // Test school data retrieval consistency
          const retrievedSchool = await schoolService.getSchoolDetails(createdSchool.id);
          expect(retrievedSchool).not.toBeNull();
          expect(retrievedSchool!.id).toBe(createdSchool.id);
          expect(retrievedSchool!.name).toBe(schoolData.name);
          expect(retrievedSchool!.schoolCode).toBe(schoolData.schoolCode);

          // Test school update with validation
          const updatedSchool = await schoolService.updateSchool(createdSchool.id, updateData);
          expect(updatedSchool.id).toBe(createdSchool.id);
          
          // Verify updates were applied correctly
          if (updateData.name) expect(updatedSchool.name).toBe(updateData.name);
          if (updateData.email) expect(updatedSchool.email).toBe(updateData.email);
          if (updateData.plan) expect(updatedSchool.plan).toBe(updateData.plan);
          if (updateData.status) expect(updatedSchool.status).toBe(updateData.status);

          // Test user management within school context
          const createdUser = await db.user.create({
            data: userData
          });
          createdUserId = createdUser.id;

          await schoolService.manageSchoolUser({
            schoolId: createdSchool.id,
            userId: createdUser.id,
            role: userData.role,
            isActive: true
          });

          // Verify user-school relationship
          const schoolUsers = await schoolService.getSchoolUsers(createdSchool.id);
          const userInSchool = schoolUsers.find(u => u.id === createdUser.id);
          expect(userInSchool).toBeDefined();
          expect(userInSchool!.role).toBe(userData.role);
          expect(userInSchool!.isActive).toBe(true);

          // Test comprehensive school data retrieval
          const schoolDetails = await schoolService.getSchoolDetails(createdSchool.id);
          expect(schoolDetails).not.toBeNull();
          expect(schoolDetails!._count).toBeDefined();
          expect(typeof schoolDetails!._count.students).toBe('number');
          expect(typeof schoolDetails!._count.teachers).toBe('number');
          expect(typeof schoolDetails!._count.administrators).toBe('number');

        } finally {
          // Cleanup
          if (createdUserId) {
            await db.userSchool.deleteMany({
              where: { userId: createdUserId }
            });
            await db.user.delete({
              where: { id: createdUserId }
            }).catch(() => {});
          }
          if (createdSchoolId) {
            await db.school.delete({
              where: { id: createdSchoolId }
            }).catch(() => {});
          }
        }
      }
    ), { numRuns: 10 }); // Reduced runs for complex operations
  });

  // Property 9: School Suspension State Management
  // **Validates: Requirements 3.5**
  test('Property 9: School Suspension State Management', async () => {
    await fc.assert(fc.asyncProperty(
      schoolDataGenerator,
      fc.option(fc.string({ minLength: 5, maxLength: 100 })), // suspension reason
      async (schoolData, suspensionReason) => {
        let createdSchoolId: string | null = null;
        let createdUserId: string | null = null;

        try {
          // Create school for testing
          const createdSchool = await schoolService.createSchool(schoolData);
          createdSchoolId = createdSchool.id;

          // Create a test user and associate with school
          const testUser = await db.user.create({
            data: {
              email: `schooltest.suspension.${Date.now()}@test.com`,
              name: 'Test User',
              firstName: 'Test',
              lastName: 'User',
              role: UserRole.STUDENT
            }
          });
          createdUserId = testUser.id;

          await schoolService.manageSchoolUser({
            schoolId: createdSchool.id,
            userId: testUser.id,
            role: 'STUDENT',
            isActive: true
          });

          // Verify initial active state
          expect(createdSchool.status).toBe(SchoolStatus.ACTIVE);

          // Test graceful school suspension with data preservation
          const suspendedSchool = await schoolService.suspendSchool(
            createdSchool.id, 
            suspensionReason || undefined
          );

          // Verify suspension state
          expect(suspendedSchool.status).toBe(SchoolStatus.SUSPENDED);
          expect(suspendedSchool.id).toBe(createdSchool.id);

          // Verify data preservation - school data should still exist
          const schoolDetails = await schoolService.getSchoolDetails(createdSchool.id);
          expect(schoolDetails).not.toBeNull();
          expect(schoolDetails!.name).toBe(schoolData.name);
          expect(schoolDetails!.schoolCode).toBe(schoolData.schoolCode);

          // Verify user-school relationships are deactivated
          const userSchoolRelation = await db.userSchool.findUnique({
            where: {
              userId_schoolId: {
                userId: testUser.id,
                schoolId: createdSchool.id
              }
            }
          });
          expect(userSchoolRelation).not.toBeNull();
          expect(userSchoolRelation!.isActive).toBe(false);

          // Test school reactivation
          const reactivatedSchool = await schoolService.activateSchool(createdSchool.id);
          expect(reactivatedSchool.status).toBe(SchoolStatus.ACTIVE);

          // Verify user-school relationships are reactivated
          const reactivatedRelation = await db.userSchool.findUnique({
            where: {
              userId_schoolId: {
                userId: testUser.id,
                schoolId: createdSchool.id
              }
            }
          });
          expect(reactivatedRelation!.isActive).toBe(true);

          // Test suspension consistency - cannot suspend already suspended school
          await schoolService.suspendSchool(createdSchool.id);
          await expect(
            schoolService.suspendSchool(createdSchool.id)
          ).rejects.toThrow('already suspended');

        } finally {
          // Cleanup
          if (createdUserId) {
            await prisma.userSchool.deleteMany({
              where: { userId: createdUserId }
            });
            await prisma.user.delete({
              where: { id: createdUserId }
            }).catch(() => {});
          }
          if (createdSchoolId) {
            await prisma.school.delete({
              where: { id: createdSchoolId }
            }).catch(() => {});
          }
        }
      }
    ), { numRuns: 5 }); // Reduced runs for complex state management
  });

  // Property 10: School Search and Filter Consistency
  // **Validates: Requirements 3.6**
  test('Property 10: School Search and Filter Consistency', async () => {
    await fc.assert(fc.asyncProperty(
      fc.array(schoolDataGenerator, { minLength: 2, maxLength: 5 }),
      fc.record({
        nameFilter: fc.option(fc.string({ minLength: 2, maxLength: 10 })),
        statusFilter: fc.option(fc.constantFrom(...Object.values(SchoolStatus))),
        planFilter: fc.option(fc.constantFrom(...Object.values(PlanType))),
        page: fc.integer({ min: 1, max: 3 }),
        limit: fc.integer({ min: 1, max: 10 }),
        sortBy: fc.constantFrom('name', 'createdAt', 'updatedAt'),
        sortOrder: fc.constantFrom('asc', 'desc') as fc.Arbitrary<'asc' | 'desc'>
      }),
      async (schoolsData, searchParams) => {
        const createdSchoolIds: string[] = [];

        try {
          // Create multiple schools for testing
          const createdSchools = [];
          for (const schoolData of schoolsData) {
            const school = await schoolService.createSchool({
              ...schoolData,
              schoolCode: `${schoolData.schoolCode}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            });
            createdSchools.push(school);
            createdSchoolIds.push(school.id);
          }

          // Test search with various filters
          const searchFilters: any = {};
          
          if (searchParams.nameFilter) {
            searchFilters.name = searchParams.nameFilter;
          }
          if (searchParams.statusFilter) {
            searchFilters.status = searchParams.statusFilter;
          }
          if (searchParams.planFilter) {
            searchFilters.plan = searchParams.planFilter;
          }

          const searchResults = await schoolService.searchSchools(
            searchFilters,
            searchParams.page,
            searchParams.limit,
            searchParams.sortBy,
            searchParams.sortOrder
          );

          // Verify search result structure consistency
          expect(searchResults).toHaveProperty('schools');
          expect(searchResults).toHaveProperty('total');
          expect(searchResults).toHaveProperty('page');
          expect(searchResults).toHaveProperty('limit');
          expect(searchResults).toHaveProperty('totalPages');

          expect(Array.isArray(searchResults.schools)).toBe(true);
          expect(typeof searchResults.total).toBe('number');
          expect(searchResults.page).toBe(searchParams.page);
          expect(searchResults.limit).toBe(searchParams.limit);

          // Verify pagination consistency
          expect(searchResults.totalPages).toBe(Math.ceil(searchResults.total / searchParams.limit));

          // Verify filter consistency - all returned schools should match filters
          for (const school of searchResults.schools) {
            if (searchParams.nameFilter) {
              expect(school.name.toLowerCase()).toContain(searchParams.nameFilter.toLowerCase());
            }
            if (searchParams.statusFilter) {
              expect(school.status).toBe(searchParams.statusFilter);
            }
            if (searchParams.planFilter) {
              expect(school.plan).toBe(searchParams.planFilter);
            }
          }

          // Verify sorting consistency
          if (searchResults.schools.length > 1) {
            for (let i = 1; i < searchResults.schools.length; i++) {
              const prev = searchResults.schools[i - 1];
              const curr = searchResults.schools[i];
              
              let prevValue: any;
              let currValue: any;
              
              switch (searchParams.sortBy) {
                case 'name':
                  prevValue = prev.name;
                  currValue = curr.name;
                  break;
                case 'createdAt':
                  prevValue = new Date(prev.createdAt);
                  currValue = new Date(curr.createdAt);
                  break;
                case 'updatedAt':
                  prevValue = new Date(prev.updatedAt);
                  currValue = new Date(curr.updatedAt);
                  break;
              }

              if (searchParams.sortOrder === 'asc') {
                expect(prevValue <= currValue).toBe(true);
              } else {
                expect(prevValue >= currValue).toBe(true);
              }
            }
          }

          // Test advanced filtering capabilities
          const advancedFilters = {
            createdAfter: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            hasActiveSubscription: false
          };

          const advancedResults = await schoolService.searchSchools(advancedFilters);
          expect(advancedResults.schools).toBeDefined();
          
          // All results should be created after the specified date
          for (const school of advancedResults.schools) {
            expect(new Date(school.createdAt) >= advancedFilters.createdAfter).toBe(true);
          }

        } finally {
          // Cleanup created schools
          for (const schoolId of createdSchoolIds) {
            await db.school.delete({
              where: { id: schoolId }
            }).catch(() => {});
          }
        }
      }
    ), { numRuns: 3 }); // Reduced runs for complex search operations
  });
});