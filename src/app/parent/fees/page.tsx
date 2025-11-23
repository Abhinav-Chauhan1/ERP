export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";

export default function FeesPage() {
  redirect("/parent/fees/overview");
}
