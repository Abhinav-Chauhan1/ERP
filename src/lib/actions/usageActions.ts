"use server";

import { getUsageStats as getServiceUsageStats } from "@/lib/services/usage-service";
import { requireSchoolAccess } from "@/lib/auth/tenant";

/**
 * Server action to get usage stats securely.
 * Wraps the service function which now enforces access control.
 */
export async function getUsageStats(schoolId?: string) {
    try {
        // Service layer now validates schoolId vs current context
        const stats = await getServiceUsageStats(schoolId);
        return { success: true, data: stats };
    } catch (error) {
        console.error("Error fetching usage stats:", error);
        return { success: false, error: "Failed to fetch usage statistics" };
    }
}
