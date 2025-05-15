import { Toaster } from "react-hot-toast";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { StudentSidebar } from "@/components/layout/student-sidebar";
import { getUserRole } from "@/lib/auth";

export default async function StudentLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/login");
  }
  
  // Verify user is a student
  const role = await getUserRole();
  if (role !== "STUDENT") {
    // Redirect to appropriate dashboard based on role
    if (role === "ADMIN") redirect("/admin");
    if (role === "TEACHER") redirect("/teacher");
    if (role === "PARENT") redirect("/parent");
    redirect("/login");
  }

  return (
    <div className="h-full relative">
      <div className="hidden md:flex h-full w-72 flex-col fixed inset-y-0 z-50">
        <StudentSidebar />
      </div>
      <main className="md:pl-72 h-full">
        <div className="h-full overflow-y-auto bg-gray-50">
          {children}
        </div>
      </main>
      <Toaster position="top-center" />
    </div>
  );
}
