import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";

import { ParentSidebar } from "@/components/layout/parent-sidebar";
import { ParentHeader } from "@/components/layout/parent-header";
import { db } from "@/lib/db";

export default async function ParentLayout({
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
  
  if (!dbUser || dbUser.role !== UserRole.PARENT) {
    redirect("/login");
  }

  return (
    <div className="h-full relative">
      <div className="hidden md:flex h-full w-72 flex-col fixed inset-y-0 z-50">
        <ParentSidebar />
      </div>
      <main className="md:pl-72 h-full">
        <ParentHeader />
        <div className="h-[calc(100%-4rem)] overflow-y-auto bg-background">
          {children}
        </div>
      </main>
    </div>
  );
}
