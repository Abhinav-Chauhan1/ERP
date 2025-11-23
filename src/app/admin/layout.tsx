"use client";

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminHeader } from "@/components/layout/admin-header";

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full relative">
      <nav 
        className="hidden md:flex h-full w-72 flex-col fixed inset-y-0 z-50"
        aria-label="Admin navigation"
      >
        <AdminSidebar />
      </nav>
      <div className="md:pl-72 h-full">
        <AdminHeader />
        <main 
          id="main-content"
          className="h-[calc(100%-4rem)] overflow-y-auto bg-background p-4 md:p-6"
          tabIndex={-1}
          aria-label="Main content"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
