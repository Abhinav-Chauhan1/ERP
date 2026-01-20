"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@/components/auth/user-button";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { GlobalSearch } from "@/components/shared/global-search";
import { NotificationCenter } from "@/components/shared/notification-center";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { HeaderConfig, SidebarConfig } from "./sidebar-routes";
import { UnifiedSidebar } from "./unified-sidebar";

interface UnifiedHeaderProps {
    headerConfig: HeaderConfig;
    sidebarConfig: SidebarConfig;
    userPermissions?: string[];
}

export function UnifiedHeader({ headerConfig, sidebarConfig, userPermissions }: UnifiedHeaderProps) {
    const { dashboardHref, pageTitleMappings } = headerConfig;
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null;
    }

    // Determine the current page title based on path
    const getPageTitle = () => {
        // Check for exact match first (dashboard)
        if (pageTitleMappings[pathname]) {
            return pageTitleMappings[pathname];
        }

        // Check for prefix matches (sorted by length descending for most specific match)
        const sortedPaths = Object.keys(pageTitleMappings)
            .filter(path => path !== dashboardHref) // Exclude dashboard from prefix matching
            .sort((a, b) => b.length - a.length);

        for (const path of sortedPaths) {
            if (pathname.startsWith(path)) {
                return pageTitleMappings[path];
            }
        }

        return "Dashboard";
    };

    return (
        <div className="flex h-16 items-center border-b bg-card px-4 md:px-6 gap-2 md:gap-4">
            {/* Mobile: Menu button */}
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            aria-label="Open navigation menu"
                        >
                            <Menu className="h-5 w-5" aria-hidden="true" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-[280px] max-w-[85vw] overflow-y-auto" aria-label="Navigation menu">
                        <VisuallyHidden>
                            <SheetTitle>Navigation Menu</SheetTitle>
                        </VisuallyHidden>
                        <div className="pt-14 h-full">
                            <UnifiedSidebar config={sidebarConfig} userPermissions={userPermissions} />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Mobile: SikshaMitra branding - centered */}
            <Link href={dashboardHref} className="md:hidden flex-1 text-center" aria-label="Go to dashboard">
                <h1 className="text-lg font-bold pt-[10px]">SikshaMitra</h1>
            </Link>

            {/* Desktop: Page title */}
            <div className="hidden md:block">
                <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
            </div>

            {/* Global Search - Hidden on mobile, visible on tablet and up, centered */}
            <div className="hidden sm:flex flex-1 justify-center">
                <GlobalSearch />
            </div>

            {/* Right side: Notifications and User */}
            <div className="flex items-center gap-2">
                <NotificationCenter />
                <UserButton afterSignOutUrl="/login" />
            </div>
        </div>
    );
}
