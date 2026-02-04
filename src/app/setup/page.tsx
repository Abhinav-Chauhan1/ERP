import { SetupWizard } from "@/components/onboarding/setup-wizard";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCurrentUserSchoolContext } from "@/lib/auth/tenant";
import { schoolContextService } from "@/lib/services/school-context-service";
import { db } from "@/lib/db";

interface SetupPageProps {
    searchParams: { [key: string]: string | string[] | undefined };
}

export const dynamic = "force-dynamic";

/**
 * School-specific setup page for multi-tenant system
 * Requirements: 9.3 - Setup wizard redirection for non-onboarded schools
 */
export default async function SetupPage({ searchParams }: SetupPageProps) {
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

    // Super admins need schoolId in params or context
    let targetSchoolId = context.schoolId;

    if (context.isSuperAdmin) {
        // Use param if available, otherwise fall back to context
        if (searchParams.schoolId && typeof searchParams.schoolId === 'string') {
            targetSchoolId = searchParams.schoolId;
        }

        if (!targetSchoolId) {
            redirect("/super-admin/schools");
        }
    } else {
        // Regular users must have a school context
        if (!targetSchoolId) {
            redirect("/select-school");
        }
    }

    // Check if school is already onboarded
    const onboardingStatus = await schoolContextService.getSchoolOnboardingStatus(targetSchoolId);

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

    // Only school admins or super admins can complete setup
    if (context.role !== "ADMIN" && context.role !== "SUPER_ADMIN") {
        redirect("/login");
    }

    // Check if school has an existing admin user
    const existingAdmin = await db.userSchool.findFirst({
        where: {
            schoolId: targetSchoolId,
            role: "ADMIN",
            isActive: true
        }
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <SetupWizard
                currentStep={onboardingStatus.onboardingStep}
                hasExistingAdmin={!!existingAdmin} // Dynamically check for existing admin
                redirectUrl={context.isSuperAdmin ? "/super-admin/schools" : "/admin"} // Redirect appropriately
                schoolId={targetSchoolId}
            />
        </div>
    );
}
