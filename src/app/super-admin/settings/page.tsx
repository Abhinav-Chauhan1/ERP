import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings } from "lucide-react";
import { SystemConfiguration } from "@/components/super-admin/system/system-configuration";

export default async function SettingsPage() {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Settings className="h-6 w-6 text-red-500" />
                    System Settings
                </h1>
                <p className="text-gray-400 mt-1">Manage global platform settings and system configuration</p>
            </div>

            {/* System Configuration */}
            <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
                <CardHeader>
                    <CardTitle className="text-white">Platform Configuration</CardTitle>
                    <CardDescription className="text-gray-400">
                        Configure global settings, feature flags, and system preferences
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                        <SystemConfiguration />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}
