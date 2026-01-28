import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fc from 'fast-check';
import { db } from '@/lib/db';
import { userManagementService } from '@/lib/services/user-management-service';
import { UserRole, SchoolStatus } from '@prisma/client';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    school: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    userSchool: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    student: {
      findFirst: jest.fn(),
    },
    teacher: {
      findFirst: jest.fn(),
    },
    parent: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth/tenant', () => ({
  requireSuperAdminAccess: jest.fn(),
}));

const mockDb = db as any;

/**
 * Property-Based Tests for User Management System
 * Feature: unified-auth-multitenant-refactor, Property 11: Super Admin Universal Access
 * 
 * These tests verify that super admin user management operations maintain
 * consistency and correctness across all possible inputs and scenarios.
 */
describe('User Management System Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  /**
   * Property 1: User Search Consistency
   * For any valid search filters, the system should return consistent results
   * that match the filter criteria and maintain proper pagination.
   * **Validates: Requirements 10.5**
   */
  it('Property 1: User search results should be consistent and properly filtered', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          search: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
          role: fc.option(fc.constantFrom(...Object.values(UserRole))),
          schoolId: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
          status: fc.option(fc.constantFrom('active', 'inactive')),
          page: fc.integer({ min: 1, max: 10 }),
          limit: fc.integer({ min: 1, max: 100 }),
        }),
        async (filters) => {
          // Mock database responses
          const mockUsers = Array.from({ length: filters.limit }, (_, i) => ({
            id: `user-${i}`,
            name: filters.search ? `${filters.search} User ${i}` : `User ${i}`,
            email: `user${i}@example.com`,
            mobile: `+123456789${i}`,
            isActive: filters.status ? filters.status === 'active' : true,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLoginAt: new Date(),
            passwordHash: 'hashed',
            userSchools: [
              {
                id: `us-${i}`,
                schoolId: filters.schoolId || `school-${i}`,
                role: filters.role || UserRole.STUDENT,
                isActive: true,
                createdAt: new Date(),
                school: {
                  id: filters.schoolId || `school-${i}`,
                  name: `School ${i}`,
                  schoolCode: `SCH${i}`,
                  status: SchoolStatus.ACTIVE,
                },
              },
            ],
            _count: { userSchools: 1 },
          }));

          mockDb.user.count.mockResolvedValue(mockUsers.length);
          mockDb.user.findMany.mockResolvedValue(mockUsers);

          const result = await userManagementService.searchUsers(
            {
              search: filters.search || undefined,
              role: filters.role || undefined,
              schoolId: filters.schoolId || undefined,
              status: filters.status || undefined,
            },
            filters.page,
            filters.limit
          );

          // Property: Results should match filter criteria
          expect(result.users).toBeDefined();
          expect(result.total).toBeGreaterThanOrEqual(0);
          expect(result.page).toBe(filters.page);
          expect(result.limit).toBe(filters.limit);
          expect(result.users.length).toBeLessThanOrEqual(filters.limit);

          // Property: Each user should match the search criteria
          result.users.forEach((user) => {
            if (filters.search) {
              expect(user.name.toLowerCase()).toContain(filters.search.toLowerCase());
            }
            if (filters.status) {
              expect(user.isActive).toBe(filters.status === 'active');
            }
            if (filters.role) {
              expect(user.schools.some(school => school.role === filters.role)).toBe(true);
            }
            if (filters.schoolId) {
              expect(user.schools.some(school => school.schoolId === filters.schoolId)).toBe(true);
            }
          });

          // Property: Pagination should be consistent
          expect(result.totalPages).toBe(Math.ceil(result.total / filters.limit));
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 2: User Creation Idempotency
   * For any valid user data and school association, creating a user should
   * either succeed with a new user or associate an existing user with the school.
   * **Validates: Requirements 10.5**
   */
  it('Property 2: User creation should be idempotent and maintain data integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          email: fc.option(fc.emailAddress()),
          mobile: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
          password: fc.option(fc.string({ minLength: 8, maxLength: 50 })),
          role: fc.constantFrom(...Object.values(UserRole).filter(r => r !== UserRole.SUPER_ADMIN)),
          schoolId: fc.string({ minLength: 1, maxLength: 20 }),
          isActive: fc.boolean(),
        }),
        async (userData) => {
          // Ensure at least one contact method
          if (!userData.email && !userData.mobile) {
            userData.email = 'test@example.com';
          }

          // Mock school exists and is active
          mockDb.school.findUnique.mockResolvedValue({
            id: userData.schoolId,
            name: 'Test School',
            schoolCode: 'TEST',
            status: SchoolStatus.ACTIVE,
          });

          // Test case 1: New user creation
          mockDb.user.findFirst.mockResolvedValue(null);
          mockDb.user.create.mockResolvedValue({
            id: 'new-user-id',
            ...userData,
            passwordHash: userData.password ? 'hashed' : null,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLoginAt: null,
          });
          mockDb.userSchool.findUnique.mockResolvedValue(null);
          mockDb.userSchool.create.mockResolvedValue({
            id: 'us-new',
            userId: 'new-user-id',
            schoolId: userData.schoolId,
            role: userData.role,
            isActive: userData.isActive,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          const result1 = await userManagementService.createUser(
            userData,
            {
              userId: 'new-user-id',
              schoolId: userData.schoolId,
              role: userData.role,
              isActive: userData.isActive,
            }
          );

          // Property: New user creation should succeed
          expect(result1.isNewUser).toBe(true);
          expect(result1.user.name).toBe(userData.name);
          expect(result1.user.schools).toHaveLength(1);
          expect(result1.user.schools[0].role).toBe(userData.role);

          // Test case 2: Existing user association
          const existingUser = {
            id: 'existing-user-id',
            email: userData.email,
            mobile: userData.mobile,
            name: userData.name,
          };

          mockDb.user.findFirst.mockResolvedValue(existingUser);
          mockDb.userSchool.findUnique.mockResolvedValue(null); // No existing association
          mockDb.userSchool.create.mockResolvedValue({
            id: 'us-existing',
            userId: 'existing-user-id',
            schoolId: userData.schoolId,
            role: userData.role,
            isActive: userData.isActive,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // Mock getUserDetails for existing user
          mockDb.user.findUnique.mockResolvedValue({
            ...existingUser,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLoginAt: null,
            passwordHash: null,
            userSchools: [
              {
                id: 'us-existing',
                schoolId: userData.schoolId,
                role: userData.role,
                isActive: userData.isActive,
                createdAt: new Date(),
                school: {
                  id: userData.schoolId,
                  name: 'Test School',
                  schoolCode: 'TEST',
                  status: SchoolStatus.ACTIVE,
                },
              },
            ],
            _count: { userSchools: 1 },
          });

          const result2 = await userManagementService.createUser(
            userData,
            {
              userId: 'existing-user-id',
              schoolId: userData.schoolId,
              role: userData.role,
              isActive: userData.isActive,
            }
          );

          // Property: Existing user association should succeed
          expect(result2.isNewUser).toBe(false);
          expect(result2.user.name).toBe(userData.name);
          expect(result2.user.schools).toHaveLength(1);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 3: Bulk Operations Consistency
   * For any valid bulk operation, the system should process all valid users
   * and report accurate success/failure counts.
   * **Validates: Requirements 10.5**
   */
  it('Property 3: Bulk operations should maintain consistency and proper error handling', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userIds: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
          operation: fc.constantFrom('activate', 'deactivate', 'change_role'),
          role: fc.option(fc.constantFrom(...Object.values(UserRole).filter(r => r !== UserRole.SUPER_ADMIN))),
        }),
        async (bulkData) => {
          // Create mock users (some exist, some don't)
          const existingUserIds = bulkData.userIds.slice(0, Math.floor(bulkData.userIds.length / 2));
          const mockUsers = existingUserIds.map((id, index) => ({
            id,
            name: `User ${index}`,
            isActive: bulkData.operation === 'deactivate', // Opposite of target state
          }));

          mockDb.user.findMany.mockResolvedValue(mockUsers);
          mockDb.user.update.mockResolvedValue({});
          mockDb.userSchool.updateMany.mockResolvedValue({});

          const result = await userManagementService.performBulkOperation({
            userIds: bulkData.userIds,
            operation: bulkData.operation,
            data: bulkData.role ? { role: bulkData.role } : undefined,
          });

          // Property: Total operations should equal input count
          expect(result.success + result.failed).toBe(bulkData.userIds.length);

          // Property: Success count should match existing users
          expect(result.success).toBe(existingUserIds.length);

          // Property: Failed count should match missing users
          const missingUserCount = bulkData.userIds.length - existingUserIds.length;
          expect(result.failed).toBe(missingUserCount);

          // Property: Error array should contain all missing users
          expect(result.errors).toHaveLength(missingUserCount);
          result.errors.forEach((error) => {
            expect(bulkData.userIds).toContain(error.userId);
            expect(existingUserIds).not.toContain(error.userId);
            expect(error.error).toBe('User not found');
          });
        }
      ),
      { numRuns: 40 }
    );
  });

  /**
   * Property 4: User Update Validation
   * For any valid user update data, the system should validate conflicts
   * and maintain data integrity.
   * **Validates: Requirements 10.5**
   */
  it('Property 4: User updates should validate conflicts and maintain integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.string({ minLength: 1, maxLength: 20 }),
          updateData: fc.record({
            name: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
            email: fc.option(fc.emailAddress()),
            mobile: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
            isActive: fc.option(fc.boolean()),
          }),
        }),
        async ({ userId, updateData }) => {
          // Mock existing user
          const existingUser = {
            id: userId,
            name: 'Original Name',
            email: 'original@example.com',
            mobile: '+1234567890',
            isActive: true,
          };

          mockDb.user.findUnique.mockResolvedValue(existingUser);

          // Test case 1: No conflicts
          mockDb.user.findFirst.mockResolvedValue(null);
          mockDb.user.update.mockResolvedValue({
            ...existingUser,
            ...updateData,
          });
          mockDb.userSchool.updateMany.mockResolvedValue({});

          // Mock getUserDetails response
          mockDb.user.findUnique.mockResolvedValueOnce({
            ...existingUser,
            ...updateData,
            userSchools: [],
            _count: { userSchools: 0 },
          });

          const result = await userManagementService.updateUser(userId, updateData);

          // Property: Update should succeed without conflicts
          expect(result.id).toBe(userId);
          if (updateData.name) expect(result.name).toBe(updateData.name);
          if (updateData.email) expect(result.email).toBe(updateData.email);
          if (updateData.mobile) expect(result.mobile).toBe(updateData.mobile);
          if (updateData.isActive !== undefined) expect(result.isActive).toBe(updateData.isActive);

          // Test case 2: Email/mobile conflict
          if (updateData.email || updateData.mobile) {
            mockDb.user.findFirst.mockResolvedValue({
              id: 'other-user-id',
              email: updateData.email,
              mobile: updateData.mobile,
            });

            await expect(
              userManagementService.updateUser(userId, updateData)
            ).rejects.toThrow('Email or mobile number already exists');
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 5: User Statistics Accuracy
   * For any set of users and schools, the statistics should accurately
   * reflect the current state of the system.
   * **Validates: Requirements 10.5**
   */
  it('Property 5: User statistics should accurately reflect system state', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          totalUsers: fc.integer({ min: 0, max: 1000 }),
          activeUsers: fc.integer({ min: 0, max: 1000 }),
          roleDistribution: fc.record({
            [UserRole.STUDENT]: fc.integer({ min: 0, max: 100 }),
            [UserRole.PARENT]: fc.integer({ min: 0, max: 100 }),
            [UserRole.TEACHER]: fc.integer({ min: 0, max: 100 }),
            [UserRole.ADMIN]: fc.integer({ min: 0, max: 100 }),
            [UserRole.SUPER_ADMIN]: fc.integer({ min: 0, max: 10 }),
          }),
          multiSchoolUsers: fc.integer({ min: 0, max: 100 }),
          recentlyCreated: fc.integer({ min: 0, max: 50 }),
          recentlyActive: fc.integer({ min: 0, max: 100 }),
        }),
        async (statsData) => {
          // Ensure active users don't exceed total users
          const activeUsers = Math.min(statsData.activeUsers, statsData.totalUsers);
          const inactiveUsers = statsData.totalUsers - activeUsers;

          // Mock database responses
          mockDb.user.count
            .mockResolvedValueOnce(statsData.totalUsers) // total
            .mockResolvedValueOnce(activeUsers) // active
            .mockResolvedValueOnce(inactiveUsers) // inactive
            .mockResolvedValueOnce(statsData.multiSchoolUsers) // multi-school
            .mockResolvedValueOnce(statsData.recentlyCreated) // recently created
            .mockResolvedValueOnce(statsData.recentlyActive); // recently active

          // Mock role distribution
          const roleCountsArray = Object.entries(statsData.roleDistribution).map(([role, count]) => ({
            role: role as UserRole,
            _count: { role: count },
          }));
          mockDb.userSchool.groupBy.mockResolvedValue(roleCountsArray);

          // Mock multi-school users query
          mockDb.userSchool.groupBy.mockResolvedValueOnce(
            Array.from({ length: statsData.multiSchoolUsers }, (_, i) => ({
              userId: `multi-user-${i}`,
            }))
          );

          const result = await userManagementService.getUserStatistics();

          // Property: Statistics should match expected values
          expect(result.total).toBe(statsData.totalUsers);
          expect(result.active).toBe(activeUsers);
          expect(result.inactive).toBe(inactiveUsers);
          expect(result.multiSchoolUsers).toBe(statsData.multiSchoolUsers);
          expect(result.recentlyCreated).toBe(statsData.recentlyCreated);
          expect(result.recentlyActive).toBe(statsData.recentlyActive);

          // Property: Role distribution should be accurate
          Object.entries(statsData.roleDistribution).forEach(([role, expectedCount]) => {
            expect(result.byRole[role as UserRole]).toBe(expectedCount);
          });

          // Property: Active + inactive should equal total
          expect(result.active + result.inactive).toBe(result.total);
        }
      ),
      { numRuns: 25 }
    );
  });

  /**
   * Property 6: User Deletion Safety
   * For any user deletion attempt, the system should enforce safety rules
   * and prevent deletion of critical users or users with dependencies.
   * **Validates: Requirements 10.5**
   */
  it('Property 6: User deletion should enforce safety rules consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.string({ minLength: 1, maxLength: 20 }),
          userRole: fc.constantFrom(...Object.values(UserRole)),
          schoolCount: fc.integer({ min: 1, max: 5 }),
          auditLogCount: fc.integer({ min: 0, max: 100 }),
        }),
        async ({ userId, userRole, schoolCount, auditLogCount }) => {
          const mockUser = {
            id: userId,
            name: 'Test User',
            email: 'test@example.com',
            userSchools: Array.from({ length: schoolCount }, (_, i) => ({
              id: `us-${i}`,
              role: userRole,
              schoolId: `school-${i}`,
            })),
            _count: {
              userSchools: schoolCount,
              auditLogs: auditLogCount,
            },
          };

          mockDb.user.findUnique.mockResolvedValue(mockUser);

          if (userRole === UserRole.SUPER_ADMIN) {
            // Property: Super admin users cannot be deleted
            await expect(
              userManagementService.performBulkOperation({
                userIds: [userId],
                operation: 'delete',
              })
            ).resolves.toMatchObject({
              success: 0,
              failed: 1,
              errors: [
                {
                  userId,
                  error: 'Cannot delete super admin users',
                },
              ],
            });
          } else if (schoolCount > 1) {
            // Property: Users with multiple schools cannot be deleted
            await expect(
              userManagementService.performBulkOperation({
                userIds: [userId],
                operation: 'delete',
              })
            ).resolves.toMatchObject({
              success: 0,
              failed: 1,
              errors: [
                {
                  userId,
                  error: 'Cannot delete user associated with multiple schools',
                },
              ],
            });
          } else {
            // Property: Regular users with single school can be deleted
            mockDb.user.delete.mockResolvedValue({});
            
            const result = await userManagementService.performBulkOperation({
              userIds: [userId],
              operation: 'delete',
            });

            expect(result.success).toBe(1);
            expect(result.failed).toBe(0);
          }
        }
      ),
      { numRuns: 40 }
    );
  });
});