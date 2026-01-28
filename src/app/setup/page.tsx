import { SetupWizard } from "@/components/onboarding/setup-wizard";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCurrentUserSchoolContext } from "@/lib/auth/tenant";
import { schoolContextService } from "@/lib/services/school-context-service";

export const dynamic = "force-dynamic";

/**
 * School-specific setup page for multi-tenant system
 * Requirements: 9.3 - Setup wizard redirection for non-onboarded schools
 */
export default async function SetupPage() {
    const session = await auth();
    
    // Require authentication
    if (!session?.user?.id) {
        redirect("/login");
    }

    // Get user's school context
    const context = await getCurrentUserSchoolContext();
    
    if (!context) {
        redirect("/login");
    }

    // Super admins should not access this route directly
    if (context.isSuperAdmin) {
        redirect("/super-admin");
    }

    // Regular users must have a school context
    if (!context.schoolId) {
        redirect("/select-school");
    }

    // Check if school is already onboarded
    const onboardingStatus = await schoolContextService.getSchoolOnboardingStatus(context.schoolId);
    
    if (!onboardingStatus) {
        // School not found, redirect to login
        redirect("/login");
    }

    if (onboardingStatus.isOnboarded) {
        // School is already onboarded, redirect to appropriate dashboard
        switch (context.role) {
            case "ADMIN":
                redirect("/admin");
            case "TEACHER":
                redirect("/teacher");
            case "STUDENT":
                redirect("/student");
            case "PARENT":
                redirect("/parent");
            default:
                redirect("/login");
        }
    }

    // Only school admins can complete setup
    if (context.role !== "ADMIN") {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <SetupWizard
                currentStep={onboardingStatus.onboardingStep}
                hasExistingAdmin={true} // Admin already exists in multi-tenant system
                redirectUrl="/admin" // Redirect to admin dashboard after completion
                schoolId={context.schoolId}
            />
        </div>
    );
}
