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
    Layers,
    HardDrive,
    FileText,
    Settings,
    LogOut,
    Users,
    X,
    Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { signOut } from "next-auth/react";

const navItems = [
    { label: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
    { label: "Schools", href: "/super-admin/schools", icon: Building2 },
    { label: "Users", href: "/super-admin/users", icon: Users },
    { label: "Analytics", href: "/super-admin/analytics", icon: BarChart3 },
    { label: "Billing", href: "/super-admin/billing", icon: CreditCard },
    { label: "Plans", href: "/super-admin/plans", icon: Layers },
    { label: "Storage", href: "/super-admin/storage", icon: HardDrive },
    { label: "Audit Logs", href: "/super-admin/audit", icon: FileText },
    { label: "Settings", href: "/super-admin/settings", icon: Settings },
] as const;

export function SuperAdminSidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (href: string) => {
        if (href === "/super-admin") return pathname === "/super-admin";
        return pathname.startsWith(href);
    };

    const sidebarContent = (
        <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 flex-shrink-0">
                <div className="relative w-8 h-8 flex-shrink-0">
                    <Image src="/logo.png" alt="Sikshamitra" fill className="object-contain" priority />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">Sikshamitra</span>
                    <span className="text-[11px] text-primary font-medium">Super Admin</span>
                </div>
                {/* Mobile close */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto lg:hidden h-7 w-7 text-gray-400"
                    onClick={() => setMobileOpen(false)}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-3 px-2">
                <ul className="space-y-0.5">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                        active
                                            ? "bg-primary/10 text-primary"
                                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                    )}
                                >
                                    <Icon
                                        className={cn("flex-shrink-0", active ? "text-primary" : "text-gray-400")}
                                        style={{ width: 17, height: 17 }}
                                    />
                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Logout */}
            <div className="border-t border-gray-200 p-2 flex-shrink-0">
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                    <LogOut style={{ width: 17, height: 17 }} className="flex-shrink-0" />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile toggle button */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-3.5 left-4 z-50 lg:hidden text-gray-600 hover:bg-gray-100 h-8 w-8"
                onClick={() => setMobileOpen(true)}
            >
                <Menu className="h-5 w-5" />
            </Button>

            {/* Desktop sidebar — always visible */}
            <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200 flex-col">
                {sidebarContent}
            </aside>

            {/* Mobile sidebar — slide in */}
            {mobileOpen && (
                <>
                    <aside className="fixed left-0 top-0 z-50 h-screen w-64 bg-white border-r border-gray-200 flex flex-col lg:hidden">
                        {sidebarContent}
                    </aside>
                    <div
                        className="fixed inset-0 z-40 bg-black/30 lg:hidden"
                        onClick={() => setMobileOpen(false)}
                    />
                </>
            )}
        </>
    );
}
