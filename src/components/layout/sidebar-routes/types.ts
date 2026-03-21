import { LucideIcon } from "lucide-react";
import { FeatureKey } from "@/lib/config/plan-features";

export interface SubMenuItem {
    label: string;
    href: string;
    permissions?: string[];       // OR logic: user needs at least one
    requiredFeature?: FeatureKey; // plan-gated: hidden if plan lacks this feature
}

export interface RouteItem {
    label: string;
    icon: LucideIcon;
    href?: string;
    submenu?: SubMenuItem[];
    permissions?: string[];       // OR logic
    requiredFeature?: FeatureKey; // plan-gated: hidden if plan lacks this feature
}

export interface SidebarConfig {
    routes: RouteItem[];
    portalLabel: string;
    dashboardHref: string;
    accountLabel: string;
}

export interface HeaderConfig {
    dashboardHref: string;
    pageTitleMappings: Record<string, string>;
}
