import { db } from "@/lib/db";

/**
 * Check if the initial setup/onboarding has been completed.
 * This is used to redirect users to the setup wizard when the database is empty.
 * 
 * @returns true if setup is complete, false if setup is needed
 */
export async function isSetupComplete(): Promise<boolean> {
    try {
        const settings = await db.systemSettings.findFirst({
            select: {
                onboardingCompleted: true,
            },
        });

        // If no settings exist or onboarding is not complete, setup is needed
        return settings?.onboardingCompleted ?? false;
    } catch (error) {
        // If there's a database error (e.g., tables don't exist), assume setup is needed
        console.error("Error checking setup status:", error);
        return false;
    }
}

/**
 * Check if setup is required (inverse of isSetupComplete for readability)
 * 
 * @returns true if setup wizard should be shown, false otherwise
 */
export async function isSetupRequired(): Promise<boolean> {
    return !(await isSetupComplete());
}
