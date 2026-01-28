/**
 * Onboarding Progress Actions
 * Task 9.5: Implement independent onboarding progress tracking per school
 * Requirements: 9.5 - THE System SHALL track onboarding progress per school independently
 */

"use server";

import { requireSuperAdminAccess, getCurrentSchoolId } from "@/lib/auth/tenant";
import { OnboardingProgressService } from "@/lib/services/onboarding-progress-service";
import { revalidatePath } from "next/cache";
import { OnboardingStepProgress } from "@/lib/models/onboarding-progress";

/**
 * Get detailed onboarding progress for a specific school
 */
export async function getSchoolOnboardingProgress(schoolId: string) {
  await requireSuperAdminAccess();

  try {
    const progress = await OnboardingProgressService.getSchoolProgress(schoolId);
    
    if (!progress) {
      return {
        success: false,
        error: "School not found or no progress data available"
      };
    }

    return {
      success: true,
      data: progress
    };
  } catch (error) {
    console.error("Error fetching school onboarding progress:", error);
    return {
      success: false,
      error: "Failed to fetch onboarding progress"
    };
  }
}

/**
 * Get onboarding progress for the current school (for school admins)
 */
export async function getCurrentSchoolOnboardingProgress() {
  try {
    const schoolId = await getCurrentSchoolId();
    
    if (!schoolId) {
      return {
        success: false,
        error: "No school context found"
      };
    }

    const progress = await OnboardingProgressService.getSchoolProgress(schoolId);
    
    if (!progress) {
      // Initialize progress if it doesn't exist
      const newProgress = await OnboardingProgressService.initializeSchoolProgress(schoolId);
      return {
        success: true,
        data: newProgress
      };
    }

    return {
      success: true,
      data: progress
    };
  } catch (error) {
    console.error("Error fetching current school onboarding progress:", error);
    return {
      success: false,
      error: "Failed to fetch onboarding progress"
    };
  }
}

/**
 * Update progress for a specific onboarding step
 */
export async function updateOnboardingStepProgress(
  step: number,
  status: OnboardingStepProgress['status'],
  metadata?: Record<string, any>,
  errorMessage?: string
) {
  try {
    const schoolId = await getCurrentSchoolId();
    
    if (!schoolId) {
      return {
        success: false,
        error: "No school context found"
      };
    }

    // For now, we don't have user context in server actions, so completedBy will be undefined
    // This could be enhanced later with proper user context
    const progress = await OnboardingProgressService.updateStepProgress(
      schoolId,
      step,
      status,
      metadata,
      undefined, // completedBy - would need user context
      errorMessage
    );

    revalidatePath("/admin");
    revalidatePath("/setup");

    return {
      success: true,
      data: progress
    };
  } catch (error) {
    console.error("Error updating onboarding step progress:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update step progress"
    };
  }
}

/**
 * Reset onboarding progress for a school (Super Admin only)
 */
export async function resetSchoolOnboardingProgress(schoolId: string) {
  await requireSuperAdminAccess();

  try {
    const progress = await OnboardingProgressService.resetSchoolProgress(schoolId);

    revalidatePath("/super-admin/schools");
    revalidatePath(`/super-admin/schools/${schoolId}`);

    return {
      success: true,
      data: {
        progress,
        message: "Onboarding progress has been reset successfully"
      }
    };
  } catch (error) {
    console.error("Error resetting school onboarding progress:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reset onboarding progress"
    };
  }
}

/**
 * Get onboarding progress summary for multiple schools (Super Admin only)
 */
export async function getSchoolsOnboardingProgressSummary(schoolIds: string[]) {
  await requireSuperAdminAccess();

  try {
    const summaries = await OnboardingProgressService.getSchoolsProgressSummary(schoolIds);

    return {
      success: true,
      data: summaries
    };
  } catch (error) {
    console.error("Error fetching schools onboarding progress summary:", error);
    return {
      success: false,
      error: "Failed to fetch onboarding progress summary"
    };
  }
}

/**
 * Get comprehensive onboarding analytics (Super Admin only)
 */
export async function getOnboardingAnalytics() {
  await requireSuperAdminAccess();

  try {
    const analytics = await OnboardingProgressService.getOnboardingAnalytics();

    return {
      success: true,
      data: analytics
    };
  } catch (error) {
    console.error("Error fetching onboarding analytics:", error);
    return {
      success: false,
      error: "Failed to fetch onboarding analytics"
    };
  }
}

/**
 * Initialize onboarding progress for a school (Super Admin only)
 */
export async function initializeSchoolOnboardingProgress(schoolId: string, assignedTo?: string) {
  await requireSuperAdminAccess();

  try {
    const progress = await OnboardingProgressService.initializeSchoolProgress(schoolId, assignedTo);

    revalidatePath("/super-admin/schools");
    revalidatePath(`/super-admin/schools/${schoolId}`);

    return {
      success: true,
      data: {
        progress,
        message: "Onboarding progress initialized successfully"
      }
    };
  } catch (error) {
    console.error("Error initializing school onboarding progress:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to initialize onboarding progress"
    };
  }
}

/**
 * Bulk reset onboarding progress for multiple schools (Super Admin only)
 */
export async function bulkResetOnboardingProgress(schoolIds: string[]) {
  await requireSuperAdminAccess();

  try {
    const results = [];
    
    for (const schoolId of schoolIds) {
      try {
        const progress = await OnboardingProgressService.resetSchoolProgress(schoolId);
        results.push({ schoolId, success: true, progress });
      } catch (error) {
        results.push({ 
          schoolId, 
          success: false, 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }

    revalidatePath("/super-admin/schools");

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return {
      success: true,
      data: {
        results,
        summary: {
          total: schoolIds.length,
          successful: successCount,
          failed: failureCount
        },
        message: `Bulk reset completed: ${successCount} successful, ${failureCount} failed`
      }
    };
  } catch (error) {
    console.error("Error bulk resetting onboarding progress:", error);
    return {
      success: false,
      error: "Failed to bulk reset onboarding progress"
    };
  }
}

/**
 * Mark a specific step as completed with metadata
 */
export async function completeOnboardingStep(
  step: number,
  metadata?: Record<string, any>
) {
  return updateOnboardingStepProgress(step, 'completed', metadata);
}

/**
 * Mark a specific step as failed with error message
 */
export async function failOnboardingStep(
  step: number,
  errorMessage: string,
  metadata?: Record<string, any>
) {
  return updateOnboardingStepProgress(step, 'failed', metadata, errorMessage);
}

/**
 * Start a specific onboarding step
 */
export async function startOnboardingStep(
  step: number,
  metadata?: Record<string, any>
) {
  return updateOnboardingStepProgress(step, 'in_progress', metadata);
}

/**
 * Skip a specific onboarding step (if not required)
 */
export async function skipOnboardingStep(
  step: number,
  reason?: string
) {
  const metadata = reason ? { skipReason: reason } : undefined;
  return updateOnboardingStepProgress(step, 'skipped', metadata);
}