import { db } from "@/lib/db";
import { getCurrentUserSchoolContext } from "@/lib/auth/tenant";

/**
 * Check if the initial setup/onboarding has been completed for the current user's school.
 * In multi-school SaaS, setup is per-school, not per-database.
 *
 * @returns true if setup is complete for current school, false if setup is needed
 */
export async function isSetupComplete(): Promise<boolean> {
    try {
        const context = await getCurrentUserSchoolContext();

        // If no authenticated user or no school context, setup might be needed
        if (!context) {
            return false;
        }

        // Super admin can always access (they manage schools)
        if (context.isSuperAdmin) {
            return true;
        }

        // Check if the user's school has completed onboarding
        if (!context.schoolId) {
            return false;
        }

        const school = await db.school.findUnique({
            where: { id: context.schoolId },
            select: {
                isOnboarded: true,
            },
        });

        return school?.isOnboarded ?? false;
    } catch (error) {
        // If there's a database error, assume setup is needed
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

/**
 * Check if database has any schools (legacy check for initial system setup)
 * This is used when there are no schools in the system yet
 */
export async function hasSchools(): Promise<boolean> {
    try {
        const schoolCount = await db.school.count();
        return schoolCount > 0;
    } catch (error) {
        console.error("Error checking if schools exist:", error);
        return false;
    }
}

/**
 * Check if system needs initial setup (no schools exist)
 * This is different from per-school setup
 */
export async function isSystemSetupRequired(): Promise<boolean> {
    return !(await hasSchools());
}
