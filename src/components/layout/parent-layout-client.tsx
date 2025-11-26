"use client";

import { ParentSidebar } from "@/components/layout/parent-sidebar";
import { ParentHeader } from "@/components/layout/parent-header";
import { UserThemeWrapper } from "@/components/layout/user-theme-wrapper";

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
        <ParentSidebar />
      </nav>
      <div className="md:pl-72 h-full">
        <ParentHeader />
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
