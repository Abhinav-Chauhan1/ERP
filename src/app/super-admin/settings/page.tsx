import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { SystemConfiguration } from "@/components/super-admin/system/system-configuration";

export default async function SettingsPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    try {
        await requireSuperAdminAccess();
    } catch (error) {
        redirect("/");
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">System Configuration</h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Manage global platform settings, feature flags, and system configuration
                    </p>
                </div>
            </div>

            <SystemConfiguration />
        </div>
    );
}
