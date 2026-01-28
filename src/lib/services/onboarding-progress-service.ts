/**
 * Onboarding Progress Service
 * Task 9.5: Implement independent onboarding progress tracking per school
 * Requirements: 9.5 - THE System SHALL track onboarding progress per school independently
 */

import { db } from "@/lib/db";
import {
  OnboardingStepProgress,
  SchoolOnboardingProgress,
  OnboardingProgressSummary,
  ONBOARDING_STEPS,
  ONBOARDING_VERSION,
  calculateCompletionPercentage,
  getOnboardingStatus,
  getBlockedSteps,
  getFailedSteps,
  estimateTimeRemaining
} from "@/lib/models/onboarding-progress";

export class OnboardingProgressService {
  /**
   * Initialize onboarding progress for a new school
   */
  static async initializeSchoolProgress(schoolId: string, assignedTo?: string): Promise<SchoolOnboardingProgress> {
    const now = new Date();
    
    // Create initial progress for all steps
    const steps: OnboardingStepProgress[] = ONBOARDING_STEPS.map(stepDef => ({
      step: stepDef.step,
      status: 'not_started' as const,
      lastUpdatedAt: now,
      attempts: 0,
      metadata: {}
    }));

    const progress: SchoolOnboardingProgress = {
      schoolId,
      isOnboarded: false,
      currentStep: 1,
      totalSteps: ONBOARDING_STEPS.length,
      completionPercentage: 0,
      startedAt: now,
      lastActivityAt: now,
      steps,
      metadata: {
        version: ONBOARDING_VERSION,
        assignedTo,
        notes: "Onboarding initialized"
      }
    };

    // Store in database as JSON in school metadata
    await db.school.update({
      where: { id: schoolId },
      data: {
        metadata: {
          onboardingProgress: progress
        }
      }
    });

    return progress;
  }

