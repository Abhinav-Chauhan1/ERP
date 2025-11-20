"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ColorThemeToggle } from "@/components/ui/color-theme-toggle";

import { AdminSidebar } from "./admin-sidebar";

export function AdminHeader() {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<number>(0);
  const [isMounted, setIsMounted] = useState(false);

  // Simulate fetching notifications count
  useEffect(() => {
    setIsMounted(true);
    // This would be replaced with an actual API call
    setNotifications(5);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-2 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <AdminSidebar />
          </SheetContent>
        </Sheet>
        <Link href="/admin" className="md:hidden">
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

      <div className="flex items-center gap-2">
        <ColorThemeToggle />
        <ThemeToggle />
        <Link href="/admin/communication/notifications">
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {notifications > 0 && (
              <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
                {notifications}
              </Badge>
            )}
          </Button>
        </Link>
        <UserButton afterSignOutUrl="/login" />
      </div>
    </div>
  );
}
