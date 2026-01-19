"use client";

import { UnifiedSidebar } from "@/components/layout/unified-sidebar";
import { UnifiedHeader } from "@/components/layout/unified-header";
import { UserThemeWrapper } from "@/components/layout/user-theme-wrapper";
import { parentSidebarConfig, parentHeaderConfig } from "@/components/layout/sidebar-routes";

export function ParentLayoutClient({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <UserThemeWrapper userRole="parent">
      <nav
        className="hidden md:flex h-full w-72 flex-col fixed inset-y-0 z-50"
        aria-label="Parent navigation"
      >
        <UnifiedSidebar config={parentSidebarConfig} />
      </nav>
      <div className="md:pl-72 h-full">
        <UnifiedHeader headerConfig={parentHeaderConfig} sidebarConfig={parentSidebarConfig} />
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
