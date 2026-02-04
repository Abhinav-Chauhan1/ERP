"use client";

import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Activity, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

// Map paths to breadcrumb labels
const pathLabels: Record<string, string> = {
    "super-admin": "Dashboard",
    schools: "Schools",
    analytics: "Analytics",
    billing: "Billing",
    storage: "Storage",
    support: "Support",
    audit: "Audit Logs",
    settings: "Settings",
    create: "Create New",
};

export function SuperAdminHeader() {
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean);

    // Build breadcrumb items
    const breadcrumbs = segments.map((segment, index) => {
        const label = pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
        const isLast = index === segments.length - 1;

        return (
            <span key={segment} className="flex items-center">
                {index > 0 && <span className="mx-2 text-gray-600">/</span>}
                <span className={isLast ? "text-white font-medium" : "text-gray-500"}>
                    {label}
                </span>
            </span>
        );
    });

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))]">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm">
                {breadcrumbs}
            </div>

            {/* Right Side - Actions */}
            <div className="flex items-center gap-3">
                {/* System Status */}
                <Badge
                    variant="outline"
                    className="bg-green-950/50 text-green-400 border-green-800 hidden sm:flex"
                >
                    <Activity className="h-3 w-3 mr-1.5 animate-pulse" />
                    System Online
                </Badge>

                {/* Notifications */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-gray-400 hover:text-white hover:bg-white/10"
                >
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium flex items-center justify-center text-white">
                        3
                    </span>
                </Button>
            </div>
        </header>
    );
}
