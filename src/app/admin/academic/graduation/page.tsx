import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { GraduationCeremonyContent } from "./graduation-ceremony-content";

export const metadata: Metadata = {
  title: "Graduation Ceremony | Admin Portal",
  description: "Mark students as graduated and manage graduation ceremonies",
};

export default async function GraduationCeremonyPage() {
  const session = await auth();

  // Check authentication
  if (!session?.user) {
    redirect("/login");
  }

  // Check authorization - only ADMIN role can access
  if (session.user.role !== UserRole.ADMIN) {
    redirect("/admin");
  }

  return <GraduationCeremonyContent userId={session.user.id} />;
}
