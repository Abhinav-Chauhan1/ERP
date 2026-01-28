/**
 * Property-Based Tests for Setup Wizard Management
 * Task 11.4: Add setup wizard launch and reset functionality
 * Requirements: 9.4 - Create super admin controls for managing onboarding state
 * 
 * **Feature: unified-auth-multitenant-refactor, Property 1: Setup Wizard State Management**
 * **Validates: Requirements 9.4**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { 
  resetSchoolOnboarding, 
  launchSetupWizard,
  getSchoolsOnboardingStatus,
  bulkResetOnboarding
} from '@/lib/actions/school-management-actions';
import { OnboardingProgressService } from '@/lib/services/onboarding-progress-service';

// Mock the database and dependencies
vi.mock('@/lib/db', () => ({
  db: {
    school: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth/tenant', () => ({
  requireSuperAdminAccess: vi.fn().mockResolvedValue(true),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Setup Wizard Management Properties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property 1: Setup Wizard State Management
   * For any school, when super admin resets onboarding, the system should set isOnboarded to false,
   * onboardingStep to 0, and onboardingCompletedAt to null, regardless of previous state
   * **Validates: Requirements 9.4**
   */
  it('Property 1: Setup wizard reset always results in consistent initial state', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary school states
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 50 }),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          isOnboarded: fc.boolean(),
          onboardingStep: fc.integer({ min: 0, max: 10 }),
          onboardingCompletedAt: fc.option(fc.date(), { nil: null }),
        }),
        async (initialSchoolState) => {
          // Arrange
          const { db } = await import('@/lib/db');
          
          (db.school.findUnique as any).mockResolvedValue(initialSchoolState);
          (db.school.update as any).mockResolvedValue({
            ...initialSchoolState,
            isOnboarded: false,
            onboardingStep: 0,
            onboardingCompletedAt: null,
            updatedAt: new Date(),
          });
          (db.auditLog.create as any).mockResolvedValue({});

          // Act
          const result = await resetSchoolOnboarding(initialSchoolState.id);

          // Assert - Property: Reset always produces consistent initial state
          expect(result.success).toBe(true);
          expect(result.data?.school.isOnboarded).toBe(false);
          expect(result.data?.school.onboardingStep).toBe(0);
          expect(result.data?.school.onboardingCompletedAt).toBeNull();

          // Verify database was called with correct reset values
          expect(db.school.update).toHaveBeenCalledWith({
            where: { id: initialSchoolState.id },
            data: expect.objectContaining({
              isOnboarded: false,
              onboardingStep: 0,
              onboardingCompletedAt: null,
            }),
          });

          // Verify audit log was created
          expect(db.auditLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
              action: "RESET_ONBOARDING",
              resource: "SCHOOL",
              resourceId: initialSchoolState.id,
            }),
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Setup Wizard Launch Consistency
   * For any school, when super admin launches setup wizard, the system should set onboardingStep to 1
   * and ensure isOnboarded remains false, regardless of previous state
   * **Validates: Requirements 9.4**
   */
  it('Property 2: Setup wizard launch always sets step to 1 and keeps isOnboarded false', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 50 }),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          isOnboarded: fc.boolean(),
          onboardingStep: fc.integer({ min: 0, max: 10 }),
        }),
        async (initialSchoolState) => {
          // Arrange
          const { db } = await import('@/lib/db');
          
          (db.school.findUnique as any).mockResolvedValue(initialSchoolState);
          (db.school.update as any).mockResolvedValue({
            ...initialSchoolState,
            isOnboarded: false,
            onboardingStep: 1,
            updatedAt: new Date(),
          });
          (db.auditLog.create as any).mockResolvedValue({});

          // Act
          const result = await launchSetupWizard(initialSchoolState.id);

          // Assert - Property: Launch always sets step to 1 and isOnboarded to false
          expect(result.success).toBe(true);
          expect(result.data?.school.onboardingStep).toBe(1);

          // Verify database was called with correct launch values
          expect(db.school.update).toHaveBeenCalledWith({
            where: { id: initialSchoolState.id },
            data: expect.objectContaining({
              isOnboarded: false,
              onboardingStep: 1,
            }),
          });

          // Verify audit log was created
          expect(db.auditLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
              action: "LAUNCH_SETUP_WIZARD",
              resource: "SCHOOL",
              resourceId: initialSchoolState.id,
            }),
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Bulk Operations Consistency
   * For any list of school IDs, bulk reset should affect all schools consistently,
   * setting each to the same initial state regardless of their previous states
   * **Validates: Requirements 9.4**
   */
  it('Property 3: Bulk reset affects all schools consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            isOnboarded: fc.boolean(),
            onboardingStep: fc.integer({ min: 0, max: 10 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (schools) => {
          // Arrange
          const { db } = await import('@/lib/db');
          const schoolIds = schools.map(s => s.id);
          
          (db.school.findMany as any).mockResolvedValue(schools);
          (db.school.updateMany as any).mockResolvedValue({ count: schools.length });
          (db.auditLog.create as any).mockResolvedValue({});

          // Act
          const result = await bulkResetOnboarding(schoolIds);

          // Assert - Property: Bulk operation affects all schools consistently
          expect(result.success).toBe(true);
          expect(result.message).toContain(schools.length.toString());

          // Verify database was called with correct bulk update
          expect(db.school.updateMany).toHaveBeenCalledWith({
            where: { id: { in: schoolIds } },
            data: expect.objectContaining({
              isOnboarded: false,
              onboardingStep: 0,
              onboardingCompletedAt: null,
            }),
          });

          // Verify audit log was created for bulk operation
          expect(db.auditLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
              action: "BULK_RESET_ONBOARDING",
              resource: "SCHOOL",
              resourceId: schoolIds.join(","),
              changes: expect.objectContaining({
                schoolCount: schools.length,
                schoolNames: schools.map(s => s.name),
              }),
            }),
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 4: Status Retrieval Accuracy
   * For any list of schools, getting onboarding status should return accurate information
   * that reflects the current state of each school
   * **Validates: Requirements 9.4**
   */
  it('Property 4: Status retrieval accurately reflects school states', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            isOnboarded: fc.boolean(),
            onboardingStep: fc.integer({ min: 0, max: 7 }),
            onboardingCompletedAt: fc.option(fc.date(), { nil: null }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (schools) => {
          // Arrange
          const { db } = await import('@/lib/db');
          const schoolIds = schools.map(s => s.id);
          
          (db.school.findMany as any).mockResolvedValue(schools);

          // Act
          const result = await getSchoolsOnboardingStatus(schoolIds);

          // Assert - Property: Status accurately reflects current state
          expect(result.success).toBe(true);
          expect(result.data).toHaveLength(schools.length);

          result.data.forEach((statusData, index) => {
            const originalSchool = schools[index];
            
            // Verify each field matches the original school state
            expect(statusData.id).toBe(originalSchool.id);
            expect(statusData.name).toBe(originalSchool.name);
            expect(statusData.isOnboarded).toBe(originalSchool.isOnboarded);
            expect(statusData.onboardingStep).toBe(originalSchool.onboardingStep);
            expect(statusData.onboardingCompletedAt).toEqual(originalSchool.onboardingCompletedAt);
            
            // Verify requiresSetup is correctly calculated
            expect(statusData.requiresSetup).toBe(!originalSchool.isOnboarded);
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 5: Audit Trail Completeness
   * For any setup wizard operation, an audit log entry should always be created
   * with appropriate action type and school information
   * **Validates: Requirements 9.4**
   */
  it('Property 5: All setup wizard operations create audit trail entries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 50 }),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          isOnboarded: fc.boolean(),
          onboardingStep: fc.integer({ min: 0, max: 10 }),
        }),
        fc.constantFrom('reset', 'launch'),
        async (school, operation) => {
          // Arrange
          const { db } = await import('@/lib/db');
          
          (db.school.findUnique as any).mockResolvedValue(school);
          (db.school.update as any).mockResolvedValue({
            ...school,
            isOnboarded: operation === 'reset' ? false : school.isOnboarded,
            onboardingStep: operation === 'reset' ? 0 : 1,
            updatedAt: new Date(),
          });
          (db.auditLog.create as any).mockResolvedValue({});

          // Act
          const result = operation === 'reset' 
            ? await resetSchoolOnboarding(school.id)
            : await launchSetupWizard(school.id);

          // Assert - Property: Audit trail is always created
          expect(result.success).toBe(true);
          expect(db.auditLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
              action: operation === 'reset' ? "RESET_ONBOARDING" : "LAUNCH_SETUP_WIZARD",
              resource: "SCHOOL",
              resourceId: school.id,
              changes: expect.objectContaining({
                schoolName: school.name,
              }),
              checksum: expect.stringMatching(
                operation === 'reset' ? /^reset-onboarding-/ : /^launch-wizard-/
              ),
            }),
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6: Error Handling Consistency
   * For any invalid school ID, all setup wizard operations should fail gracefully
   * with consistent error messages and no side effects
   * **Validates: Requirements 9.4**
   */
  it('Property 6: Invalid school IDs are handled consistently across all operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom('reset', 'launch', 'status'),
        async (invalidSchoolId, operation) => {
          // Arrange
          const { db } = await import('@/lib/db');
          (db.school.findUnique as any).mockResolvedValue(null);
          (db.school.findMany as any).mockResolvedValue([]);

          // Act
          let result;
          switch (operation) {
            case 'reset':
              result = await resetSchoolOnboarding(invalidSchoolId);
              break;
            case 'launch':
              result = await launchSetupWizard(invalidSchoolId);
              break;
            case 'status':
              result = await getSchoolsOnboardingStatus([invalidSchoolId]);
              break;
          }

          // Assert - Property: Invalid IDs handled consistently
          if (operation === 'status') {
            // Status operation returns empty array for non-existent schools
            expect(result.success).toBe(true);
            expect(result.data).toEqual([]);
          } else {
            // Reset and launch operations should fail for non-existent schools
            expect(result.success).toBe(false);
            expect(result.error).toBe("School not found");
          }

          // Verify no side effects occurred
          expect(db.school.update).not.toHaveBeenCalled();
          expect(db.auditLog.create).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 7: State Transition Validity
   * For any school state, valid transitions should always be possible:
   * - Any state can be reset to initial state
   * - Any state can launch setup wizard (set to step 1)
   * **Validates: Requirements 9.4**
   */
  it('Property 7: State transitions are always valid regardless of current state', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 50 }),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          isOnboarded: fc.boolean(),
          onboardingStep: fc.integer({ min: 0, max: 20 }), // Allow invalid steps to test robustness
          onboardingCompletedAt: fc.option(fc.date(), { nil: null }),
        }),
        async (initialState) => {
          // Arrange - Clear mocks for each property run
          vi.clearAllMocks();
          const { db } = await import('@/lib/db');
          
          (db.school.findUnique as any).mockResolvedValue(initialState);
          (db.auditLog.create as any).mockResolvedValue({});

          // Test reset transition
          (db.school.update as any).mockResolvedValue({
            ...initialState,
            isOnboarded: false,
            onboardingStep: 0,
            onboardingCompletedAt: null,
          });

          const resetResult = await resetSchoolOnboarding(initialState.id);

          // Clear mocks before second operation
          vi.clearAllMocks();
          (db.school.findUnique as any).mockResolvedValue(initialState);
          (db.auditLog.create as any).mockResolvedValue({});

          // Test launch transition
          (db.school.update as any).mockResolvedValue({
            ...initialState,
            isOnboarded: false,
            onboardingStep: 1,
          });

          const launchResult = await launchSetupWizard(initialState.id);

          // Assert - Property: All transitions are valid
          expect(resetResult.success).toBe(true);
          expect(launchResult.success).toBe(true);

          // Verify the second operation was performed
          expect(db.school.update).toHaveBeenCalledTimes(1);
          expect(db.auditLog.create).toHaveBeenCalledTimes(1);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 8: Idempotency of Operations
   * Performing the same operation multiple times should be safe and produce consistent results
   * **Validates: Requirements 9.4**
   */
  it('Property 8: Setup wizard operations are idempotent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 50 }),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          isOnboarded: fc.boolean(),
          onboardingStep: fc.integer({ min: 0, max: 7 }),
        }),
        fc.constantFrom('reset', 'launch'),
        async (school, operation) => {
          // Arrange - Clear mocks for each property run
          vi.clearAllMocks();
          const { db } = await import('@/lib/db');
          
          (db.school.findUnique as any).mockResolvedValue(school);
          (db.auditLog.create as any).mockResolvedValue({});

          const expectedState = operation === 'reset' 
            ? { ...school, isOnboarded: false, onboardingStep: 0, onboardingCompletedAt: null }
            : { ...school, isOnboarded: false, onboardingStep: 1 };

          (db.school.update as any).mockResolvedValue(expectedState);

          // Act - Perform operation twice
          const result1 = operation === 'reset' 
            ? await resetSchoolOnboarding(school.id)
            : await launchSetupWizard(school.id);

          // Clear and reset mocks for second operation
          const updateCallCount = (db.school.update as any).mock.calls.length;
          const auditCallCount = (db.auditLog.create as any).mock.calls.length;

          const result2 = operation === 'reset' 
            ? await resetSchoolOnboarding(school.id)
            : await launchSetupWizard(school.id);

          // Assert - Property: Operations are idempotent
          expect(result1.success).toBe(true);
          expect(result2.success).toBe(true);
          
          // Both operations should produce the same result
          expect(result1.data?.school.isOnboarded).toBe(result2.data?.school.isOnboarded);
          expect(result1.data?.school.onboardingStep).toBe(result2.data?.school.onboardingStep);
          
          // Both operations should have been logged (verify we have at least 2 calls)
          expect((db.auditLog.create as any).mock.calls.length).toBeGreaterThanOrEqual(2);
        }
      ),
      { numRuns: 50 }
    );
  });
});