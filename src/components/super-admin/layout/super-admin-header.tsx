"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SuperAdminHeader() {
    return (
        <header className="sticky top-0 z-30 flex items-center justify-end px-6 h-14 bg-white border-b border-gray-200">
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
