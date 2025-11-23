export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";

export default function PerformancePage() {
  redirect("/parent/performance/results");
}
