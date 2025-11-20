"use client";

import { Toaster } from "react-hot-toast";
import { StudentSidebar } from "@/components/layout/student-sidebar";
import { StudentHeader } from "@/components/layout/student-header";

export default function StudentLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full relative">
      <div className="hidden md:flex h-full w-72 flex-col fixed inset-y-0 z-50">
        <StudentSidebar />
      </div>
      <main className="md:pl-72 h-full">
        <StudentHeader />
        <div className="h-[calc(100%-4rem)] overflow-y-auto bg-background p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
