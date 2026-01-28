import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { 
  resetSchoolOnboarding, 
  launchSetupWizard,
  getSchoolsOnboardingStatus 
} from "@/lib/actions/school-management-actions";
import { OnboardingProgressService } from "@/lib/services/onboarding-progress-service";

/**
 * GET /api/super-admin/schools/[id]/onboarding
 * Get detailed onboarding progress for a specific school
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdminAccess();

    const schoolId = params.id;

    // Get basic onboarding status
    const statusResult = await getSchoolsOnboardingStatus([schoolId]);
    if (!statusResult.success) {
      return NextResponse.json(
        { error: statusResult.error },
        { status: 400 }
      );
    }

    // Get detailed progress tracking
    const detailedProgress = await OnboardingProgressService.getSchoolProgress(schoolId);

    return NextResponse.json({
      success: true,
      data: {
        basic: statusResult.data[0] || null,
        detailed: detailedProgress,
      },
    });
  } catch (error) {
    console.error("Error fetching school onboarding status:", error);
    return NextResponse.json(
      { error: "Failed to fetch onboarding status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/super-admin/schools/[id]/onboarding
 * Manage onboarding operations (reset, launch, update step)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdminAccess();

    const schoolId = params.id;
    const body = await request.json();
    const { action, step, status, metadata } = body;

    switch (action) {
      case "reset":
        // Reset onboarding to initial state
        const resetResult = await resetSchoolOnboarding(schoolId);
        
        if (resetResult.success) {
          // Also reset detailed progress tracking
          try {
            await OnboardingProgressService.resetSchoolProgress(schoolId, "super_admin");
          } catch (progressError) {
            console.warn("Failed to reset detailed progress:", progressError);
          }
        }
        
        return NextResponse.json(resetResult);

      case "launch":
        // Launch setup wizard
        const launchResult = await launchSetupWizard(schoolId);
        
        if (launchResult.success) {
          // Initialize detailed progress tracking if not exists
          try {
            const existingProgress = await OnboardingProgressService.getSchoolProgress(schoolId);
            if (!existingProgress) {
              await OnboardingProgressService.initializeSchoolProgress(schoolId, "super_admin");
            }
          } catch (progressError) {
            console.warn("Failed to initialize detailed progress:", progressError);
          }
        }
        
        return NextResponse.json(launchResult);

      case "update_step":
        // Update specific step progress
        if (!step || !status) {
          return NextResponse.json(
            { error: "Step and status are required for update_step action" },
            { status: 400 }
          );
        }

        try {
          const updatedProgress = await OnboardingProgressService.updateStepProgress(
            schoolId,
            step,
            status,
            metadata,
            "super_admin"
          );

          return NextResponse.json({
            success: true,
            data: {
              message: `Step ${step} updated to ${status}`,
              progress: updatedProgress,
            },
          });
        } catch (error) {
          return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to update step progress" },
            { status: 400 }
          );
        }

      default:
        return NextResponse.json(
          { error: "Invalid action. Supported actions: reset, launch, update_step" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error managing school onboarding:", error);
    return NextResponse.json(
      { error: "Failed to manage onboarding" },
      { status: 500 }
    );
  }
}