  /**
   * Get onboarding progress for a school
   */
  static async getSchoolProgress(schoolId: string): Promise<SchoolOnboardingProgress | null> {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        isOnboarded: true,
        onboardingStep: true,
        onboardingCompletedAt: true,
        metadata: true
      }
    });

    if (!school) return null;

    // Check if we have detailed progress in metadata
    const metadata = school.metadata as any;
    if (metadata?.onboardingProgress) {
      const progress = metadata.onboardingProgress as SchoolOnboardingProgress;
      
      // Convert string dates back to Date objects
      progress.startedAt = new Date(progress.startedAt);
      progress.lastActivityAt = new Date(progress.lastActivityAt);
      if (progress.completedAt) {
        progress.completedAt = new Date(progress.completedAt);
      }
      
      // Convert step dates
      progress.steps.forEach(step => {
        step.lastUpdatedAt = new Date(step.lastUpdatedAt);
        if (step.startedAt) {
          step.startedAt = new Date(step.startedAt);
        }
        if (step.completedAt) {
          step.completedAt = new Date(step.completedAt);
        }
      });
      
      // Sync with basic fields
      progress.isOnboarded = school.isOnboarded;
      progress.currentStep = school.onboardingStep || 1;
      
      if (school.onboardingCompletedAt && !progress.completedAt) {
        progress.completedAt = school.onboardingCompletedAt;
      }

      // Recalculate derived fields
      progress.completionPercentage = calculateCompletionPercentage(progress.steps);
      
      return progress;
    }

    // Fallback: create progress from basic fields
    return await this.migrateFromBasicProgress(schoolId, school);
  }

  /**
   * Update progress for a specific step
   */
  static async updateStepProgress(
    schoolId: string,
    step: number,
    status: OnboardingStepProgress['status'],
    metadata?: Record<string, any>,
    completedBy?: string,
    errorMessage?: string
  ): Promise<SchoolOnboardingProgress> {
    const progress = await this.getSchoolProgress(schoolId);
    if (!progress) {
      throw new Error(`No onboarding progress found for school ${schoolId}`);
    }

    const now = new Date();
    const stepIndex = progress.steps.findIndex(s => s.step === step);
    
    if (stepIndex === -1) {
      throw new Error(`Invalid step ${step} for school ${schoolId}`);
    }

    const stepProgress = progress.steps[stepIndex];
    const wasNotStarted = stepProgress.status === 'not_started';
    
    // Update step progress
    stepProgress.status = status;
    stepProgress.lastUpdatedAt = now;
    stepProgress.attempts += 1;
    
    if (wasNotStarted && status !== 'not_started') {
      stepProgress.startedAt = now;
    }
    
    if (status === 'completed') {
      stepProgress.completedAt = now;
      stepProgress.completedBy = completedBy;
      stepProgress.errorMessage = undefined;
    } else if (status === 'failed') {
      stepProgress.errorMessage = errorMessage;
    }
    
    if (metadata) {
      stepProgress.metadata = { ...stepProgress.metadata, ...metadata };
    }

    // Update overall progress
    progress.lastActivityAt = now;
    progress.completionPercentage = calculateCompletionPercentage(progress.steps);
    
    // Update current step to next incomplete step
    const nextIncompleteStep = progress.steps.find(s => 
      s.status !== 'completed' && s.status !== 'skipped'
    );
    progress.currentStep = nextIncompleteStep?.step || progress.totalSteps;

    // Check if onboarding is complete
    const allRequiredCompleted = ONBOARDING_STEPS
      .filter(def => def.required)
      .every(def => {
        const stepProgress = progress.steps.find(s => s.step === def.step);
        return stepProgress?.status === 'completed';
      });

    if (allRequiredCompleted && !progress.isOnboarded) {
      progress.isOnboarded = true;
      progress.completedAt = now;
      
      // Update basic school fields
      await db.school.update({
        where: { id: schoolId },
        data: {
          isOnboarded: true,
          onboardingStep: progress.totalSteps,
          onboardingCompletedAt: now
        }
      });
    }

    // Save updated progress
    await db.school.update({
      where: { id: schoolId },
      data: {
        metadata: {
          onboardingProgress: progress
        },
        onboardingStep: progress.currentStep
      }
    });

    return progress;
  }

  /**
   * Reset onboarding progress for a school
   */
  static async resetSchoolProgress(schoolId: string, resetBy?: string): Promise<SchoolOnboardingProgress> {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true }
    });

    if (!school) {
      throw new Error(`School ${schoolId} not found`);
    }

    // Create fresh progress
    const progress = await this.initializeSchoolProgress(schoolId);
    
    // Update basic school fields
    await db.school.update({
      where: { id: schoolId },
      data: {
        isOnboarded: false,
        onboardingStep: 1,
        onboardingCompletedAt: null
      }
    });

    // Log the reset action
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        resource: "SCHOOL",
        resourceId: schoolId,
        changes: {
          action: "onboarding_reset",
          resetBy,
          schoolName: school.name,
          timestamp: new Date()
        },
        checksum: `onboarding-reset-${schoolId}-${Date.now()}`
      }
    });

    return progress;
  }

  /**
   * Get progress summary for multiple schools
   */
  static async getSchoolsProgressSummary(schoolIds: string[]): Promise<OnboardingProgressSummary[]> {
    const schools = await db.school.findMany({
      where: {
        id: { in: schoolIds }
      },
      select: {
        id: true,
        name: true,
        isOnboarded: true,
        onboardingStep: true,
        metadata: true,
        updatedAt: true
      }
    });

    const summaries: OnboardingProgressSummary[] = [];

    for (const school of schools) {
      const progress = await this.getSchoolProgress(school.id);
      
      if (progress) {
        const summary: OnboardingProgressSummary = {
          schoolId: school.id,
          schoolName: school.name,
          isOnboarded: progress.isOnboarded,
          currentStep: progress.currentStep,
          totalSteps: progress.totalSteps,
          completionPercentage: progress.completionPercentage,
          status: getOnboardingStatus(progress),
          lastActivityAt: progress.lastActivityAt,
          estimatedTimeRemaining: estimateTimeRemaining(progress.steps),
          blockedSteps: getBlockedSteps(progress.steps),
          failedSteps: getFailedSteps(progress.steps)
        };
        
        summaries.push(summary);
      }
    }

    return summaries;
  }

  /**
   * Get onboarding analytics across all schools
   */
  static async getOnboardingAnalytics() {
    const schools = await db.school.findMany({
      select: {
        id: true,
        name: true,
        isOnboarded: true,
        onboardingStep: true,
        createdAt: true,
        metadata: true
      }
    });

    const analytics = {
      totalSchools: schools.length,
      onboardedSchools: 0,
      inProgressSchools: 0,
      notStartedSchools: 0,
      stalledSchools: 0,
      failedSchools: 0,
      averageCompletionTime: 0,
      stepAnalytics: ONBOARDING_STEPS.map(step => ({
        step: step.step,
        title: step.title,
        completedCount: 0,
        failedCount: 0,
        averageAttempts: 0,
        averageTimeToComplete: 0
      })),
      completionRateByWeek: [] as Array<{ week: string; completed: number; started: number }>
    };

    let totalCompletionTime = 0;
    let completedCount = 0;

    for (const school of schools) {
      const progress = await this.getSchoolProgress(school.id);
      
      if (progress) {
        const status = getOnboardingStatus(progress);
        
        switch (status) {
          case 'completed':
            analytics.onboardedSchools++;
            if (progress.completedAt) {
              const completionTime = progress.completedAt.getTime() - progress.startedAt.getTime();
              totalCompletionTime += completionTime;
              completedCount++;
            }
            break;
          case 'in_progress':
            analytics.inProgressSchools++;
            break;
          case 'not_started':
            analytics.notStartedSchools++;
            break;
          case 'stalled':
            analytics.stalledSchools++;
            break;
          case 'failed':
            analytics.failedSchools++;
            break;
        }

        // Step analytics
        progress.steps.forEach(stepProgress => {
          const stepAnalytic = analytics.stepAnalytics.find(s => s.step === stepProgress.step);
          if (stepAnalytic) {
            if (stepProgress.status === 'completed') {
              stepAnalytic.completedCount++;
            } else if (stepProgress.status === 'failed') {
              stepAnalytic.failedCount++;
            }
            stepAnalytic.averageAttempts += stepProgress.attempts;
          }
        });
      }
    }

    // Calculate averages
    if (completedCount > 0) {
      analytics.averageCompletionTime = totalCompletionTime / completedCount;
    }

    analytics.stepAnalytics.forEach(stepAnalytic => {
      if (schools.length > 0) {
        stepAnalytic.averageAttempts = stepAnalytic.averageAttempts / schools.length;
      }
    });

    return analytics;
  }

  /**
   * Migrate from basic progress tracking to detailed tracking
   */
  private static async migrateFromBasicProgress(
    schoolId: string,
    school: { isOnboarded: boolean; onboardingStep: number | null; onboardingCompletedAt: Date | null }
  ): Promise<SchoolOnboardingProgress> {
    const now = new Date();
    const currentStep = school.onboardingStep || 1;
    
    // Create steps with appropriate status based on current step
    const steps: OnboardingStepProgress[] = ONBOARDING_STEPS.map(stepDef => {
      let status: OnboardingStepProgress['status'] = 'not_started';
      
      if (school.isOnboarded) {
        status = 'completed';
      } else if (stepDef.step < currentStep) {
        status = 'completed';
      } else if (stepDef.step === currentStep) {
        status = 'in_progress';
      }

      return {
        step: stepDef.step,
        status,
        startedAt: status !== 'not_started' ? now : undefined,
        completedAt: status === 'completed' ? (school.onboardingCompletedAt || now) : undefined,
        lastUpdatedAt: now,
        attempts: status !== 'not_started' ? 1 : 0,
        metadata: {}
      };
    });

    const progress: SchoolOnboardingProgress = {
      schoolId,
      isOnboarded: school.isOnboarded,
      currentStep,
      totalSteps: ONBOARDING_STEPS.length,
      completionPercentage: calculateCompletionPercentage(steps),
      startedAt: now,
      completedAt: school.onboardingCompletedAt || undefined,
      lastActivityAt: now,
      steps,
      metadata: {
        version: ONBOARDING_VERSION,
        notes: "Migrated from basic progress tracking"
      }
    };

    // Save the migrated progress
    await db.school.update({
      where: { id: schoolId },
      data: {
        metadata: {
          onboardingProgress: progress
        }
      }
    });

    return progress;
  }
}