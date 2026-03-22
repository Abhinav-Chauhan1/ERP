import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

/**
 * Payroll layout — ADMIN only.
 * Payroll contains salary data and must never be accessible to teachers, students, or parents.
 */
export default async function PayrollLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/admin");
  }

  return <>{children}</>;
}
