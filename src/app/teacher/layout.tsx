"use client";

import { TeacherSidebar } from "@/components/layout/teacher-sidebar";
import { TeacherHeader } from "@/components/layout/teacher-header";

export default function TeacherLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full relative">
      <div className="hidden md:flex h-full w-72 flex-col fixed inset-y-0 z-50">
        <TeacherSidebar />
      </div>
      <main className="md:pl-72 h-full">
        <TeacherHeader />
        <div className="h-[calc(100%-4rem)] overflow-y-auto bg-background p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
