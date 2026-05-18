export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isSystemSetupRequired } from "@/lib/utils/setup-check";
import { getDashboardUrl } from "@/lib/auth-utils";

export default async function Home() {
  const systemSetupRequired = await isSystemSetupRequired();
  if (systemSetupRequired) redirect("/setup");

  const session = await auth();
  if (session?.user) {
    redirect(getDashboardUrl(session.user.role));
  }

  redirect("/login");
}
