import { Toaster } from "react-hot-toast";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";

import { StudentSidebar } from "@/components/layout/student-sidebar";
import { db } from "@/lib/db";

export default async function StudentLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/login");
  }
  
  // Get current user directly
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect("/login");
  }
  
  // Query the database directly
  const dbUser = await db.user.findUnique({
    where: {
      clerkId: clerkUser.id
    }
  });
  
  if (!dbUser || dbUser.role !== UserRole.STUDENT) {
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
