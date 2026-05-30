import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SystemConfiguration } from "@/components/super-admin/system/system-configuration";

export default async function SettingsPage() {
    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-500 mt-0.5">Global platform configuration and feature flags</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                    <SystemConfiguration />
                </Suspense>
            </div>
        </div>
    );
}
