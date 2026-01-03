"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@/components/auth/user-button";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ColorThemeToggle } from "@/components/ui/color-theme-toggle";
import { GlobalSearch } from "@/components/shared/global-search";
import { NotificationCenter } from "@/components/shared/notification-center";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { StudentSidebar } from "./student-sidebar";

export function StudentHeader() {
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
            <VisuallyHidden>
              <SheetTitle>Navigation Menu</SheetTitle>
            </VisuallyHidden>
            <StudentSidebar />
          </SheetContent>
        </Sheet>
        <Link href="/student" className="md:hidden" aria-label="Go to student dashboard">
          <h1 className="text-xl font-bold">School ERP</h1>
        </Link>
      </div>

      <div className="hidden md:block">
        <h1 className="text-xl font-semibold">
          {pathname === "/student" && "Dashboard"}
          {pathname.startsWith("/student/academics") && "Academics"}
          {pathname.startsWith("/student/courses") && "Courses"}
          {pathname.startsWith("/student/assessments") && "Assessments"}
          {pathname.startsWith("/student/performance") && "Performance"}
          {pathname.startsWith("/student/attendance") && "Attendance"}
          {pathname.startsWith("/student/fees") && "Fees"}
          {pathname.startsWith("/student/communication") && "Communication"}
          {pathname.startsWith("/student/documents") && "Documents"}
          {pathname.startsWith("/student/achievements") && "Achievements"}
          {pathname.startsWith("/student/events") && "Events"}
          {pathname.startsWith("/student/settings") && "Settings"}
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
