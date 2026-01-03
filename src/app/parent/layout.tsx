import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

import { ParentLayoutClient } from "@/components/layout/parent-layout-client";
import { db } from "@/lib/db";

export default async function ParentLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }
  
  // Query the database directly
  const dbUser = await db.user.findUnique({
    where: {
      id: session.user.id
    }
  });
  
  if (!dbUser || dbUser.role !== UserRole.PARENT) {
    redirect("/login");
  }

  return <ParentLayoutClient>{children}</ParentLayoutClient>;
}
