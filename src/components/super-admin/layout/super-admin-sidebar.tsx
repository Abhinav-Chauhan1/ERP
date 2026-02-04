"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Building2,
    BarChart3,
    CreditCard,
    HardDrive,
    HeadphonesIcon,
    FileText,
    Settings,
    LogOut,
    ChevronLeft,
    Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { signOut } from "next-auth/react";

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
}

const navItems: NavItem[] = [
    { label: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
    { label: "Schools", href: "/super-admin/schools", icon: Building2 },
    { label: "Analytics", href: "/super-admin/analytics", icon: BarChart3 },
    { label: "Billing", href: "/super-admin/billing", icon: CreditCard },
    { label: "Storage", href: "/super-admin/storage", icon: HardDrive },
    { label: "Support", href: "/super-admin/support", icon: HeadphonesIcon },
    { label: "Audit Logs", href: "/super-admin/audit", icon: FileText },
    { label: "Settings", href: "/super-admin/settings", icon: Settings },
];

export function SuperAdminSidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    const isActive = (href: string) => {
        if (href === "/super-admin") {
            return pathname === "/super-admin";
        }
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Mobile Menu Toggle */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-50 lg:hidden text-white hover:bg-white/10"
                onClick={() => setCollapsed(!collapsed)}
            >
                <Menu className="h-5 w-5" />
            </Button>

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out",
                    "bg-[hsl(var(--sidebar-bg))] border-r border-[hsl(var(--sidebar-border))]",
                    collapsed ? "-translate-x-full lg:translate-x-0 lg:w-20" : "w-64",
                    "lg:translate-x-0"
                )}
            >
                <div className="flex h-full flex-col">
                    {/* Logo Section */}
                    <div className="flex items-center justify-between px-4 py-6 border-b border-[hsl(var(--sidebar-border))]">
                        <Link href="/super-admin" className="flex items-center gap-3">
                            <div className="relative w-10 h-10 flex-shrink-0">
                                <Image
                                    src="/logo.png"
                                    alt="Sikshamitra"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                            {!collapsed && (
                                <div className="flex flex-col">
                                    <span className="text-lg font-bold text-white">Sikshamitra</span>
                                    <span className="text-xs text-red-400 font-medium">Super Admin</span>
                                </div>
                            )}
                        </Link>

                        {/* Collapse Button - Desktop Only */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hidden lg:flex h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                            onClick={() => setCollapsed(!collapsed)}
                        >
                            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
                        </Button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-4 px-3">
                        <ul className="space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);

                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                                active
                                                    ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                                                    : "text-gray-400 hover:text-white hover:bg-[hsl(var(--sidebar-hover))]"
                                            )}
                                        >
                                            <Icon className={cn("h-5 w-5 flex-shrink-0", active && "text-white")} />
                                            {!collapsed && <span>{item.label}</span>}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* Footer - Logout */}
                    <div className="border-t border-[hsl(var(--sidebar-border))] p-3">
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full justify-start gap-3 text-gray-400 hover:text-white hover:bg-red-600/20",
                                collapsed && "justify-center px-0"
                            )}
                            onClick={() => signOut({ callbackUrl: "/login" })}
                        >
                            <LogOut className="h-5 w-5" />
                            {!collapsed && <span>Sign Out</span>}
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {!collapsed && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                    onClick={() => setCollapsed(true)}
                />
            )}
        </>
    );
}
