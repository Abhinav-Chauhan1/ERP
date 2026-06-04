import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { ParentLayoutClient } from "@/components/layout/parent-layout-client";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Role is already in the JWT session token — no DB call needed here
  if (session.user.role !== UserRole.PARENT) {
    redirect("/login");
  }

  return <ParentLayoutClient>{children}</ParentLayoutClient>;
}
