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
import { getUnreadMessageCount } from "@/lib/actions/teacher-communication-actions";

import { TeacherSidebar } from "./teacher-sidebar";

export function TeacherHeader() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isMounted, setIsMounted] = useState(false);

  // Fetch unread message count
  useEffect(() => {
    setIsMounted(true);
    
    const fetchUnreadCount = async () => {
      try {
        const result = await getUnreadMessageCount();
        if (result.success && result.data) {
          setUnreadCount(result.data.count);
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
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
            <TeacherSidebar />
          </SheetContent>
        </Sheet>
        <Link href="/teacher" className="md:hidden">
          <h1 className="text-xl font-bold">School ERP</h1>
        </Link>
      </div>

      <div className="hidden md:block">
        <h1 className="text-xl font-semibold">
          {pathname === "/teacher" && "Dashboard"}
          {pathname.startsWith("/teacher/teaching") && "Teaching"}
          {pathname.startsWith("/teacher/assessments") && "Assessments"}
          {pathname.startsWith("/teacher/attendance") && "Attendance"}
          {pathname.startsWith("/teacher/students") && "Students"}
          {pathname.startsWith("/teacher/communication") && "Communication"}
          {pathname.startsWith("/teacher/settings") && "Settings"}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <ColorThemeToggle />
        <ThemeToggle />
        <Link href="/teacher/communication/messages">
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        </Link>
        <UserButton afterSignOutUrl="/login" />
      </div>
    </div>
  );
}
