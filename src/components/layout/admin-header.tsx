"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ColorThemeToggle } from "@/components/ui/color-theme-toggle";
import { GlobalSearch } from "@/components/shared/global-search";
import { NotificationCenter } from "@/components/shared/notification-center";

import { AdminSidebar } from "./admin-sidebar";

export function AdminHeader() {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex h-16 items-center justify-between border-b bg-card px-6 gap-4">
      <div className="flex items-center gap-2 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0" aria-label="Navigation menu">
            <AdminSidebar />
          </SheetContent>
        </Sheet>
        <Link href="/admin" className="md:hidden" aria-label="Go to admin dashboard">
          <h1 className="text-xl font-bold">School ERP</h1>
        </Link>
      </div>

      <div className="hidden md:block">
        <h1 className="text-xl font-semibold">
          {pathname === "/admin" && "Dashboard"}
          {pathname.startsWith("/admin/users") && "Users"}
          {pathname.startsWith("/admin/academic") && "Academic"}
          {pathname.startsWith("/admin/classes") && "Classes"}
          {pathname.startsWith("/admin/teaching") && "Teaching"}
          {pathname.startsWith("/admin/assessment") && "Assessment"}
          {pathname.startsWith("/admin/attendance") && "Attendance"}
          {pathname.startsWith("/admin/finance") && "Finance"}
          {pathname.startsWith("/admin/communication") && "Communication"}
          {pathname.startsWith("/admin/events") && "Events"}
          {pathname.startsWith("/admin/documents") && "Documents"}
          {pathname.startsWith("/admin/reports") && "Reports"}
          {pathname.startsWith("/admin/settings") && "Settings"}
        </h1>
      </div>

      {/* Global Search - Hidden on mobile, visible on tablet and up */}
      <div className="hidden sm:block flex-1 max-w-md mx-4">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2">
        <ColorThemeToggle />
        <ThemeToggle />
        <NotificationCenter />
        <UserButton afterSignOutUrl="/login" />
      </div>
    </div>
  );
}
