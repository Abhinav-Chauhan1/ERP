"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ColorThemeToggle } from "@/components/ui/color-theme-toggle";

import { ParentSidebar } from "./parent-sidebar";
import { getTotalUnreadCount } from "@/lib/actions/parent-communication-actions";

export function ParentHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [notifications, setNotifications] = useState<number>(0);
  const [isMounted, setIsMounted] = useState(false);

  // Fetch real notifications count from database
  const fetchNotificationsCount = async () => {
    try {
      const result = await getTotalUnreadCount();
      if (result.success && result.data) {
        setNotifications(result.data.total);
      }
    } catch (error) {
      console.error("Error fetching notifications count:", error);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchNotificationsCount();

    // Refresh notifications count every 30 seconds
    const interval = setInterval(fetchNotificationsCount, 30000);
    return () => clearInterval(interval);
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
            <ParentSidebar />
          </SheetContent>
        </Sheet>
        <Link href="/parent" className="md:hidden">
          <h1 className="text-xl font-bold">School ERP</h1>
        </Link>
      </div>

      <div className="hidden md:flex items-center space-x-4">
        <h1 className="text-xl font-semibold">
          {pathname === "/parent" && "Dashboard"}
          {pathname.startsWith("/parent/children") && "My Children"}
          {pathname.startsWith("/parent/academics") && "Academics"}
          {pathname.startsWith("/parent/performance") && "Performance"}
          {pathname.startsWith("/parent/attendance") && "Attendance"}
          {pathname.startsWith("/parent/fees") && "Fees & Payments"}
          {pathname.startsWith("/parent/communication") && "Communication"}
          {pathname.startsWith("/parent/meetings") && "Meetings"}
          {pathname.startsWith("/parent/documents") && "Documents"}
          {pathname.startsWith("/parent/events") && "Events"}
          {pathname.startsWith("/parent/settings") && "Settings"}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <ColorThemeToggle />
        <ThemeToggle />
        <Button 
          variant="outline" 
          size="icon" 
          className="relative"
          onClick={() => router.push("/parent/communication/notifications")}
        >
          <Bell className="h-5 w-5" />
          {notifications > 0 && (
            <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
              {notifications > 99 ? "99+" : notifications}
            </Badge>
          )}
        </Button>
        <UserButton afterSignOutUrl="/login" />
      </div>
    </div>
  );
}
