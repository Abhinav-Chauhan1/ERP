import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { 
  bulkResetOnboarding,
  getSchoolsOnboardingStatus 
} from "@/lib/actions/school-management-actions";
import { OnboardingProgressService } from "@/lib/services/onboarding-progress-service";

/**
 * POST /api/super-admin/schools/bulk/onboarding
 * Bulk onboarding operations for multiple schools
 */
export async function POST(request: NextRequest) {
  try {
    await requireSuperAdminAccess();

    const body = await request.json();
    const { action, schoolIds } = body;

    if (!Array.isArray(schoolIds) || schoolIds.length === 0) {
      return NextResponse.json(
        { error: "schoolIds must be a non-empty array" },
        { status: 400 }
      );
    }

    switch (action) {
      case "reset":
        // Bulk reset onboarding
        const resetResult = await bulkResetOnboarding(schoolIds);
        
        if (resetResult.success) {
          // Also reset detailed progress tracking for each school
          const progressResetPromises = schoolIds.map(async (schoolId) => {
            try {
              await OnboardingProgressService.resetSchoolProgress(schoolId, "super_admin");
            } catch (error) {
              console.warn(`Failed to reset detailed progress for school ${schoolId}:`, error);
            }
          });
          
          await Promise.allSettled(progressResetPromises);
        }
        
        return NextResponse.json(resetResult);

      case "get_status":
        // Get onboarding status for multiple schools
        const statusResult = await getSchoolsOnboardingStatus(schoolIds);
        
        if (statusResult.success) {
          // Also get detailed progress summaries
          try {
            const progressSummaries = await OnboardingProgressService.getSchoolsProgressSummary(schoolIds);
            
            return NextResponse.json({
              success: true,
              data: {
                basic: statusResult.data,
                detailed: progressSummaries,
              },
            });
          } catch (error) {
            console.warn("Failed to get detailed progress summaries:", error);
            return NextResponse.json(statusResult);
          }
        }
        
        return NextResponse.json(statusResult);

      case "launch_multiple":
        // Launch setup wizard for multiple schools
        const launchPromises = schoolIds.map(async (schoolId) => {
          try {
            const result = await import("@/lib/actions/school-management-actions")
              .then(module => module.launchSetupWizard(schoolId));
            
            if (result.success) {
              // Initialize detailed progress tracking if not exists
              try {
                const existingProgress = await OnboardingProgressService.getSchoolProgress(schoolId);
                if (!existingProgress) {
                  await OnboardingProgressService.initializeSchoolProgress(schoolId, "super_admin");
                }
              } catch (progressError) {
                console.warn(`Failed to initialize detailed progress for school ${schoolId}:`, progressError);
              }
            }
            
            return { schoolId, ...result };
          } catch (error) {
            return {
              schoolId,
              success: false,
              error: error instanceof Error ? error.message : "Failed to launch setup wizard",
            };
          }
        });

        const launchResults = await Promise.allSettled(launchPromises);
        const successCount = launchResults.filter(
          result => result.status === "fulfilled" && result.value.success
        ).length;

        return NextResponse.json({
          success: successCount > 0,
          data: {
            message: `Successfully launched setup wizard for ${successCount} out of ${schoolIds.length} schools`,
            results: launchResults.map(result => 
              result.status === "fulfilled" ? result.value : { success: false, error: "Promise rejected" }
            ),
          },
        });

      default:
        return NextResponse.json(
          { error: "Invalid action. Supported actions: reset, get_status, launch_multiple" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in bulk onboarding operation:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk onboarding operation" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/super-admin/schools/bulk/onboarding
 * Get onboarding analytics across all schools
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdminAccess();

    const analytics = await OnboardingProgressService.getOnboardingAnalytics();

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching onboarding analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch onboarding analytics" },
      { status: 500 }
    );
  }
}