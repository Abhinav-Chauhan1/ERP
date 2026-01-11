import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { PromotionManagerContent } from "./promotion-manager-content";

export const metadata: Metadata = {
  title: "Student Promotion | Admin Portal",
  description: "Promote students to the next academic year",
};

export default async function PromotionManagerPage() {
  const session = await auth();

  // Check authentication
  if (!session?.user) {
    redirect("/login");
  }

  // Check authorization - only ADMIN role can access
  if (session.user.role !== UserRole.ADMIN) {
    redirect("/admin");
  }

  return <PromotionManagerContent userId={session.user.id} />;
}
