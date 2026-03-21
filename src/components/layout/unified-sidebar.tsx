"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton } from "@/components/auth/user-button";
import { SchoolLogo } from "@/components/shared/school-logo";
import { RouteItem, SidebarConfig } from "./sidebar-routes";
import { type PlanType, planHasFeature, UPGRADE_NUDGE } from "@/lib/config/plan-features";

interface UnifiedSidebarProps {
    config: SidebarConfig;
    userPermissions?: string[];
    schoolPlan?: PlanType; // defaults to STARTER
}

function UpgradeNudge({ plan }: { plan: PlanType }) {
    const nudge = UPGRADE_NUDGE[plan];
    if (!nudge) return null; // DOMINATE — no nudge

    return (
        <div className="mx-4 mb-3 p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-[11px] font-medium text-muted-foreground mb-0.5">
                You&apos;re on {plan.charAt(0) + plan.slice(1).toLowerCase()}
            </p>
            <p className="text-[11px] text-muted-foreground/70 mb-2 leading-relaxed">
                Unlock {nudge.missing}
            </p>
            <a
                href="/admin/settings/billing"
                className="text-[11px] font-medium text-primary hover:underline"
            >
                Upgrade to {nudge.upgradesTo.charAt(0) + nudge.upgradesTo.slice(1).toLowerCase()} →
            </a>
        </div>
    );
}

export function UnifiedSidebar({ config, userPermissions, schoolPlan = "STARTER" }: UnifiedSidebarProps) {
    const { routes, portalLabel, dashboardHref, accountLabel } = config;
    const pathname = usePathname();
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

    // Filter routes based on permissions AND plan features
    const filteredRoutes = routes.filter(route => {
        // Plan feature gate — top-level route
        if (route.requiredFeature && !planHasFeature(schoolPlan, route.requiredFeature)) {
            return false;
        }
        // Permission gate
        if (!route.permissions || route.permissions.length === 0) return true;
        if (!userPermissions) return false;
        return route.permissions.some(p => userPermissions.includes(p));
    }).map(route => {
        if (!route.submenu) return route;

        const filteredSubmenu = route.submenu.filter(item => {
            // Plan feature gate — submenu item
            if (item.requiredFeature && !planHasFeature(schoolPlan, item.requiredFeature)) {
                return false;
            }
            // Permission gate
            if (!item.permissions || item.permissions.length === 0) return true;
            if (!userPermissions) return false;
            return item.permissions.some(p => userPermissions.includes(p));
        });

        if (filteredSubmenu.length === 0) return null;
        return { ...route, submenu: filteredSubmenu };
    }).filter(Boolean) as RouteItem[];

    const toggleSection = (label: string) => {
        setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const isSectionOpen = (route: RouteItem) => {
        if (!route.submenu) return false;
        if (openSections[route.label] !== undefined) return openSections[route.label];
        const basePath = route.submenu[0]?.href.split('/').slice(0, 3).join('/');
        return pathname.startsWith(basePath);
    };

    return (
        <div className="h-full border-r flex flex-col overflow-y-auto bg-card shadow-sm">
            <div className="p-4 md:p-6">
                <Link href={dashboardHref}>
                    <SchoolLogo showName={true} />
                    <p className="text-xs text-muted-foreground mt-1">{portalLabel}</p>
                </Link>
                {/* Plan pill */}
                <span className={cn(
                    "inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                    schoolPlan === 'STARTER'  && "bg-emerald-100 text-emerald-800",
                    schoolPlan === 'GROWTH'   && "bg-violet-100 text-violet-800",
                    schoolPlan === 'DOMINATE' && "bg-amber-100 text-amber-800",
                )}>
                    {schoolPlan.charAt(0) + schoolPlan.slice(1).toLowerCase()}
                </span>
            </div>

            <div className="flex flex-col w-full pb-4 flex-1">
                {filteredRoutes.map((route) => {
                    const hasSubmenu = route.submenu && route.submenu.length > 0;
                    const isOpen = isSectionOpen(route);
                    const isMainRouteActive = route.href && pathname === route.href;
                    const isSubRouteActive = route.submenu?.some(item => pathname === item.href);
                    const isRouteActive = isMainRouteActive || isSubRouteActive;

                    return (
                        <div key={route.label}>
                            {hasSubmenu ? (
                                <button
                                    onClick={() => toggleSection(route.label)}
                                    className={cn(
                                        "w-full text-sm md:text-base font-medium flex items-center justify-between py-3 px-4 md:px-6 transition-colors min-h-[44px]",
                                        isRouteActive
                                            ? "text-primary bg-primary/10"
                                            : "text-muted-foreground hover:text-primary hover:bg-accent active:bg-accent"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <route.icon className="h-5 w-5 flex-shrink-0" />
                                        <span>{route.label}</span>
                                    </div>
                                    {isOpen
                                        ? <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                        : <ChevronRight className="h-4 w-4 flex-shrink-0" />
                                    }
                                </button>
                            ) : (
                                <Link
                                    href={route.href!}
                                    className={cn(
                                        "text-sm md:text-base font-medium flex items-center py-3 px-4 md:px-6 transition-colors min-h-[44px]",
                                        isMainRouteActive
                                            ? "text-primary bg-primary/10 border-r-4 border-primary"
                                            : "text-muted-foreground hover:text-primary hover:bg-accent active:bg-accent"
                                    )}
                                >
                                    <route.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                                    <span>{route.label}</span>
                                </Link>
                            )}

                            {hasSubmenu && isOpen && (
                                <div className="ml-8 md:ml-9 border-l pl-3 my-1">
                                    {route.submenu?.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "text-xs md:text-sm flex items-center py-2.5 md:py-2 px-2 rounded transition-colors min-h-[40px]",
                                                pathname === item.href
                                                    ? "text-primary font-medium bg-primary/10"
                                                    : "text-muted-foreground hover:text-primary hover:bg-accent active:bg-accent"
                                            )}
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                <UpgradeNudge plan={schoolPlan} />
            </div>

            <div className="p-4 border-t">
                <div className="flex items-center gap-x-2">
                    <UserButton afterSignOutUrl="/login" />
                    <span className="text-xs md:text-sm font-medium">{accountLabel}</span>
                </div>
            </div>
        </div>
    );
}
