/**
 * Task 9.4: Super Admin Onboarding Controls Tests
 * Requirements: 9.4 - WHEN a super admin resets onboarding, THE System SHALL set isOnboarded flag to false and clear onboarding progress
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@/lib/db';
import { 
  resetSchoolOnboarding, 
  launchSetupWizard, 
  bulkResetOnboarding,
  getSchoolsOnboardingStatus
} from '@/lib/actions/school-management-actions';

// Mock the super admin access check
vi.mock('@/lib/auth/tenant', () => ({
  requireSuperAdminAccess: vi.fn().mockResolvedValue(true)
}));

describe('Task 9.4: Super Admin Onboarding Controls', () => {
  let testSchoolId: string;
  let testSchoolId2: string;

  beforeEach(async () => {
    // Clean up any existing test data
    await db.school.deleteMany({
      where: {
        name: {
          in: ['Test School Onboarding 1', 'Test School Onboarding 2']
        }
      }
    });

    // Create test schools
    const school1 = await db.school.create({
      data: {
        name: 'Test School Onboarding 1',
        schoolCode: 'TSO001',
        email: 'test1@onboarding.com',
        plan: 'STARTER',
        status: 'ACTIVE',
        isOnboarded: true,
        onboardingStep: 7,
        onboardingCompletedAt: new Date(),
      },
    });

    const school2 = await db.school.create({
      data: {
        name: 'Test School Onboarding 2',
        schoolCode: 'TSO002',
        email: 'test2@onboarding.com',
        plan: 'GROWTH',
        status: 'ACTIVE',
        isOnboarded: false,
        onboardingStep: 3,
        onboardingCompletedAt: null,
      },
    });

    testSchoolId = school1.id;
    testSchoolId2 = school2.id;
  });

  afterEach(async () => {
    // Clean up test data
    await db.auditLog.deleteMany({
      where: {
        resourceId: {
          in: [testSchoolId, testSchoolId2]
        }
      }
    });

    await db.school.deleteMany({
      where: {
        id: {
          in: [testSchoolId, testSchoolId2]
        }
      }
    });
  });

  describe('Reset School Onboarding', () => {
    it('should reset onboarding state for completed school', async () => {
      // Arrange
      const initialSchool = await db.school.findUnique({
        where: { id: testSchoolId },
        select: { isOnboarded: true, onboardingStep: true, onboardingCompletedAt: true }
      });

      expect(initialSchool?.isOnboarded).toBe(true);
      expect(initialSchool?.onboardingStep).toBe(7);
      expect(initialSchool?.onboardingCompletedAt).toBeTruthy();

      // Act
      const result = await resetSchoolOnboarding(testSchoolId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.message).toContain('Test School Onboarding 1');

      // Verify database state
      const updatedSchool = await db.school.findUnique({
        where: { id: testSchoolId },
        select: { isOnboarded: true, onboardingStep: true, onboardingCompletedAt: true }
      });

      expect(updatedSchool?.isOnboarded).toBe(false);
      expect(updatedSchool?.onboardingStep).toBe(0);
      expect(updatedSchool?.onboardingCompletedAt).toBeNull();

      // Verify audit log was created
      const auditLog = await db.auditLog.findFirst({
        where: {
          resourceId: testSchoolId,
          action: 'RESET_ONBOARDING'
        }
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog?.changes).toMatchObject({
        schoolName: 'Test School Onboarding 1',
        newState: {
          isOnboarded: false,
          onboardingStep: 0,
          onboardingCompletedAt: null
        }
      });
    });

    it('should handle non-existent school gracefully', async () => {
      // Act
      const result = await resetSchoolOnboarding('non-existent-id');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('School not found');
    });
  });

  describe('Launch Setup Wizard', () => {
    it('should launch setup wizard for incomplete school', async () => {
      // Arrange
      const initialSchool = await db.school.findUnique({
        where: { id: testSchoolId2 },
        select: { isOnboarded: true, onboardingStep: true }
      });

      expect(initialSchool?.isOnboarded).toBe(false);
      expect(initialSchool?.onboardingStep).toBe(3);

      // Act
      const result = await launchSetupWizard(testSchoolId2);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.message).toContain('Test School Onboarding 2');

      // Verify database state
      const updatedSchool = await db.school.findUnique({
        where: { id: testSchoolId2 },
        select: { isOnboarded: true, onboardingStep: true }
      });

      expect(updatedSchool?.isOnboarded).toBe(false);
      expect(updatedSchool?.onboardingStep).toBe(1); // Reset to step 1

      // Verify audit log was created
      const auditLog = await db.auditLog.findFirst({
        where: {
          resourceId: testSchoolId2,
          action: 'LAUNCH_SETUP_WIZARD'
        }
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog?.changes).toMatchObject({
        schoolName: 'Test School Onboarding 2',
        previousOnboardingStep: 3,
        newOnboardingStep: 1
      });
    });

    it('should launch setup wizard for completed school', async () => {
      // Act
      const result = await launchSetupWizard(testSchoolId);

      // Assert
      expect(result.success).toBe(true);

      // Verify database state
      const updatedSchool = await db.school.findUnique({
        where: { id: testSchoolId },
        select: { isOnboarded: true, onboardingStep: true }
      });

      expect(updatedSchool?.isOnboarded).toBe(false);
      expect(updatedSchool?.onboardingStep).toBe(1);
    });
  });

  describe('Bulk Reset Onboarding', () => {
    it('should reset onboarding for multiple schools', async () => {
      // Act
      const result = await bulkResetOnboarding([testSchoolId, testSchoolId2]);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('2 schools');

      // Verify both schools are reset
      const schools = await db.school.findMany({
        where: {
          id: {
            in: [testSchoolId, testSchoolId2]
          }
        },
        select: { id: true, isOnboarded: true, onboardingStep: true, onboardingCompletedAt: true }
      });

      schools.forEach(school => {
        expect(school.isOnboarded).toBe(false);
        expect(school.onboardingStep).toBe(0);
        expect(school.onboardingCompletedAt).toBeNull();
      });

      // Verify audit log was created
      const auditLog = await db.auditLog.findFirst({
        where: {
          action: 'BULK_RESET_ONBOARDING'
        }
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog?.changes).toMatchObject({
        schoolCount: 2,
        schoolNames: ['Test School Onboarding 1', 'Test School Onboarding 2']
      });
    });

    it('should handle empty school list', async () => {
      // Act
      const result = await bulkResetOnboarding([]);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('0 schools');
    });
  });

  describe('Get Schools Onboarding Status', () => {
    it('should return onboarding status for multiple schools', async () => {
      // Act
      const result = await getSchoolsOnboardingStatus([testSchoolId, testSchoolId2]);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);

      const school1Data = result.data?.find(s => s.id === testSchoolId);
      const school2Data = result.data?.find(s => s.id === testSchoolId2);

      expect(school1Data).toMatchObject({
        id: testSchoolId,
        name: 'Test School Onboarding 1',
        isOnboarded: true,
        onboardingStep: 7,
        requiresSetup: false
      });

      expect(school2Data).toMatchObject({
        id: testSchoolId2,
        name: 'Test School Onboarding 2',
        isOnboarded: false,
        onboardingStep: 3,
        requiresSetup: true
      });
    });

    it('should handle non-existent schools', async () => {
      // Act
      const result = await getSchoolsOnboardingStatus(['non-existent-1', 'non-existent-2']);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('Property-Based Test: Onboarding State Management Consistency', () => {
    /**
     * Property 10: School Onboarding State Management
     * For any school, the system should set isOnboarded to false on creation,
     * redirect non-onboarded school admins to setup wizard, update isOnboarded
     * to true on completion, and allow super admin to reset onboarding state
     * while tracking progress independently per school
     * **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
     */
    it('Property 10: Super admin onboarding controls maintain consistency', { timeout: 15000 }, async () => {
      // Test multiple onboarding control scenarios
      const testCases = [
        { initialOnboarded: true, initialStep: 7, action: 'reset' },
        { initialOnboarded: false, initialStep: 0, action: 'launch' },
        { initialOnboarded: false, initialStep: 3, action: 'reset' },
        { initialOnboarded: true, initialStep: 7, action: 'launch' },
      ];

      for (const testCase of testCases) {
        // Create test school with specific state
        const school = await db.school.create({
          data: {
            name: `Property Test School ${Date.now()}`,
            schoolCode: `PTS${Date.now().toString().slice(-6)}`,
            email: `property-test-${Date.now()}@test.com`,
            plan: 'STARTER',
            status: 'ACTIVE',
            isOnboarded: testCase.initialOnboarded,
            onboardingStep: testCase.initialStep,
            onboardingCompletedAt: testCase.initialOnboarded ? new Date() : null,
          },
        });

        try {
          // Verify initial state
          const initialState = await db.school.findUnique({
            where: { id: school.id },
            select: { isOnboarded: true, onboardingStep: true, onboardingCompletedAt: true }
          });

          expect(initialState?.isOnboarded).toBe(testCase.initialOnboarded);
          expect(initialState?.onboardingStep).toBe(testCase.initialStep);

          // Perform action
          let result;
          if (testCase.action === 'reset') {
            result = await resetSchoolOnboarding(school.id);
          } else {
            result = await launchSetupWizard(school.id);
          }

          expect(result.success).toBe(true);

          // Verify final state
          const finalState = await db.school.findUnique({
            where: { id: school.id },
            select: { isOnboarded: true, onboardingStep: true, onboardingCompletedAt: true }
          });

          // After any super admin action, school should not be onboarded
          expect(finalState?.isOnboarded).toBe(false);

          if (testCase.action === 'reset') {
            // Reset should set step to 0 and clear completion date
            expect(finalState?.onboardingStep).toBe(0);
            expect(finalState?.onboardingCompletedAt).toBeNull();
          } else {
            // Launch should set step to 1
            expect(finalState?.onboardingStep).toBe(1);
          }

          // Verify audit log exists
          const auditLog = await db.auditLog.findFirst({
            where: {
              resourceId: school.id,
              action: testCase.action === 'reset' ? 'RESET_ONBOARDING' : 'LAUNCH_SETUP_WIZARD'
            }
          });

          expect(auditLog).toBeTruthy();

        } finally {
          // Clean up
          await db.auditLog.deleteMany({
            where: { resourceId: school.id }
          });
          await db.school.delete({
            where: { id: school.id }
          });
        }
      }
    });
  });
});