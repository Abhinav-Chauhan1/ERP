import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";

import { ParentLayoutClient } from "@/components/layout/parent-layout-client";
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

  return <ParentLayoutClient>{children}</ParentLayoutClient>;
}
