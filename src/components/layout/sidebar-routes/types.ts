import { LucideIcon } from "lucide-react";

export interface SubMenuItem {
    label: string;
    href: string;
    permissions?: string[]; // Required permissions (OR logic: user needs at least one)
}

export interface RouteItem {
    label: string;
    icon: LucideIcon;
    href?: string;
    submenu?: SubMenuItem[];
    permissions?: string[]; // Required permissions (OR logic)
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
