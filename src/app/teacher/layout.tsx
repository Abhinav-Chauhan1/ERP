"use client";

import { UnifiedSidebar } from "@/components/layout/unified-sidebar";
import { UnifiedHeader } from "@/components/layout/unified-header";
import { UserThemeWrapper } from "@/components/layout/user-theme-wrapper";
import { teacherSidebarConfig, teacherHeaderConfig } from "@/components/layout/sidebar-routes";

export default function TeacherLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <UserThemeWrapper userRole="teacher">
      <nav
        className="hidden md:flex h-full w-72 flex-col fixed inset-y-0 z-50"
        aria-label="Teacher navigation"
      >
        <UnifiedSidebar config={teacherSidebarConfig} />
      </nav>
      <div className="md:pl-72 h-full">
        <UnifiedHeader headerConfig={teacherHeaderConfig} sidebarConfig={teacherSidebarConfig} />
        <main
          id="main-content"
          className="h-[calc(100%-4rem)] overflow-y-auto bg-background p-4 md:p-6"
          tabIndex={-1}
          aria-label="Main content"
        >
          {children}
        </main>
      </div>
    </UserThemeWrapper>
  );
}
