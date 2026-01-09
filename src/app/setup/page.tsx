import { SetupWizard } from "@/components/onboarding/setup-wizard";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
    // Check if onboarding is already completed
    const settings = await db.systemSettings.findFirst();

    if (settings?.onboardingCompleted) {
        redirect("/admin");
    }

    // Check if any admin exists
    const adminCount = await db.user.count({
        where: { role: "ADMIN" },
    });

    // If admin exists and onboarding not marked complete, allow access to complete setup
    // This handles cases where setup was interrupted

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <SetupWizard
                currentStep={settings?.onboardingStep ?? 0}
                hasExistingAdmin={adminCount > 0}
            />
        </div>
    );
}
