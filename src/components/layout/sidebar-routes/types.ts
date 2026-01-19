import { LucideIcon } from "lucide-react";

export interface SubMenuItem {
    label: string;
    href: string;
}

export interface RouteItem {
    label: string;
    icon: LucideIcon;
    href?: string;
    submenu?: SubMenuItem[];
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
