"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const pathLabels: Record<string, string> = {
    "super-admin": "Dashboard",
    schools: "Schools",
    create: "Create School",
    analytics: "Analytics",
    billing: "Billing",
    plans: "Plans",
    storage: "Storage",
    audit: "Audit Logs",
    settings: "Settings",
    users: "Users",
};

export function SuperAdminHeader() {
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean);

    const currentLabel = (() => {
        const last = segments[segments.length - 1];
        if (pathLabels[last]) return pathLabels[last];
        // If it's a UUID-like segment (school ID), label as "School Detail"
        if (last && last.length > 20) return "School Detail";
        return last ? last.charAt(0).toUpperCase() + last.slice(1) : "Dashboard";
    })();

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 h-14 bg-white border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">{currentLabel}</h2>
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                >
                    <Bell className="h-4 w-4" />
                </Button>
            </div>
        </header>
    );
}
