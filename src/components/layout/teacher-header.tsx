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
import { SchoolLogo } from "@/components/shared/school-logo";

import { TeacherSidebar } from "./teacher-sidebar";

export function TeacherHeader() {
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
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <TeacherSidebar />
          </SheetContent>
        </Sheet>
        <Link href="/teacher" className="md:hidden">
          <SchoolLogo showName={true} />
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
