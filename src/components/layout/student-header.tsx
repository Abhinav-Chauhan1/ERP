"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@/components/auth/user-button";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
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
    <div className="flex h-16 items-center border-b bg-card px-4 md:px-6 gap-2 md:gap-4">
      {/* Mobile: Menu button */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px] max-w-[85vw] overflow-y-auto" aria-label="Navigation menu">
            <VisuallyHidden>
              <SheetTitle>Navigation Menu</SheetTitle>
            </VisuallyHidden>
            <div className="pt-14 h-full">
              <StudentSidebar />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Mobile: SikshaMitra branding - centered */}
      <Link href="/student" className="md:hidden flex-1 text-center" aria-label="Go to student dashboard">
        <h1 className="text-lg font-bold pt-[10px]">SikshaMitra</h1>
      </Link>

      {/* Desktop: Page title */}
      <div className="hidden md:block flex-1">
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
      <div className="hidden sm:block max-w-md">
        <GlobalSearch />
      </div>

      {/* Right side: Notifications and User */}
      <div className="flex items-center gap-2">
        <NotificationCenter />
        <UserButton afterSignOutUrl="/login" />
      </div>
    </div>
  );
}
