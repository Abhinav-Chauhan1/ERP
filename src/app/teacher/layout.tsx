"use client";

import { TeacherSidebar } from "@/components/layout/teacher-sidebar";
import { TeacherHeader } from "@/components/layout/teacher-header";
import { UserThemeWrapper } from "@/components/layout/user-theme-wrapper";

export default function TeacherLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <UserThemeWrapper userRole="teacher">
      <nav className="hidden md:flex h-full w-72 flex-col fixed inset-y-0 z-50">
        <TeacherSidebar />
      </nav>
      <div className="md:pl-72 h-full">
        <TeacherHeader />
        <main 
          id="main-content"
          className="h-[calc(100%-4rem)] overflow-y-auto bg-background p-4 md:p-6"
        >
          {children}
        </main>
      </div>
    </UserThemeWrapper>
  );
}
