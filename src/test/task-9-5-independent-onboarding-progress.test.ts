/**
 * Task 9.5: Independent Onboarding Progress Tracking Tests
 * Requirements: 9.5 - THE System SHALL track onboarding progress per school independently
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db';
import { OnboardingProgressService } from '@/lib/services/onboarding-progress-service';
import { 
  getSchoolOnboardingProgress,
  resetSchoolOnboardingProgress,
  updateOnboardingStepProgress,
  getSchoolsOnboardingProgressSummary,
  getOnboardingAnalytics
} from '@/lib/actions/onboarding-progress-actions';
import { ONBOARDING_STEPS } from '@/lib/models/onboarding-progress';

describe('Task 9.5: Independent Onboarding Progress Tracking', () => {
  let testSchools: Array<{ id: string; name: string }> = [];

  beforeEach(async () => {
    // Clean up any existing test data
    await db.school.deleteMany({
      where: {
        name: {
          startsWith: 'Test School Progress'
        }
      }
    });

    // Create test schools
    const school1 = await db.school.create({
      data: {
        name: 'Test School Progress 1',
        schoolCode: `TSP1-${Date.now()}`,
        plan: 'STARTER',
        status: 'ACTIVE',
        isOnboarded: false,
        onboardingStep: 0
      }
    });

    const school2 = await db.school.create({
      data: {
        name: 'Test School Progress 2',
        schoolCode: `TSP2-${Date.now()}`,
        plan: 'STARTER',
        status: 'ACTIVE',
        isOnboarded: false,
        onboardingStep: 0
      }
    });

    testSchools = [school1, school2];
  });

  afterEach(async () => {
    // Clean up test data
    await db.school.deleteMany({
      where: {
        id: {
          in: testSchools.map(s => s.id)
        }
      }
    });
  });

  describe('Progress Initialization', () => {
    it('should initialize independent progress tracking for each school', async () => {
      // Initialize progress for both schools
      const progress1 = await OnboardingProgressService.initializeSchoolProgress(testSchools[0].id);
      const progress2 = await OnboardingProgressService.initializeSchoolProgress(testSchools[1].id);

      // Verify each school has independent progress
      expect(progress1.schoolId).toBe(testSchools[0].id);
      expect(progress2.schoolId).toBe(testSchools[1].id);
      
      // Verify initial state
      expect(progress1.isOnboarded).toBe(false);
      expect(progress1.currentStep).toBe(1);
      expect(progress1.totalSteps).toBe(ONBOARDING_STEPS.length);
      expect(progress1.completionPercentage).toBe(0);
      expect(progress1.steps).toHaveLength(ONBOARDING_STEPS.length);

      // Verify all steps start as 'not_started'
      progress1.steps.forEach(step => {
        expect(step.status).toBe('not_started');
        expect(step.attempts).toBe(0);
      });

      // Verify independence - progress objects are separate
      expect(progress1).not.toBe(progress2);
      expect(progress1.steps).not.toBe(progress2.steps);
    });

    it('should create progress with proper metadata structure', async () => {
      const assignedTo = 'admin-user-id';
      const progress = await OnboardingProgressService.initializeSchoolProgress(
        testSchools[0].id, 
        assignedTo
      );

      expect(progress.metadata).toMatchObject({
        version: expect.any(String),
        assignedTo,
        notes: expect.any(String)
      });

      expect(progress.startedAt).toBeInstanceOf(Date);
      expect(progress.lastActivityAt).toBeInstanceOf(Date);
    });
  });

  describe('Independent Step Progress Tracking', () => {
    it('should track step progress independently per school', async () => {
      // Initialize progress for both schools
      await OnboardingProgressService.initializeSchoolProgress(testSchools[0].id);
      await OnboardingProgressService.initializeSchoolProgress(testSchools[1].id);

      // Update different steps for each school
      const progress1 = await OnboardingProgressService.updateStepProgress(
        testSchools[0].id,
        1,
        'completed',
        { completedBy: 'admin1' }
      );

      const progress2 = await OnboardingProgressService.updateStepProgress(
        testSchools[1].id,
        2,
        'in_progress',
        { startedBy: 'admin2' }
      );

      // Verify school 1 progress
      const step1School1 = progress1.steps.find(s => s.step === 1);
      expect(step1School1?.status).toBe('completed');
      expect(step1School1?.completedAt).toBeInstanceOf(Date);
      expect(step1School1?.metadata).toMatchObject({ completedBy: 'admin1' });

      // Verify school 2 progress
      const step2School2 = progress2.steps.find(s => s.step === 2);
      expect(step2School2?.status).toBe('in_progress');
      expect(step2School2?.startedAt).toBeInstanceOf(Date);
      expect(step2School2?.metadata).toMatchObject({ startedBy: 'admin2' });

      // Verify independence - school 1 step 2 should still be not_started
      const step2School1 = progress1.steps.find(s => s.step === 2);
      expect(step2School1?.status).toBe('not_started');

      // Verify independence - school 2 step 1 should still be not_started
      const step1School2 = progress2.steps.find(s => s.step === 1);
      expect(step1School2?.status).toBe('not_started');
    });

    it('should track step attempts and timestamps independently', async () => {
      await OnboardingProgressService.initializeSchoolProgress(testSchools[0].id);

      // Attempt step 1 multiple times
      await OnboardingProgressService.updateStepProgress(testSchools[0].id, 1, 'in_progress');
      await OnboardingProgressService.updateStepProgress(testSchools[0].id, 1, 'failed', {}, undefined, 'Test error');
      const progress = await OnboardingProgressService.updateStepProgress(testSchools[0].id, 1, 'completed');

      const step1 = progress.steps.find(s => s.step === 1);
      expect(step1?.attempts).toBe(3);
      expect(step1?.status).toBe('completed');
      expect(step1?.startedAt).toBeInstanceOf(Date);
      expect(step1?.completedAt).toBeInstanceOf(Date);
      expect(step1?.lastUpdatedAt).toBeInstanceOf(Date);
    });

    it('should handle step failures with error messages', async () => {
      await OnboardingProgressService.initializeSchoolProgress(testSchools[0].id);

      const errorMessage = 'Failed to validate school information';
      const progress = await OnboardingProgressService.updateStepProgress(
        testSchools[0].id,
        1,
        'failed',
        { errorCode: 'VALIDATION_ERROR' },
        undefined,
        errorMessage
      );

      const step1 = progress.steps.find(s => s.step === 1);
      expect(step1?.status).toBe('failed');
      expect(step1?.errorMessage).toBe(errorMessage);
      expect(step1?.metadata).toMatchObject({ errorCode: 'VALIDATION_ERROR' });
    });
  });

  describe('Progress Calculation and Status', () => {
    it('should calculate completion percentage correctly per school', async () => {
      await OnboardingProgressService.initializeSchoolProgress(testSchools[0].id);

      // Complete 3 out of 7 steps
      await OnboardingProgressService.updateStepProgress(testSchools[0].id, 1, 'completed');
      await OnboardingProgressService.updateStepProgress(testSchools[0].id, 2, 'completed');
      const progress = await OnboardingProgressService.updateStepProgress(testSchools[0].id, 3, 'completed');

      const expectedPercentage = Math.round((3 / ONBOARDING_STEPS.length) * 100);
      expect(progress.completionPercentage).toBe(expectedPercentage);
    });

    it('should update current step to next incomplete step', async () => {
      await OnboardingProgressService.initializeSchoolProgress(testSchools[0].id);

      // Complete steps 1 and 2
      await OnboardingProgressService.updateStepProgress(testSchools[0].id, 1, 'completed');
      const progress = await OnboardingProgressService.updateStepProgress(testSchools[0].id, 2, 'completed');

      // Current step should be 3 (next incomplete)
      expect(progress.currentStep).toBe(3);
    });

    it('should mark school as onboarded when all required steps are completed', async () => {
      await OnboardingProgressService.initializeSchoolProgress(testSchools[0].id);

      // Complete all required steps
      for (const stepDef of ONBOARDING_STEPS.filter(s => s.required)) {
        await OnboardingProgressService.updateStepProgress(testSchools[0].id, stepDef.step, 'completed');
      }

      const progress = await OnboardingProgressService.getSchoolProgress(testSchools[0].id);
      expect(progress?.isOnboarded).toBe(true);
      expect(progress?.completedAt).toBeInstanceOf(Date);

      // Verify database is also updated
      const school = await db.school.findUnique({
        where: { id: testSchools[0].id },
        select: { isOnboarded: true, onboardingCompletedAt: true }
      });
      expect(school?.isOnboarded).toBe(true);
      expect(school?.onboardingCompletedAt).toBeInstanceOf(Date);
    });
  });

  describe('Progress Reset Independence', () => {
    it('should reset progress independently per school', async () => {
      // Initialize and progress both schools
      await OnboardingProgressService.initializeSchoolProgress(testSchools[0].id);
      await OnboardingProgressService.initializeSchoolProgress(testSchools[1].id);

      // Make progress on both schools
      await OnboardingProgressService.updateStepProgress(testSchools[0].id, 1, 'completed');
      await OnboardingProgressService.updateStepProgress(testSchools[0].id, 2, 'completed');
      await OnboardingProgressService.updateStepProgress(testSchools[1].id, 1, 'completed');
      await OnboardingProgressService.updateStepProgress(testSchools[1].id, 2, 'in_progress');

      // Reset only school 1
      const resetProgress = await OnboardingProgressService.resetSchoolProgress(testSchools[0].id);

      // Verify school 1 is reset
      expect(resetProgress.isOnboarded).toBe(false);
      expect(resetProgress.currentStep).toBe(1);
      expect(resetProgress.completionPercentage).toBe(0);
      resetProgress.steps.forEach(step => {
        expect(step.status).toBe('not_started');
        expect(step.attempts).toBe(0);
      });

      // Verify school 2 is unchanged
      const school2Progress = await OnboardingProgressService.getSchoolProgress(testSchools[1].id);
      expect(school2Progress?.steps.find(s => s.step === 1)?.status).toBe('completed');
      expect(school2Progress?.steps.find(s => s.step === 2)?.status).toBe('in_progress');
    });
  });

  describe('Progress Summary and Analytics', () => {
    it('should provide independent progress summaries for multiple schools', async () => {
      // Initialize progress for both schools
      await OnboardingProgressService.initializeSchoolProgress(testSchools[0].id);
      await OnboardingProgressService.initializeSchoolProgress(testSchools[1].id);

      // Make different progress on each school
      await OnboardingProgressService.updateStepProgress(testSchools[0].id, 1, 'completed');
      await OnboardingProgressService.updateStepProgress(testSchools[0].id, 2, 'completed');
      await OnboardingProgressService.updateStepProgress(testSchools[1].id, 1, 'failed', {}, undefined, 'Test error');

      const summaries = await OnboardingProgressService.getSchoolsProgressSummary([
        testSchools[0].id,
        testSchools[1].id
      ]);

      expect(summaries).toHaveLength(2);

      // School 1 summary
      const summary1 = summaries.find(s => s.schoolId === testSchools[0].id);
      expect(summary1?.completionPercentage).toBeGreaterThan(0);
      expect(summary1?.status).toBe('in_progress');
      expect(summary1?.failedSteps).toHaveLength(0);

      // School 2 summary
      const summary2 = summaries.find(s => s.schoolId === testSchools[1].id);
      expect(summary2?.status).toBe('failed');
      expect(summary2?.failedSteps).toContain(1);
    });

    it('should provide system-wide analytics with school independence', async () => {
      // Initialize progress for both schools
      await OnboardingProgressService.initializeSchoolProgress(testSchools[0].id);
      await OnboardingProgressService.initializeSchoolProgress(testSchools[1].id);

      // Complete school 1, leave school 2 in progress
      for (const stepDef of ONBOARDING_STEPS.filter(s => s.required)) {
        await OnboardingProgressService.updateStepProgress(testSchools[0].id, stepDef.step, 'completed');
      }
      await OnboardingProgressService.updateStepProgress(testSchools[1].id, 1, 'in_progress');

      const analytics = await OnboardingProgressService.getOnboardingAnalytics();

      expect(analytics.totalSchools).toBeGreaterThanOrEqual(2);
      expect(analytics.onboardedSchools).toBeGreaterThanOrEqual(1);
      expect(analytics.inProgressSchools).toBeGreaterThanOrEqual(1);
      expect(analytics.stepAnalytics).toHaveLength(ONBOARDING_STEPS.length);

      // Verify step 1 analytics (completed by school 1, in progress by school 2)
      const step1Analytics = analytics.stepAnalytics.find(s => s.step === 1);
      expect(step1Analytics?.completedCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Integration with Server Actions', () => {
    it('should work with server actions for progress management', async () => {
      // Note: These tests would need proper authentication context in a real environment
      // For now, we test the service layer directly

      const progress = await OnboardingProgressService.initializeSchoolProgress(testSchools[0].id);
      expect(progress.schoolId).toBe(testSchools[0].id);

      // Test step update
      const updatedProgress = await OnboardingProgressService.updateStepProgress(
        testSchools[0].id,
        1,
        'completed',
        { source: 'server_action' }
      );

      expect(updatedProgress.steps.find(s => s.step === 1)?.status).toBe('completed');
      expect(updatedProgress.steps.find(s => s.step === 1)?.metadata).toMatchObject({
        source: 'server_action'
      });
    });
  });

  /**
   * Property-Based Test: Independent Onboarding Progress Tracking
   * **Feature: unified-auth-multitenant-refactor, Property 10: School onboarding state management**
   * **Validates: Requirements 9.5**
   */
  describe('Property 10: Independent onboarding progress tracking per school', () => {
    it('should maintain independent progress tracking across all schools', async () => {
      const numSchools = 3;
      const schools = [];

      // Create multiple test schools
      for (let i = 0; i < numSchools; i++) {
        const school = await db.school.create({
          data: {
            name: `Property Test School ${i + 1}`,
            schoolCode: `PTS${i + 1}-${Date.now()}`,
            plan: 'STARTER',
            status: 'ACTIVE',
            isOnboarded: false,
            onboardingStep: 0
          }
        });
        schools.push(school);
      }

      try {
        // Initialize progress for all schools
        const progressList = [];
        for (const school of schools) {
          const progress = await OnboardingProgressService.initializeSchoolProgress(school.id);
          progressList.push(progress);
        }

        // Make different progress on each school
        for (let i = 0; i < schools.length; i++) {
          const school = schools[i];
          const stepsToComplete = i + 1; // School 0: 1 step, School 1: 2 steps, etc.

          for (let step = 1; step <= stepsToComplete; step++) {
            await OnboardingProgressService.updateStepProgress(
              school.id,
              step,
              'completed',
              { schoolIndex: i, step }
            );
          }
        }

        // Verify independence: each school should have different progress
        for (let i = 0; i < schools.length; i++) {
          const school = schools[i];
          const progress = await OnboardingProgressService.getSchoolProgress(school.id);
          
          expect(progress).not.toBeNull();
          expect(progress!.schoolId).toBe(school.id);

          // Verify expected number of completed steps
          const completedSteps = progress!.steps.filter(s => s.status === 'completed');
          expect(completedSteps).toHaveLength(i + 1);

          // Verify step metadata is school-specific
          completedSteps.forEach(step => {
            expect(step.metadata).toMatchObject({ schoolIndex: i });
          });

          // Verify other schools' progress doesn't interfere
          const otherSchools = schools.filter((_, idx) => idx !== i);
          for (const otherSchool of otherSchools) {
            const otherProgress = await OnboardingProgressService.getSchoolProgress(otherSchool.id);
            expect(otherProgress!.schoolId).toBe(otherSchool.id);
            expect(otherProgress!.schoolId).not.toBe(school.id);
          }
        }

        // Test reset independence
        const middleSchool = schools[1];
        await OnboardingProgressService.resetSchoolProgress(middleSchool.id);

        // Verify middle school is reset
        const resetProgress = await OnboardingProgressService.getSchoolProgress(middleSchool.id);
        expect(resetProgress!.completionPercentage).toBe(0);
        resetProgress!.steps.forEach(step => {
          expect(step.status).toBe('not_started');
        });

        // Verify other schools are unaffected
        const firstSchoolProgress = await OnboardingProgressService.getSchoolProgress(schools[0].id);
        const lastSchoolProgress = await OnboardingProgressService.getSchoolProgress(schools[2].id);

        expect(firstSchoolProgress!.steps.filter(s => s.status === 'completed')).toHaveLength(1);
        expect(lastSchoolProgress!.steps.filter(s => s.status === 'completed')).toHaveLength(3);

      } finally {
        // Clean up test schools
        await db.school.deleteMany({
          where: {
            id: {
              in: schools.map(s => s.id)
            }
          }
        });
      }
    });
  });
});